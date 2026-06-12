import type { jsPDF as JsPdf } from "jspdf";

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "results"
  );
}

export function pdfFilename(query: string): string {
  const date = new Date().toISOString().split("T")[0];
  return `search-insights-${slugify(query)}-${date}.pdf`;
}

interface LinkRect {
  href: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function collectLinks(root: HTMLElement): LinkRect[] {
  const rootRect = root.getBoundingClientRect();
  const anchors = root.querySelectorAll<HTMLAnchorElement>("a[href]");
  const links: LinkRect[] = [];
  anchors.forEach((a) => {
    const href = a.href;
    if (!href || href.startsWith("javascript:")) return;
    const rects = a.getClientRects();
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (r.width === 0 || r.height === 0) continue;
      links.push({
        href,
        x: r.left - rootRect.left,
        y: r.top - rootRect.top,
        w: r.width,
        h: r.height,
      });
    }
  });
  return links;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

const HEADER_TITLE = "Search Insights";
const MARGIN = 36;
const FOOTER_H = 30;
const FULL_HEADER_H = 80;
const RUN_HEADER_H = 48;

function drawFullHeader(
  pdf: JsPdf,
  logo: HTMLImageElement,
  query: string,
  dateStr: string,
  pageW: number
) {
  const logoSize = 18;
  const rowY = MARGIN - 6;

  pdf.addImage(logo, "PNG", MARGIN, rowY, logoSize, logoSize);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(20, 20, 30);
  pdf.text(HEADER_TITLE, MARGIN + logoSize + 8, rowY + 13);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(140, 140, 155);
  pdf.text(dateStr, pageW - MARGIN, rowY + 13, { align: "right" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(17);
  pdf.setTextColor(20, 20, 30);
  const queryTrim = query.length > 90 ? query.slice(0, 87) + "..." : query;
  pdf.text(queryTrim, MARGIN, rowY + logoSize + 18);

  pdf.setDrawColor(220, 220, 230);
  pdf.setLineWidth(0.5);
  const dividerY = rowY + logoSize + 28;
  pdf.line(MARGIN, dividerY, pageW - MARGIN, dividerY);
}

function drawRunningHeader(
  pdf: JsPdf,
  logo: HTMLImageElement,
  query: string,
  pageW: number
) {
  const logoSize = 14;
  const topY = MARGIN / 2 + 4;

  pdf.addImage(logo, "PNG", MARGIN, topY, logoSize, logoSize);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(20, 20, 30);
  pdf.text(HEADER_TITLE, MARGIN + logoSize + 6, topY + 11);

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(140, 140, 155);
  const titleW = pdf.getTextWidth(HEADER_TITLE);
  const queryTrim = query.length > 60 ? query.slice(0, 57) + "..." : query;
  pdf.text(
    `— ${queryTrim}`,
    MARGIN + logoSize + 6 + titleW + 6,
    topY + 11
  );

  pdf.setDrawColor(230, 230, 240);
  pdf.setLineWidth(0.4);
  const dividerY = topY + logoSize + 8;
  pdf.line(MARGIN, dividerY, pageW - MARGIN, dividerY);
}

function drawFooter(
  pdf: JsPdf,
  pageW: number,
  pageH: number,
  dateStr: string,
  pageNum: number,
  totalPages: number
) {
  const dividerY = pageH - 28;
  pdf.setDrawColor(230, 230, 240);
  pdf.setLineWidth(0.4);
  pdf.line(MARGIN, dividerY, pageW - MARGIN, dividerY);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(140, 140, 155);
  const textY = pageH - 14;
  pdf.text(HEADER_TITLE, MARGIN, textY);
  pdf.text(dateStr, pageW / 2, textY, { align: "center" });
  pdf.text(`Page ${pageNum} of ${totalPages}`, pageW - MARGIN, textY, {
    align: "right",
  });
}

export type Slice = { start: number; end: number; isFirst: boolean };

export function planSlices(
  cardTops: number[],
  totalHeight: number,
  contentH1: number,
  contentHN: number
): Slice[] {
  const edges = Array.from(new Set([...cardTops.slice(1), totalHeight]))
    .filter((v) => v > 0)
    .sort((a, b) => a - b);

  const slices: Slice[] = [];
  let cursor = 0;
  let isFirst = true;
  let guard = 0;
  while (cursor < totalHeight - 0.5 && guard < 200) {
    const availH = isFirst ? contentH1 : contentHN;
    const maxEnd = cursor + availH;
    let chosen = -1;
    for (const e of edges) {
      if (e > cursor + 1 && e <= maxEnd + 0.5 && e > chosen) chosen = e;
    }
    const sliceEnd = chosen > 0 ? chosen : Math.min(maxEnd, totalHeight);
    slices.push({ start: cursor, end: sliceEnd, isFirst });
    cursor = sliceEnd;
    isFirst = false;
    guard++;
  }
  return slices;
}

export async function generateResultsPdf(
  element: HTMLElement,
  query: string
): Promise<Blob> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  await new Promise((r) => requestAnimationFrame(() => r(null)));

  const bg = "#ffffff";
  const rootRect = element.getBoundingClientRect();
  const sourceWidth = rootRect.width;

  const cardEls = Array.from(
    element.querySelectorAll<HTMLElement>("[data-pdf-card]")
  );
  const cardTops = cardEls.map(
    (el) => el.getBoundingClientRect().top - rootRect.top
  );

  const links = collectLinks(element);

  const styleEl = document.createElement("style");
  styleEl.setAttribute("data-pdf-capture-style", "true");
  styleEl.textContent = `
    [data-pdf-capture] *, [data-pdf-capture] {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    [data-pdf-capture] .bg-card\\/50,
    [data-pdf-capture] .bg-card\\/80 {
      background-color: hsl(var(--card)) !important;
    }
  `;
  document.head.appendChild(styleEl);
  element.setAttribute("data-pdf-capture", "true");

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, {
      backgroundColor: bg,
      scale: Math.min(window.devicePixelRatio || 1, 2),
      useCORS: true,
      logging: false,
    });
  } finally {
    element.removeAttribute("data-pdf-capture");
    styleEl.remove();
  }
  const canvasScale = canvas.width / sourceWidth;
  const totalCssHeight = canvas.height / canvasScale;

  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const sx = pageW / sourceWidth;

