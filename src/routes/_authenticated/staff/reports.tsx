import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/staff/reports")({
  head: () => ({
    meta: [
      { title: "Reports — DUT Disability Unit" },
      {
        name: "description",
        content: "Filterable screening reports with CSV export for the DUT Disability Unit.",
      },
      { property: "og:title", content: "Reports — DUT Disability Unit" },
      { property: "og:description", content: "Filter screening outcomes and export them as CSV." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const [band, setBand] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["staff-reports"],
    queryFn: async () => {
      const { data: sessions } = await supabase
        .from("screening_sessions")
        .select("id, user_id, started_at, completed_at, status, overall_band")
        .order("started_at", { ascending: false });
      const ids = [...new Set((sessions ?? []).map((s) => s.user_id))];
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, full_name, faculty").in("id", ids)
        : { data: [] };
      return (sessions ?? []).map((s) => ({
        ...s,
        profile: (profiles ?? []).find((p) => p.id === s.user_id),
      }));
    },
  });

  const rows = (data ?? []).filter((r) => band === "all" || r.overall_band === band);

  const exportCsv = () => {
    const header = ["Student", "Faculty", "Started", "Completed", "Status", "Band"];
    const lines = rows.map((r) =>
      [
        r.profile?.full_name ?? "",
        r.profile?.faculty ?? "",
        new Date(r.started_at).toISOString(),
        r.completed_at ? new Date(r.completed_at).toISOString() : "",
        r.status,
        r.overall_band ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `screening-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      title="Reports"
      description="Screening activity across the unit. Export for records or for a meeting."
      crumbs={[{ label: "Reports" }]}
      actions={
        <Button onClick={exportCsv} variant="outline">
          <Download className="size-4" aria-hidden="true" /> Export CSV
        </Button>
      }
    >
      <div className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <select
            value={band}
            onChange={(e) => setBand(e.target.value)}
            aria-label="Filter by risk band"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All bands</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <span className="text-xs text-muted-foreground">{rows.length} session(s)</span>
        </div>
        {isLoading ? (
          <Skeleton className="m-4 h-40" />
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Faculty</th>
                  <th className="py-2 pr-4">Started</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Band</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-4">{r.profile?.full_name ?? "—"}</td>
                    <td className="py-2 pr-4">{r.profile?.faculty ?? "—"}</td>
                    <td className="py-2 pr-4">{new Date(r.started_at).toLocaleDateString()}</td>
                    <td className="py-2 pr-4">{r.status}</td>
                    <td className="py-2 capitalize">{r.overall_band ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
