import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({
    meta: [
      { title: "Audit log — DUT Screening Administration" },
      {
        name: "description",
        content:
          "POPIA accountability: a record of who accessed or changed sensitive screening records and when.",
      },
      { property: "og:title", content: "Audit log — DUT Screening Administration" },
      { property: "og:description", content: "Access and change history for sensitive records." },
    ],
  }),
  component: AuditPage,
});

const PAGE_SIZE = 25;

function AuditPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const [{ data: logs }, { data: profiles }] = await Promise.all([
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("profiles").select("id, full_name"),
      ]);
      return (logs ?? []).map((l) => ({
        ...l,
        who: (profiles ?? []).find((p) => p.id === l.user_id)?.full_name ?? "Unknown",
      }));
    },
  });

  const rows = (data ?? []).filter((l) =>
    search ? `${l.who} ${l.action} ${l.target ?? ""}`.toLowerCase().includes(search.toLowerCase()) : true,
  );
  const pageRows = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <AppShell
      title="Audit log"
      description="Every consent, screening completion, profile view and decision is recorded here for accountability."
      crumbs={[{ label: "Audit log" }]}
    >
      <div className="surface-card overflow-hidden">
        <div className="border-b border-border p-4">
          <Input
            placeholder="Search person, action or target"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="max-w-sm"
            aria-label="Search the audit log"
          />
        </div>
        {isLoading ? (
          <Skeleton className="m-4 h-40" />
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">When</th>
                  <th className="py-2 pr-4">Who</th>
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageRows.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2 pr-4">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-4">{l.who}</td>
                    <td className="py-2 pr-4">{l.action.replace(/_/g, " ")}</td>
                    <td className="py-2 font-mono text-xs text-muted-foreground">{l.target ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-border p-4 text-sm">
          <span className="text-muted-foreground">
            Page {page + 1} of {Math.max(1, Math.ceil(rows.length / PAGE_SIZE))}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1.5 disabled:opacity-50"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1.5 disabled:opacity-50"
              disabled={(page + 1) * PAGE_SIZE >= rows.length}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
