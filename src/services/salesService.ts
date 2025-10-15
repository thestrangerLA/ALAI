
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  writeBatch,
  doc,
  Timestamp,
  query,
  orderBy,
  getDoc,
  runTransaction,
  increment
} from "firebase/firestore";
import type { Sale } from "@/lib/types";
import { db } from "@/firebase";

const salesCollectionRef = collection(db, "sales");
const stockCollectionRef = collection(db, "stockReceive"); 

export async function saveSale(saleData: Omit<Sale, 'id' | 'saleDate'> & {saleDate: Date}): Promise<{success: boolean, message: string}> {
  const batch = writeBatch(db);

  try {
    // 1. Create a new sale document
    const saleRef = doc(salesCollectionRef);
    batch.set(saleRef, {
        ...saleData,
        saleDate: Timestamp.fromDate(saleData.saleDate),
        status: 'paid' // Ensure status is always 'paid' for a sale
    });

    // 2. Update stock quantities for each item sold
    for (const item of saleData.items) {
      if (!item.id) {
        throw new Error(`Invoice item ${item.productName} is missing an ID.`);
      }
      const itemRef = doc(stockCollectionRef, item.id);
      const itemDoc = await getDoc(itemRef);

      if (itemDoc.exists()) {
          const currentQuantity = itemDoc.data().quantity;
          const newQuantity = currentQuantity - item.sellQuantity;
          if (newQuantity < 0) {
            throw new Error(`Not enough stock for ${item.productName}. Only ${currentQuantity} left.`);
          }
          batch.update(itemRef, { quantity: newQuantity });
      } else {
        // This case should ideally not happen if items are added from existing stock
        throw new Error(`Stock item with id ${item.id} not found. Cannot update quantity.`);
      }
    }

    // 3. Commit the batch
    await batch.commit();
    return { success: true, message: "Sale recorded successfully!" };

  } catch (error) {
    console.error("Error saving sale: ", error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: "An unknown error occurred while saving the sale." };
  }
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

export async function deleteSale(sale: Sale) {
  const saleDocRef = doc(db, "sales", sale.id);

  await runTransaction(db, async (transaction) => {
    // 1. Verify the sale document exists
    const saleDoc = await transaction.get(saleDocRef);
    if (!saleDoc.exists()) {
      throw new Error("Sale document not found. It might have been already deleted.");
    }
    
    // 2. Iterate over items to return them to stock
    for (const item of sale.items) {
      const stockRef = doc(db, "stockReceive", item.id);
      transaction.update(stockRef, { quantity: increment(item.sellQuantity) });
    }

    // 3. Delete the sale document
    transaction.delete(saleDocRef);
  });
}
