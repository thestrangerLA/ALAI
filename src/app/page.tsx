
'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  onSnapshot,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import Link from 'next/link';
import { HardHat, ShoppingCart, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';


// Mock data structure, will be replaced by Firestore data
interface InventoryItem {
  id: string;
  partCode: string;
  partName: string;
  quantity: number;
  price: number;
  costPrice: number;
  wholesalePrice: number;
}


export default function Home() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    
    const firestore = useFirestore();

    // Data Fetching
    useEffect(() => {
        if (!firestore) return;
        const inventoryQuery = query(collection(firestore, 'inventory'));

        const unsubInventory = onSnapshot(inventoryQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
            setInventory(items);
        }, (error) => {
            console.error("Error fetching inventory: ", error);
        });

        return () => {
            unsubInventory();
        };

    }, [firestore]);


    // Derived State & Calculations
    const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);

    return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
    {/* Header */}
    <header className="bg-white shadow-lg border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
                <div className="flex items-center">
                    <div className="bg-blue-500 p-3 rounded-lg mr-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8m-8 0a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z"></path>
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">POS ລະບົບຂາຍສິ້ນສ່ວນ</h1>
                        <p className="text-gray-600">ລະບົບຈຸດຂາຍສິ້ນສ່ວນລົດຍົນ</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="bg-green-100 px-4 py-2 rounded-lg">
                        <span className="text-green-800 font-semibold">ສິນຄ້າທັງໝົດ: <span id="totalStock">{totalStock.toLocaleString()}</span> ອັນ</span>
                    </div>
                </div>
            </div>
        </div>
    </header>

    {/* Navigation Tabs */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-white rounded-xl shadow-lg p-2">
            <nav className="flex space-x-2 overflow-x-auto">
                <Link href="/stock" className={`tab-inactive px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center whitespace-nowrap`}>
                    <HardHat className="w-5 h-5 mr-2" />
                    ຈັດການສິນຄ້າ
                </Link>
                <Link href="/invoice" className={`tab-active px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center whitespace-nowrap`}>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    ອອກບິນ
                </Link>
                <Link href="/sales" className={`tab-inactive px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center whitespace-nowrap`}>
                    <FileText className="w-5 h-5 mr-2" />
                    ລາຍງານການຂາຍ
                </Link>
            </nav>
        </div>
    </div>
  </div>
  );
}
