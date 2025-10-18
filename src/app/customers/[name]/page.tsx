
'use client';

import { useState, useEffect, useMemo } from 'react';
import { listenToSales } from '@/services/salesService';
import { listenToDebtors, markAsPaid } from '@/services/debtorService';
import { deleteTransaction } from '@/services/transactionService';
import type { Sale, Debtor, Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/stat-card';
import Link from 'next/link';
import { ArrowLeft, User, DollarSign, CheckCircle, Eye, ShoppingCart, Trash2 } from 'lucide-react';
import { InvoiceDetailsDialog } from '@/components/invoice-details-dialog';
import { getAllCustomers } from '@/services/customerService';

export async function generateStaticParams() {
  const customers = await getAllCustomers();
  return customers.map((customer) => ({
    name: encodeURIComponent(customer.name),
  }));
}

export default function CustomerDetailPage({ params }: { params: { name: string } }) {
    const customerName = decodeURIComponent(params.name);
    const [allSales, setAllSales] = useState<Sale[]>([]);
    const [allDebtors, setAllDebtors] = useState<Debtor[]>([]);
    const [selectedTransaction, setSelectedTransaction] = useState<Sale | Debtor | null>(null);
    const [customerTransactions, setCustomerTransactions] = useState<(Sale | Debtor)[]>([]);

    useEffect(() => {
        const unsubscribeSales = listenToSales(setAllSales);
        const unsubscribeDebtors = listenToDebtors(setAllDebtors);
        return () => {
            unsubscribeSales();
            unsubscribeDebtors();
        };
    }, []);

    useEffect(() => {
        const filtered = [...allSales, ...allDebtors].filter(
            tx => (tx.customerName || 'ບໍ່ໄດ້ລະບຸຊື່') === customerName
        );
        filtered.sort((a, b) => b.saleDate.toMillis() - a.saleDate.toMillis());
        setCustomerTransactions(filtered);
    }, [customerName, allSales, allDebtors]);

    const stats = useMemo(() => {
        let totalSpent = 0;
        let totalDebt = 0;
        let paidInvoices = 0;
        let unpaidInvoices = 0;

        customerTransactions.forEach(tx => {
            if (tx.status === 'paid') {
                totalSpent += tx.totalAmount;
                paidInvoices++;
            } else {
                totalDebt += tx.totalAmount;
                unpaidInvoices++;
            }
        });

        return { totalSpent, totalDebt, paidInvoices, unpaidInvoices };
    }, [customerTransactions]);

    const handleMarkAsPaid = async (debtor: Debtor) => {
        if (window.confirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການບັນທຶກການຈ່າຍເງິນສຳລັບ Invoice #${debtor.invoiceNumber}?`)) {
            const result = await markAsPaid(debtor);
            alert(result.message);
        }
    };
    
    const handleDeleteTransaction = async (transaction: Sale | Debtor) => {
        if (window.confirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບທຸລະກຳ #${transaction.invoiceNumber}? ການກະທຳນີ້ຈະສົ່ງສິນຄ້າຄືນສະຕັອກ ແລະ ບໍ່ສາມາດຍົກເລີກໄດ້.`)) {
            try {
                await deleteTransaction(transaction);
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

    return (
        <>
            <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-indigo-50 to-purple-100">
                <header className="bg-white shadow-md sticky top-0 z-30 flex h-20 items-center gap-4 border-b px-4 sm:px-6">
                    <Button variant="outline" size="icon" className="h-10 w-10" asChild>
                        <Link href="/sales/by-customer">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">ກັບໄປໜ້າລາຍງານລູກຄ້າ</span>
                        </Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500 p-3 rounded-lg">
                            <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{customerName}</h1>
                            <p className="text-sm text-muted-foreground">ປະຫວັດການຊື້ ແລະ ໜີ້ຄ້າງຊຳລະ</p>
                        </div>
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-8 md:gap-8">
                     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="ຍອດຊື້ລວມ (ຈ່າຍແລ້ວ)"
                            value={formatCurrency(stats.totalSpent)}
                            icon={<DollarSign className="h-5 w-5 text-green-500" />}
                            description={`ຈາກ ${stats.paidInvoices} ບິນ`}
                        />
                        <StatCard
                            title="ຍອດໜີ້ຄ້າງຊຳລະ"
                            value={formatCurrency(stats.totalDebt)}
                            icon={<DollarSign className="h-5 w-5 text-red-500" />}
                            description={`ຈາກ ${stats.unpaidInvoices} ບິນ`}
                        />
                         <StatCard
                            title="ຈຳນວນທຸລະກຳທັງໝົດ"
                            value={`${customerTransactions.length} ລາຍການ`}
                            icon={<ShoppingCart className="h-5 w-5 text-blue-500" />}
                        />
                    </div>
                     <Card>
                        <CardHeader>
                            <CardTitle>ລາຍການທຸລະກຳທັງໝົດ</CardTitle>
                            <CardDescription>
                                ລາຍການທັງໝົດທີ່ {customerName} ໄດ້ຊື້ ຫຼື ຕິດໜີ້.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           {customerTransactions.length > 0 ? (
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
                                    {customerTransactions.map(tx => (
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
                                                 <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteTransaction(tx)}>
                                                    <Trash2 className="h-4 w-4"/>
                                                    <span className="sr-only">ລຶບ</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                           ) : (
                                <div className="h-24 text-center content-center">-- ບໍ່ພົບຂໍ້ມູນທຸລະກຳ --</div>
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
