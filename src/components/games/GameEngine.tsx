import { useCallback, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, CircleDashed, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { GameMetrics, GameType } from "@/lib/games";

export type GameResult = Omit<GameMetrics, "game_type">;

export interface GameProps {
  onComplete: (result: GameResult) => void;
}

interface Answer {
  correct: boolean;
  ms: number;
  skipped: boolean;
  errorKey?: string;
  level: number;
}

/** Shared capture logic: accuracy, response time, skips, repeated-error patterns. */
export function useGameTracker() {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const startedAt = useRef<number>(Date.now());

  const beginItem = useCallback(() => {
    startedAt.current = Date.now();
  }, []);

  const record = useCallback(
    (input: { correct: boolean; skipped?: boolean; errorKey?: string; level?: number; ms?: number }) => {
      const ms = input.ms ?? Date.now() - startedAt.current;
      setAnswers((prev) => [
        ...prev,
        {
          correct: input.correct,
          ms,
          skipped: Boolean(input.skipped),
          errorKey: input.errorKey,
          level: input.level ?? 1,
        },
      ]);
    },
    [],
  );

  const summarise = useCallback(
    (completed: boolean): GameResult => {
      const total = answers.length || 1;
      const correct = answers.filter((a) => a.correct).length;
      const answered = answers.filter((a) => !a.skipped);
      const avg =
        answered.length > 0
          ? Math.round(answered.reduce((sum, a) => sum + a.ms, 0) / answered.length)
          : 0;

      const errorCounts = new Map<string, number>();
      answers
        .filter((a) => !a.correct && a.errorKey)
        .forEach((a) => errorCounts.set(a.errorKey!, (errorCounts.get(a.errorKey!) ?? 0) + 1));
      const repeated = [...errorCounts.values()].reduce(
        (sum, count) => sum + Math.max(0, count - 1),
        0,
      );

      return {
        accuracy: Math.round((correct / total) * 100),
        avg_response_time_ms: avg,
        skipped_items: answers.filter((a) => a.skipped).length,
        repeated_errors: repeated,
        difficulty_progression: answers.reduce((max, a) => Math.max(max, a.level), 1),
        completed,
      };
    },
    [answers],
  );

  return { answers, beginItem, record, summarise, count: answers.length };
}

export function GameFrame({
  step,
  total,
  hint,
  children,
  onSkip,
  feedback,
}: {
  step: number;
  total: number;
  hint?: string;
  children: ReactNode;
  onSkip?: () => void;
  feedback?: "positive" | "neutral" | null;
}) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b border-border bg-muted/40 px-5 py-3">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>
            Item {Math.min(step + 1, total)} of {total}
          </span>
          {feedback && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5",
                feedback === "positive" ? "text-risk-low" : "text-muted-foreground",
              )}
              role="status"
            >
              {feedback === "positive" ? (
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
              ) : (
                <CircleDashed className="size-3.5" aria-hidden="true" />
              )}
              {feedback === "positive" ? "Got it" : "Noted — keep going"}
            </span>
          )}
        </div>
        <Progress value={(step / total) * 100} className="mt-2 h-1.5" />
      </div>

      <div className="p-5 md:p-8">
        {hint && <p className="mb-4 text-sm text-muted-foreground">{hint}</p>}
        {children}
        {onSkip && (
          <div className="mt-6 flex justify-center">
            <Button type="button" variant="ghost" size="sm" onClick={onSkip}>
              <SkipForward className="size-4" aria-hidden="true" />
              Skip this one
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChoiceGrid({
  options,
  onChoose,
  disabled,
  chosen,
  columns = 2,
}: {
  options: string[];
  onChoose: (value: string) => void;
  disabled?: boolean;
  chosen?: string | null;
  columns?: 1 | 2;
}) {
  return (
    <div className={cn("grid gap-3", columns === 2 ? "sm:grid-cols-2" : "grid-cols-1")}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          disabled={disabled}
          onClick={() => onChoose(option)}
          className={cn(
            "min-h-14 rounded-xl border border-border bg-card px-4 py-3 text-left text-base font-medium transition-all duration-150",
            "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-lift)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            chosen === option && "border-primary bg-primary-soft",
            disabled && "opacity-70",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export const GAME_COMPONENT_KEYS: GameType[] = [
  "number",
  "word",
  "memory",
  "reading",
  "logic",
  "attention",
];
