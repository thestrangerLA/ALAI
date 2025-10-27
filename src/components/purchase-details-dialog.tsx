
'use client';

import type { Purchase } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PurchaseDetailsDialogProps {
  purchase: Purchase;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function PurchaseDetailsDialog({ purchase, isOpen, onOpenChange }: PurchaseDetailsDialogProps) {

  const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return '0 ₭';
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>ລາຍລະອຽດການຊື້ສິນຄ້າ</DialogTitle>
          <DialogDescription>
             ທົບທວນລາຍລະອຽດຂອງການຊື້ສິນຄ້າເຂົ້າຮ້ານ.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <div className="flex justify-between items-center mb-6 p-4 bg-slate-50 rounded-lg">
                <div>
                    <p><strong>ຜູ້ສະໜອງ:</strong> {purchase.supplierName || 'ບໍ່ໄດ້ລະບຸ'}</p>
                </div>
                <div className="text-right">
                    <p><strong>ວັນທີຊື້:</strong> {purchase.purchaseDate.toDate().toLocaleDateString('lo-LA')}</p>
                    <p><strong>ເວລາ:</strong> {purchase.purchaseDate.toDate().toLocaleTimeString('lo-LA')}</p>
                </div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ລາຍການ</TableHead>
                        <TableHead className="text-center">ຈຳນວນ</TableHead>
                        <TableHead className="text-right">ຕົ້ນທຶນ/ໜ່ວຍ</TableHead>
                        <TableHead className="text-right">ຕົ້ນທຶນລວມ</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {purchase.items.map((item, index) => (
                        <TableRow key={`${item.id}-${index}`}>
                            <TableCell>{item.productName} ({item.productCode})</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.costPrice)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.costPrice * item.quantity)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <div className="mt-6 flex justify-end">
                <div className="w-full max-w-sm space-y-2 text-right">
                     <div className="flex justify-between items-center text-lg font-bold">
                        <span>ຍອດລວມທັງໝົດ:</span>
                        <span>{formatCurrency(purchase.totalAmount)}</span>
                    </div>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
