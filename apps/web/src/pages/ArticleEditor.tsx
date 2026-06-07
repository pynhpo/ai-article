import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArticleEditor } from "@/components/article-editor";
import { api } from "@/utils/api";
import { articleToBlocks } from "@/utils/article-to-blocks";
import type { Block } from "@blocknote/core";
import type { ArticleResult } from "@/pages/Home/types";

interface ArticleDetail {
  id: string;
  title: string | null;
  intro: ArticleResult["intro"];
  mainBody: ArticleResult["mainBody"];
  bestFor: ArticleResult["bestFor"];
  ethics: ArticleResult["ethics"];
  keyFacts: ArticleResult["keyFacts"];
  editorContent: Block[] | null;
}

export default function ArticleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load article on mount
  useEffect(() => {
    if (!id) return;

    const loadArticle = async () => {
      try {
        const { data } = await api.get<ArticleDetail>(`/articles/${id}`);
        setArticle(data);
        setTitle(data.title ?? "Untitled Article");
      } catch {
        setError(
          "Failed to load article. It may not exist or you don't have access.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadArticle();
  }, [id]);

  // Build initial editor content
  const getInitialContent = useCallback((): Block[] | undefined => {
    if (!article) return undefined;

    // If editor content already exists, use it
    if (article.editorContent?.length) {
      return article.editorContent;
    }

    // Otherwise, convert from article sections
    const articleResult: ArticleResult = {
      intro: article.intro,
      mainBody: article.mainBody,
      bestFor: article.bestFor,
      ethics: article.ethics,
      keyFacts: article.keyFacts,
    };

    return articleToBlocks(articleResult);
  }, [article]);

  // Auto-save editor content (debounced in ArticleEditor)
  const handleEditorChange = useCallback(
    async (content: Block[]) => {
      if (!id) return;

      setIsSaving(true);
      try {
        await api.patch(`/articles/${id}/editor`, { editorContent: content });
        setLastSaved(new Date());
      } catch {
        // Silently fail — will retry on next change
      } finally {
        setIsSaving(false);
      }
    },
    [id],
  );

  // Save title
  const handleTitleBlur = useCallback(async () => {
    if (!id || !title.trim()) return;
    setIsSaving(true);
    try {
      await api.patch(`/articles/${id}/title`, { title: title.trim() });
    } catch {
      // Silently fail
    } finally {
      setIsSaving(false);
    }
  }, [id, title]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-background p-6">
        <p className="text-sm text-destructive">
          {error ?? "Article not found"}
        </p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="size-4 mr-2" />
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 md:px-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <div className="flex-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="border-none bg-transparent text-lg font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
            placeholder="Article title..."
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isSaving ? (
            <span className="flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" />
              Saving...
            </span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1">
              <Save className="size-3" />
              Saved
            </span>
          ) : null}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <ArticleEditor
            initialContent={getInitialContent()}
            onChange={handleEditorChange}
          />
        </div>
      </div>
    </div>
  );
}
