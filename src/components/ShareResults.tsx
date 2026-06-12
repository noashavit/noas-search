import { useEffect, useState, RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateResultsPdf, pdfFilename } from "@/lib/exportPdf";
import { canShareFiles, shareOrDownloadPdf } from "@/lib/shareOrDownload";

interface Props {
  targetRef: RefObject<HTMLElement>;
  query: string;
}

export function ShareResults({ targetRef, query }: Props) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [shareMode, setShareMode] = useState(false);

  useEffect(() => {
    setShareMode(canShareFiles());
  }, []);

  const handleClick = async () => {
    if (!targetRef.current || busy) return;
    setBusy(true);
    try {
      const blob = await generateResultsPdf(targetRef.current, query);
      const filename = pdfFilename(query);
      const result = await shareOrDownloadPdf(blob, filename, {
        title: `Search Insights: ${query}`,
        text: `Search Insights report for "${query}"`,
      });
      if (result === "downloaded" && shareMode) {
        toast({ title: "PDF downloaded", description: filename });
      }
    } catch (err: any) {
      console.error("PDF export failed:", err);
      toast({
        title: "Couldn't generate PDF",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const Icon = busy ? Loader2 : shareMode ? Share2 : Download;
  const label = busy ? "Preparing…" : shareMode ? "Share" : "Export";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={busy}
      className="gap-2"
    >
      <Icon className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
      {label}
    </Button>
  );
}
