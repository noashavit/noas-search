import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ExternalLink } from "lucide-react";
import type { WikipediaResult } from "@/hooks/useSearch";

interface Props {
  data: WikipediaResult;
}

export function WikipediaCard({ data }: Props) {
  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5 text-primary" />
          Wikipedia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block group rounded-lg border border-border/50 p-4 transition-all hover:border-primary/30 hover:bg-muted/50"
        >
          <div className="flex gap-4">
            {data.thumbnail && (
              <img
                src={data.thumbnail}
                alt={data.title}
                className="w-16 h-16 rounded-md object-cover shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-primary group-hover:underline text-sm">
                  {data.title}
                </h3>
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                {data.extract}
              </p>
            </div>
          </div>
        </a>
      </CardContent>
    </Card>
  );
}
