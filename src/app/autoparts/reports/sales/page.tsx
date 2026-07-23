
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History, ChevronRight, DollarSign, Calendar, CalendarDays, Trash2 } from "lucide-react";
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, isSameDay, isSameMonth, isSameYear, getYear, getMonth, setMonth } from 'date-fns';
import { th } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteAutoPartsSale } from '@/services/autoPartsSalesService';
import { useToast } from '@/hooks/use-toast';
import type { Sale } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


const formatCurrency = (value: number) => {
    if (isNaN(value)) return '0';
    return new Intl.NumberFormat('lo-LA', { minimumFractionDigits: 0 }).format(value);
};

const SummaryCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export default function AutoPartsSalesPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [filter, setFilter] = useState<{ year: number | null, month: number | null }>({ year: new Date().getFullYear(), month: new Date().getMonth() });
    const { toast } = useToast();

    useEffect(() => {
        const q = query(collection(db, 'autoparts-sales'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const salesData: Sale[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                salesData.push({
                    id: doc.id,
                    ...data,
                    date: (data.date as Timestamp).toDate(),
                    createdAt: (data.createdAt as Timestamp).toDate(),
                } as Sale);
            });
            setSales(salesData);
        });
        return () => unsubscribe();
    }, []);

    const summaryData = useMemo(() => {
        const now = new Date();
        const todayProfit = sales.filter(s => isSameDay(s.date, now)).reduce((sum, s) => sum + (s.totalProfit || 0), 0);
        const thisMonthProfit = sales.filter(s => isSameMonth(s.date, now)).reduce((sum, s) => sum + (s.totalProfit || 0), 0);
        const thisYearProfit = sales.filter(s => isSameYear(s.date, now)).reduce((sum, s) => sum + (s.totalProfit || 0), 0);
        return { todayProfit, thisMonthProfit, thisYearProfit };
    }, [sales]);

    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            const saleYear = getYear(sale.date);
            const saleMonth = getMonth(sale.date);
            if (filter.year && saleYear !== filter.year) return false;
            if (filter.month !== null && saleMonth !== filter.month) return false;
            return true;
        });
    }, [sales, filter]);

    const groupedSales = useMemo(() => {
        return filteredSales.reduce((acc, sale) => {
            const dayKey = format(sale.date, 'yyyy-MM-dd');
            if (!acc[dayKey]) {
                acc[dayKey] = {
                    date: sale.date,
                    sales: []
                };
            }
            acc[dayKey].sales.push(sale);
            return acc;
        }, {} as Record<string, { date: Date, sales: Sale[] }>);
    }, [filteredSales]);

    const sortedGroupedSales = Object.values(groupedSales).sort((a, b) => b.date.getTime() - a.date.getTime());
    
    const filteredTotalSales = useMemo(() => {
        return filteredSales.reduce((sum, s) => sum + (s.subtotal || 0), 0);
    }, [filteredSales]);
    
     const filteredTotalProfit = useMemo(() => {
        return filteredSales.reduce((sum, s) => sum + (s.totalProfit || 0), 0);
    }, [filteredSales]);

    const availableYears = useMemo(() => {
        const years = new Set(sales.map(s => getYear(s.date)));
        return Array.from(years).sort((a, b) => b - a);
    }, [sales]);

    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i,
        label: format(setMonth(new Date(), i), 'LLLL', { locale: th }),
    }));
    
    const handleDeleteSale = async (e: React.MouseEvent, saleId: string) => {
        e.stopPropagation();
        try {
            await deleteAutoPartsSale(saleId);
            toast({ title: 'ລຶບການຂາຍສຳເລັດ', description: 'ສະຕັອກສິນຄ້າໄດ້ຖືກອັບເດດຄືນແລ້ວ' });
        } catch (error: any) {
            toast({ title: 'ເກີດຂໍ້ຜິດພາດ', description: error.message, variant: 'destructive' });
        }
    };


    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                    <Link href="/autoparts/reports">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">ກັບໄປໜ້າລາຍງານ</span>
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <History className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">ປະຫວັດການຂາຍທັງໝົດ (ອາໄຫຼລົດ)</h1>
                        <p className="text-xs text-muted-foreground">ລາຍການບິນທັງໝົດທີ່ໄດ້ຊຳລະເງິນແລ້ວ</p>
                    </div>
                </div>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                    <SummaryCard title="ກຳໄລມື້ນີ້" value={`LAK ${formatCurrency(summaryData.todayProfit)}`} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
                    <SummaryCard title="ກຳໄລເດືອນນີ້" value={`LAK ${formatCurrency(summaryData.thisMonthProfit)}`} icon={<Calendar className="h-4 w-4 text-muted-foreground" />} />
                    <SummaryCard title="ກຳໄລປີນີ້" value={`LAK ${formatCurrency(summaryData.thisYearProfit)}`} icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />} />
                </div>
                 <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>ປະຫວັດການຂາຍ</CardTitle>
                                <CardDescription>ຍອດຂາຍລວມ: LAK {formatCurrency(filteredTotalSales)} | ກຳໄລລວມ: LAK {formatCurrency(filteredTotalProfit)}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">{filter.year ? `ປີ ${filter.year + 543}` : 'ທຸກໆປີ'}</Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => setFilter(f => ({ ...f, year: null }))}>ທຸກໆປີ</DropdownMenuItem>
                                        {availableYears.map(year => (
                                            <DropdownMenuItem key={year} onClick={() => setFilter(f => ({ ...f, year }))}>ປີ {year + 543}</DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">{filter.month !== null ? months[filter.month].label : 'ທຸກໆເດືອນ'}</Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => setFilter(f => ({ ...f, month: null }))}>ທຸກໆເດືອນ</DropdownMenuItem>
                                        {months.map(month => (
                                            <DropdownMenuItem key={month.value} onClick={() => setFilter(f => ({ ...f, month: month.value }))}>{month.label}</DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button variant="ghost" onClick={() => setFilter({ year: null, month: null })}>ລ້າງຕົວກອງ</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {sortedGroupedSales.length > 0 ? (
                           <Accordion type="multiple" className="w-full space-y-2">
                            {sortedGroupedSales.map(group => (
                                <AccordionItem value={group.date.toISOString()} key={group.date.toISOString()} className="border-none">
                                    <AccordionTrigger className="bg-muted/50 p-3 rounded-md hover:no-underline font-semibold text-base">
                                        <div className="flex justify-between w-full pr-2">
                                            <h3>{format(group.date, 'EEEE, d MMMM yyyy', { locale: th })}</h3>
                                            <p className="text-sm text-muted-foreground">{group.sales.length} ທຸລະກຳ</p>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2">
                                         <Accordion type="single" collapsible>
                                            {group.sales.map(sale => (
                                                <AccordionItem value={sale.id} key={sale.id} className="border-b last:border-b-0">
                                                    <AccordionTrigger className="p-3 hover:bg-muted/30 hover:no-underline">
                                                        <div className="flex items-center justify-between w-full">
                                                            <div className="flex flex-col text-left">
                                                                <span className="text-sm">ຍອດຂາຍ: <span className="font-mono">{formatCurrency(sale.subtotal)} LAK</span></span>
                                                                <span className="text-sm text-green-600">ກຳໄລ: <span className="font-mono">{formatCurrency(sale.totalProfit || 0)} LAK</span></span>
                                                            </div>
                                                            <div className='flex items-center gap-2'>
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>ທ່ານແນ່ໃຈບໍ່?</AlertDialogTitle>
                                                                            <AlertDialogDescription>ການກະທຳນີ້ຈະລຶບການຂາຍ ແລະ ສົ່ງສິນຄ້າຄືນສູ່ສະຕັອກ. ບໍ່ສາມາດຍົກເລີກໄດ້.</AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>ຍົກເລີກ</AlertDialogCancel>
                                                                            <AlertDialogAction onClick={(e) => handleDeleteSale(e, sale.id)}>ລຶບ</AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                                {/* Dynamic link will be added later if needed */}
                                                                {/* <Button variant="ghost" size="icon" asChild>
                                                                    <Link href={`/autoparts/reports/sales/${sale.id}`} onClick={(e) => e.stopPropagation()}>
                                                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                                    </Link>
                                                                </Button> */}
                                                            </div>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="p-4 bg-white">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>ສິນຄ້າ</TableHead>
                                                                    <TableHead className="text-center">ຈຳນວນ</TableHead>
                                                                    <TableHead className="text-right">ຕົ້ນທຶນ</TableHead>
                                                                    <TableHead className="text-right">ລາຄາຕໍ່ໜ່ວຍ</TableHead>
                                                                    <TableHead className="text-right">ລາຄາລວມ</TableHead>
                                                                    <TableHead className="text-right">ກຳໄລ</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {sale.items.map((item, index) => {
                                                                    const itemProfit = (item.price * item.quantity) - (item.costPrice * item.quantity);
                                                                    return (
                                                                        <TableRow key={index}>
                                                                            <TableCell className="font-medium">{item.name}</TableCell>
                                                                            <TableCell className="text-center">{item.quantity}</TableCell>
                                                                            <TableCell className="text-right">{formatCurrency(item.costPrice || 0)}</TableCell>
                                                                            <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                                                            <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                                                                            <TableCell className="text-right font-medium text-green-600">{formatCurrency(itemProfit)}</TableCell>
                                                                        </TableRow>
                                                                    )
                                                                })}
                                                            </TableBody>
                                                        </Table>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                            </Accordion>
                        ) : (
                            <div className="text-center text-muted-foreground py-16">
                                ບໍ່ມີຂໍ້ມູນການຂາຍໃນຊ່ວງເວລາທີ່ເລືອກ
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
