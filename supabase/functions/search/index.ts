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

    const serpApiKey = apiKey || Deno.env.get("SERPAPI_KEY");
    if (!serpApiKey) {
      throw new Error("No SerpAPI key provided");
    }

    // ----- Common: Google + Trends -----
    const [googleResults, trendsData] = await Promise.all([
      fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&gl=us&hl=en&num=10&api_key=${serpApiKey}`
      ).then((r) => r.json()),
      fetch(
        `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(query)}&geo=US&date=today+12-m&api_key=${serpApiKey}`
      ).then((r) => r.json()),
    ]);

    // ----- Topic-specific: Wikipedia + Reddit (free APIs) -----
    let wikipedia = null;
    let reddit: any[] = [];
    let linkedinProfile = null;

    if (searchType === "topic") {
      // Wikipedia: free API
      const [wikiRes, redditRes] = await Promise.all([
        fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replace(/ /g, "_"))}`
        ).then((r) => r.json()).catch(() => null),
        fetch(
          `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=3&t=year`,
          { headers: { "User-Agent": "SearchInsights/1.0" } }
        ).then((r) => r.json()).catch(() => null),
      ]);

      if (wikiRes && wikiRes.type !== "disambiguation" && wikiRes.extract) {
        wikipedia = {
          title: wikiRes.title,
          extract: wikiRes.extract,
          url: wikiRes.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/ /g, "_"))}`,
          thumbnail: wikiRes.thumbnail?.source || null,
        };
      }

      // If no exact match, try search
      if (!wikipedia) {
        try {
          const searchRes = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&srlimit=1`
          ).then((r) => r.json());
          const firstResult = searchRes?.query?.search?.[0];
          if (firstResult) {
            const summaryRes = await fetch(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstResult.title.replace(/ /g, "_"))}`
            ).then((r) => r.json()).catch(() => null);
            if (summaryRes && summaryRes.extract) {
              wikipedia = {
                title: summaryRes.title,
                extract: summaryRes.extract,
                url: summaryRes.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(firstResult.title.replace(/ /g, "_"))}`,
                thumbnail: summaryRes.thumbnail?.source || null,
              };
            }
          }
        } catch { /* ignore */ }
      }

      // Reddit
      if (redditRes?.data?.children) {
        reddit = redditRes.data.children
          .filter((c: any) => c.data && !c.data.over_18)
          .slice(0, 3)
          .map((c: any) => ({
            title: c.data.title,
            url: `https://www.reddit.com${c.data.permalink}`,
            subreddit: c.data.subreddit_name_prefixed,
            score: c.data.score,
            num_comments: c.data.num_comments,
            created_utc: c.data.created_utc,
          }));
      }
    }

    // ----- Person-specific: LinkedIn profile via SerpAPI -----
    if (searchType === "person") {
      try {
        const profileRes = await fetch(
          `https://serpapi.com/search.json?q=${encodeURIComponent(query)}+site%3Alinkedin.com%2Fin%2F&gl=us&hl=en&num=3&api_key=${serpApiKey}`
        ).then((r) => r.json());

        const profiles = (profileRes.organic_results || []).filter(
          (r: any) => r.link && r.link.includes("linkedin.com/in/")
        );

        if (profiles.length > 0) {
          const p = profiles[0];
          linkedinProfile = {
            title: p.title,
            link: p.link,
            snippet: p.snippet,
            thumbnail: p.thumbnail || profileRes.knowledge_graph?.header_images?.[0]?.image || null,
          };
        }
      } catch (e) {
        console.error("LinkedIn profile fetch error:", e);
      }
    }

    // ----- LinkedIn posts (existing logic) -----
    const timeRanges = ["qdr:w", "qdr:m", "qdr:y", ""];
    let linkedinPosts: any[] = [];
    const TARGET_POSTS = 10;

    if (searchType === "person") {
      const nameClean = query.toLowerCase().trim();
      const slugNoSep = nameClean.replace(/[^a-z0-9]+/g, "");
      const slugHyphen = nameClean.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const slugs = [slugNoSep];
      if (slugHyphen !== slugNoSep) slugs.push(slugHyphen);

      const seenLinks = new Set<string>();

      for (const slug of slugs) {
        if (linkedinPosts.length >= TARGET_POSTS) break;
        for (const range of timeRanges) {
          if (linkedinPosts.length >= TARGET_POSTS) break;
          const linkedinQuery = `site:linkedin.com/posts/${slug}_`;
          const tbsParam = range ? `&tbs=sbd:1,${range}` : "&tbs=sbd:1";
          const res = await fetch(
            `https://serpapi.com/search.json?q=${encodeURIComponent(linkedinQuery)}&gl=us&hl=en&num=20${tbsParam}&sort=date&api_key=${serpApiKey}`
          ).then((r) => r.json());

          for (const p of (res.organic_results || [])) {
            if (linkedinPosts.length >= TARGET_POSTS) break;
            if (p.link && p.link.includes(`linkedin.com/posts/${slug}_`) && !seenLinks.has(p.link)) {
              seenLinks.add(p.link);
              linkedinPosts.push(p);
            }
          }
        }
      }

      if (linkedinPosts.length < TARGET_POSTS) {
        for (const range of timeRanges) {
          if (linkedinPosts.length >= TARGET_POSTS) break;
          const linkedinQuery = `site:linkedin.com/posts "${query}"`;
          const tbsParam = range ? `&tbs=sbd:1,${range}` : "&tbs=sbd:1";
          const res = await fetch(
            `https://serpapi.com/search.json?q=${encodeURIComponent(linkedinQuery)}&gl=us&hl=en&num=20${tbsParam}&sort=date&api_key=${serpApiKey}`
          ).then((r) => r.json());

          for (const p of (res.organic_results || [])) {
            if (linkedinPosts.length >= TARGET_POSTS) break;
            if (p.link && p.link.includes("linkedin.com/posts/") && !seenLinks.has(p.link)) {
              const slugs2 = [slugNoSep, slugHyphen];
              if (slugs2.some(slug => p.link.includes(`/posts/${slug}`))) {
                seenLinks.add(p.link);
                linkedinPosts.push(p);
              }
            }
          }
        }
      }
    } else {
      const seenLinks = new Set<string>();
      for (const range of timeRanges) {
        if (linkedinPosts.length >= TARGET_POSTS) break;
        const linkedinQuery = `site:linkedin.com/posts ${query}`;
        const tbsParam = range ? `&tbs=sbd:1,${range}` : "&tbs=sbd:1";
        const res = await fetch(
          `https://serpapi.com/search.json?q=${encodeURIComponent(linkedinQuery)}&gl=us&hl=en&num=20${tbsParam}&api_key=${serpApiKey}`
        ).then((r) => r.json());

        for (const p of (res.organic_results || [])) {
          if (linkedinPosts.length >= TARGET_POSTS) break;
          if (p.link && !seenLinks.has(p.link)) {
            seenLinks.add(p.link);
            linkedinPosts.push(p);
          }
        }
      }
    }

    // Extract date from LinkedIn activity ID
    function extractDateFromActivityId(url: string): string | null {
      const match = url.match(/activity-(\d+)/);
      if (!match) return null;
      const activityId = BigInt(match[1]);
      const timestampSeconds = Number(activityId >> 22n);
      const date = new Date(timestampSeconds * 1000);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split("T")[0];
    }

    const enrichedLinkedin = linkedinPosts
      .map((p: any) => ({
        ...p,
        date: extractDateFromActivityId(p.link) || p.date || p.rich_snippet?.top?.extensions?.[0] || null,
      }))
      .sort((a: any, b: any) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });

    const results = {
      google: googleResults.organic_results || [],
      trends: trendsData.interest_over_time?.timeline_data || [],
      linkedin: enrichedLinkedin,
      wikipedia,
      reddit,
      linkedinProfile,
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
