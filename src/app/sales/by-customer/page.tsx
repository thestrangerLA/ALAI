
'use client';

import { useState, useEffect, useMemo } from 'react';
import { listenToSales } from '@/services/salesService';
import { listenToDebtors } from '@/services/debtorService';
import type { Sale, Debtor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from 'next/link';
import { ArrowLeft, Users, Eye } from 'lucide-react';
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
    const [selectedTransaction, setSelectedTransaction] = useState<Sale | Debtor | null>(null);

    useEffect(() => {
        const unsubscribeSales = listenToSales(setAllSales);
        const unsubscribeDebtors = listenToDebtors(setAllDebtors);
        return () => {
            unsubscribeSales();
            unsubscribeDebtors();
        };
    }, []);

    const customerReports = useMemo(() => {
        const reports: Record<string, CustomerReport> = {};

        const allTransactions = [...allSales, ...allDebtors];

        allTransactions.forEach(transaction => {
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
        
        // Sort transactions for each customer by date
        for (const customer in reports) {
            reports[customer].transactions.sort((a, b) => b.saleDate.toMillis() - a.saleDate.toMillis());
        }

        return Object.entries(reports).sort(([nameA], [nameB]) => nameA.localeCompare(nameB));

    }, [allSales, allDebtors]);

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
                     <Card>
                        <CardHeader>
                            <CardTitle>ສະຫຼຸບຂໍ້ມູນລູກຄ້າ</CardTitle>
                            <CardDescription>
                                ພົບລູກຄ້າທັງໝົດ {customerReports.length} ຄົນທີ່ມີປະຫວັດການຊື້.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {customerReports.length > 0 ? (
                                <Accordion type="multiple" className="w-full">
                                    {customerReports.map(([name, report]) => (
                                        <AccordionItem value={name} key={name}>
                                            <AccordionTrigger>
                                                <div className='flex justify-between w-full pr-4 items-center'>
                                                    <div className="text-left">
                                                        <p className="text-lg font-semibold">{name}</p>
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
                                            <AccordionContent>
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
                                                                <TableCell className="text-right">{formatCurrency(tx.totalAmount)}</TableCell>
                                                                <TableCell className="text-center">
                                                                    <Button variant="outline" size="sm" onClick={() => setSelectedTransaction(tx)}>
                                                                        <Eye className="h-4 w-4 mr-1"/> ເບິ່ງ
                                                                    </Button>
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
                                 <div className="h-24 text-center content-center">-- ຍັງບໍ່ມີຂໍ້ມູນການຂາຍ --</div>
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

