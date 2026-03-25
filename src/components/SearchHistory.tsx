import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Clock } from "lucide-react";
import type { SearchHistory as SearchHistoryType } from "@/hooks/useSearch";
import { formatDistanceToNow } from "date-fns";

interface Props {
  history: SearchHistoryType[];
  onSelect: (query: string) => void;
}

export function SearchHistory({ history, onSelect }: Props) {
  if (history.length === 0) return null;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <History className="h-4 w-4" />
          Recent Searches
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.query)}
            className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors hover:bg-muted/70"
          >
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate font-medium">{item.query}</span>
            <span className="text-xs text-muted-foreground ml-auto shrink-0">
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
