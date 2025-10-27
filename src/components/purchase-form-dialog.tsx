
'use client';

import { useState, useMemo } from 'react';
import type { StockItem, Purchase, PurchaseItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from './ui/label';
import { Trash2, Search, Save } from 'lucide-react';

interface PurchaseFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (purchaseData: Omit<Purchase, 'id'>) => void;
  stockItems: StockItem[];
}

export function PurchaseFormDialog({ isOpen, onOpenChange, onSave, stockItems }: PurchaseFormDialogProps) {
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return stockItems.filter(
        item =>
          item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.productCode.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
  }, [searchQuery, stockItems]);
  
  const handleAddItem = (item: StockItem) => {
    setPurchaseItems(prev => {
        const existingItem = prev.find(i => i.id === item.id);
        if (existingItem) {
            // If item exists, maybe increase quantity or alert user
            alert("This item is already in the purchase list. You can edit the quantity directly.");
            return prev;
        }
        return [...prev, {
            id: item.id,
            productCode: item.productCode,
            productName: item.productName,
            quantity: 1,
            costPrice: item.costPrice, // Default to current cost price
        }];
    });
    setSearchQuery('');
  };

  const handleUpdateItem = (id: string, field: 'quantity' | 'costPrice', value: number) => {
    setPurchaseItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setPurchaseItems(prev => prev.filter(i => i.id !== id));
  };
  
  const totalAmount = useMemo(() => {
    return purchaseItems.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
  }, [purchaseItems]);

  const handleSave = () => {
    if (purchaseItems.length === 0) {
      alert('ກະລຸນາເພີ່ມລາຍການສິນຄ້າກ່ອນບັນທຶກ.');
      return;
    }
    const purchaseData = {
      supplierName,
      purchaseDate: new Date(purchaseDate),
      items: purchaseItems,
      totalAmount,
    };
    onSave(purchaseData);
    resetForm();
  };
  
  const resetForm = () => {
    setPurchaseItems([]);
    setSupplierName('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
  }
  
  const handleClose = (open: boolean) => {
    if (!open) {
        resetForm();
    }
    onOpenChange(open);
  }

  const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return '0 ₭';
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>ບັນທຶກການຊື້ສິນຄ້າໃໝ່</DialogTitle>
          <DialogDescription>
            ເພີ່ມປະຫວັດການຊື້ສິນຄ້າເຂົ້າຮ້ານ. ການບັນທຶກຈະອັບເດດຈຳນວນສິນຄ້າໃນຄັງອັດຕະໂນມັດ.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
                <Label htmlFor="supplier-name">ຊື່ຜູ້ສະໜອງ (Supplier)</Label>
                <Input id="supplier-name" value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="ປ້ອນຊື່ຜູ້ສະໜອງ (ຖ້າມີ)"/>
            </div>
            <div>
                <Label htmlFor="purchase-date">ວັນທີຊື້</Label>
                <Input id="purchase-date" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
            </div>
        </div>

        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
                placeholder="ຄົ້ນຫາສິນຄ້າເພື່ອເພີ່ມ (ລະຫັດ, ຊື່)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10"
            />
            {searchResults.length > 0 && (
             <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                {searchResults.map(item => (
                <div key={item.id} className="p-3 border-b last:border-b-0 hover:bg-slate-50 cursor-pointer" onClick={() => handleAddItem(item)}>
                    <p className="font-semibold">{item.productName} ({item.productCode})</p>
                    <p className="text-sm text-gray-500">ຕົ້ນທຶນປັດຈຸບັນ: {formatCurrency(item.costPrice)}</p>
                </div>
                ))}
            </div>
            )}
        </div>
        
        <div className="mt-4 max-h-64 overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ລາຍການ</TableHead>
                        <TableHead className="w-28">ຈຳນວນ</TableHead>
                        <TableHead className="w-40">ຕົ້ນທຶນ/ໜ່ວຍ</TableHead>
                        <TableHead className="w-40 text-right">ຕົ້ນທຶນລວມ</TableHead>
                        <TableHead className="w-12"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {purchaseItems.length > 0 ? purchaseItems.map(item => (
                        <TableRow key={item.id}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell>
                                <Input type="number" value={item.quantity} onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))} className="text-center" />
                            </TableCell>
                             <TableCell>
                                <Input type="number" value={item.costPrice} onChange={(e) => handleUpdateItem(item.id, 'costPrice', Number(e.target.value))} className="text-right" />
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.quantity * item.costPrice)}</TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                    <Trash2 className="h-4 w-4 text-red-500"/>
                                </Button>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">-- ຍັງບໍ່ມີລາຍການ --</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>

        <div className="mt-4 flex justify-end">
            <div className="text-xl font-bold">
                ຍອດລວມທັງໝົດ: {formatCurrency(totalAmount)}
            </div>
        </div>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button type="button" variant="secondary">ຍົກເລີກ</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            <Save className="mr-2 h-4 w-4"/> ບັນທຶກການຊື້
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
