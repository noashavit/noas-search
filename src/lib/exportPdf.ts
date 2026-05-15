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

export async function generateResultsPdf(element: HTMLElement): Promise<Blob> {
  // Wait one frame so any pending chart/layout work paints.
  await new Promise((r) => requestAnimationFrame(() => r(null)));

  const bg = getComputedStyle(document.body).backgroundColor || "#ffffff";

  const canvas = await html2canvas(element, {
    backgroundColor: bg,
    scale: Math.min(window.devicePixelRatio || 1, 2),
    useCORS: true,
    logging: false,
  });

  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // Scale canvas width to PDF page width and paginate by slicing.
  const imgWidth = pageW;
  const imgHeight = (canvas.height * pageW) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;
  const imgData = canvas.toDataURL("image/jpeg", 0.92);

  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageH;

  while (heightLeft > 0) {
    position -= pageH;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageH;
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
