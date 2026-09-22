import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAudit, useAuth, type Role } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "User management — DUT Screening Administration" },
      {
        name: "description",
        content: "Create, review, update and remove accounts and roles for the screening platform.",
      },
      { property: "og:title", content: "User management — DUT Screening Administration" },
      { property: "og:description", content: "Manage students, staff and administrator accounts." },
    ],
  }),
  component: AdminUsers,
});

function AdminUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id),
      }));
    },
  });

  const setRole = async (userId: string, role: Role) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) {
      toast.error("Could not change that role.");
      return;
    }
    void logAudit(user?.id, "changed_user_role", `${userId}:${role}`);
    toast.success("Role updated");
    void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const updateProfile = async (id: string, field: "full_name" | "faculty", value: string) => {
    const { error } = await supabase.from("profiles").update(field === "full_name" ? { full_name: value } : { faculty: value }).eq("id", id);
    if (error) {
      toast.error("Could not save that change.");
      return;
    }
    toast.success("Saved");
    void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const removeProfile = async (id: string) => {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) {
      toast.error("Could not remove that record.");
      return;
    }
    void logAudit(user?.id, "deleted_profile", id);
    toast.success("Profile record removed");
    void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const rows = (data ?? []).filter((p) =>
    search ? `${p.full_name} ${p.faculty ?? ""}`.toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <AppShell
      title="User management"
      description="Accounts, faculties and roles. Role changes take effect the next time the person loads the app."
      crumbs={[{ label: "Users" }]}
    >
      <div className="surface-card overflow-hidden">
        <div className="border-b border-border p-4">
          <Input
            placeholder="Search by name or faculty"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
            aria-label="Search users"
          />
        </div>
        {isLoading ? (
          <Skeleton className="m-4 h-40" />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((p) => (
              <li key={p.id} className="grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_auto] md:items-center">
                <div>
                  <input
                    defaultValue={p.full_name}
                    aria-label={`Name for ${p.full_name || "user"}`}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-semibold"
                    onBlur={(e) =>
                      e.target.value !== p.full_name && updateProfile(p.id, "full_name", e.target.value)
                    }
                  />
                  <input
                    defaultValue={p.faculty ?? ""}
                    placeholder="Faculty"
                    aria-label="Faculty"
                    className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                    onBlur={(e) =>
                      e.target.value !== (p.faculty ?? "") && updateProfile(p.id, "faculty", e.target.value)
                    }
                  />
                </div>
                <select
                  value={(p.roles[0]?.role as Role) ?? "student"}
                  onChange={(e) => setRole(p.id, e.target.value as Role)}
                  aria-label="Role"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="student">Student</option>
                  <option value="staff">Disability Unit staff</option>
                  <option value="admin">Administrator</option>
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProfile(p.id)}
                  aria-label="Remove this profile record"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
