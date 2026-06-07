import { List } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ArticleKeyFacts } from "../types";
import { SourceExcerpt } from "./SourceExcerpt";

interface KeyFactsSectionProps {
  data: ArticleKeyFacts;
}

export function KeyFactsSection({ data }: KeyFactsSectionProps) {
  return (
    <Card className="border-border/60 shadow-md animate-in fade-in-50 duration-300">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <List className="size-5 text-primary" />
          Key Facts
        </CardTitle>
        <CardDescription>Essential information extracted from your notes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.facts.map((fact, i) => (
            <div key={i} className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{fact.label}</p>
              <p className="text-sm font-medium text-foreground">{fact.value}</p>
              <SourceExcerpt text={fact.sourceExcerpt} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
