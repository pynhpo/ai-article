import { CheckCircle2, RefreshCw, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UploadSuccessProps {
  fileName: string | undefined;
  extractedText: string;
  onCancel: () => void;
  formatBytes: (bytes: number, decimals?: number) => string;
}

export function UploadSuccess({
  fileName,
  extractedText,
  onCancel,
  formatBytes,
}: UploadSuccessProps) {
  return (
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
            The plain text content of <strong>{fileName}</strong> has been successfully extracted and sent to the backend.
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
          <Button onClick={onCancel} className="gap-2">
            <RefreshCw className="size-4" />
            Upload Another Document
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
