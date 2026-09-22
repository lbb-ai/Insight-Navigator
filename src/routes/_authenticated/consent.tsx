import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, FileLock2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAudit, useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NotDiagnosisNote } from "@/components/NotDiagnosisNote";

export const CONSENT_VERSION = "v1.0";

export const Route = createFileRoute("/_authenticated/consent")({
  head: () => ({
    meta: [
      { title: "Informed consent — DUT Learning Disability Screening" },
      {
        name: "description",
        content:
          "POPIA-aligned informed consent: what is collected during screening, why, who can see it and how long it is kept.",
      },
      { property: "og:title", content: "Informed consent — DUT Learning Disability Screening" },
      {
        property: "og:description",
        content: "Consent is recorded and timestamped before any screening activity begins.",
      },
    ],
  }),
  component: ConsentPage,
});

const SECTIONS = [
  {
    title: "What we collect",
    body: "Your name, faculty and contact details, plus how you perform in six short activities: accuracy, how long answers take, items skipped, repeated error patterns and the difficulty level reached.",
  },
  {
    title: "Why we collect it",
    body: "To highlight possible learning-support needs early, so the Disability Unit can offer help. The system produces risk indicators for human review — it does not diagnose anything.",
  },
  {
    title: "Who can see it",
    body: "You can always see your own results. Disability Unit staff can see your profile only when an activity result is flagged medium or high. Administrators manage accounts and settings and can see anonymised, aggregated trends. Academic staff are never given your results without your separate consent.",
  },
  {
    title: "How long we keep it",
    body: "Screening data is retained for the duration of your registration plus one academic year, after which it is deleted or fully anonymised.",
  },
  {
    title: "Your rights",
    body: "You may withdraw consent, request a copy of your data or ask for deletion at any time by contacting the Disability Unit. Every staff access to your record is logged.",
  },
];

function ConsentPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);

  const accept = async () => {
    if (!user || !agreed) return;
    setBusy(true);
    const { error } = await supabase
      .from("consents")
      .insert({ user_id: user.id, consent_text_version: CONSENT_VERSION });
    setBusy(false);
    if (error) {
      toast.error("We couldn't record your consent. Please try again.");
      return;
    }
    void logAudit(user.id, "consent_accepted", CONSENT_VERSION);
    toast.success("Consent recorded — thank you");
    void navigate({ to: "/student/screening" });
  };

  return (
    <AppShell
      title="Informed consent"
      description="Please read this before starting. Nothing is recorded from the activities until you accept."
      crumbs={[
        { label: role === "student" ? "Dashboard" : "Home", to: "/student/dashboard" },
        { label: "Consent" },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="surface-card p-6 md:p-8">
          <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
            <FileLock2 className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold">
            Consent to learning-support screening ({CONSENT_VERSION})
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Processed in line with South Africa's Protection of Personal Information Act (POPIA).
          </p>

          <dl className="mt-6 space-y-5">
            {SECTIONS.map((s) => (
              <div key={s.title}>
                <dt className="font-display text-base font-semibold">{s.title}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{s.body}</dd>
              </div>
            ))}
          </dl>

          <NotDiagnosisNote className="mt-8" />

          <div className="mt-8 flex items-start gap-3 rounded-xl border border-border p-4">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
              className="mt-1"
            />
            <label htmlFor="agree" className="text-sm">
              I have read and understood the above. I agree to take part in the screening and
              understand it does not diagnose a learning disability.
            </label>
          </div>

          <Button className="mt-6 w-full sm:w-auto" disabled={!agreed || busy} onClick={accept}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="size-4" aria-hidden="true" />
            )}
            Accept and continue
          </Button>
        </div>

        <aside className="surface-card h-fit p-6">
          <h2 className="font-display text-base font-semibold">What happens next</h2>
          <ol className="mt-4 space-y-4 text-sm text-muted-foreground">
            {[
              "Six short activities, about twenty minutes in total. You can pause between them.",
              "A supportive summary written for you — no labels, no scores to compare.",
              "If anything is flagged, a Disability Unit staff member reviews it with the detail behind it.",
              "You'll see agreed next steps in your dashboard.",
            ].map((text, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-foreground">
                  {i + 1}
                </span>
                {text}
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </AppShell>
  );
}
