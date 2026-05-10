import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShipWheel, Plus, Anchor, X, Eye, Pencil, Save } from "lucide-react";
import { toast } from "sonner";
import { operationsApi } from "@/api/operations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/FieldError";
import { validateShip, isValid, type ShipErrors } from "@/lib/validation";
import type { Ship } from "@/types/operations.types";

const STATUS_META: Record<string, { label: string; dot: string; badge: string; strip: string }> = {
  operational: { label: "Operational", dot: "bg-emerald-500", badge: "badge-completed", strip: "linear-gradient(90deg, oklch(0.55 0.18 160), oklch(0.65 0.2 145))" },
  maintenance: { label: "In Maintenance", dot: "bg-amber-500", badge: "badge-pending", strip: "linear-gradient(90deg, oklch(0.7 0.18 75), oklch(0.72 0.2 60))" },
  inactive: { label: "Inactive", dot: "bg-gray-400", badge: "badge-cancelled", strip: "linear-gradient(90deg, oklch(0.6 0.01 0), oklch(0.7 0.01 0))" },
};

const emptyErrors = (): ShipErrors => ({ name: "", imoNumber: "", vesselType: "" });

function SL({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>;
}

/* ── View Modal ── */
function ViewModal({ ship, onClose }: { ship: Ship; onClose: () => void }) {
  const meta = STATUS_META[ship.status] ?? STATUS_META.inactive;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "oklch(0 0 0/50%)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl border border-border" onClick={e => e.stopPropagation()}>
        <div className="h-2 w-full rounded-t-2xl" style={{ background: meta.strip }} />
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-bold text-foreground">{ship.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Vessel Details</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-5">
            {[
              { label: "Vessel Name", value: ship.name },
              { label: "IMO Number", value: ship.imoNumber },
              { label: "Vessel Type", value: ship.vesselType },
              {
                label: "Status", value: (
                  <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />{meta.label}
                  </span>
                )
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                <p className="text-sm font-medium text-foreground">{value as React.ReactNode}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-border px-6 py-4 flex justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Close</Button>
        </div>
      </div>
    </div>
  );
}

/* ── Edit Modal ── */
function EditModal({ ship, onClose, onSave }: { ship: Ship; onClose: () => void; onSave: (id: string, payload: Partial<Ship>) => void }) {
  const [form, setForm] = useState({ name: ship.name, imoNumber: ship.imoNumber, vesselType: ship.vesselType, status: ship.status });
  const [errors, setErrors] = useState<ShipErrors>(emptyErrors());
  const [saving, setSaving] = useState(false);

  const updateField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm(current => {
      const next = { ...current, [field]: value };
      if (field in errors) {
        const nextErrors = validateShip(next);
        setErrors(currentErrors => ({ ...currentErrors, [field]: nextErrors[field as keyof ShipErrors] }));
      }
      return next;
    });
  };

  const handleSave = () => {
    const errs = validateShip(form);
    setErrors(errs);
    if (!isValid(errs)) return;
    setSaving(true);
    onSave(ship._id, form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "oklch(0 0 0/50%)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-card shadow-2xl border border-border" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div><h3 className="font-bold">Edit Vessel</h3><p className="text-xs text-muted-foreground mt-0.5">{ship.name}</p></div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <SL>Ship Name *</SL>
              <Input value={form.name} onChange={e => updateField("name", e.target.value)}
                className={`rounded-xl ${errors.name ? "border-red-400 focus-visible:ring-red-400" : ""}`} />
              <FieldError msg={errors.name} />
            </div>
            <div>
              <SL>IMO Number *</SL>
              <Input value={form.imoNumber} onChange={e => updateField("imoNumber", e.target.value)}
                className={`rounded-xl ${errors.imoNumber ? "border-red-400 focus-visible:ring-red-400" : ""}`} />
              <FieldError msg={errors.imoNumber} />
            </div>
            <div>
              <SL>Vessel Type *</SL>
              <Input value={form.vesselType} onChange={e => updateField("vesselType", e.target.value)}
                className={`rounded-xl ${errors.vesselType ? "border-red-400 focus-visible:ring-red-400" : ""}`} />
              <FieldError msg={errors.vesselType} />
            </div>
            <div>
              <SL>Status</SL>
              <select value={form.status} onChange={e => updateField("status", e.target.value as Ship["status"])} className="maritime-select">
                <option value="operational">Operational</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button disabled={saving} className="gap-2 rounded-xl font-semibold" onClick={handleSave}>
            <Save className="h-4 w-4" />{saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function Ships() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Pick<Ship, "name" | "imoNumber" | "vesselType" | "status">>({ name: "", imoNumber: "", vesselType: "", status: "operational" });
  const [errors, setErrors] = useState<ShipErrors>(emptyErrors());
  const [showForm, setShowForm] = useState(false);
  const [viewShip, setViewShip] = useState<Ship | null>(null);
  const [editShip, setEditShip] = useState<Ship | null>(null);

  const updateField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm(current => {
      const next = { ...current, [field]: value };
      if (field in errors) {
        const nextErrors = validateShip(next);
        setErrors(currentErrors => ({ ...currentErrors, [field]: nextErrors[field as keyof ShipErrors] }));
      }
      return next;
    });
  };

  const { data: ships = [], isLoading } = useQuery({ queryKey: ["ships"], queryFn: operationsApi.ships });

  const createShip = useMutation({
    mutationFn: operationsApi.createShip,
    onSuccess: () => { setForm({ name: "", imoNumber: "", vesselType: "", status: "operational" }); setErrors(emptyErrors()); setShowForm(false); queryClient.invalidateQueries({ queryKey: ["ships"] }); toast.success("Vessel added to fleet registry."); },
  });

  const updateShipMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Ship> }) => operationsApi.updateShip(id, payload),
    onSuccess: () => { setEditShip(null); queryClient.invalidateQueries({ queryKey: ["ships"] }); toast.success("Vessel updated successfully."); },
    onError: () => toast.error("Failed to update vessel."),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateShip(form);
    setErrors(errs);
    if (!isValid(errs)) return;
    createShip.mutate(form);
  };

  return (
    <div className="space-y-6">
      {viewShip && <ViewModal ship={viewShip} onClose={() => setViewShip(null)} />}
      {editShip && <EditModal ship={editShip} onClose={() => setEditShip(null)} onSave={(id, payload) => updateShipMutation.mutate({ id, payload })} />}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-2xl font-bold tracking-tight">Fleet Registry</h2><p className="mt-1 text-sm text-muted-foreground">Maintain vessel records used by maintenance and drill workflows.</p></div>
        <Button onClick={() => setShowForm(v => !v)} className="gap-2 rounded-xl font-semibold shadow-sm"><Plus className="h-4 w-4" />{showForm ? "Cancel" : "Add Vessel"}</Button>
      </div>

      {showForm && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base font-semibold"><ShipWheel className="h-4 w-4 text-primary" />Register New Vessel</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4" noValidate>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <SL>Ship Name *</SL>
                  <Input placeholder="e.g. MV Pacific Star" value={form.name}
                    onChange={e => updateField("name", e.target.value)}
                    className={`rounded-xl ${errors.name ? "border-red-400 focus-visible:ring-red-400" : ""}`} />
                  <FieldError msg={errors.name} />
                </div>
                <div>
                  <SL>IMO Number *</SL>
                  <Input placeholder="e.g. IMO9876543" value={form.imoNumber}
                    onChange={e => updateField("imoNumber", e.target.value)}
                    className={`rounded-xl ${errors.imoNumber ? "border-red-400 focus-visible:ring-red-400" : ""}`} />
                  <FieldError msg={errors.imoNumber} />
                </div>
                <div>
                  <SL>Vessel Type *</SL>
                  <Input placeholder="e.g. Bulk Carrier" value={form.vesselType}
                    onChange={e => updateField("vesselType", e.target.value)}
                    className={`rounded-xl ${errors.vesselType ? "border-red-400 focus-visible:ring-red-400" : ""}`} />
                  <FieldError msg={errors.vesselType} />
                </div>
                <div><SL>Status</SL>
                  <select value={form.status} onChange={e => updateField("status", e.target.value as Ship["status"])} className="maritime-select">
                    <option value="operational">Operational</option><option value="maintenance">Maintenance</option><option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setForm({ name: "", imoNumber: "", vesselType: "", status: "operational" }); setErrors(emptyErrors()); }} className="rounded-xl">Reset</Button>
                <Button type="submit" disabled={createShip.isPending} className="gap-2 rounded-xl font-semibold"><ShipWheel className="h-4 w-4" />{createShip.isPending ? "Adding..." : "Add to Fleet"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}</div>}

      {!isLoading && ships.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background py-20 text-center">
          <Anchor className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="text-sm font-semibold text-muted-foreground">No vessels registered</p>
          <p className="text-xs text-muted-foreground mt-1">Add your first vessel to begin.</p>
        </div>
      )}

      {ships.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ships.map(ship => {
            const meta = STATUS_META[ship.status] ?? STATUS_META.inactive;
            return (
              <Card key={ship._id} className="stat-card border-0 shadow-sm overflow-hidden">
                <div className="h-1.5 w-full" style={{ background: meta.strip }} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold truncate">{ship.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{ship.vesselType}</p>
                    </div>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow ${ship.status === "operational" ? "icon-teal" : ship.status === "maintenance" ? "icon-amber" : "bg-gray-200"}`}>
                      <ShipWheel className={`h-5 w-5 ${ship.status === "inactive" ? "text-gray-500" : "text-white"}`} />
                    </div>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mt-3 mb-3">{ship.imoNumber}</p>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />{meta.label}
                    </span>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => setViewShip(ship)} className="gap-1 rounded-lg px-2.5 py-1 h-7 text-xs" title="View details"><Eye className="h-3 w-3" />View</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditShip(ship)} className="gap-1 rounded-lg px-2.5 py-1 h-7 text-xs" title="Edit vessel"><Pencil className="h-3 w-3" />Edit</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
