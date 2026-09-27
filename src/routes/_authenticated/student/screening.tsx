import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Brain,
  Calculator,
  CheckCircle2,
  Lock,
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
import { LEVELS, levelLabel } from "@/lib/levels";
import { flushPendingResults, saveGameResult } from "@/lib/offline";
import type { GameResult } from "@/components/games/GameEngine";
import { NumberGame } from "@/components/games/NumberGame";
import { WordGame } from "@/components/games/WordGame";
import { MemoryGame } from "@/components/games/MemoryGame";
import { ReadingGame } from "@/components/games/ReadingGame";
import { LogicGame } from "@/components/games/LogicGame";
import { AttentionGame } from "@/components/games/AttentionGame";
import arcadeImage from "@/assets/arcade-games.jpg";

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

const COMPONENTS: Record<GameType, (p: { level: number; onComplete: (r: GameResult) => void }) => React.JSX.Element> = {
  number: NumberGame,
  word: WordGame,
  memory: MemoryGame,
  reading: ReadingGame,
  logic: LogicGame,
  attention: AttentionGame,
};

type LevelMap = Partial<Record<GameType, Record<number, GameResult>>>;
const lsKey = (id: string) => `ld-level-results:${id}`;

function combine(levels: Record<number, GameResult>): GameResult {
  const rs = Object.values(levels);
  const avg = (f: (r: GameResult) => number) => Math.round(rs.reduce((a, r) => a + f(r), 0) / rs.length);
  return {
    accuracy: avg((r) => r.accuracy),
    avg_response_time_ms: avg((r) => r.avg_response_time_ms),
    skipped_items: rs.reduce((a, r) => a + r.skipped_items, 0),
    repeated_errors: rs.reduce((a, r) => a + r.repeated_errors, 0),
    difficulty_progression: Math.max(...Object.keys(levels).map(Number)),
    completed: true,
  };
}

function ScreeningFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [done, setDone] = useState<GameType[]>([]);
  const [levels, setLevels] = useState<LevelMap>({});
  const [view, setView] = useState<{ kind: "hub" } | { kind: "levels"; game: GameType } | { kind: "play"; game: GameType; level: number }>({ kind: "hub" });
  const [finishing, setFinishing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [thresholds, setThresholds] = useState<Partial<Record<GameType, Thresholds>>>({});

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const bootstrap = async () => {
      const { data: consent } = await supabase.from("consents").select("id").eq("user_id", user.id).is("withdrawn_at", null).limit(1);
      if (!consent || consent.length === 0) {
        void navigate({ to: "/consent", replace: true });
        return;
      }
      await flushPendingResults();
      const { data: configs } = await supabase.from("game_configs").select("game_type, medium_threshold, high_threshold");
      if (configs) {
        const map: Partial<Record<GameType, Thresholds>> = {};
        configs.forEach((c) => {
          map[c.game_type as GameType] = { medium_threshold: Number(c.medium_threshold), high_threshold: Number(c.high_threshold) };
        });
        if (!cancelled) setThresholds(map);
      }
      const { data: existing } = await supabase.from("screening_sessions").select("id").eq("user_id", user.id).eq("status", "in_progress").order("started_at", { ascending: false }).limit(1);
      let id = existing?.[0]?.id ?? null;
      if (!id) {
        const { data: created, error } = await supabase.from("screening_sessions").insert({ user_id: user.id }).select("id").single();
        if (error) {
          toast.error("We couldn't start a session. Please try again.");
          return;
        }
        id = created.id;
        void logAudit(user.id, "screening_session_started", id);
      }
      const { data: results } = await supabase.from("game_results").select("game_type").eq("session_id", id);
      if (cancelled) return;
      setSessionId(id);
      setDone((results ?? []).map((r) => r.game_type as GameType));
      try {
        setLevels(JSON.parse(localStorage.getItem(lsKey(id)) ?? "{}") as LevelMap);
      } catch {
        /* ignore */
      }
      setLoading(false);
    };
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  const finalise = useCallback(async () => {
    if (!sessionId || !user) return;
    setFinishing(true);
    const id = sessionId;
    const { data: results } = await supabase.from("game_results").select("game_type, accuracy, avg_response_time_ms, skipped_items, repeated_errors, difficulty_progression, completed").eq("session_id", id);
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
      outcomes.map((o) => ({ session_id: id, user_id: user.id, area: o.area, risk_band: o.band, contributing_signals: o.signals })),
      { onConflict: "session_id,area" },
    );
    const band = overallBand(outcomes.map((o) => ({ risk_band: o.band })));
    await supabase.from("screening_sessions").update({ status: "completed", completed_at: new Date().toISOString(), overall_band: band }).eq("id", id);
    void logAudit(user.id, "screening_session_completed", id);
    void navigate({ to: "/student/results/$sessionId", params: { sessionId: id } });
  }, [navigate, thresholds, user, sessionId]);

  const playing = view.kind === "play" ? view : null;
  const handleComplete = useCallback(
    async (result: GameResult) => {
      if (!sessionId || !user || !playing) return;
      const { game, level } = playing;
      const nextLevels: LevelMap = { ...levels, [game]: { ...(levels[game] ?? {}), [level]: result } };
      setLevels(nextLevels);
      localStorage.setItem(lsKey(sessionId), JSON.stringify(nextLevels));
      const { queued } = await saveGameResult({ ...combine(nextLevels[game]!), game_type: game, session_id: sessionId, user_id: user.id });
      setOffline(queued);
      if (queued) toast("Saved on this device — we'll sync it when you're back online.");
      else toast.success(`${GAMES[game].title} · ${levelLabel(level)} saved`);
      setDone((d) => (d.includes(game) ? d : [...d, game]));
      setView({ kind: "levels", game });
    },
    [sessionId, user, playing, levels],
  );

  if (loading) {
    return (
      <AppShell title="Screening" description="Preparing your session…">
        <Skeleton className="h-64" />
      </AppShell>
    );
  }

  if (finishing) {
    return (
      <AppShell title="Putting your summary together" description="This only takes a moment.">
        <div className="surface-card grid place-items-center p-12 text-center">
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
        </div>
      </AppShell>
    );
  }

  const progress = (done.length / GAME_ORDER.length) * 100;
  const onBack = view.kind === "play" ? () => setView({ kind: "levels", game: view.game }) : view.kind === "levels" ? () => setView({ kind: "hub" }) : undefined;

  return (
    <AppShell
      title="Screening session"
      description="Choose any activity and level, in any order. There is no pass or fail."
      crumbs={[{ label: "Dashboard", to: "/student/dashboard" }, { label: "Screening" }]}
      onBack={onBack}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">{done.length} of {GAME_ORDER.length} activities played</span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="mt-2 h-2" />
        {offline && (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <CloudOff className="size-3.5" aria-hidden="true" /> Some results are saved on this device and will sync automatically.
          </p>
        )}
      </div>

      {view.kind === "hub" && (
        <>
          <div className="relative mb-6 overflow-hidden rounded-2xl">
            <img src={arcadeImage} alt="Glowing arcade cabinets showing colourful puzzle games" width={1536} height={640} className="h-40 w-full object-cover sm:h-56" />
            <div className="dashboard-photo-shade absolute inset-0" aria-hidden="true" />
            <div className="absolute inset-0 flex flex-col justify-center p-5 sm:p-8">
              <p className="font-display text-2xl font-bold text-hero-foreground sm:text-3xl">Ready, set, play.</p>
              <p className="mt-1 max-w-sm text-sm text-hero-muted">Pick any activity below. Take your time — every level is a fresh puzzle.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GAME_ORDER.map((g) => {
              const meta = GAMES[g];
              const Icon = ICONS[meta.icon as keyof typeof ICONS];
              const n = Object.keys(levels[g] ?? {}).length;
              return (
                <button key={g} type="button" onClick={() => setView({ kind: "levels", game: g })} className="surface-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent-foreground"><Icon className="size-5" aria-hidden="true" /></span>
                    {done.includes(g) && <CheckCircle2 className="size-5 text-risk-low" aria-label="Played" />}
                  </div>
                  <h2 className="mt-3 font-display text-lg font-semibold">{meta.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{meta.why}</p>
                  <p className="mt-3 text-xs font-semibold text-muted-foreground">{n} of {LEVELS.length} levels played</p>
                </button>
              );
            })}
          </div>
          <div className="surface-card mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
            <p className="text-sm text-muted-foreground">
              {done.length === GAME_ORDER.length ? "All six activities played — you can see your summary now, or keep playing more levels." : "Play at least one level of every activity to see your summary."}
            </p>
            <Button disabled={done.length < GAME_ORDER.length} onClick={() => void finalise()}>
              {done.length < GAME_ORDER.length && <Lock className="size-4" aria-hidden="true" />} See my summary
            </Button>
          </div>
          <NotDiagnosisNote className="mt-6" variant="subtle" />
        </>
      )}

      {view.kind === "levels" && (
        <div className="surface-card p-6 md:p-8">
          <h2 className="font-display text-2xl font-semibold">{GAMES[view.game].title}</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">{GAMES[view.game].why}</p>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">Each level has 5 rounds with fresh questions.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-5">
            {LEVELS.map((l) => {
              const r = levels[view.game]?.[l.n];
              return (
                <button key={l.n} type="button" onClick={() => setView({ kind: "play", game: view.game, level: l.n })} className={`rounded-xl border p-4 text-left transition-all hover:border-primary/50 hover:shadow-[var(--shadow-lift)] ${r ? "border-risk-low/40 bg-risk-low-soft" : "border-border bg-card"}`}>
                  <span className="text-xs text-muted-foreground">Level {l.n}</span>
                  <span className="block font-display font-semibold">{l.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{r ? "Played · play again" : "5 rounds"}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {playing && (() => {
        const Game = COMPONENTS[playing.game];
        return <Game key={`${playing.game}-${playing.level}`} level={playing.level} onComplete={handleComplete} />;
      })()}
    </AppShell>
  );
}
