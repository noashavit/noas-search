<img width="61.52" height="65.12" alt="icon" src="https://github.com/user-attachments/assets/7efd1558-963c-4b7b-b457-67e136ce86ca" />

# Search Insights 


**Real-time research on any topic or person: search trends, top results, and live LinkedIn posts in one dashboard.**

🔗 **[Live app →](https://noas-search.lovable.app)**

---

## What it does

Research is fragmented by default. Google Trends in one tab, LinkedIn in another, search results in a third, then a manual summary on top of it all.

Search Insights collapses that into a single query. Type a topic or a person's name and get back four things simultaneously:

- **AI analyst briefing**: A structured synthesis covering what the term is, how interest is trending, what people are saying about it right now, and the single most important signal
- **Google Trends chart**: 12 months of US search interest
- **Top and Rising queries**: In the US for in the past 12 months
- **Top 10 Google results**: The highest-authority sources currently defining the topic
- **Live LinkedIn posts**: The 10 most recent LinkedIn posts about the topic, or authored by the person

---

## Search modes

**Topic Mode**: Research any concept, technology, company, or trend. The LinkedIn feed surfaces who is actively talking about the topic right now: which voices are defining it, what angles they're taking, how the framing is evolving.

**Person Mode**: Research a specific individual. See how they appear in search and LinkedIn. Instead of posts that mention them, it pulls the most recent posts they authored, surfaced directly. Useful before meetings, outreach, or conference prep.

In Person Mode you're not reading *about* someone. You're reading what they've been publishing this week.

---

## How to use it

1. Go to [noas-search.lovable.app](https://noas-search.lovable.app)
2. Enter your SerpAPI key when prompted
3. Choose **Topic** or **Person** mode
4. Search

**On the API key:** it's entered at runtime in the UI and never stored server-side. You'll need to re-enter it each session. A free SerpAPI tier is available at [serpapi.com](https://serpapi.com).  

---

## Architecture

Built as a React + Vite single-page app, deployed via Lovable.

All external data — Google Search results, Google Trends, and LinkedIn posts — is fetched through SerpAPI, which provides a single clean interface across all three sources. The AI analyst briefing is generated server-side and synthesizes all data sources into a structured narrative on each query.

The SerpAPI key is the only credential the app requires from the user. It is passed at runtime, kept in session memory only, and never written to any server or storage layer.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| Deployment | Lovable |
| Data | SerpAPI (Google Search, Trends, LinkedIn) |
| AI summarization | Server-side, per query |
| Scope | US results |

---

## Local development

```bash
git clone https://github.com/noashavit/noas-search.git
cd noas-search
npm install
npm run dev
```

You'll need a SerpAPI key to run searches. Enter it in the UI when prompted — no `.env` file required.

---

## Built by

[Noa Shavit](https://www.linkedin.com/in/noashavit): Product marketer and AI builder based in San Francisco.
