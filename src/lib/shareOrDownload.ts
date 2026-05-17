import { triggerDownload } from "./exportPdf";

export type ShareResult = "shared" | "downloaded" | "cancelled";

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}

export async function shareOrDownloadPdf(
  blob: Blob,
  filename: string,
  meta: { title: string; text?: string }
): Promise<ShareResult> {
  const file = new File([blob], filename, { type: "application/pdf" });
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };

  if (isMobile() && nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: meta.title, text: meta.text });
      return "shared";
    } catch (err: any) {
      if (err?.name === "AbortError") return "cancelled";
    }
  }

  triggerDownload(blob, filename);
  return "downloaded";
}

export function canShareFiles(): boolean {
  if (!isMobile()) return false;
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };
  try {
    const probe = new File([new Blob(["x"])], "probe.pdf", {
      type: "application/pdf",
    });
    return !!(nav.canShare?.({ files: [probe] }) && nav.share);
  } catch {
    return false;
  }
}
