import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAudit, useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/RiskBadge";
import { NotDiagnosisNote } from "@/components/NotDiagnosisNote";
import { AREA_LABELS, GAMES, type GameType, type RiskArea } from "@/lib/games";
import type { RiskBand } from "@/lib/scoring";

export const Route = createFileRoute("/_authenticated/staff/student/$sessionId")({
  head: () => ({
    meta: [
      { title: "Student risk profile — DUT Disability Unit" },
      {
        name: "description",
        content:
          "Explainable per-activity signal breakdown behind a flagged screening profile, plus referral decision recording.",
      },
      { property: "og:title", content: "Student risk profile — DUT Disability Unit" },
      {
        property: "og:description",
        content: "Every flag shown with the exact signals behind it — no opaque scores.",
      },
    ],
  }),
  component: StudentProfile,
});

const DECISIONS = [
  "Monitor — no action needed yet",
  "Recommend study-support session",
  "Recommend assistive technology / accommodations discussion",
  "Refer for formal assessment",
];

function StudentProfile() {
  const { sessionId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState(DECISIONS[0]!);

  const { data, isLoading } = useQuery({
    queryKey: ["staff-session", sessionId],
    queryFn: async () => {
      const { data: session } = await supabase
        .from("screening_sessions")
        .select("*")
        .eq("id", sessionId)
        .maybeSingle();
      const [{ data: profile }, { data: risks }, { data: results }, { data: referrals }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", session?.user_id ?? "")
            .maybeSingle(),
          supabase.from("risk_profiles").select("*").eq("session_id", sessionId),
          supabase.from("game_results").select("*").eq("session_id", sessionId),
          supabase
            .from("referrals")
            .select("*")
            .eq("session_id", sessionId)
            .order("created_at", { ascending: false }),
        ]);
      return { session, profile, risks: risks ?? [], results: results ?? [], referrals: referrals ?? [] };
    },
  });

  useEffect(() => {
    if (user && data?.session) void logAudit(user.id, "viewed_risk_profile", sessionId);
  }, [user, data?.session, sessionId]);

  const saveDecision = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.from("referrals").insert({
      session_id: sessionId,
      student_id: data!.session!.user_id,
      staff_id: user!.id,
      decision,
      notes: String(form.get("notes") ?? "").slice(0, 1000) || null,
      outcome: String(form.get("outcome") ?? "").slice(0, 200) || null,
    });
    setBusy(false);
    if (error) {
      toast.error("Could not save the decision.");
      return;
    }
    void logAudit(user!.id, "recorded_referral_decision", sessionId);
    toast.success("Decision recorded");
    void queryClient.invalidateQueries({ queryKey: ["staff-session", sessionId] });
  };

  const updateOutcome = async (id: string, outcome: string) => {
    const { error } = await supabase.from("referrals").update({ outcome, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error("Could not update the outcome.");
    toast.success("Outcome updated");
    void queryClient.invalidateQueries({ queryKey: ["staff-session", sessionId] });
  };

  const removeReferral = async (id: string) => {
    const { error } = await supabase.from("referrals").delete().eq("id", id);
    if (error) return toast.error("Could not delete that record.");
    void logAudit(user!.id, "deleted_referral", id);
    toast.success("Referral record deleted");
    void queryClient.invalidateQueries({ queryKey: ["staff-session", sessionId] });
  };

  if (isLoading) {
    return (
      <AppShell title="Risk profile">
        <Skeleton className="h-64" />
      </AppShell>
    );
  }

  return (
    <AppShell
      title={data?.profile?.full_name || "Student profile"}
      description="Every band below is shown with the specific signals that produced it."
      crumbs={[
        { label: "Review queue", to: "/staff/queue" },
        { label: data?.profile?.full_name || "Student" },
        { label: "Session detail" },
      ]}
    >
      <NotDiagnosisNote className="mb-6" variant="subtle" />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="surface-card p-6">
            <h2 className="font-display text-lg font-semibold">Explainable risk breakdown</h2>
            <ul className="mt-4 space-y-4">
              {data?.risks.map((r) => (
                <li key={r.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-base font-semibold">
                      {AREA_LABELS[r.area as RiskArea]}
                    </h3>
                    <RiskBadge band={r.risk_band as RiskBand} />
                  </div>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                    {(r.contributing_signals as string[]).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <section className="surface-card p-6">
            <h2 className="font-display text-lg font-semibold">Activity data captured</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">Activity</th>
                    <th className="py-2 pr-4">Accuracy</th>
                    <th className="py-2 pr-4">Avg time</th>
                    <th className="py-2 pr-4">Skipped</th>
                    <th className="py-2 pr-4">Repeated errors</th>
                    <th className="py-2">Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.results.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 pr-4 font-medium">{GAMES[r.game_type as GameType]?.title ?? r.game_type}</td>
                      <td className="py-2 pr-4">{Math.round(Number(r.accuracy))}%</td>
                      <td className="py-2 pr-4">{(r.avg_response_time_ms / 1000).toFixed(1)}s</td>
                      <td className="py-2 pr-4">{r.skipped_items}</td>
                      <td className="py-2 pr-4">{r.repeated_errors}</td>
                      <td className="py-2">{r.difficulty_progression}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <form onSubmit={saveDecision} className="surface-card space-y-4 p-6">
            <h2 className="font-display text-base font-semibold">Record a decision</h2>
            <div className="space-y-2">
              <Label htmlFor="decision">Decision</Label>
              <select
                id="decision"
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {DECISIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={4} maxLength={1000} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outcome">Outcome (optional)</Label>
              <Textarea id="outcome" name="outcome" rows={2} maxLength={200} />
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Save decision
            </Button>
          </form>

          <section className="surface-card p-6">
            <h2 className="font-display text-base font-semibold">Decision history</h2>
            {data?.referrals.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No decisions recorded yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {data?.referrals.map((r) => (
                  <li key={r.id} className="rounded-xl border border-border p-4 text-sm">
                    <p className="font-semibold">{r.decision}</p>
                    {r.notes && <p className="mt-1 text-muted-foreground">{r.notes}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <input
                        defaultValue={r.outcome ?? ""}
                        placeholder="Update outcome"
                        aria-label="Update outcome"
                        className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                        onBlur={(e) => {
                          if (e.target.value !== (r.outcome ?? "")) {
                            void updateOutcome(r.id, e.target.value);
                          }
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeReferral(r.id)}
                        aria-label="Delete this referral record"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
