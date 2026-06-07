import { Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ArticleEthics } from "../types";
import { SourceExcerpt } from "./SourceExcerpt";

interface EthicsSectionProps {
  data: ArticleEthics;
}

export function EthicsSection({ data }: EthicsSectionProps) {
  return (
    <Card className="border-border/60 shadow-md animate-in fade-in-50 duration-300">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="size-5 text-primary" />
          Ethics & Safety Notes
        </CardTitle>
        <CardDescription>Important considerations for responsible travel</CardDescription>
      </CardHeader>
      <CardContent>
        {data.notes.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No specific ethics or safety concerns were identified in the notes.</p>
        ) : (
          <div className="space-y-3">
            {data.notes.map((note, i) => (
              <div key={i} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-sm text-foreground">{note.content}</p>
                <SourceExcerpt text={note.sourceExcerpt} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
