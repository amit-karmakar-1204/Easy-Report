"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../firebase/config";
import {
  createUserByDeveloper,
  deleteUserByDeveloper,
  getLocalUsers,
  getPersistedSession,
  loginUser,
  logoutUser,
  syncUsersWithFirestore,
  updateUserByDeveloper,
} from "./authService";
import type { CreateUserPayload, UpdateUserPayload, UserProfile } from "./types";

export interface AuthContextType {
  user: UserProfile | null;
  users: UserProfile[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isDeveloper: boolean;
  login: (
    identifier: string,
    pass: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  createUser: (
    payload: CreateUserPayload,
  ) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  updateUser: (
    uid: string,
    updates: UpdateUserPayload,
  ) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (uid: string) => Promise<{ success: boolean; error?: string }>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load active session and users on initial mount
  const refreshUsers = useCallback(async () => {
    try {
      const all = await syncUsersWithFirestore();
      setUsers(all);
    } catch {
      setUsers(getLocalUsers());
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const session = getPersistedSession();
        if (session && isMounted) {
          setUser(session);
        }
        await refreshUsers();
      } catch (err) {
        console.warn("Auth initialization error:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // Firebase Auth state listener
    let unsubscribe: (() => void) | undefined;
    if (isFirebaseConfigured() && auth) {
      try {
        unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          if (!fbUser && !getPersistedSession()) {
            if (isMounted) setUser(null);
          }
        });
      } catch (e) {
        console.warn("Auth listener notice:", e);
      }
    }

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [refreshUsers]);

  const login = useCallback(
    async (identifier: string, pass: string) => {
      setIsLoading(true);
      try {
        const result = await loginUser(identifier, pass);
        if (result.success && result.user) {
          setUser(result.user);
          await refreshUsers();
          return { success: true };
        }
        return { success: false, error: result.error || "Authentication failed" };
      } finally {
        setIsLoading(false);
      }
    },
    [refreshUsers],
  );

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    router.push("/login");
  }, [router]);

  const createUser = useCallback(
    async (payload: CreateUserPayload) => {
      if (!user) {
        return { success: false, error: "You must be signed in to perform this action." };
      }
      const result = await createUserByDeveloper(payload, user);
      if (result.success) {
        await refreshUsers();
      }
      return result;
    },
    [user, refreshUsers],
  );

  const updateUser = useCallback(
    async (targetUid: string, updates: UpdateUserPayload) => {
      if (!user) {
        return { success: false, error: "You must be signed in." };
      }
      const result = await updateUserByDeveloper(targetUid, updates, user);
      if (result.success) {
        await refreshUsers();
        // If current user updated their own info
        if (user.uid === targetUid) {
          setUser((prev) => (prev ? { ...prev, ...updates } : prev));
        }
      }
      return result;
    },
    [user, refreshUsers],
  );

  const deleteUser = useCallback(
    async (targetUid: string) => {
      if (!user) {
        return { success: false, error: "You must be signed in." };
      }
      const result = await deleteUserByDeveloper(targetUid, user);
      if (result.success) {
        await refreshUsers();
      }
      return result;
    },
    [user, refreshUsers],
  );

  const isAuthenticated = useMemo(() => Boolean(user && user.status === "active"), [user]);
  const isDeveloper = useMemo(() => Boolean(user && user.role === "developer"), [user]);

  const value = useMemo(
    () => ({
      user,
      users,
      isLoading,
      isAuthenticated,
      isDeveloper,
      login,
      logout,
      createUser,
      updateUser,
      deleteUser,
      refreshUsers,
    }),
    [
      user,
      users,
      isLoading,
      isAuthenticated,
      isDeveloper,
      login,
      logout,
      createUser,
      updateUser,
      deleteUser,
      refreshUsers,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
