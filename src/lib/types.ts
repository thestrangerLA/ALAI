
import { Timestamp } from "firebase/firestore";

export interface StockItem {
  id: string;
  partCode: string;
  partName: string;
  quantity: number;
  price: number;
  costPrice: number;
  wholesalePrice: number;
  createdAt: any;
}

export interface InvoiceItem extends StockItem {
  sellQuantity: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerName: string;
  saleDate: Timestamp;
  items: InvoiceItem[];
  totalAmount: number;
}
