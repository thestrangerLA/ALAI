
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Calendar as CalendarIcon, Printer, ChevronRight } from "lucide-react";
import { listenToAllAutoPartsTransactions } from '@/services/autoPartsReportService';
import type { Transaction } from '@/lib/types';
import { getMonth, format, setMonth, isWithinInterval, startOfYear, endOfYear, getYear } from 'date-fns';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar";
import { Label } from '@/components/ui/label';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('lo-LA', { minimumFractionDigits: 0 }).format(value);
};


export default function AutoPartsGeneralLedgerPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [startDate, setStartDate] = useState<Date | undefined>(startOfYear(new Date()));
    const [endDate, setEndDate] = useState<Date | undefined>(endOfYear(new Date()));

    useEffect(() => {
        const unsubscribeTransactions = listenToAllAutoPartsTransactions(setTransactions);
        return () => {
            unsubscribeTransactions();
        };
    }, []);
    
    const reportData = useMemo(() => {
        const filteredTransactions = transactions.filter(tx => {
            if (!startDate || !endDate) return false;
            return isWithinInterval(tx.date, { start: startDate, end: endDate });
        });
        
        const groupedByMonth = filteredTransactions.reduce((acc, tx) => {
            const month = getMonth(tx.date);
            const year = getYear(tx.date);
            const key = `${year}-${month}`;
            if (!acc[key]) {
                acc[key] = {
                    year,
                    month,
                    transactions: [],
                    income: 0,
                    expense: 0,
                    net: 0
                };
            }
            acc[key].transactions.push(tx);
            if (tx.type === 'income') {
                acc[key].income += tx.amount || 0;
            } else {
                acc[key].expense += tx.amount || 0;
            }
            acc[key].net = acc[key].income - acc[key].expense;
            return acc;
        }, {} as Record<string, { year: number, month: number, transactions: Transaction[], income: number, expense: number, net: number }>);
        
        const monthlyReports = Object.values(groupedByMonth)
            .sort((a, b) => (b.year - a.year) || (b.month - a.month));
        
        const grandTotals = {
            income: 0,
            expense: 0,
            net: 0
        };

        monthlyReports.forEach(monthData => {
            grandTotals.income += monthData.income;
            grandTotals.expense += monthData.expense;
            grandTotals.net += monthData.net;
        });

        return { monthlyReports, grandTotals };

    }, [transactions, startDate, endDate]);


    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 print:hidden">
                <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                    <Link href="/autoparts/reports">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">ກັບໄປໜ້າລາຍງານ</span>
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-primary"/>
                    <h1 className="text-xl font-bold tracking-tight">ປະຫວັດຮັບ-ຈ່າຍທົ່ວໄປ (ອາໄຫຼລົດ)</h1>
                </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                 <Card className="print:hidden">
                    <CardHeader>
                        <CardTitle>ໂຕກອງລາຍງານ</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row md:items-end gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="start-date">ວັນທີເລີ່ມຕົ້ນ</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button id="start-date" variant={"outline"} className="w-[280px] justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, "PPP") : <span>ເລືອກວັນທີ</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus  /></PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="end-date">ວັນທີສິ້ນສຸດ</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button id="end-date" variant={"outline"} className="w-[280px] justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {endDate ? format(endDate, "PPP") : <span>ເລືອກວັນທີ</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus  /></PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex items-center gap-2 md:ml-auto">
                             <Button onClick={() => window.print()} variant="outline">
                                <Printer className="mr-2 h-4 w-4" />
                                ພິມ
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="print-container hidden">
                    <div className="space-y-4">
                        <div className="text-center">
                            <h1 className="text-xl font-bold font-lao">ຍອດລວມສໍາລັບຊ່ວງວັນທີທີ່ເລືອກ</h1>
                             {(startDate && endDate) && (
                                <p className="text-sm text-gray-600 font-lao">
                                    (ແຕ່ວັນທີ {format(startDate, "dd/MM/yyyy")} ຫາ {format(endDate, "dd/MM/yyyy")})
                                </p>
                            )}
                        </div>
                        <p className='text-sm text-gray-700 font-lao'>ສະແດງລາຍການທຸລະກຳທົ່ວໄປສຳລັບຊ່ວງວັນທີທີ່ເລືອກ</p>
                        
                        <div className="border rounded-lg p-4 space-y-2 bg-white/50">
                             <div className="flex font-semibold text-sm font-lao border-b pb-2">
                                <div className="w-1/3">ປະເພດ</div>
                                <div className="w-2/3 text-right">KIP</div>
                            </div>
                            <div className="flex items-center text-sm border-b py-2">
                                <div className="w-1/3 font-lao">ລາຍຮັບ</div>
                                <div className="w-2/3 text-right text-green-600 font-mono">{formatCurrency(reportData.grandTotals.income)}</div>
                            </div>
                             <div className="flex items-center text-sm border-b py-2">
                                <div className="w-1/3 font-lao">ລາຍຈ່າຍ</div>
                                <div className="w-2/3 text-right text-red-600 font-mono">{formatCurrency(reportData.grandTotals.expense)}</div>
                            </div>
                            <div className="flex items-center text-sm font-bold bg-blue-50 -mx-4 px-4 py-2">
                                <div className="w-1/3 font-lao">ກຳໄລ/ຂາດທຶນ</div>
                                <div className={`w-2/3 text-right font-mono ${reportData.grandTotals.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    {formatCurrency(reportData.grandTotals.net)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Card className="monthly-list-card print:hidden">
                    <CardHeader>
                        <CardTitle>ລາຍລະອຽດລາຍເດືອນ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {reportData.monthlyReports.length > 0 ? (
                           <div className="space-y-2">
                            {reportData.monthlyReports.map(({ year, month, net }) => (
                                <Link 
                                    href={`/autoparts/reports/general-ledger-month?year=${year}&month=${month}`} 
                                    key={`${year}-${month}`}
                                    passHref
                                >
                                    <Card className="hover:bg-muted/50 cursor-pointer">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="font-semibold text-base">
                                                {format(setMonth(new Date(year, month), month), 'LLLL yyyy')}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="hidden sm:grid grid-cols-1 gap-x-4 text-xs">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <span className="font-bold uppercase text-muted-foreground">Net:</span>
                                                        <span className={`font-mono w-20 text-right ${net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(net)}</span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                           </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                ບໍ່ມີປະຫວັດຮັບ-ຈ່າຍໃນຊ່ວງວັນທີທີ່ເລືອກ
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
