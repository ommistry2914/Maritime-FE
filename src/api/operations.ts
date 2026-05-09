import axiosInstance from "./axiosInstance";
import type { ApiResponse } from "@/types/api.types";
import type { ComplianceSummary, MaintenanceTask, SafetyDrill, Ship } from "@/types/operations.types";
import type { User } from "@/types/user.types";

const data = <T>(response: { data: ApiResponse<T> }) => response.data.data;

const normalizeUser = (user: User): User => ({
  ...user,
  id: user.id || user._id,
});

const normalizeTask = (task: MaintenanceTask): MaintenanceTask => ({
  ...task,
  assignedTo: task.assignedTo ? normalizeUser(task.assignedTo) : task.assignedTo,
});

const normalizeDrill = (drill: SafetyDrill): SafetyDrill => ({
  ...drill,
  participants: drill.participants.map((participant) => ({
    ...participant,
    crew: participant.crew ? normalizeUser(participant.crew) : participant.crew,
  })),
});

export const operationsApi = {
  ships: async () => data(await axiosInstance.get<ApiResponse<Ship[]>>("/ships")),
  createShip: async (payload: Partial<Ship>) =>
    data(await axiosInstance.post<ApiResponse<Ship>>("/ships", payload)),

  crew: async () =>
    data(await axiosInstance.get<ApiResponse<User[]>>("/users", { params: { role: "crew" } })).map(normalizeUser),
  users: async (params?: Record<string, string>) =>
    data(await axiosInstance.get<ApiResponse<User[]>>("/users", { params })).map(normalizeUser),
  createUser: async (payload: Record<string, unknown>) =>
    normalizeUser(data(await axiosInstance.post<ApiResponse<User>>("/users", payload))),

  maintenance: async (params?: Record<string, string>) =>
    data(await axiosInstance.get<ApiResponse<MaintenanceTask[]>>("/maintenance", { params })).map(normalizeTask),
  createMaintenance: async (payload: Record<string, unknown>) =>
    normalizeTask(data(await axiosInstance.post<ApiResponse<MaintenanceTask>>("/maintenance", payload))),
  updateMaintenanceStatus: async (id: string, payload: { status: string; note?: string }) =>
    normalizeTask(data(await axiosInstance.patch<ApiResponse<MaintenanceTask>>(`/maintenance/${id}/status`, payload))),

  drills: async (params?: Record<string, string>) =>
    data(await axiosInstance.get<ApiResponse<SafetyDrill[]>>("/drills", { params })).map(normalizeDrill),
  createDrill: async (payload: Record<string, unknown>) =>
    normalizeDrill(data(await axiosInstance.post<ApiResponse<SafetyDrill>>("/drills", payload))),
  markDrill: async (id: string, payload: { attended: boolean; completed: boolean; note?: string }) =>
    normalizeDrill(data(await axiosInstance.patch<ApiResponse<SafetyDrill>>(`/drills/${id}/participation`, payload))),

  compliance: async () =>
    data(await axiosInstance.get<ApiResponse<ComplianceSummary>>("/compliance/summary")),
};
