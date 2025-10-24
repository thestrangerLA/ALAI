
'use client';

import { useState, useEffect, useMemo } from 'react';
import { listenToSales } from '@/services/salesService';
import { listenToDebtors, markAsPaid } from '@/services/debtorService';
import type { Sale, Debtor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/stat-card';
import Link from 'next/link';
import { ArrowLeft, Users, DollarSign, Filter, ShoppingCart, CheckCircle, Eye } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InvoiceDetailsDialog } from '@/components/invoice-details-dialog';

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
    const [selectedTransaction, setSelectedTransaction] = useState<Sale | Debtor | null>(null);

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

    const { totalOutstandingDebt, totalPaidSales } = useMemo(() => {
        return filteredTransactions.reduce(
            (acc, tx) => {
                if (tx.status === 'unpaid') {
                    acc.totalOutstandingDebt += tx.totalAmount;
                } else {
                    acc.totalPaidSales += tx.totalAmount;
                }
                return acc;
            },
            { totalOutstandingDebt: 0, totalPaidSales: 0 }
        );
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

    const handleMarkAsPaid = async (debtor: Debtor) => {
        if (window.confirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການບັນທຶກການຈ່າຍເງິນສຳລັບ Invoice #${debtor.invoiceNumber}?`)) {
            const result = await markAsPaid(debtor);
            alert(result.message);
        }
    };

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
                            <h1 className="text-2xl font-bold tracking-tight">ປະຫວັດການຂາຍ (ແຍກຕາມລູກຄ້າ)</h1>
                            <p className="text-sm text-muted-foreground">ສະຫຼຸບຍອດຊື້ ແລະ ໜີ້ຄ້າງຊຳລະຂອງລູກຄ້າແຕ່ລະຄົນ</p>
                        </div>
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-8 md:gap-8">
                     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="ຍອດຂາຍລວມ (ຈ່າຍແລ້ວ)"
                            value={formatCurrency(totalPaidSales)}
                            icon={<ShoppingCart className="h-5 w-5 text-green-500" />}
                            description={`ຈາກ ${filteredTransactions.filter(tx => tx.status === 'paid').length} ບິນ`}
                        />
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
                                            <SelectValue placeholder="ເລືอกເດືອນ" />
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
                                <Accordion type="multiple" className="w-full space-y-2">
                                    {customerReports.map(([name, report]) => (
                                        <AccordionItem value={name} key={name} className='bg-slate-50 rounded-lg border'>
                                            <AccordionTrigger className='hover:bg-slate-100 rounded-t-lg px-4 py-3 text-lg'>
                                                <div className='flex justify-between w-full pr-4'>
                                                    <div>
                                                        <p className="font-semibold">{name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {report.paidInvoices + report.unpaidInvoices} ທຸລະກຳ
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className='font-semibold text-green-600'>ຍອດຊື້: {formatCurrency(report.totalSpent)}</p>
                                                        <p className='font-semibold text-red-600'>ຍອດໜີ້: {formatCurrency(report.totalDebt)}</p>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className='p-0'>
                                                 <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>ວັນທີ</TableHead>
                                                            <TableHead>ເລກທີ່ Invoice</TableHead>
                                                            <TableHead>ສະຖານະ</TableHead>
                                                            <TableHead className="text-right">ຍອດລວມ</TableHead>
                                                            <TableHead className="text-center">ຈັດການ</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {report.transactions.map(tx => (
                                                            <TableRow key={tx.id}>
                                                                <TableCell>{tx.saleDate.toDate().toLocaleDateString('lo-LA')}</TableCell>
                                                                <TableCell className="font-medium">{tx.invoiceNumber}</TableCell>
                                                                <TableCell>
                                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${tx.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                                        {tx.status === 'paid' ? 'ຈ່າຍແລ້ວ' : 'ຄ້າງຊຳລະ'}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="text-right font-medium" style={{color: tx.status === 'paid' ? 'var(--green-600)' : 'var(--red-600)'}}>{formatCurrency(tx.totalAmount)}</TableCell>
                                                                <TableCell className="text-center space-x-1">
                                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedTransaction(tx)}>
                                                                        <Eye className="h-4 w-4"/>
                                                                        <span className="sr-only">ເບິ່ງ</span>
                                                                    </Button>
                                                                    {tx.status === 'unpaid' && (
                                                                        <Button size="icon" className="bg-green-600 hover:bg-green-700 h-8 w-8" onClick={() => handleMarkAsPaid(tx as Debtor)}>
                                                                            <CheckCircle className="h-4 w-4"/>
                                                                            <span className="sr-only">ບັນທຶກການຈ່າຍເງິນ</span>
                                                                        </Button>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            ) : (
                                 <div className="h-24 text-center content-center">-- ບໍ່ພົບຂໍ້ມູນທີ່ກົງກັບການກັ່ນຕອງ --</div>
                            )}
                        </CardContent>
                     </Card>
                </main>
            </div>
            {selectedTransaction && (
                <InvoiceDetailsDialog 
                    sale={selectedTransaction} 
                    isOpen={!!selectedTransaction} 
                    onOpenChange={() => setSelectedTransaction(null)} 
                />
            )}
        </>
    );
}
