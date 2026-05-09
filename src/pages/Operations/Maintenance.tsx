import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { operationsApi } from "@/api/operations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/slice/hook";
import { toast } from "sonner";

export default function Maintenance() {
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "superAdmin" || user?.role === "admin";
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({ title: "", description: "", ship: "", assignedTo: "", dueDate: "", priority: "medium" });

  const { data: ships = [] } = useQuery({ queryKey: ["ships"], queryFn: operationsApi.ships, enabled: isAdmin });
  const { data: crew = [] } = useQuery({ queryKey: ["crew"], queryFn: operationsApi.crew, enabled: isAdmin });
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["maintenance", status, isAdmin],
    queryFn: () => operationsApi.maintenance({ ...(status ? { status } : {}), ...(!isAdmin ? { mine: "true" } : {}) }),
  });

  const createTask = useMutation({
    mutationFn: operationsApi.createMaintenance,
    onSuccess: () => {
      setForm({ title: "", description: "", ship: "", assignedTo: "", dueDate: "", priority: "medium" });
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["compliance-summary"] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status: string; note?: string } }) => operationsApi.updateMaintenanceStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["compliance-summary"] });
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.ship || !form.assignedTo || !form.dueDate) {
      toast.error("Select a ship, crew member, and due date before creating the task.");
      return;
    }
    createTask.mutate({ ...form, dueDate: new Date(form.dueDate).toISOString() });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Maintenance Management</h2>
          <p className="text-sm text-muted-foreground">Create, assign, track, and close vessel maintenance tasks.</p>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="inProgress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
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
              <select required value={form.ship} onChange={(e) => setForm({ ...form, ship: e.target.value })} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">Ship</option>
                {ships.map((ship) => <option key={ship._id} value={ship._id}>{ship.name}</option>)}
              </select>
              <select required value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">Crew</option>
                {crew.map((member) => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}
              </select>
              <Input required type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
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
              <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{task.title}</h3>
                    {overdue && <span className="rounded-md bg-red-100 px-2 py-1 text-xs text-red-700">Overdue</span>}
                    <span className="rounded-md bg-muted px-2 py-1 text-xs">{task.priority}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{task.ship?.name} - assigned to {task.assignedTo?.firstName} {task.assignedTo?.lastName}</p>
                  <p className="text-sm text-muted-foreground">Due {new Date(task.dueDate).toLocaleDateString()}</p>
                </div>
                <select value={task.status} onChange={(e) => updateStatus.mutate({ id: task._id, payload: { status: e.target.value } })} className="h-10 rounded-md border bg-background px-3 text-sm">
                  <option value="pending">Pending</option>
                  <option value="inProgress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
