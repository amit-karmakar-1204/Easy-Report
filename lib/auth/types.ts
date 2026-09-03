export type UserRole = "admin" | "user";

export interface UserAccount {
  id: string; // Internal unique ID (e.g. "usr-1712345678")
  userId: string; // Login username/ID (e.g. "admin", "amit", lowercase alphanumeric)
  displayName: string;
  email?: string;
  role: UserRole;
  passwordHash: string;
  salt: string;
  createdAt: string; // ISO 8601
  updatedAt?: string;
  status: "active" | "disabled";
  createdBy?: string;
}

export interface CurrentUser {
  id: string;
  userId: string;
  displayName: string;
  email?: string;
  role: UserRole;
  status: "active" | "disabled";
}

export interface AuthContextType {
  currentUser: CurrentUser | null;
  users: UserAccount[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  isFirebaseActive: boolean;
  login: (
    userId: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  createUser: (data: {
    userId: string;
    displayName: string;
    role: UserRole;
    password: string;
    email?: string;
  }) => Promise<{ success: boolean; error?: string; user?: UserAccount }>;
  adminResetPassword: (
    userId: string,
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  openChangePasswordModal: () => void;
  closeChangePasswordModal: () => void;
  isChangePasswordModalOpen: boolean;
}
