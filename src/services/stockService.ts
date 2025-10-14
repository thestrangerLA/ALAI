
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

const staticUserId = "default-user";
const stockCollectionRef = collection(db, "users", staticUserId, "inventory");

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
    
    // This was the missing part. Now it will add the document.
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
  const itemDoc = doc(db, "users", staticUserId, "inventory", id);
  try {
    await updateDoc(itemDoc, updatedFields);
  } catch (e) {
    console.error("Error updating document: ", e);
  }
}

export async function deleteStockItem(id: string) {
  const itemDoc = doc(db, "users", staticUserId, "inventory", id);
  try {
    await deleteDoc(itemDoc);
  } catch (e) {
    console.error("Error deleting document: ", e);
  }
}
