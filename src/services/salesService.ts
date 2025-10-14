
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  writeBatch,
  doc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import type { Sale, InvoiceItem } from "@/lib/types";
import { db } from "@/firebase";

const salesCollectionRef = collection(db, "sales");
const stockCollectionRef = collection(db, "inventory");

export async function saveSale(saleData: Omit<Sale, 'id' | 'saleDate'> & {saleDate: Date}) {
  const batch = writeBatch(db);

  // 1. Create a new sale document
  const saleRef = doc(salesCollectionRef);
  batch.set(saleRef, {
      ...saleData,
      saleDate: Timestamp.fromDate(saleData.saleDate), // Convert JS Date to Firestore Timestamp
  });

  // 2. Update stock quantities for each item sold
  saleData.items.forEach((item: InvoiceItem) => {
    const itemRef = doc(stockCollectionRef, item.id);
    const newQuantity = item.quantity - item.sellQuantity;
    batch.update(itemRef, { quantity: newQuantity });
  });

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
  });
}
