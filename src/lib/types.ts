// src/lib/types.ts
import type { Timestamp } from 'firebase/firestore';

// A flexible type for saved tour calculations.
// You can expand this with more specific properties as your app develops.
export interface SavedCalculation {
    id: string;
    name: string;
    savedAt: Date | Timestamp;
    totalCost?: number;
    // Allow any other properties that might be part of a calculation
    [key: string]: any;
}


export interface TourProgram {
    id: string;
    name: string;
    date: Date | Timestamp;
    createdAt: Date | Timestamp;
    [key: string]: any;
}

export interface TourCostItem {
    id: string;
    description: string;
    amount: number;
    date: Date | Timestamp | null;
    createdAt: Date | Timestamp;
    programId: string;
    [key: string]: any;
}

export interface TourIncomeItem {
    id: string;
    description: string;
    amount: number;
    date: Date | Timestamp | null;
    createdAt: Date | Timestamp;
    programId: string;
    [key: string]: any;
}
