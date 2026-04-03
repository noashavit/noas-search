import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SpikeInput {
  date: string;
  value: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, spikes, apiKey } = await req.json() as {
      query: string;
      spikes: SpikeInput[];
      apiKey?: string;
    };

    if (!query || !spikes?.length) {
      return new Response(JSON.stringify({ error: "Query and spikes required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serpApiKey = apiKey || Deno.env.get("SERPAPI_KEY");
    if (!serpApiKey) throw new Error("No SerpAPI key provided");

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    // For each spike, search Google News around that date range
    const spikeResults = await Promise.all(
      spikes.slice(0, 5).map(async (spike) => {
        // Parse date range like "Mar 1 – 7, 2026" or "Mar 1 - 7, 2026"
        const dateRange = parseDateRange(spike.date);
        
        let tbsParam = "";
        if (dateRange) {
          const { start, end } = dateRange;
          tbsParam = `&tbs=cdr:1,cd_min:${encodeURIComponent(start)},cd_max:${encodeURIComponent(end)}`;
        }

        const newsUrl = `https://serpapi.com/search.json?engine=google&tbm=nws&q=${encodeURIComponent(query)}&gl=us&hl=en&num=5${tbsParam}&api_key=${serpApiKey}`;
        
        const res = await fetch(newsUrl);
        const data = await res.json();
        const articles = (data.news_results || []).slice(0, 3).map((a: any) => ({
          title: a.title,
          link: a.link,
          source: a.source?.name || a.source || "",
          snippet: a.snippet || "",
        }));

        return { date: spike.date, value: spike.value, articles };
      })
    );

    // Use AI to generate explanations for all spikes at once
    const aiPrompt = `You are a concise analyst. For each date range below, explain in 1-2 sentences what likely caused the spike in search interest for "${query}" based on the news articles found. Be specific about events, announcements, or incidents. If no articles were found, say the cause is unclear.

${spikeResults.map((s, i) => `Spike ${i + 1} (${s.date}, interest: ${s.value}/100):
${s.articles.length ? s.articles.map((a: any) => `- ${a.title} (${a.source}): ${a.snippet}`).join("\n") : "No news articles found for this period."}`).join("\n\n")}

Return a JSON array of objects with "date" and "explanation" fields. Only return the JSON array, no other text.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You return only valid JSON. No markdown fences." },
          { role: "user", content: aiPrompt },
        ],
        max_tokens: 800,
      }),
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      throw new Error(`AI request failed: ${aiResponse.status} ${err}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "[]";
    
    let explanations: { date: string; explanation: string }[] = [];
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      explanations = JSON.parse(cleaned);
    } catch {
      explanations = spikeResults.map((s) => ({ date: s.date, explanation: "Unable to determine cause." }));
    }

    // Merge explanations with articles
    const result = spikeResults.map((s) => {
      const exp = explanations.find((e) => e.date === s.date);
      return {
        date: s.date,
        value: s.value,
        explanation: exp?.explanation || "Unable to determine cause.",
        articles: s.articles,
      };
    });

    return new Response(JSON.stringify({ spikes: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Spike analysis error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function parseDateRange(dateStr: string): { start: string; end: string } | null {
  // Handle formats like "Mar 1 – 7, 2026" or "Feb 23 – Mar 1, 2026"
  try {
    const cleaned = dateStr.replace(/–/g, "-").replace(/\s+/g, " ").trim();
    const parts = cleaned.split(" - ");
    if (parts.length !== 2) return null;

    const left = parts[0].trim(); // e.g. "Mar 1"
    const right = parts[1].trim(); // e.g. "7, 2026" or "Mar 1, 2026"

    // Extract year from right side
    const yearMatch = right.match(/(\d{4})/);
    if (!yearMatch) return null;
    const year = yearMatch[1];

    // Parse end date
    let endDate: string;
    const rightHasMonth = right.match(/^[A-Za-z]/);
    if (rightHasMonth) {
      endDate = right; // "Mar 1, 2026"
    } else {
      // Same month as left side
      const leftMonth = left.match(/^([A-Za-z]+)/)?.[1] || "";
      endDate = `${leftMonth} ${right}`; // "Mar 7, 2026"
    }

    // Format for SerpAPI: MM/DD/YYYY
    const startFull = `${left}, ${year}`;
    const startD = new Date(startFull);
    const endD = new Date(endDate);

    if (isNaN(startD.getTime()) || isNaN(endD.getTime())) return null;

    const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    return { start: fmt(startD), end: fmt(endD) };
  } catch {
    return null;
  }
}
