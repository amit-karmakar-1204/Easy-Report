export type UserRole = "developer" | "admin" | "manager" | "staff";

export type UserStatus = "active" | "suspended";

export interface UserProfile {
  uid: string;
  userId: string; // Unique alphanumeric ID e.g., "developer", "cashier01", "dev_amit"
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  createdBy?: string;
  lastLoginAt?: string;
  passwordPlainHint?: string; // Stored for developer inspection/copying in admin view
}

export interface CreateUserPayload {
  userId: string;
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  displayName?: string;
  role?: UserRole;
  status?: UserStatus;
  password?: string;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDeveloper: boolean;
}
