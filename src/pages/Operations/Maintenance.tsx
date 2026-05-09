import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { operationsApi } from "@/api/operations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/slice/hook";

const emptyForm = {
  title: "",
  description: "",
  category: "engine",
  component: "",
  location: "",
  ship: "",
  assignedTo: "",
  dueDate: "",
  priority: "medium",
  estimatedHours: "",
  safetyCritical: false,
};

export default function Maintenance() {
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";
  const [filters, setFilters] = useState({ status: "", ship: "", from: "", to: "" });
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});

  const { data: ships = [] } = useQuery({ queryKey: ["ships"], queryFn: operationsApi.ships, enabled: isAdmin });
  const { data: crew = [] } = useQuery({ queryKey: ["crew"], queryFn: operationsApi.crew, enabled: isAdmin });
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["maintenance", filters, isAdmin],
    queryFn: () =>
      operationsApi.maintenance({
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.ship ? { ship: filters.ship } : {}),
        ...(filters.from ? { from: filters.from } : {}),
        ...(filters.to ? { to: filters.to } : {}),
        ...(!isAdmin ? { mine: "true" } : {}),
      }),
  });

  const createTask = useMutation({
    mutationFn: operationsApi.createMaintenance,
    onSuccess: () => {
      setForm(emptyForm);
      setFormError("");
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["compliance-summary"] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status: string; note?: string } }) =>
      operationsApi.updateMaintenanceStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["compliance-summary"] });
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (form.title.trim().length < 3) return setFormError("Task title must be at least 3 characters.");
    if (form.description.trim() && form.description.trim().length < 10) {
      return setFormError("Description must be at least 10 characters when provided.");
    }
    if (!form.component.trim()) return setFormError("Component or equipment name is required.");
    if (!form.ship || !form.assignedTo || !form.dueDate) {
      toast.error("Select a ship, crew member, and due date before creating the task.");
      return setFormError("Ship, crew member, and due date are required.");
    }
    const dueDate = new Date(form.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDate < today) return setFormError("Due date cannot be in the past.");

    createTask.mutate({
      ...form,
      description: form.description.trim() || undefined,
      location: form.location.trim() || undefined,
      estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
      dueDate: dueDate.toISOString(),
    });
  };

  const updateTaskStatus = (taskId: string, status: string) => {
    const note = taskNotes[taskId]?.trim();
    if (["inProgress", "completed"].includes(status) && !note) {
      toast.error("Add a work note before moving a task to progress or completed.");
      return;
    }
    updateStatus.mutate({ id: taskId, payload: { status, note } });
    setTaskNotes((current) => ({ ...current, [taskId]: "" }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Maintenance Management</h2>
          <p className="text-sm text-muted-foreground">Plan work, assign crew, capture notes, and track overdue risk.</p>
        </div>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="inProgress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-4">
        <select value={filters.ship} onChange={(e) => setFilters({ ...filters, ship: e.target.value })} className="h-10 rounded-md border bg-background px-3 text-sm" disabled={!isAdmin}>
          <option value="">All ships</option>
          {ships.map((ship) => <option key={ship._id} value={ship._id}>{ship.name}</option>)}
        </select>
        <Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <Input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        <Button type="button" variant="outline" onClick={() => setFilters({ status: "", ship: "", from: "", to: "" })}>Clear Filters</Button>
      </div>

      {isAdmin && (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>New Maintenance Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-3 lg:grid-cols-6">
              <Input required placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="engine">Engine</option>
                <option value="deck">Deck</option>
                <option value="electrical">Electrical</option>
                <option value="hull">Hull</option>
                <option value="safetyEquipment">Safety equipment</option>
                <option value="navigation">Navigation</option>
                <option value="other">Other</option>
              </select>
              <Input required placeholder="Component / equipment" value={form.component} onChange={(e) => setForm({ ...form, component: e.target.value })} />
              <Input placeholder="Vessel location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <select required value={form.ship} onChange={(e) => setForm({ ...form, ship: e.target.value })} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">Ship</option>
                {ships.map((ship) => <option key={ship._id} value={ship._id}>{ship.name}</option>)}
              </select>
              <select required value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">Crew</option>
                {crew.map((member) => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}
              </select>
              <Input required type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              <Input type="number" min="0.25" step="0.25" placeholder="Estimated hours" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })} />
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
                <input type="checkbox" checked={form.safetyCritical} onChange={(e) => setForm({ ...form, safetyCritical: e.target.checked })} />
                Safety critical
              </label>
              {formError && <p className="text-sm text-red-600 lg:col-span-6">{formError}</p>}
              <Button type="submit" disabled={createTask.isPending} className="lg:col-span-6 xl:col-span-1"><Plus className="h-4 w-4" /> Create</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading tasks...</p>}
        {tasks.map((task) => {
          const overdue = task.status !== "completed" && new Date(task.dueDate) < new Date();
          return (
            <Card key={task._id} className="rounded-lg">
              <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_320px] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{task.title}</h3>
                    {overdue && <span className="rounded-md bg-red-100 px-2 py-1 text-xs text-red-700">Overdue</span>}
                    {task.safetyCritical && <span className="rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-800">Safety critical</span>}
                    <span className="rounded-md bg-muted px-2 py-1 text-xs">{task.priority}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{task.ship?.name} - assigned to {task.assignedTo?.firstName} {task.assignedTo?.lastName}</p>
                  <p className="text-sm text-muted-foreground">{task.component} - due {new Date(task.dueDate).toLocaleDateString()}</p>
                  {task.comments?.slice(-1).map((comment) => (
                    <p key={`${task._id}-${comment.createdAt}`} className="mt-2 text-sm text-muted-foreground">Latest note: {comment.note}</p>
                  ))}
                </div>
                <div className="grid gap-2">
                  <Input placeholder="Work note required for progress/completion" value={taskNotes[task._id] || ""} onChange={(e) => setTaskNotes({ ...taskNotes, [task._id]: e.target.value })} />
                  <select value={task.status} onChange={(e) => updateTaskStatus(task._id, e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
                    <option value="pending">Pending</option>
                    <option value="inProgress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
