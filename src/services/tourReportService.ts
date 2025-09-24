// src/services/tourReportService.ts
import { db } from '@/lib/firebase';
import type { TourCostItem, TourIncomeItem, TourProgram } from '@/lib/types';
import { 
    collection, 
    onSnapshot, 
    query, 
    orderBy,
    Timestamp
} from 'firebase/firestore';

const programsCollectionRef = collection(db, 'tourPrograms');
const costsCollectionRef = collection(db, 'tourCostItems');
const incomeCollectionRef = collection(db, 'tourIncomeItems');

export const listenToAllTourPrograms = (callback: (items: TourProgram[]) => void) => {
    const q = query(programsCollectionRef, orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const items: TourProgram[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            items.push({ 
                id: doc.id, 
                ...data,
                date: (data.date as Timestamp)?.toDate(),
                createdAt: (data.createdAt as Timestamp)?.toDate()
            } as TourProgram);
        });
        callback(items);
    });
    return unsubscribe;
};

export const listenToAllTourCostItems = (callback: (items: TourCostItem[]) => void) => {
    const q = query(costsCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const items: TourCostItem[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            items.push({ 
                id: doc.id, 
                ...data,
                date: (data.date as Timestamp)?.toDate() || null,
                createdAt: (data.createdAt as Timestamp)?.toDate()
            } as TourCostItem);
        });
        callback(items);
    });
    return unsubscribe;
};


export const listenToAllTourIncomeItems = (callback: (items: TourIncomeItem[]) => void) => {
    const q = query(incomeCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const items: TourIncomeItem[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            items.push({ 
                id: doc.id, 
                ...data,
                date: (data.date as Timestamp)?.toDate() || null,
                createdAt: (data.createdAt as Timestamp)?.toDate()
            } as TourIncomeItem);
        });
        callback(items);
    });
    return unsubscribe;
};
