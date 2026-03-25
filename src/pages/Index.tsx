import { useState, useEffect } from "react";
import { Search, Loader2, Sparkles, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrendsChart } from "@/components/TrendsChart";
import { GoogleResults } from "@/components/GoogleResults";
import { LinkedInPosts } from "@/components/LinkedInPosts";
import { SearchHistory } from "@/components/SearchHistory";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import { AnalystSummary } from "@/components/AnalystSummary";
import { useSearch } from "@/hooks/useSearch";
import { useApiKey } from "@/hooks/useApiKey";

const Index = () => {
  const [query, setQuery] = useState("");
  const { results, loading, search, history, loadHistory, summary, summaryLoading } = useSearch();
  const { apiKey, setApiKey, clearApiKey, hasApiKey } = useApiKey();

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) search(query.trim(), apiKey);
  };

  const handleHistorySelect = (q: string) => {
    setQuery(q);
    search(q, apiKey);
  };

  return (
    <div className="min-h-screen bg-background">
      <ApiKeyDialog open={!hasApiKey} onSubmit={setApiKey} />

      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">SERP Intel</h1>
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

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Search Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a name or keyword…"
              className="pl-10 h-12 text-base bg-card border-border/50"
            />
          </div>
          <Button type="submit" disabled={loading || !query.trim()} className="h-12 px-6">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </form>

        {/* Search History (shown before results) */}
        {!results && hasApiKey && <SearchHistory history={history} onSelect={handleHistorySelect} />}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">
              Fetching results, trends & LinkedIn posts…
            </p>
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div className="space-y-6">
            <AnalystSummary summary={summary} loading={summaryLoading} />
            <TrendsChart data={results.trends} query={query} />

            <div className="grid gap-6 lg:grid-cols-2">
              <GoogleResults results={results.google} />
              <LinkedInPosts posts={results.linkedin} query={query} />
            </div>

            {/* History below results */}
            <SearchHistory history={history} onSelect={handleHistorySelect} />
          </div>
        )}

        {/* Empty state */}
        {!results && !loading && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <Search className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Search anything</p>
              <p className="text-sm text-muted-foreground mt-1">
                Get top 10 Google results, Google Trends, and LinkedIn posts
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
