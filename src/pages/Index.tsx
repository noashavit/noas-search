import { useState } from "react";
import { Search, Loader2, Sparkles, KeyRound, User, BookOpen } from "lucide-react";
import { SearchProgress } from "@/components/SearchProgress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrendsChart } from "@/components/TrendsChart";
import { RelatedQueries } from "@/components/RelatedQueries";
import { GoogleResults } from "@/components/GoogleResults";
import { LinkedInPosts } from "@/components/LinkedInPosts";

import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import { AnalystSummary } from "@/components/AnalystSummary";
import { useSearch } from "@/hooks/useSearch";
import { useApiKey } from "@/hooks/useApiKey";

type SearchType = "topic" | "person";

const Index = () => {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("topic");
  const { results, loading, search, summary, summaryLoading, clearResults } = useSearch();
  const { apiKey, setApiKey, clearApiKey, hasApiKey } = useApiKey();

  const handleToggleSearchType = (type: SearchType) => {
    if (type !== searchType) {
      setSearchType(type);
      clearResults();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) search(query.trim(), apiKey, searchType);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ApiKeyDialog open={!hasApiKey} onSubmit={setApiKey} />

      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">Search Insights</h1>
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
          <div className="flex-1 flex-col gap-6 py-12 flex items-center justify-start">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mt-[100px]">
              Start researching!
            </h2>

            {/* Search Type Toggle */}
            <div className="gap-2 w-full max-w-3xl flex-row flex items-center justify-start">
              <button
                onClick={() => handleToggleSearchType("topic")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchType === "topic"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Topic
              </button>
              <button
                onClick={() => handleToggleSearchType("person")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchType === "person"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <User className="h-4 w-4" />
                Person
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-3 max-w-3xl w-full">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchType === "person" ? "Enter a person's name…" : "Search anything"}
                  className="pl-14 h-16 text-xl bg-card border-border/50 font-semibold opacity-90 px-[5px]"
                />
              </div>
              <Button type="submit" disabled={loading || !query.trim()} className="h-16 px-10 text-lg">
                Search
              </Button>
            </form>

            <p className="text-base text-foreground w-full text-center font-medium">
              Get a high-level analysis and detailed information about any person or topic.
            </p>
            <p className="text-sm text-muted-foreground w-full text-center my-0">
              Search trends. Top 10 search results. The 10 most recent LinkedIn posts
            </p>
          </div>
        )}

        {/* Search bar + results/loading */}
        {(results || loading) && (
          <div className="py-8 space-y-6">
            {/* Search Type Toggle */}
            <div className="flex items-center gap-2 max-w-3xl mx-auto w-full">
              <button
                onClick={() => handleToggleSearchType("topic")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchType === "topic"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Topic
              </button>
              <button
                onClick={() => handleToggleSearchType("person")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchType === "person"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <User className="h-4 w-4" />
                Person
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-3 max-w-3xl mx-auto w-full">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchType === "person" ? "Enter a person's name…" : "Search anything"}
                  className="pl-14 h-16 text-xl bg-card border-border/50 font-semibold opacity-90 px-[5px]"
                />
              </div>
              <Button type="submit" disabled={loading || !query.trim()} className="h-16 px-10 text-lg">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
              </Button>
            </form>

            {loading && <SearchProgress />}

            {results && !loading && (
              <div className="space-y-6">
                <AnalystSummary summary={summary} loading={summaryLoading} />
                <TrendsChart data={results.trends} query={query} />
                {results.relatedQueries && <RelatedQueries data={results.relatedQueries} />}

                <div className="grid gap-6 lg:grid-cols-2">
                  <GoogleResults results={results.google} />
                  <LinkedInPosts posts={results.linkedin} query={query} searchType={searchType} />
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
