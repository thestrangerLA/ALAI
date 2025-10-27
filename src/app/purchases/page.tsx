
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/stat-card';
import Link from 'next/link';
import { ArrowLeft, Truck, DollarSign, Calendar } from 'lucide-react';

export default function PurchasesPage() {
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState(0);

  // This will be expanded later when we have purchase data
  useEffect(() => {
    // Placeholder for fetching purchase data
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(value);
  };
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-orange-50 to-yellow-100">
      <header className="bg-white shadow-md sticky top-0 z-30 flex h-20 items-center gap-4 border-b px-4 sm:px-6">
        <Button variant="outline" size="icon" className="h-10 w-10" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">ກັບໄປໜ້າຫຼັກ</span>
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-3 rounded-lg">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ປະຫວັດການຊື້ສິນຄ້າເຂົ້າ</h1>
            <p className="text-sm text-muted-foreground">ບັນທຶກ ແລະ ເບິ່ງປະຫວັດການຊື້ສິນຄ້າເຂົ້າຮ້ານ</p>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-8 md:gap-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="ຍອດຊື້ລວມທັງໝົດ"
                value={formatCurrency(totalPurchaseAmount)}
                icon={<DollarSign className="h-5 w-5 text-green-500" />}
                description="ຍັງບໍ່ທັນມີຂໍ້ມູນ"
            />
            <StatCard
                title="ຍອດຊື້ເດືອນນີ້"
                value={formatCurrency(0)}
                icon={<Calendar className="h-5 w-5 text-orange-500" />}
                description="ຍັງບໍ່ທັນມີຂໍ້ມູນ"
            />
        </div>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <CardTitle>ລາຍການຊື້ສິນຄ້າເຂົ້າ</CardTitle>
                    <CardDescription>
                      ປະຫວັດການສັ່ງຊື້ສິນຄ້າທັງໝົດ.
                    </CardDescription>
                </div>
                {/* Add filters here in the future */}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 text-center content-center text-gray-500">
                <p>-- ຍັງບໍ່ມີຂໍ້ມູນການຊື້ສິນຄ້າ --</p>
                <p className="text-sm mt-2">ຄຸນສົມບັດນີ້ກຳລັງຢູ່ໃນການພັດທະນາ.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

