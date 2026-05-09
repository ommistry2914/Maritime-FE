import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarPlus, ShieldAlert, AlertTriangle, Calendar, Users,
  MapPin, Clock, SlidersHorizontal, X, Plus, Eye, Pencil, Save,
} from "lucide-react";
import { toast } from "sonner";
import { operationsApi } from "@/api/operations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/slice/hook";
import type { SafetyDrill } from "@/types/operations.types";

const emptyForm = {
  title: "", drillType: "fire", ship: "", location: "",
  musterStation: "", objective: "", durationMinutes: "30",
  scheduledDate: "", participants: [] as string[],
};

const DRILL_ICONS: Record<string, string> = {
  fire: "🔥", evacuation: "🚨", manOverboard: "🌊",
  abandonShip: "⛵", medical: "🏥", other: "📋",
};
const DRILL_LABELS: Record<string, string> = {
  fire: "Fire", evacuation: "Evacuation", manOverboard: "Man Overboard",
  abandonShip: "Abandon Ship", medical: "Medical", other: "Other",
};

function SLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { scheduled: "badge-progress", completed: "badge-completed", cancelled: "badge-cancelled" };
  return <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${map[status] ?? "badge-pending"}`}>{status}</span>;
}

/* ── View Modal ─────────────────────────────────────────────────── */
function ViewModal({ drill, onClose }: { drill: SafetyDrill; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "oklch(0 0 0 / 50%)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-card shadow-2xl border border-border" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="font-bold text-foreground">{drill.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Drill Details</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Drill Type", value: `${DRILL_ICONS[drill.drillType] ?? "📋"} ${DRILL_LABELS[drill.drillType] ?? drill.drillType}` },
              { label: "Status", value: <StatusBadge status={drill.status} /> },
              { label: "Ship", value: drill.ship?.name ?? "—" },
              { label: "Scheduled Date", value: new Date(drill.scheduledDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) },
              { label: "Location", value: drill.location },
              { label: "Muster Station", value: drill.musterStation },
              { label: "Duration", value: `${drill.durationMinutes} minutes` },
              { label: "Participants", value: `${drill.participants.length} crew assigned` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                <p className="text-sm font-medium text-foreground">{value as React.ReactNode}</p>
              </div>
            ))}
          </div>
          {drill.objective && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Objective</p>
              <p className="text-sm text-foreground rounded-xl bg-muted/50 p-3">{drill.objective}</p>
            </div>
          )}
          {drill.participants.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Crew Participants</p>
              <div className="flex flex-wrap gap-2">
                {drill.participants.map((p) => (
                  <span key={p.crew?.id} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${p.completed ? "badge-completed" : "badge-pending"}`}>
                    {p.crew?.firstName} {p.crew?.lastName} {p.completed ? "✓" : ""}
                  </span>
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

