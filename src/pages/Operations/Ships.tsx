import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShipWheel } from "lucide-react";
import { operationsApi } from "@/api/operations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Ship } from "@/types/operations.types";

export default function Ships() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Pick<Ship, "name" | "imoNumber" | "vesselType" | "status">>({
    name: "",
    imoNumber: "",
    vesselType: "",
    status: "operational",
  });
  const { data: ships = [] } = useQuery({ queryKey: ["ships"], queryFn: operationsApi.ships });
  const createShip = useMutation({
    mutationFn: operationsApi.createShip,
    onSuccess: () => {
      setForm({ name: "", imoNumber: "", vesselType: "", status: "operational" });
      queryClient.invalidateQueries({ queryKey: ["ships"] });
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    createShip.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Fleet Registry</h2>
        <p className="text-sm text-muted-foreground">Maintain vessel records used by maintenance and drill workflows.</p>
      </div>
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Add Ship</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-5">
            <Input required placeholder="Ship name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input required placeholder="IMO number" value={form.imoNumber} onChange={(e) => setForm({ ...form, imoNumber: e.target.value })} />
            <Input required placeholder="Vessel type" value={form.vesselType} onChange={(e) => setForm({ ...form, vesselType: e.target.value })} />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Ship["status"] })} className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="operational">Operational</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button type="submit"><ShipWheel className="h-4 w-4" /> Add Ship</Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ships.map((ship) => (
          <Card key={ship._id} className="rounded-lg">
            <CardContent className="p-5">
              <h3 className="font-semibold">{ship.name}</h3>
              <p className="text-sm text-muted-foreground">IMO {ship.imoNumber}</p>
              <p className="text-sm text-muted-foreground">{ship.vesselType}</p>
              <span className="mt-4 inline-flex rounded-md bg-muted px-2 py-1 text-xs">{ship.status}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
