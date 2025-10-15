
'use client';

import { useEffect, useState } from 'react';
import { listenToStockItems } from '@/services/stockService';
import { listenToDebtors } from '@/services/debtorService';
import Link from 'next/link';
import { HardHat, ShoppingCart, FileText, Users, DollarSign, Package } from 'lucide-react';
import type { StockItem, Debtor } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export default function Home() {
    const [totalStock, setTotalStock] = useState(0);
    const [totalStockItems, setTotalStockItems] = useState(0);
    const [totalDebt, setTotalDebt] = useState(0);
    const [totalDebtors, setTotalDebtors] = useState(0);
    
    useEffect(() => {
        const unsubscribeStock = listenToStockItems((items: StockItem[]) => {
            const total = items.reduce((sum, item) => sum + item.quantity, 0);
            setTotalStock(total);
            setTotalStockItems(items.length);
        });

        const unsubscribeDebtors = listenToDebtors((debtors: Debtor[]) => {
            const total = debtors.reduce((sum, debtor) => sum + debtor.totalAmount, 0);
            setTotalDebt(total);
            setTotalDebtors(debtors.length);
        });

        return () => {
            unsubscribeStock();
            unsubscribeDebtors();
        };
    }, []);

    const menuItems = [
      {
        href: '/stock',
        icon: <HardHat className="w-8 h-8 text-blue-500" />,
        title: 'ຈັດການສິນຄ້າ',
        description: 'ເພີ່ມ, ລົບ, ແກ້ໄຂ ແລະ ເບິ່ງສະຕັອກສິນຄ້າ'
      },
      {
        href: '/invoice',
        icon: <ShoppingCart className="w-8 h-8 text-green-500" />,
        title: 'ອອກບິນຂາຍສິນຄ້າ',
        description: 'ສ້າງໃບເກັບເງິນ ແລະ ບັນທຶກການຂາຍ'
      },
      {
        href: '/debtors',
        icon: <Users className="w-8 h-8 text-red-500" />,
        title: 'ລາຍການລູກໜີ້',
        description: 'ຕິດຕາມລາຍການບິນທີ່ຍັງບໍ່ທັນຊຳລະ'
      },
      {
        href: '/sales',
        icon: <FileText className="w-8 h-8 text-purple-500" />,
        title: 'ລາຍງານການຂາຍ',
        description: 'ເບິ່ງສະຫຼຸບຍອດຂາຍ ແລະ ປະຫວັດການຂາຍ'
      }
    ];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(value);
    };

    return (
    <div className="bg-gradient-to-br from-gray-50 to-slate-200 min-h-screen">
    {/* Header */}
    <header className="bg-white shadow-md border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
                <div className="flex items-center">
                    <div className="bg-blue-600 p-3 rounded-full mr-4 shadow-lg">
                         <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">POS ລະບົບຂາຍສິ້ນສ່ວນ</h1>
                        <p className="text-gray-500">ລະບົບຈຸດຂາຍສຳລັບຮ້ານຂາຍສິ້ນສ່ວນລົດຍົນ</p>
                    </div>
                </div>
            </div>
        </div>
    </header>

    {/* Main Content */}
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-medium text-gray-600">ຈຳນວນສິນຄ້າທັງໝົດ</CardTitle>
                    <Package className="w-5 h-5 text-blue-500"/>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{totalStock.toLocaleString()} ອັນ</div>
                    <p className="text-xs text-muted-foreground">ຈາກ {totalStockItems.toLocaleString()} ລາຍການ</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-medium text-gray-600">ຍອດໜີ້ລວມທັງໝົດ</CardTitle>
                    <DollarSign className="w-5 h-5 text-red-500"/>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(totalDebt)}</div>
                     <p className="text-xs text-muted-foreground">ຈາກ {totalDebtors.toLocaleString()} ບິນທີ່ຍັງຄ້າງຊຳລະ</p>
                </CardContent>
            </Card>
        </div>
        
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {menuItems.map((item) => (
              <Link href={item.href} key={item.href} className="block group">
                <Card className="h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out">
                  <CardHeader>
                    <div className="bg-gray-100 rounded-lg p-3 w-max mb-4 group-hover:bg-blue-100 transition-colors">
                      {item.icon}
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{item.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
        </div>
    </main>
  </div>
  );
}
