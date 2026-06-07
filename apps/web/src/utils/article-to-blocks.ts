import type { Block } from "@blocknote/core";
import type { ArticleResult } from "@/pages/Home/types";

/**
 * Convert the 5-section ArticleResult into BlockNote block format.
 * This is the initial content when a user opens the editor for the first time.
 */
export function articleToBlocks(article: ArticleResult): Block[] {
  const blocks: Block[] = [];

  // ─── Intro / Hook ───────────────────────────────────────
  if (article.intro) {
    blocks.push(
      createHeading("Introduction", 1),
      createParagraph(article.intro.hook),
      createParagraph(""), // spacer
    );
  }

  // ─── Main Body Sections ─────────────────────────────────
  if (article.mainBody?.sections?.length) {
    blocks.push(createHeading("Main Article", 1));

    for (const section of article.mainBody.sections) {
      blocks.push(
        createHeading(section.title, 2),
        createParagraph(section.body),
      );
    }

    blocks.push(createParagraph("")); // spacer
  }

  // ─── Best For / Not For ─────────────────────────────────
  if (article.bestFor) {
    blocks.push(createHeading("Best For", 1));

    if (article.bestFor.bestFor?.length) {
      blocks.push(createHeading("Ideal For", 2));
      for (const item of article.bestFor.bestFor) {
        blocks.push(createBulletItem(item.content));
      }
    }

    if (article.bestFor.notFor?.length) {
      blocks.push(createHeading("Not Ideal For", 2));
      for (const item of article.bestFor.notFor) {
        blocks.push(createBulletItem(item.content));
      }
    }

    blocks.push(createParagraph("")); // spacer
  }

  // ─── Ethics & Safety ───────────────────────────────────
  if (article.ethics?.notes?.length) {
    blocks.push(createHeading("Ethics & Safety Notes", 1));

    for (const note of article.ethics.notes) {
      blocks.push(createBulletItem(note.content));
    }

    blocks.push(createParagraph("")); // spacer
  }

  // ─── Key Facts ──────────────────────────────────────────
  if (article.keyFacts?.facts?.length) {
    blocks.push(createHeading("Key Facts", 1));

    for (const fact of article.keyFacts.facts) {
      blocks.push(createBulletItem(`${fact.label}: ${fact.value}`));
    }
  }

  return blocks;
}

// ─── Block Factory Helpers ──────────────────────────────────

function createHeading(text: string, level: 1 | 2 | 3): Block {
  return {
    type: "heading",
    props: { level },
    content: [{ type: "text", text, styles: {} }],
    children: [],
  } as unknown as Block;
}

function createParagraph(text: string): Block {
  return {
    type: "paragraph",
    props: {},
    content: text ? [{ type: "text", text, styles: {} }] : [],
    children: [],
  } as unknown as Block;
}

function createBulletItem(text: string): Block {
  return {
    type: "bulletListItem",
    props: {},
    content: [{ type: "text", text, styles: {} }],
    children: [],
  } as unknown as Block;
}
