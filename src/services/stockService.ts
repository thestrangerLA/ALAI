
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
import type { StockItem } from "@/lib/types";
import { initializeFirebase } from "@/firebase";

const { firestore } = initializeFirebase();
const stockCollectionRef = collection(firestore, "inventory");

export function listenToStockItems(callback: (items: StockItem[]) => void) {
  const q = query(stockCollectionRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockItem));
    callback(items);
  });
}

export async function addStockItem(item: Omit<StockItem, 'id' | 'createdAt'>) {
  try {
    await addDoc(stockCollectionRef, { ...item, createdAt: serverTimestamp() });
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

export async function updateStockItem(id: string, updatedFields: Partial<Omit<StockItem, 'id'>>) {
  const itemDoc = doc(firestore, "inventory", id);
  try {
    await updateDoc(itemDoc, updatedFields);
  } catch (e) {
    console.error("Error updating document: ", e);
  }
}

export async function deleteStockItem(id: string) {
  const itemDoc = doc(firestore, "inventory", id);
  try {
    await deleteDoc(itemDoc);
  } catch (e) {
    console.error("Error deleting document: ", e);
  }
}
