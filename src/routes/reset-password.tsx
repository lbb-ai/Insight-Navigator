import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandIdentity } from "@/components/BrandIdentity";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Choose a new password — LearnAware DUT" },
      { name: "description", content: "Set a new password for your LearnAware DUT screening account." },
      { property: "og:title", content: "Choose a new password — LearnAware DUT" },
      { property: "og:description", content: "Reset your LearnAware DUT account password securely." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password.length < 8) return void toast.error("Use at least 8 characters.");
    if (password !== confirm) return void toast.error("The two passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success("Password updated. You're signed in.");
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <main id="main-content" className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <BrandIdentity />
        <h1 className="mt-8 font-display text-2xl font-semibold">Choose a new password</h1>
        {!ready ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Checking your reset link… If nothing happens, open the link from your email again or request a new one from the sign-in page.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="surface-card mt-6 space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="rp-password">New password</Label>
              <Input id="rp-password" name="password" type="password" required minLength={8} autoComplete="new-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rp-confirm">Confirm new password</Label>
              <Input id="rp-confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Save new password
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
