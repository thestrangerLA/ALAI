
'use client';

import { useState, useEffect } from 'react';
import { listenToSales } from '@/services/salesService';
import type { Sale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/stat-card';
import Link from 'next/link';
import { ArrowLeft, Calendar, DollarSign, FileText } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

export default function SalesReportPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesToday, setSalesToday] = useState(0);
  const [salesThisMonth, setSalesThisMonth] = useState(0);
  const [salesThisYear, setSalesThisYear] = useState(0);

  useEffect(() => {
    const unsubscribe = listenToSales(salesData => {
      setSales(salesData);
      calculateStats(salesData);
    });
    return () => unsubscribe();
  }, []);

  const calculateStats = (salesData: Sale[]) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let today = 0;
    let month = 0;
    let year = 0;

    salesData.forEach(sale => {
      const saleDate = sale.saleDate.toDate();
      if (saleDate >= startOfToday) {
        today += sale.totalAmount;
      }
      if (saleDate >= startOfMonth) {
        month += sale.totalAmount;
      }
      if (saleDate >= startOfYear) {
        year += sale.totalAmount;
      }
    });

    setSalesToday(today);
    setSalesThisMonth(month);
    setSalesThisYear(year);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(value);
  };

  return (
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
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <StatCard
            title="ຍອດຂາຍມື້ນີ້"
            value={formatCurrency(salesToday)}
            icon={<DollarSign className="h-5 w-5 text-green-500" />}
          />
          <StatCard
            title="ຍອດຂາຍເດືອນນີ້"
            value={formatCurrency(salesThisMonth)}
            icon={<Calendar className="h-5 w-5 text-orange-500" />}
          />
          <StatCard
            title="ຍອດຂາຍປີນີ້"
            value={formatCurrency(salesThisYear)}
            icon={<Calendar className="h-5 w-5 text-blue-500" />}
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>ປະຫວັດການຂາຍ</CardTitle>
            <CardDescription>ລາຍການໃບເກັບເງິນທັງໝົດທີ່ໄດ້ບັນທຶກໄວ້</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ເລກທີ່ Invoice</TableHead>
                  <TableHead>ຊື່ລູກຄ້າ</TableHead>
                  <TableHead>ວັນທີຂາຍ</TableHead>
                  <TableHead className="text-right">ຍອດລວມ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length > 0 ? sales.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
                    <TableCell>{sale.customerName || '-'}</TableCell>
                    <TableCell>{sale.saleDate.toDate().toLocaleDateString('lo-LA')}</TableCell>
                    <TableCell className="text-right">{formatCurrency(sale.totalAmount)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">-- ຍັງບໍ່ມີຂໍ້ມູນການຂາຍ --</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
