import { useState } from "react";
import { Search, Loader2, Sparkles, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrendsChart } from "@/components/TrendsChart";
import { GoogleResults } from "@/components/GoogleResults";
import { LinkedInPosts } from "@/components/LinkedInPosts";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import { AnalystSummary } from "@/components/AnalystSummary";
import { useSearch } from "@/hooks/useSearch";
import { useApiKey } from "@/hooks/useApiKey";

const Index = () => {
  const [query, setQuery] = useState("");
  const { results, loading, search, summary, summaryLoading } = useSearch();
  const { apiKey, setApiKey, clearApiKey, hasApiKey } = useApiKey();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) search(query.trim(), apiKey);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ApiKeyDialog open={!hasApiKey} onSubmit={setApiKey} />

      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">{"\n"}</h1>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">
            US
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearApiKey}
            className="ml-auto text-xs text-muted-foreground"
          >
            <KeyRound className="h-3.5 w-3.5 mr-1" />
            Change API Key
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 flex-1 w-full flex flex-col">
        {/* Hero / Search Section (no results yet) */}
        {!results && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 py-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Search Insights
            </h2>

            <form onSubmit={handleSubmit} className="flex gap-3 max-w-3xl w-full">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What do you want to learn about?"
                  className="pl-14 h-16 text-xl bg-card border-border/50"
                />
              </div>
              <Button type="submit" disabled={loading || !query.trim()} className="h-16 px-10 text-lg">
                Search
              </Button>
            </form>

            <p className="text-sm text-muted-foreground max-w-lg text-center whitespace-pre-line">
              Get a high-level analysis and detailed information about any person or topic.{"\n\n"}
              Get the top 10 search results, the 10 most recent LinkedIn posts, see search trends and more, all in one place.
            </p>
          </div>
        )}

        {/* Search bar + results/loading */}
        {(results || loading) && (
          <div className="py-8 space-y-6">
            <form onSubmit={handleSubmit} className="flex gap-3 max-w-3xl mx-auto w-full">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What do you want to learn about?"
                  className="pl-14 h-16 text-xl bg-card border-border/50"
                />
              </div>
              <Button type="submit" disabled={loading || !query.trim()} className="h-16 px-10 text-lg">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
              </Button>
            </form>

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">
                  Fetching results, trends & LinkedIn posts…
                </p>
              </div>
            )}

            {results && !loading && (
              <div className="space-y-6">
                <AnalystSummary summary={summary} loading={summaryLoading} />
                <TrendsChart data={results.trends} query={query} />

                <div className="grid gap-6 lg:grid-cols-2">
                  <GoogleResults results={results.google} />
                  <LinkedInPosts posts={results.linkedin} query={query} />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          Made with ❤️ by{" "}
          <a
            href="https://www.linkedin.com/in/noashavit"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Noa Shavit
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
