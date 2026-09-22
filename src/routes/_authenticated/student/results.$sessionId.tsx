import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HeartHandshake, PartyPopper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/RiskBadge";
import { NotDiagnosisNote } from "@/components/NotDiagnosisNote";
import { AREA_SHORT, type RiskArea } from "@/lib/games";
import { overallBand, STUDENT_BAND_COPY, type RiskBand } from "@/lib/scoring";

export const Route = createFileRoute("/_authenticated/student/results/$sessionId")({
  head: () => ({
    meta: [
      { title: "Your screening summary — DUT Learning Disability Screening" },
      {
        name: "description",
        content:
          "A supportive, non-diagnostic summary of your screening session, with clear next steps.",
      },
      { property: "og:title", content: "Your screening summary" },
      {
        property: "og:description",
        content: "Supportive, plain-language screening results and next steps.",
      },
    ],
  }),
  component: ResultsPage,
});

const AREA_ADVICE: Record<RiskArea, string> = {
  dyscalculia:
    "Working with numbers under time pressure looked effortful. Structured practice, formula sheets and extra time in numeric assessments often help.",
  dyslexia:
    "Reading and written words took extra effort in places. Text-to-speech tools, printed handouts and reading time before tasks can make a real difference.",
  "working-memory":
    "Holding several pieces of information at once looked demanding. Written step-by-step instructions and note-taking support are practical options.",
  "executive-function":
    "Planning and sequencing tasks looked effortful. Study planners, task breakdowns and check-in sessions are often useful.",
  attention:
    "Keeping steady focus over time looked effortful. Quieter venues, shorter working blocks and scheduled breaks tend to help.",
};

function ResultsPage() {
  const { sessionId } = Route.useParams();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["session-results", sessionId],
    enabled: !!user,
    queryFn: async () => {
      const [profiles, referrals] = await Promise.all([
        supabase.from("risk_profiles").select("*").eq("session_id", sessionId),
        supabase.from("referrals").select("*").eq("session_id", sessionId),
      ]);
      return { profiles: profiles.data ?? [], referrals: referrals.data ?? [] };
    },
  });

  if (isLoading) {
    return (
      <AppShell title="Your summary">
        <Skeleton className="h-64" />
      </AppShell>
    );
  }

  const profiles = data?.profiles ?? [];
  const band = overallBand(profiles.map((p) => ({ risk_band: p.risk_band as RiskBand })));
  const copy = STUDENT_BAND_COPY[band];

  return (
    <AppShell
      title="Your screening summary"
      description="Written for you, in plain language. Nothing here is a diagnosis or a label."
      crumbs={[
        { label: "Dashboard", to: "/student/dashboard" },
        { label: "Screening summary" },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="surface-card overflow-hidden">
            <div className="gradient-hero p-6 text-primary-foreground md:p-8">
              <PartyPopper className="size-7 animate-in fade-in zoom-in" aria-hidden="true" />
              <h2 className="mt-4 font-display text-2xl font-semibold">{copy.title}</h2>
              <p className="mt-3 max-w-xl text-sm opacity-90">{copy.body}</p>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground">
                Thank you for finishing all six activities — that's the whole screening done.
              </p>
            </div>
          </section>

          <section className="surface-card p-6">
            <h2 className="font-display text-lg font-semibold">What each area showed</h2>
            <ul className="mt-4 space-y-4">
              {profiles.map((p) => (
                <li key={p.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-base font-semibold">
                      {AREA_SHORT[p.area as RiskArea]}
                    </h3>
                    <RiskBadge band={p.risk_band as RiskBand} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {AREA_ADVICE[p.area as RiskArea]}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="surface-card p-6">
            <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-accent-foreground">
              <HeartHandshake className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-base font-semibold">Your next steps</h2>
            {data && data.referrals.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm">
                {data.referrals.map((r) => (
                  <li key={r.id} className="rounded-lg border border-border p-3">
                    <p className="font-semibold">{r.decision}</p>
                    {r.outcome && <p className="text-muted-foreground">{r.outcome}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {band === "low"
                  ? "No follow-up is needed right now. You can request a conversation whenever you'd like one."
                  : "A Disability Unit staff member will review this and get in touch. You'll see the agreed next steps here."}
              </p>
            )}
            <Button asChild className="mt-4 w-full">
              <Link to="/student/support">Request support</Link>
            </Button>
          </div>
          <NotDiagnosisNote />
        </aside>
      </div>
    </AppShell>
  );
}
