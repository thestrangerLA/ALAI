'use client';

import type { Sale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Trash2 } from 'lucide-react';

interface SalesHistoryTableProps {
  sales: Sale[];
  onViewDetails: (sale: Sale) => void;
  onDelete: (sale: Sale) => void;
}

export function SalesHistoryTable({ sales, onViewDetails, onDelete }: SalesHistoryTableProps) {

  const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return '0 ₭';
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(value);
  };
  
  const calculateProfit = (sale: Sale): number => {
    return sale.items.reduce((totalProfit, item) => {
        const costPrice = item.costPrice || 0;
        const profitPerItem = (item.price * item.sellQuantity) - (costPrice * item.sellQuantity);
        return totalProfit + profitPerItem;
    }, 0);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ເລກທີ່ Invoice</TableHead>
          <TableHead>ຊື່ລູກຄ້າ</TableHead>
          <TableHead>ເວລາ</TableHead>
          <TableHead className="text-right">ຍອດລວມ</TableHead>
          <TableHead className="text-right">ກຳໄລ</TableHead>
          <TableHead className="text-center">ຈັດການ</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.map(sale => (
          <TableRow key={sale.id}>
            <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
            <TableCell>{sale.customerName || '-'}</TableCell>
            <TableCell>{sale.saleDate.toDate().toLocaleTimeString('lo-LA')}</TableCell>
            <TableCell className="text-right">{formatCurrency(sale.totalAmount)}</TableCell>
            <TableCell className="text-right font-medium text-blue-600">{formatCurrency(calculateProfit(sale))}</TableCell>
            <TableCell className="text-center space-x-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onViewDetails(sale)}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">ເບິ່ງ</span>
              </Button>
              <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => onDelete(sale)}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">ລຶບ</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
