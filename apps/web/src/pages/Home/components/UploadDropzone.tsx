import type { DragEvent, ChangeEvent, RefObject } from "react";
import { UploadCloud } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface UploadDropzoneProps {
  isDragging: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onTriggerFileInput: () => void;
}

export function UploadDropzone({
  isDragging,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  onTriggerFileInput,
}: UploadDropzoneProps) {
  return (
    <Card className="border-border/60 shadow-xl dark:bg-card/40 backdrop-blur-xs transition-all duration-300">
      <CardContent className="pt-6">
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onTriggerFileInput}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 min-h-[300px] ${
            isDragging 
              ? "border-primary bg-primary/5 scale-[1.01] shadow-lg shadow-primary/5" 
              : "border-border hover:border-primary/50 hover:bg-muted/40"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
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
  );
}
