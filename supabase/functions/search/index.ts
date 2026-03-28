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
    const timeRanges = ["qdr:w", "qdr:m", "qdr:y", ""];
    let linkedinPosts: any[] = [];

    if (searchType === "person") {
      // Try multiple slug formats: "Noa Shavit" -> ["noashavit", "noa-shavit"]
      const nameClean = query.toLowerCase().trim();
      const slugNoSep = nameClean.replace(/[^a-z0-9]+/g, "");
      const slugHyphen = nameClean.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const slugs = [slugNoSep];
      if (slugHyphen !== slugNoSep) slugs.push(slugHyphen);

      // Strategy 1: strict slug-based URL search
      for (const slug of slugs) {
        if (linkedinPosts.length > 0) break;
        for (const range of timeRanges) {
          const linkedinQuery = `site:linkedin.com/posts/${slug}_`;
          const tbsParam = range ? `&tbs=sbd:1,${range}` : "&tbs=sbd:1";
          const res = await fetch(
            `https://serpapi.com/search.json?q=${encodeURIComponent(linkedinQuery)}&gl=us&hl=en&num=20${tbsParam}&sort=date&api_key=${serpApiKey}`
          ).then((r) => r.json());

          const posts = (res.organic_results || []).filter((p: any) =>
            p.link && p.link.includes(`linkedin.com/posts/${slug}_`)
          );

          if (posts.length > 0) {
            linkedinPosts = posts;
            break;
          }
        }
      }

      // Strategy 2: fallback — broader name search, filter by URL slug
      if (linkedinPosts.length === 0) {
        for (const range of timeRanges) {
          const linkedinQuery = `site:linkedin.com/posts "${query}"`;
          const tbsParam = range ? `&tbs=sbd:1,${range}` : "&tbs=sbd:1";
          const res = await fetch(
            `https://serpapi.com/search.json?q=${encodeURIComponent(linkedinQuery)}&gl=us&hl=en&num=20${tbsParam}&sort=date&api_key=${serpApiKey}`
          ).then((r) => r.json());

          const posts = (res.organic_results || []).filter((p: any) => {
            if (!p.link || !p.link.includes("linkedin.com/posts/")) return false;
            // Check if URL slug matches any of the person's slug variants
            return slugs.some(slug => p.link.includes(`/posts/${slug}`));
          });

          if (posts.length > 0) {
            linkedinPosts = posts;
            break;
          }
        }
      }
    } else {
      for (const range of timeRanges) {
        const linkedinQuery = `site:linkedin.com/posts ${query}`;
        const tbsParam = range ? `&tbs=sbd:1,${range}` : "&tbs=sbd:1";
        const res = await fetch(
          `https://serpapi.com/search.json?q=${encodeURIComponent(linkedinQuery)}&gl=us&hl=en&num=20${tbsParam}&api_key=${serpApiKey}`
        ).then((r) => r.json());

        const posts = res.organic_results || [];
        if (posts.length > 0) {
          linkedinPosts = posts;
          break;
        }
      }
    }

    // Extract date from LinkedIn activity ID in URL
    function extractDateFromActivityId(url: string): string | null {
      const match = url.match(/activity-(\d+)/);
      if (!match) return null;
      const activityId = BigInt(match[1]);
      const timestampSeconds = Number(activityId >> 22n);
      const date = new Date(timestampSeconds * 1000);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split("T")[0]; // YYYY-MM-DD
    }

    // Enrich posts with extracted dates and sort by recency
    const enrichedLinkedin = linkedinPosts
      .map((p: any) => ({
        ...p,
        date: extractDateFromActivityId(p.link) || p.date || p.rich_snippet?.top?.extensions?.[0] || null,
      }))
      .sort((a: any, b: any) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA; // newest first
      });

    const results = {
      google: googleResults.organic_results || [],
      trends: trendsData.interest_over_time?.timeline_data || [],
      linkedin: enrichedLinkedin,
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
