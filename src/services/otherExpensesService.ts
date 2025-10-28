
import { 
  collection, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import type { OtherExpense } from "@/lib/types";
import { db } from "@/firebase";

const otherExpensesCollectionRef = collection(db, "otherExpenses");

export function listenToOtherExpenses(callback: (expenses: OtherExpense[]) => void) {
  const q = query(otherExpensesCollectionRef, orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as OtherExpense));
    callback(expenses);
  }, (error) => {
    console.error("Error listening to other expenses: ", error);
  });
}

export async function addOtherExpense(expense: Omit<OtherExpense, 'id' | 'date'>): Promise<{success: boolean, message: string}> {
  try {
    await addDoc(otherExpensesCollectionRef, { 
      ...expense,
      date: serverTimestamp(),
    });
    return { success: true, message: "Expense added successfully." };
  } catch (e) {
    console.error("Error adding expense: ", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return { success: false, message: errorMessage };
  }
}

export async function deleteOtherExpense(id: string): Promise<{success: boolean, message: string}> {
  const expenseDoc = doc(db, "otherExpenses", id);
  try {
    await deleteDoc(expenseDoc);
    return { success: true, message: "Expense deleted successfully." };
  } catch (e) {
    console.error("Error deleting expense: ", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return { success: false, message: errorMessage };
  }
}

    