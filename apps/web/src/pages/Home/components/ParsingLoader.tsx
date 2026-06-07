import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export function ParsingLoader() {
  return (
    <Card className="flex flex-col items-center justify-center p-16 text-center border-border/60 shadow-md">
      <Spinner className="size-8 text-primary mb-4" />
      <p className="text-sm font-medium text-foreground animate-pulse">
        Parsing and generating preview for your DOCX document...
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Using Mammoth.js to safely convert Word document structure into HTML.
      </p>
    </Card>
  );
}
