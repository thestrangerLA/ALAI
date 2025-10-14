
'use client';

import { useState, useEffect, useMemo } from 'react';
import { listenToDebtors, markAsPaid } from '@/services/debtorService';
import type { Debtor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/stat-card';
import Link from 'next/link';
import { ArrowLeft, Users, DollarSign, CheckCircle } from 'lucide-react';
import { InvoiceDetailsDialog } from '@/components/invoice-details-dialog';

export default function DebtorsPage() {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);

  useEffect(() => {
    const unsubscribe = listenToDebtors(setDebtors);
    return () => unsubscribe();
  }, []);

  const totalDebt = useMemo(() => {
    return debtors.reduce((sum, debtor) => sum + debtor.totalAmount, 0);
  }, [debtors]);

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
        <div className="grid gap-4 md:grid-cols-2">
            <StatCard
                title="ຍອດໜີ້ລວມທັງໝົດ"
                value={formatCurrency(totalDebt)}
                icon={<DollarSign className="h-5 w-5 text-red-500" />}
                description={`ຈາກ ${debtors.length} ບິນທີ່ຍັງຄ້າງຊຳລະ`}
            />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>ລາຍການບິນທີ່ຍັງບໍ່ຈ່າຍ</CardTitle>
            <CardDescription>
              ກະລຸນາຕິດຕາມການຊຳລະເງິນຈາກລູກຄ້າ
            </CardDescription>
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
                {debtors.length > 0 ? debtors.map(debtor => (
                  <TableRow key={debtor.id}>
                    <TableCell>{debtor.saleDate.toDate().toLocaleDateString('lo-LA')}</TableCell>
                    <TableCell className="font-medium">{debtor.invoiceNumber}</TableCell>
                    <TableCell>{debtor.customerName || '-'}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">{formatCurrency(debtor.totalAmount)}</TableCell>
                    <TableCell className="text-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedDebtor(debtor)}>
                        ເບິ່ງລາຍລະອຽດ
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
