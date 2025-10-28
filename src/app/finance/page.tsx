
'use client';

import { useState, useEffect, useMemo } from 'react';
import { listenToSales } from '@/services/salesService';
import { listenToPurchases } from '@/services/purchaseService';
import { listenToDebtors } from '@/services/debtorService';
import { listenToOtherExpenses } from '@/services/otherExpensesService';
import type { Sale, Purchase, Debtor, OtherExpense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/stat-card';
import Link from 'next/link';
import { ArrowLeft, Landmark, TrendingUp, TrendingDown, Users, DollarSign, FileText, LineChart, Filter, Receipt } from 'lucide-react';

export default function FinancePage() {
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);
  const [allOtherExpenses, setAllOtherExpenses] = useState<OtherExpense[]>([]);
  const [allDebtors, setAllDebtors] = useState<Debtor[]>([]);
  
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [filteredOtherExpenses, setFilteredOtherExpenses] = useState<OtherExpense[]>([]);
  const [filteredDebtors, setFilteredDebtors] = useState<Debtor[]>([]);

  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const [bankTransfer, setBankTransfer] = useState(13511000);

  useEffect(() => {
    const unsubscribeSales = listenToSales(setAllSales);
    const unsubscribePurchases = listenToPurchases(setAllPurchases);
    const unsubscribeDebtors = listenToDebtors(setAllDebtors);
    const unsubscribeExpenses = listenToOtherExpenses(setAllOtherExpenses);

    return () => {
      unsubscribeSales();
      unsubscribePurchases();
      unsubscribeDebtors();
      unsubscribeExpenses();
    };
  }, []);
  
  const allTransactions = useMemo(() => {
    const salesDates = allSales.map(s => s.saleDate);
    const purchaseDates = allPurchases.map(p => p.purchaseDate);
    const expenseDates = allOtherExpenses.map(e => e.date);
    const debtorDates = allDebtors.map(d => d.saleDate);
    return [...salesDates, ...purchaseDates, ...debtorDates, ...expenseDates];
  }, [allSales, allPurchases, allDebtors, allOtherExpenses]);

  const availableYears = useMemo(() => {
    const years = new Set(allTransactions.map(ts => ts.toDate().getFullYear().toString()));
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [allTransactions]);

  useEffect(() => {
    const filterByDate = (items: any[]) => {
      let itemsToFilter = items;
      
      const getDate = (item: any) => item.saleDate || item.purchaseDate || item.date;

      if (selectedYear !== 'all') {
        itemsToFilter = itemsToFilter.filter(item => getDate(item).toDate().getFullYear().toString() === selectedYear);
      }

      if (selectedMonth !== 'all') {
        itemsToFilter = itemsToFilter.filter(item => (getDate(item).toDate().getMonth() + 1).toString() === selectedMonth);
      }
      return itemsToFilter;
    };

    setFilteredSales(filterByDate(allSales) as Sale[]);
    setFilteredPurchases(filterByDate(allPurchases) as Purchase[]);
    setFilteredOtherExpenses(filterByDate(allOtherExpenses) as OtherExpense[]);
    setFilteredDebtors(filterByDate(allDebtors) as Debtor[]);

  }, [selectedYear, selectedMonth, allSales, allPurchases, allDebtors, allOtherExpenses]);

  const overallStats = useMemo(() => {
    const totalSales = allSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalPurchases = allPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalOtherExpenses = allOtherExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = totalPurchases + totalOtherExpenses;
    const totalDebt = allDebtors.reduce((sum, debtor) => sum + debtor.totalAmount, 0);
    const profit = totalSales - totalExpenses;
    return { totalSales, totalPurchases, totalOtherExpenses, totalExpenses, totalDebt, profit };
  }, [allSales, allPurchases, allOtherExpenses, allDebtors]);

  const filteredStats = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalPurchases = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalOtherExpenses = filteredOtherExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = totalPurchases + totalOtherExpenses;
    const totalDebt = filteredDebtors.reduce((sum, debtor) => sum + debtor.totalAmount, 0);
    const profit = totalSales - totalExpenses;
    return { totalSales, totalPurchases, totalOtherExpenses, totalExpenses, totalDebt, profit };
  }, [filteredSales, filteredPurchases, filteredOtherExpenses, filteredDebtors]);


  const handleBankTransferClick = () => {
    const newValueStr = window.prompt("ກະລຸນາປ້ອນຈຳນວນເງິນໂອນໃໝ່:", bankTransfer.toString());
    if (newValueStr) {
      const newValue = parseFloat(newValueStr.replace(/,/g, ''));
      if (!isNaN(newValue)) {
        setBankTransfer(newValue);
      } else {
        alert("ຈຳນວນເງິນບໍ່ຖືກຕ້ອງ.");
      }
    }
  };
  
  const handleResetFilters = () => {
    setSelectedYear('all');
    setSelectedMonth('all');
  };

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
        icon: <Receipt className="w-8 h-8 text-rose-500" />,
        title: 'ລາຍງານລາຍຈ່າຍ',
        description: 'ເບິ່ງປະຫວັດການຊື້ ແລະ ຄ່າໃຊ້ຈ່າຍອື່ນໆ'
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
      <header className="bg-white shadow-md sticky top-0 z-30 flex h-20 items-center justify-between border-b px-4 sm:px-6">
        <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-10 w-10" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">ກັບໄປໜ້າຫຼັກ</span>
              </Link>
            </Button>
            <div className="bg-purple-500 p-3 rounded-lg">
                <Landmark className="h-6 w-6 text-white" />
            </div>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">ລະບົບບັນຊີການເງິນ</h1>
                <p className="text-sm text-muted-foreground">ລາຍງານພາບລວມທາງດ້ານການເງິນ</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
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
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-8 md:gap-8">
        
        <Card>
            <CardHeader>
                <CardTitle>ສະຫຼຸບตามการกรอง</CardTitle>
                <CardDescription>ຂໍ້ມູນສະແດງຕາມ ປີ: {selectedYear === 'all' ? 'ທັງໝົດ' : selectedYear}, ເດືອນ: {selectedMonth === 'all' ? 'ທັງໝົດ' : selectedMonth}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    title="ຍອດຂາຍ (ກັ່ນຕອງ)"
                    value={formatCurrency(filteredStats.totalSales)}
                    icon={<DollarSign className="h-5 w-5 text-green-500" />}
                    description={`ຈາກ ${filteredSales.length} ບິນ`}
                  />
                  <StatCard
                    title="ລາຍຈ່າຍ (ກັ່ນຕອງ)"
                    value={formatCurrency(filteredStats.totalExpenses)}
                    icon={<DollarSign className="h-5 w-5 text-red-500" />}
                    description={`ຊື້: ${formatCurrency(filteredStats.totalPurchases)} | ອື່ນໆ: ${formatCurrency(filteredStats.totalOtherExpenses)}`}
                  />
                  <StatCard
                    title="ກຳໄລ (ກັ່ນຕອງ)"
                    value={formatCurrency(filteredStats.profit)}
                    icon={<LineChart className="h-5 w-5 text-blue-500" />}
                    description="ກຳໄລຈາກຍອດຂາຍຫັກລົບລາຍຈ່າຍ"
                  />
                   <StatCard
                    title="ຍອດໜີ້ (ກັ່ນຕອງ)"
                    value={formatCurrency(filteredStats.totalDebt)}
                    icon={<DollarSign className="h-5 w-5 text-orange-500" />}
                     description={`ຈາກ ${filteredDebtors.length} ບິນ`}
                  />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>ສະຫຼຸບຍอดรวมทั้งหมด</CardTitle>
                <CardDescription>ຂໍ້ມູນທັງໝົດທີ່ບັນທຶກໄວ້ໃນລະບົບ</CardDescription>
            </CardHeader>
             <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  <StatCard
                    title="ຍອດຂາຍລວມທັງໝົດ"
                    value={formatCurrency(overallStats.totalSales)}
                    icon={<DollarSign className="h-5 w-5 text-green-500" />}
                    description={`ຈາກ ${allSales.length} ບິນ`}
                  />
                  <StatCard
                    title="ລາຍຈ່າຍລວມທັງໝົດ"
                    value={formatCurrency(overallStats.totalExpenses)}
                    icon={<DollarSign className="h-5 w-5 text-red-500" />}
                     description={`ຊື້: ${formatCurrency(overallStats.totalPurchases)} | ອື່ນໆ: ${formatCurrency(overallStats.totalOtherExpenses)}`}
                  />
                  <StatCard
                    title="ກຳໄລລວມທັງໝົດ"
                    value={formatCurrency(overallStats.profit)}
                    icon={<LineChart className="h-5 w-5 text-blue-500" />}
                  />
                   <StatCard
                    title="ຍອດໜີ້ຄ້າງຊຳລະທັງໝົດ"
                    value={formatCurrency(overallStats.totalDebt)}
                    icon={<DollarSign className="h-5 w-5 text-orange-500" />}
                     description={`ຈາກ ${allDebtors.length} ບິນ`}
                  />
                  <div onClick={handleBankTransferClick} className="cursor-pointer">
                     <StatCard
                      title="ເງິນໂอน"
                      value={formatCurrency(bankTransfer)}
                      icon={<Landmark className="h-5 w-5 text-indigo-500" />}
                      description="ກົດເພື່ອແກ້ໄຂຈຳນວນເງິນ"
                    />
                  </div>
                </div>
            </CardContent>
        </Card>

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

    