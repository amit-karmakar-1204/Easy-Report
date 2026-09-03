import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db, getSecondaryAuth, isFirebaseConfigured } from "../firebase/config";
import type { CreateUserPayload, UpdateUserPayload, UserProfile } from "./types";

const LOCAL_USERS_KEY = "EASY_REPORT_AUTH_USERS";
const LOCAL_SESSION_KEY = "EASY_REPORT_AUTH_SESSION";

export const DEFAULT_DEVELOPER: UserProfile = {
  uid: "dev_master_bootstrap",
  userId: "developer",
  email: "developer@easyreport.erp",
  displayName: "Lead Developer",
  role: "developer",
  status: "active",
  createdAt: "2025-01-01T00:00:00.000Z",
  createdBy: "system",
  passwordPlainHint: "developer123",
};

/**
 * Retrieves the local user registry from browser storage.
 */
export function getLocalUsers(): UserProfile[] {
  if (typeof window === "undefined") return [DEFAULT_DEVELOPER];
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (!raw) {
      // Seed default developer
      const initial = [DEFAULT_DEVELOPER];
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as UserProfile[];
    // Ensure default developer is always present
    if (!parsed.some((u) => u.userId.toLowerCase() === "developer")) {
      parsed.unshift(DEFAULT_DEVELOPER);
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    console.warn("Failed reading local users:", e);
    return [DEFAULT_DEVELOPER];
  }
}

/**
 * Saves users list into local storage.
 */
function saveLocalUsers(users: UserProfile[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn("Failed saving local users:", e);
  }
}

/**
 * Gets currently persisted auth session.
 */
export function getPersistedSession(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

/**
 * Sets or clears the active session in browser storage.
 */
export function persistSession(user: UserProfile | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
  } catch (e) {
    console.warn("Failed persisting session:", e);
  }
}

/**
 * Synchronizes users with Firestore if Firebase is configured.
 */
export async function syncUsersWithFirestore(): Promise<UserProfile[]> {
  const localUsers = getLocalUsers();
  if (!isFirebaseConfigured() || !db) {
    return localUsers;
  }

  try {
    const colRef = collection(db, "users");
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      // Seed default developer to Firestore
      const devDoc = doc(db, "users", DEFAULT_DEVELOPER.uid);
      await setDoc(devDoc, DEFAULT_DEVELOPER);
      return localUsers;
    }

    const firestoreUsers: UserProfile[] = [];
    for (const d of snapshot.docs) {
      firestoreUsers.push(d.data() as UserProfile);
    }

    // Merge with local users (ensuring unique by userId / uid)
    const mergedMap = new Map<string, UserProfile>();
    for (const u of localUsers) mergedMap.set(u.userId.toLowerCase(), u);
    for (const u of firestoreUsers) mergedMap.set(u.userId.toLowerCase(), u);

    const mergedList = Array.from(mergedMap.values());
    saveLocalUsers(mergedList);
    return mergedList;
  } catch (err) {
    console.warn("Could not sync with Firestore users collection:", err);
    return localUsers;
  }
}

/**
 * Authenticates user via custom User ID or Email, and Password.
 */
export async function loginUser(
  identifier: string,
  passwordPlain: string,
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const cleanId = identifier.trim();
  const cleanPass = passwordPlain.trim();

  if (!cleanId) return { success: false, error: "Please enter your User ID or Email." };
  if (!cleanPass) return { success: false, error: "Please enter your password." };

  // First verify against all known users (local & synced)
  let users = getLocalUsers();
  try {
    const synced = await syncUsersWithFirestore();
    if (synced && synced.length > 0) users = synced;
  } catch {
    // offline/network fallback
  }

  const isEmail = cleanId.includes("@");
  const matchedUser = users.find((u) =>
    isEmail
      ? u.email.toLowerCase() === cleanId.toLowerCase()
      : u.userId.toLowerCase() === cleanId.toLowerCase(),
  );

  if (!matchedUser) {
    return {
      success: false,
      error: "User ID / Email not recognized. Only developers can provision new accounts.",
    };
  }

  if (matchedUser.status === "suspended") {
    return {
      success: false,
      error: "This account has been deactivated by the system developer. Please contact administrator.",
    };
  }

  // 1. Try Firebase Auth if configured and active
  let firebaseAuthSuccess = false;
  if (isFirebaseConfigured() && auth && matchedUser.email) {
    try {
      await signInWithEmailAndPassword(auth, matchedUser.email, cleanPass);
      firebaseAuthSuccess = true;
    } catch (fbErr: any) {
      console.warn("Firebase Auth sign in attempt note:", fbErr.code || fbErr.message);
      // If Firebase Auth fails because user not in Firebase Auth yet, check local hint
    }
  }

  // 2. Validate password against stored record / plain hint (for bootstrap dev & offline resiliency)
  const isMatch =
    firebaseAuthSuccess ||
    (matchedUser.passwordPlainHint && matchedUser.passwordPlainHint === cleanPass);

  if (!isMatch) {
    return {
      success: false,
      error: "Incorrect password. Please verify your credentials or contact your developer.",
    };
  }

  const updatedProfile: UserProfile = {
    ...matchedUser,
    lastLoginAt: new Date().toISOString(),
  };

  // Update last login locally
  const updatedUsers = users.map((u) => (u.uid === updatedProfile.uid ? updatedProfile : u));
  saveLocalUsers(updatedUsers);
  persistSession(updatedProfile);

  // Update in Firestore in background if online
  if (isFirebaseConfigured() && db) {
    try {
      const userRef = doc(db, "users", updatedProfile.uid);
      await updateDoc(userRef, { lastLoginAt: updatedProfile.lastLoginAt });
    } catch {
      // ignore background error
    }
  }

  return { success: true, user: updatedProfile };
}

