<img width="61.52" height="65.12" alt="icon" src="https://github.com/user-attachments/assets/7efd1558-963c-4b7b-b457-67e136ce86ca" />

# Search insights app


**Real-time research on any Topic or Person. Search Trends, rising queries, top results, and most relevant LinkedIn activity in one dashboard.**

🔗 **[Live app →](https://noas-search.lovable.app)**

---

## What it does

Prototype research tool built through AI experimentation. 

The prototype helps you do two things:
1. Get a high-level understanding of a Topic: Search trends, queries, top 10 results, recent LinkedIn posts, and AI summary.
2. Resources to learn more about any Topic or Person: A short list of the most relevant and recent links.

Type in a Topic or a Person to get back:

- **AI analyst briefing**: A structured synthesis covering what the term is, how interest is trending, what people are saying about it right now, and the single most important signal
- **Google Trends**: 12 months of US search interest, top queries, and rising queries. 
- **Top 10 Google results**: The highest-authority sources currently defining the Topic or Person
- **Live LinkedIn posts**: The 10 most recent posts mentioning the Topic, or authored by the Person

See it in action below!

https://github.com/user-attachments/assets/47cbb41c-d3ed-4dec-a355-166741c80bb6

---

## Search modes

**Topic Mode**: Research any concept, technology, or trend. See search trends, top and rising queries, top 10 search results, and the most recent LinkedIn activity. The LinkedIn feed surfaces the people that are actively talking about the Topic: which voices are defining it, what angles they're taking, and how the framing is evolving.

**Person Mode**: Learn more about the people shaping the industry. What they are known for and what they are currently thinking about. Here the LinkedIn feed surfaces the most recent posts they have written. Useful before meetings, outreach, or conference prep.

In Person Mode you're not reading *about* someone. You're reading what they've been publishing this week.

---

## How to use it

1. Go to [noas-search.lovable.app](https://noas-search.lovable.app)
2. Enter your SerpAPI key when prompted
3. Choose **Topic** or **Person** mode
4. Search

**On the API key:** it's entered at runtime in the UI and never stored server-side. You'll need to re-enter it each session. 
A free SerpAPI tier is available at [serpapi.com](https://serpapi.com) 

---

## Architecture

Built as a React + Vite single-page app, deployed via Lovable.

Data is fetched through SerpAPI, which provides a single clean interface across all three sources. 
The AI analyst briefing is generated server-side and synthesizes all data sources into a structured narrative.

The SerpAPI key is the only credential the app requires. 
It is passed at runtime, kept in session memory only, and never written to any server or storage layer.

The app will load without a valid SerpAPI key, but it will not return any results. 

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

You'll need a SerpAPI key to get results for your searches. 

---

## Built by

[Noa Shavit](https://www.linkedin.com/in/noashavit), product marketer and AI builder based in San Francisco.
