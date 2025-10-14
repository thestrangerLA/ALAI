
'use client';

import { useState, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { StockItem, InvoiceItem as InvoiceItemType } from '@/lib/types';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Trash2, Search, Printer, RotateCcw, Save } from 'lucide-react';

interface InvoiceFormProps {
  allItems: StockItem[];
  onSave: (invoiceData: any) => void;
}

export interface InvoiceFormHandle {
  resetForm: () => void;
}

export const InvoiceForm = forwardRef<InvoiceFormHandle, InvoiceFormProps>(({ allItems, onSave }, ref) => {
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  const generateNewInvoiceNumber = () => {
    setInvoiceNumber(`INV-${Date.now()}`);
  }

  useEffect(() => {
    generateNewInvoiceNumber();
  }, []);

  useImperativeHandle(ref, () => ({
    resetForm() {
      handleReset();
    }
  }));

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.length > 0) {
        const results = allItems.filter(
          item =>
            item.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.partCode.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5); // Limit results to 5 for performance
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, allItems]);
  
  const handleAddItem = (item: StockItem, selectedPrice: number) => {
    setInvoiceItems(prev => {
      const existingItem = prev.find(i => i.id === item.id);
      if (existingItem) {
        return prev.map(i =>
          i.id === item.id ? { ...i, sellQuantity: i.sellQuantity + 1, price: selectedPrice } : i
        );
      } else {
        // Create a new invoice item, overriding the default price with the selected one
        const newItem: InvoiceItemType = { 
          ...item, 
          sellQuantity: 1,
          price: selectedPrice // Set the price to the one chosen by the user
        };
        return [...prev, newItem];
      }
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    setInvoiceItems(prev =>
      prev.map(i => (i.id === id ? { ...i, sellQuantity: Math.max(0, quantity) } : i))
    );
  };

  const handleRemoveItem = (id: string) => {
    setInvoiceItems(prev => prev.filter(i => i.id !== id));
  };
  
  const handlePrint = () => {
    window.print();
  }
  
  const handleReset = () => {
    setInvoiceItems([]);
    setCustomerName('');
    generateNewInvoiceNumber();
    setInvoiceDate(new Date().toISOString().split('T')[0]);
  }

  const handleSave = () => {
    if (invoiceItems.length === 0) {
      alert("Please add items to the invoice before saving.");
      return;
    }
    const saleData = {
      invoiceNumber,
      customerName,
      saleDate: new Date(invoiceDate),
      items: invoiceItems.map(item => ({
        ...item,
        sellQuantity: item.sellQuantity
      })),
      totalAmount,
    };
    onSave(saleData);
  }

  const totalAmount = useMemo(() => {
    return invoiceItems.reduce((sum, item) => sum + item.price * item.sellQuantity, 0);
  }, [invoiceItems]);

  const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return '0 ₭';
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(value);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
        <div className="lg:col-span-2">
           <Card>
            <CardHeader>
                <CardTitle>ເພີ່ມລາຍການສິນຄ້າ</CardTitle>
                <CardDescription>ຄົ້ນຫາ ແລະ ເພີ່ມສິນຄ້າເຂົ້າໃນໃບເກັບເງິນ</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="ຄົ້ນຫາສິນຄ້າ (ລະຫັດ, ຊື່)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10"
                    />
                    {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                        {searchResults.map(item => (
                        <div
                            key={item.id}
                            className="p-3 hover:bg-gray-100 border-b"
                        >
                            <p className="font-semibold">{item.partName} ({item.partCode})</p>
                            <p className="text-sm text-gray-500">ຄົງເຫຼືອ: {item.quantity}</p>
                            <div className="flex gap-2 mt-2">
                                <Button size="sm" variant="outline" onClick={() => handleAddItem(item, item.wholesalePrice)}>
                                  ລາຄາສົ່ງ: {formatCurrency(item.wholesalePrice)}
                                </Button>
                                <Button size="sm" onClick={() => handleAddItem(item, item.price)}>
                                  ລາຄາຍ່ອຍ: {formatCurrency(item.price)}
                                </Button>
                            </div>
                        </div>
                        ))}
                    </div>
                    )}
                </div>
            </CardContent>
           </Card>
        </div>
        <div className="lg:col-span-1 flex flex-col gap-4">
             <Card>
                <CardHeader>
                    <CardTitle>ຂໍ້ມູນໃບເກັບເງິນ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">ຊື່ລູກຄ້າ:</label>
                        <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder=".................." />
                    </div>
                     <div>
                        <label className="text-sm font-medium">ວັນທີ:</label>
                        <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                    </div>
                     <div>
                        <label className="text-sm font-medium">ເລກທີ່ Invoice:</label>
                        <Input value={invoiceNumber} readOnly disabled />
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    
      <div id="receipt-content">
        <Card className="print-only:shadow-none print-only:border-none">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold">ໃບເກັບເງິນ / INVOICE</h2>
                    </div>
                    <div className="text-right">
                         <p><strong>ເລກທີ່:</strong> {invoiceNumber}</p>
                         <p><strong>ວັນທີ:</strong> {new Date(invoiceDate).toLocaleDateString('lo-LA')}</p>
                    </div>
                </div>
                 <div className="mt-4">
                    <p><strong>ຊື່ລູກຄ້າ:</strong> {customerName || '..................'}</p>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">ລຳດັບ</TableHead>
                            <TableHead>ລາຍການ</TableHead>
                            <TableHead className="text-center">ຈຳນວນ</TableHead>
                            <TableHead>ໜ່ວຍ</TableHead>
                            <TableHead className="text-right">ລາຄາ/ໜ່ວຍ</TableHead>
                            <TableHead className="text-right">ລວມເງິນ</TableHead>
                            <TableHead className="w-[50px] no-print"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoiceItems.length > 0 ? invoiceItems.map((item, index) => (
                            <TableRow key={item.id}>
                                <TableCell className="text-center">{index + 1}</TableCell>
                                <TableCell>{item.partName} ({item.partCode})</TableCell>
                                <TableCell className="text-center w-24">
                                     <Input 
                                        type="number" 
                                        value={item.sellQuantity} 
                                        onChange={e => handleQuantityChange(item.id, parseInt(e.target.value))}
                                        className="w-20 text-center no-print"
                                     />
                                     <span className="print-only">{item.sellQuantity}</span>
                                </TableCell>
                                <TableCell>ອັນ</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.price * item.sellQuantity)}</TableCell>
                                <TableCell className="no-print">
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500"/>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">-- ຍັງບໍ່ມີລາຍການ --</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <div className="mt-6 flex justify-end">
                    <div className="w-full max-w-sm space-y-2 text-right">
                        <div className="flex justify-between items-center text-xl font-bold">
                            <span>ລວມເປັນເງິນທັງໝົດ:</span>
                            <span>{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 flex justify-end gap-2 no-print">
        <Button variant="outline" onClick={handleReset}><RotateCcw className="mr-2 h-4 w-4"/>ລ້າງລາຍການ</Button>
        <Button onClick={handlePrint} disabled={invoiceItems.length === 0}><Printer className="mr-2 h-4 w-4"/>ພິມໃບເກັບເງິນ</Button>
        <Button onClick={handleSave} disabled={invoiceItems.length === 0} className="bg-green-600 hover:bg-green-700 text-white"><Save className="mr-2 h-4 w-4"/>ບັນທຶກການຂາຍ</Button>
      </div>
    </>
  );
});

InvoiceForm.displayName = 'InvoiceForm';

    