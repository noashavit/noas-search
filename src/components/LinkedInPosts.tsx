import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Linkedin, ExternalLink } from "lucide-react";
import type { LinkedInPost } from "@/hooks/useSearch";

interface Props {
  posts: LinkedInPost[];
  query: string;
}

function getRecencyBadge(dateStr?: string): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } | null {
  if (!dateStr) return null;

  const now = new Date();
  const parsed = new Date(dateStr);

  // Try parsing relative strings like "1 day ago", "3 weeks ago"
  if (isNaN(parsed.getTime())) {
    const lower = dateStr.toLowerCase();
    const hourMatch = lower.match(/(\d+)\s*hour/);
    const dayMatch = lower.match(/(\d+)\s*day/);
    const weekMatch = lower.match(/(\d+)\s*week/);
    const monthMatch = lower.match(/(\d+)\s*month/);

    if (hourMatch || (dayMatch && parseInt(dayMatch[1]) <= 1)) {
      return { label: "Today", variant: "default" };
    }
    if (dayMatch && parseInt(dayMatch[1]) <= 7) {
      return { label: "Past week", variant: "default" };
    }
    if (weekMatch && parseInt(weekMatch[1]) <= 1) {
      return { label: "Past week", variant: "default" };
    }
    if ((weekMatch && parseInt(weekMatch[1]) <= 4) || (dayMatch && parseInt(dayMatch[1]) <= 30)) {
      return { label: "Past month", variant: "secondary" };
    }
    if (monthMatch && parseInt(monthMatch[1]) <= 3) {
      return { label: "Past quarter", variant: "outline" };
    }
    if (monthMatch) {
      return { label: "Past year", variant: "outline" };
    }
    return null;
  }

  const diffMs = now.getTime() - parsed.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 1) return { label: "Today", variant: "default" };
  if (diffDays <= 7) return { label: "Past week", variant: "default" };
  if (diffDays <= 30) return { label: "Past month", variant: "secondary" };
  if (diffDays <= 90) return { label: "Past quarter", variant: "outline" };
  return { label: "Past year", variant: "outline" };
}

export function LinkedInPosts({ posts, query }: Props) {
  if (posts.length === 0) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Linkedin className="h-5 w-5 text-primary" />
            LinkedIn Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No LinkedIn posts found by "{query}"</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Linkedin className="h-5 w-5 text-primary" />
          LinkedIn Posts by {query}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {posts.map((post, i) => {
          const badge = getRecencyBadge(post.date);
          return (
            <a
              key={i}
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block group rounded-lg border border-border/50 p-4 transition-all hover:border-primary/30 hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground group-hover:text-primary line-clamp-2 text-sm">
                      {post.title}
                    </h3>
                    {badge && (
                      <Badge variant={badge.variant} className="shrink-0 text-xs">
                        {badge.label}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {post.snippet}
                  </p>
                  {post.date && (
                    <p className="text-xs text-muted-foreground/70 mt-1">{post.date}</p>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          );
        })}
      </CardContent>
    </Card>
  );
}
