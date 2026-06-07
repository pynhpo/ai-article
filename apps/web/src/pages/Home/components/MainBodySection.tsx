import { BookOpen } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ArticleMainBody } from "../types";
import { SourceExcerpt } from "./SourceExcerpt";

interface MainBodySectionProps {
  data: ArticleMainBody;
}

export function MainBodySection({ data }: MainBodySectionProps) {
  return (
    <Card className="border-border/60 shadow-md animate-in fade-in-50 duration-300">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="size-5 text-primary" />
          Main Article Body
        </CardTitle>
        <CardDescription>
          {data.sections.length} section{data.sections.length !== 1 ? "s" : ""}{" "}
          generated
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.sections.map((section, i) => (
            <div key={i}>
              <h3 className="text-base font-semibold text-foreground mb-2">
                {section.title}
              </h3>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {section.body}
              </p>
              <SourceExcerpt text={section.sourceExcerpt} />
              {i < data.sections.length - 1 && <Separator className="mt-6" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
