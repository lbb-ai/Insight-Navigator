import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { FONT_STACKS, useSettings, type FontChoice, type ThemeMode } from "@/hooks/useSettings";
import { playTone } from "@/lib/sound";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — DUT Learning Disability Screening" },
      { name: "description", content: "Adjust font, text size, sounds and light or dark mode." },
      { property: "og:title", content: "Settings — DUT Learning Disability Screening" },
      { property: "og:description", content: "Personalise reading comfort, sound and theme." },
    ],
  }),
  component: SettingsPage,
});

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick}
      className={cn("rounded-xl border p-4 text-left transition-colors", active ? "border-primary bg-primary-soft" : "border-border bg-card hover:border-primary/40")}>
      {children}
    </button>
  );
}

function SettingsPage() {
  const { settings, update, reset } = useSettings();
  return (
    <AppShell title="Settings" description="Make the app comfortable for you. Changes are saved on this device.">
      <div className="space-y-6">
        <section className="surface-card p-6">
          <h2 className="font-display text-lg font-semibold">Appearance</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(["light", "dark", "system"] as ThemeMode[]).map((t) => (
              <Choice key={t} active={settings.theme === t} onClick={() => update({ theme: t })}>
                <span className="font-semibold">{t === "light" ? "Light" : t === "dark" ? "Dark" : "Match my device"}</span>
              </Choice>
            ))}
          </div>
        </section>
        <section className="surface-card p-6">
          <h2 className="font-display text-lg font-semibold">Font</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(Object.keys(FONT_STACKS) as FontChoice[]).map((f) => (
              <Choice key={f} active={settings.font === f} onClick={() => update({ font: f })}>
                <span className="block text-lg" style={{ fontFamily: FONT_STACKS[f].stack }}>{FONT_STACKS[f].label}</span>
                <span className="text-xs text-muted-foreground">{FONT_STACKS[f].note}</span>
              </Choice>
            ))}
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-sm"><span className="font-semibold">Text size</span><span>{settings.fontScale}%</span></div>
            <Slider className="mt-3" min={90} max={140} step={5} value={[settings.fontScale]} onValueChange={(v) => update({ fontScale: v[0] ?? 100 })} aria-label="Text size" />
          </div>
        </section>
        <section className="surface-card flex items-center justify-between gap-4 p-6">
          <div>
            <h2 className="font-display text-lg font-semibold">Game sounds</h2>
            <p className="text-sm text-muted-foreground">Soft tones when you answer, flip a card or finish a level.</p>
          </div>
          <Switch checked={settings.sound} onCheckedChange={(v) => { update({ sound: v }); if (v) setTimeout(() => playTone("positive"), 50); }} aria-label="Game sounds" />
        </section>
        <Button variant="outline" onClick={reset}>Reset to defaults</Button>
      </div>
    </AppShell>
  );
}
