import { Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ArticleIntro } from "../types";
import { SourceExcerpt } from "./SourceExcerpt";

interface IntroSectionProps {
  data: ArticleIntro;
}

export function IntroSection({ data }: IntroSectionProps) {
  return (
    <Card className="border-border/60 shadow-md animate-in fade-in-50 duration-300">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          Intro / Hook
        </CardTitle>
        <CardDescription>The attention-grabbing opening for your article</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-foreground leading-relaxed text-base">{data.hook}</p>
        <SourceExcerpt text={data.sourceExcerpt} />
      </CardContent>
    </Card>
  );
}
