import { Quote } from "lucide-react";

interface SourceExcerptProps {
  text: string;
}

export function SourceExcerpt({ text }: SourceExcerptProps) {
  return (
    <div className="mt-3 rounded-lg bg-muted/50 border border-border/40 p-3">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
        <Quote className="size-3" />
        <span className="font-semibold uppercase tracking-wide">Source from notes</span>
      </p>
      <p className="text-xs text-muted-foreground/80 italic leading-relaxed">
        "{text}"
      </p>
    </div>
  );
}
