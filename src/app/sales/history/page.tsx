
'use client';

import { useState, useEffect, useMemo } from 'react';
import { listenToSales } from '@/services/salesService';
import type { Sale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from 'next/link';
import { ArrowLeft, History, Eye } from 'lucide-react';
import { InvoiceDetailsDialog } from '@/components/invoice-details-dialog';

export default function SalesHistoryPage() {
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    const unsubscribe = listenToSales(salesData => {
      setAllSales(salesData);
    });
    return () => unsubscribe();
  }, []);
  
  const availableYears = useMemo(() => {
    const years = new Set(allSales.map(sale => sale.saleDate.toDate().getFullYear().toString()));
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [allSales]);

  useEffect(() => {
    let salesToFilter = allSales;

    if (selectedYear !== 'all') {
      salesToFilter = salesToFilter.filter(sale => sale.saleDate.toDate().getFullYear().toString() === selectedYear);
    }

    if (selectedMonth !== 'all') {
      salesToFilter = salesToFilter.filter(sale => (sale.saleDate.toDate().getMonth() + 1).toString() === selectedMonth);
    }
    
    setFilteredSales(salesToFilter);

  }, [selectedYear, selectedMonth, allSales]);

  const handleResetFilters = () => {
    setSelectedYear('all');
    setSelectedMonth('all');
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(value);
  };
  
  const totalFilteredSales = useMemo(() => {
    return filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  }, [filteredSales]);

  const groupedSales = useMemo(() => {
    const groups: { [key: string]: Sale[] } = {};
    filteredSales.forEach(sale => {
      const dateString = sale.saleDate.toDate().toLocaleDateString('en-CA'); // YYYY-MM-DD
      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      groups[dateString].push(sale);
    });
    return Object.entries(groups).sort(([dateA], [dateB]) => dateB.localeCompare(dateA));
  }, [filteredSales]);

  return (
    <>
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-gray-50 to-slate-100">
      <header className="bg-white shadow-md sticky top-0 z-30 flex h-20 items-center gap-4 border-b px-4 sm:px-6">
        <Button variant="outline" size="icon" className="h-10 w-10" asChild>
          <Link href="/sales">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">ກັບໄປໜ້າລາຍງານ</span>
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-3 rounded-lg">
            <History className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ປະຫວັດການຂາຍທັງໝົດ</h1>
            <p className="text-sm text-muted-foreground">ລາຍການບິນທັງໝົດທີ່ໄດ້ຊຳລະເງິນແລ້ວ</p>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-8 md:gap-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <CardTitle>ປະຫວັດການຂາຍ</CardTitle>
                <CardDescription>
                  ຍອດຂາຍລວມທີ່ກັ່ນຕອງ: {formatCurrency(totalFilteredSales)}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="ເລືອກປີ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ທຸກໆປີ</SelectItem>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="ເລືອກເດືອນ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ທຸກໆເດືອນ</SelectItem>
                    {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                      <SelectItem key={month} value={month.toString()}>{`ເດືອນ ${month}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleResetFilters}>ລ້າງຕົວກອງ</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {groupedSales.length > 0 ? (
                  <Accordion type="multiple" className="w-full">
                    {groupedSales.map(([date, sales]) => {
                        const dailyTotal = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
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
                                                <TableHead>ເລກທີ່ Invoice</TableHead>
                                                <TableHead>ຊື່ລູກຄ້າ</TableHead>
                                                <TableHead>ເວລາ</TableHead>
                                                <TableHead className="text-right">ຍອດລວມ</TableHead>
                                                <TableHead className="text-center">ຈັດການ</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                        {sales.map(sale => (
                                            <TableRow key={sale.id}>
                                                <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
                                                <TableCell>{sale.customerName || '-'}</TableCell>
                                                <TableCell>{sale.saleDate.toDate().toLocaleTimeString('lo-LA')}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(sale.totalAmount)}</TableCell>
                                                <TableCell className="text-center">
                                                    <Button variant="outline" size="sm" onClick={() => setSelectedSale(sale)}>
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
                <div className="h-24 text-center content-center">-- ບໍ່ພົບຂໍ້ມູນການຂາຍທີ່ກົງກັບການກັ່ນຕອງ --</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
    {selectedSale && (
        <InvoiceDetailsDialog sale={selectedSale} isOpen={!!selectedSale} onOpenChange={() => setSelectedSale(null)} />
    )}
    </>
  );
}
