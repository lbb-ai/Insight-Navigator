import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { homeForRole, useAuth, type Role } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotDiagnosisNote } from "@/components/NotDiagnosisNote";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — DUT Learning Disability Screening" },
      {
        name: "description",
        content:
          "Sign in or register as a DUT student, Disability Unit staff member or administrator to use the learning-support screening platform.",
      },
      { property: "og:title", content: "Sign in — DUT Learning Disability Screening" },
      {
        property: "og:description",
        content: "Secure, role-based access for students, Disability Unit staff and administrators.",
      },
    ],
  }),
  component: AuthPage,
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
  faculty: z.string().trim().max(100).optional(),
});

const FACULTIES = [
  "Accounting & Informatics",
  "Applied Sciences",
  "Arts & Design",
  "Engineering & Built Environment",
  "Health Sciences",
  "Management Sciences",
];

function AuthPage() {
  const navigate = useNavigate();
  const { session, role, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session && role) {
      void navigate({ to: homeForRole(role), replace: true });
    }
  }, [loading, session, role, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      fullName: form.get("fullName"),
      email: form.get("email"),
      password: form.get("password"),
      faculty: form.get("faculty") ?? "",
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: parsed.data.fullName,
          faculty: parsed.data.faculty,
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. Check your email if confirmation is required.");
  };

  return (
    <div className="min-h-dvh bg-background md:grid md:grid-cols-2">
      <div className="gradient-hero hidden flex-col justify-between p-10 text-primary-foreground md:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-white/15">
            <GraduationCap className="size-5" aria-hidden="true" />
          </span>
          <span className="font-display text-sm font-semibold">LD Screening · DUT</span>
        </Link>
        <div>
          <h2 className="max-w-sm font-display text-3xl font-bold">
            Twenty minutes that could make your studies a lot easier.
          </h2>
          <p className="mt-4 max-w-sm text-sm opacity-90">
            Your results are yours. Only Disability Unit staff reviewing flagged profiles can see
            them, and every access is logged.
          </p>
        </div>
        <p className="text-xs opacity-70">
          Screening indicators only — this system never diagnoses.
        </p>
      </div>

      <main id="main-content" className="flex items-center justify-center px-4 py-10 md:px-10">
        <div className="w-full max-w-md">
          <h1 className="font-display text-2xl font-semibold">Welcome</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in or create an account to continue.
          </p>

          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="surface-card mt-4 space-y-4 p-6">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email address</Label>
                  <Input id="signin-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="surface-card mt-4 space-y-4 p-6">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full name</Label>
                  <Input id="signup-name" name="fullName" required autoComplete="name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email address</Label>
                  <Input id="signup-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">At least 8 characters.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-faculty">Faculty</Label>
                  <select
                    id="signup-faculty"
                    name="faculty"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    defaultValue=""
                  >
                    <option value="">Prefer not to say</option>
                    {FACULTIES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">
                  New accounts are registered as students. Disability Unit staff and administrator
                  access is assigned by an administrator.
                </p>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <NotDiagnosisNote className="mt-6" variant="subtle" />
        </div>
      </main>
    </div>
  );
}
