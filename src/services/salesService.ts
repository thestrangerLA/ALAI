
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
  increment,
  getDocs,
  where
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
      const stockDoc = await transaction.get(stockRef);
      // Only update stock if the item still exists in the stock collection
      if (stockDoc.exists()) {
        transaction.update(stockRef, { quantity: increment(item.sellQuantity) });
      }
    }

    // 3. Delete the sale document
    transaction.delete(saleDocRef);
  });
}


export async function getAllSales(): Promise<Sale[]> {
    const q = query(salesCollectionRef, orderBy("saleDate", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
}

const calculateProfit = (sale: Sale): number => {
    return sale.items.reduce((totalProfit, item) => {
      const costPrice = item.costPrice || 0;
      const profitPerItem = (item.price * item.sellQuantity) - (costPrice * item.sellQuantity);
      return totalProfit + profitPerItem;
    }, 0);
};

export async function getSalesForDate(dateString: string) {
    const startOfDay = new Date(dateString);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(dateString);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);

    const q = query(
        salesCollectionRef,
        where("saleDate", ">=", startTimestamp),
        where("saleDate", "<=", endTimestamp)
    );

    const snapshot = await getDocs(q);
    const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
    sales.sort((a,b) => b.saleDate.toMillis() - a.saleDate.toMillis());

    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + calculateProfit(sale), 0);

    return { sales, totalSales, totalProfit };
}
