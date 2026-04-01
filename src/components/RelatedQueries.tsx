import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3 } from "lucide-react";
import type { RelatedQueries as RelatedQueriesType } from "@/hooks/useSearch";

interface Props {
  data: RelatedQueriesType;
}

export function RelatedQueries({ data }: Props) {
  if (data.top.length === 0 && data.rising.length === 0) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {data.top.length > 0 && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-accent" />
              Top Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-1.5">
              {data.top.map((q, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">
                    <span className="text-muted-foreground mr-2 font-mono text-xs">{i + 1}.</span>
                    {q.query}
                  </span>
                  <span className="text-muted-foreground text-xs font-mono">{q.value}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {data.rising.length > 0 && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Rising Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-1.5">
              {data.rising.map((q, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">
                    <span className="text-muted-foreground mr-2 font-mono text-xs">{i + 1}.</span>
                    {q.query}
                  </span>
                  <span className="text-xs font-mono text-primary">{q.value === 'Breakout' ? '🔥 Breakout' : `+${q.value}%`}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
