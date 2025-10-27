
import { 
  collection, 
  onSnapshot,
  writeBatch,
  doc,
  Timestamp,
  query,
  orderBy,
  runTransaction,
  increment,
} from "firebase/firestore";
import type { Purchase } from "@/lib/types";
import { db } from "@/firebase";

const purchasesCollectionRef = collection(db, "purchases");
const stockCollectionRef = collection(db, "stockReceive"); 

export function listenToPurchases(callback: (purchases: Purchase[]) => void) {
  const q = query(purchasesCollectionRef, orderBy("purchaseDate", "desc"));
  return onSnapshot(q, (snapshot) => {
    const purchases = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Purchase));
    callback(purchases);
  }, (error) => {
    console.error("Error listening to purchases: ", error);
  });
}

export async function addPurchase(purchaseData: Omit<Purchase, 'id' | 'purchaseDate'> & {purchaseDate: Date}): Promise<{success: boolean, message: string}> {
  
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Create a new purchase document
      const purchaseRef = doc(purchasesCollectionRef);
      transaction.set(purchaseRef, {
        ...purchaseData,
        purchaseDate: Timestamp.fromDate(purchaseData.purchaseDate),
      });

      // 2. Update stock for each item in the purchase
      for (const item of purchaseData.items) {
        const stockDocRef = doc(stockCollectionRef, item.id);
        
        // We use transaction.update to ensure atomicity. 
        // increment() is a special value that atomically increases the field's value.
        transaction.update(stockDocRef, { 
          quantity: increment(item.quantity),
          costPrice: item.costPrice // Optionally update the cost price
        });
      }
    });
    
    return { success: true, message: "Purchase recorded and stock updated successfully!" };

  } catch (error) {
    console.error("Error adding purchase and updating stock: ", error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: "An unknown error occurred." };
  }
}
