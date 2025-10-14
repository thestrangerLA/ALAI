
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
  getDocs,
  where
} from "firebase/firestore";
import type { StockItem } from "@/lib/types";
import { db } from "@/firebase";

// Use a simple root collection name
const stockCollectionRef = collection(db, "stockReceive"); 

export function listenToStockItems(callback: (items: StockItem[]) => void) {
  const q = query(stockCollectionRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockItem));
    callback(items);
  }, (error) => {
    console.error("Error listening to stock items: ", error);
  });
}

export async function addStockItem(item: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | void> {
  try {
    const existingItemQuery = query(stockCollectionRef, where("productCode", "==", item.productCode));
    const existingItemSnapshot = await getDocs(existingItemQuery);

    if (!existingItemSnapshot.empty) {
        const errorMessage = "Error: Product code already exists.";
        console.error(errorMessage);
        return errorMessage;
    }
    
    await addDoc(stockCollectionRef, { 
      ...item,
      date: item.date || new Date().toISOString().split('T')[0],
      note: item.note || '',
      supplier: item.supplier || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp() 
    });

  } catch (e) {
    console.error("Error adding document: ", e);
    if (e instanceof Error) {
        return e.message;
    }
    return "An unknown error occurred.";
  }
}

export async function updateStockItem(id: string, updatedFields: Partial<Omit<StockItem, 'id'>>) {
  const itemDoc = doc(db, "stockReceive", id);
  try {
     if (updatedFields.productCode) {
      const existingItemQuery = query(
        stockCollectionRef, 
        where("productCode", "==", updatedFields.productCode)
      );
      const existingItemSnapshot = await getDocs(existingItemQuery);
      
      const isDuplicate = existingItemSnapshot.docs.some(document => document.id !== id);
      
      if (isDuplicate) {
        const errorMessage = "Error: Product code already exists.";
        console.error(errorMessage);
        return errorMessage;
      }
    }
    await updateDoc(itemDoc, {
        ...updatedFields,
        updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.error("Error updating document: ", e);
     if (e instanceof Error) {
        return e.message;
    }
    return "An unknown error occurred.";
  }
}

export async function deleteStockItem(id: string) {
  const itemDoc = doc(db, "stockReceive", id);
  try {
    await deleteDoc(itemDoc);
  } catch (e) {
    console.error("Error deleting document: ", e);
  }
}