/* ── Edit Modal ─────────────────────────────────────────────────── */
function EditModal({ drill, ships, crew, onClose, onSave }: {
  drill: SafetyDrill; ships: any[]; crew: any[];
  onClose: () => void; onSave: (id: string, payload: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    title: drill.title,
    drillType: drill.drillType,
    ship: drill.ship?._id ?? "",
    location: drill.location,
    musterStation: drill.musterStation,
    objective: drill.objective ?? "",
    durationMinutes: String(drill.durationMinutes),
    scheduledDate: drill.scheduledDate ? drill.scheduledDate.split("T")[0] : "",
    status: drill.status,
    participants: drill.participants.map((p) => p.crew?.id ?? "").filter(Boolean),
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim() || !form.ship || !form.scheduledDate) {
      toast.error("Title, ship, and date are required."); return;
    }
    setSaving(true);
    onSave(drill._id, {
      ...form,
      durationMinutes: Number(form.durationMinutes),
      objective: form.objective.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "oklch(0 0 0 / 50%)" }} onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-card shadow-2xl border border-border my-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="font-bold text-foreground">Edit Drill</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{drill.title}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div><SLabel>Title *</SLabel><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-xl" /></div>
            <div>
              <SLabel>Drill Type</SLabel>
              <select value={form.drillType} onChange={e => setForm({ ...form, drillType: e.target.value })} className="maritime-select">
                <option value="fire">🔥 Fire</option><option value="evacuation">🚨 Evacuation</option>
                <option value="manOverboard">🌊 Man Overboard</option><option value="abandonShip">⛵ Abandon Ship</option>
                <option value="medical">🏥 Medical</option><option value="other">📋 Other</option>
              </select>
            </div>
            <div>
              <SLabel>Ship *</SLabel>
              <select value={form.ship} onChange={e => setForm({ ...form, ship: e.target.value })} className="maritime-select">
                <option value="">Select ship</option>
                {ships.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div><SLabel>Location *</SLabel><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="rounded-xl" /></div>
            <div><SLabel>Muster Station *</SLabel><Input value={form.musterStation} onChange={e => setForm({ ...form, musterStation: e.target.value })} className="rounded-xl" /></div>
            <div><SLabel>Scheduled Date *</SLabel><Input type="date" value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })} className="rounded-xl" /></div>
            <div><SLabel>Duration (min)</SLabel><Input type="number" min="5" max="480" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: e.target.value })} className="rounded-xl" /></div>
            <div>
              <SLabel>Status</SLabel>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as SafetyDrill["status"] })} className="maritime-select">
                <option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3"><SLabel>Objective</SLabel><Input value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} className="rounded-xl" placeholder="Optional" /></div>
          </div>
          <div>
            <SLabel>Participants (Ctrl/Cmd to multi-select)</SLabel>
            <select multiple value={form.participants} onChange={e => setForm({ ...form, participants: Array.from(e.target.selectedOptions).map(o => o.value) })} className="maritime-select h-auto min-h-[90px] py-2">
              {crew.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
            </select>
          </div>
        </div>
        <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl font-semibold">
            <Save className="h-4 w-4" />{saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
export default function Drills() {
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";

  const [filters, setFilters] = useState({ status: "", ship: "", from: "", to: "" });
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [viewDrill, setViewDrill] = useState<SafetyDrill | null>(null);
  const [editDrill, setEditDrill] = useState<SafetyDrill | null>(null);

  const { data: ships = [] } = useQuery({ queryKey: ["ships"], queryFn: operationsApi.ships, enabled: isAdmin });
  const { data: crew = [] } = useQuery({ queryKey: ["crew"], queryFn: operationsApi.crew, enabled: isAdmin });
  const { data: drills = [], isLoading } = useQuery({
    queryKey: ["drills", filters, isAdmin],
    queryFn: () => operationsApi.drills({
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
      setForm(emptyForm); setFormError(""); setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["drills"] });
      queryClient.invalidateQueries({ queryKey: ["compliance-summary"] });
      toast.success("Safety drill scheduled successfully.");
    },
  });

  const updateDrill = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      operationsApi.updateDrill(id, payload),
    onSuccess: () => {
      setEditDrill(null);
      queryClient.invalidateQueries({ queryKey: ["drills"] });
      queryClient.invalidateQueries({ queryKey: ["compliance-summary"] });
      toast.success("Drill updated successfully.");
    },
    onError: () => toast.error("Failed to update drill."),
  });

  const markDrill = useMutation({
    mutationFn: (id: string) => operationsApi.markDrill(id, { attended: true, completed: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drills"] });
      queryClient.invalidateQueries({ queryKey: ["compliance-summary"] });
      toast.success("Attendance marked.");
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (form.title.trim().length < 3) return setFormError("Drill title must be at least 3 characters.");
    if (!form.ship || !form.scheduledDate) return setFormError("Ship and scheduled date are required.");
    if (!form.location.trim() || !form.musterStation.trim()) return setFormError("Location and muster station are required.");
    if (form.objective.trim() && form.objective.trim().length < 10) return setFormError("Objective must be at least 10 characters.");
    if (Number(form.durationMinutes) < 5 || Number(form.durationMinutes) > 480) return setFormError("Duration must be 5–480 minutes.");
    if (form.participants.length === 0) { toast.error("Select at least one crew participant."); return setFormError("At least one participant is required."); }
    const scheduledDate = new Date(form.scheduledDate);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (scheduledDate < today) return setFormError("Scheduled date cannot be in the past.");
    createDrill.mutate({ ...form, objective: form.objective.trim() || undefined, durationMinutes: Number(form.durationMinutes), scheduledDate: scheduledDate.toISOString() });
  };

  const hasFilters = filters.status || filters.ship || filters.from || filters.to;

  return (
    <div className="space-y-6">
      {/* Modals */}
      {viewDrill && <ViewModal drill={viewDrill} onClose={() => setViewDrill(null)} />}
      {editDrill && isAdmin && (
        <EditModal
          drill={editDrill} ships={ships} crew={crew}
          onClose={() => setEditDrill(null)}
          onSave={(id, payload) => updateDrill.mutate({ id, payload })}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Safety Drill Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">Schedule emergency drills, assign crews, and capture participation.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm(v => !v)} className="gap-2 rounded-xl font-semibold shadow-sm">
            {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Schedule Drill</>}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
            <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="maritime-select flex-1 min-w-[140px]">
              <option value="">All Statuses</option><option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option><option value="cancelled">Cancelled</option>
            </select>
            {isAdmin && (
              <select value={filters.ship} onChange={e => setFilters({ ...filters, ship: e.target.value })} className="maritime-select flex-1 min-w-[140px]">
                <option value="">All Ships</option>
                {ships.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            )}
            <Input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} className="flex-1 min-w-[130px] rounded-xl" />
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={() => setFilters({ status: "", ship: "", from: "", to: "" })} className="gap-1.5 rounded-xl text-muted-foreground">
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Form */}
      {isAdmin && showForm && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <CalendarPlus className="h-4 w-4 text-primary" /> Schedule Safety Drill
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div><SLabel>Drill Title *</SLabel><Input required placeholder="e.g. Fire Response Drill Q2" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-xl" /></div>
                <div>
                  <SLabel>Drill Type</SLabel>
                  <select value={form.drillType} onChange={e => setForm({ ...form, drillType: e.target.value })} className="maritime-select">
                    <option value="fire">🔥 Fire</option><option value="evacuation">🚨 Evacuation</option>
                    <option value="manOverboard">🌊 Man Overboard</option><option value="abandonShip">⛵ Abandon Ship</option>
                    <option value="medical">🏥 Medical</option><option value="other">📋 Other</option>
                  </select>
                </div>
                <div>
                  <SLabel>Ship *</SLabel>
                  <select required value={form.ship} onChange={e => setForm({ ...form, ship: e.target.value })} className="maritime-select">
                    <option value="">Select ship</option>
                    {ships.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div><SLabel>Location *</SLabel><Input required placeholder="e.g. Main deck" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="rounded-xl" /></div>
                <div><SLabel>Muster Station *</SLabel><Input required placeholder="e.g. Station A" value={form.musterStation} onChange={e => setForm({ ...form, musterStation: e.target.value })} className="rounded-xl" /></div>
                <div><SLabel>Scheduled Date *</SLabel><Input required type="date" value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })} className="rounded-xl" /></div>
                <div><SLabel>Duration (minutes)</SLabel><Input type="number" min="5" max="480" placeholder="30" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: e.target.value })} className="rounded-xl" /></div>
                <div className="sm:col-span-2"><SLabel>Objective (optional)</SLabel><Input placeholder="Describe the drill objective" value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div>
                <SLabel>Participants * (hold Ctrl/Cmd for multiple)</SLabel>
                <select multiple value={form.participants} onChange={e => setForm({ ...form, participants: Array.from(e.target.selectedOptions).map(o => o.value) })} className="maritime-select h-auto min-h-[100px] py-2">
                  {crew.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                </select>
                {form.participants.length > 0 && <p className="mt-1.5 text-xs text-muted-foreground">{form.participants.length} crew member{form.participants.length !== 1 ? "s" : ""} selected</p>}
              </div>
              {formError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />{formError}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setForm(emptyForm); setFormError(""); }} className="rounded-xl">Reset</Button>
                <Button type="submit" disabled={createDrill.isPending} className="gap-2 rounded-xl font-semibold">
                  <CalendarPlus className="h-4 w-4" />{createDrill.isPending ? "Scheduling..." : "Schedule Drill"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Drill List */}
      <div className="space-y-3">
        {isLoading && [...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}

        {!isLoading && drills.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background py-16 text-center">
            <ShieldAlert className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No drills found</p>
            <p className="text-xs text-muted-foreground mt-1">{hasFilters ? "Try adjusting your filters." : "Schedule a drill to get started."}</p>
          </div>
        )}

        {drills.map((drill) => {
          const missed = drill.status !== "completed" && new Date(drill.scheduledDate) < new Date();
          const myRecord = drill.participants.find(item => item.crew?.id === user?.id);
          return (
            <Card key={drill._id} className="border-0 shadow-sm transition-all hover:shadow-md"
              style={missed ? { borderLeft: "4px solid oklch(0.58 0.22 27)" } : {}}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start gap-4 lg:flex-nowrap lg:items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-bold">{drill.title}</h3>
                      {missed && <span className="badge-overdue inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold"><AlertTriangle className="h-3 w-3" />Missed</span>}
                      <span className="badge-progress inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold">
                        <span>{DRILL_ICONS[drill.drillType] ?? "📋"}</span>{DRILL_LABELS[drill.drillType] ?? drill.drillType}
                      </span>
                      <StatusBadge status={drill.status} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(drill.scheduledDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{drill.location} · {drill.musterStation}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{drill.durationMinutes} min</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{drill.participants.length} crew</span>
                    </div>
                    {drill.ship?.name && <p className="text-xs text-muted-foreground mt-0.5">🚢 {drill.ship.name}</p>}
                  </div>

                  {/* Action buttons */}
                  <div className="flex shrink-0 items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setViewDrill(drill)} className="gap-1.5 rounded-xl" title="View details">
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                    {isAdmin && (
                      <Button size="sm" variant="outline" onClick={() => setEditDrill(drill)} className="gap-1.5 rounded-xl" title="Edit drill">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                    )}
                    {!isAdmin && (
                      <Button size="sm"
                        disabled={myRecord?.completed || markDrill.isPending}
                        onClick={() => markDrill.mutate(drill._id)}
                        className={`rounded-xl font-semibold ${myRecord?.completed ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 cursor-default" : ""}`}
                        variant={myRecord?.completed ? "outline" : "default"}>
                        {myRecord?.completed ? "✓ Attended" : "Mark Attendance"}
                      </Button>
                    )}
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
