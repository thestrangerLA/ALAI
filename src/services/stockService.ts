
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getFirestore
} from "firebase/firestore";
import type { StockItem } from "@/lib/types";
import { initializeFirebase } from "@/firebase";

// This is a simplified service. In a real app, you'd handle errors and security.

const { firestore } = initializeFirebase();
const stockCollection = collection(firestore, "stockItems");

export function listenToStockItems(callback: (items: StockItem[]) => void) {
  return onSnapshot(stockCollection, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockItem));
    callback(items);
  });
}

export async function addStockItem(item: Omit<StockItem, 'id'>) {
  try {
    await addDoc(stockCollection, item);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

export async function updateStockItem(id: string, updatedFields: Partial<StockItem>) {
  const itemDoc = doc(firestore, "stockItems", id);
  try {
    await updateDoc(itemDoc, updatedFields);
  } catch (e) {
    console.error("Error updating document: ", e);
  }
}

export async function deleteStockItem(id: string) {
  const itemDoc = doc(firestore, "stockItems", id);
  try {
    await deleteDoc(itemDoc);
  } catch (e) {
    console.error("Error deleting document: ", e);
  }
}

    