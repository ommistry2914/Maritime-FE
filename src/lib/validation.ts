/**
 * Frontend validation schemas — mirror the backend Zod rules exactly.
 * Each validator returns an errors object: { [field]: errorMessage | "" }
 * An empty string means the field is valid.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

const isMongoId = (v: string) => /^[0-9a-fA-F]{24}$/.test(v);
const isPhoneNumber = (v: string) => /^\+?[0-9\s().-]+$/.test(v);

/** Returns true if the date string represents today or a future date. */
function isFutureOrToday(dateStr: string): boolean {
  const input = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !Number.isNaN(input.getTime()) && input >= today;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export type LoginErrors = { email: string; password: string };

export function validateLogin(data: { email: string; password: string }): LoginErrors {
  return {
    email: !data.email.trim()
      ? "Email is required."
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
        ? "Invalid email format."
        : "",
    password: !data.password.trim()
      ? "Password is required."
      : data.password.trim().length < 6
        ? "Password must be at least 6 characters."
        : "",
  };
}

export type RegisterErrors = LoginErrors & { firstName: string; lastName: string };

export function validateRegister(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): RegisterErrors {
  return {
    firstName:
      data.firstName.trim().length < 2 ? "First name must be at least 2 characters." : "",
    lastName:
      data.lastName.trim().length < 2 ? "Last name must be at least 2 characters." : "",
    ...validateLogin(data),
  };
}

// ── Ship ─────────────────────────────────────────────────────────────────────

export type ShipErrors = { name: string; imoNumber: string; vesselType: string };

export function validateShip(data: {
  name: string;
  imoNumber: string;
  vesselType: string;
}): ShipErrors {
  return {
    name: data.name.trim().length < 2 ? "Ship name must be at least 2 characters." : "",
    imoNumber: data.imoNumber.trim().length < 3 ? "IMO number must be at least 3 characters." : "",
    vesselType:
      data.vesselType.trim().length < 2 ? "Vessel type must be at least 2 characters." : "",
  };
}

// ── Maintenance Task ─────────────────────────────────────────────────────────

export type MaintenanceErrors = {
  title: string;
  component: string;
  ship: string;
  assignedTo: string;
  dueDate: string;
  estimatedHours: string;
  description: string;
};

export function validateMaintenance(data: {
  title: string;
  component: string;
  ship: string;
  assignedTo: string;
  dueDate: string;
  estimatedHours: string;
  description: string;
}): MaintenanceErrors {
  const hrs = data.estimatedHours ? Number(data.estimatedHours) : null;
  return {
    title:
      data.title.trim().length < 3
        ? "Task title must be at least 3 characters."
        : "",
    component:
      data.component.trim().length < 2
        ? "Component must be at least 2 characters."
        : "",
    ship: !data.ship || !isMongoId(data.ship) ? "Please select a ship." : "",
    assignedTo:
      !data.assignedTo || !isMongoId(data.assignedTo)
        ? "Please select a crew member."
        : "",
    dueDate: !data.dueDate
      ? "Due date is required."
      : !isFutureOrToday(data.dueDate)
        ? "Due date cannot be in the past."
        : "",
    estimatedHours:
      hrs !== null && (hrs < 0.25 || hrs > 500)
        ? "Estimated hours must be between 0.25 and 500."
        : "",
    description:
      data.description.trim() && data.description.trim().length < 10
        ? "Description must be at least 10 characters."
        : "",
  };
}

// ── Safety Drill ──────────────────────────────────────────────────────────────

export type DrillErrors = {
  title: string;
  ship: string;
  location: string;
  musterStation: string;
  scheduledDate: string;
  durationMinutes: string;
  objective: string;
  participants: string;
};

export function validateDrill(data: {
  title: string;
  ship: string;
  location: string;
  musterStation: string;
  scheduledDate: string;
  durationMinutes: string;
  objective: string;
  participants: string[];
}): DrillErrors {
  const dur = Number(data.durationMinutes);
  return {
    title:
      data.title.trim().length < 3
        ? "Drill title must be at least 3 characters."
        : "",
    ship: !data.ship || !isMongoId(data.ship) ? "Please select a ship." : "",
    location:
      data.location.trim().length < 2
        ? "Drill location must be at least 2 characters."
        : "",
    musterStation:
      data.musterStation.trim().length < 2
        ? "Muster station must be at least 2 characters."
        : "",
    scheduledDate: !data.scheduledDate
      ? "Scheduled date is required."
      : !isFutureOrToday(data.scheduledDate)
        ? "Scheduled date cannot be in the past."
        : "",
    durationMinutes:
      Number.isNaN(dur) || dur < 5 || dur > 480
        ? "Duration must be between 5 and 480 minutes."
        : "",
    objective:
      data.objective.trim() && data.objective.trim().length < 10
        ? "Objective must be at least 10 characters."
        : "",
    participants:
      data.participants.length === 0
        ? "At least one crew member is required."
        : "",
  };
}

// ── User / Crew / Admin creation ──────────────────────────────────────────────

export type UserFormErrors = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  employeeId: string;
  rank: string;
  department: string;
  phone: string;
};

export function validateUserForm(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: "admin" | "crew" | "user";
  employeeId?: string;
  rank?: string;
  department?: string;
  phone?: string;
}): UserFormErrors {
  const requiresCrewDetails = data.role !== "admin";

  return {
    firstName:
      data.firstName.trim().length < 2
        ? "First name must be at least 2 characters."
        : "",
    lastName:
      data.lastName.trim().length < 2
        ? "Last name must be at least 2 characters."
        : "",
    email: !data.email.trim()
      ? "Email is required."
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
        ? "Invalid email format."
        : "",
    password:
      data.password.trim().length < 6
        ? "Password must be at least 6 characters."
        : "",
    employeeId:
      requiresCrewDetails && !data.employeeId?.trim()
        ? "Employee ID is required."
        : data.employeeId?.trim() && data.employeeId.trim().length < 2
          ? "Employee ID must be at least 2 characters."
        : "",
    rank:
      requiresCrewDetails && !data.rank?.trim()
        ? "Rank or designation is required."
        : data.rank?.trim() && data.rank.trim().length < 2
          ? "Rank or designation must be at least 2 characters."
        : "",
    department:
      requiresCrewDetails && !data.department
        ? "Department is required."
        : "",
    phone:
      requiresCrewDetails && !data.phone?.trim()
        ? "Phone number is required."
        : data.phone?.trim() && data.phone.trim().length < 7
          ? "Phone number must be at least 7 characters."
        : data.phone?.trim() && data.phone.trim().length > 20
          ? "Phone number must be at most 20 characters."
        : data.phone?.trim() && !isPhoneNumber(data.phone.trim())
          ? "Phone number can only contain digits, spaces, +, -, . and parentheses."
        : "",
  };
}

// ── Shared helper ─────────────────────────────────────────────────────────────

/** Returns true when every field in an errors object is an empty string. */
export function isValid(errors: Record<string, string>): boolean {
  return Object.values(errors).every((e) => e === "");
}
