import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LifeBuoy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/student/support")({
  head: () => ({
    meta: [
      { title: "Request support — DUT Learning Disability Screening" },
      {
        name: "description",
        content:
          "Ask the DUT Disability Unit for support, a conversation about your results, or a re-screening.",
      },
      { property: "og:title", content: "Request support — DUT Learning Disability Screening" },
      {
        property: "og:description",
        content: "Reach the Disability Unit directly, whatever your screening showed.",
      },
    ],
  }),
  component: SupportPage,
});

const schema = z.object({
  message: z.string().trim().max(1000, "Please keep it under 1000 characters").optional(),
});

function SupportPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState("support");

  const { data } = useQuery({
    queryKey: ["support-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("support_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = schema.safeParse({ message: form.get("message") });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your message");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("support_requests").insert({
      user_id: user!.id,
      request_type: type,
      message: parsed.data.message || null,
    });
    setBusy(false);
    if (error) {
      toast.error("We couldn't send that. Please try again.");
      return;
    }
    toast.success("Sent — the Disability Unit will be in touch");
    e.currentTarget.reset();
    void queryClient.invalidateQueries({ queryKey: ["support-requests", user?.id] });
  };

  return (
    <AppShell
      title="Request support"
      description="Whatever your screening showed, you can reach the Disability Unit directly."
      crumbs={[{ label: "Dashboard", to: "/student/dashboard" }, { label: "Support" }]}
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={submit} className="surface-card space-y-5 p-6 md:p-8">
          <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
            <LifeBuoy className="size-5" aria-hidden="true" />
          </span>

          <div className="space-y-2">
            <Label htmlFor="type">What would you like?</Label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="support">A conversation about support options</option>
              <option value="rescreen">A re-screening</option>
              <option value="results">Help understanding my results</option>
              <option value="withdraw">To withdraw my consent or data</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Anything you'd like us to know (optional)</Label>
            <Textarea id="message" name="message" rows={5} maxLength={1000} />
          </div>

          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Send request
          </Button>
        </form>

        <section className="surface-card h-fit p-6">
          <h2 className="font-display text-base font-semibold">Your requests</h2>
          {!data || data.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">You haven't sent any requests yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.map((r) => (
                <li key={r.id} className="rounded-xl border border-border p-4 text-sm">
                  <p className="font-semibold capitalize">{r.request_type}</p>
                  {r.message && <p className="mt-1 text-muted-foreground">{r.message}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()} · {r.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
