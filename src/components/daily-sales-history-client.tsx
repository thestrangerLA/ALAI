
'use client';

import { useState, useEffect, useMemo } from 'react';
import { listenToSales } from '@/services/salesService';
import { deleteTransaction } from '@/services/transactionService';
import type { Sale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { ArrowLeft, History, Eye, Trash2, DollarSign, LineChart } from 'lucide-react';
import { InvoiceDetailsDialog } from '@/components/invoice-details-dialog';
import { StatCard } from '@/components/stat-card';
import { Timestamp } from 'firebase/firestore';


interface DailySalesHistoryClientProps {
    dateString: string;
}

const calculateProfit = (sale: Sale): number => {
    return sale.items.reduce((totalProfit, item) => {
      const costPrice = item.costPrice || 0;
      const profitPerItem = (item.price * item.sellQuantity) - (costPrice * item.sellQuantity);
      return totalProfit + profitPerItem;
    }, 0);
};

export default function DailySalesHistoryClient({ dateString }: DailySalesHistoryClientProps) {
  const [dailySales, setDailySales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToSales(allSales => {
      const salesForDay = allSales.filter(sale => {
        const saleDate = sale.saleDate.toDate();
        const saleDateString = `${saleDate.getFullYear()}-${(saleDate.getMonth() + 1).toString().padStart(2, '0')}-${saleDate.getDate().toString().padStart(2, '0')}`;
        return saleDateString === dateString;
      });
      salesForDay.sort((a,b) => b.saleDate.toMillis() - a.saleDate.toMillis());
      setDailySales(salesForDay);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [dateString]);
  
  const handleDeleteSale = async (sale: Sale) => {
    if (window.confirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບທຸລະກຳ #${sale.invoiceNumber}? ການກະທຳນີ້ຈະສົ່ງສິນຄ້າຄືນສະຕັອກ ແລະ ບໍ່ສາມາດຍົກເລີກໄດ້.`)) {
      try {
        await deleteTransaction(sale);
        alert('ລຶບທຸລະກຳສຳເລັດ!');
      } catch (error) {
        console.error("Error deleting transaction: ", error);
        alert(`ເກີດຂໍ້ຜິດພາດໃນການລຶບທຸລະກຳ: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(value);
  };
  
  const { totalSales, totalProfit } = useMemo(() => {
    const totalSales = dailySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalProfit = dailySales.reduce((sum, sale) => sum + calculateProfit(sale), 0);
    return { totalSales, totalProfit };
  }, [dailySales]);


  return (
    <>
      <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-gray-50 to-slate-100">
        <header className="bg-white shadow-md sticky top-0 z-30 flex h-20 items-center gap-4 border-b px-4 sm:px-6">
          <Button variant="outline" size="icon" className="h-10 w-10" asChild>
            <Link href="/sales/history">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">ກັບໄປໜ້າປະຫວັດການຂາຍ</span>
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 p-3 rounded-lg">
              <History className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                ປະຫວັດການຂາຍວັນທີ {new Date(dateString).toLocaleDateString('lo-LA', { year: 'numeric', month: 'long', day: 'numeric' })}
              </h1>
              <p className="text-sm text-muted-foreground">ລາຍການບິນທັງໝົດທີ່ໄດ້ຊຳລະເງິນໃນມື້ນີ້</p>
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-8 md:gap-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="ຍອດຂາຍລວມ"
                    value={formatCurrency(totalSales)}
                    icon={<DollarSign className="h-5 w-5 text-green-500" />}
                    description={!isLoading ? `ຈາກ ${dailySales.length} ບິນ` : '...'}
                />
                 <StatCard
                    title="ກຳໄລລວມ"
                    value={formatCurrency(totalProfit)}
                    icon={<LineChart className="h-5 w-5 text-blue-500" />}
                />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>ລາຍການຂາຍ</CardTitle>
                    <CardDescription>
                        ລາຍການຂາຍທັງໝົດໃນວັນທີ {new Date(dateString).toLocaleDateString('lo-LA')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="h-24 text-center content-center">ກຳລັງໂຫຼດຂໍ້ມູນ...</div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ເລກທີ່ Invoice</TableHead>
                                <TableHead>ຊື່ລູກຄ້າ</TableHead>
                                <TableHead>ເວລາ</TableHead>
                                <TableHead className="text-right">ຍອດລວມ</TableHead>
                                <TableHead className="text-right">ກຳໄລ</TableHead>
                                <TableHead className="text-center">ຈັດການ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {dailySales.length > 0 ? dailySales.map(sale => (
                            <TableRow key={sale.id}>
                                <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
                                <TableCell>{sale.customerName || '-'}</TableCell>
                                <TableCell>{sale.saleDate.toDate().toLocaleTimeString('lo-LA')}</TableCell>
                                <TableCell className="text-right">{formatCurrency(sale.totalAmount)}</TableCell>
                                <TableCell className="text-right font-medium text-blue-600">{formatCurrency(calculateProfit(sale))}</TableCell>
                                <TableCell className="text-center space-x-1">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedSale(sale)}>
                                        <Eye className="h-4 w-4"/>
                                        <span className="sr-only">ເບິ່ງ</span>
                                    </Button>
                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteSale(sale)}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">ລຶບ</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    -- ບໍ່ພົບຂໍ້ມູນການຂາຍໃນມື້ນີ້ --
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>
        </main>
      </div>
      {selectedSale && (
          <InvoiceDetailsDialog 
              sale={selectedSale} 
              isOpen={!!selectedSale} 
              onOpenChange={() => setSelectedSale(null)}
              showProfit={true}
          />
      )}
    </>
  );
}
