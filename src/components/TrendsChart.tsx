import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { TrendingUp, Zap } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { TrendsPoint } from "@/hooks/useSearch";
import type { SpikeData } from "@/components/SpikeInsights";

interface Props {
  data: TrendsPoint[];
  query: string;
  spikeData?: SpikeData[];
}

export function TrendsChart({ data, query, spikeData = [] }: Props) {
  const [activeSpike, setActiveSpike] = useState<string | null>(null);

  const chartData = data.map((point) => ({
    date: point.date,
    value: point.values?.[0]?.extracted_value ?? 0,
  }));

  // Build a set of spike dates for quick lookup
  const spikeDates = new Set(spikeData.map((s) => s.date));

  if (chartData.length === 0) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-accent" />
            Google Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No trends data available for "{query}"</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-accent" />
          Google Trends — US, past 12 months
        </CardTitle>
        <p className="text-sm text-muted-foreground">Search interest for "{query}"</p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
              />
              {/* Spike annotation dots */}
              {spikeData.map((spike) => {
                const pointIndex = chartData.findIndex((d) => d.date === spike.date);
                if (pointIndex === -1) return null;
                const point = chartData[pointIndex];
                return (
                  <ReferenceDot
                    key={spike.date}
                    x={point.date}
                    y={point.value}
                    r={6}
                    fill="hsl(var(--destructive))"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                    style={{ cursor: "pointer" }}
                    onClick={() => setActiveSpike(activeSpike === spike.date ? null : spike.date)}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Inline spike detail when clicked */}
        {activeSpike && spikeData.find((s) => s.date === activeSpike) && (() => {
          const spike = spikeData.find((s) => s.date === activeSpike)!;
          return (
            <div className="mt-4 border border-border/50 rounded-lg p-4 bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">{spike.date}</span>
                  <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-mono">
                    {spike.value}/100
                  </span>
                </div>
                <button
                  onClick={() => setActiveSpike(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
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
                      {article.source || article.title.slice(0, 40)}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
