import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import type { RedditPost } from "@/hooks/useSearch";

interface Props {
  posts: RedditPost[];
  query: string;
}

export function RedditPosts({ posts, query }: Props) {
  if (posts.length === 0) return null;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 13.38c.15.36.23.75.23 1.14 0 2.27-2.34 4.1-5.24 4.1s-5.24-1.83-5.24-4.1c0-.39.08-.78.23-1.14a1.38 1.38 0 0 1-.66-1.17c0-.76.62-1.38 1.38-1.38.36 0 .7.14.95.4a7.54 7.54 0 0 1 3.34-.98l.63-2.96a.3.3 0 0 1 .35-.24l2.1.45a.98.98 0 0 1 1.84.32c0 .54-.44.98-.98.98a.98.98 0 0 1-.97-.84l-1.87-.4-.56 2.63a7.5 7.5 0 0 1 3.29.98c.25-.26.59-.4.95-.4.76 0 1.38.62 1.38 1.38 0 .48-.25.9-.64 1.17zM9.3 12.9c-.54 0-.98.44-.98.98s.44.98.98.98.98-.44.98-.98-.44-.98-.98-.98zm5.4 0c-.54 0-.98.44-.98.98s.44.98.98.98.98-.44.98-.98-.44-.98-.98-.98zm-4.8 3.38a.3.3 0 0 0 .42 0 2.34 2.34 0 0 0 1.68.62c.65 0 1.22-.23 1.68-.62a.3.3 0 1 0-.42-.42 1.74 1.74 0 0 1-1.26.46c-.47 0-.91-.17-1.26-.46a.3.3 0 0 0-.42 0 .3.3 0 0 0-.42.42z"/>
          </svg>
          Reddit Threads about {query}
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
