## Goal
One button on the results page that:
- **Desktop** → downloads a PDF of the results
- **Mobile** → opens the OS share sheet with the PDF attached (iMessage, WhatsApp, Mail, AirDrop, etc.)

## Simplest approach
Generate the PDF the same way in both cases, then branch on capability:

```ts
const file = new File([pdfBlob], filename, { type: "application/pdf" });

if (navigator.canShare?.({ files: [file] })) {
  await navigator.share({ files: [file], title, text });   // mobile path
} else {
  triggerDownload(pdfBlob, filename);                       // desktop path
}
```

`navigator.canShare({ files })` is the right detection — it's true on iOS Safari and Android Chrome, false on every desktop browser. No user-agent sniffing, no separate code paths to maintain.

The button label adapts: **Share** when `canShare` supports files, **Export PDF** otherwise. Same icon set works (`Share2` / `Download`).

## PDF generation
Client-side, no backend:
- `html2canvas-pro` (handles modern CSS color functions Recharts emits)
- `jspdf` (assembles A4 pages from the canvas)

Capture the results container ref (the wrapper around AnalystSummary → TrendsChart → RelatedQueries → GoogleResults → LinkedInPosts). Wait one animation frame so Recharts finishes painting, then snapshot, slice into A4 pages, output a `Blob`.

Filename: `search-insights-{query-slug}-{YYYY-MM-DD}.pdf`

## UX details
- Single button top-right of the results section
- States: idle → "Preparing PDF…" with spinner → done
- On mobile, if the user cancels the share sheet (`AbortError`), stay silent — no toast
- On any real failure, toast "Couldn't generate PDF"
- iOS Safari note: file share works; if the device ever rejects it, fall back to download — same `triggerDownload` helper

## Implementation
1. `bun add jspdf html2canvas-pro`
2. **`src/lib/exportPdf.ts`** — `generateResultsPdf(el, query): Promise<Blob>` + `triggerDownload(blob, filename)` helper
3. **`src/lib/shareOrDownload.ts`** — small wrapper that does the `canShare` branch
4. **`src/components/ShareResults.tsx`** — button with adaptive label/icon, owns the loading state
5. **`src/pages/Index.tsx`** — add `ref` on results container, render `<ShareResults>` above it (only when `results && !loading`)

## Files touched
- `package.json` (+2 deps)
- `src/lib/exportPdf.ts` (new)
- `src/lib/shareOrDownload.ts` (new)
- `src/components/ShareResults.tsx` (new)
- `src/pages/Index.tsx` (ref + button)

## Out of scope
- Server-rendered PDF
- Shareable public URL (separate feature — would need a saved-search route)
- CSV/JSON export
