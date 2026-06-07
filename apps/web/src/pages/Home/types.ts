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
  | "intro"
  | "mainBody"
  | "bestFor"
  | "ethics"
  | "keyFacts";

export type ArticleSectionData =
  | ArticleIntro
  | ArticleMainBody
  | ArticleBestFor
  | ArticleEthics
  | ArticleKeyFacts;

/** Full article result aggregated from all SSE events */
export interface ArticleResult {
  intro: ArticleIntro | null;
  mainBody: ArticleMainBody | null;
  bestFor: ArticleBestFor | null;
  ethics: ArticleEthics | null;
  keyFacts: ArticleKeyFacts | null;
}

export const SECTION_LABELS: Record<ArticleSectionName, string> = {
  intro: "Intro / Hook",
  mainBody: "Main Article",
  bestFor: "Best For / Not For",
  ethics: "Ethics & Safety",
  keyFacts: "Key Facts",
};

export const ALL_SECTIONS: ArticleSectionName[] = [
  "intro",
  "mainBody",
  "bestFor",
  "ethics",
  "keyFacts",
];

export const TOTAL_SECTIONS = ALL_SECTIONS.length;
