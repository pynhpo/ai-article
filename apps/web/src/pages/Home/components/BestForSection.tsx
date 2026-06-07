import { Users, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ArticleBestFor } from "../types";
import { SourceExcerpt } from "./SourceExcerpt";

interface BestForSectionProps {
  data: ArticleBestFor;
}

export function BestForSection({ data }: BestForSectionProps) {
  return (
    <Card className="border-border/60 shadow-md animate-in fade-in-50 duration-300">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="size-5 text-primary" />
          Best For / Not For
        </CardTitle>
        <CardDescription>Who this experience is ideal (or not ideal) for</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Best For */}
        <div>
          <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-3">
            <CheckCircle2 className="size-4" />
            Best For
          </h4>
          <div className="space-y-3">
            {data.bestFor.map((item, i) => (
              <div key={i} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="text-sm text-foreground">{item.content}</p>
                <SourceExcerpt text={item.sourceExcerpt} />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Not For */}
        <div>
          <h4 className="text-sm font-semibold text-red-500 dark:text-red-400 flex items-center gap-1.5 mb-3">
            <AlertCircle className="size-4" />
            Not For
          </h4>
          <div className="space-y-3">
            {data.notFor.map((item, i) => (
              <div key={i} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <p className="text-sm text-foreground">{item.content}</p>
                <SourceExcerpt text={item.sourceExcerpt} />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
