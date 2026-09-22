import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Brain,
  Calculator,
  CheckCircle2,
  CloudOff,
  Loader2,
  Puzzle,
  SpellCheck,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAudit, useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { NotDiagnosisNote } from "@/components/NotDiagnosisNote";
import { GAMES, GAME_ORDER, type GameMetrics, type GameType } from "@/lib/games";
import { classifySession, overallBand, type Thresholds } from "@/lib/scoring";
import { flushPendingResults, saveGameResult } from "@/lib/offline";
import type { GameResult } from "@/components/games/GameEngine";
import { NumberGame } from "@/components/games/NumberGame";
import { WordGame } from "@/components/games/WordGame";
import { MemoryGame } from "@/components/games/MemoryGame";
import { ReadingGame } from "@/components/games/ReadingGame";
import { LogicGame } from "@/components/games/LogicGame";
import { AttentionGame } from "@/components/games/AttentionGame";

export const Route = createFileRoute("/_authenticated/student/screening")({
  head: () => ({
    meta: [
      { title: "Screening activities — DUT Learning Disability Screening" },
      {
        name: "description",
        content:
          "Six short, game-based screening activities with a visible progress tracker. Pause any time — your progress is saved after each activity.",
      },
      { property: "og:title", content: "Screening activities — DUT Learning Disability Screening" },
      {
        property: "og:description",
        content: "Six short activities, about twenty minutes, saved as you go.",
      },
    ],
  }),
  component: ScreeningFlow,
});

const ICONS = { Calculator, SpellCheck, Brain, BookOpen, Puzzle, Target } as const;

const COMPONENTS: Record<GameType, (p: { onComplete: (r: GameResult) => void }) => React.JSX.Element> = {
  number: NumberGame,
  word: WordGame,
  memory: MemoryGame,
  reading: ReadingGame,
  logic: LogicGame,
  attention: AttentionGame,
};

function ScreeningFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [done, setDone] = useState<GameType[]>([]);
  const [phase, setPhase] = useState<"intro" | "playing" | "finishing">("intro");
  const [offline, setOffline] = useState(false);
  const [thresholds, setThresholds] = useState<Partial<Record<GameType, Thresholds>>>({});

  const current = useMemo(
    () => GAME_ORDER.find((g) => !done.includes(g)) ?? null,
    [done],
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const bootstrap = async () => {
      const { data: consent } = await supabase
        .from("consents")
        .select("id")
        .eq("user_id", user.id)
        .is("withdrawn_at", null)
        .limit(1);

      if (!consent || consent.length === 0) {
        void navigate({ to: "/consent", replace: true });
        return;
      }

      await flushPendingResults();

      const { data: configs } = await supabase
        .from("game_configs")
        .select("game_type, medium_threshold, high_threshold");
      if (configs) {
        const map: Partial<Record<GameType, Thresholds>> = {};
        configs.forEach((c) => {
          map[c.game_type as GameType] = {
            medium_threshold: Number(c.medium_threshold),
            high_threshold: Number(c.high_threshold),
          };
        });
        if (!cancelled) setThresholds(map);
      }

      const { data: existing } = await supabase
        .from("screening_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "in_progress")
        .order("started_at", { ascending: false })
        .limit(1);

      let id = existing?.[0]?.id ?? null;
      if (!id) {
        const { data: created, error } = await supabase
          .from("screening_sessions")
          .insert({ user_id: user.id })
          .select("id")
          .single();
        if (error) {
          toast.error("We couldn't start a session. Please try again.");
          return;
        }
        id = created.id;
        void logAudit(user.id, "screening_session_started", id);
      }

      const { data: results } = await supabase
        .from("game_results")
        .select("game_type")
        .eq("session_id", id);

      if (cancelled) return;
      setSessionId(id);
      setDone((results ?? []).map((r) => r.game_type as GameType));
      setLoading(false);
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  const finalise = useCallback(
    async (id: string) => {
      setPhase("finishing");
      const { data: results } = await supabase
        .from("game_results")
        .select("game_type, accuracy, avg_response_time_ms, skipped_items, repeated_errors, difficulty_progression, completed")
        .eq("session_id", id);

      const metrics: GameMetrics[] = (results ?? []).map((r) => ({
        game_type: r.game_type as GameType,
        accuracy: Number(r.accuracy),
        avg_response_time_ms: r.avg_response_time_ms,
        skipped_items: r.skipped_items,
        repeated_errors: r.repeated_errors,
        difficulty_progression: r.difficulty_progression,
        completed: r.completed,
      }));

      const outcomes = classifySession(metrics, thresholds);

      await supabase.from("risk_profiles").upsert(
        outcomes.map((o) => ({
          session_id: id,
          user_id: user!.id,
          area: o.area,
          risk_band: o.band,
          contributing_signals: o.signals,
        })),
        { onConflict: "session_id,area" },
      );

      const band = overallBand(outcomes.map((o) => ({ risk_band: o.band })));

      await supabase
        .from("screening_sessions")
        .update({ status: "completed", completed_at: new Date().toISOString(), overall_band: band })
        .eq("id", id);

      void logAudit(user!.id, "screening_session_completed", id);
      void navigate({ to: "/student/results/$sessionId", params: { sessionId: id } });
    },
    [navigate, thresholds, user],
  );

  const handleComplete = useCallback(
    async (result: GameResult) => {
      if (!sessionId || !user || !current) return;
      const { queued } = await saveGameResult({
        ...result,
        game_type: current,
        session_id: sessionId,
        user_id: user.id,
      });
      setOffline(queued);
      if (queued) {
        toast("Saved on this device — we'll sync it when you're back online.");
      } else {
        toast.success(`${GAMES[current].title} saved`);
      }
      const nextDone = [...done, current];
      setDone(nextDone);
      setPhase("intro");
      if (nextDone.length === GAME_ORDER.length) {
        await finalise(sessionId);
      }
    },
    [sessionId, user, current, done, finalise],
  );

  if (loading) {
    return (
      <AppShell title="Screening" description="Preparing your session…">
        <Skeleton className="h-64" />
      </AppShell>
    );
  }

  if (phase === "finishing" || !current) {
    return (
      <AppShell title="Putting your summary together" description="This only takes a moment.">
        <div className="surface-card grid place-items-center p-12 text-center">
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
          <p className="mt-4 text-sm text-muted-foreground">
            Reviewing your six activities and preparing a supportive summary.
          </p>
        </div>
      </AppShell>
    );
  }

  const meta = GAMES[current];
  const Icon = ICONS[meta.icon as keyof typeof ICONS];
  const Game = COMPONENTS[current];
  const progress = (done.length / GAME_ORDER.length) * 100;

  return (
    <AppShell
      title="Screening session"
      description="Six short activities. There is no pass or fail — answer as you naturally would."
      crumbs={[{ label: "Dashboard", to: "/student/dashboard" }, { label: "Screening" }]}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">
            Activity {done.length + 1} of {GAME_ORDER.length}
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="mt-2 h-2" />
        <ol className="mt-4 flex flex-wrap gap-2">
          {GAME_ORDER.map((g) => (
            <li
              key={g}
              className={`rounded-full border px-3 py-1 text-xs ${
                done.includes(g)
                  ? "border-risk-low/30 bg-risk-low-soft font-semibold text-risk-low"
                  : g === current
                    ? "border-primary bg-primary-soft font-semibold text-primary"
                    : "border-border text-muted-foreground"
              }`}
            >
              {done.includes(g) && (
                <CheckCircle2 className="mr-1 inline size-3" aria-hidden="true" />
              )}
              {GAMES[g].title}
            </li>
          ))}
        </ol>
        {offline && (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <CloudOff className="size-3.5" aria-hidden="true" />
            Some results are saved on this device and will sync automatically.
          </p>
        )}
      </div>

      {phase === "intro" ? (
        <div className="surface-card p-6 md:p-10">
          <span className="grid size-12 place-items-center rounded-xl bg-accent-soft text-accent-foreground">
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-display text-2xl font-semibold">{meta.title}</h2>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">{meta.why}</p>
          <p className="mt-4 text-xs font-semibold text-muted-foreground">
            About {meta.minutes} minutes · You can skip any item you'd rather not answer
          </p>
          <Button size="lg" className="mt-6" onClick={() => setPhase("playing")}>
            Start {meta.title}
          </Button>
          <NotDiagnosisNote className="mt-8" variant="subtle" />
        </div>
      ) : (
        <Game onComplete={handleComplete} />
      )}
    </AppShell>
  );
}
