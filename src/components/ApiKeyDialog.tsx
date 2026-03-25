import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-react";

interface Props {
  open: boolean;
  onSubmit: (key: string) => void;
}

export function ApiKeyDialog({ open, onSubmit }: Props) {
  const [key, setKey] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) onSubmit(key.trim());
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Enter your SerpAPI Key
          </DialogTitle>
          <DialogDescription>
            Your key is stored only in this browser tab and never saved to our servers. Get one free at{" "}
            <a
              href="https://serpapi.com/manage-api-key"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              serpapi.com
            </a>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Paste your SerpAPI key…"
            type="password"
            className="font-mono text-sm"
            autoFocus
          />
          <DialogFooter>
            <Button type="submit" disabled={!key.trim()} className="w-full sm:w-auto">
              Continue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
