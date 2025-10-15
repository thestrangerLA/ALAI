
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
  deleteDoc,
  runTransaction
} from "firebase/firestore";
import type { Debtor, Sale } from "@/lib/types";
import { db } from "@/firebase";

const debtorsCollectionRef = collection(db, "debtors");
const stockCollectionRef = collection(db, "stockReceive"); 

export async function saveDebtor(debtorData: Omit<Debtor, 'id' | 'saleDate'> & {saleDate: Date}): Promise<{success: boolean, message: string}> {
  // Unpaid invoices also deduct stock
  const batch = writeBatch(db);

  try {
    // 1. Create a new debtor document
    const debtorRef = doc(debtorsCollectionRef);
    batch.set(debtorRef, {
        ...debtorData,
        saleDate: Timestamp.fromDate(debtorData.saleDate),
        status: 'unpaid'
    });

    // 2. Update stock quantities for each item
    for (const item of debtorData.items) {
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
        throw new Error(`Stock item with id ${item.id} not found.`);
      }
    }

    // 3. Commit the batch
    await batch.commit();
    return { success: true, message: "Unpaid invoice recorded successfully!" };

  } catch (error) {
    console.error("Error saving debtor: ", error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: "An unknown error occurred while saving unpaid invoice." };
  }
}

export function listenToDebtors(callback: (debtors: Debtor[]) => void) {
  const q = query(debtorsCollectionRef, orderBy("saleDate", "desc"));
  return onSnapshot(q, (snapshot) => {
    const debtors = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Debtor));
    callback(debtors);
  }, (error) => {
    console.error("Error listening to debtors: ", error);
  });
}

export async function markAsPaid(debtor: Debtor): Promise<{success: boolean, message: string}> {
    const debtorDocRef = doc(db, "debtors", debtor.id);
    const salesCollectionRef = collection(db, "sales");

    try {
        await runTransaction(db, async (transaction) => {
            const debtorDoc = await transaction.get(debtorDocRef);
            if (!debtorDoc.exists()) {
                throw new Error("Debtor document does not exist!");
            }

            // Create a new sale document from the debtor data
            const newSaleData = {
                ...debtorDoc.data(),
                status: 'paid' as const, // Change status to 'paid'
            };
            
            // Add the new sale document
            transaction.set(doc(salesCollectionRef), newSaleData);

            // Delete the original debtor document
            transaction.delete(debtorDocRef);
        });

        return { success: true, message: "Invoice marked as paid and moved to sales successfully." };
    } catch (error) {
        console.error("Error marking as paid: ", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: "An unknown error occurred during the transaction." };
    }
}
