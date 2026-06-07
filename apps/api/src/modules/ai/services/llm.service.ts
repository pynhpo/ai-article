import { Injectable, Logger, Inject } from '@nestjs/common';
import { Observable, Subscriber } from 'rxjs';

import { type Database } from '../../database/database.module';
import { LlmService } from '../../integration/services/llm.service';
import {
  type ArticleSseEvent,
  type ArticleSectionName,
  type ArticleSectionData,
  type ArticleIntro,
  type ArticleMainBody,
  type ArticleBestFor,
  type ArticleEthics,
  type ArticleKeyFacts,
  ARTICLE_JSON_SCHEMAS,
} from '../../integration/types/article.type';

const TRAVEL_ARTICLE_MODEL = 'seed-2-0-pro-260328';

const SYSTEM_PROMPT_PREFIX = `You are a world-class travel magazine editor. You will receive rough, unstructured notes about a travel experience. Your job is to transform these notes into polished, magazine-quality content.

IMPORTANT RULES:
- Every piece of content you generate MUST include a "sourceExcerpt" field containing the exact excerpt from the original notes that you used as the basis for that content.
- If you synthesize from multiple parts, quote the most relevant excerpt.
- Do NOT fabricate information that isn't in the notes.
- Write in an engaging, vivid, editorial tone suitable for a premium travel magazine.

Here are the rough travel notes:

`;

/** Section-specific prompts sent as follow-up user messages */
const SECTION_PROMPTS: Record<ArticleSectionName, string> = {
  intro: `Based on the travel notes provided in the system context, write a compelling short intro / hook paragraph for this travel article. The hook should grab the reader's attention and set the tone for the entire piece. Include the "sourceExcerpt" field with the part of the original notes you drew from.`,

  mainBody: `Based on the travel notes provided in the system context, write the main article body divided into logical sections. Each section should have a descriptive title, a well-written body paragraph, and the "sourceExcerpt" from the original notes. Cover all the key experiences and details mentioned in the notes.`,

  bestFor: `Based on the travel notes provided in the system context, determine who this travel experience is "Best for" and "Not for". For each entry, provide a short description of the traveler type and the "sourceExcerpt" from the original notes that supports this assessment.`,

  ethics: `Based on the travel notes provided in the system context, identify any ethics or safety notes relevant to this travel experience. Consider environmental impact, cultural sensitivity, physical safety, health precautions, or responsible tourism practices. For each note, include the "sourceExcerpt" from the original notes. If there are no ethics/safety concerns evident in the notes, return an empty notes array.`,

  keyFacts: `Based on the travel notes provided in the system context, extract all key facts such as price ranges, duration, best season, location details, booking information, or any other factual data points. Each fact should have a descriptive label, the value, and the "sourceExcerpt" from the original notes where this fact was mentioned.`,
};

