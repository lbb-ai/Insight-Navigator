import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/RiskBadge";
import { NotDiagnosisNote } from "@/components/NotDiagnosisNote";
import type { RiskBand } from "@/lib/scoring";

export const Route = createFileRoute("/_authenticated/staff/queue")({
  head: () => ({
    meta: [
      { title: "Review queue — DUT Disability Unit" },
      {
        name: "description",
        content:
          "Flagged screening profiles awaiting Disability Unit review, filterable by risk band, faculty and date.",
      },
      { property: "og:title", content: "Review queue — DUT Disability Unit" },
      {
        property: "og:description",
        content: "Medium and high screening indicators awaiting human review.",
      },
    ],
  }),
  component: QueuePage,
});

const PAGE_SIZE = 10;

function QueuePage() {
  const [band, setBand] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["staff-queue"],
    queryFn: async () => {
      const { data: sessions } = await supabase
        .from("screening_sessions")
        .select("id, user_id, started_at, completed_at, overall_band, status")
        .eq("status", "completed")
        .in("overall_band", ["medium", "high"])
        .order("completed_at", { ascending: false });

      const ids = [...new Set((sessions ?? []).map((s) => s.user_id))];
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, full_name, faculty").in("id", ids)
        : { data: [] };
      const { data: referrals } = await supabase.from("referrals").select("session_id, decision");

      return (sessions ?? []).map((s) => ({
        ...s,
        profile: (profiles ?? []).find((p) => p.id === s.user_id),
        referral: (referrals ?? []).find((r) => r.session_id === s.id),
      }));
    },
  });

  const filtered = (data ?? []).filter((row) => {
    if (band !== "all" && row.overall_band !== band) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (row.profile?.full_name ?? "").toLowerCase().includes(q) ||
        (row.profile?.faculty ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <AppShell
      title="Review queue"
      description="Screening profiles flagged medium or high. Open one to see exactly which signals drove the flag."
      crumbs={[{ label: "Review queue" }]}
    >
      <NotDiagnosisNote className="mb-6" variant="subtle" />

      <div className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <Input
            placeholder="Search name or faculty"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="max-w-xs"
            aria-label="Search the queue"
          />
          <select
            value={band}
            onChange={(e) => {
              setBand(e.target.value);
              setPage(0);
            }}
            aria-label="Filter by risk band"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All bands</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length} flagged profile(s)
          </span>
        </div>

        {isLoading ? (
          <Skeleton className="m-4 h-40" />
        ) : pageRows.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No flagged profiles match these filters.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {pageRows.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {row.profile?.full_name || "Unnamed student"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.profile?.faculty || "Faculty not given"} ·{" "}
                    {row.completed_at ? new Date(row.completed_at).toLocaleDateString() : "—"} ·{" "}
                    {row.referral ? `Decision: ${row.referral.decision}` : "Awaiting decision"}
                  </p>
                </div>
                <RiskBadge band={row.overall_band as RiskBand} />
                <Button asChild size="sm">
                  <Link to="/staff/student/$sessionId" params={{ sessionId: row.id }}>
                    Open profile
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between border-t border-border p-4 text-sm">
          <span className="text-muted-foreground">
            Page {page + 1} of {Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(page + 1) * PAGE_SIZE >= filtered.length}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
