import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldPlus, UserPlus, Mail, Phone, Briefcase, Hash } from "lucide-react";
import { toast } from "sonner";
import { operationsApi } from "@/api/operations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/FieldError";
import { validateUserForm, isValid, type UserFormErrors } from "@/lib/validation";
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

const emptyErrors: UserFormErrors = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  employeeId: "",
  rank: "",
  department: "",
  phone: "",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function InitialsAvatar({
  firstName,
  lastName,
  role,
}: {
  firstName: string;
  lastName: string;
  role: string;
}) {
  const initials =
    (firstName?.[0] ?? "") + (lastName?.[0] ?? "");
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow"
      style={{
        background:
          role === "admin"
            ? "linear-gradient(135deg, oklch(0.42 0.15 220), oklch(0.55 0.18 195))"
            : role === "crew"
              ? "linear-gradient(135deg, oklch(0.55 0.18 160), oklch(0.65 0.2 145))"
              : "linear-gradient(135deg, oklch(0.7 0.18 75), oklch(0.72 0.2 60))",
      }}
    >
      {initials.toUpperCase() || "?"}
    </div>
  );
}

export default function AccountManagement() {
  const queryClient = useQueryClient();
  const currentUser = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = currentUser?.role === "superAdmin";
  const managedRole = isSuperAdmin ? "admin" : "crew";
  const [form, setForm] = useState<AccountForm>(() => emptyForm(managedRole));
  const [errors, setErrors] = useState<UserFormErrors>(emptyErrors);
  const [showForm, setShowForm] = useState(false);
  const listParams = useMemo(() => ({ role: managedRole }), [managedRole]);

  const updateField = <K extends keyof UserFormErrors & keyof AccountForm>(
    field: K,
    value: AccountForm[K]
  ) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      const nextErrors = validateUserForm(next);
      setErrors((currentErrors) => ({
        ...currentErrors,
        [field]: nextErrors[field],
      }));
      return next;
    });
  };

  const resetForm = () => {
    const next = emptyForm(managedRole);
    setForm(next);
    setErrors(emptyErrors);
  };

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["managed-users", managedRole],
    queryFn: () => operationsApi.users(listParams),
  });

  const createUser = useMutation({
    mutationFn: operationsApi.createUser,
    onSuccess: () => {
      resetForm();
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["managed-users"] });
      queryClient.invalidateQueries({ queryKey: ["crew"] });
      toast.success(
        isSuperAdmin ? "Admin account created." : "Crew member added."
      );
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const errs = validateUserForm(form);
    setErrors(errs);
    if (!isValid(errs)) { toast.error("Please fix the highlighted fields."); return; }
    const basePayload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
      role: managedRole,
    };
    createUser.mutate(
      isSuperAdmin
        ? basePayload
        : {
            ...basePayload,
            employeeId: form.employeeId,
            rank: form.rank,
            department: form.department,
            phone: form.phone,
          }
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isSuperAdmin ? "Admin Management" : "Crew Management"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSuperAdmin
              ? "Create and review administrators who operate the maritime compliance system."
              : "Create crew records with operational details used for task and drill assignment."}
          </p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="gap-2 rounded-xl font-semibold shadow-sm"
        >
          {isSuperAdmin ? (
            <ShieldPlus className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {showForm
            ? "Cancel"
            : isSuperAdmin
              ? "Create Admin"
              : "Add Crew Member"}
        </Button>
      </div>

      {/* ── Create Form ── */}
      {showForm && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              {isSuperAdmin ? (
                <ShieldPlus className="h-4 w-4 text-primary" />
              ) : (
                <UserPlus className="h-4 w-4 text-primary" />
              )}
              {isSuperAdmin ? "New Administrator" : "New Crew Member"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <SectionLabel>First Name *</SectionLabel>
                  <Input
                    placeholder="John"
                    value={form.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    className={`rounded-xl ${errors.firstName ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                  />
                  <FieldError msg={errors.firstName} />
                </div>
                <div>
                  <SectionLabel>Last Name *</SectionLabel>
                  <Input
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    className={`rounded-xl ${errors.lastName ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                  />
                  <FieldError msg={errors.lastName} />
                </div>
                <div>
                  <SectionLabel>Email *</SectionLabel>
                  <Input
                    type="email"
                    placeholder="john.doe@example.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={`rounded-xl ${errors.email ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                  />
                  <FieldError msg={errors.email} />
                </div>
                <div>
                  <SectionLabel>Temporary Password *</SectionLabel>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    className={`rounded-xl ${errors.password ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                  />
                  <FieldError msg={errors.password} />
                </div>

                {!isSuperAdmin && (
                  <>
                    <div>
                      <SectionLabel>Employee ID *</SectionLabel>
                      <Input
                        placeholder="e.g. EMP-001"
                        value={form.employeeId}
                        onChange={(e) =>
                          updateField("employeeId", e.target.value)
                        }
                        className={`rounded-xl ${errors.employeeId ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      />
                      <FieldError msg={errors.employeeId} />
                    </div>
                    <div>
                      <SectionLabel>Rank / Designation *</SectionLabel>
                      <Input
                        placeholder="e.g. Chief Engineer"
                        value={form.rank}
                        onChange={(e) =>
                          updateField("rank", e.target.value)
                        }
                        className={`rounded-xl ${errors.rank ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      />
                      <FieldError msg={errors.rank} />
                    </div>
                    <div>
                      <SectionLabel>Department *</SectionLabel>
                      <select
                        value={form.department}
                        onChange={(e) =>
                          updateField(
                            "department",
                            e.target.value as AccountForm["department"]
                          )
                        }
                        className={`maritime-select ${errors.department ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      >
                        <option value="">Select department</option>
                        <option value="deck">Deck</option>
                        <option value="engine">Engine</option>
                        <option value="safety">Safety</option>
                        <option value="operations">Operations</option>
                        <option value="administration">Administration</option>
                      </select>
                      <FieldError msg={errors.department} />
                    </div>
                    <div>
                      <SectionLabel>Phone *</SectionLabel>
                      <Input
                        placeholder="+1 555 000 0000"
                        value={form.phone}
                        onChange={(e) =>
                          updateField("phone", e.target.value)
                        }
                        className={`rounded-xl ${errors.phone ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      />
                      <FieldError msg={errors.phone} />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="rounded-xl"
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={createUser.isPending}
                  className="gap-2 rounded-xl font-semibold"
                >
                  {isSuperAdmin ? (
                    <ShieldPlus className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {createUser.isPending
                    ? "Creating..."
                    : isSuperAdmin
                      ? "Create Admin"
                      : "Add Crew Member"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── User Directory ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <span className="h-2 w-2 rounded-full bg-[oklch(0.55_0.18_195)]" />
              {isSuperAdmin ? "Administrators" : "Crew Directory"}
            </CardTitle>
            <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              {users.length} {isSuperAdmin ? "admin" : "member"}
              {users.length !== 1 ? "s" : ""}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          )}

          {!isLoading && users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserPlus className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">
                No {isSuperAdmin ? "admins" : "crew"} yet
              </p>
            </div>
          )}

          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id || user._id}
                className="group flex items-center gap-4 rounded-xl border border-border bg-background px-4 py-3 transition-all hover:bg-muted/40 hover:shadow-sm"
              >
                <InitialsAvatar
                  firstName={user.firstName}
                  lastName={user.lastName}
                  role={user.role}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </span>
                    {user.phone && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {user.phone}
                      </span>
                    )}
                    {user.rank && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3" />
                        {user.rank}
                      </span>
                    )}
                    {user.employeeId && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        {user.employeeId}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {user.department && (
                    <span className="badge-progress rounded-lg px-2.5 py-1 text-xs font-semibold capitalize">
                      {user.department}
                    </span>
                  )}
                  <span className="badge-completed rounded-lg px-2.5 py-1 text-xs font-semibold capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
