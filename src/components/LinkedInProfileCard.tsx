import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Linkedin, ExternalLink, User } from "lucide-react";
import type { LinkedInProfile } from "@/hooks/useSearch";

interface Props {
  profile: LinkedInProfile;
}

export function LinkedInProfileCard({ profile }: Props) {
  // Extract name from title (usually "Name - Title | LinkedIn")
  const displayName = profile.title?.split(" - ")?.[0]?.replace(" | LinkedIn", "") || profile.title;
  const headline = profile.title?.includes(" - ")
    ? profile.title.split(" - ").slice(1).join(" - ").replace(" | LinkedIn", "")
    : null;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Linkedin className="h-5 w-5 text-primary" />
          LinkedIn Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <a
          href={profile.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block group rounded-lg border border-border/50 p-4 transition-all hover:border-primary/30 hover:bg-muted/50"
        >
          <div className="flex gap-4 items-start">
            {profile.thumbnail ? (
              <img
                src={profile.thumbnail}
                alt={displayName}
                className="w-14 h-14 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-primary group-hover:underline">
                  {displayName}
                </h3>
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {headline && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                  {headline}
                </p>
              )}
              {profile.snippet && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {profile.snippet}
                </p>
              )}
            </div>
          </div>
        </a>
      </CardContent>
    </Card>
  );
}
