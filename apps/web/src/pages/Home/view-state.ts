/**
 * Determines the current view state of the Home page based on
 * upload and article generation state. This eliminates the scattered
 * boolean conditions (`loading && !htmlPreview && !uploadSuccess && ...`)
 * from the JSX, making it easy to reason about which screen is active.
 */

export type HomeViewState =
  | "upload"           // State 1: Upload / Drag & Drop area
  | "parsing"          // State 2: Reading / Converting DOCX
  | "preview"          // State 3: Preview & Confirmation screen
  | "uploadSuccess"    // State 4: Legacy upload success screen
  | "articleResult";   // State 5: Article generation / result view

interface HomeViewStateParams {
  file: File | null;
  htmlPreview: string;
  extractedText: string;
  loading: boolean;
  uploadSuccess: boolean;
  isGenerating: boolean;
  isComplete: boolean;
  hasExistingArticle: boolean;
}

export function getHomeViewState(params: HomeViewStateParams): HomeViewState {
  const { file, htmlPreview, extractedText, loading, uploadSuccess, isGenerating, isComplete, hasExistingArticle } = params;
  
  const showArticleResult = isGenerating || isComplete || hasExistingArticle;

  if (showArticleResult) {
    return "articleResult";
  }

  if (uploadSuccess) {
    return "uploadSuccess";
  }

  if (loading && !htmlPreview) {
    return "parsing";
  }

  if (file && (htmlPreview || extractedText)) {
    return "preview";
  }

  return "upload";
}
