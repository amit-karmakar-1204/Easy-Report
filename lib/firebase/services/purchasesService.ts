import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  type Unsubscribe,
  updateDoc,
} from "firebase/firestore";
import type { Purchase } from "@/lib/types";
import { db } from "../config";

const COLLECTION_NAME = "purchases";

export function subscribePurchases(
  onUpdate: (purchases: Purchase[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe | null {
  if (!db) return null;

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("createdAt", "desc"),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const purchases = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as Omit<Purchase, "id">),
          id: docSnap.id,
        }));
        onUpdate(purchases);
      },
      (err) => {
        console.error("Error subscribing to purchases:", err);
        onError?.(err);
      },
    );
  } catch (error) {
    console.error("Failed to setup purchases subscription:", error);
    onError?.(error as Error);
    return null;
  }
}

export async function fetchPurchases(): Promise<Purchase[]> {
  if (!db) return [];
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    ...(docSnap.data() as Omit<Purchase, "id">),
    id: docSnap.id,
  }));
}

export async function createPurchaseDoc(purchase: Purchase): Promise<void> {
  if (!db) return;
  const docRef = doc(db, COLLECTION_NAME, purchase.id);
  const { id: _, ...data } = purchase;
  await setDoc(docRef, data);
}

export async function updatePurchaseDoc(
  id: string,
  updates: Partial<Purchase>,
): Promise<void> {
  if (!db) return;
  const docRef = doc(db, COLLECTION_NAME, id);
  const { id: _, ...data } = updates;
  await updateDoc(docRef, data);
}
