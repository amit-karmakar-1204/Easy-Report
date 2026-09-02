import {
  collection,
  doc,
  getDocs,
  query,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config";
import {
  defaultInvoices,
  defaultPurchases,
  defaultInventory,
  defaultParties,
  defaultPerformanceItems,
} from "@/lib/defaultData";

export async function seedInitialDataToFirestore(): Promise<{
  success: boolean;
  message: string;
}> {
  if (!db) {
    return {
      success: false,
      message: "Firebase is not configured or initialized.",
    };
  }

  try {
    const batch = writeBatch(db);

    // Seed Invoices
    for (const inv of defaultInvoices) {
      const docRef = doc(db, "invoices", inv.id);
      const { id: _, ...data } = inv;
      batch.set(docRef, data);
    }

    // Seed Purchases
    for (const pur of defaultPurchases) {
      const docRef = doc(db, "purchases", pur.id);
      const { id: _, ...data } = pur;
      batch.set(docRef, data);
    }

    // Seed Inventory
    for (const item of defaultInventory) {
      const docRef = doc(db, "inventory", item.id);
      const { id: _, ...data } = item;
      batch.set(docRef, data);
    }

    // Seed Parties
    for (const party of defaultParties) {
      const docRef = doc(db, "parties", party.id);
      const { id: _, ...data } = party;
      batch.set(docRef, data);
    }

    // Seed Performance Items
    for (const perf of defaultPerformanceItems) {
      const docRef = doc(db, "performance", perf.id);
      const { id: _, ...data } = perf;
      batch.set(docRef, data);
    }

    await batch.commit();

    return {
      success: true,
      message: `Successfully seeded Firestore with default ERP data (${defaultInvoices.length} invoices, ${defaultPurchases.length} purchases, ${defaultInventory.length} inventory items, ${defaultParties.length} parties).`,
    };
  } catch (error) {
    console.error("Failed to seed Firestore:", error);
    return {
      success: false,
      message: `Seed failed: ${(error as Error).message}`,
    };
  }
}

export async function clearFirestoreData(): Promise<{
  success: boolean;
  message: string;
}> {
  if (!db) {
    return {
      success: false,
      message: "Firebase is not configured or initialized.",
    };
  }

  try {
    const collectionsToClear = [
      "invoices",
      "purchases",
      "inventory",
      "parties",
      "performance",
    ];

    for (const colName of collectionsToClear) {
      const q = query(collection(db, colName));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        for (const docSnap of snapshot.docs) {
          batch.delete(docSnap.ref);
        }
        await batch.commit();
      }
    }

    return {
      success: true,
      message: "All collections in Firestore have been cleared.",
    };
  } catch (error) {
    console.error("Failed to clear Firestore:", error);
    return {
      success: false,
      message: `Clear failed: ${(error as Error).message}`,
    };
  }
}
