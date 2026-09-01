import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  type Unsubscribe,
  updateDoc,
} from "firebase/firestore";
import type { LedgerTransaction, PartyAccount } from "@/lib/types";
import { db } from "../config";

const COLLECTION_NAME = "parties";

export function subscribeParties(
  onUpdate: (parties: PartyAccount[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe | null {
  if (!db) return null;

  try {
    const q = query(collection(db, COLLECTION_NAME));

    return onSnapshot(
      q,
      (snapshot) => {
        const parties = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as Omit<PartyAccount, "id">),
          id: docSnap.id,
        }));
        onUpdate(parties);
      },
      (err) => {
        console.error("Error subscribing to parties:", err);
        onError?.(err);
      },
    );
  } catch (error) {
    console.error("Failed to setup parties subscription:", error);
    onError?.(error as Error);
    return null;
  }
}

export async function fetchParties(): Promise<PartyAccount[]> {
  if (!db) return [];
  const q = query(collection(db, COLLECTION_NAME));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    ...(docSnap.data() as Omit<PartyAccount, "id">),
    id: docSnap.id,
  }));
}

export async function createPartyDoc(party: PartyAccount): Promise<void> {
  if (!db) return;
  const docRef = doc(db, COLLECTION_NAME, party.id);
  const { id: _, ...data } = party;
  await setDoc(docRef, data);
}

export async function updatePartyDoc(
  id: string,
  updates: Partial<PartyAccount>,
): Promise<void> {
  if (!db) return;
  const docRef = doc(db, COLLECTION_NAME, id);
  const { id: _, ...data } = updates;
  await updateDoc(docRef, data);
}

export async function recordPartyPaymentDoc(
  partyId: string,
  amount: number,
  description: string,
  date: string,
): Promise<void> {
  if (!db) return;
  const docRef = doc(db, COLLECTION_NAME, partyId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;

  const currentData = docSnap.data() as PartyAccount;
  const currentBalance = currentData.outstandingBalance || 0;
  const newBalance = Math.max(0, currentBalance - amount);
  const currentTxs = currentData.transactions || [];

  const newTx: LedgerTransaction = {
    id: `tx-${Date.now()}`,
    date,
    description: description || "Payment Received",
    debit: 0,
    credit: amount,
    balance: newBalance,
  };

  await updateDoc(docRef, {
    outstandingBalance: newBalance,
    asOfDate: date,
    transactions: [...currentTxs, newTx],
  });
}
