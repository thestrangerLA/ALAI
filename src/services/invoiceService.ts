import { collection, getCountFromServer, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/firebase";

const salesCollectionRef = collection(db, "sales");
const debtorsCollectionRef = collection(db, "debtors");

export async function getDailyInvoiceCount(date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);

    try {
        const salesQuery = query(salesCollectionRef, where("saleDate", ">=", startTimestamp), where("saleDate", "<=", endTimestamp));
        const debtorsQuery = query(debtorsCollectionRef, where("saleDate", ">=", startTimestamp), where("saleDate", "<=", endTimestamp));

        const salesSnapshot = await getCountFromServer(salesQuery);
        const debtorsSnapshot = await getCountFromServer(debtorsQuery);

        const salesCount = salesSnapshot.data().count;
        const debtorsCount = debtorsSnapshot.data().count;

        return salesCount + debtorsCount;
    } catch (error) {
        console.error("Error getting daily invoice count: ", error);
        return 0;
    }
}
