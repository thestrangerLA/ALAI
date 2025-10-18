
'use client';

import { useState, useEffect, useMemo } from 'react';
import { listenToSales } from '@/services/salesService';
import { deleteTransaction } from '@/services/transactionService';
import type { Sale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from 'next/link';
import { ArrowLeft, History, Eye, Trash2, Calendar, DollarSign } from 'lucide-react';
import { InvoiceDetailsDialog } from '@/components/invoice-details-dialog';
import { StatCard } from '@/components/stat-card';

export default function SalesHistoryPage() {
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const [profitToday, setProfitToday] = useState(0);
  const [profitThisMonth, setProfitThisMonth] = useState(0);
  const [profitThisYear, setProfitThisYear] = useState(0);

  useEffect(() => {
    const unsubscribe = listenToSales(salesData => {
      setAllSales(salesData);
      calculateStats(salesData);
    });
    return () => unsubscribe();
  }, []);

  const calculateProfit = (sale: Sale): number => {
    return sale.items.reduce((totalProfit, item) => {
        const costPrice = item.costPrice || 0;
        const profitPerItem = (item.price * item.sellQuantity) - (costPrice * item.sellQuantity);
        return totalProfit + profitPerItem;
    }, 0);
  };
  
  const calculateStats = (salesData: Sale[]) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    let todayProfit = 0;
    let monthProfit = 0;
    let yearProfit = 0;
    
    salesData.forEach(sale => {
      const saleDate = sale.saleDate.toDate();
      const profit = calculateProfit(sale);
      if (saleDate >= startOfToday) {
        todayProfit += profit;
      }
      if (saleDate >= startOfMonth) {
        monthProfit += profit;
      }
      if (saleDate >= startOfYear) {
        yearProfit += profit;
      }
    });

    setProfitToday(todayProfit);
    setProfitThisMonth(monthProfit);
    setProfitThisYear(yearProfit);
  };
  
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           <StatCard
            title="ກຳໄລມື້ນີ້"
            value={formatCurrency(profitToday)}
            icon={<DollarSign className="h-5 w-5 text-green-500" />}
          />
          <StatCard
            title={'ກຳໄລເດືອນນີ້'}
            value={formatCurrency(profitThisMonth)}
            icon={<Calendar className="h-5 w-5 text-orange-500" />}
          />
          <StatCard
            title={'ກຳໄລປີນີ້'}
            value={formatCurrency(profitThisYear)}
            icon={<Calendar className="h-5 w-5 text-blue-500" />}
          />
        </div>
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
                                                <TableHead className="text-right">ກຳໄລ</TableHead>
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

    