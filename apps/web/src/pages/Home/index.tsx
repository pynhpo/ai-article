import { useDocxUpload } from "@/hooks/use-docx-upload";
import { useArticleGeneration } from "@/hooks/use-article-generation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  UploadDropzone,
  ParsingLoader,
  PreviewConfirmation,
  UploadSuccess,
  ArticleResultView,
} from "./components";
import { getHomeViewState } from "./view-state";
import "./styles.css";

export default function Home() {
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
    generate,
    reset: resetGeneration,
  } = useArticleGeneration();

  const viewState = getHomeViewState({
    file,
    htmlPreview,
    extractedText,
    loading,
    uploadSuccess,
    isGenerating,
    isComplete,
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

  const isArticleView = viewState === "articleResult";

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
            onBackToPreview={handleBackToPreview}
            onUploadNew={handleCancel}
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

      </div>
    </div>
  );
}
