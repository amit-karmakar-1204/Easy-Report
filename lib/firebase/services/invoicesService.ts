import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  type Unsubscribe,
  updateDoc,
} from "firebase/firestore";
import type { Invoice } from "@/lib/types";
import { db } from "../config";

const COLLECTION_NAME = "invoices";

export function subscribeInvoices(
  onUpdate: (invoices: Invoice[]) => void,
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
        const invoices = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as Omit<Invoice, "id">),
          id: docSnap.id,
        }));
        onUpdate(invoices);
      },
      (err) => {
        console.error("Error subscribing to invoices:", err);
        onError?.(err);
      },
    );
  } catch (error) {
    console.error("Failed to setup invoices subscription:", error);
    onError?.(error as Error);
    return null;
  }
}

export async function fetchInvoices(): Promise<Invoice[]> {
  if (!db) return [];
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    ...(docSnap.data() as Omit<Invoice, "id">),
    id: docSnap.id,
  }));
}

export async function createInvoiceDoc(invoice: Invoice): Promise<void> {
  if (!db) return;
  const docRef = doc(db, COLLECTION_NAME, invoice.id);
  const { id: _, ...data } = invoice;
  await setDoc(docRef, data);
}

export async function updateInvoiceDoc(
  id: string,
  updates: Partial<Invoice>,
): Promise<void> {
  if (!db) return;
  const docRef = doc(db, COLLECTION_NAME, id);
  const { id: _, ...data } = updates;
  await updateDoc(docRef, data);
}

export async function deleteInvoiceDoc(id: string): Promise<void> {
  if (!db) return;
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}
