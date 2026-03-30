import { Progress } from "@/components/ui/progress";
import { Search, TrendingUp, Linkedin, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

const STEPS = [
  { label: "Fetching Google results…", icon: Search },
  { label: "Loading search trends…", icon: TrendingUp },
  { label: "Pulling LinkedIn posts…", icon: Linkedin },
  { label: "Almost there…", icon: CheckCircle2 },
];

export function SearchProgress() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 2000),
      setTimeout(() => setStep(2), 4500),
      setTimeout(() => setStep(3), 8000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const progress = Math.min(((step + 1) / STEPS.length) * 100, 95);
  const CurrentIcon = STEPS[step].icon;

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 max-w-md mx-auto w-full">
      <Progress value={progress} className="h-2 w-full" />
      <div className="flex items-center gap-2.5">
        <CurrentIcon className="h-5 w-5 text-primary animate-pulse" />
        <p className="text-sm text-muted-foreground font-medium">
          {STEPS[step].label}
        </p>
      </div>
    </div>
  );
}
