import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";

interface Props {
  summary: string | null;
  loading: boolean;
}

export function AnalystSummary({ summary, loading }: Props) {
  if (!loading && !summary) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Analyst Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Generating analysis…</span>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 [&_strong]:text-foreground [&_p]:mb-2 [&_p:last-child]:mb-0">
            {summary!.split("\n").map((line, i) => {
              if (!line.trim()) return null;
              // Render bold markers and markdown links
              const parts = line
                .split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g)
                .map((part, j) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return <strong key={j}>{part.slice(2, -2)}</strong>;
                  }
                  const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
                  if (linkMatch) {
                    return (
                      <a
                        key={j}
                        href={linkMatch[2]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {linkMatch[1]}
                      </a>
                    );
                  }
                  return part;
                });
              return <p key={i}>{parts}</p>;
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
