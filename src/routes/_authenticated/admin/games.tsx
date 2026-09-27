import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAudit, useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NotDiagnosisNote } from "@/components/NotDiagnosisNote";

export const Route = createFileRoute("/_authenticated/admin/games")({
  head: () => ({
    meta: [
      { title: "Games & thresholds — DUT Screening Administration" },
      {
        name: "description",
        content:
          "Configure the six screening activities and the accuracy thresholds that decide low, medium and high indications.",
      },
      { property: "og:title", content: "Games & thresholds — DUT Screening Administration" },
      { property: "og:description", content: "Transparent, editable rule-based thresholds." },
    ],
  }),
  component: AdminGames,
});

function AdminGames() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["game-configs"],
    queryFn: async () => {
      const { data } = await supabase.from("game_configs").select("*").order("title");
      return data ?? [];
    },
  });

  const save = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase
      .from("game_configs")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Could not save that setting.");
      return;
    }
    void logAudit(user?.id, "updated_game_config", id);
    toast.success("Setting saved");
    void queryClient.invalidateQueries({ queryKey: ["game-configs"] });
  };

  return (
    <AppShell
      title="Games & thresholds"
      description="Rule-based and fully visible: these numbers decide when an activity contributes to a medium or high indication."
      crumbs={[{ label: "Games & thresholds" }]}
    >
      <NotDiagnosisNote className="mb-6" variant="subtle" />
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.map((g) => (
            <article key={g.id} className="surface-card space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-semibold">{g.title}</h2>
                  <p className="text-xs text-muted-foreground">Feeds: {g.area}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`enabled-${g.id}`} className="text-xs">
                    Enabled
                  </Label>
                  <Switch
                    id={`enabled-${g.id}`}
                    checked={g.enabled}
                    onCheckedChange={(v) => save(g.id, { enabled: v })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { field: "medium_threshold", label: "Low if accuracy ≥ (%)", value: g.medium_threshold },
                  { field: "high_threshold", label: "High if accuracy < (%)", value: g.high_threshold },
                  { field: "item_count", label: "Items", value: g.item_count },
                  { field: "time_limit_seconds", label: "Time limit (s)", value: g.time_limit_seconds },
                ].map((f) => (
                  <div key={f.field} className="space-y-1.5">
                    <Label htmlFor={`${f.field}-${g.id}`} className="text-xs">
                      {f.label}
                    </Label>
                    <input
                      id={`${f.field}-${g.id}`}
                      type="number"
                      defaultValue={Number(f.value)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      onBlur={(e) => {
                        const next = Number(e.target.value);
                        if (next !== Number(f.value)) void save(g.id, { [f.field]: next });
                      }}
                    />
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      <section className="surface-card mt-6 p-6">
        <h2 className="font-display text-base font-semibold">Out of scope for this release</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Academic staff portal, automatic accommodations without human review, multilingual rollout,
          clinical diagnosis or treatment features, and integration with other DUT systems are noted
          as future scope and intentionally not built. Reliability intent: daily managed backups and
          restore-from-backup recovery are handled by the hosting platform.
        </p>
      </section>
    </AppShell>
  );
}
