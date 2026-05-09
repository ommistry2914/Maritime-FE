import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ClipboardList, LifeBuoy } from "lucide-react";
import { operationsApi } from "@/api/operations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const StatCard = ({ title, value, icon: Icon, tone }: { title: string; value: string | number; icon: any; tone: string }) => (
  <Card className="rounded-lg">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${tone}`} />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-semibold tracking-normal">{value}</div>
    </CardContent>
  </Card>
);

const Bar = ({ label, value }: { label: string; value: number }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">{value}%</span>
    </div>
    <div className="h-3 rounded-full bg-muted">
      <div className="h-3 rounded-full bg-emerald-600" style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  </div>
);

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["compliance-summary"],
    queryFn: operationsApi.compliance,
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading compliance dashboard...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Compliance Dashboard</h2>
        <p className="text-sm text-muted-foreground">Operational safety and regulatory readiness across the fleet.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Overall Compliance" value={`${data.compliance.overall}%`} icon={CheckCircle2} tone="text-emerald-600" />
        <StatCard title="Pending Maintenance" value={data.totals.pendingMaintenance} icon={ClipboardList} tone="text-amber-600" />
        <StatCard title="Overdue Maintenance" value={data.totals.overdueMaintenance} icon={AlertTriangle} tone="text-red-600" />
        <StatCard title="Missed Drills" value={data.totals.missedDrills} icon={LifeBuoy} tone="text-red-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Compliance Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Bar label="Maintenance completion" value={data.compliance.maintenance} />
            <Bar label="Drill participation" value={data.compliance.drills} />
            <div className={`rounded-md border p-4 text-sm ${data.risks.status === "atRisk" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
              {data.risks.status === "atRisk" ? "Risk detected: overdue maintenance, late completions, or missed drills require action." : "Fleet compliance is currently within acceptable range."}
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground">Overdue</p>
                <p className="text-xl font-semibold">{data.risks.overdueMaintenance}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground">Late</p>
                <p className="text-xl font-semibold">{data.risks.lateCompletedMaintenance}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground">Missed</p>
                <p className="text-xl font-semibold">{data.risks.missedDrills}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Upcoming And Due Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentMaintenance.map((task) => (
              <div key={task._id} className="flex items-center justify-between border-b pb-3 text-sm last:border-0">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-muted-foreground">{task.ship?.name} - due {new Date(task.dueDate).toLocaleDateString()}</p>
                </div>
                <span className="rounded-md bg-muted px-2 py-1 text-xs">{task.status}</span>
              </div>
            ))}
            {data.upcomingDrills.slice(0, 3).map((drill) => (
              <div key={drill._id} className="flex items-center justify-between border-b pb-3 text-sm last:border-0">
                <div>
                  <p className="font-medium">{drill.title}</p>
                  <p className="text-muted-foreground">{drill.ship?.name} - {new Date(drill.scheduledDate).toLocaleDateString()}</p>
                </div>
                <span className="rounded-md bg-muted px-2 py-1 text-xs">{drill.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
