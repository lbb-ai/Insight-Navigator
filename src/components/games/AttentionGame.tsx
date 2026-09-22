import { useCallback, useEffect, useRef, useState } from "react";
import { GameFrame, useGameTracker, type GameProps } from "./GameEngine";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TRIALS = 20;
const TARGET = "●";
const DISTRACTORS = ["■", "▲", "◆"];

function isTargetTrial(i: number) {
  return [0, 1, 3, 4, 6, 8, 9, 11, 13, 14, 16, 17, 19].includes(i);
}

export function AttentionGame({ onComplete }: GameProps) {
  const { record, summarise, count } = useGameTracker();
  const [trial, setTrial] = useState(0);
  const [showing, setShowing] = useState(false);
  const [feedback, setFeedback] = useState<"positive" | "neutral" | null>(null);
  const shownAt = useRef(0);
  const responded = useRef(false);
  const [started, setStarted] = useState(false);

  const target = isTargetTrial(trial);

  const next = useCallback(() => {
    setFeedback(null);
    setShowing(false);
    setTrial((t) => t + 1);
  }, []);

  useEffect(() => {
    if (!started || trial >= TRIALS) return;
    responded.current = false;
    const delay = 500 + ((trial * 137) % 700);
    const showTimer = setTimeout(() => {
      shownAt.current = Date.now();
      setShowing(true);
    }, delay);
    const endTimer = setTimeout(() => {
      if (!responded.current) {
        responded.current = true;
        // No tap: correct for a non-target, a miss for a target.
        record({
          correct: !isTargetTrial(trial),
          errorKey: isTargetTrial(trial) ? "missed-target" : "ok",
          level: 1,
          ms: 1400,
        });
        setFeedback(isTargetTrial(trial) ? "neutral" : "positive");
        setTimeout(next, 350);
      }
    }, delay + 1400);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(endTimer);
    };
  }, [trial, started, record, next]);

  useEffect(() => {
    if (count === TRIALS) onComplete(summarise(true));
  }, [count, onComplete, summarise]);

  const tap = () => {
    if (!showing || responded.current) return;
    responded.current = true;
    const ms = Date.now() - shownAt.current;
    const correct = target;
    record({ correct, errorKey: correct ? "ok" : "false-alarm", level: 1, ms });
    setFeedback(correct ? "positive" : "neutral");
    setTimeout(next, 350);
  };

  if (!started) {
    return (
      <div className="surface-card p-6 text-center md:p-10">
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Shapes will appear one at a time. Tap the button only when you see a{" "}
          <span className="font-display text-lg text-primary">{TARGET}</span> circle. Ignore the
          other shapes. It lasts about a minute.
        </p>
        <Button className="mt-6" size="lg" onClick={() => setStarted(true)}>
          I'm ready
        </Button>
      </div>
    );
  }

  return (
    <GameFrame
      step={Math.min(trial, TRIALS)}
      total={TRIALS}
      feedback={feedback}
      hint={`Tap only for ${TARGET}`}
    >
      <button
        type="button"
        onClick={tap}
        aria-label={showing ? (target ? "Target circle shown — tap now" : "Shape shown") : "Waiting"}
        className={cn(
          "grid min-h-56 w-full place-items-center rounded-2xl border-2 border-dashed border-border bg-muted/30 transition-colors duration-100",
          showing && "border-solid border-primary/40 bg-primary-soft",
        )}
      >
        <span className="font-display text-6xl text-primary" aria-hidden="true">
          {showing ? (target ? TARGET : DISTRACTORS[trial % DISTRACTORS.length]) : ""}
        </span>
      </button>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Tap anywhere in the panel above when the circle appears.
      </p>
    </GameFrame>
  );
}
