

import { db } from '@/lib/firebase';
import type { CodEntry } from '@/lib/types';
import { 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    doc, 
    updateDoc, 
    deleteDoc, 
    orderBy,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { startOfDay } from 'date-fns';

const codCollectionRef = collection(db, 'autoparts-codEntries');

export const listenToAutoPartsCodEntries = (callback: (items: CodEntry[]) => void) => {
    const q = query(codCollectionRef, orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const entries: CodEntry[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            entries.push({ 
                id: doc.id, 
                ...data,
                date: (data.date as Timestamp).toDate(),
                createdAt: (data.createdAt as Timestamp)?.toDate() 
            } as CodEntry);
        });
        callback(entries);
    });
    return unsubscribe;
};

export const addAutoPartsCodEntry = async (entry: Omit<CodEntry, 'id' | 'createdAt' | 'isPaidToOffice'>) => {
    await addDoc(codCollectionRef, {
        ...entry,
        isPaidToOffice: false,
        createdAt: serverTimestamp()
    });
};

export const updateAutoPartsCodEntry = async (id: string, updatedFields: Partial<Omit<CodEntry, 'id' | 'createdAt'>>) => {
    const codDoc = doc(db, 'autoparts-codEntries', id);
    
    const dataToUpdate: any = { ...updatedFields };
    if (updatedFields.date && updatedFields.date instanceof Date) {
        dataToUpdate.date = Timestamp.fromDate(updatedFields.date);
    }
    await updateDoc(codDoc, dataToUpdate);
};

export const deleteAutoPartsCodEntry = async (id: string) => {
    const codDoc = doc(db, 'autoparts-codEntries', id);
    await deleteDoc(codDoc);
};
