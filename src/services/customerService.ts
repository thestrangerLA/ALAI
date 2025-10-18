
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
  deleteDoc
} from "firebase/firestore";
import type { Customer } from "@/lib/types";
import { db } from "@/firebase";

const customersCollectionRef = collection(db, "customers");

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
