
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/stat-card';
import Link from 'next/link';
import { ArrowLeft, Truck, DollarSign, Calendar, PlusCircle, Eye } from 'lucide-react';
import { listenToPurchases, addPurchase } from '@/services/purchaseService';
import { listenToStockItems } from '@/services/stockService';
import type { Purchase, StockItem } from '@/lib/types';
import { PurchaseFormDialog } from '@/components/purchase-form-dialog';
import { PurchaseDetailsDialog } from '@/components/purchase-details-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isFormDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

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
      setFormDialogOpen(false);
    } else {
      alert(`ເກີດຂໍ້ຜິດພາດ: ${result.message}`);
    }
  };
  
  const groupedPurchases = useMemo(() => {
    const groups: { [key: string]: Purchase[] } = {};
    purchases.forEach(purchase => {
      const dateString = purchase.purchaseDate.toDate().toLocaleDateString('en-CA'); // YYYY-MM-DD
      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      groups[dateString].push(purchase);
    });
    return Object.entries(groups).sort(([dateA], [dateB]) => dateB.localeCompare(dateA));
  }, [purchases]);

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
                  <Button onClick={() => setFormDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> ບັນທຶກການຊື້ໃໝ່
                  </Button>
              </div>
            </CardHeader>
            <CardContent>
              {groupedPurchases.length > 0 ? (
                <Accordion type="multiple" className="w-full">
                  {groupedPurchases.map(([date, dailyPurchases]) => {
                    const dailyTotal = dailyPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
                    return (
                      <AccordionItem value={date} key={date}>
                        <AccordionTrigger>
                            <div className='flex justify-between w-full pr-4'>
                                <span>{new Date(date).toLocaleDateString('lo-LA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                <span className='font-semibold text-green-600'>{formatCurrency(dailyTotal)}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ເວລາ</TableHead>
                                        <TableHead>ຜູ້ສະໜອງ</TableHead>
                                        <TableHead>ຈຳນວນລາຍການ</TableHead>
                                        <TableHead className="text-right">ຍອດລວມ</TableHead>
                                        <TableHead className="text-center">ຈັດການ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                {dailyPurchases.map(purchase => (
                                    <TableRow key={purchase.id}>
                                        <TableCell>{purchase.purchaseDate.toDate().toLocaleTimeString('lo-LA')}</TableCell>
                                        <TableCell className="font-medium">{purchase.supplierName || '-'}</TableCell>
                                        <TableCell>{purchase.items.length} ລາຍການ</TableCell>
                                        <TableCell className="text-right font-semibold text-green-600">{formatCurrency(purchase.totalAmount)}</TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="outline" size="sm" onClick={() => setSelectedPurchase(purchase)}>
                                                <Eye className="h-4 w-4 mr-1"/> ເບິ່ງລາຍລະອຽດ
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
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
        isOpen={isFormDialogOpen}
        onOpenChange={setFormDialogOpen}
        onSave={handleSavePurchase}
        stockItems={stockItems}
      />
      {selectedPurchase && (
        <PurchaseDetailsDialog
            isOpen={!!selectedPurchase}
            onOpenChange={() => setSelectedPurchase(null)}
            purchase={selectedPurchase}
        />
      )}
    </>
  );
}
