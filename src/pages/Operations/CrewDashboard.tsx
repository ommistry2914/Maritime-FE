import { useQuery } from "@tanstack/react-query";
import { operationsApi } from "@/api/operations";

export default function CrewDashboard() {
  const { data: tasks = [] } = useQuery({
    queryKey: ["maintenance", "mine"],
    queryFn: () => operationsApi.maintenance({ mine: "true" }),
  });
  const { data: drills = [] } = useQuery({
    queryKey: ["drills", "mine"],
    queryFn: () => operationsApi.drills({ mine: "true" }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Crew Dashboard</h2>
        <p className="text-sm text-muted-foreground">Your assigned maintenance tasks and safety drill participation.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border p-5">
          <h3 className="font-semibold">My Open Maintenance</h3>
          <p className="mt-1 text-3xl font-semibold">{tasks.filter((task) => task.status !== "completed").length}</p>
          <p className="text-sm text-muted-foreground">Assigned tasks still pending or in progress.</p>
        </div>
        <div className="rounded-lg border p-5">
          <h3 className="font-semibold">My Upcoming Drills</h3>
          <p className="mt-1 text-3xl font-semibold">{drills.filter((drill) => drill.status === "scheduled").length}</p>
          <p className="text-sm text-muted-foreground">Scheduled drills awaiting attendance.</p>
        </div>
      </div>
    </div>
  );
}
