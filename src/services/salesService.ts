
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  writeBatch,
  doc,
  Timestamp,
  query,
  orderBy,
  getDoc
} from "firebase/firestore";
import type { Sale } from "@/lib/types";
import { db } from "@/firebase";

const salesCollectionRef = collection(db, "sales");
const stockCollectionRef = collection(db, "stockReceive"); // Changed to stockReceive

export async function saveSale(saleData: Omit<Sale, 'id' | 'saleDate'> & {saleDate: Date}) {
  const batch = writeBatch(db);

  // 1. Create a new sale document in the root 'sales' collection
  const saleRef = doc(salesCollectionRef);
  batch.set(saleRef, {
      ...saleData,
      saleDate: Timestamp.fromDate(saleData.saleDate),
  });

  // 2. Update stock quantities for each item sold in the 'stockReceive' collection
  for (const item of saleData.items) {
    const itemRef = doc(stockCollectionRef, item.id);
    const itemDoc = await getDoc(itemRef);
    if (itemDoc.exists()) {
        const currentQuantity = itemDoc.data().quantity;
        const newQuantity = currentQuantity - item.sellQuantity;
        batch.update(itemRef, { quantity: newQuantity });
    } else {
      console.warn(`Stock item with id ${item.id} not found. Cannot update quantity.`);
    }
  }

  // 3. Commit the batch
  await batch.commit();
}

export function listenToSales(callback: (sales: Sale[]) => void) {
  const q = query(salesCollectionRef, orderBy("saleDate", "desc"));
  return onSnapshot(q, (snapshot) => {
    const sales = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Sale));
    callback(sales);
  }, (error) => {
    console.error("Error listening to sales: ", error);
  });
}
