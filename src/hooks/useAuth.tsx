import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "student" | "staff" | "admin";

export interface Profile {
  id: string;
  full_name: string;
  faculty: string | null;
  contact: string | null;
  student_number: string | null;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDetails = async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setRole(null);
      return;
    }
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, faculty, contact, student_number")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile((p as Profile) ?? null);
    const roles = (r ?? []).map((x) => x.role as Role);
    setRole(
      roles.includes("admin")
        ? "admin"
        : roles.includes("staff")
          ? "staff"
          : roles.includes("student")
            ? "student"
            : null,
    );
  };

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      // Defer Supabase calls out of the callback to avoid deadlocks.
      setTimeout(() => {
        void loadDetails(nextSession?.user?.id).finally(() => setLoading(false));
      }, 0);
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadDetails(data.session?.user?.id);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role,
      loading,
      refresh: () => loadDetails(session?.user?.id),
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, profile, role, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function homeForRole(role: Role | null): string {
  if (role === "admin") return "/admin/users";
  if (role === "staff") return "/staff/queue";
  return "/student/dashboard";
}

/** Fire-and-forget POPIA accountability logging. */
export async function logAudit(userId: string | undefined, action: string, target?: string) {
  if (!userId) return;
  await supabase.from("audit_logs").insert({ user_id: userId, action, target: target ?? null });
}
