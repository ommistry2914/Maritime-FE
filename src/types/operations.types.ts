import type { User } from "./user.types";

export interface Ship {
  _id: string;
  name: string;
  imoNumber: string;
  vesselType: string;
  status: "operational" | "maintenance" | "inactive";
}

export type MaintenanceStatus = "pending" | "inProgress" | "completed";

export interface MaintenanceTask {
  _id: string;
  title: string;
  description?: string;
  ship: Ship;
  assignedTo: User;
  status: MaintenanceStatus;
  priority: "low" | "medium" | "high" | "critical";
  dueDate: string;
  completedAt?: string;
  comments: Array<{
    author: User;
    note: string;
    createdAt: string;
  }>;
}

export interface SafetyDrill {
  _id: string;
  title: string;
  drillType: "fire" | "evacuation" | "manOverboard" | "abandonShip" | "medical" | "other";
  ship: Ship;
  scheduledDate: string;
  status: "scheduled" | "completed" | "cancelled";
  participants: Array<{
    crew: User;
    attended: boolean;
    completed: boolean;
    note?: string;
    markedAt?: string;
  }>;
}

export interface ComplianceSummary {
  totals: {
    maintenance: number;
    drills: number;
    pendingMaintenance: number;
    overdueMaintenance: number;
    completedMaintenance: number;
    completedDrills: number;
    missedDrills: number;
  };
  compliance: {
    maintenance: number;
    drills: number;
    overall: number;
  };
  risks: {
    overdueMaintenance: number;
    missedDrills: number;
    status: "compliant" | "watch" | "atRisk";
  };
  recentMaintenance: MaintenanceTask[];
  upcomingDrills: SafetyDrill[];
}
