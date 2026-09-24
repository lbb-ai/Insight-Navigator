import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  Home,
  LifeBuoy,
  ListChecks,
  LogOut,
  ScrollText,
  Settings2,
  Users,
  ArrowLeft,
  SlidersHorizontal,
} from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
}

const STUDENT_NAV: NavItem[] = [
  { to: "/student/dashboard", label: "Dashboard", icon: Home },
  { to: "/student/screening", label: "Screening", icon: Activity },
  { to: "/student/support", label: "Support", icon: LifeBuoy },
  { to: "/settings", label: "Settings", icon: SlidersHorizontal },
];

const STAFF_NAV: NavItem[] = [
  { to: "/staff/queue", label: "Review queue", icon: ListChecks },
  { to: "/staff/referrals", label: "Referrals", icon: ClipboardList },
  { to: "/staff/reports", label: "Reports", icon: FileBarChart },
  { to: "/settings", label: "Settings", icon: SlidersHorizontal },
];

const ADMIN_NAV: NavItem[] = [
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/games", label: "Games & thresholds", icon: Settings2 },
  { to: "/admin/reports", label: "System reports", icon: FileBarChart },
  { to: "/admin/audit", label: "Audit log", icon: ScrollText },
  { to: "/settings", label: "Settings", icon: SlidersHorizontal },
];

export interface Crumb {
  label: string;
  to?: string;
}

export function AppShell({
  children,
  title,
  description,
  crumbs,
  actions,
  onBack,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
  onBack?: (() => void) | undefined;
}) {
  const { role, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = role === "admin" ? ADMIN_NAV : role === "staff" ? STAFF_NAV : STUDENT_NAV;
  const roleLabel =
    role === "admin" ? "Administrator" : role === "staff" ? "Disability Unit staff" : "Student";

  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-dvh bg-background md:flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar p-4 text-sidebar-foreground md:flex">
        <Link to="/" className="mb-8 flex items-center gap-2.5 px-2 py-1">
          <span className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="size-5" aria-hidden="true" />
          </span>
          <span className="font-display text-sm leading-tight font-semibold">
            LD Screening
            <span className="block text-xs font-normal opacity-70">DUT Disability Unit</span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 rounded-xl border border-sidebar-border p-3">
          <p className="truncate text-sm font-semibold">{profile?.full_name || "Signed in"}</p>
          <p className="text-xs opacity-70">{roleLabel}</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-3 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-3.5" aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-4" aria-hidden="true" />
            </span>
            <span className="font-display text-sm font-semibold">LD Screening</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="size-4" aria-hidden="true" />
            <span className="sr-only md:not-sr-only">Sign out</span>
          </Button>
        </header>

        <main id="main-content" className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">
          <div className="mx-auto w-full max-w-6xl">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 mb-2"
              onClick={() => (onBack ? onBack() : window.history.length > 1 ? window.history.back() : void navigate({ to: "/" }))}
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> Back
            </Button>
            {crumbs && crumbs.length > 0 && (
              <nav aria-label="Breadcrumb" className="mb-3">
                <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  {crumbs.map((c, i) => (
                    <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
                      {c.to ? (
                        <Link to={c.to} className="underline-offset-4 hover:underline">
                          {c.label}
                        </Link>
                      ) : (
                        <span className="text-foreground">{c.label}</span>
                      )}
                      {i < crumbs.length - 1 && <span aria-hidden="true">/</span>}
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-semibold md:text-3xl">{title}</h1>
                {description && (
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
                )}
              </div>
              {actions}
            </div>

            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav
          aria-label="Main navigation"
          className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 backdrop-blur md:hidden"
        >
          {nav.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px]",
                  active ? "font-semibold text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
