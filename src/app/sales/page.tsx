
'use client';

import { useState, useEffect } from 'react';
import { listenToSales } from '@/services/salesService';
import type { Sale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/stat-card';
import Link from 'next/link';
import { ArrowLeft, Calendar, DollarSign, FileText, ShoppingCart, BookUser, History } from 'lucide-react';

export default function SalesReportPage() {
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [salesToday, setSalesToday] = useState(0);
  const [ordersTodayCount, setOrdersTodayCount] = useState(0);
  const [salesThisMonth, setSalesThisMonth] = useState(0);
  const [salesThisYear, setSalesThisYear] = useState(0);

  useEffect(() => {
    const unsubscribe = listenToSales(salesData => {
      setAllSales(salesData);
      calculateStats(salesData);
    });
    return () => unsubscribe();
  }, []);

  const calculateStats = (salesData: Sale[]) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    let todayRevenue = 0;
    let todayOrders = 0;
    let monthRevenue = 0;
    let yearRevenue = 0;
    
    salesData.forEach(sale => {
      const saleDate = sale.saleDate.toDate();
      if (saleDate >= startOfToday) {
          todayRevenue += sale.totalAmount;
          todayOrders++;
      }
      if (saleDate >= startOfMonth) {
        monthRevenue += sale.totalAmount;
      }
      if (saleDate >= startOfYear) {
        yearRevenue += sale.totalAmount;
      }
    });

    setSalesToday(todayRevenue);
    setOrdersTodayCount(todayOrders);
    setSalesThisMonth(monthRevenue);
    setSalesThisYear(yearRevenue);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(value);
  };

  return (
    <>
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-md sticky top-0 z-30 flex h-20 items-center gap-4 border-b px-4 sm:px-6">
        <Button variant="outline" size="icon" className="h-10 w-10" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">ກັບໄປໜ້າຫຼັກ</span>
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="bg-green-500 p-3 rounded-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ລາຍງານການຂາຍ</h1>
            <p className="text-sm text-muted-foreground">ສະຫຼຸບແລະປະຫວັດການຂາຍທັງໝົດ</p>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-8 md:gap-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="ຍອດຂາຍມື້ນີ້"
            value={formatCurrency(salesToday)}
            icon={<DollarSign className="h-5 w-5 text-green-500" />}
          />
           <StatCard
            title="ຈຳນວນບິນມື້ນີ້"
            value={`${ordersTodayCount.toLocaleString('lo-LA')} ບິນ`}
            icon={<ShoppingCart className="h-5 w-5 text-indigo-500" />}
          />
          <StatCard
            title={'ຍອດຂາຍເດືອນນີ້'}
            value={formatCurrency(salesThisMonth)}
            icon={<Calendar className="h-5 w-5 text-orange-500" />}
          />
          <StatCard
            title={'ຍອດຂາຍປີນີ້'}
            value={formatCurrency(salesThisYear)}
            icon={<Calendar className="h-5 w-5 text-blue-500" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link href="#" className="block group">
              <Card className="h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <BookUser className="w-8 h-8 text-teal-500"/>
                        <div>
                            <CardTitle>ລາຍງານຕາມລູກຄ້າ</CardTitle>
                            <CardDescription>ເບິ່ງປະຫວັດການຊື້ຂອງລູກຄ້າແຕ່ລະຄົນ</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500">ຄຸນສົມບັດນີ້ກຳລັງຢູ່ໃນການພັດທະນາ...</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/sales/history" className="block group">
                 <Card className="h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <History className="w-8 h-8 text-indigo-500"/>
                            <div>
                                <CardTitle>ປະຫວັດການຂາຍ ທັງໝົດ</CardTitle>
                                <CardDescription>ເບິ່ງລາຍການຂາຍທັງໝົດ, ກັ່ນຕອງຕາມວັນທີ, ແລະ ເບິ່ງລາຍລະອຽດບິນ</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <Button variant="outline" className="w-full">
                           ເປີດປະຫວັດການຂາຍ
                       </Button>
                    </CardContent>
                </Card>
            </Link>
        </div>
      </main>
    </div>
    </>
  );
}
