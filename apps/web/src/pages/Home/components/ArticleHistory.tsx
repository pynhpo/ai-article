import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, FileText, Trash2, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api } from "@/utils/api";

interface ArticleHistoryItem {
  id: string;
  title: string | null;
  preview: string;
  createdAt: string;
  updatedAt: string;
}

interface ArticleHistoryProps {
  /** Called when user selects an article from history */
  onSelect?: (articleId: string) => void;
}

export function ArticleHistory({ onSelect }: ArticleHistoryProps) {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<ArticleHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadArticles = useCallback(async () => {
    try {
      const { data } = await api.get<ArticleHistoryItem[]>("/articles");
      setArticles(data);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleDelete = async (articleId: string) => {
    setDeletingId(articleId);
    try {
      await api.delete(`/articles/${articleId}`);
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
    } catch {
      // Silently fail
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Clock className="size-5 text-primary" />
          Your Articles
        </h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return null; // Don't show section if no articles
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Clock className="size-5 text-primary" />
        Your Articles
        <span className="text-sm font-normal text-muted-foreground">
          ({articles.length})
        </span>
      </h2>

      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4">
          {articles.map((article) => (
            <Card
              key={article.id}
              className="group min-w-[280px] max-w-[320px] shrink-0 border-border/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer"
              onClick={() => onSelect ? onSelect(article.id) : navigate(`/articles/${article.id}`)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="size-4 text-primary shrink-0" />
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {article.title ?? "Untitled Article"}
                    </h3>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete article?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete &quot;{article.title ?? "Untitled Article"}&quot;. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(article.id)}
                          disabled={deletingId === article.id}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deletingId === article.id ? (
                            <Loader2 className="size-4 animate-spin mr-1" />
                          ) : null}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {article.preview && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {article.preview}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(article.updatedAt)}
                  </span>
                  <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
