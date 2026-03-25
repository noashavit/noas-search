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
}

export interface SearchResults {
  google: GoogleResult[];
  trends: TrendsPoint[];
  linkedin: LinkedInPost[];
}

export interface SearchHistory {
  id: string;
  query: string;
  created_at: string;
}

export function useSearch() {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const { toast } = useToast();

  const search = async (query: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("search", {
        body: { query },
      });
      if (error) throw error;
      setResults(data as SearchResults);
      await loadHistory();
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

  return { results, loading, search, history, loadHistory };
}
