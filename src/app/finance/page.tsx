
'use client';

import { useState, useEffect } from 'react';
import { listenToSales } from '@/services/salesService';
import { listenToPurchases } from '@/services/purchaseService';
import { listenToDebtors } from '@/services/debtorService';
import type { Sale, Purchase, Debtor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/stat-card';
import Link from 'next/link';
import { ArrowLeft, Landmark, TrendingUp, TrendingDown, Users, DollarSign, FileText } from 'lucide-react';

export default function FinancePage() {
  const [totalSales, setTotalSales] = useState(0);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);

  useEffect(() => {
    const unsubscribeSales = listenToSales(salesData => {
      const total = salesData.reduce((sum, sale) => sum + sale.totalAmount, 0);
      setTotalSales(total);
    });
    const unsubscribePurchases = listenToPurchases(purchasesData => {
      const total = purchasesData.reduce((sum, p) => sum + p.totalAmount, 0);
      setTotalPurchases(total);
    });
    const unsubscribeDebtors = listenToDebtors(debtorsData => {
      const total = debtorsData.reduce((sum, debtor) => sum + debtor.totalAmount, 0);
      setTotalDebt(total);
    });

    return () => {
      unsubscribeSales();
      unsubscribePurchases();
      unsubscribeDebtors();
    };
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(value);
  };
  
  const reportCards = [
    {
        href: '/sales',
        icon: <TrendingUp className="w-8 h-8 text-emerald-500" />,
        title: 'ລາຍງານລາຍຮັບ',
        description: 'ເບິ່ງສະຫຼຸບຍອດຂາຍ ແລະ ປະຫວັດການຂາຍ'
    },
    {
        href: '/purchases',
        icon: <TrendingDown className="w-8 h-8 text-rose-500" />,
        title: 'ລາຍງານລາຍຈ່າຍ',
        description: 'ເບິ່ງປະຫວັດການຊື້ສິນຄ້າເຂົ້າຮ້ານ'
    },
    {
        href: '/debtors',
        icon: <Users className="w-8 h-8 text-red-500" />,
        title: 'ລາຍການລູກໜີ້',
        description: 'ເບິ່ງລາຍການບິນທີ່ຍັງບໍ່ທັນຊຳລະເງິນ'
    },
  ];

  return (
    <>
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-purple-50 to-violet-100">
      <header className="bg-white shadow-md sticky top-0 z-30 flex h-20 items-center gap-4 border-b px-4 sm:px-6">
        <Button variant="outline" size="icon" className="h-10 w-10" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">ກັບໄປໜ້າຫຼັກ</span>
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="bg-purple-500 p-3 rounded-lg">
            <Landmark className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ລະບົບບັນຊີການເງິນ</h1>
            <p className="text-sm text-muted-foreground">ລາຍງານພາບລວມທາງດ້ານການເງິນ</p>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-8 md:gap-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="ຍອດຂາຍລວມທັງໝົດ"
            value={formatCurrency(totalSales)}
            icon={<DollarSign className="h-5 w-5 text-green-500" />}
            description="ລວມຍອດຂາຍທີ່ຊຳລະເງິນແລ້ວທັງໝົດ"
          />
          <StatCard
            title="ຍອດຊື້ລວມທັງໝົດ"
            value={formatCurrency(totalPurchases)}
            icon={<DollarSign className="h-5 w-5 text-red-500" />}
            description="ລວມຍອດການຊື້ສິນຄ້າເຂົ້າຮ້ານທັງໝົດ"
          />
           <StatCard
            title="ຍອດໜີ້ຄ້າງຊຳລະ"
            value={formatCurrency(totalDebt)}
            icon={<DollarSign className="h-5 w-5 text-orange-500" />}
             description="ລວມຍອດໜີ້ຈາກບິນທີ່ຍັງບໍ່ທັນຊຳລະ"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
            {reportCards.map((item) => (
              <Link href={item.href} key={item.href} className="block group">
                <Card className="h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            {item.icon}
                            <div>
                                <CardTitle>{item.title}</CardTitle>
                                <CardDescription>{item.description}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full">
                           ເປີດລາຍງານ
                        </Button>
                    </CardContent>
                </Card>
              </Link>
            ))}
        </div>
      </main>
    </div>
    </>
  );
}
