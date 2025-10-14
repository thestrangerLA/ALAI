

'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { useFirestore, useAuth, useUser } from '@/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

interface SaleItem {
    id: string;
    partCode: string;
    partName: string;
    price: number;
    quantity: number;
    maxQuantity: number;
}


interface SaleRecord {
    id: string;
    receiptNumber: number;
    items: SaleItem[];
    subtotal: number;
    discountPercent: number;
    discountAmount: number;
    taxPercent: number;
    taxAmount: number;
    grandTotal: number;
    received: number;
    change: number;
    customerName: string;
    cashier: string;
    date: string;
    timestamp: any;
}

interface ReceiveRecord {
    id: string;
    partId: string;
    partCode: string;
    partName: string;
    quantity: number;
    cost: number;
    supplier: string;
    date: string;
    note: string;
    timestamp: any;
}


export default function Home() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [receiveHistory, setReceiveHistory] = useState<ReceiveRecord[]>([]);
    const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [currentTab, setCurrentTab] = useState('receive');
    const [receiptNumber, setReceiptNumber] = useState(1);
    
    const [editQuantity, setEditQuantity] = useState(0);

    const [isEditModalOpen, setEditModalOpen] = useState(false);

    const [receivePartId, setReceivePartId] = useState('');
    const [receiveQuantity, setReceiveQuantity] = useState(1);
    const [receiveCost, setReceiveCost] = useState(0);
    const [receiveSupplier, setReceiveSupplier] = useState('');
    const [receiveDate, setReceiveDate] = useState(new Date().toISOString().split('T')[0]);
    const [receiveNote, setReceiveNote] = useState('');
    
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    // Data Fetching
    useEffect(() => {
        if (!firestore || !user) return;
        const inventoryQuery = query(collection(firestore, 'inventory'));
        const receiveQuery = query(collection(firestore, 'receiveHistory'));
        const salesQuery = query(collection(firestore, 'salesHistory'));

        const unsubInventory = onSnapshot(inventoryQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
            setInventory(items);
        });
        const unsubReceive = onSnapshot(receiveQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReceiveRecord));
            setReceiveHistory(items);
        });
        const unsubSales = onSnapshot(salesQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SaleRecord));
            setSalesHistory(items);
            if (items.length > 0) {
                const maxReceipt = Math.max(...items.map(s => s.receiptNumber));
                setReceiptNumber(maxReceipt + 1);
            }
        });

        return () => {
            unsubInventory();
            unsubReceive();
            unsubSales();
        };

    }, [firestore, user]);


    // Derived State & Calculations
    const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);

    const today = new Date().toISOString().split('T')[0];
    const todayTotal = salesHistory
        .filter(sale => sale.date === today)
        .reduce((sum, sale) => sum + sale.grandTotal, 0);

    const stockValue = inventory.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const salesData: {[key: string]: any} = {};
    salesHistory
        .filter(sale => new Date(sale.date) >= sevenDaysAgo)
        .forEach(sale => {
            sale.items.forEach((item: any) => {
                if (!salesData[item.id]) {
                    salesData[item.id] = {
                        partCode: item.partCode,
                        partName: item.partName,
                        quantity: 0,
                        amount: 0
                    };
                }
                salesData[item.id].quantity += item.quantity;
                salesData[item.id].amount += item.quantity * item.price;
            });
        });
    const bestSelling = Object.values(salesData)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);


    // Functions
    const showNotification = (message: string, type: 'success' | 'error') => {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-semibold z-50 fade-in ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    };

    const switchTab = (tabName: string) => {
        setCurrentTab(tabName);
    };

    const handleReceiveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore) return;

        const item = inventory.find(i => i.id === receivePartId);
        if (!item) {
            showNotification('ບໍ່ພົບສິ້ນສ່ວນທີ່ເລືອກ', 'error');
            return;
        };

        const receiveRecord = {
            partId: receivePartId,
            partCode: item.partCode,
            partName: item.partName,
            quantity: Number(receiveQuantity),
            cost: Number(receiveCost),
            supplier: receiveSupplier,
            date: receiveDate,
            note: receiveNote,
            timestamp: serverTimestamp()
        };

        try {
            const batch = writeBatch(firestore);

            // Add to receive history
            const historyRef = collection(firestore, 'receiveHistory');
            batch.set(doc(historyRef), receiveRecord);
            
            // Update inventory
            const itemRef = doc(firestore, 'inventory', receivePartId);
            batch.update(itemRef, { quantity: item.quantity + Number(receiveQuantity), costPrice: Number(receiveCost) });
            
            await batch.commit();

            showNotification(`ຮັບສິນຄ້າ ${item.partName} ຈຳນວນ ${receiveQuantity} ອັນ ສຳເລັດແລ້ວ`, 'success');
            // Reset form
            setReceivePartId('');
            setReceiveQuantity(1);
            setReceiveCost(0);
            setReceiveSupplier('');
            setReceiveDate(new Date().toISOString().split('T')[0]);
            setReceiveNote('');

        } catch (error) {
            console.error("Error receiving item: ", error);
            showNotification('ເກີດຂໍ້ຜິດພາດໃນການຮັບສິນຄ້າ', 'error');
        }
    };

    const handleEditItem = (item: InventoryItem) => {
        setEditingId(item.id);
        setEditQuantity(item.quantity);
        setEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (editingId && firestore) {
            try {
                const itemRef = doc(firestore, 'inventory', editingId);
                await updateDoc(itemRef, { quantity: Number(editQuantity) });
                showNotification('ອັບເດດຈຳນວນສະຕັອກສຳເລັດແລ້ວ', 'success');
                setEditModalOpen(false);
                setEditingId(null);
            } catch (error) {
                console.error("Error updating stock: ", error);
                showNotification('ເກີດຂໍ້ຜິດພາດໃນການອັບເດດສະຕັອກ', 'error');
            }
        }
    };

    const handleDeleteItem = (id: string) => {
        const confirmDelete = window.confirm('ທ່ານແນ່ໃຈບໍ່ວ່າຈະລົບສິ້ນສ່ວນນີ້? ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກໄດ້');
        if (confirmDelete && firestore) {
            deleteDoc(doc(firestore, 'inventory', id))
            .then(() => {
                showNotification('ລົບສິ້ນສ່ວນສຳເລັດແລ້ວ', 'success');
            })
            .catch((error) => {
                console.error("Error deleting item: ", error);
                showNotification('ເກີດຂໍ້ຜິດພາດໃນການລົບສິ້ນສ່ວນ', 'error');
            });
        }
    };
    
    const getStockStatus = (item: InventoryItem) => {
        if (item.quantity === 0) return 'ໝົດສະຕັອກ';
        // Reorder point logic removed
        return 'ປົກກະຕິ';
    };

    const getStatusClass = (item: InventoryItem) => {
        const status = getStockStatus(item);
        const statusClass: {[key: string]: string} = {
            'ປົກກະຕິ': 'bg-green-100 text-green-800',
            'ສະຕັອກຕ່ຳ': 'bg-yellow-100 text-yellow-800',
            'ໝົດສະຕັອກ': 'bg-red-100 text-red-800'
        };
        return statusClass[status];
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
                    <div className="bg-yellow-100 px-4 py-2 rounded-lg">
                        <span className="text-yellow-800 font-semibold">ຍອດຂາຍມື້ນີ້: ₭<span id="todayTotal">{todayTotal.toLocaleString('lo-LA')}</span></span>
                    </div>
                    <div className="bg-blue-100 px-4 py-2 rounded-lg">
                        <span className="text-blue-800 font-semibold">ຜູ້ໃຊ້: <span id="currentUser">{user?.displayName || user?.email || 'Admin'}</span></span>
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
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                    ຈັດການສິນຄ້າ
                </Link>
                <button onClick={() => switchTab('receive')} className={`${currentTab === 'receive' ? 'tab-active' : 'tab-inactive'} px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center whitespace-nowrap`}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    ຮັບສິນຄ້າເຂົ້າ
                </button>
                <button onClick={() => switchTab('reports')} className={`${currentTab === 'reports' ? 'tab-active' : 'tab-inactive'} px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center whitespace-nowrap`}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    ລາຍງານ
                </button>
            </nav>
        </div>
    </div>

    {/* Tab Content */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Receive Tab */}
        <div id="content-receive" className={currentTab === 'receive' ? 'tab-content' : 'tab-content hidden'}>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">ຮັບສິນຄ້າເຂົ້າຄັງ</h2>
                <form onSubmit={handleReceiveSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ເລືອກສິ້ນສ່ວນ</label>
                        <select value={receivePartId} onChange={e => setReceivePartId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            <option value="">ເລືອກສິ້ນສ່ວນ</option>
                            {inventory.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.partCode} - {item.partName} (ຄົງເຫຼືອ: {item.quantity})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ຈຳນວນທີ່ຮັບເຂົ້າ</label>
                        <input type="number" value={receiveQuantity} onChange={e => setReceiveQuantity(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" min="1" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ລາຄາຕົ້ນทุน/ອັນ</label>
                        <input type="number" value={receiveCost} onChange={e => setReceiveCost(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0.00" step="0.01" min="0" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ຜູ້ສະໜອງ</label>
                        <input type="text" value={receiveSupplier} onChange={e => setReceiveSupplier(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="ຊື່ຮ້ານຄ້າ/ຜູ້ສະໜອງ" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ວັນທີຮັບ</label>
                        <input type="date" value={receiveDate} onChange={e => setReceiveDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ໝາຍເຫດ</label>
                        <input type="text" value={receiveNote} onChange={e => setReceiveNote(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="ໝາຍເຫດເພີ່ມເຕີມ"/>
                    </div>
                    <div className="md:col-span-2">
                        <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            ບັນທຶກການຮັບສິນຄ້າ
                        </button>
                    </div>
                </form>
            </div>

            {/* Receive History */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">ປະຫວັດການຮັບສິນຄ້າ</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ວັນທີ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ລະຫັດສິ້ນສ່ວນ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ຊື່ສິ້ນສ່ວນ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ຈຳນວນ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ຕົ້ນทุน/ອັນ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ຜູ້ສະໜອງ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ໝາຍເຫດ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {[...receiveHistory].reverse().slice(0, 20).map(record => (
                                <tr key={record.id} className="hover:bg-gray-50 fade-in">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(record.date).toLocaleDateString('lo-LA')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.partCode}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.partName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{record.quantity.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₭{record.cost.toLocaleString('lo-LA')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.supplier}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.note || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Reports Tab */}
        <div id="content-reports" className={currentTab === 'reports' ? 'tab-content' : 'tab-content hidden'}>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center">
                        <div className="bg-green-100 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">ຍອດຂາຍມື້ນີ້</p>
                            <p className="text-2xl font-bold text-gray-900">{`₭${todayTotal.toLocaleString('lo-LA')}`}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center">
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">ລາຍການທັງໝົດ</p>
                            <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center">
                        <div className="bg-yellow-100 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">ມູນຄ່າສະຕັອກ</p>
                            <p className="text-2xl font-bold text-gray-900">{`₭${stockValue.toLocaleString('lo-LA')}`}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Best Selling Items */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">🏆 ສິ້ນສ່ວນຂາຍດີ (7 ມື້ທີ່ຜ່ານມາ)</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ອັນດັບ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ລະຫັດ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ຊື່ສິ້ນສ່ວນ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ຈຳນວນຂາຍ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ຍອດຂາຍ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bestSelling.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">ບໍ່ມີຂໍ້ມູນການຂາຍໃນ 7 ມື້ທີ່ຜ່ານມາ</td></tr>
                            ) : (
                                bestSelling.map((item, index) => (
                                    <tr key={item.partCode} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.partCode}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.partName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{item.quantity}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₭{item.amount.toLocaleString('lo-LA')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>


    {/* Edit Modal */}
    {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 slide-up">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">ແກ້ໄຂຈຳນວນສະຕັອກ</h3>
                </div>
                <div className="p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">ຈຳນວນໃໝ່</label>
                        <input type="number" value={editQuantity} onChange={(e) => setEditQuantity(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" min="0"/>
                    </div>
                    <div className="flex space-x-3">
                        <button onClick={handleSaveEdit} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200">ບັນທຶກ</button>
                        <button onClick={() => setEditModalOpen(false)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-semibold transition-colors duration-200">ຍົກເລີກ</button>
                    </div>
                </div>
            </div>
        </div>
    )}
  </div>
  );
}
