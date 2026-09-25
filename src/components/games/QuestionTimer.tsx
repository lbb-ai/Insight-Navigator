import { useEffect, useRef, useState } from "react";
import { Clock3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const QUESTION_SECONDS = 35;

export function QuestionTimer({
  resetKey,
  onExpire,
  paused = false,
  seconds = QUESTION_SECONDS,
}: {
  resetKey: string | number;
  onExpire: () => void;
  paused?: boolean;
  seconds?: number;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const expireRef = useRef(onExpire);
  const firedRef = useRef(false);

  useEffect(() => {
    expireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    setRemaining(seconds);
    firedRef.current = false;
  }, [resetKey, seconds]);

  useEffect(() => {
    if (paused || firedRef.current) return;
    const timer = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          if (!firedRef.current) {
            firedRef.current = true;
            window.setTimeout(() => expireRef.current(), 0);
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [paused, resetKey]);

  const runningLow = remaining <= 10;
  return (
    <div className="mb-5" aria-live={runningLow ? "polite" : "off"}>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-semibold">
        <span className="text-muted-foreground">Time for this question</span>
        <span className={cn("inline-flex items-center gap-1.5 tabular-nums", runningLow ? "text-timer-urgent" : "text-foreground")}>
          <Clock3 className="size-3.5" aria-hidden="true" />
          0:{remaining.toString().padStart(2, "0")}
        </span>
      </div>
      <Progress
        value={(remaining / seconds) * 100}
        className={cn("h-1.5", runningLow && "[&_[data-slot=progress-indicator]]:bg-timer-urgent")}
      />
    </div>
  );
}