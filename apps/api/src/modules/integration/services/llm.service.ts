import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ChatMessage } from '../types/llm.type';
import type { ArticleSectionData } from '../types/article.type';
import { parseJsonFromCompletion } from '../../../utils/string';

/** Shape of the BytePlus Responses API result */
interface BytePlusResponseResult {
  id: string;
  output_text: string;
  output: Array<{
    type: string;
    content: Array<{
      text: string;
    }>;
  }>;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateChatCompletion(
    messages: ChatMessage[],
    options: {
      model?: string;
      isThinkingEnabled?: boolean;
      reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high';
    } = {},
  ): Promise<string> {
    const { model, isThinkingEnabled = true, reasoningEffort } = options;
    const apiKey = this.configService.get<string>('BYTEPLUS_API_KEY');
    const baseURL = this.configService.get<string>('BYTEPLUS_BASE_URL');
    const fetchModel =
      model || this.configService.get<string>('BYTEPLUS_CHAT_MODEL');

    if (!apiKey || !baseURL || !fetchModel)
      throw new Error('BYTEPLUS configs is missing');

    const response = await fetch(`${baseURL}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: fetchModel,
        input: messages.map((m) => ({ role: m.role, content: m.content })),
        thinking: { type: isThinkingEnabled ? 'enabled' : 'disabled' },
        ...(reasoningEffort ? { reasoning: { effort: reasoningEffort } } : {}),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `AI API request failed: ${response.status} - ${errorText}`,
      );
    }

    const data = (await response.json()) as BytePlusResponseResult;
    let text = data.output_text;

    if (!text && Array.isArray(data.output)) {
      const messageOutput = data.output.find((o) => o.type === 'message');
      if (messageOutput && Array.isArray(messageOutput.content)) {
        text = messageOutput.content[0]?.text;
      } else if (data.output[0]?.content?.[0]?.text) {
        text = data.output[0].content[0].text;
      }
    }

    if (!text && data.choices?.[0]?.message?.content) {
      text = data.choices[0].message.content;
    }

    if (!text) throw new Error('No text returned from AI response');
    return text;
  }

  /**
   * Create a prefix cache with the system prompt + rough notes.
   * The cached context can be reused by follow-up calls via `previous_response_id`.
   *
   * Restrictions:
   * - Input tokens must be ≥256 tokens
   * - `stream` must NOT be `true`
   *
   * @returns The response `id` to use as `previous_response_id` in follow-up calls.
   */
  async createPrefixCache(
    systemContent: string,
    options: { model: string },
  ): Promise<string> {
    const apiKey = this.configService.get<string>('BYTEPLUS_API_KEY');
    const baseURL = this.configService.get<string>('BYTEPLUS_BASE_URL');

    if (!apiKey || !baseURL) throw new Error('BYTEPLUS configs is missing');

    this.logger.log('Creating prefix cache for travel article...');

    const response = await fetch(`${baseURL}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        input: [
          {
            role: 'system',
            content: systemContent,
          },
        ],
        expire_at: Math.floor(Date.now() / 1000) + 3500, //around 1 hour from now
        caching: {
          type: 'enabled',
          prefix: true,
        },
        thinking: {
          type: 'disabled',
        },
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Prefix cache creation failed: ${response.status} - ${errorText}`,
      );
    }

    const data = (await response.json()) as BytePlusResponseResult;
    this.logger.log(`Prefix cache created with response id: ${data.id}`);
    return data.id;
  }

  /**
   * Generate a structured article section using a previously cached prefix.
   *
   * NOTE: BytePlus API does not allow `text.format.json_schema` when
   * `previous_response_id` references a cached response, so we embed
   * the JSON schema in the prompt itself and parse the raw text output.
   *
   * @param userPrompt - The section-specific instruction for the LLM
   * @param previousResponseId - The `id` returned from `createPrefixCache()`
   * @param jsonSchema - The JSON schema definition (embedded in prompt)
   * @param options - Model configuration
   * @returns Parsed section data matching the provided JSON schema
   */
  async generateStructuredSection<T extends ArticleSectionData>(
    userPrompt: string,
    previousResponseId: string,
    jsonSchema: { name: string; schema: object },
    options: { model: string },
  ): Promise<T> {
    const apiKey = this.configService.get<string>('BYTEPLUS_API_KEY');
    const baseURL = this.configService.get<string>('BYTEPLUS_BASE_URL');

    if (!apiKey || !baseURL) throw new Error('BYTEPLUS configs is missing');

    const promptWithSchema = `${userPrompt}

You MUST respond with ONLY valid JSON (no markdown, no code fences, no extra text).
The JSON must conform to this schema:
${JSON.stringify(jsonSchema.schema, null, 2)}`;

    const response = await fetch(`${baseURL}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: promptWithSchema,
              },
            ],
          },
        ],
        previous_response_id: previousResponseId,
        thinking: {
          type: 'disabled',
        },
        stream: false,
        text: {
          format: {
            type: 'json_object',
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Structured section generation failed: ${response.status} - ${errorText}`,
      );
    }

    const data = (await response.json()) as BytePlusResponseResult;
    let text = data.output_text;

    if (!text && Array.isArray(data.output)) {
      const messageOutput = data.output.find((o) => o.type === 'message');
      if (messageOutput && Array.isArray(messageOutput.content)) {
        text = messageOutput.content[0]?.text;
      } else if (data.output[0]?.content?.[0]?.text) {
        text = data.output[0].content[0].text;
      }
    }

    if (!text && data.choices?.[0]?.message?.content) {
      text = data.choices[0].message.content;
    }

    if (!text)
      throw new Error('No structured output returned from AI response');

    return parseJsonFromCompletion(text) as T;
  }
}
