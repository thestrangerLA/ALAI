
'use client';

import type { Sale } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from './ui/button';
import { Printer } from 'lucide-react';

interface InvoiceDetailsDialogProps {
  sale: Sale;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  showProfit?: boolean;
}

export function InvoiceDetailsDialog({ sale, isOpen, onOpenChange, showProfit = false }: InvoiceDetailsDialogProps) {

  const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return '0 ₭';
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(value);
  };
  
  const handlePrint = () => {
    // A bit of a hack to print the dialog content
    const printContents = document.getElementById('invoice-details-content')?.innerHTML;
    const originalContents = document.body.innerHTML;
    if (printContents) {
        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
        // We need to reload to re-attach React components and event listeners
        window.location.reload();
    }
  }

  const calculateTotalProfit = () => {
      if (!showProfit) return 0;
      return sale.items.reduce((totalProfit, item) => {
          const costPrice = item.costPrice || 0;
          const profitPerItem = (item.price * item.sellQuantity) - (costPrice * item.sellQuantity);
          return totalProfit + profitPerItem;
      }, 0);
  };
  
  const calculateTotalCost = () => {
      if (!showProfit) return 0;
      return sale.items.reduce((total, item) => {
          const costPrice = item.costPrice || 0;
          return total + (costPrice * item.sellQuantity);
      }, 0);
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl" id="invoice-details-content">
        <DialogHeader>
          <DialogTitle>ລາຍລະອຽດໃບເກັບເງິນ</DialogTitle>
          <DialogDescription>
             ທົບທວນລາຍລະອຽດຂອງການຂາຍສຳລັບ Invoice #{sale.invoiceNumber}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <div className="flex justify-between items-center mb-6 p-4 bg-slate-50 rounded-lg">
                <div>
                    <p><strong>ຊື່ລູກຄ້າ:</strong> {sale.customerName || 'ບໍ່ໄດ້ລະບຸ'}</p>
                    <p><strong>ເລກທີ່ Invoice:</strong> {sale.invoiceNumber}</p>
                </div>
                <div className="text-right">
                    <p><strong>ວັນທີຂາຍ:</strong> {sale.saleDate.toDate().toLocaleDateString('lo-LA')}</p>
                    <p><strong>ເວລາ:</strong> {sale.saleDate.toDate().toLocaleTimeString('lo-LA')}</p>
                </div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ລາຍການ</TableHead>
                        <TableHead className="text-center">ຈຳນວນ</TableHead>
                        <TableHead>ປະເພດລາຄາ</TableHead>
                        {showProfit && <TableHead className="text-right">ຕົ້ນທຶນ/ໜ່ວຍ</TableHead>}
                        <TableHead className="text-right">ລາຄາຂາຍ/ໜ່ວຍ</TableHead>
                        {showProfit && <TableHead className="text-right">ຕົ້ນທຶນລວມ</TableHead>}
                        <TableHead className="text-right">ຍອດຂາຍລວມ</TableHead>
                        {showProfit && <TableHead className="text-right">ກຳໄລ</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sale.items.map((item, index) => {
                        const costPrice = item.costPrice || 0;
                        const totalCost = costPrice * item.sellQuantity;
                        const totalSell = item.price * item.sellQuantity;
                        const profit = totalSell - totalCost;
                        
                        return (
                            <TableRow key={`${item.id}-${index}`}>
                                <TableCell>{item.productName} ({item.productCode})</TableCell>
                                <TableCell className="text-center">{item.sellQuantity}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.priceType === 'sell' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                        {item.priceType === 'sell' ? 'ຂາຍ' : 'ສົ່ງ'}
                                    </span>
                                </TableCell>
                                {showProfit && <TableCell className="text-right">{formatCurrency(costPrice)}</TableCell>}
                                <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                {showProfit && <TableCell className="text-right">{formatCurrency(totalCost)}</TableCell>}
                                <TableCell className="text-right">{formatCurrency(totalSell)}</TableCell>
                                {showProfit && <TableCell className="text-right font-medium text-blue-600">{formatCurrency(profit)}</TableCell>}
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            <div className="mt-6 flex justify-end">
                <div className="w-full max-w-md space-y-2 text-right">
                     <div className="flex justify-between items-center text-lg">
                        <span>ຍອດຂາຍລວມທັງໝົດ:</span>
                        <span className="font-bold">{formatCurrency(sale.totalAmount)}</span>
                    </div>
                     {showProfit && (
                        <>
                            <div className="flex justify-between items-center text-lg text-red-600">
                                <span>ຕົ້ນທຶນລວມ:</span>
                                <span className="font-bold">{formatCurrency(calculateTotalCost())}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg text-blue-700 border-t pt-2 mt-2">
                                <span>ກຳໄລລວມ:</span>
                                <span className="font-bold">{formatCurrency(calculateTotalProfit())}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
             <div className="mt-8 flex justify-end gap-2 no-print">
                <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>ພິມຄືນ</Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
