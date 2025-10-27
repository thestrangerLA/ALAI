
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
  runTransaction,
  increment
} from "firebase/firestore";
import type { Debtor, Sale } from "@/lib/types";
import { db } from "@/firebase";
import { addCustomer } from "./customerService";

const debtorsCollectionRef = collection(db, "debtors");
const stockCollectionRef = collection(db, "stockReceive"); 

export async function saveDebtor(debtorData: Omit<Debtor, 'id' | 'saleDate'> & {saleDate: Date}): Promise<{success: boolean, message: string}> {
  // Unpaid invoices also deduct stock
  const batch = writeBatch(db);

  try {
    // 0. If a customer name is provided, ensure the customer exists.
    if (debtorData.customerName && debtorData.customerName.trim() !== '') {
      // This function already handles checking for duplicates.
      addCustomer({ name: debtorData.customerName.trim() });
    }
    
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

export async function deleteDebtor(debtor: Debtor) {
  const debtorDocRef = doc(db, "debtors", debtor.id);

  await runTransaction(db, async (transaction) => {
    // Phase 1: Read all necessary data first.
    const debtorDoc = await transaction.get(debtorDocRef);
    if (!debtorDoc.exists()) {
      throw new Error("Debtor document not found. It might have been already deleted.");
    }
    
    // Get all stock document references
    const stockRefs = debtor.items.map(item => doc(db, "stockReceive", item.id));
    // Read all stock documents
    const stockDocs = await Promise.all(stockRefs.map(ref => transaction.get(ref)));

    // Phase 2: Perform all writes.
    // Iterate over the items and their corresponding documents to perform updates
    debtor.items.forEach((item, index) => {
        const stockDoc = stockDocs[index];
        if(stockDoc.exists()) {
            transaction.update(stockRefs[index], { quantity: increment(item.sellQuantity) });
        }
    });

    // Finally, delete the debtor document
    transaction.delete(debtorDocRef);
  });
}
