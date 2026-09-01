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
import type { InventoryItem } from "@/lib/types";
import { db } from "../config";

const COLLECTION_NAME = "inventory";

export function subscribeInventory(
  onUpdate: (items: InventoryItem[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe | null {
  if (!db) return null;

  try {
    const q = query(collection(db, COLLECTION_NAME));

    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as Omit<InventoryItem, "id">),
          id: docSnap.id,
        }));
        onUpdate(items);
      },
      (err) => {
        console.error("Error subscribing to inventory:", err);
        onError?.(err);
      },
    );
  } catch (error) {
    console.error("Failed to setup inventory subscription:", error);
    onError?.(error as Error);
    return null;
  }
}

export async function fetchInventory(): Promise<InventoryItem[]> {
  if (!db) return [];
  const q = query(collection(db, COLLECTION_NAME));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    ...(docSnap.data() as Omit<InventoryItem, "id">),
    id: docSnap.id,
  }));
}

export async function createInventoryItemDoc(
  item: InventoryItem,
): Promise<void> {
  if (!db) return;
  const docRef = doc(db, COLLECTION_NAME, item.id);
  const { id: _, ...data } = item;
  await setDoc(docRef, data);
}

export async function updateInventoryItemDoc(
  id: string,
  updates: Partial<InventoryItem>,
): Promise<void> {
  if (!db) return;
  const docRef = doc(db, COLLECTION_NAME, id);
  const { id: _, ...data } = updates;
  await updateDoc(docRef, data);
}

export async function deleteInventoryItemDoc(id: string): Promise<void> {
  if (!db) return;
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

export async function batchDeleteInventoryItems(ids: string[]): Promise<void> {
  if (!db || ids.length === 0) return;
  const batch = writeBatch(db);
  for (const id of ids) {
    const docRef = doc(db, COLLECTION_NAME, id);
    batch.delete(docRef);
  }
  await batch.commit();
}
