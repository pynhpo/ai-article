import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import * as mammoth from "mammoth";
import axios from "axios";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Send, 
  FileCheck2,
  RefreshCw,
  FileDown
} from "lucide-react";
import { 
  MAX_FILE_SIZE,
  ACCEPTED_FILE_EXTENSIONS,
  ACCEPTED_MIME_TYPES,
} from "./constants";
import "./styles.css";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [htmlPreview, setHtmlPreview] = useState<string>("");
  const [extractedText, setExtractedText] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const validateAndProcessFile = (selectedFile: File) => {
    setError(null);
    setUploadSuccess(false);

    // Validate size limit (10MB)
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File size exceeds the 10MB limit (Current size: ${formatBytes(selectedFile.size)}). Please select a smaller file.`);
      return;
    }

    // Validate file extension/type
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    const isValidExtension = ACCEPTED_FILE_EXTENSIONS.includes(fileExtension);
    const isValidMimeType = ACCEPTED_MIME_TYPES.includes(selectedFile.type);

    if (!isValidExtension && !isValidMimeType) {
      setError("Only .docx files are supported. Please select a valid Word document.");
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          throw new Error("Unable to read the file content.");
        }

        // Generate HTML preview using Mammoth
        const previewResult = await mammoth.convertToHtml({ arrayBuffer });
        setHtmlPreview(previewResult.value || "<p class='text-muted-foreground italic'>This document has no printable or previewable content.</p>");

        // Extract raw text only
        const textResult = await mammoth.extractRawText({ arrayBuffer });
        setExtractedText(textResult.value || "");
      } catch (err) {
        console.error("Error parsing DOCX file with Mammoth:", err);
        const errorMessage = err instanceof Error ? err.message : "An error occurred while parsing the Word file. Please try again.";
        setError(errorMessage);
        setFile(null);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError("Failed to read the file from your device.");
      setFile(null);
      setLoading(false);
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleCancel = () => {
    setFile(null);
    setHtmlPreview("");
    setExtractedText("");
    setError(null);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmUpload = async () => {
    if (!extractedText.trim()) {
      setError("There is no extracted text content to upload.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Send only plain text to the backend API endpoint
      await api.post('/articles/extract-docx', {
        text: extractedText,
        fileName: file?.name,
        fileSize: file?.size
      });

      setUploadSuccess(true);
    } catch (err) {
      console.error("Error uploading text to backend:", err);
      let errorMessage = "Failed to upload the extracted text to the backend server. Please try again.";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-linear-to-b from-background to-muted/20 p-6 md:p-10">
      
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Document Upload
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Upload a Word document (.docx) to preview, extract its plain text, and send it to the backend.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="animate-in fade-in-50 duration-200">
            <AlertCircle className="size-4" />
            <AlertTitle>Error occurred</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* State 1: Upload / Drag & Drop Area */}
        {!file && !uploadSuccess && (
          <Card className="border-border/60 shadow-xl dark:bg-card/40 backdrop-blur-xs transition-all duration-300">
            <CardContent className="pt-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 min-h-[300px] ${
                  isDragging 
                    ? "border-primary bg-primary/5 scale-[1.01] shadow-lg shadow-primary/5" 
                    : "border-border hover:border-primary/50 hover:bg-muted/40"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".docx"
                  className="hidden"
                />
                
                <div className={`p-4 rounded-full mb-4 transition-all duration-300 ${
                  isDragging ? "bg-primary/10 text-primary scale-110" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                }`}>
                  <UploadCloud className="size-10 animate-pulse" />
                </div>
                
                <h3 className="text-lg font-semibold mb-1 text-foreground">
                  Drag & drop your DOCX file here
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  or click this area to browse your local files
                </p>
                
                <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg border border-border/40">
                  <span>Format: <strong>.docx</strong></span>
                  <span className="text-muted-foreground/30">•</span>
                  <span>Max size: <strong>10MB</strong></span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* State 2: Reading / Converting Loading State */}
        {loading && !htmlPreview && !uploadSuccess && (
          <Card className="flex flex-col items-center justify-center p-16 text-center border-border/60 shadow-md">
            <Spinner className="size-8 text-primary mb-4" />
            <p className="text-sm font-medium text-foreground animate-pulse">
              Parsing and generating preview for your DOCX document...
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Using Mammoth.js to safely convert Word document structure into HTML.
            </p>
          </Card>
        )}

        {/* State 3: Preview and Confirmation Screen */}
        {file && (htmlPreview || extractedText) && !uploadSuccess && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Action Card (Left Sidebar) */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-border/60 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Document Info</CardTitle>
                  <CardDescription>Verify details before importing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/40">
                    <FileText className="size-6 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span className="text-muted-foreground">Extracted characters:</span>
                      <span className="font-semibold text-foreground">{extractedText.length.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span className="text-muted-foreground">Estimated words:</span>
                      <span className="font-semibold text-foreground">
                        {extractedText.trim() === "" ? 0 : extractedText.trim().split(/\s+/).length.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-semibold text-amber-500 flex items-center gap-1">
                        Pending confirmation
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 border-t border-border/40 pt-4">
                  <Button 
                    onClick={handleConfirmUpload} 
                    disabled={loading} 
                    className="w-full font-medium"
                  >
                    {loading ? (
                      <>
                        <Spinner className="mr-2 animate-spin" />
                        Uploading text...
                      </>
                    ) : (
                      <>
                        <Send className="size-4 mr-2" />
                        Confirm & Extract Text
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel} 
                    disabled={loading}
                    className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 dark:hover:bg-destructive/10"
                  >
                    <Trash2 className="size-4 mr-2" />
                    Cancel & Reset
                  </Button>
                </CardFooter>
              </Card>

              <Alert className="bg-primary/5 border-primary/20">
                <FileCheck2 className="size-4 text-primary" />
                <AlertTitle className="text-primary font-semibold text-xs">Extraction Details</AlertTitle>
                <AlertDescription className="text-xs text-primary/80 leading-relaxed">
                  Only plain text is extracted and sent to the server. All HTML tags, formatting, and media are removed.
                </AlertDescription>
              </Alert>
            </div>

            {/* Preview Card (Right Area) */}
            <div className="lg:col-span-2">
              <Card className="border-border/60 shadow-md">
                <CardHeader className="border-b border-border/40 pb-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Document Preview</CardTitle>
                    <CardDescription>Formatted HTML preview generated by Mammoth.js</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ScrollArea className="h-[450px] w-full rounded-md border bg-card/50 p-6">
                    <div 
                      className="docx-preview select-text" 
                      dangerouslySetInnerHTML={{ __html: htmlPreview }} 
                    />
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

          </div>
        )}

        {/* State 4: Success Screen */}
        {uploadSuccess && (
          <Card className="max-w-2xl mx-auto border-border/60 shadow-xl p-8 text-center animate-in zoom-in-95 duration-200">
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-6">
              <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 scale-110">
                <CheckCircle2 className="size-12 animate-bounce" />
              </div>
              
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-foreground">
                  Extraction & Upload Successful!
                </CardTitle>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  The plain text content of <strong>{file?.name}</strong> has been successfully extracted and sent to the backend.
                </p>
              </div>

              {extractedText && (
                <div className="w-full text-left space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <FileDown className="size-3.5" />
                    Extracted Plain Text Preview ({formatBytes(extractedText.length)}):
                  </p>
                  <ScrollArea className="h-32 w-full rounded-lg border bg-muted/60 p-4 text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap select-text">
                    {extractedText.slice(0, 1000)}
                    {extractedText.length > 1000 && " ... [Content truncated for preview]"}
                  </ScrollArea>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={handleCancel} className="gap-2">
                  <RefreshCw className="size-4" />
                  Upload Another Document
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
