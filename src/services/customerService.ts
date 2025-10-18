
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  query,
  orderBy,
  where,
  getDocs,
  doc,
  deleteDoc,
  Timestamp
} from "firebase/firestore";
import type { Customer, Sale, Debtor } from "@/lib/types";
import { db } from "@/firebase";

const customersCollectionRef = collection(db, "customers");
const salesCollectionRef = collection(db, "sales");
const debtorsCollectionRef = collection(db, "debtors");

export function listenToCustomers(callback: (customers: Customer[]) => void) {
  const q = query(customersCollectionRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const customers = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Customer));
    callback(customers);
  }, (error) => {
    console.error("Error listening to customers: ", error);
  });
}

export async function addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<{success: boolean, message: string}> {
  try {
    // Check if customer name already exists
    const q = query(customersCollectionRef, where("name", "==", customer.name));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { success: false, message: "ຊື່ລູກຄ້ານີ້ມີຢູ່ໃນລະບົບແລ້ວ." };
    }

    await addDoc(customersCollectionRef, { 
      ...customer,
      createdAt: serverTimestamp(),
    });
    return { success: true, message: "Customer added successfully." };
  } catch (e) {
    console.error("Error adding customer: ", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return { success: false, message: errorMessage };
  }
}

export async function deleteCustomer(id: string): Promise<{success: boolean, message: string}> {
  const customerDoc = doc(db, "customers", id);
  try {
    await deleteDoc(customerDoc);
    return { success: true, message: "Customer deleted successfully." };
  } catch (e) {
    console.error("Error deleting customer: ", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return { success: false, message: errorMessage };
  }
}

export async function getAllCustomers(): Promise<Customer[]> {
  const q = query(customersCollectionRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
}

// Function to get all transactions and stats for a specific customer
export async function getCustomerTransactions(customerName: string) {
    const salesQuery = query(salesCollectionRef, where("customerName", "==", customerName));
    const debtorsQuery = query(debtorsCollectionRef, where("customerName", "==", customerName));

    const [salesSnapshot, debtorsSnapshot] = await Promise.all([
        getDocs(salesQuery),
        getDocs(debtorsQuery)
    ]);

    const sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
    const debtors = debtorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debtor));

    const allTransactions = [...sales, ...debtors];
    
    allTransactions.sort((a, b) => {
        const dateA = a.saleDate instanceof Timestamp ? a.saleDate.toMillis() : new Date(a.saleDate as any).getTime();
        const dateB = b.saleDate instanceof Timestamp ? b.saleDate.toMillis() : new Date(b.saleDate as any).getTime();
        return dateB - dateA;
    });

    let totalSpent = 0;
    let totalDebt = 0;
    let paidInvoices = 0;
    let unpaidInvoices = 0;

    allTransactions.forEach(tx => {
        if (tx.status === 'paid') {
            totalSpent += tx.totalAmount;
            paidInvoices++;
        } else {
            totalDebt += tx.totalAmount;
            unpaidInvoices++;
        }
    });
    
    return { 
        transactions: allTransactions, 
        stats: { totalSpent, totalDebt, paidInvoices, unpaidInvoices } 
    };
}
