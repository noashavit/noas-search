import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, ExternalLink, Loader2 } from "lucide-react";

export interface SpikeData {
  date: string;
  value: number;
  explanation: string;
  articles: { title: string; link: string; source: string }[];
}

interface Props {
  spikes: SpikeData[];
  loading: boolean;
}

export function SpikeInsights({ spikes, loading }: Props) {
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-accent" />
            Spike Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing trend spikes…
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!spikes.length) return null;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-accent" />
          Spike Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          What likely caused the notable spikes in search interest
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {spikes.map((spike, i) => (
          <div key={i} className="border border-border/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{spike.date}</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono">
                {spike.value}/100
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{spike.explanation}</p>
            {spike.articles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {spike.articles.map((article, j) => (
                  <a
                    key={j}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {article.source || article.title.slice(0, 40)}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
