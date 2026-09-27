import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [pwBusy, setPwBusy] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const current = String(form.get("currentPassword") ?? "");
    const password = String(form.get("newPassword") ?? "");
    const confirm = String(form.get("confirmPassword") ?? "");
    if (!current) {
      toast.error("Enter your current password.");
      return;
    }
    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords don't match.");
      return;
    }
    if (password === current) {
      toast.error("Choose a password different from your current one.");
      return;
    }
    setPwBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const email = u.user?.email;
    if (!email) {
      setPwBusy(false);
      toast.error("Please sign in again.");
      return;
    }
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: current });
    if (verifyError) {
      setPwBusy(false);
      toast.error("Your current password is incorrect.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    setPwBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated.");
    formEl.reset();
  };

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
        <section className="surface-card p-6">
          <h2 className="font-display text-lg font-semibold">Change password</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirm your current password, then choose a new one. Forgotten it? Use "Forgot password?" on the sign-in page.
          </p>
          <form onSubmit={handlePasswordChange} className="mt-4 max-w-sm space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input id="current-password" name="currentPassword" type="password" required autoComplete="current-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input id="new-password" name="newPassword" type="password" required minLength={8} autoComplete="new-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input id="confirm-password" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />
            </div>
            <Button type="submit" disabled={pwBusy}>
              {pwBusy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Update password
            </Button>
          </form>
        </section>
        <Button variant="outline" onClick={reset}>Reset to defaults</Button>
      </div>
    </AppShell>
  );
}
