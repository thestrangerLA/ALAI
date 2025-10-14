
'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  onSnapshot,
} from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HardHat, ShoppingCart, FileText, LogOut } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
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
    
    const { user, loading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login');
      }
    }, [user, loading, router]);


    // Data Fetching
    useEffect(() => {
        if (!firestore || !user) return;
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

    }, [firestore, user]);


    // Derived State & Calculations
    const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);

    const handleSignOut = async () => {
        const auth = getAuth();
        await signOut(auth);
        router.push('/login');
    };
    
    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-lg font-semibold text-gray-700">ກຳລັງໂຫຼດ...</p>
                </div>
            </div>
        );
    }
  
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
                    <div className="bg-blue-100 px-4 py-2 rounded-lg">
                        <span className="text-blue-800 font-semibold">ຜູ້ໃຊ້: <span id="currentUser">{user?.displayName || user?.email || 'Admin'}</span></span>
                    </div>
                    <Button variant="outline" size="icon" onClick={handleSignOut} title="ອອກຈາກລະບົບ">
                        <LogOut className="h-5 w-5" />
                    </Button>
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
