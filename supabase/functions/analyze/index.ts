import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { query, searchType, google, trends, linkedin } = await req.json();

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const isPerson = searchType === "person";

    const linkInstruction = isPerson
      ? "Do NOT include markdown links to external websites, tools, or services. However, when you quote or reference a specific LinkedIn post from the data below, you MUST wrap the quote or post title in a markdown link to that post's URL. For example: [\"59% of employees use unapproved AI tools\"](https://linkedin.com/posts/...)."
      : "When you mention specific tools, services, websites, companies, or people, include a markdown link to their homepage or relevant page. For example: [SerpAPI](https://serpapi.com), [LinkedIn](https://linkedin.com). Also link to sources from the Google results data when substantiating claims.";

    const socialSection = (linkedin && linkedin.length > 0)
      ? `3. **Recent Activity** — Summarize any notable LinkedIn activity or lack thereof.`
      : `3. **Recent Activity** — Note the absence of recent social media activity.`;

    const socialData = (linkedin && linkedin.length > 0)
      ? `LinkedIn Posts: ${JSON.stringify(linkedin?.slice(0, 5)?.map((p: any) => ({ title: p.title, snippet: p.snippet })))}`
      : `No social media posts found.`;

    const prompt = `You are a senior market/reputation analyst. Given SERP data for the query "${query}", write a concise analyst briefing (3-5 short paragraphs, ~200 words total).

Structure:
1. **Overview** — Who/what is this and their current positioning based on top Google results.
2. **Trend Analysis** — Interpret the Google Trends data. Is interest rising, falling, spiking? Call out any notable inflection points.
${socialSection}
4. **Key Takeaway** — One bold sentence summarizing the most important insight.

IMPORTANT: ${linkInstruction} Use plain language, be specific about data points, and highlight anything unusual or noteworthy.

DATA:
Top Google Results: ${JSON.stringify(google?.slice(0, 5)?.map((r: any) => ({ title: r.title, snippet: r.snippet, link: r.link })))}

Google Trends (monthly interest values): ${JSON.stringify(trends?.slice(-6)?.map((t: any) => ({ date: t.date, value: t.values?.[0]?.extracted_value })))}

${socialData}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a concise, data-driven analyst. Write in markdown. Be specific and avoid filler." },
          { role: "user", content: prompt },
        ],
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI request failed: ${response.status} ${err}`);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "Unable to generate summary.";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
