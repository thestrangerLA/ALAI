"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Lightbulb, Loader2, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  expandUserIdeaAction,
  refineIdeaFocusAction,
  summarizeAndRefineIdeaAction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Schema for the form
const formSchema = z.object({
  idea: z.string().min(10, "Your idea should be at least 10 characters long."),
});

// State types for AI results
type AiResult = {
  expandedIdea: string;
  summary: string;
  refinementOptions: string[];
};

export default function Home() {
  const [isPending, startTransition] = useTransition();
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      idea: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setAiResult(null);
    startTransition(async () => {
      const expandResult = await expandUserIdeaAction({ initialIdea: values.idea });
      if (!expandResult.success || !expandResult.data) {
        toast({
          variant: "destructive",
          title: "Error",
          description: expandResult.error,
        });
        return;
      }

      const expandedIdea = expandResult.data.expandedIdea;

      const summarizeResult = await summarizeAndRefineIdeaAction({ expandedIdea });
      if (!summarizeResult.success || !summarizeResult.data) {
        toast({
          variant: "destructive",
          title: "Error",
          description: summarizeResult.error,
        });
        // Still set the expanded idea even if summary fails
        setAiResult({
          expandedIdea,
          summary: "Could not generate a summary.",
          refinementOptions: [],
        });
        return;
      }
      
      setAiResult({
        expandedIdea,
        summary: summarizeResult.data.summary,
        refinementOptions: summarizeResult.data.refinementOptions,
      });
    });
  };

  const handleRefine = (focusArea: string) => {
    if (!aiResult) return;
    
    startTransition(async () => {
      const refineResult = await refineIdeaFocusAction({
        initialIdea: aiResult.expandedIdea,
        focusArea,
      });

      if (!refineResult.success || !refineResult.data) {
        toast({
          variant: "destructive",
          title: "Error",
          description: refineResult.error,
        });
        return;
      }

      setAiResult((prev) =>
        prev ? { ...prev, expandedIdea: refineResult.data.refinedIdea } : null
      );
    });
  };

  const handleDownload = () => {
    if (!aiResult) return;
    const content = `
# Idea Spark Export

## Idea Summary
${aiResult.summary}

## Expanded & Refined Idea
${aiResult.expandedIdea}
    `;
    const blob = new Blob([content.trim()], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "idea-spark-export.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <header className="p-4 md:p-6 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-headline font-bold">Idea Spark</h1>
      </header>
      <main className="p-4 md:p-6 pt-0">
        <Card className="max-w-4xl mx-auto shadow-lg border-border/80">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Let's ignite some creativity!</CardTitle>
            <CardDescription className="font-body pt-1">Enter your initial idea below and watch our AI expand and refine it.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="idea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-body">Your Idea</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., A mobile app that connects local gardeners to share tools and tips..."
                          className="min-h-[100px] resize-none font-body"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isPending} className="w-full sm:w-auto font-bold">
                  {isPending && !aiResult ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Spark Idea
                </Button>
              </form>
            </Form>
          </CardContent>

          {(isPending || aiResult) && <Separator className="my-0" />}

          {isPending && !aiResult && (
             <CardContent className="space-y-6 pt-6">
              <Skeleton className="h-8 w-1/2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-8 w-1/3 mt-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </CardContent>
          )}

          {aiResult && (
            <CardContent className="space-y-8 pt-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <CardTitle className="font-headline text-xl">
                    Expanded Idea
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={handleDownload} aria-label="Download idea">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
                <div className="relative font-body text-card-foreground/90 p-4 border rounded-lg bg-background shadow-inner">
                  {isPending && <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
                  <p className="whitespace-pre-wrap leading-relaxed">{aiResult.expandedIdea}</p>
                </div>
              </div>
              
              {aiResult.refinementOptions.length > 0 && (
                <div>
                    <CardTitle className="font-headline text-xl mb-2">Summary & Refinements</CardTitle>
                    <p className="font-body text-sm text-muted-foreground mb-4">{aiResult.summary}</p>
                    
                    <CardDescription className="font-body text-xs mb-2 text-muted-foreground">Click a topic to refine the idea's focus:</CardDescription>
                    <div className="flex flex-wrap gap-2">
                    {aiResult.refinementOptions.map((option, index) => (
                        <Button
                        key={index}
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRefine(option)}
                        disabled={isPending}
                        >
                        {option}
                        </Button>
                    ))}
                    </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </main>
    </div>
  );
}
