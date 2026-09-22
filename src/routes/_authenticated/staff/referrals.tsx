import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/staff/referrals")({
  head: () => ({
    meta: [
      { title: "Referrals & outcomes — DUT Disability Unit" },
      {
        name: "description",
        content: "All recorded support decisions and referral outcomes, filterable by decision type.",
      },
      { property: "og:title", content: "Referrals & outcomes — DUT Disability Unit" },
      { property: "og:description", content: "Track support decisions and their outcomes." },
    ],
  }),
  component: ReferralsPage,
});

function ReferralsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["staff-referrals"],
    queryFn: async () => {
      const { data: referrals } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });
      const ids = [...new Set((referrals ?? []).map((r) => r.student_id))];
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, full_name, faculty").in("id", ids)
        : { data: [] };
      return (referrals ?? []).map((r) => ({
        ...r,
        profile: (profiles ?? []).find((p) => p.id === r.student_id),
      }));
    },
  });

  const rows = (data ?? []).filter((r) =>
    search
      ? `${r.profile?.full_name ?? ""} ${r.decision} ${r.outcome ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      : true,
  );

  return (
    <AppShell
      title="Referrals & outcomes"
      description="Every recorded decision, with the outcome as it is updated."
      crumbs={[{ label: "Referrals" }]}
    >
      <div className="surface-card overflow-hidden">
        <div className="border-b border-border p-4">
          <Input
            placeholder="Search student, decision or outcome"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
            aria-label="Search referrals"
          />
        </div>
        {isLoading ? (
          <Skeleton className="m-4 h-40" />
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No referrals recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{r.profile?.full_name || "Student"}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.decision} · {r.outcome || "Outcome pending"} ·{" "}
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to="/staff/student/$sessionId" params={{ sessionId: r.session_id }}>
                    Open session
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
