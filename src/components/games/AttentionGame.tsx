import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Square } from "lucide-react";
import { GameFrame, useGameTracker, type GameProps } from "./GameEngine";
import { Button } from "@/components/ui/button";
import { ROUNDS_PER_LEVEL } from "@/lib/levels";
import { playTone } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { QuestionTimer } from "./QuestionTimer";

const TRIALS_PER_ROUND = 6;

const CONFIG: Record<number, { window: number; incongruent: number; switchRate: number; nogoRate: number }> = {
  1: { window: 2600, incongruent: 0.2, switchRate: 0, nogoRate: 0 },
  2: { window: 1900, incongruent: 0.5, switchRate: 0, nogoRate: 0 },
  3: { window: 1400, incongruent: 0.6, switchRate: 0, nogoRate: 0.15 },
  4: { window: 1100, incongruent: 0.65, switchRate: 0.3, nogoRate: 0.15 },
  5: { window: 850, incongruent: 0.7, switchRate: 0.4, nogoRate: 0.2 },
};

type Dir = "left" | "right";
interface Trial { middle: Dir; flank: Dir; swap: boolean; nogo: boolean }

function makeTrial(level: number): Trial {
  const c = CONFIG[level] ?? CONFIG[1]!;
  const middle: Dir = Math.random() < 0.5 ? "left" : "right";
  const flank: Dir = Math.random() < c.incongruent ? (middle === "left" ? "right" : "left") : middle;
  const nogo = Math.random() < c.nogoRate;
  return { middle, flank, nogo, swap: !nogo && Math.random() < c.switchRate };
}

function expected(t: Trial): Dir | null {
  if (t.nogo) return null;
  if (t.swap) return t.middle === "left" ? "right" : "left";
  return t.middle;
}

export function AttentionGame({ level, onComplete }: GameProps) {
  const cfg = CONFIG[level] ?? CONFIG[1]!;
  const { record, summarise, count } = useGameTracker();
  const [started, setStarted] = useState(false);
  const [trial, setTrial] = useState<Trial | null>(null);
  const [feedback, setFeedback] = useState<"positive" | "neutral" | null>(null);
  const shownAt = useRef(0);
  const responded = useRef(true);
  const completionSent = useRef(false);
  const total = ROUNDS_PER_LEVEL * TRIALS_PER_ROUND;

  const respond = useCallback(
    (dir: Dir | null, t: Trial) => {
      if (responded.current) return;
      responded.current = true;
      const want = expected(t);
      const correct = dir === want;
      const errorKey = correct
        ? undefined
        : want === null
          ? "impulsive-response"
          : dir === null
            ? "missed"
            : t.swap
              ? "rule-switch"
              : t.flank !== t.middle
                ? "distracted-by-flankers"
                : "direction";
      record({ correct, errorKey, level, ms: dir === null ? cfg.window : Date.now() - shownAt.current });
      setFeedback(correct ? "positive" : "neutral");
      setTrial(null);
      setTimeout(() => setFeedback(null), 250);
    },
    [record, level, cfg.window],
  );

  // Run trials: fixation → stimulus → window.
  useEffect(() => {
    if (!started || count >= total || trial) return;
    const t = makeTrial(level);
    const fix = setTimeout(() => {
      responded.current = false;
      shownAt.current = Date.now();
      setTrial(t);
    }, 450 + Math.random() * 500);
    return () => clearTimeout(fix);
  }, [started, count, total, trial, level]);

  useEffect(() => {
    if (!trial) return;
    const timer = setTimeout(() => respond(null, trial), cfg.window);
    return () => clearTimeout(timer);
  }, [trial, cfg.window, respond]);

  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      if (!trial) return;
      if (e.key === "ArrowLeft") respond("left", trial);
      if (e.key === "ArrowRight") respond("right", trial);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, trial, respond]);

  useEffect(() => {
    if (count === total && !completionSent.current) {
      completionSent.current = true;
      playTone("complete");
      onComplete(summarise(true));
    }
  }, [count, total, onComplete, summarise]);

  const rules = [
    "Arrows appear in a row. Respond to the direction of the MIDDLE arrow only — ignore the ones around it.",
    ...(cfg.nogoRate ? ["If the middle is a square ■, do NOT press anything."] : []),
    ...(cfg.switchRate ? ["If the arrows turn gold, press the OPPOSITE direction."] : []),
    `You have about ${(cfg.window / 1000).toFixed(1)} seconds per item. Use the buttons or ← → keys.`,
  ];

  if (!started) {
    return (
      <div className="surface-card p-6 md:p-10">
        <h3 className="font-display text-lg font-semibold">How it works</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {rules.map((r) => (
            <li key={r} className="flex gap-2">
              <span aria-hidden="true" className="text-accent-foreground">•</span>
              {r}
            </li>
          ))}
        </ul>
        <Button className="mt-6" size="lg" onClick={() => setStarted(true)}>
          I'm ready
        </Button>
      </div>
    );
  }

  const Arrow = (d: Dir) => (d === "left" ? ArrowLeft : ArrowRight);
  const round = Math.floor(count / TRIALS_PER_ROUND);
  const roundEnd = Math.min((round + 1) * TRIALS_PER_ROUND, total);
  const expireRound = () => {
    const unanswered = Math.max(0, roundEnd - count);
    for (let i = 0; i < unanswered; i += 1) {
      record({ correct: false, skipped: true, errorKey: "round-timeout", level, ms: 35000 });
    }
    setTrial(null);
  };

  return (
    <GameFrame
      step={Math.min(round, ROUNDS_PER_LEVEL - 1) + (count === total ? 1 : 0)}
      total={ROUNDS_PER_LEVEL}
      level={level}
      feedback={feedback}
      hint={rules[0]}
    >
      <QuestionTimer resetKey={round} onExpire={expireRound} paused={count >= total} />
      <div
        className={cn(
          "grid min-h-44 place-items-center rounded-2xl border-2 bg-muted/30 transition-colors",
          trial?.swap ? "border-accent bg-accent-soft" : "border-border",
        )}
        aria-live="assertive"
      >
        {trial ? (
          <div className={cn("flex items-center gap-1 sm:gap-3", trial.swap ? "text-accent-foreground" : "text-primary")}>
            {[0, 1, 2, 3, 4].map((i) => {
              if (i === 2 && trial.nogo) return <Square key={i} className="size-10 fill-current sm:size-14" aria-label="Square — do not press" />;
              const Icon = Arrow(i === 2 ? trial.middle : trial.flank);
              return <Icon key={i} className="size-10 sm:size-14" strokeWidth={2.75} aria-label={i === 2 ? `Middle arrow ${trial.middle}` : undefined} aria-hidden={i !== 2} />;
            })}
          </div>
        ) : (
          <span className="font-display text-3xl text-muted-foreground" aria-hidden="true">+</span>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Item {Math.min(count + 1, total)} of {total}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" className="h-16 text-base" onClick={() => trial && respond("left", trial)}>
          <ArrowLeft className="size-6" aria-hidden="true" /> Left
        </Button>
        <Button type="button" variant="outline" className="h-16 text-base" onClick={() => trial && respond("right", trial)}>
          Right <ArrowRight className="size-6" aria-hidden="true" />
        </Button>
      </div>
    </GameFrame>
  );
}
