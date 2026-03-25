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
    const { query, apiKey } = await req.json();
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

    // Fetch all three in parallel
    const [googleResults, trendsData, linkedinResults] = await Promise.all([
      // Google Search - top 10 US results
      fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&gl=us&hl=en&num=10&api_key=${serpApiKey}`
      ).then((r) => r.json()),

      // Google Trends - past 12 months US
      fetch(
        `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(query)}&geo=US&date=today+12-m&api_key=${serpApiKey}`
      ).then((r) => r.json()),

      // LinkedIn posts by the person
      fetch(
        `https://serpapi.com/search.json?q=site:linkedin.com/posts+${encodeURIComponent(query)}&gl=us&hl=en&num=10&tbs=sbd:1,qdr:y&api_key=${serpApiKey}`
      ).then((r) => r.json()),
    ]);

    const results = {
      google: googleResults.organic_results || [],
      trends: trendsData.interest_over_time?.timeline_data || [],
      linkedin: linkedinResults.organic_results || [],
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
