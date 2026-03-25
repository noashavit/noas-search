import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Linkedin, ExternalLink } from "lucide-react";
import type { LinkedInPost } from "@/hooks/useSearch";

interface Props {
  posts: LinkedInPost[];
  query: string;
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
        {posts.map((post, i) => (
          <a
            key={i}
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block group rounded-lg border border-border/50 p-4 transition-all hover:border-primary/30 hover:bg-muted/50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-foreground group-hover:text-primary line-clamp-2 text-sm">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {post.snippet}
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
