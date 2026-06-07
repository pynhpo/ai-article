import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ChatMessage } from '../types/llm.type';

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

    const data = (await response.json()) as {
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
    };
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
}
