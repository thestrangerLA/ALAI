
// src/lib/types.ts
import type { Timestamp } from 'firebase/firestore';

// A flexible type for saved tour calculations.
// You can expand this with more specific properties as your app develops.
export interface SavedCalculation {
    id: string;
    name: string;
    savedAt: Date | Timestamp;
    totalCost?: number;
    tourInfo: TourInfo;
    allCosts: TourCosts;
    // Allow any other properties that might be part of a calculation
    [key: string]: any;
}


export interface TourProgram {
    id: string;
    name: string;
    date: Date | Timestamp;
    createdAt: Date | Timestamp;
    tourDates?: string;
    description?: string;
    amount?: number;
    // Allow any other properties that might be part of a calculation
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

// Tour Calculator Specific Types
type Currency = 'USD' | 'THB' | 'LAK' | 'CNY';

export interface TourInfo {
    mouContact: string;
    groupCode: string;
    destinationCountry: string;
    program: string;
    startDate?: Date | null;
    endDate?: Date | null;
    numDays: number;
    numNights: number;
    numPeople: number;
    travelerInfo: string;
}

export interface Room {
    id: string;
    type: string;
    numRooms: number;
    numNights: number;
    price: number;
    currency: Currency;
}

export interface Accommodation {
    id: string;
    name: string;
    checkInDate?: Date | null;
    rooms: Room[];
}

export interface Trip {
    id: string;
    location: string;
    route: string;
    vehicleType: string;
    numVehicles: number;
    numDays: number;
    pricePerVehicle: number;
    currency: Currency;
}

export interface Flight {
    id: string;
    from: string;
    to: string;
    departureDate?: Date | null;
    departureTime: string;
    pricePerPerson: number;
    numPeople: number;
    currency: Currency;
}

export interface TrainTicket {
    id: string;
    from: string;
    to: string;
    departureDate?: Date | null;
    departureTime: string;
    ticketClass: string;
    numTickets: number;
    pricePerTicket: number;
    currency: Currency;
}

export interface EntranceFee {
    id: string;
    locationName: string;
    pax: number;
    numLocations: number;
    price: number;
    currency: Currency;
}

export interface MealCost {
    id: string;
    name: string;
    pax: number;
    breakfast: number;
    lunch: number;
    dinner: number;
    pricePerMeal: number;
    currency: Currency;
}

export interface GuideFee {
    id: string;
    guideName: string;
    numGuides: number;
    numDays: number;
    pricePerDay: number;
    currency: Currency;
}

export interface DocumentFee {
    id: string;
    documentName: string;
    pax: number;
    price: number;
    currency: Currency;
}

export interface TourCosts {
    accommodations: Accommodation[];
    trips: Trip[];
    flights: Flight[];
    trainTickets: TrainTicket[];
    entranceFees: EntranceFee[];
    meals: MealCost[];
    guides: GuideFee[];
    documents: DocumentFee[];
}

    