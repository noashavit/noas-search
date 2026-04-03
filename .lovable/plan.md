

## Spike Analysis for Google Trends

### Problem
When the trends chart shows spikes, users want to understand what caused them. Google Trends API doesn't directly provide news articles linked to specific data points.

### Approach: AI-powered spike detection + Google News search

**Step 1: Detect spikes in the trends data (frontend)**
- After receiving trends data, identify significant spikes: points where the value jumps more than 50% above the rolling average of neighboring points.
- For each spike, extract the date range string (e.g., "Mar 1 - 7, 2026").

**Step 2: Search Google News for spike dates (backend)**
- Add a new edge function `spike-analysis` that receives the query + spike date ranges.
- For each spike date, do a SerpAPI Google News search: `engine=google&tbm=nws&q={query}&tbs=cdr:1,cd_min:{start},cd_max:{end}` to find news articles from that period.
- Use the AI gateway to generate a brief explanation of what likely caused each spike based on the news articles found.

**Step 3: Display spike annotations on the chart (frontend)**
- Add clickable dots on spike points in the Recharts chart using a custom `dot` renderer.
- When a user clicks a spike dot, show a popover/tooltip with:
  - AI-generated explanation of the spike
  - Links to 2-3 news articles from that date range
- Show a "Spike Insights" section below the chart listing all detected spikes with explanations.

### Technical details

**New edge function: `supabase/functions/spike-analysis/index.ts`**
- Input: `{ query, spikes: [{ date, value }] }`
- For each spike, fetch Google News via SerpAPI filtered to that date range
- Pass news results to Lovable AI to generate a 1-2 sentence explanation per spike
- Return: `{ spikes: [{ date, value, explanation, articles: [{ title, link, source }] }] }`

**Modified files:**
- `src/components/TrendsChart.tsx` - Add spike detection logic, custom dot rendering with click handler, and popover for spike details
- `src/hooks/useSearch.ts` - Add spike analysis state and trigger after search results load
- `src/pages/Index.tsx` - Pass spike data to TrendsChart
- New: `src/components/SpikeInsights.tsx` - Section below chart showing all spike explanations with linked news articles

**Spike detection algorithm (client-side):**
```text
For each point i in timeline:
  avg = mean of values[i-2..i+2] excluding i
  if value[i] > avg * 1.5 and value[i] >= 40:
    mark as spike
```

**Build error fix:** Also fix the existing TS18046 errors by typing `error` as `unknown` in both edge functions' catch blocks.

### Cost consideration
Each spike triggers 1 SerpAPI call (news search) + 1 AI call for all spikes combined. Typically 1-3 spikes per query, so 1-3 extra SerpAPI calls + 1 AI call.