/** Prompt to validate input quality before generating article sections */
const VALIDATION_PROMPT = `Evaluate whether the travel notes provided in the system context are suitable for generating a travel magazine article.

Reject the input if ANY of the following apply:
- The text is too short (fewer than 50 words of meaningful content)
- The text is gibberish, random characters, or meaningless filler
- The text has no relation to travel, places, or experiences
- The text contains only repetitive or spam-like content

Respond with ONLY valid JSON (no markdown, no code fences):
{"valid": true} if the input is acceptable
{"valid": false, "reason": "<short user-facing explanation of why the input was rejected>"} if rejected.

Be lenient with informal or rough writing — real travel notes are often messy. Only reject clearly invalid inputs.`;
@Injectable()
export class AILlmService {
  private readonly logger = new Logger(AILlmService.name);

  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: Database,
    private readonly llmService: LlmService,
  ) {}

  /**
   * Convert rough travel notes into a structured magazine article.
   * Uses prefix caching so the notes are sent once, then 5 parallel section
   * requests reuse the cached context. Results stream back via SSE as they complete.
   */
  generateTravelArticle(roughNotes: string): Observable<ArticleSseEvent> {
    return new Observable<ArticleSseEvent>((subscriber) => {
      this.processTravelArticle(roughNotes, subscriber).catch((err) => {
        this.logger.error('Fatal error in travel article generation', err);
        subscriber.next({
          section: 'error',
          data: { message: err instanceof Error ? err.message : String(err) },
        });
        subscriber.complete();
      });
    });
  }

  private async processTravelArticle(
    roughNotes: string,
    subscriber: Subscriber<ArticleSseEvent>,
  ): Promise<void> {
    // Step 1: Create prefix cache with system prompt + rough notes
    const systemContent = SYSTEM_PROMPT_PREFIX + roughNotes;

    this.logger.log('Creating prefix cache for travel article...');
    const previousResponseId = await this.llmService.createPrefixCache(
      systemContent,
      { model: TRAVEL_ARTICLE_MODEL },
    );
    this.logger.log(`Prefix cache created: ${previousResponseId}`);

    // Step 1.5: Validate input quality before generating sections
    const isValid = await this.validateInput(previousResponseId);
    if (!isValid.valid) {
      subscriber.next({
        section: 'error',
        data: { message: isValid.reason },
      });
      subscriber.complete();
      return;
    }
    this.logger.log('Input validation passed');

    // Step 2: Fire all section requests in parallel
    const sectionNames: ArticleSectionName[] = [
      'intro',
      'mainBody',
      'bestFor',
      'ethics',
      'keyFacts',
    ];

    const sectionPromises = sectionNames.map((sectionName) =>
      this.generateSection(sectionName, previousResponseId)
        .then((data) => {
          // Emit immediately as each section completes (first-come-first-served)
          subscriber.next({ section: sectionName, data });
          this.logger.log(`Section "${sectionName}" completed and sent`);
        })
        .catch((err) => {
          this.logger.error(`Section "${sectionName}" failed`, err);
          subscriber.next({
            section: 'error',
            data: {
              message: `Section "${sectionName}" failed: ${err instanceof Error ? err.message : String(err)}`,
            },
          });
        }),
    );

    // Step 3: Wait for all sections to settle, then complete the stream
    await Promise.allSettled(sectionPromises);

    subscriber.next({ section: 'complete', data: null });
    subscriber.complete();
  }

  /**
   * Validate the cached input to ensure it contains meaningful travel notes.
   * Uses the prefix cache to avoid re-sending the full text.
   */
  private async validateInput(
    previousResponseId: string,
  ): Promise<{ valid: boolean; reason: string }> {
    try {
      // Reuse the structured section endpoint but cast the result since
      // the validation schema differs from article section schemas
      const raw = await this.llmService.generateStructuredSection<ArticleIntro>(
        VALIDATION_PROMPT,
        previousResponseId,
        {
          name: 'input_validation',
          schema: {
            type: 'object',
            properties: {
              valid: { type: 'boolean' },
              reason: { type: 'string' },
            },
            required: ['valid'],
          },
        },
        { model: TRAVEL_ARTICLE_MODEL },
      );

      const result = raw as unknown as { valid: boolean; reason?: string };

      return {
        valid: result.valid,
        reason: result.reason ?? 'Input validation failed.',
      };
    } catch (err) {
      this.logger.warn('Input validation call failed, allowing through', err);
      // If validation itself fails, don't block the user
      return { valid: true, reason: '' };
    }
  }

  private async generateSection(
    sectionName: ArticleSectionName,
    previousResponseId: string,
  ): Promise<ArticleSectionData> {
    const prompt = SECTION_PROMPTS[sectionName];
    const jsonSchema = ARTICLE_JSON_SCHEMAS[sectionName];

    this.logger.log(`Generating section: ${sectionName}`);

    switch (sectionName) {
      case 'intro':
        return this.llmService.generateStructuredSection<ArticleIntro>(
          prompt,
          previousResponseId,
          jsonSchema,
          { model: TRAVEL_ARTICLE_MODEL },
        );
      case 'mainBody':
        return this.llmService.generateStructuredSection<ArticleMainBody>(
          prompt,
          previousResponseId,
          jsonSchema,
          { model: TRAVEL_ARTICLE_MODEL },
        );
      case 'bestFor':
        return this.llmService.generateStructuredSection<ArticleBestFor>(
          prompt,
          previousResponseId,
          jsonSchema,
          { model: TRAVEL_ARTICLE_MODEL },
        );
      case 'ethics':
        return this.llmService.generateStructuredSection<ArticleEthics>(
          prompt,
          previousResponseId,
          jsonSchema,
          { model: TRAVEL_ARTICLE_MODEL },
        );
      case 'keyFacts':
        return this.llmService.generateStructuredSection<ArticleKeyFacts>(
          prompt,
          previousResponseId,
          jsonSchema,
          { model: TRAVEL_ARTICLE_MODEL },
        );
      default: {
        const _exhaustiveCheck: string = sectionName;
        throw new Error(`Unknown section: ${_exhaustiveCheck}`);
      }
    }
  }
}
