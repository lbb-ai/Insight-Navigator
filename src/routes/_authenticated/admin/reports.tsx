import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { AREA_SHORT, type RiskArea } from "@/lib/games";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({
    meta: [
      { title: "System reports — DUT Screening Administration" },
      {
        name: "description",
        content: "Anonymised, aggregated screening trends across faculties and indicator areas.",
      },
      { property: "og:title", content: "System reports — DUT Screening Administration" },
      { property: "og:description", content: "Aggregated, anonymised screening trends." },
    ],
  }),
  component: AdminReports,
});

function AdminReports() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const [{ data: sessions }, { data: risks }, { count: users }] = await Promise.all([
        supabase.from("screening_sessions").select("id, status, overall_band"),
        supabase.from("risk_profiles").select("area, risk_band"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      return { sessions: sessions ?? [], risks: risks ?? [], users: users ?? 0 };
    },
  });

  if (isLoading || !data) {
    return (
      <AppShell title="System reports">
        <Skeleton className="h-64" />
      </AppShell>
    );
  }

  const completed = data.sessions.filter((s) => s.status === "completed").length;
  const flagged = data.sessions.filter(
    (s) => s.overall_band === "medium" || s.overall_band === "high",
  ).length;

  const areas = (Object.keys(AREA_SHORT) as RiskArea[]).map((area) => {
    const rows = data.risks.filter((r) => r.area === area);
    return {
      area,
      low: rows.filter((r) => r.risk_band === "low").length,
      medium: rows.filter((r) => r.risk_band === "medium").length,
      high: rows.filter((r) => r.risk_band === "high").length,
    };
  });

  return (
    <AppShell
      title="System reports"
      description="Aggregated and anonymised. No individual student is identifiable on this page."
      crumbs={[{ label: "System reports" }]}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Registered accounts", value: data.users },
          { label: "Completed screenings", value: completed },
          { label: "Flagged for review", value: flagged },
        ].map((stat) => (
          <div key={stat.label} className="surface-card p-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <section className="surface-card mt-6 overflow-x-auto p-6">
        <h2 className="font-display text-lg font-semibold">Indicator areas</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-2 pr-4">Area</th>
              <th className="py-2 pr-4">Low</th>
              <th className="py-2 pr-4">Medium</th>
              <th className="py-2">High</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {areas.map((a) => (
              <tr key={a.area}>
                <td className="py-2 pr-4 font-medium">{AREA_SHORT[a.area]}</td>
                <td className="py-2 pr-4">{a.low}</td>
                <td className="py-2 pr-4">{a.medium}</td>
                <td className="py-2">{a.high}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
