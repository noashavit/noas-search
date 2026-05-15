import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "results";
}

export function pdfFilename(query: string): string {
  const date = new Date().toISOString().split("T")[0];
  return `search-insights-${slugify(query)}-${date}.pdf`;
}

interface LinkRect {
  href: string;
  // coordinates relative to the captured element, in CSS pixels
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

export async function generateResultsPdf(element: HTMLElement): Promise<Blob> {
  await new Promise((r) => requestAnimationFrame(() => r(null)));

  const bg = getComputedStyle(document.body).backgroundColor || "#ffffff";

  // Collect links BEFORE capture (DOM still in original state).
  const links = collectLinks(element);
  const sourceWidth = element.getBoundingClientRect().width;

  const canvas = await html2canvas(element, {
    backgroundColor: bg,
    scale: Math.min(window.devicePixelRatio || 1, 2),
    useCORS: true,
    logging: false,
  });

  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const imgWidth = pageW;
  const imgHeight = (canvas.height * pageW) / canvas.width;

  // Scale from CSS px (source) to PDF pt.
  const scale = pageW / sourceWidth;

  let heightLeft = imgHeight;
  let position = 0;
  const imgData = canvas.toDataURL("image/jpeg", 0.92);

  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
  addLinksForPage(pdf, links, scale, 0, pageH);
  let pageIndex = 1;
  heightLeft -= pageH;

  while (heightLeft > 0) {
    position -= pageH;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    addLinksForPage(pdf, links, scale, pageIndex * pageH, pageH);
    pageIndex += 1;
    heightLeft -= pageH;
  }

  return pdf.output("blob");
}

function addLinksForPage(
  pdf: jsPDF,
  links: LinkRect[],
  scale: number,
  pageOffsetPt: number,
  pageH: number
) {
  for (const link of links) {
    const x = link.x * scale;
    const y = link.y * scale;
    const w = link.w * scale;
    const h = link.h * scale;
    // Skip if link sits entirely outside this page.
    if (y + h < pageOffsetPt || y > pageOffsetPt + pageH) continue;
    const pageY = y - pageOffsetPt;
    // Clip to page bounds.
    const top = Math.max(0, pageY);
    const bottom = Math.min(pageH, pageY + h);
    const clippedH = bottom - top;
    if (clippedH <= 0) continue;
    pdf.link(x, top, w, clippedH, { url: link.href });
  }
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
