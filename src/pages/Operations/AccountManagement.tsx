import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldPlus, UserPlus } from "lucide-react";
import { operationsApi } from "@/api/operations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/slice/hook";
import type { User } from "@/types/user.types";

type AccountForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "admin" | "crew" | "user";
  employeeId: string;
  rank: string;
  department: "" | NonNullable<User["department"]>;
  phone: string;
};

const emptyForm = (role: AccountForm["role"]): AccountForm => ({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role,
  employeeId: "",
  rank: "",
  department: "",
  phone: "",
});

export default function AccountManagement() {
  const queryClient = useQueryClient();
  const currentUser = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = currentUser?.role === "superAdmin";
  const managedRole = isSuperAdmin ? "admin" : "crew";
  const [form, setForm] = useState<AccountForm>(() => emptyForm(managedRole));
  const listParams = useMemo(() => ({ role: managedRole }), [managedRole]);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["managed-users", managedRole],
    queryFn: () => operationsApi.users(listParams),
  });

  const createUser = useMutation({
    mutationFn: operationsApi.createUser,
    onSuccess: () => {
      setForm(emptyForm(managedRole));
      queryClient.invalidateQueries({ queryKey: ["managed-users"] });
      queryClient.invalidateQueries({ queryKey: ["crew"] });
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    createUser.mutate({
      ...form,
      role: managedRole,
      department: form.department || undefined,
      employeeId: form.employeeId || undefined,
      rank: form.rank || undefined,
      phone: form.phone || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{isSuperAdmin ? "Admin Management" : "Crew Management"}</h2>
        <p className="text-sm text-muted-foreground">
          {isSuperAdmin
            ? "Create and review administrators who operate the maritime compliance system."
            : "Create crew records with operational details used for task and drill assignment."}
        </p>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>{isSuperAdmin ? "Create Admin" : "Create Crew Member"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3 lg:grid-cols-4">
            <Input required placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input required placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            <Input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input required type="password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

            {!isSuperAdmin && (
              <>
                <Input placeholder="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
                <Input placeholder="Rank / designation" value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} />
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value as AccountForm["department"] })} className="h-10 rounded-md border bg-background px-3 text-sm">
                  <option value="">Department</option>
                  <option value="deck">Deck</option>
                  <option value="engine">Engine</option>
                  <option value="safety">Safety</option>
                  <option value="operations">Operations</option>
                  <option value="administration">Administration</option>
                </select>
                <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </>
            )}

            <Button type="submit" disabled={createUser.isPending} className="lg:col-span-1">
              {isSuperAdmin ? <ShieldPlus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {createUser.isPending ? "Creating..." : "Create"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>{isSuperAdmin ? "Admins" : "Crew Directory"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading accounts...</p>}
          {users.map((user) => (
            <div key={user.id || user._id} className="grid gap-2 rounded-md border p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {!isSuperAdmin && (
                  <p className="text-sm text-muted-foreground">
                    {[user.employeeId, user.rank, user.department].filter(Boolean).join(" - ") || "Crew details pending"}
                  </p>
                )}
              </div>
              <span className="rounded-md bg-muted px-2 py-1 text-xs">{user.role}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
