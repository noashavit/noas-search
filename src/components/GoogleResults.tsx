import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, ExternalLink } from "lucide-react";
import type { GoogleResult } from "@/hooks/useSearch";

interface Props {
  results: GoogleResult[];
}

export function GoogleResults({ results }: Props) {
  if (results.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5 text-primary" />
          Top 10 Google Results (US)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.map((result, i) => (
          <a
            key={i}
            href={result.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block group rounded-lg border border-border/50 p-4 transition-all hover:border-primary/30 hover:bg-muted/50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate mb-1">
                  {result.displayed_link || result.link}
                </p>
                <h3 className="font-medium text-primary group-hover:underline line-clamp-1">
                  <span className="text-muted-foreground mr-2 text-xs font-mono">{result.position}.</span>
                  {result.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {result.snippet}
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
