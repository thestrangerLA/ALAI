
import { Timestamp } from "firebase/firestore";

export interface StockItem {
  id: string;
  date: string;
  productCode: string;
  productName: string;
  costPrice: number;
  sellPrice: number;
  wholesalePrice: number;
  quantity: number;
  createdAt: any;
  updatedAt?: any;
}

export interface InvoiceItem extends StockItem {
  sellQuantity: number;
  price: number; 
  priceType: 'sell' | 'wholesale' | 'custom';
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerName: string;
  saleDate: Timestamp;
  items: (Omit<InvoiceItem, 'price'> & { price: number; priceType: 'sell' | 'wholesale' | 'custom' })[];
  totalAmount: number;
  status: 'paid' | 'unpaid';
}

export interface Debtor extends Sale {}
