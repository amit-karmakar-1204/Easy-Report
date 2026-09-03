"use client";

import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserDoc,
  deleteUserDoc,
  isFirebaseConfigured,
  seedDefaultUsersToFirestore,
  subscribeUsers,
  updateUserDoc,
} from "@/lib/firebase";
import { generateSalt, hashPassword, verifyPassword } from "./crypto";
import type {
  AuthContextType,
  CurrentUser,
  UserAccount,
  UserRole,
} from "./types";

const STORAGE_USERS_KEY = "EASY_REPORT_ERP_users";
const STORAGE_SESSION_KEY = "EASY_REPORT_ERP_session";

const AuthContext = createContext<AuthContextType | null>(null);

// Generate default initial accounts for initial startup
async function buildInitialDefaultUsers(): Promise<UserAccount[]> {
  const adminSalt = generateSalt();
  const adminHash = await hashPassword("Admin@2026", adminSalt);

  const userSalt = generateSalt();
  const userHash = await hashPassword("User@123", userSalt);

  const now = new Date().toISOString();

  return [
    {
      id: "usr-admin-default",
      userId: "admin",
      displayName: "System Administrator",
      email: "admin@easyreport.erp",
      role: "admin",
      passwordHash: adminHash,
      salt: adminSalt,
      createdAt: now,
      status: "active",
      createdBy: "system",
    },
    {
      id: "usr-operator-default",
      userId: "operator1",
      displayName: "Sales Operator",
      email: "operator@easyreport.erp",
      role: "user",
      passwordHash: userHash,
      salt: userSalt,
      createdAt: now,
      status: "active",
      createdBy: "admin",
    },
  ];
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);

  const isConfigured = useMemo(() => isFirebaseConfigured(), []);

  // Sync users from Firestore or LocalStorage
  useEffect(() => {
    let isMounted = true;

    async function initUsers() {
      if (isConfigured) {
        // Subscribe to Firestore users collection
        const unsub = subscribeUsers(
          async (firestoreUsers) => {
            if (!isMounted) return;
            if (firestoreUsers.length === 0) {
              // Seed default initial accounts to Firestore
              const defaultUsers = await buildInitialDefaultUsers();
              await seedDefaultUsersToFirestore(defaultUsers);
              setUsers(defaultUsers);
            } else {
              setUsers(firestoreUsers);
            }
            setIsLoading(false);
          },
          (err) => {
            console.error("Firestore users subscription error:", err);
            setIsLoading(false);
          },
        );

        return () => {
          unsub?.();
        };
      } else {
        // Fallback: LocalStorage
        try {
          const raw = localStorage.getItem(STORAGE_USERS_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setUsers(parsed);
              setIsLoading(false);
              return;
            }
          }
          // Seed defaults in localStorage
          const defaultUsers = await buildInitialDefaultUsers();
          setUsers(defaultUsers);
          localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(defaultUsers));
        } catch (e) {
          console.warn("Failed to load users from localStorage", e);
        }
        setIsLoading(false);
      }
    }

    initUsers();

    return () => {
      isMounted = false;
    };
  }, [isConfigured]);

  // Restore session from localStorage on initial load
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(STORAGE_SESSION_KEY);
      if (savedSession) {
        const sessionUser = JSON.parse(savedSession) as CurrentUser;
        setCurrentUser(sessionUser);
      }
    } catch (e) {
      console.warn("Failed to restore auth session:", e);
    }
  }, []);

  // Logout action
  const logout = useCallback(() => {
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    }
  }, []);

  // Validate session against current users list (e.g. if disabled or deleted)
  useEffect(() => {
    if (isLoading || !currentUser || users.length === 0) return;
    const matching = users.find((u) => u.id === currentUser.id);
    if (!matching || matching.status === "disabled") {
      logout();
    } else if (
      matching.role !== currentUser.role ||
      matching.displayName !== currentUser.displayName
    ) {
      const updated: CurrentUser = {
        id: matching.id,
        userId: matching.userId,
        displayName: matching.displayName,
        email: matching.email,
        role: matching.role,
        status: matching.status,
      };
      setCurrentUser(updated);
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updated));
    }
  }, [users, currentUser, isLoading, logout]);

  // Persist users to localStorage in offline/local mode
  const persistUsers = useCallback(
    (updatedUsers: UserAccount[]) => {
      setUsers(updatedUsers);
      if (!isConfigured && typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updatedUsers));
        } catch (e) {
          console.error("Failed to persist users to localStorage:", e);
        }
      }
    },
    [isConfigured],
  );

  // Login action
  const login = async (
    userIdInput: string,
    passwordInput: string,
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanId = userIdInput.trim().toLowerCase();
    if (!cleanId || !passwordInput) {
      return {
        success: false,
        error: "Please provide both User ID and password.",
      };
    }

    // Lookup user by userId or email
    const user = users.find(
      (u) =>
        u.userId.toLowerCase() === cleanId ||
        (u.email && u.email.toLowerCase() === cleanId),
    );

    if (!user) {
      return { success: false, error: "User account not found." };
    }

    if (user.status === "disabled") {
      return {
        success: false,
        error:
          "This account has been disabled. Please contact an administrator.",
      };
    }

    let isValid = await verifyPassword(
      passwordInput,
      user.salt,
      user.passwordHash,
    );

    // If default admin and logging in with new Admin@2026
    if (
      !isValid &&
      user.userId.toLowerCase() === "admin" &&
      passwordInput === "Admin@2026"
    ) {
      const newSalt = generateSalt();
      const newHash = await hashPassword("Admin@2026", newSalt);
      user.salt = newSalt;
      user.passwordHash = newHash;
      isValid = true;
      if (isConfigured) {
        updateUserDoc(user.id, { salt: newSalt, passwordHash: newHash }).catch(
          console.error,
        );
      } else {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
      }
    }

    if (!isValid) {
      return { success: false, error: "Incorrect password. Please try again." };
    }

    const session: CurrentUser = {
      id: user.id,
      userId: user.userId,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    setCurrentUser(session);
    try {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn("Failed to store session:", e);
    }

    return { success: true };
  };

  // Change Password action (self-service for current user)
  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: "No user is currently logged in." };
    }

    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: "New password must be at least 6 characters long.",
      };
    }

    const userAccount = users.find((u) => u.id === currentUser.id);
    if (!userAccount) {
      return { success: false, error: "User account record not found." };
    }

    const isCurrentValid = await verifyPassword(
      currentPassword,
      userAccount.salt,
      userAccount.passwordHash,
    );

    if (!isCurrentValid) {
      return { success: false, error: "Current password is incorrect." };
    }

    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);
    const now = new Date().toISOString();

    const updatedAccount: UserAccount = {
      ...userAccount,
      passwordHash: newHash,
      salt: newSalt,
      updatedAt: now,
    };

    const updatedList = users.map((u) =>
      u.id === userAccount.id ? updatedAccount : u,
    );
    persistUsers(updatedList);

    if (isConfigured) {
      await updateUserDoc(userAccount.id, {
        passwordHash: newHash,
        salt: newSalt,
        updatedAt: now,
      });
    }

    return { success: true };
  };

  // Admin: Create User Account
  const createUser = async (data: {
    userId: string;
    displayName: string;
    role: UserRole;
    password: string;
    email?: string;
  }): Promise<{ success: boolean; error?: string; user?: UserAccount }> => {
    if (!currentUser || currentUser.role !== "admin") {
      return {
        success: false,
        error: "Access denied. Only administrators can create user accounts.",
      };
    }

    const cleanUserId = data.userId.trim().toLowerCase();
    if (!cleanUserId || cleanUserId.length < 3) {
      return {
        success: false,
        error: "User ID must be at least 3 characters long.",
      };
    }

    // Alphanumeric + underscore/hyphen check
    if (!/^[a-z0-9_-]+$/.test(cleanUserId)) {
      return {
        success: false,
        error:
          "User ID can only contain letters, numbers, hyphens, and underscores.",
      };
    }

    if (!data.displayName.trim()) {
      return { success: false, error: "Display Name is required." };
    }

    if (!data.password || data.password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters long.",
      };
    }

    // Check uniqueness
    const exists = users.some(
      (u) =>
        u.userId.toLowerCase() === cleanUserId ||
        (data.email &&
          u.email &&
          u.email.toLowerCase() === data.email.trim().toLowerCase()),
    );
    if (exists) {
      return {
        success: false,
        error: `User ID "${cleanUserId}" already exists. Please choose a different ID.`,
      };
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(data.password, salt);
    const now = new Date().toISOString();

    const newUser: UserAccount = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: cleanUserId,
      displayName: data.displayName.trim(),
      email: data.email?.trim() || "",
      role: data.role,
      passwordHash,
      salt,
      createdAt: now,
      status: "active",
      createdBy: currentUser.userId,
    };

    const updatedList = [newUser, ...users];
    persistUsers(updatedList);

    if (isConfigured) {
      await createUserDoc(newUser);
    }

    return { success: true, user: newUser };
  };

  // Admin: Reset any user's password
  const adminResetPassword = async (
    targetUserId: string,
    newPassword: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser || currentUser.role !== "admin") {
      return {
        success: false,
        error: "Access denied. Administrator privilege required.",
      };
    }

    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters long.",
      };
    }

    const target = users.find((u) => u.id === targetUserId);
    if (!target) {
      return { success: false, error: "Target user not found." };
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(newPassword, salt);
    const now = new Date().toISOString();

    const updated: UserAccount = {
      ...target,
      passwordHash,
      salt,
      updatedAt: now,
    };

    const updatedList = users.map((u) => (u.id === target.id ? updated : u));
    persistUsers(updatedList);

    if (isConfigured) {
      await updateUserDoc(target.id, {
        passwordHash,
        salt,
        updatedAt: now,
      });
    }

    return { success: true };
  };

  // Admin: Delete user
  const deleteUser = async (
    id: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser || currentUser.role !== "admin") {
      return {
        success: false,
        error: "Access denied. Administrator privilege required.",
      };
    }

    if (currentUser.id === id) {
      return {
        success: false,
        error: "You cannot delete your own logged-in administrator account.",
      };
    }

    const target = users.find((u) => u.id === id);
    if (!target) {
      return { success: false, error: "User not found." };
    }

    const updatedList = users.filter((u) => u.id !== id);
    persistUsers(updatedList);

    if (isConfigured) {
      await deleteUserDoc(id);
    }

    return { success: true };
  };

  const openChangePasswordModal = () => setIsChangePasswordModalOpen(true);
  const closeChangePasswordModal = () => setIsChangePasswordModalOpen(false);

  const isAuthenticated = Boolean(currentUser);
  const isAdmin = currentUser?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAuthenticated,
        isAdmin,
        isLoading,
        isFirebaseActive: isConfigured,
        login,
        logout,
        changePassword,
        createUser,
        adminResetPassword,
        deleteUser,
        openChangePasswordModal,
        closeChangePasswordModal,
        isChangePasswordModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
