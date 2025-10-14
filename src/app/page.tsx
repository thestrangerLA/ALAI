

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
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [currentTab, setCurrentTab] = useState('pos');
    const [receiptNumber, setReceiptNumber] = useState(1);

    const [posSearch, setPosSearch] = useState('');
    const [discountPercent, setDiscountPercent] = useState(0);
    const [taxPercent, setTaxPercent] = useState(0);
    const [paymentReceived, setPaymentReceived] = useState(0);
    const [paymentCustomerName, setPaymentCustomerName] = useState('');
    
    const [editQuantity, setEditQuantity] = useState(0);

    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [isReceiptModalOpen, setReceiptModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [receiptToShow, setReceiptToShow] = useState<SaleRecord | null>(null);

    const [addItemPartCode, setAddItemPartCode] = useState('');
    const [addItemPartName, setAddItemPartName] = useState('');
    const [addItemQuantity, setAddItemQuantity] = useState(0);
    const [addItemPrice, setAddItemPrice] = useState(0);

    const [receivePartId, setReceivePartId] = useState('');
    const [receiveQuantity, setReceiveQuantity] = useState(1);
    const [receiveCost, setReceiveCost] = useState(0);
    const [receiveSupplier, setReceiveSupplier] = useState('');
    const [receiveDate, setReceiveDate] = useState(new Date().toISOString().split('T')[0]);
    const [receiveNote, setReceiveNote] = useState('');

    const [invSearch, setInvSearch] = useState('');
    const [invStatus, setInvStatus] = useState('');
    
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

    const filteredPOSProducts = inventory.filter(item => {
        const searchTerm = posSearch.toLowerCase();
        const matchesSearch = item.partCode.toLowerCase().includes(searchTerm) ||
                            item.partName.toLowerCase().includes(searchTerm);
        const hasStock = item.quantity > 0;
        return matchesSearch && hasStock;
    });
    
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartDiscountAmount = cartSubtotal * (discountPercent / 100);
    const cartAfterDiscount = cartSubtotal - cartDiscountAmount;
    const cartTaxAmount = cartAfterDiscount * (taxPercent / 100);
    const cartGrandTotal = cartAfterDiscount + cartTaxAmount;

    const paymentChange = paymentReceived - cartGrandTotal;

    const filteredInventory = inventory.filter(item => {
        const searchTerm = invSearch.toLowerCase();
        const matchesSearch = item.partCode.toLowerCase().includes(searchTerm) || 
                            item.partName.toLowerCase().includes(searchTerm);
        
        const getStatusKey = (item: InventoryItem) => {
            if (item.quantity === 0) return 'out';
            // Assuming reorderPoint logic is removed or adapted
            // if (item.reorderPoint && item.quantity <= item.reorderPoint) return 'low';
            return 'normal';
        }
        const matchesStatus = !invStatus || getStatusKey(item) === invStatus;

        return matchesSearch && matchesStatus;
    });

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

    const addToCart = (itemId: string) => {
        const item = inventory.find(i => i.id === itemId);
        if (!item || item.quantity <= 0) {
            showNotification('ສິນຄ້າໝົດສະຕັອກ', 'error');
            return;
        }

        const existingCartItem = cart.find(c => c.id === itemId);
        if (existingCartItem) {
            if (existingCartItem.quantity >= item.quantity) {
                showNotification('ຈຳນວນໃນກະຕ່າເກີນສະຕັອກທີ່ມີ', 'error');
                return;
            }
            setCart(cart.map(c => c.id === itemId ? { ...c, quantity: c.quantity + 1 } : c));
        } else {
            setCart([...cart, {
                id: itemId,
                partCode: item.partCode,
                partName: item.partName,
                price: item.price,
                quantity: 1,
                maxQuantity: item.quantity
            }]);
        }
    };

    const updateCartQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(itemId);
            return;
        }

        const cartItem = cart.find(c => c.id === itemId);
        if (cartItem && newQuantity <= cartItem.maxQuantity) {
            setCart(cart.map(c => c.id === itemId ? { ...c, quantity: newQuantity } : c));
        } else {
            showNotification('ຈຳນວນເກີນສະຕັອກທີ່ມີ', 'error');
        }
    };
    
    const removeFromCart = (itemId: string) => {
        setCart(cart.filter(c => c.id !== itemId));
    };

    const clearCart = () => {
        setCart([]);
    };
    
    const processPayment = () => {
        if (cart.length === 0) return;
        setPaymentReceived(0);
        setPaymentCustomerName('');
        setPaymentModalOpen(true);
    };
    
    const completeSale = async () => {
        if (!firestore) return;
        if (paymentReceived < cartGrandTotal) {
            showNotification('ຈຳນວນເງິນທີ່ຮັບບໍ່ພຽງພໍ', 'error');
            return;
        }

        const saleRecord: Omit<SaleRecord, 'id'> = {
            receiptNumber: receiptNumber,
            items: cart,
            subtotal: cartSubtotal,
            discountPercent: discountPercent,
            discountAmount: cartDiscountAmount,
            taxPercent: taxPercent,
            taxAmount: cartTaxAmount,
            grandTotal: cartGrandTotal,
            received: paymentReceived,
            change: paymentChange,
            customerName: paymentCustomerName || 'ລູກຄ້າທົ່ວໄປ',
            cashier: user?.displayName || user?.email || 'ผู้ดູແລລະບົບ',
            date: new Date().toISOString().split('T')[0],
            timestamp: serverTimestamp()
        };
        
        try {
            const batch = writeBatch(firestore);
            
            // Add sale record
            const salesRef = collection(firestore, 'salesHistory');
            batch.set(doc(salesRef), saleRecord);

            // Update inventory stock
            cart.forEach(cartItem => {
                const invItemRef = doc(firestore, 'inventory', cartItem.id);
                const inventoryItem = inventory.find(i => i.id === cartItem.id);
                if (inventoryItem) {
                    batch.update(invItemRef, { quantity: inventoryItem.quantity - cartItem.quantity });
                }
            });

            await batch.commit();

            setReceiptToShow({ ...saleRecord, id: 'temp-id', timestamp: new Date() });
            setReceiptModalOpen(true);

            clearCart();
            setPaymentModalOpen(false);
            setReceiptNumber(receiptNumber + 1);
            showNotification('ຂາຍສຳເລັດແລ້ວ', 'success');

        } catch (error) {
            console.error("Error completing sale: ", error);
            showNotification('ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກການຂາຍ', 'error');
        }
    };

    const handleAddItemSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore) return;

        if (inventory.some(item => item.partCode === addItemPartCode)) {
            showNotification('ລະຫັດສິ້ນສ່ວນນີ້ມີຢູ່ແລ້ວໃນລະບົບ', 'error');
            return;
        }

        const newItem = {
            partCode: addItemPartCode.toUpperCase(),
            partName: addItemPartName,
            quantity: Number(addItemQuantity),
            price: Number(addItemPrice),
            createdAt: serverTimestamp()
        };

        try {
            await addDoc(collection(firestore, 'inventory'), newItem);
            showNotification('ເພີ່ມສິ້ນສ່ວນສຳເລັດແລ້ວ', 'success');
            // Reset form
            setAddItemPartCode('');
            setAddItemPartName('');
            setAddItemQuantity(0);
            setAddItemPrice(0);
        } catch (error) {
            console.error("Error adding item: ", error);
            showNotification('ເກີດຂໍ້ຜິດພາດໃນການເພີ່ມສິ້ນສ່ວນ', 'error');
        }
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
            batch.update(itemRef, { quantity: item.quantity + Number(receiveQuantity) });
            
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
    
    const viewItemDetails = (partCode: string) => {
        router.push(`/stock?search=${encodeURIComponent(partCode)}`);
    }
    
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

    const printReceipt = () => {
        window.print();
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
                <button onClick={() => switchTab('pos')} className={`${currentTab === 'pos' ? 'tab-active' : 'tab-inactive'} px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center whitespace-nowrap`}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8m-8 0a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z"></path>
                    </svg>
                    ໜ້າຈໍຂາຍ (POS)
                </button>
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
        
        {/* POS Tab */}
        <div id="content-pos" className={currentTab === 'pos' ? 'tab-content' : 'tab-content hidden'}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side - Product Search & Selection */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Search Bar */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex space-x-4">
                            <div className="flex-1">
                                <input type="text" value={posSearch} onChange={(e) => setPosSearch(e.target.value)} className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="ຄົ້ນຫາດ້ວຍລະຫັດ, ຊື່..."/>
                            </div>
                            <button onClick={() => setPosSearch('')} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200">
                                ລ້າງ
                            </button>
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">ລາຍການສິນຄ້າ</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredPOSProducts.length > 0 ? filteredPOSProducts.map(item => (
                                <div key={item.id} className="pos-item bg-white border border-gray-200 rounded-lg p-4 flex flex-col justify-between hover:shadow-lg transition-shadow">
                                    <div className="cursor-pointer" onClick={() => addToCart(item.id)}>
                                        <div className="text-sm font-medium text-gray-900 mb-1">{item.partCode}</div>
                                        <div className="text-sm text-gray-600 mb-2 h-10">{item.partName}</div>
                                        <div className="flex justify-between items-center">
                                            <div className="text-lg font-bold text-blue-600">₭{item.price.toLocaleString('lo-LA')}</div>
                                            <div className="text-xs text-gray-500">ຄົງເຫຼືອ: {item.quantity}</div>
                                        </div>
                                    </div>
                                    <div className="border-t mt-3 pt-3">
                                        <button onClick={() => viewItemDetails(item.partCode)} className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-semibold py-1 rounded-md hover:bg-blue-50 transition-colors">ເບິ່ງລາຍລະອຽດ</button>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full text-center py-8 text-gray-500">ບໍ່ພົບສິນຄ້າທີ່ຄົ້ນຫາ</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side - Shopping Cart */}
                <div className="space-y-6">
                    {/* Cart */}
                    <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8m-8 0a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z"></path>
                            </svg>
                            ກະຕ່າສິນຄ້າ ({cartCount})
                        </h3>
                        
                        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                           {cart.length > 0 ? cart.map(item => (
                                <div key={item.id} className="cart-item bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{item.partCode}</div>
                                        <div className="text-xs text-gray-600">{item.partName}</div>
                                        <div className="text-sm font-bold text-blue-600">₭{item.price.toLocaleString('lo-LA')}</div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded text-xs">-</button>
                                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                                        <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="bg-green-500 hover:bg-green-600 text-white w-6 h-6 rounded text-xs" disabled={item.quantity >= item.maxQuantity}>+</button>
                                        <button onClick={() => removeFromCart(item.id)} className="bg-gray-500 hover:bg-gray-600 text-white w-6 h-6 rounded text-xs ml-2">×</button>
                                    </div>
                                </div>
                           )) : (
                                <div className="text-center text-gray-500 py-4">ກະຕ່າວ່າງ</div>
                           )}
                        </div>

                        {/* Cart Summary */}
                        <div className="border-t pt-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span>ຍອດລວມ:</span>
                                <span id="subtotal">₭{cartSubtotal.toLocaleString('lo-LA')}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">ສ່ວນຫຼຸດ (%):</span>
                                <input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(parseFloat(e.target.value))} className="w-20 px-2 py-1 text-sm border border-gray-300 rounded" min="0" max="100" />
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>ສ່ວນຫຼຸດ:</span>
                                <span id="discountAmount">₭{cartDiscountAmount.toLocaleString('lo-LA')}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">ອາກອນ (%):</span>
                                <input type="number" value={taxPercent} onChange={(e) => setTaxPercent(parseFloat(e.target.value))} className="w-20 px-2 py-1 text-sm border border-gray-300 rounded" min="0" max="100"/>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>ອາກອນ:</span>
                                <span id="taxAmount">₭{cartTaxAmount.toLocaleString('lo-LA')}</span>
                            </div>
                            <div className="border-t pt-2">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>ຍອດຊຳລະ:</span>
                                    <span id="grandTotal">₭{cartGrandTotal.toLocaleString('lo-LA')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3 mt-6">
                            <button onClick={clearCart} className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors duration-200">
                                ລ້າງກະຕ່າ
                            </button>
                            <button onClick={processPayment} className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors duration-200 disabled:bg-gray-300" disabled={cart.length === 0}>
                                ຊຳລະເງິນ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Inventory Tab */}
        <div id="content-inventory" className={currentTab === 'inventory' ? 'tab-content' : 'tab-content hidden'}>
           {/* This content is now in /stock page */}
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                 <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">ສ່ວນຈັດການສິນຄ້າຖືກຍ້າຍໄປທີ່ໜ້າໃໝ່</h3>
                <p className="mt-2 text-gray-500">ກະລຸນາໃຊ້ເມນູ "ຈັດການສິນຄ້າ" ເພື່ອເຂົ້າເຖິງສະຕັອກສິນຄ້າ</p>
                <div className="mt-6">
                    <Link href="/stock" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        ໄປທີ່ໜ້າຈັດການສິນຄ້າ
                    </Link>
                </div>
            </div>
        </div>

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

    {/* Payment Modal */}
    {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 slide-up">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">ຊຳລະເງິນ</h3>
                </div>
                <div className="p-6">
                    <div className="mb-4">
                        <div className="text-center mb-4">
                            <p className="text-2xl font-bold text-gray-900">ຍອດຊຳລະ: <span>₭{cartGrandTotal.toLocaleString('lo-LA')}</span></p>
                        </div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ຈຳນວນເງິນທີ່ຮັບ</label>
                        <input type="number" value={paymentReceived} onChange={e => setPaymentReceived(parseFloat(e.target.value))} className="w-full px-4 py-2 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" step="0.01" min="0"/>
                    </div>
                    <div className="mb-4">
                        <div className="flex justify-between text-lg">
                            <span>ເງິນທອນ:</span>
                            <span className="font-bold">₭{Math.max(0, paymentChange).toLocaleString('lo-LA')}</span>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">ຊື່ລູກຄ້າ (ບໍ່ບັງຄັບ)</label>
                        <input type="text" value={paymentCustomerName} onChange={e => setPaymentCustomerName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="ຊື່ລູກຄ້າ"/>
                    </div>
                    <div className="flex space-x-3">
                        <button onClick={completeSale} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200">ຢືນຢັນການຊຳລະ</button>
                        <button onClick={() => setPaymentModalOpen(false)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-semibold transition-colors duration-200">ຍົກເລີກ</button>
                    </div>
                </div>
            </div>
        </div>
    )}

    {/* Receipt Modal */}
    {isReceiptModalOpen && receiptToShow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 slide-up">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">ໃບຮັບເງິນ</h3>
                </div>
                <div className="p-6">
                    <div className="receipt-print">
                        <div className="text-center mb-4">
                            <h2 className="font-bold text-lg">ຮ້ານສິ້ນສ່ວນລົດຍົນ</h2>
                            <p className="text-sm">Auto Parts Shop</p>
                            <p className="text-sm">ໂທ: 02-xxx-xxxx</p>
                            <hr className="my-2"/>
                        </div>
                        <div className="mb-4">
                            <div className="flex justify-between text-sm">
                                <span>ໃບຮັບເງິນເລກທີ:</span>
                                <span>{String(receiptToShow.receiptNumber).padStart(6, '0')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>ວັນທີ:</span>
                                <span>{new Date().toLocaleDateString('lo-LA')} {new Date().toLocaleTimeString('lo-LA')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>ລູກຄ້າ:</span>
                                <span>{receiptToShow.customerName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>ພະນັກງານ:</span>
                                <span>{receiptToShow.cashier}</span>
                            </div>
                        </div>
                        <hr className="my-2"/>
                        <div className="mb-4">
                            {receiptToShow.items.map((item: any) => `
                                <div class="flex justify-between text-sm mb-1">
                                    <div class="flex-1">
                                        <div>${item.partCode}</div>
                                        <div class="text-xs text-gray-600">${item.partName}</div>
                                        <div class="text-xs">${item.quantity} x ₭${item.price.toLocaleString('lo-LA')}</div>
                                    </div>
                                    <div class="text-right">
                                        ₭${(item.quantity * item.price).toLocaleString('lo-LA')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <hr className="my-2"/>
                        <div className="mb-4">
                            <div className="flex justify-between text-sm">
                                <span>ຍອດລວມ:</span>
                                <span>₭{receiptToShow.subtotal.toLocaleString('lo-LA')}</span>
                            </div>
                            {receiptToShow.discountAmount > 0 ? `
                                <div class="flex justify-between text-sm">
                                    <span>ສ່ວນຫຼຸດ (${receiptToShow.discountPercent}%):</span>
                                    <span>-₭${receiptToShow.discountAmount.toLocaleString('lo-LA')}</span>
                                </div>
                            ` : ''}
                            {receiptToShow.taxAmount > 0 ? `
                                <div class="flex justify-between text-sm">
                                    <span>ອາກອນ (${receiptToShow.taxPercent}%):</span>
                                    <span>₭${receiptToShow.taxAmount.toLocaleString('lo-LA')}</span>
                                </div>
                            ` : ''}
                            <div className="flex justify-between font-bold">
                                <span>ຍອດຊຳລະ:</span>
                                <span>₭{receiptToShow.grandTotal.toLocaleString('lo-LA')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>ຮັບເງິນ:</span>
                                <span>₭{receiptToShow.received.toLocaleString('lo-LA')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>ເງິນທອນ:</span>
                                <span>₭{receiptToShow.change.toLocaleString('lo-LA')}</span>
                            </div>
                        </div>
                        <hr className="my-2"/>
                        <div className="text-center text-xs">
                            <p>ຂອບໃຈທີ່ໃຊ້ບໍລິການ</p>
                            <p>Thank you for your business</p>
                        </div>
                    </div>
                    <div className="flex space-x-3 mt-6">
                        <button onClick={printReceipt} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200">ພິມໃບຮັບເງິນ</button>
                        <button onClick={() => setReceiptModalOpen(false)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-semibold transition-colors duration-200">ປິດ</button>
                    </div>
                </div>
            </div>
        </div>
    )}

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
