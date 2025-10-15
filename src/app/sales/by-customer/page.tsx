
'use client';

import { useState, useEffect, useMemo } from 'react';
import { listenToSales } from '@/services/salesService';
import { listenToDebtors } from '@/services/debtorService';
import type { Sale, Debtor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/stat-card';
import Link from 'next/link';
import { ArrowLeft, Users, DollarSign, ChevronRight, Filter } from 'lucide-react';

type CustomerReport = {
    totalSpent: number;
    totalDebt: number;
    paidInvoices: number;
    unpaidInvoices: number;
    transactions: (Sale | Debtor)[];
}

export default function SalesByCustomerPage() {
    const [allSales, setAllSales] = useState<Sale[]>([]);
    const [allDebtors, setAllDebtors] = useState<Debtor[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<(Sale | Debtor)[]>([]);

    // Filter states
    const [selectedYear, setSelectedYear] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');

    useEffect(() => {
        const unsubscribeSales = listenToSales(setAllSales);
        const unsubscribeDebtors = listenToDebtors(setAllDebtors);
        return () => {
            unsubscribeSales();
            unsubscribeDebtors();
        };
    }, []);
    
    const allTransactions = useMemo(() => [...allSales, ...allDebtors], [allSales, allDebtors]);

    const availableYears = useMemo(() => {
        const years = new Set(allTransactions.map(tx => tx.saleDate.toDate().getFullYear().toString()));
        return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
    }, [allTransactions]);

    useEffect(() => {
        let transactionsToFilter = allTransactions;

        if (selectedYear !== 'all') {
            transactionsToFilter = transactionsToFilter.filter(tx => tx.saleDate.toDate().getFullYear().toString() === selectedYear);
        }

        if (selectedMonth !== 'all') {
            transactionsToFilter = transactionsToFilter.filter(tx => (tx.saleDate.toDate().getMonth() + 1).toString() === selectedMonth);
        }
        
        setFilteredTransactions(transactionsToFilter);

    }, [selectedYear, selectedMonth, allTransactions]);

    const totalOutstandingDebt = useMemo(() => {
        return filteredTransactions
            .filter(tx => tx.status === 'unpaid')
            .reduce((sum, debtor) => sum + debtor.totalAmount, 0);
    }, [filteredTransactions]);

    const customerReports = useMemo(() => {
        const reports: Record<string, CustomerReport> = {};

        filteredTransactions.forEach(transaction => {
            const customerName = transaction.customerName || 'ບໍ່ໄດ້ລະບຸຊື່';
            if (!reports[customerName]) {
                reports[customerName] = {
                    totalSpent: 0,
                    totalDebt: 0,
                    paidInvoices: 0,
                    unpaidInvoices: 0,
                    transactions: [],
                };
            }

            if (transaction.status === 'paid') {
                reports[customerName].totalSpent += transaction.totalAmount;
                reports[customerName].paidInvoices += 1;
            } else {
                reports[customerName].totalDebt += transaction.totalAmount;
                reports[customerName].unpaidInvoices += 1;
            }
            reports[customerName].transactions.push(transaction);
        });
        
        for (const customer in reports) {
            reports[customer].transactions.sort((a, b) => b.saleDate.toMillis() - a.saleDate.toMillis());
        }

        return Object.entries(reports).sort(([nameA], [nameB]) => nameA.localeCompare(nameB));

    }, [filteredTransactions]);
    
    const handleResetFilters = () => {
        setSelectedYear('all');
        setSelectedMonth('all');
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(value);
    };

    return (
        <>
            <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-teal-50 to-cyan-100">
                <header className="bg-white shadow-md sticky top-0 z-30 flex h-20 items-center gap-4 border-b px-4 sm:px-6">
                    <Button variant="outline" size="icon" className="h-10 w-10" asChild>
                        <Link href="/sales">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">ກັບໄປໜ້າລາຍງານ</span>
                        </Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="bg-teal-500 p-3 rounded-lg">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">ລາຍງານການຂາຍຕາມລູກຄ້າ</h1>
                            <p className="text-sm text-muted-foreground">ສະຫຼຸບຍອດຊື້ ແລະ ໜີ້ຄ້າງຊຳລະຂອງລູກຄ້າແຕ່ລະຄົນ</p>
                        </div>
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-8 md:gap-8">
                     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="ຍອດໜີ້ຄ້າງຊຳລະ (ກັ່ນຕອງ)"
                            value={formatCurrency(totalOutstandingDebt)}
                            icon={<DollarSign className="h-5 w-5 text-red-500" />}
                            description={`ຈາກ ${filteredTransactions.filter(tx => tx.status === 'unpaid').length} ບິນ`}
                        />
                    </div>
                     <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div>
                                    <CardTitle>ສະຫຼຸບຂໍ້ມູນລູກຄ້າ</CardTitle>
                                    <CardDescription>
                                        ພົບລູກຄ້າທັງໝົດ {customerReports.length} ຄົນທີ່ກົງກັບການກັ່ນຕອງ.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Filter className="h-4 w-4 text-muted-foreground" />
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
                            {customerReports.length > 0 ? (
                                <div className="space-y-4">
                                    {customerReports.map(([name, report]) => (
                                        <Link href={`/customers/${encodeURIComponent(name)}`} key={name} className="block">
                                            <Card className="hover:bg-slate-50 hover:shadow-md transition-all">
                                                <CardContent className="p-4 flex justify-between items-center">
                                                     <div>
                                                        <p className="text-lg font-semibold">{name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {report.paidInvoices + report.unpaidInvoices} ທຸລະກຳ
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className='font-semibold text-green-600'>ຍອດຊື້: {formatCurrency(report.totalSpent)}</p>
                                                        <p className='font-semibold text-red-600'>ຍອດໜີ້: {formatCurrency(report.totalDebt)}</p>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                 <div className="h-24 text-center content-center">-- ບໍ່ພົບຂໍ້ມູນທີ່ກົງກັບການກັ່ນຕອງ --</div>
                            )}
                        </CardContent>
                     </Card>
                </main>
            </div>
        </>
    );
}

