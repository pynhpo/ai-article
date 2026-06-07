import { useState, useCallback, useRef } from "react";
import type {
  ArticleResult,
  ArticleSectionName,
} from "../pages/Home/types";
import { ALL_SECTIONS, TOTAL_SECTIONS } from "../pages/Home/types";

const MAX_ROUGH_NOTES_WORDS = 50_000;

interface UseArticleGenerationReturn {
  /** Aggregated article result with all completed sections */
  article: ArticleResult;
  /** Set of section names that have been completed */
  completedSections: Set<ArticleSectionName>;
  /** Whether the SSE stream is currently active */
  isGenerating: boolean;
  /** Whether all sections have been received and stream is done */
  isComplete: boolean;
  /** Error message, if any */
  error: string | null;
  /** Progress percentage (0–100) */
  progress: number;
  /** Start generating the article from rough notes */
  generate: (roughNotes: string) => void;
  /** Reset all state */
  reset: () => void;
}

const EMPTY_ARTICLE: ArticleResult = {
  intro: null,
  mainBody: null,
  bestFor: null,
  ethics: null,
  keyFacts: null,
};

export function useArticleGeneration(): UseArticleGenerationReturn {
  const [article, setArticle] = useState<ArticleResult>(EMPTY_ARTICLE);
  const [completedSections, setCompletedSections] = useState<
    Set<ArticleSectionName>
  >(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setArticle(EMPTY_ARTICLE);
    setCompletedSections(new Set());
    setIsGenerating(false);
    setIsComplete(false);
    setError(null);
    setProgress(0);
  }, []);

  const generate = useCallback((roughNotes: string) => {
    // Client-side word count validation
    const wordCount =
      roughNotes.trim() === "" ? 0 : roughNotes.trim().split(/\s+/).length;
    if (wordCount > MAX_ROUGH_NOTES_WORDS) {
      setError(
        `Text exceeds the ${MAX_ROUGH_NOTES_WORDS.toLocaleString()} word limit (current: ${wordCount.toLocaleString()} words). Please shorten your notes.`,
      );
      return;
    }

    // Reset state for new generation
    setArticle(EMPTY_ARTICLE);
    setCompletedSections(new Set());
    setIsGenerating(true);
    setIsComplete(false);
    setError(null);
    setProgress(0);

    const abortController = new AbortController();
    abortRef.current = abortController;

    // Use fetch for SSE since axios doesn't support streaming
    fetch("/api/ai/llm/travel-article", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ roughNotes }),
      signal: abortController.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const message =
            errorData?.message ||
            (Array.isArray(errorData?.message)
              ? errorData.message.join(", ")
              : null) ||
            `Server error: ${response.status}`;
          throw new Error(message);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream available");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from the buffer
          const lines = buffer.split("\n");
          buffer = "";

          let currentEventType = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEventType = line.slice("event: ".length).trim();
            } else if (line.startsWith("data: ")) {
              const dataStr = line.slice("data: ".length);

              if (currentEventType === "complete") {
                setIsComplete(true);
                setIsGenerating(false);
                setProgress(100);
                return;
              }

              if (currentEventType === "error") {
                try {
                  const errorData = JSON.parse(dataStr) as { message: string };
                  setError(errorData.message);
                } catch {
                  setError(dataStr);
                }
                // Don't stop — other sections might still arrive
                continue;
              }

              // Parse section data
              if (
                ALL_SECTIONS.includes(currentEventType as ArticleSectionName)
              ) {
                try {
                  const sectionName = currentEventType as ArticleSectionName;
                  const parsed = JSON.parse(dataStr);

                  setArticle((prev) => ({ ...prev, [sectionName]: parsed }));
                  setCompletedSections((prev) => {
                    const next = new Set(prev);
                    next.add(sectionName);
                    const newProgress = Math.round(
                      (next.size / TOTAL_SECTIONS) * 100,
                    );
                    setProgress(newProgress);
                    return next;
                  });
                } catch (parseErr) {
                  console.error(
                    `Failed to parse section "${currentEventType}":`,
                    parseErr,
                  );
                }
              }

              currentEventType = "";
            } else if (line === "") {
              // Empty line = end of event — reset
              currentEventType = "";
            } else {
              // Incomplete line — push back to buffer
              buffer += line + "\n";
            }
          }
        }

        // Stream ended without explicit "complete" event
        setIsGenerating(false);
        setIsComplete(true);
        setProgress(100);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during article generation.";
        setError(message);
        setIsGenerating(false);
      });
  }, []);

  return {
    article,
    completedSections,
    isGenerating,
    isComplete,
    error,
    progress,
    generate,
    reset,
  };
}
