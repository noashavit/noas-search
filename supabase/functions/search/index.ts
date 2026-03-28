import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, apiKey, searchType = "topic" } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use client-provided API key, fall back to server secret
    const serpApiKey = apiKey || Deno.env.get("SERPAPI_KEY");
    if (!serpApiKey) {
      throw new Error("No SerpAPI key provided");
    }

    // Fetch Google + Trends in parallel, then LinkedIn with recency fallback
    const [googleResults, trendsData] = await Promise.all([
      fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&gl=us&hl=en&num=10&api_key=${serpApiKey}`
      ).then((r) => r.json()),

      fetch(
        `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(query)}&geo=US&date=today+12-m&api_key=${serpApiKey}`
      ).then((r) => r.json()),
    ]);

    // LinkedIn: different query strategy for person vs topic
    const timeRanges = ["qdr:w", "qdr:m", "qdr:y"];
    let linkedinPosts: any[] = [];

    for (const range of timeRanges) {
      let linkedinQuery: string;
      if (searchType === "person") {
        // Convert name to LinkedIn slug: "Noa Shavit" -> "noashavit"
        const linkedinSlug = query.toLowerCase().trim().replace(/[^a-z0-9]+/g, "");
        // Match authored posts: linkedin.com/posts/noashavit_*
        linkedinQuery = `site:linkedin.com/posts/${linkedinSlug}_`;
      } else {
        linkedinQuery = `site:linkedin.com/posts ${query}`;
      }

      const res = await fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(linkedinQuery)}&gl=us&hl=en&num=10&tbs=sbd:1,${range}&api_key=${serpApiKey}`
      ).then((r) => r.json());

      const posts = res.organic_results || [];

      if (posts.length > 0) {
        linkedinPosts = posts;
        break;
      }
    }

    const results = {
      google: googleResults.organic_results || [],
      trends: trendsData.interest_over_time?.timeline_data || [],
      linkedin: linkedinPosts.map((p: any) => ({
        ...p,
        date: p.date || p.rich_snippet?.top?.extensions?.[0] || null,
      })),
    };

    // Save to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("searches").insert({
      query,
      results: results.google,
      trends_data: results.trends,
      linkedin_posts: results.linkedin,
      search_type: searchType,
    });

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Search error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
