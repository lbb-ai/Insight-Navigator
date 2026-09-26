import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { homeForRole, useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotDiagnosisNote } from "@/components/NotDiagnosisNote";
import { BrandMark } from "@/components/BrandIdentity";
import signinImage from "@/assets/dut-students-signin.jpg";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
  faculty: z.string().trim().max(100).optional(),
  studentNumber: z
    .string()
    .trim()
    .regex(/^\d{8}$/, "Enter your 8-digit DUT student number (e.g. 22418104)"),
});

const resetSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
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
  const [showReset, setShowReset] = useState(false);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = resetSchema.safeParse({ email: form.get("resetEmail") });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Enter a valid email address");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/settings`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("If that email is registered, a password reset link is on its way.");
    setShowReset(false);
  };

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
      studentNumber: form.get("studentNumber"),
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
          student_number: parsed.data.studentNumber,
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
      <aside className="relative flex min-h-64 flex-col justify-between overflow-hidden bg-sidebar px-5 py-6 text-hero-foreground md:min-h-dvh md:p-10 lg:p-14">
        <img src={signinImage} alt="Two university students studying together in a library" width={1024} height={1280} className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="auth-photo-shade absolute inset-0" aria-hidden="true" />
        <Link to="/" className="relative flex max-w-full items-center gap-4 self-start">
          <BrandMark className="size-14 ring-2 ring-brand-spark/70 md:size-16" />
          <span className="font-display text-xl font-bold text-brand-spark md:text-2xl lg:text-3xl">LD Screening <span className="text-hero-foreground">· DUT</span></span>
        </Link>
        <div className="relative hidden md:block">
          <h2 className="max-w-lg font-display text-3xl font-bold lg:text-4xl">
            A little insight can open the door to support.
          </h2>
          <p className="mt-4 max-w-md text-base text-hero-muted">
            Take the activities at your pace. Your results stay private and any indicators are reviewed by Disability Unit staff.
          </p>
        </div>
        <p className="relative hidden text-sm text-hero-muted md:block">
          Screening indicators only — this system never diagnoses.
        </p>
      </aside>

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
                <button
                  type="button"
                  onClick={() => setShowReset((v) => !v)}
                  className="w-full text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Forgot password?
                </button>
                {showReset && (
                  <form onSubmit={handleResetPassword} className="space-y-3 rounded-md border border-border bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground">
                      Enter your account email and we'll send you a link to choose a new password.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email address</Label>
                      <Input id="reset-email" name="resetEmail" type="email" required autoComplete="email" />
                    </div>
                    <Button type="submit" variant="secondary" className="w-full" disabled={busy}>
                      {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                      Send reset link
                    </Button>
                  </form>
                )}
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
                  <Label htmlFor="signup-student-number">Student number</Label>
                  <Input
                    id="signup-student-number"
                    name="studentNumber"
                    inputMode="numeric"
                    pattern="\d{8}"
                    maxLength={8}
                    required
                    placeholder="e.g. 22418104"
                    aria-describedby="student-number-hint"
                  />
                  <p id="student-number-hint" className="text-xs text-muted-foreground">
                    Your 8-digit DUT student number.
                  </p>
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