/**
 * Creates a new user. RESTRICTED: Only callable when logged in user is a Developer.
 */
export async function createUserByDeveloper(
  payload: CreateUserPayload,
  developerUser: UserProfile,
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  if (developerUser.role !== "developer") {
    return {
      success: false,
      error: "Access Denied: Only users with the Developer role can create new accounts.",
    };
  }

  const userIdClean = payload.userId.trim();
  const emailClean = payload.email.trim();
  const passwordClean = payload.password.trim();
  const displayNameClean = payload.displayName.trim();

  if (!userIdClean || userIdClean.length < 3) {
    return { success: false, error: "User ID must be at least 3 characters long." };
  }
  if (!emailClean || !emailClean.includes("@")) {
    return { success: false, error: "Please provide a valid email address." };
  }
  if (!passwordClean || passwordClean.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  const existingUsers = getLocalUsers();
  const duplicateId = existingUsers.some(
    (u) => u.userId.toLowerCase() === userIdClean.toLowerCase(),
  );
  if (duplicateId) {
    return { success: false, error: `User ID "${userIdClean}" is already in use. Please choose another.` };
  }

  const duplicateEmail = existingUsers.some(
    (u) => u.email.toLowerCase() === emailClean.toLowerCase(),
  );
  if (duplicateEmail) {
    return { success: false, error: `Email "${emailClean}" is already registered.` };
  }

  let uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Create in Firebase Authentication if enabled (using secondary auth so developer stays logged in)
  if (isFirebaseConfigured()) {
    const secondary = getSecondaryAuth();
    if (secondary) {
      try {
        const userCred = await createUserWithEmailAndPassword(
          secondary.secondaryAuth,
          emailClean,
          passwordClean,
        );
        uid = userCred.user.uid;
      } catch (fbErr: any) {
        console.warn("Secondary Firebase Auth user creation error:", fbErr.message);
        // Continue with generated UID if Firebase Auth reports an email error or project restricts CLI creation
      } finally {
        await secondary.cleanup();
      }
    }
  }

  const newProfile: UserProfile = {
    uid,
    userId: userIdClean,
    email: emailClean,
    displayName: displayNameClean || userIdClean,
    role: payload.role,
    status: "active",
    createdAt: new Date().toISOString(),
    createdBy: developerUser.userId,
    passwordPlainHint: passwordClean,
  };

  // 1. Save locally
  existingUsers.push(newProfile);
  saveLocalUsers(existingUsers);

  // 2. Save in Firestore if available
  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, "users", newProfile.uid);
      await setDoc(docRef, newProfile);
    } catch (firestoreErr) {
      console.warn("Failed saving user to Firestore:", firestoreErr);
    }
  }

  return { success: true, user: newProfile };
}

/**
 * Updates a user's details or resets password. RESTRICTED to Developer.
 */
export async function updateUserByDeveloper(
  targetUid: string,
  updates: UpdateUserPayload,
  developerUser: UserProfile,
): Promise<{ success: boolean; error?: string }> {
  if (developerUser.role !== "developer") {
    return { success: false, error: "Access Denied: Only developers can modify user accounts." };
  }

  const users = getLocalUsers();
  const index = users.findIndex((u) => u.uid === targetUid);
  if (index === -1) {
    return { success: false, error: "User not found." };
  }

  const userToUpdate = users[index];

  // Prevent developer from suspending their own active master account
  if (userToUpdate.userId.toLowerCase() === "developer" && updates.status === "suspended") {
    return { success: false, error: "The master developer account cannot be suspended." };
  }

  const updated: UserProfile = {
    ...userToUpdate,
    ...(updates.displayName ? { displayName: updates.displayName } : {}),
    ...(updates.role ? { role: updates.role } : {}),
    ...(updates.status ? { status: updates.status } : {}),
    ...(updates.password ? { passwordPlainHint: updates.password } : {}),
  };

  users[index] = updated;
  saveLocalUsers(users);

  // Update session if editing self
  const currentSession = getPersistedSession();
  if (currentSession && currentSession.uid === targetUid) {
    persistSession(updated);
  }

  // Update in Firestore
  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, "users", targetUid);
      const updateData: any = {};
      if (updates.displayName) updateData.displayName = updates.displayName;
      if (updates.role) updateData.role = updates.role;
      if (updates.status) updateData.status = updates.status;
      if (updates.password) updateData.passwordPlainHint = updates.password;
      await updateDoc(docRef, updateData);
    } catch (e) {
      console.warn("Firestore update error:", e);
    }
  }

  return { success: true };
}

/**
 * Deletes a user account. RESTRICTED to Developer.
 */
export async function deleteUserByDeveloper(
  targetUid: string,
  developerUser: UserProfile,
): Promise<{ success: boolean; error?: string }> {
  if (developerUser.role !== "developer") {
    return { success: false, error: "Access Denied: Only developers can delete user accounts." };
  }

  const users = getLocalUsers();
  const userToDelete = users.find((u) => u.uid === targetUid);
  if (!userToDelete) {
    return { success: false, error: "User not found." };
  }

  if (userToDelete.userId.toLowerCase() === "developer") {
    return { success: false, error: "The master developer account cannot be deleted." };
  }

  const filtered = users.filter((u) => u.uid !== targetUid);
  saveLocalUsers(filtered);

  // Remove from Firestore
  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, "users", targetUid);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn("Firestore delete error:", e);
    }
  }

  return { success: true };
}

/**
 * Signs out active user.
 */
export async function logoutUser(): Promise<void> {
  persistSession(null);
  if (isFirebaseConfigured() && auth) {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn("Firebase sign out error:", e);
    }
  }
}