  const contentH1Css = (pageH - FOOTER_H - FULL_HEADER_H) / sx;
  const contentHNCss = (pageH - FOOTER_H - RUN_HEADER_H) / sx;

  const slices = planSlices(cardTops, totalCssHeight, contentH1Css, contentHNCss);

  const logo = await loadImage("/pdf-logo.png");
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const totalPages = slices.length;

  for (let i = 0; i < slices.length; i++) {
    if (i > 0) pdf.addPage();
    const slice = slices[i];
    const headerH = slice.isFirst ? FULL_HEADER_H : RUN_HEADER_H;

    if (slice.isFirst) {
      drawFullHeader(pdf, logo, query, dateStr, pageW);
    } else {
      drawRunningHeader(pdf, logo, query, pageW);
    }

    const sliceCssH = slice.end - slice.start;
    const sliceCanvasY = Math.floor(slice.start * canvasScale);
    const sliceCanvasH = Math.max(
      1,
      Math.min(
        canvas.height - sliceCanvasY,
        Math.ceil(sliceCssH * canvasScale)
      )
    );
    const sub = document.createElement("canvas");
    sub.width = canvas.width;
    sub.height = sliceCanvasH;
    const ctx = sub.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, sub.width, sub.height);
    ctx.drawImage(
      canvas,
      0,
      sliceCanvasY,
      canvas.width,
      sliceCanvasH,
      0,
      0,
      canvas.width,
      sliceCanvasH
    );
    const dataUrl = sub.toDataURL("image/jpeg", 0.92);
    const sliceH_pt = sliceCssH * sx;
    pdf.addImage(dataUrl, "JPEG", 0, headerH, pageW, sliceH_pt);

    for (const link of links) {
      const linkBottom = link.y + link.h;
      if (linkBottom <= slice.start || link.y >= slice.end) continue;
      const top = Math.max(link.y, slice.start);
      const bottom = Math.min(linkBottom, slice.end);
      const clippedH = (bottom - top) * sx;
      if (clippedH <= 0) continue;
      const x = link.x * sx;
      const y_on_page = headerH + (top - slice.start) * sx;
      const w = link.w * sx;
      pdf.link(x, y_on_page, w, clippedH, { url: link.href });
    }

    drawFooter(pdf, pageW, pageH, dateStr, i + 1, totalPages);
  }

  return pdf.output("blob");
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
