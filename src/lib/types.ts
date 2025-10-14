
import { Timestamp } from "firebase/firestore";

export interface StockItem {
  id: string;
  date: string;
  productCode: string;
  productName: string;
  costPrice: number;
  sellPrice: number;
  quantity: number;
  note: string;
  supplier: string;
  createdAt: any;
  updatedAt?: any;
}

export interface InvoiceItem extends StockItem {
  sellQuantity: number;
  // Use sellPrice for invoice calculations
  price: number; 
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerName: string;
  saleDate: Timestamp;
  items: (Omit<InvoiceItem, 'price'> & { price: number })[];
  totalAmount: number;
}
