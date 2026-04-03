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

export interface RelatedQuery {
  query: string;
  value: number | string;
}

export interface RelatedQueries {
  top: RelatedQuery[];
  rising: RelatedQuery[];
}

export interface SearchResults {
  google: GoogleResult[];
  trends: TrendsPoint[];
  linkedin: LinkedInPost[];
  relatedQueries?: RelatedQueries;
}

export interface SearchHistory {
  id: string;
  query: string;
  created_at: string;
}

export interface SpikeResult {
  date: string;
  value: number;
  explanation: string;
  articles: { title: string; link: string; source: string }[];
}

function detectSpikes(trends: TrendsPoint[]): { date: string; value: number }[] {
  const values = trends.map((t) => t.values?.[0]?.extracted_value ?? 0);
  const spikes: { date: string; value: number }[] = [];

  for (let i = 0; i < values.length; i++) {
    if (values[i] < 40) continue;
    const neighbors: number[] = [];
    for (let j = Math.max(0, i - 2); j <= Math.min(values.length - 1, i + 2); j++) {
      if (j !== i) neighbors.push(values[j]);
    }
    if (!neighbors.length) continue;
    const avg = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
    if (values[i] > avg * 1.5) {
      spikes.push({ date: trends[i].date, value: values[i] });
    }
  }
  return spikes;
}

export function useSearch() {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [spikeData, setSpikeData] = useState<SpikeResult[]>([]);
  const [spikeLoading, setSpikeLoading] = useState(false);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const { toast } = useToast();

  const search = async (query: string, apiKey?: string, searchType: string = "topic") => {
    setLoading(true);
    setSummary(null);
    setSpikeData([]);
    setSpikeLoading(false);
    try {
      const { data, error } = await supabase.functions.invoke("search", {
        body: { query, apiKey, searchType },
      });
      if (error) throw error;
      const searchResults = data as SearchResults;
      setResults(searchResults);
      await loadHistory();

      // Kick off AI summary in background
      setSummaryLoading(true);
      supabase.functions
        .invoke("analyze", {
          body: {
            query,
            searchType,
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

      // Kick off spike analysis if spikes detected
      const spikes = detectSpikes(searchResults.trends);
      if (spikes.length > 0) {
        setSpikeLoading(true);
        supabase.functions
          .invoke("spike-analysis", {
            body: { query, spikes, apiKey },
          })
          .then(({ data: spikeRes, error: spikeErr }) => {
            if (spikeErr) {
              console.error("Spike analysis error:", spikeErr);
            } else {
              setSpikeData(spikeRes?.spikes || []);
            }
          })
          .finally(() => setSpikeLoading(false));
      }
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
    setSpikeData([]);
  };

  return { results, loading, search, history, loadHistory, summary, summaryLoading, spikeData, spikeLoading, clearResults };
}
