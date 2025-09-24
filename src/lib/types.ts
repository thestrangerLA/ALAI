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
    tourDates?: string;
    [key: string]: any;
}

export interface TourCostItem {
    id: string;
    description: string;
    amount: number;
    date: Date | Timestamp | null;
    createdAt: Date | Timestamp;
    programId: string;
    detail?: string;
    lak?: number;
    thb?: number;
    usd?: number;
    cny?: number;
    [key: string]: any;
}

export interface TourIncomeItem {
    id: string;
    description: string;
    amount: number;
    date: Date | Timestamp | null;
    createdAt: Date | Timestamp;
    programId: string;
    detail?: string;
    lak?: number;
    thb?: number;
    usd?: number;
    cny?: number;
    [key: string]: any;
}

export interface CurrencyValues {
    kip: number;
    baht: number;
    usd: number;
    cny: number;
}

export interface TourAccountSummary {
    id: string;
    capital: CurrencyValues;
    cash: CurrencyValues;
    transfer: CurrencyValues;
}

export interface Transaction {
    id: string;
    date: Date;
    type: 'income' | 'expense' | 'transfer-in' | 'transfer-out' | 'deposit' | 'withdraw';
    from: string;
    to: string;
    description: string;
    currency: 'kip' | 'baht' | 'usd' | 'cny';
    amount: number;
    createdAt: Timestamp;
}