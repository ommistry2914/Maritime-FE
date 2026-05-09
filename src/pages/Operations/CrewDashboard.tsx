import { useQuery } from "@tanstack/react-query";
import { Wrench, ShieldAlert, Clock, ArrowRight } from "lucide-react";
import { operationsApi } from "@/api/operations";
import { useAppSelector } from "@/slice/hook";
import { Card, CardContent } from "@/components/ui/card";

function StatPanel({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <Card className="stat-card border-0 shadow-sm overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {label}
            </p>
            <p className="text-4xl font-bold text-foreground">{value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
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

export default function CrewDashboard() {
  const user = useAppSelector((state) => state.auth.user);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["maintenance", "mine"],
    queryFn: () => operationsApi.maintenance({ mine: "true" }),
  });
  const { data: drills = [], isLoading: drillsLoading } = useQuery({
    queryKey: ["drills", "mine"],
    queryFn: () => operationsApi.drills({ mine: "true" }),
  });

  const openTasks = tasks.filter((t) => t.status !== "completed");
  const upcomingDrills = drills.filter((d) => d.status === "scheduled");
  const overdueTasks = openTasks.filter(
    (t) => new Date(t.dueDate) < new Date()
  );

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner ── */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.13 0.04 245) 0%, oklch(0.35 0.12 225) 100%)",
          boxShadow: "0 8px 32px oklch(0.13 0.04 245 / 30%)",
        }}
      >
        <p className="text-sm font-medium text-white/60 mb-1">Welcome back,</p>
        <h2 className="text-2xl font-bold">
          {user?.firstName} {user?.lastName}
        </h2>
        <p className="mt-1 text-sm text-white/60 capitalize">
          {user?.rank ? `${user.rank} · ` : ""}
          {user?.department ?? "Crew Member"}
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {tasksLoading || drillsLoading ? (
          <>
            <div className="skeleton h-36 rounded-2xl" />
            <div className="skeleton h-36 rounded-2xl" />
            <div className="skeleton h-36 rounded-2xl" />
          </>
        ) : (
          <>
            <StatPanel
              label="Open Tasks"
              value={openTasks.length}
              sub="Pending or in-progress"
              icon={Wrench}
              iconClass="icon-navy"
            />
            <StatPanel
              label="Upcoming Drills"
              value={upcomingDrills.length}
              sub="Scheduled & awaiting"
              icon={ShieldAlert}
              iconClass="icon-teal"
            />
            <StatPanel
              label="Overdue"
              value={overdueTasks.length}
              sub="Tasks past due date"
              icon={Clock}
              iconClass="icon-red"
            />
          </>
        )}
      </div>

      {/* ── Task List Preview ── */}
      {openTasks.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold">My Open Tasks</h3>
              <a
                href="/maintenance"
                className="flex items-center gap-1 text-xs font-semibold text-[oklch(0.55_0.18_195)] hover:underline"
              >
                View all <ArrowRight className="h-3 w-3" />
              </a>
            </div>
            <div className="space-y-1">
              {openTasks.slice(0, 5).map((task) => {
                const isOverdue = new Date(task.dueDate) < new Date();
                return (
                  <div
                    key={task._id}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted/60 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due{" "}
                        {new Date(task.dueDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <span
                      className={`ml-3 shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        isOverdue ? "badge-overdue" : "badge-pending"
                      }`}
                    >
                      {isOverdue ? "Overdue" : "Pending"}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Drill List Preview ── */}
      {upcomingDrills.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold">Upcoming Drills</h3>
              <a
                href="/drills"
                className="flex items-center gap-1 text-xs font-semibold text-[oklch(0.55_0.18_195)] hover:underline"
              >
                View all <ArrowRight className="h-3 w-3" />
              </a>
            </div>
            <div className="space-y-1">
              {upcomingDrills.slice(0, 5).map((drill) => (
                <div
                  key={drill._id}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted/60 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{drill.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(drill.scheduledDate).toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "short", year: "numeric" }
                      )}{" "}
                      · {drill.ship?.name}
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 badge-progress rounded-lg px-2.5 py-1 text-xs font-semibold">
                    Scheduled
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
