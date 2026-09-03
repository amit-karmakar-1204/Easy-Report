import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  type Unsubscribe,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import type { UserAccount } from "@/lib/auth/types";
import { db } from "../config";

const COLLECTION_NAME = "users";

export function subscribeUsers(
  onUpdate: (users: UserAccount[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe | null {
  if (!db) return null;

  try {
    const q = query(collection(db, COLLECTION_NAME));

    return onSnapshot(
      q,
      (snapshot) => {
        const users = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as Omit<UserAccount, "id">),
          id: docSnap.id,
        }));
        onUpdate(users);
      },
      (err) => {
        console.error("Error subscribing to users:", err);
        onError?.(err);
      },
    );
  } catch (error) {
    console.error("Failed to setup users subscription:", error);
    onError?.(error as Error);
    return null;
  }
}

export async function fetchUsers(): Promise<UserAccount[]> {
  if (!db) return [];
  const q = query(collection(db, COLLECTION_NAME));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    ...(docSnap.data() as Omit<UserAccount, "id">),
    id: docSnap.id,
  }));
}

export async function createUserDoc(user: UserAccount): Promise<void> {
  if (!db) return;
  const docRef = doc(db, COLLECTION_NAME, user.id);
  const { id: _, ...data } = user;
  await setDoc(docRef, data);
}

export async function updateUserDoc(
  id: string,
  updates: Partial<UserAccount>,
): Promise<void> {
  if (!db) return;
  const docRef = doc(db, COLLECTION_NAME, id);
  const { id: _, ...data } = updates;
  await updateDoc(docRef, data);
}

export async function deleteUserDoc(id: string): Promise<void> {
  if (!db) return;
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

export async function seedDefaultUsersToFirestore(
  defaultUsers: UserAccount[],
): Promise<{ success: boolean; message: string }> {
  if (!db) {
    return {
      success: false,
      message: "Firebase is not configured.",
    };
  }

  try {
    const existing = await fetchUsers();
    if (existing.length > 0) {
      return {
        success: true,
        message: "Users already present in Firestore.",
      };
    }

    const batch = writeBatch(db);
    for (const user of defaultUsers) {
      const docRef = doc(db, COLLECTION_NAME, user.id);
      const { id: _, ...data } = user;
      batch.set(docRef, data);
    }
    await batch.commit();

    return {
      success: true,
      message: `Successfully seeded ${defaultUsers.length} initial user accounts to Firestore.`,
    };
  } catch (error) {
    console.error("Failed to seed users in Firestore:", error);
    return {
      success: false,
      message: `Failed to seed users: ${(error as Error).message}`,
    };
  }
}
