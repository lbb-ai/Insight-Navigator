import { useEffect, useState } from "react";
import { GameFrame, useGameTracker, type GameProps } from "./GameEngine";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TILES = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M"];
const ROUNDS = 8;

function sequenceFor(round: number): string[] {
  const length = Math.min(3 + Math.floor(round / 2), 7);
  const pool = [...TILES];
  const seq: string[] = [];
  for (let i = 0; i < length; i += 1) {
    const idx = (round * 7 + i * 5) % pool.length;
    seq.push(pool.splice(idx, 1)[0]!);
  }
  return seq;
}

export function MemoryGame({ onComplete }: GameProps) {
  const { beginItem, record, summarise, count } = useGameTracker();
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<"show" | "recall">("show");
  const [visible, setVisible] = useState(0);
  const [entry, setEntry] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"positive" | "neutral" | null>(null);

  const sequence = sequenceFor(round);

  useEffect(() => {
    if (phase !== "show") return;
    setVisible(0);
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setVisible(i);
      if (i >= sequence.length) {
        clearInterval(timer);
        setTimeout(() => {
          setPhase("recall");
          beginItem();
        }, 600);
      }
    }, 750);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, phase]);

  useEffect(() => {
    if (count === ROUNDS) onComplete(summarise(true));
  }, [count, onComplete, summarise]);

  const submit = (answer: string[]) => {
    const correct = answer.join("") === sequence.join("");
    setFeedback(correct ? "positive" : "neutral");
    record({
      correct,
      errorKey: `span-${sequence.length}`,
      level: sequence.length - 2,
    });
    setTimeout(() => {
      setEntry([]);
      setFeedback(null);
      setPhase("show");
      setRound((r) => r + 1);
    }, 700);
  };

  const tap = (tile: string) => {
    const next = [...entry, tile];
    setEntry(next);
    if (next.length === sequence.length) submit(next);
  };

  const options = [...new Set([...sequence, ...TILES])].slice(0, 9);

  return (
    <GameFrame
      step={round}
      total={ROUNDS}
      feedback={feedback}
      hint={
        phase === "show"
          ? "Watch the sequence carefully."
          : "Now tap the letters in the same order."
      }
      onSkip={
        phase === "recall" && !feedback
          ? () => {
              record({
                correct: false,
                skipped: true,
                errorKey: `span-${sequence.length}`,
                level: sequence.length - 2,
              });
              setEntry([]);
              setPhase("show");
              setRound((r) => r + 1);
            }
          : undefined
      }
    >
      {phase === "show" ? (
        <div className="flex min-h-40 items-center justify-center gap-3" aria-live="polite">
          {sequence.map((tile, i) => (
            <span
              key={`${tile}-${i}`}
              className={cn(
                "grid size-14 place-items-center rounded-xl border font-display text-2xl font-semibold transition-all duration-300 md:size-16",
                i < visible
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-dashed border-border bg-muted/40 text-transparent",
              )}
            >
              {i < visible ? tile : "•"}
            </span>
          ))}
        </div>
      ) : (
        <div>
          <div className="mb-5 flex min-h-14 items-center justify-center gap-2" aria-live="polite">
            {sequence.map((_, i) => (
              <span
                key={i}
                className="grid size-11 place-items-center rounded-lg border border-border bg-muted/40 font-display text-lg font-semibold"
              >
                {entry[i] ?? ""}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {options.map((tile) => (
              <Button
                key={tile}
                type="button"
                variant="outline"
                className="h-14 font-display text-lg"
                onClick={() => tap(tile)}
                disabled={!!feedback}
              >
                {tile}
              </Button>
            ))}
          </div>
          {entry.length > 0 && !feedback && (
            <div className="mt-4 flex justify-center">
              <Button variant="ghost" size="sm" onClick={() => setEntry([])}>
                Clear entry
              </Button>
            </div>
          )}
        </div>
      )}
    </GameFrame>
  );
}
