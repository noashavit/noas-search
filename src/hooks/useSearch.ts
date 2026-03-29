import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface GoogleResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  displayed_link?: string;
}

export interface TrendsPoint {
  date: string;
  values: { query: string; value: string; extracted_value: number }[];
}

export interface LinkedInPost {
  title: string;
  link: string;
  snippet: string;
  displayed_link?: string;
  date?: string;
}

export interface WikipediaResult {
  title: string;
  extract: string;
  url: string;
  thumbnail?: string | null;
}

export interface RedditThread {
  title: string;
  url: string;
  subreddit: string;
  score: number;
  num_comments: number;
  created_utc: number;
}

export interface LinkedInProfile {
  title: string;
  link: string;
  snippet: string;
  thumbnail?: string | null;
}

export interface SearchResults {
  google: GoogleResult[];
  trends: TrendsPoint[];
  linkedin: LinkedInPost[];
  wikipedia?: WikipediaResult | null;
  reddit?: RedditThread[];
  linkedinProfile?: LinkedInProfile | null;
}

export interface SearchHistory {
  id: string;
  query: string;
  created_at: string;
}

export function useSearch() {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const { toast } = useToast();

  const search = async (query: string, apiKey?: string, searchType: string = "topic") => {
    setLoading(true);
    setSummary(null);
    try {
      const { data, error } = await supabase.functions.invoke("search", {
        body: { query, apiKey, searchType },
      });
      if (error) throw error;
      const searchResults = data as SearchResults;
      setResults(searchResults);
      await loadHistory();

      setSummaryLoading(true);
      supabase.functions
        .invoke("analyze", {
          body: {
            query,
            google: searchResults.google,
            trends: searchResults.trends,
            linkedin: searchResults.linkedin,
          },
        })
        .then(({ data: analyzeData, error: analyzeError }) => {
          if (analyzeError) {
            console.error("Analyze error:", analyzeError);
          } else {
            setSummary(analyzeData?.summary || null);
          }
        })
        .finally(() => setSummaryLoading(false));
    } catch (err: any) {
      toast({
        title: "Search failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    const { data } = await supabase
      .from("searches")
      .select("id, query, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setHistory(data);
  };

  const clearResults = () => {
    setResults(null);
    setSummary(null);
  };

  return { results, loading, search, history, loadHistory, summary, summaryLoading, clearResults };
}
