// User Interface
import type { User } from "@/types/user.types";

export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: "superAdmin" | "admin" | "crew" | "user";
}
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken?: string;
  refreshToken?: string;
}

// Redux State
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  initialized: boolean;
  loading: boolean;
  error: string | null;
}
