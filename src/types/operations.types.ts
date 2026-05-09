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
  category: "engine" | "deck" | "electrical" | "hull" | "safetyEquipment" | "navigation" | "other";
  component: string;
  location?: string;
  ship: Ship;
  assignedTo: User;
  status: MaintenanceStatus;
  priority: "low" | "medium" | "high" | "critical";
  estimatedHours?: number;
  safetyCritical: boolean;
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
  location: string;
  musterStation: string;
  objective?: string;
  durationMinutes: number;
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
    lateCompletedMaintenance: number;
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
    lateCompletedMaintenance: number;
    missedDrills: number;
    status: "compliant" | "watch" | "atRisk";
  };
  recentMaintenance: MaintenanceTask[];
  upcomingDrills: SafetyDrill[];
}
