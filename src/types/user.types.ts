export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "superAdmin" | "admin" | "crew" | "user";
  employeeId?: string;
  rank?: string;
  department?: "deck" | "engine" | "safety" | "operations" | "administration";
  phone?: string;
  [key: string]: any;
}
