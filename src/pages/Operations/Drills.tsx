import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { operationsApi } from "@/api/operations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/slice/hook";

const emptyForm = {
  title: "",
  drillType: "fire",
  ship: "",
  location: "",
  musterStation: "",
  objective: "",
  durationMinutes: "30",
  scheduledDate: "",
  participants: [] as string[],
};

export default function Drills() {
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";
  const [filters, setFilters] = useState({ status: "", ship: "", from: "", to: "" });
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const { data: ships = [] } = useQuery({ queryKey: ["ships"], queryFn: operationsApi.ships, enabled: isAdmin });
  const { data: crew = [] } = useQuery({ queryKey: ["crew"], queryFn: operationsApi.crew, enabled: isAdmin });
  const { data: drills = [], isLoading } = useQuery({
    queryKey: ["drills", filters, isAdmin],
    queryFn: () =>
      operationsApi.drills({
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.ship ? { ship: filters.ship } : {}),
        ...(filters.from ? { from: filters.from } : {}),
        ...(filters.to ? { to: filters.to } : {}),
        ...(!isAdmin ? { mine: "true" } : {}),
      }),
  });

  const createDrill = useMutation({
    mutationFn: operationsApi.createDrill,
    onSuccess: () => {
      setForm(emptyForm);
      setFormError("");
      queryClient.invalidateQueries({ queryKey: ["drills"] });
      queryClient.invalidateQueries({ queryKey: ["compliance-summary"] });
    },
  });

  const markDrill = useMutation({
    mutationFn: (id: string) => operationsApi.markDrill(id, { attended: true, completed: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drills"] });
      queryClient.invalidateQueries({ queryKey: ["compliance-summary"] });
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (form.title.trim().length < 3) return setFormError("Drill title must be at least 3 characters.");
    if (!form.ship || !form.scheduledDate) return setFormError("Ship and scheduled date are required.");
    if (!form.location.trim() || !form.musterStation.trim()) return setFormError("Location and muster station are required.");
    if (form.objective.trim() && form.objective.trim().length < 10) return setFormError("Objective must be at least 10 characters when provided.");
    if (Number(form.durationMinutes) < 5 || Number(form.durationMinutes) > 480) return setFormError("Duration must be between 5 and 480 minutes.");
    if (form.participants.length === 0) {
      toast.error("Select at least one crew participant.");
      return setFormError("At least one crew participant is required.");
    }
    const scheduledDate = new Date(form.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (scheduledDate < today) return setFormError("Scheduled date cannot be in the past.");

    createDrill.mutate({
      ...form,
      objective: form.objective.trim() || undefined,
      durationMinutes: Number(form.durationMinutes),
      scheduledDate: scheduledDate.toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Safety Drill Management</h2>
        <p className="text-sm text-muted-foreground">Schedule emergency drills, assign crews, and capture participation.</p>
      </div>

      <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-4">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={filters.ship} onChange={(e) => setFilters({ ...filters, ship: e.target.value })} className="h-10 rounded-md border bg-background px-3 text-sm" disabled={!isAdmin}>
          <option value="">All ships</option>
          {ships.map((ship) => <option key={ship._id} value={ship._id}>{ship.name}</option>)}
        </select>
        <Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <Button type="button" variant="outline" onClick={() => setFilters({ status: "", ship: "", from: "", to: "" })}>Clear Filters</Button>
      </div>

      {isAdmin && (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Schedule Safety Drill</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-3 lg:grid-cols-6">
              <Input required placeholder="Drill title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <select value={form.drillType} onChange={(e) => setForm({ ...form, drillType: e.target.value })} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="fire">Fire</option>
                <option value="evacuation">Evacuation</option>
                <option value="manOverboard">Man overboard</option>
                <option value="abandonShip">Abandon ship</option>
                <option value="medical">Medical</option>
                <option value="other">Other</option>
              </select>
              <select required value={form.ship} onChange={(e) => setForm({ ...form, ship: e.target.value })} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">Ship</option>
                {ships.map((ship) => <option key={ship._id} value={ship._id}>{ship.name}</option>)}
              </select>
              <Input required placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <Input required placeholder="Muster station" value={form.musterStation} onChange={(e) => setForm({ ...form, musterStation: e.target.value })} />
              <Input required type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
              <Input type="number" min="5" max="480" placeholder="Duration minutes" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
              <Input placeholder="Objective" value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} />
              <select multiple value={form.participants} onChange={(e) => setForm({ ...form, participants: Array.from(e.target.selectedOptions).map((option) => option.value) })} className="min-h-10 rounded-md border bg-background px-3 py-2 text-sm lg:col-span-2">
                {crew.map((member) => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}
              </select>
              {formError && <p className="text-sm text-red-600 lg:col-span-6">{formError}</p>}
              <Button type="submit" disabled={createDrill.isPending}><CalendarPlus className="h-4 w-4" /> Schedule</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading drills...</p>}
        {drills.map((drill) => {
          const missed = drill.status !== "completed" && new Date(drill.scheduledDate) < new Date();
          const myRecord = drill.participants.find((item) => item.crew?.id === user?.id);
          return (
            <Card key={drill._id} className="rounded-lg">
              <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{drill.title}</h3>
                    {missed && <span className="rounded-md bg-red-100 px-2 py-1 text-xs text-red-700">Missed</span>}
                    <span className="rounded-md bg-muted px-2 py-1 text-xs">{drill.drillType}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{drill.ship?.name} - {new Date(drill.scheduledDate).toLocaleDateString()}</p>
                  <p className="text-sm text-muted-foreground">{drill.location} - muster at {drill.musterStation} - {drill.durationMinutes} min</p>
                  <p className="text-sm text-muted-foreground">{drill.participants.length} crew assigned</p>
                </div>
                {!isAdmin && (
                  <Button disabled={myRecord?.completed || markDrill.isPending} onClick={() => markDrill.mutate(drill._id)}>
                    {myRecord?.completed ? "Completed" : "Mark Attendance"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
