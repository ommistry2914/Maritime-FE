import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Wrench, AlertTriangle, Clock, ShieldAlert, SlidersHorizontal, X, Eye, Pencil, Save } from "lucide-react";
import { toast } from "sonner";
import { operationsApi } from "@/api/operations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/slice/hook";
import type { MaintenanceTask } from "@/types/operations.types";

const emptyForm = { title: "", description: "", category: "engine", component: "", location: "", ship: "", assignedTo: "", dueDate: "", priority: "medium", estimatedHours: "", safetyCritical: false };

function SL({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>;
}

function PBadge({ priority }: { priority: string }) {
  const m: Record<string, string> = { low: "badge-low", medium: "badge-medium", high: "badge-high", critical: "badge-critical" };
  return <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${m[priority] ?? "badge-medium"}`}>{priority}</span>;
}

function SBadge({ status }: { status: string }) {
  const m: Record<string, string> = { pending: "badge-pending", inProgress: "badge-progress", completed: "badge-completed" };
  const l: Record<string, string> = { pending: "Pending", inProgress: "In Progress", completed: "Completed" };
  return <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${m[status] ?? "badge-pending"}`}>{l[status] ?? status}</span>;
}

/* ── View Modal ── */
function ViewModal({ task, onClose }: { task: MaintenanceTask; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "oklch(0 0 0/50%)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-card shadow-2xl border border-border my-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div><h3 className="font-bold">{task.title}</h3><p className="text-xs text-muted-foreground mt-0.5">Maintenance Task Details</p></div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Status", value: <SBadge status={task.status} /> },
              { label: "Priority", value: <PBadge priority={task.priority} /> },
              { label: "Ship", value: task.ship?.name ?? "—" },
              { label: "Assigned To", value: `${task.assignedTo?.firstName ?? ""} ${task.assignedTo?.lastName ?? ""}`.trim() || "—" },
              { label: "Component", value: task.component },
              { label: "Category", value: task.category },
              { label: "Due Date", value: new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) },
              { label: "Est. Hours", value: task.estimatedHours ? `${task.estimatedHours}h` : "—" },
              { label: "Location", value: task.location ?? "—" },
              { label: "Safety Critical", value: task.safetyCritical ? "⚠️ Yes" : "No" },
            ].map(({ label, value }) => (
              <div key={label}><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p><p className="text-sm font-medium">{value as React.ReactNode}</p></div>
            ))}
          </div>
          {task.description && <div><SL>Description</SL><p className="text-sm rounded-xl bg-muted/50 p-3">{task.description}</p></div>}
          {task.comments && task.comments.length > 0 && (
            <div>
              <SL>Work Notes ({task.comments.length})</SL>
              <div className="space-y-2">
                {task.comments.map((c, i) => (
                  <div key={i} className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground mb-1">{new Date(c.createdAt).toLocaleString("en-GB")}</p>
                    <p className="text-sm">{c.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-border px-6 py-4 flex justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Close</Button>
        </div>
      </div>
    </div>
  );
}

/* ── Edit Modal ── */
function EditModal({ task, ships, crew, onClose, onSave }: { task: MaintenanceTask; ships: any[]; crew: any[]; onClose: () => void; onSave: (id: string, payload: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({
    title: task.title, description: task.description ?? "", category: task.category,
    component: task.component, location: task.location ?? "", ship: task.ship?._id ?? "",
    assignedTo: task.assignedTo?.id ?? "", dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
    priority: task.priority, estimatedHours: task.estimatedHours ? String(task.estimatedHours) : "",
    safetyCritical: task.safetyCritical,
  });
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "oklch(0 0 0/50%)" }} onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-card shadow-2xl border border-border my-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div><h3 className="font-bold">Edit Task</h3><p className="text-xs text-muted-foreground mt-0.5">{task.title}</p></div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div><SL>Title *</SL><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-xl" /></div>
            <div><SL>Component *</SL><Input value={form.component} onChange={e => setForm({ ...form, component: e.target.value })} className="rounded-xl" /></div>
            <div>
              <SL>Category</SL>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="maritime-select">
                <option value="engine">Engine</option><option value="deck">Deck</option><option value="electrical">Electrical</option>
                <option value="hull">Hull</option><option value="safetyEquipment">Safety Equipment</option><option value="navigation">Navigation</option><option value="other">Other</option>
              </select>
            </div>
            <div>
              <SL>Ship *</SL>
              <select value={form.ship} onChange={e => setForm({ ...form, ship: e.target.value })} className="maritime-select">
                <option value="">Select ship</option>
                {ships.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <SL>Assigned Crew *</SL>
              <select value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} className="maritime-select">
                <option value="">Select crew</option>
                {crew.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
              </select>
            </div>
            <div><SL>Due Date *</SL><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="rounded-xl" /></div>
            <div>
              <SL>Priority</SL>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="maritime-select">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
            <div><SL>Location</SL><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="rounded-xl" placeholder="Vessel location" /></div>
            <div><SL>Est. Hours</SL><Input type="number" min="0.25" step="0.25" value={form.estimatedHours} onChange={e => setForm({ ...form, estimatedHours: e.target.value })} className="rounded-xl" /></div>
          </div>
          <div><SL>Description</SL><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-xl" placeholder="Optional description" /></div>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <input type="checkbox" checked={form.safetyCritical} onChange={e => setForm({ ...form, safetyCritical: e.target.checked })} className="h-4 w-4 rounded accent-primary" />
            <div><p className="text-sm font-semibold">Safety Critical</p><p className="text-xs text-muted-foreground">Mark if failure could pose a safety risk</p></div>
            <ShieldAlert className="ml-auto h-4 w-4 text-orange-500" />
          </label>
        </div>
        <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button disabled={saving} className="gap-2 rounded-xl font-semibold" onClick={() => {
            if (!form.title.trim() || !form.ship || !form.assignedTo || !form.dueDate) { toast.error("Title, ship, crew, and date are required."); return; }
            setSaving(true);
            onSave(task._id, { ...form, estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined, description: form.description.trim() || undefined, location: form.location.trim() || undefined, dueDate: new Date(form.dueDate).toISOString() });
          }}>
            <Save className="h-4 w-4" />{saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function Maintenance() {
  const queryClient = useQueryClient();
  const user = useAppSelector(s => s.auth.user);
  const isAdmin = user?.role === "admin";
  const [filters, setFilters] = useState({ status: "", ship: "", from: "", to: "" });
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [viewTask, setViewTask] = useState<MaintenanceTask | null>(null);
  const [editTask, setEditTask] = useState<MaintenanceTask | null>(null);

  const { data: ships = [] } = useQuery({ queryKey: ["ships"], queryFn: operationsApi.ships, enabled: isAdmin });
  const { data: crew = [] } = useQuery({ queryKey: ["crew"], queryFn: operationsApi.crew, enabled: isAdmin });
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["maintenance", filters, isAdmin],
    queryFn: () => operationsApi.maintenance({ ...(filters.status ? { status: filters.status } : {}), ...(filters.ship ? { ship: filters.ship } : {}), ...(filters.from ? { from: filters.from } : {}), ...(filters.to ? { to: filters.to } : {}), ...(!isAdmin ? { mine: "true" } : {}) }),
  });

  const createTask = useMutation({
    mutationFn: operationsApi.createMaintenance,
    onSuccess: () => { setForm(emptyForm); setFormError(""); setShowForm(false); queryClient.invalidateQueries({ queryKey: ["maintenance"] }); queryClient.invalidateQueries({ queryKey: ["compliance-summary"] }); toast.success("Maintenance task created."); },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => operationsApi.updateMaintenance(id, payload),
    onSuccess: () => { setEditTask(null); queryClient.invalidateQueries({ queryKey: ["maintenance"] }); queryClient.invalidateQueries({ queryKey: ["compliance-summary"] }); toast.success("Task updated successfully."); },
    onError: () => toast.error("Failed to update task."),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status: string; note?: string } }) => operationsApi.updateMaintenanceStatus(id, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["maintenance"] }); queryClient.invalidateQueries({ queryKey: ["compliance-summary"] }); },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (form.title.trim().length < 3) return setFormError("Task title must be at least 3 characters.");
    if (!form.component.trim()) return setFormError("Component is required.");
    if (!form.ship || !form.assignedTo || !form.dueDate) { toast.error("Select ship, crew, and due date."); return setFormError("Ship, crew, and due date are required."); }
    const dueDate = new Date(form.dueDate);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (dueDate < today) return setFormError("Due date cannot be in the past.");
    createTask.mutate({ ...form, description: form.description.trim() || undefined, location: form.location.trim() || undefined, estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined, dueDate: dueDate.toISOString() });
  };

  const updateTaskStatus = (taskId: string, status: string) => {
    const note = taskNotes[taskId]?.trim();
    if (["inProgress", "completed"].includes(status) && !note) { toast.error("Add a work note before changing status."); return; }
    updateStatus.mutate({ id: taskId, payload: { status, note } });
    setTaskNotes(cur => ({ ...cur, [taskId]: "" }));
  };

  const hasFilters = filters.status || filters.ship || filters.from || filters.to;

  return (
    <div className="space-y-6">
      {viewTask && <ViewModal task={viewTask} onClose={() => setViewTask(null)} />}
      {editTask && isAdmin && <EditModal task={editTask} ships={ships} crew={crew} onClose={() => setEditTask(null)} onSave={(id, payload) => updateTask.mutate({ id, payload })} />}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-2xl font-bold tracking-tight">Maintenance Management</h2><p className="mt-1 text-sm text-muted-foreground">Plan work, assign crew, capture notes, and track overdue risk.</p></div>
        {isAdmin && <Button onClick={() => setShowForm(v => !v)} className="gap-2 rounded-xl font-semibold shadow-sm">{showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> New Task</>}</Button>}
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
            <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="maritime-select flex-1 min-w-[140px]">
              <option value="">All Statuses</option><option value="pending">Pending</option><option value="inProgress">In Progress</option><option value="completed">Completed</option>
            </select>
            {isAdmin && <select value={filters.ship} onChange={e => setFilters({ ...filters, ship: e.target.value })} className="maritime-select flex-1 min-w-[140px]">
              <option value="">All Ships</option>{ships.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>}
            <Input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} className="flex-1 min-w-[130px] rounded-xl" />
            <Input type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} className="flex-1 min-w-[130px] rounded-xl" />
            {hasFilters && <Button variant="ghost" size="sm" onClick={() => setFilters({ status: "", ship: "", from: "", to: "" })} className="gap-1.5 rounded-xl text-muted-foreground"><X className="h-3.5 w-3.5" />Clear</Button>}
          </div>
        </CardContent>
      </Card>

      {isAdmin && showForm && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base font-semibold"><Wrench className="h-4 w-4 text-primary" />New Maintenance Task</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div><SL>Task Title *</SL><Input required placeholder="e.g. Engine oil change" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-xl" /></div>
                <div><SL>Component *</SL><Input required placeholder="e.g. Main engine" value={form.component} onChange={e => setForm({ ...form, component: e.target.value })} className="rounded-xl" /></div>
                <div><SL>Category</SL><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="maritime-select">
                  <option value="engine">Engine</option><option value="deck">Deck</option><option value="electrical">Electrical</option><option value="hull">Hull</option><option value="safetyEquipment">Safety Equipment</option><option value="navigation">Navigation</option><option value="other">Other</option>
                </select></div>
                <div><SL>Ship *</SL><select required value={form.ship} onChange={e => setForm({ ...form, ship: e.target.value })} className="maritime-select"><option value="">Select ship</option>{ships.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</select></div>
                <div><SL>Assigned Crew *</SL><select required value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} className="maritime-select"><option value="">Select crew</option>{crew.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}</select></div>
                <div><SL>Due Date *</SL><Input required type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="rounded-xl" /></div>
                <div><SL>Priority</SL><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="maritime-select"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
                <div><SL>Location</SL><Input placeholder="Vessel location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="rounded-xl" /></div>
                <div><SL>Est. Hours</SL><Input type="number" min="0.25" step="0.25" placeholder="e.g. 4.5" value={form.estimatedHours} onChange={e => setForm({ ...form, estimatedHours: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div><SL>Description</SL><Input placeholder="Optional description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-xl" /></div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
                <input type="checkbox" checked={form.safetyCritical} onChange={e => setForm({ ...form, safetyCritical: e.target.checked })} className="h-4 w-4 rounded accent-primary" />
                <div><p className="text-sm font-semibold">Safety Critical</p><p className="text-xs text-muted-foreground">Mark if failure could pose a safety risk</p></div>
                <ShieldAlert className="ml-auto h-4 w-4 text-orange-500" />
              </label>
              {formError && <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"><AlertTriangle className="h-4 w-4 shrink-0" />{formError}</div>}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setForm(emptyForm); setFormError(""); }} className="rounded-xl">Reset</Button>
                <Button type="submit" disabled={createTask.isPending} className="gap-2 rounded-xl font-semibold"><Plus className="h-4 w-4" />{createTask.isPending ? "Creating..." : "Create Task"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {isLoading && [...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        {!isLoading && tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background py-16 text-center">
            <Wrench className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No maintenance tasks found</p>
            <p className="text-xs text-muted-foreground mt-1">{hasFilters ? "Try adjusting your filters." : "Create a task to get started."}</p>
          </div>
        )}
        {tasks.map(task => {
          const overdue = task.status !== "completed" && new Date(task.dueDate) < new Date();
          return (
            <Card key={task._id} className="border-0 shadow-sm transition-all hover:shadow-md" style={overdue ? { borderLeft: "4px solid oklch(0.58 0.22 27)" } : {}}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start gap-4 lg:flex-nowrap lg:items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-bold">{task.title}</h3>
                      {overdue && <span className="badge-overdue inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold"><AlertTriangle className="h-3 w-3" />Overdue</span>}
                      {task.safetyCritical && <span className="badge-safety inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold"><ShieldAlert className="h-3 w-3" />Safety Critical</span>}
                      <PBadge priority={task.priority} /><SBadge status={task.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{task.ship?.name} · Assigned to <span className="font-medium text-foreground">{task.assignedTo?.firstName} {task.assignedTo?.lastName}</span></p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Clock className="h-3 w-3" />{task.component} · Due {new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    {task.comments?.slice(-1).map(c => <p key={`${task._id}-${c.createdAt}`} className="mt-2 rounded-lg bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Latest note:</span> {c.note}</p>)}
                  </div>
                  <div className="flex w-full flex-col gap-2 lg:w-72 shrink-0">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setViewTask(task)} className="gap-1.5 rounded-xl flex-1" title="View details"><Eye className="h-3.5 w-3.5" />View</Button>
                      {isAdmin && <Button size="sm" variant="outline" onClick={() => setEditTask(task)} className="gap-1.5 rounded-xl flex-1" title="Edit task"><Pencil className="h-3.5 w-3.5" />Edit</Button>}
                    </div>
                    <Input placeholder="Work note (required for progress/done)" value={taskNotes[task._id] || ""} onChange={e => setTaskNotes({ ...taskNotes, [task._id]: e.target.value })} className="rounded-xl text-sm" />
                    <select value={task.status} onChange={e => updateTaskStatus(task._id, e.target.value)} className="maritime-select">
                      <option value="pending">Pending</option><option value="inProgress">In Progress</option><option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
