
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/stat-card';
import Link from 'next/link';
import { ArrowLeft, Truck, DollarSign, Calendar, PlusCircle } from 'lucide-react';
import { listenToPurchases, addPurchase } from '@/services/purchaseService';
import { listenToStockItems } from '@/services/stockService';
import type { Purchase, StockItem } from '@/lib/types';
import { PurchaseFormDialog } from '@/components/purchase-form-dialog';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isDialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const unsubscribePurchases = listenToPurchases(setPurchases);
    const unsubscribeStock = listenToStockItems(setStockItems);
    return () => {
      unsubscribePurchases();
      unsubscribeStock();
    };
  }, []);

  const totalPurchaseAmount = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  
  const handleSavePurchase = async (purchaseData: Omit<Purchase, 'id'>) => {
    const result = await addPurchase(purchaseData);
    if (result.success) {
      alert('ບັນທຶກການຊື້ສຳເລັດ!');
      setDialogOpen(false);
    } else {
      alert(`ເກີດຂໍ້ຜິດພາດ: ${result.message}`);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(value);
  };
  
  return (
    <>
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
                  description={purchases.length > 0 ? `ຈາກ ${purchases.length} ລາຍການ` : "ຍັງບໍ່ທັນມີຂໍ້ມູນ"}
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
                  <Button onClick={() => setDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> ບັນທຶກການຊື້ໃໝ່
                  </Button>
              </div>
            </CardHeader>
            <CardContent>
              {purchases.length > 0 ? (
                <div className="space-y-2">
                  {/* Later, we will display purchase history here */}
                   <div className="h-48 text-center content-center text-gray-500">
                      <p>-- ປະຫວັດການຊື້ຈະສະແດງຢູ່ບ່ອນນີ້ --</p>
                  </div>
                </div>
              ) : (
                <div className="h-48 text-center content-center text-gray-500">
                    <p>-- ຍັງບໍ່ມີຂໍ້ມູນການຊື້ສິນຄ້າ --</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
      <PurchaseFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSavePurchase}
        stockItems={stockItems}
      />
    </>
  );
}
