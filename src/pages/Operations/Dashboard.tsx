import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  LifeBuoy,
  TrendingUp,
  Activity,
} from "lucide-react";
import { operationsApi } from "@/api/operations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* ── Helper: status badge ───────────────────────────────────────── */
function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "badge-pending",
    inProgress: "badge-progress",
    completed: "badge-completed",
    scheduled: "badge-progress",
    overdue: "badge-overdue",
  };
  return map[status] ?? "badge-pending";
}

/* ── Stat Card ──────────────────────────────────────────────────── */
function StatCard({
  title,
  value,
  icon: Icon,
  iconClass,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconClass: string;
  trend?: string;
}) {
  return (
    <Card className="stat-card border-0 shadow-sm overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground leading-none">
              {value}
            </p>
            {trend && (
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass} shadow-lg`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Progress Bar ───────────────────────────────────────────────── */
function ProgressBar({ label, value }: { label: string; value: number }) {
  const isGood = value >= 80;
  const isWarn = value >= 60 && value < 80;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span
          className={`text-xs font-semibold tabular-nums ${
            isGood
              ? "text-emerald-600"
              : isWarn
              ? "text-amber-600"
              : "text-red-600"
          }`}
        >
          {value}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(value, 100)}%`,
            background: isGood
              ? "linear-gradient(90deg, oklch(0.55 0.18 160), oklch(0.65 0.2 145))"
              : isWarn
              ? "linear-gradient(90deg, oklch(0.7 0.18 75), oklch(0.72 0.2 60))"
              : "linear-gradient(90deg, oklch(0.58 0.22 27), oklch(0.65 0.2 15))",
          }}
        />
      </div>
    </div>
  );
}

/* ── Loading Skeleton ───────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["compliance-summary"],
    queryFn: operationsApi.compliance,
  });

  if (isLoading) return <DashboardSkeleton />;
  if (!data) return null;

  const isAtRisk = data.risks.status === "atRisk";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Compliance Dashboard
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Operational safety and regulatory readiness across the fleet.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
          <Activity className="h-4 w-4 text-[oklch(0.55_0.18_195)]" />
          <span className="text-xs font-semibold text-foreground">Live</span>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Overall Compliance"
          value={`${data.compliance.overall}%`}
          icon={CheckCircle2}
          iconClass="icon-teal"
          trend="Fleet average"
        />
        <StatCard
          title="Pending Maintenance"
          value={data.totals.pendingMaintenance}
          icon={ClipboardList}
          iconClass="icon-navy"
          trend="Awaiting action"
        />
        <StatCard
          title="Overdue Maintenance"
          value={data.totals.overdueMaintenance}
          icon={AlertTriangle}
          iconClass="icon-red"
          trend="Requires attention"
        />
        <StatCard
          title="Missed Drills"
          value={data.totals.missedDrills}
          icon={LifeBuoy}
          iconClass="icon-amber"
          trend="This period"
        />
      </div>

      {/* ── Detail Cards ── */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Compliance Breakdown */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <span className="h-2 w-2 rounded-full bg-[oklch(0.55_0.18_195)]" />
              Compliance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ProgressBar
              label="Maintenance completion"
              value={data.compliance.maintenance}
            />
            <ProgressBar
              label="Drill participation"
              value={data.compliance.drills}
            />

            {/* Risk Alert */}
            <div
              className={`rounded-xl px-4 py-3 text-sm font-medium ${
                isAtRisk
                  ? "bg-red-50 text-red-800 border border-red-200"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {isAtRisk ? (
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                )}
                {isAtRisk
                  ? "Risk detected: overdue maintenance or missed drills require immediate action."
                  : "Fleet compliance is within acceptable range — well done!"}
              </div>
            </div>

            {/* Risk Counters */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Overdue", value: data.risks.overdueMaintenance, cls: "badge-overdue" },
                { label: "Late", value: data.risks.lateCompletedMaintenance, cls: "badge-warning" },
                { label: "Missed", value: data.risks.missedDrills, cls: "badge-safety" },
              ].map(({ label, value, cls }) => (
                <div
                  key={label}
                  className="rounded-xl border bg-background p-3 text-center"
                >
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p
                    className={`mt-1 text-xl font-bold ${
                      cls === "badge-overdue"
                        ? "text-red-600"
                        : cls === "badge-safety"
                        ? "text-orange-600"
                        : "text-amber-600"
                    }`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming & Due Work */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Upcoming & Due Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              ...data.recentMaintenance.map((t) => ({
                id: t._id,
                title: t.title,
                sub: `${t.ship?.name ?? "—"} · due ${new Date(
                  t.dueDate
                ).toLocaleDateString()}`,
                status: t.status,
                type: "maintenance" as const,
              })),
              ...data.upcomingDrills.slice(0, 3).map((d) => ({
                id: d._id,
                title: d.title,
                sub: `${d.ship?.name ?? "—"} · ${new Date(
                  d.scheduledDate
                ).toLocaleDateString()}`,
                status: d.status,
                type: "drill" as const,
              })),
            ].map(({ id, title, sub, status }) => (
              <div
                key={id}
                className="group flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{title}</p>
                  <p className="truncate text-xs text-muted-foreground">{sub}</p>
                </div>
                <span
                  className={`ml-3 shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${statusBadge(status)}`}
                >
                  {status === "inProgress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
