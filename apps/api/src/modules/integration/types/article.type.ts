/** A single content block with its source attribution from the original notes */
export interface SourcedContent {
  content: string;
  sourceExcerpt: string;
}

export interface ArticleIntro {
  hook: string;
  sourceExcerpt: string;
}

export interface ArticleSection {
  title: string;
  body: string;
  sourceExcerpt: string;
}

export interface ArticleMainBody {
  sections: ArticleSection[];
}

export interface ArticleBestFor {
  bestFor: SourcedContent[];
  notFor: SourcedContent[];
}

export interface ArticleEthics {
  notes: SourcedContent[];
}

export interface KeyFact {
  label: string;
  value: string;
  sourceExcerpt: string;
}

export interface ArticleKeyFacts {
  facts: KeyFact[];
}

export type ArticleSectionName =
  | 'intro'
  | 'mainBody'
  | 'bestFor'
  | 'ethics'
  | 'keyFacts';

export type ArticleSectionData =
  | ArticleIntro
  | ArticleMainBody
  | ArticleBestFor
  | ArticleEthics
  | ArticleKeyFacts;

export interface ArticleSseEvent {
  section: ArticleSectionName | 'complete' | 'error';
  data: ArticleSectionData | { message: string } | null;
}

/**
 * JSON schemas for structured LLM output — one per article section.
 * Each schema enforces sourceExcerpt fields for traceability.
 */
export const ARTICLE_JSON_SCHEMAS: Record<
  ArticleSectionName,
  { name: string; schema: object }
> = {
  intro: {
    name: 'article_intro',
    schema: {
      type: 'object',
      properties: {
        hook: { type: 'string' },
        sourceExcerpt: { type: 'string' },
      },
      required: ['hook', 'sourceExcerpt'],
      additionalProperties: false,
    },
  },
  mainBody: {
    name: 'article_main_body',
    schema: {
      type: 'object',
      properties: {
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              body: { type: 'string' },
              sourceExcerpt: { type: 'string' },
            },
            required: ['title', 'body', 'sourceExcerpt'],
            additionalProperties: false,
          },
        },
      },
      required: ['sections'],
      additionalProperties: false,
    },
  },
  bestFor: {
    name: 'article_best_for',
    schema: {
      type: 'object',
      properties: {
        bestFor: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              sourceExcerpt: { type: 'string' },
            },
            required: ['content', 'sourceExcerpt'],
            additionalProperties: false,
          },
        },
        notFor: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              sourceExcerpt: { type: 'string' },
            },
            required: ['content', 'sourceExcerpt'],
            additionalProperties: false,
          },
        },
      },
      required: ['bestFor', 'notFor'],
      additionalProperties: false,
    },
  },
  ethics: {
    name: 'article_ethics',
    schema: {
      type: 'object',
      properties: {
        notes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              sourceExcerpt: { type: 'string' },
            },
            required: ['content', 'sourceExcerpt'],
            additionalProperties: false,
          },
        },
      },
      required: ['notes'],
      additionalProperties: false,
    },
  },
  keyFacts: {
    name: 'article_key_facts',
    schema: {
      type: 'object',
      properties: {
        facts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              value: { type: 'string' },
              sourceExcerpt: { type: 'string' },
            },
            required: ['label', 'value', 'sourceExcerpt'],
            additionalProperties: false,
          },
        },
      },
      required: ['facts'],
      additionalProperties: false,
    },
  },
};
