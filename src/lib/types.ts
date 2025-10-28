
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

export type SaleItem = Omit<InvoiceItem, 'price'> & { 
  price: number; 
  priceType: 'sell' | 'wholesale' | 'custom',
  costPrice: number;
};

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerName: string;
  saleDate: Timestamp;
  items: SaleItem[];
  totalAmount: number;
  status: 'paid' | 'unpaid';
}

export interface Debtor extends Sale {}

export interface Customer {
  id: string;
  name: string;
  createdAt?: Timestamp;
}

export interface PurchaseItem {
    id: string; // Corresponds to StockItem id
    productCode: string;
    productName: string;
    quantity: number;
    costPrice: number;
}

export interface Purchase {
    id: string;
    supplierName: string;
    purchaseDate: Timestamp;
    items: PurchaseItem[];
    totalAmount: number;
}

export interface OtherExpense {
    id: string;
    description: string;
    amount: number;
    date: Timestamp;
}

    