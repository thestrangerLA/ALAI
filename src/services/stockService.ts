

import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp,
  query,
  orderBy,
  writeBatch,
  getDocs,
  where
} from "firebase/firestore";
import type { StockItem } from "@/lib/types";
import { db } from "@/firebase";

const stockCollectionRef = collection(db, "inventory");

const initialProductNames: string[] = [];


export async function seedInitialData() {
  const q = query(stockCollectionRef);
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    console.log("Inventory is empty, seeding initial data...");
    const batch = writeBatch(db);
    const uniqueProductNames = [...new Set(initialProductNames)];

    uniqueProductNames.forEach((name, index) => {
      const docRef = doc(stockCollectionRef);
      const partCode = `P${(index + 1).toString().padStart(3, '0')}`;
      const newItem: Omit<StockItem, 'id'> = {
        partCode: partCode,
        partName: name.trim(),
        quantity: 0,
        price: 0,
        costPrice: 0,
        wholesalePrice: 0,
        createdAt: serverTimestamp(),
      };
      batch.set(docRef, newItem);
    });

    try {
      await batch.commit();
      console.log("Initial data seeded successfully.");
    } catch (e) {
      console.error("Error seeding data: ", e);
    }
  } else {
    console.log("Inventory already contains data, skipping seed.");
  }
}

export function listenToStockItems(callback: (items: StockItem[]) => void) {
  const q = query(stockCollectionRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockItem));
    callback(items);
  }, (error) => {
    console.error("Error listening to stock items: ", error);
  });
}

export async function addStockItem(item: Omit<StockItem, 'id' | 'createdAt'>): Promise<string | void> {
  try {
    const existingItemQuery = query(stockCollectionRef, where("partCode", "==", item.partCode));
    const existingItemSnapshot = await getDocs(existingItemQuery);

    if (!existingItemSnapshot.empty) {
        const errorMessage = "Error: Part code already exists.";
        console.error(errorMessage);
        return errorMessage;
    }
    await addDoc(stockCollectionRef, { ...item, createdAt: serverTimestamp() });
  } catch (e) {
    console.error("Error adding document: ", e);
    if (e instanceof Error) {
        return e.message;
    }
    return "An unknown error occurred.";
  }
}

export async function updateStockItem(id: string, updatedFields: Partial<Omit<StockItem, 'id'>>) {
  const itemDoc = doc(db, "inventory", id);
  try {
    await updateDoc(itemDoc, updatedFields);
  } catch (e) {
    console.error("Error updating document: ", e);
  }
}

export async function deleteStockItem(id: string) {
  const itemDoc = doc(db, "inventory", id);
  try {
    await deleteDoc(itemDoc);
  } catch (e) {
    console.error("Error deleting document: ", e);
  }
}

