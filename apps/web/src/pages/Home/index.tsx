import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDocxUpload } from "@/hooks/use-docx-upload";
import { useArticleGeneration } from "@/hooks/use-article-generation";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { api } from "@/utils/api";
import {
  UploadDropzone,
  ParsingLoader,
  PreviewConfirmation,
  UploadSuccess,
  ArticleResultView,
  ArticleHistory,
} from "./components";
import { getHomeViewState } from "./view-state";
import "./styles.css";

interface SaveArticleResponse {
  id: string;
  title: string;
}

export default function Home() {
  const navigate = useNavigate();
  const { user, openLogin } = useAuth();

  const {
    file,
    htmlPreview,
    extractedText,
    isDragging,
    loading,
    error: uploadError,
    uploadSuccess,
    fileInputRef,
    setError,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileChange,
    triggerFileInput,
    resetUpload,
    formatBytes,
  } = useDocxUpload();

  const {
    article,
    completedSections,
    isGenerating,
    isComplete,
    error: generationError,
    progress,
    hasExistingArticle,
    generate,
    reset: resetGeneration,
  } = useArticleGeneration();

  const [isSaving, setIsSaving] = useState(false);
  // Stores the guest session ID when the user clicks "Save & Edit" before login
  const pendingGuestSessionRef = useRef<string | null>(null);

  // After login completes, if there's a pending save → execute it
  useEffect(() => {
    const guestSessionId = pendingGuestSessionRef.current;
    if (!guestSessionId || !user || user.isGuest) return;

    // User just logged in, complete the save
    pendingGuestSessionRef.current = null;

    const saveAfterLogin = async () => {
      setIsSaving(true);
      try {
        const { data } = await api.post<SaveArticleResponse>(
          "/articles/save",
          { guestSessionId, isGuest: true },
        );
        navigate(`/articles/${data.id}`);
      } catch {
        setError("Failed to save article. Please try again.");
      } finally {
        setIsSaving(false);
      }
    };

    saveAfterLogin();
  }, [user, navigate, setError]);

  const viewState = getHomeViewState({
    file,
    htmlPreview,
    extractedText,
    loading,
    uploadSuccess,
    isGenerating,
    isComplete,
    hasExistingArticle,
  });

  const displayError = uploadError || generationError;

  const handleGenerateArticle = () => {
    if (!extractedText.trim()) {
      setError("There is no extracted text content to process.");
      return;
    }
    setError(null);
    generate(extractedText);
  };

  const handleCancel = () => {
    resetUpload();
    resetGeneration();
  };

  const handleBackToPreview = () => {
    resetGeneration();
  };

  const handleSaveAndEdit = useCallback(async () => {
    // If user is guest, store session ID and prompt login
    if (user?.isGuest) {
      pendingGuestSessionRef.current = user.id;
      openLogin();
      return;
    }

    // User is already logged in — save directly using their session ID
    // (the staging article was stored under sessionId = userId during SSE)
    if (!user) return;

    setIsSaving(true);
    try {
      const { data } = await api.post<SaveArticleResponse>(
        "/articles/save",
        { guestSessionId: user.id, isGuest: false },
      );
      navigate(`/articles/${data.id}`);
    } catch {
      setError("Failed to save article. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [user, openLogin, setError, navigate]);

  const isArticleView = viewState === "articleResult";
  const isRegisteredUser = user && !user.isGuest;

  return (
    <div className="flex-1 overflow-auto bg-linear-to-b from-background to-muted/20 p-6 md:p-10">
      
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {isArticleView ? "Generated Article" : "Document Upload"}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {isArticleView
              ? "Your rough travel notes are being transformed into a structured magazine article."
              : "Upload a Word document (.docx) to preview, extract its plain text, and generate a structured travel article."
            }
          </p>
        </div>

        {/* Error Alert */}
        {displayError && (
          <Alert variant="destructive" className="animate-in fade-in-50 duration-200">
            <AlertCircle className="size-4" />
            <AlertTitle>Error occurred</AlertTitle>
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        )}

        {/* ============================== */}
        {/* VIEW STATE RENDERING           */}
        {/* ============================== */}

        {viewState === "articleResult" && (
          <ArticleResultView
            article={article}
            completedSections={completedSections}
            isGenerating={isGenerating}
            isComplete={isComplete}
            progress={progress}
            isSaving={isSaving}
            onBackToPreview={handleBackToPreview}
            onUploadNew={handleCancel}
            onSaveAndEdit={handleSaveAndEdit}
          />
        )}

        {viewState === "upload" && (
          <UploadDropzone
            isDragging={isDragging}
            fileInputRef={fileInputRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onFileChange={handleFileChange}
            onTriggerFileInput={triggerFileInput}
          />
        )}

        {viewState === "parsing" && (
          <ParsingLoader />
        )}

        {viewState === "preview" && file && (
          <PreviewConfirmation
            file={file}
            htmlPreview={htmlPreview}
            extractedText={extractedText}
            loading={loading}
            onGenerate={handleGenerateArticle}
            onCancel={handleCancel}
            formatBytes={formatBytes}
          />
        )}

        {viewState === "uploadSuccess" && (
          <UploadSuccess
            fileName={file?.name}
            extractedText={extractedText}
            onCancel={handleCancel}
            formatBytes={formatBytes}
          />
        )}

        {/* Article History — only for registered users */}
        {isRegisteredUser && <ArticleHistory />}

      </div>
    </div>
  );
}
