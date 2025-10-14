import type { Timestamp } from 'firebase/firestore';

export interface Part {
    id: string;
    name: string;
    sku: string;
    oemCode: string;
    brand: string;
    category: string;
    compatibleModels: string;
    quantity: number;
    lowStockThreshold: number;
    costPrice: number;
    sellingPrice: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface StockMovement {
    id: string;
    partId: string;
    partName: string;
    quantityChange: number;
    newQuantity: number;
    type: 'Stock In' | 'Stock Out' | 'Initial' | 'Adjustment';
    reason: string;
    relatedDocId?: string; // e.g., purchase order ID or sale ID
    timestamp: Timestamp;
}
