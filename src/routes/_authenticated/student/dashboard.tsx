import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, ClipboardCheck, PlayCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/RiskBadge";
import { NotDiagnosisNote } from "@/components/NotDiagnosisNote";
import { Skeleton } from "@/components/ui/skeleton";
import { GAME_ORDER } from "@/lib/games";
import type { RiskBand } from "@/lib/scoring";

export const Route = createFileRoute("/_authenticated/student/dashboard")({
  head: () => ({
    meta: [
      { title: "Your dashboard — DUT Learning Disability Screening" },
      {
        name: "description",
        content:
          "Track your screening progress, revisit past sessions and see the next steps agreed with the Disability Unit.",
      },
      { property: "og:title", content: "Your dashboard — DUT Learning Disability Screening" },
      {
        property: "og:description",
        content: "Screening progress, past sessions and supportive next steps in one place.",
      },
    ],
  }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const { user, profile } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["student-dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [consent, sessions, referrals] = await Promise.all([
        supabase.from("consents").select("*").eq("user_id", user!.id).order("accepted_at", { ascending: false }).limit(1),
        supabase
          .from("screening_sessions")
          .select("*, game_results(game_type), risk_profiles(area, risk_band)")
          .eq("user_id", user!.id)
          .order("started_at", { ascending: false }),
        supabase
          .from("referrals")
          .select("*")
          .eq("student_id", user!.id)
          .order("created_at", { ascending: false }),
      ]);
      return {
        consent: consent.data?.[0] ?? null,
        sessions: sessions.data ?? [],
        referrals: referrals.data ?? [],
      };
    },
  });

  const activeSession = data?.sessions.find((s) => s.status === "in_progress");
  const latestComplete = data?.sessions.find((s) => s.status === "completed");
  const doneCount = activeSession?.game_results?.length ?? 0;

  return (
    <AppShell
      title={`Hello${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
      description="Your screening progress and next steps. Everything here is private to you and the Disability Unit staff reviewing flagged results."
    >
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <section className="surface-card overflow-hidden">
              <div className="gradient-hero p-6 text-primary-foreground">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                  Screening status
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold">
                  {!data?.consent
                    ? "Start with consent"
                    : activeSession
                      ? `${doneCount} of ${GAME_ORDER.length} activities done`
                      : latestComplete
                        ? "Screening complete"
                        : "Ready when you are"}
                </h2>
                <p className="mt-2 max-w-md text-sm opacity-90">
                  {!data?.consent
                    ? "We'll explain exactly what is collected and why before anything is recorded."
                    : activeSession
                      ? "You can pick up exactly where you left off — your progress is saved after each activity."
                      : "Six short activities, about twenty minutes. Pause between them whenever you need to."}
                </p>
                <Button asChild variant="secondary" className="mt-5">
                  <Link to={data?.consent ? "/student/screening" : "/consent"}>
                    {!data?.consent
                      ? "Read consent"
                      : activeSession
                        ? "Continue screening"
                        : "Start a screening"}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </section>

            <section className="surface-card p-6">
              <h2 className="font-display text-lg font-semibold">Your next steps</h2>
              {data?.referrals.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Nothing here yet. If a staff member records support or a referral for you, it will
                  appear here in plain language.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {data?.referrals.map((r) => (
                    <li key={r.id} className="rounded-xl border border-border p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Sparkles className="size-4 text-accent" aria-hidden="true" />
                        {r.decision}
                      </div>
                      {r.outcome && (
                        <p className="mt-1 text-sm text-muted-foreground">Outcome: {r.outcome}</p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        Updated {new Date(r.updated_at).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/student/support">Request support or a re-screening</Link>
              </Button>
            </section>

            <section className="surface-card p-6">
              <h2 className="font-display text-lg font-semibold">Past sessions</h2>
              {data?.sessions.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No sessions yet.</p>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {data?.sessions.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold">
                          {s.status === "completed" ? (
                            <ClipboardCheck className="size-4 text-risk-low" aria-hidden="true" />
                          ) : (
                            <PlayCircle className="size-4 text-accent" aria-hidden="true" />
                          )}
                          {s.status === "completed" ? "Completed session" : "In progress"}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarClock className="size-3.5" aria-hidden="true" />
                          {new Date(s.started_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {s.overall_band && <RiskBadge band={s.overall_band as RiskBand} />}
                        {s.status === "completed" && (
                          <Button asChild size="sm" variant="ghost">
                            <Link to="/student/results/$sessionId" params={{ sessionId: s.id }}>
                              View summary
                            </Link>
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            <NotDiagnosisNote />
            <div className="surface-card p-6">
              <h2 className="font-display text-base font-semibold">Consent</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {data?.consent
                  ? `Accepted ${new Date(data.consent.accepted_at).toLocaleString()} (version ${data.consent.consent_text_version}).`
                  : "Not yet recorded. Screening cannot start until you accept."}
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/consent">Read the consent notice</Link>
              </Button>
            </div>
            <div className="surface-card p-6">
              <h2 className="font-display text-base font-semibold">Need a hand?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The Disability Unit is there for practical support — extra time, note-taking help,
                quiet venues or simply a conversation.
              </p>
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  );
}
