import { 
  CheckCircle2, 
  Loader2, 
  ArrowLeft, 
  RefreshCw, 
  Sparkles, 
  BookOpen, 
  Users, 
  Shield, 
  List,
  PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { ArticleResult, ArticleSectionName } from "../types";
import { SECTION_LABELS, ALL_SECTIONS } from "../types";
import { IntroSection } from "./IntroSection";
import { MainBodySection } from "./MainBodySection";
import { BestForSection } from "./BestForSection";
import { EthicsSection } from "./EthicsSection";
import { KeyFactsSection } from "./KeyFactsSection";
import { SectionSkeleton } from "./SectionSkeleton";

const SECTION_ICONS: Record<ArticleSectionName, React.ReactNode> = {
  intro: <Sparkles className="size-4" />,
  mainBody: <BookOpen className="size-4" />,
  bestFor: <Users className="size-4" />,
  ethics: <Shield className="size-4" />,
  keyFacts: <List className="size-4" />,
};

interface ArticleResultViewProps {
  article: ArticleResult;
  completedSections: Set<ArticleSectionName>;
  isGenerating: boolean;
  isComplete: boolean;
  progress: number;
  isSaving: boolean;
  isLoggedIn: boolean;
  onBackToPreview: () => void;
  onUploadNew: () => void;
  onSaveAndEdit: () => void;
}

export function ArticleResultView({
  article,
  completedSections,
  isGenerating,
  isComplete,
  progress,
  isSaving,
  isLoggedIn,
  onBackToPreview,
  onUploadNew,
  onSaveAndEdit,
}: ArticleResultViewProps) {
  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBackToPreview}
          disabled={isGenerating}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button onClick={onUploadNew} variant="outline" className="gap-2">
          <RefreshCw className="size-4" />
          Upload New Document
        </Button>
        {isComplete && (
          <Button
            onClick={onSaveAndEdit}
            disabled={isSaving}
            className="gap-2 ml-auto"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PenLine className="size-4" />
            )}
            {isSaving ? "Saving..." : isLoggedIn ? "Edit" : "Save & Edit"}
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <Card className="border-border/60 shadow-md">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Loader2 className="size-4 animate-spin text-primary" />
                Generating article sections...
              </span>
              <span className="font-semibold text-foreground">
                {completedSections.size} / {ALL_SECTIONS.length} sections
              </span>
            </div>
            <Progress value={progress} />
            <div className="flex flex-wrap gap-2">
              {ALL_SECTIONS.map((section) => (
                <Badge
                  key={section}
                  variant={completedSections.has(section) ? "default" : "outline"}
                  className={`text-xs transition-all duration-300 ${
                    completedSections.has(section)
                      ? "bg-emerald-500/90 text-white border-emerald-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {completedSections.has(section) ? (
                    <CheckCircle2 className="size-3 mr-1" />
                  ) : (
                    <Loader2 className="size-3 mr-1 animate-spin" />
                  )}
                  {SECTION_LABELS[section]}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Banner */}
      {isComplete && (
        <Alert className="bg-emerald-500/5 border-emerald-500/20 animate-in fade-in-50 duration-300">
          <CheckCircle2 className="size-4 text-emerald-500" />
          <AlertTitle className="text-emerald-600 dark:text-emerald-400 font-semibold">Article Generated Successfully</AlertTitle>
          <AlertDescription className="text-emerald-600/80 dark:text-emerald-400/80">
            All {completedSections.size} sections have been generated from your travel notes.
          </AlertDescription>
        </Alert>
      )}

      {/* Article Sections in Tabs */}
      {completedSections.size > 0 && (
        <Tabs defaultValue={[...completedSections][0]} className="space-y-4">
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
            {ALL_SECTIONS.map((section) => (
              <TabsTrigger
                key={section}
                value={section}
                disabled={!completedSections.has(section)}
                className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {SECTION_ICONS[section]}
                <span className="hidden sm:inline">{SECTION_LABELS[section]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Intro Tab */}
          <TabsContent value="intro">
            {article.intro ? (
              <IntroSection data={article.intro} />
            ) : (
              <SectionSkeleton />
            )}
          </TabsContent>

          {/* Main Body Tab */}
          <TabsContent value="mainBody">
            {article.mainBody ? (
              <MainBodySection data={article.mainBody} />
            ) : (
              <SectionSkeleton />
            )}
          </TabsContent>

          {/* Best For Tab */}
          <TabsContent value="bestFor">
            {article.bestFor ? (
              <BestForSection data={article.bestFor} />
            ) : (
              <SectionSkeleton />
            )}
          </TabsContent>

          {/* Ethics Tab */}
          <TabsContent value="ethics">
            {article.ethics ? (
              <EthicsSection data={article.ethics} />
            ) : (
              <SectionSkeleton />
            )}
          </TabsContent>

          {/* Key Facts Tab */}
          <TabsContent value="keyFacts">
            {article.keyFacts ? (
              <KeyFactsSection data={article.keyFacts} />
            ) : (
              <SectionSkeleton />
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Loading skeletons when no sections are ready yet */}
      {completedSections.size === 0 && isGenerating && (
        <Card className="border-border/60 shadow-md">
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

