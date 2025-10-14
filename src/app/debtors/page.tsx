
'use client';

import { useState, useEffect, useMemo } from 'react';
import { listenToDebtors, markAsPaid } from '@/services/debtorService';
import type { Debtor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/stat-card';
import Link from 'next/link';
import { ArrowLeft, Users, DollarSign, CheckCircle, Calendar, Eye } from 'lucide-react';
import { InvoiceDetailsDialog } from '@/components/invoice-details-dialog';

export default function DebtorsPage() {
  const [allDebtors, setAllDebtors] = useState<Debtor[]>([]);
  const [filteredDebtors, setFilteredDebtors] = useState<Debtor[]>([]);
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);

  // Filter states
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Stats State
  const [debtThisMonth, setDebtThisMonth] = useState(0);
  const [newDebtorsThisMonthCount, setNewDebtorsThisMonthCount] = useState(0);
  const [debtLastMonth, setDebtLastMonth] = useState(0);
  const [newDebtorsLastMonthCount, setNewDebtorsLastMonthCount] = useState(0);

  useEffect(() => {
    const unsubscribe = listenToDebtors((debtorsData) => {
        setAllDebtors(debtorsData);
        calculateStats(debtorsData);
    });
    return () => unsubscribe();
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set(allDebtors.map(debtor => debtor.saleDate.toDate().getFullYear().toString()));
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [allDebtors]);

  useEffect(() => {
    let debtorsToFilter = allDebtors;

    if (selectedYear !== 'all') {
      debtorsToFilter = debtorsToFilter.filter(debtor => debtor.saleDate.toDate().getFullYear().toString() === selectedYear);
    }

    if (selectedMonth !== 'all') {
      debtorsToFilter = debtorsToFilter.filter(debtor => (debtor.saleDate.toDate().getMonth() + 1).toString() === selectedMonth);
    }
    
    setFilteredDebtors(debtorsToFilter);

  }, [selectedYear, selectedMonth, allDebtors]);

  const calculateStats = (debtorsData: Debtor[]) => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    let thisMonthDebt = 0;
    let thisMonthCount = 0;
    let lastMonthDebt = 0;
    let lastMonthCount = 0;

    debtorsData.forEach(debtor => {
        const saleDate = debtor.saleDate.toDate();
        if (saleDate >= startOfThisMonth && saleDate <= endOfThisMonth) {
            thisMonthDebt += debtor.totalAmount;
            thisMonthCount++;
        } else if (saleDate >= startOfLastMonth && saleDate <= endOfLastMonth) {
            lastMonthDebt += debtor.totalAmount;
            lastMonthCount++;
        }
    });

    setDebtThisMonth(thisMonthDebt);
    setNewDebtorsThisMonthCount(thisMonthCount);
    setDebtLastMonth(lastMonthDebt);
    setNewDebtorsLastMonthCount(lastMonthCount);
  };


  const totalDebt = useMemo(() => {
    return allDebtors.reduce((sum, debtor) => sum + debtor.totalAmount, 0);
  }, [allDebtors]);

  const totalFilteredDebt = useMemo(() => {
    return filteredDebtors.reduce((sum, debtor) => sum + debtor.totalAmount, 0);
  }, [filteredDebtors]);

  const handleMarkAsPaid = async (debtor: Debtor) => {
    if (window.confirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການບັນທຶກການຈ່າຍເງິນສຳລັບ Invoice #${debtor.invoiceNumber}?`)) {
        const result = await markAsPaid(debtor);
        alert(result.message);
    }
  };

  const handleResetFilters = () => {
    setSelectedYear('all');
    setSelectedMonth('all');
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(value);
  };
  
  return (
    <>
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-red-50 to-orange-100">
      <header className="bg-white shadow-md sticky top-0 z-30 flex h-20 items-center gap-4 border-b px-4 sm:px-6">
        <Button variant="outline" size="icon" className="h-10 w-10" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">ກັບໄປໜ້າຫຼັກ</span>
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="bg-red-500 p-3 rounded-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ລາຍການລູກໜີ້</h1>
            <p className="text-sm text-muted-foreground">ບິນທີ່ຍັງບໍ່ທັນຊຳລະເງິນ</p>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-8 md:gap-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="ຍອດໜີ້ລວມທັງໝົດ"
                value={formatCurrency(totalDebt)}
                icon={<DollarSign className="h-5 w-5 text-red-500" />}
                description={`ຈາກ ${allDebtors.length} ບິນທີ່ຍັງຄ້າງຊຳລະ`}
            />
            <StatCard
                title="ໜີ້ໃໝ່ເດືອນນີ້"
                value={formatCurrency(debtThisMonth)}
                icon={<Calendar className="h-5 w-5 text-orange-500" />}
                description={`ຈາກ ${newDebtorsThisMonthCount} ບິນ`}
            />
            <StatCard
                title="ໜີ້ໃໝ່ເດືອນກ່ອນ"
                value={formatCurrency(debtLastMonth)}
                icon={<Calendar className="h-5 w-5 text-blue-500" />}
                description={`ຈາກ ${newDebtorsLastMonthCount} ບິນ`}
            />
        </div>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <CardTitle>ລາຍການບິນທີ່ຍັງບໍ່ຈ່າຍ</CardTitle>
                    <CardDescription>
                      ຍອດໜີ້ທີ່ກັ່ນຕອງ: {formatCurrency(totalFilteredDebt)}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ວັນທີ</TableHead>
                  <TableHead>ເລກທີ່ Invoice</TableHead>
                  <TableHead>ຊື່ລູກຄ້າ</TableHead>
                  <TableHead className="text-right">ຍອດຄ້າງຊຳລະ</TableHead>
                  <TableHead className="text-center">ຈັດການ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDebtors.length > 0 ? filteredDebtors.map(debtor => (
                  <TableRow key={debtor.id}>
                    <TableCell>{debtor.saleDate.toDate().toLocaleDateString('lo-LA')}</TableCell>
                    <TableCell className="font-medium">{debtor.invoiceNumber}</TableCell>
                    <TableCell>{debtor.customerName || '-'}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">{formatCurrency(debtor.totalAmount)}</TableCell>
                    <TableCell className="text-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedDebtor(debtor)}>
                        <Eye className="h-4 w-4 mr-1"/> ເບິ່ງລາຍລະອຽດ
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleMarkAsPaid(debtor)}>
                         <CheckCircle className="h-4 w-4 mr-1"/> ບັນທຶກການຈ່າຍເງິນ
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">-- ບໍ່ມີລາຍການລູກໜີ້ --</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
    {selectedDebtor && (
        <InvoiceDetailsDialog sale={selectedDebtor} isOpen={!!selectedDebtor} onOpenChange={() => setSelectedDebtor(null)} />
    )}
    </>
  );
}
