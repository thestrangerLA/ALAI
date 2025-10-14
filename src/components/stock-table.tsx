
'use client';
import { useState } from "react";
import type { StockItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, MoreHorizontal, FilePen, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface StockTableProps {
    data: StockItem[];
    onAddItem: (item: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onUpdateItem: (id: string, updatedFields: Partial<StockItem>) => void;
    onDeleteItem: (id: string) => void;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
}

export function StockTable({ data, onAddItem, onUpdateItem, onDeleteItem, searchQuery, onSearchQueryChange }: StockTableProps) {
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<StockItem>>({});

    const handleOpenDialog = (item?: StockItem) => {
        if (item) {
            setIsEdit(true);
            setCurrentItem(item);
        } else {
            setIsEdit(false);
            setCurrentItem({
                date: new Date().toISOString().split('T')[0],
                productCode: '',
                productName: '',
                quantity: 0,
                sellPrice: 0,
                costPrice: 0,
                note: '',
                supplier: ''
            });
        }
        setDialogOpen(true);
    };

    const handleSave = () => {
        if (isEdit && currentItem.id) {
            onUpdateItem(currentItem.id, currentItem);
        } else {
            const newItem: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'> = {
              date: currentItem.date || new Date().toISOString().split('T')[0],
              productCode: currentItem.productCode || '',
              productName: currentItem.productName || '',
              quantity: currentItem.quantity || 0,
              costPrice: currentItem.costPrice || 0,
              sellPrice: currentItem.sellPrice || 0,
              supplier: currentItem.supplier || '',
              note: currentItem.note || '',
            };
            onAddItem(newItem);
        }
        setDialogOpen(false);
    };

    const getStockStatus = (item: StockItem) => {
        if (item.quantity === 0) return 'ໝົດສະຕັອກ';
        return 'ປົກກະຕິ';
    };

    const getStatusClass = (item: StockItem) => {
        const status = getStockStatus(item);
        const statusClass: {[key: string]: string} = {
            'ປົກກະຕິ': 'bg-green-100 text-green-800',
            'ໝົດສະຕັອກ': 'bg-red-100 text-red-800'
        };
        return statusClass[status];
    };

    const formatCurrency = (value?: number) => {
        if (typeof value !== 'number') return 'N/A';
        return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(value);
    }
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>ລາຍການສິນຄ້າໃນຄັງ</CardTitle>
                        <CardDescription>
                            ພົບສິນຄ້າທັງໝົດ {data.length} ລາຍການ
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                         <Input
                            placeholder="ຄົ້ນຫາສິນຄ້າ (ລະຫັດ, ຊື່)..."
                            value={searchQuery}
                            onChange={(e) => onSearchQueryChange(e.target.value)}
                            className="w-full max-w-sm"
                        />
                        <Button onClick={() => handleOpenDialog()} className="whitespace-nowrap">
                            <PlusCircle className="mr-2 h-4 w-4" /> ເພີ່ມສິນຄ້າໃໝ່
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table className="table-fixed w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[10%]">ລະຫັດສິນຄ້າ</TableHead>
                            <TableHead className="w-[25%]">ຊື່ສິນຄ້າ</TableHead>
                            <TableHead className="w-[12%] text-right">ລາຄາຕົ້ນທຶນ</TableHead>
                            <TableHead className="w-[12%] text-right">ລາຄາຂາຍ</TableHead>
                            <TableHead className="w-[10%] text-right">ຈຳນວນຄົງເຫຼືອ</TableHead>
                            <TableHead className="w-[10%]">ສະຖານະ</TableHead>
                            <TableHead className="w-[12%]">ຜູ້ສະໜອງ</TableHead>
                            <TableHead className="w-[9%] text-right">ຈັດການ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length > 0 ? data.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium truncate">{item.productCode}</TableCell>
                                <TableCell className="truncate">{item.productName}</TableCell>
                                <TableCell className="text-right whitespace-nowrap">{formatCurrency(item.costPrice)}</TableCell>
                                <TableCell className="text-right whitespace-nowrap">{formatCurrency(item.sellPrice)}</TableCell>
                                <TableCell className="text-right font-medium">{item.quantity.toLocaleString('lo-LA')}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(item)}`}>
                                        {getStockStatus(item)}
                                    </span>
                                </TableCell>
                                <TableCell className="truncate">{item.supplier}</TableCell>
                                <TableCell className="text-right">
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenDialog(item)}>
                                            <FilePen className="mr-2 h-4 w-4" />
                                            <span>ແກ້ໄຂ</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onDeleteItem(item.id)} className="text-red-600">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>ລົບ</span>
                                        </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )) : (
                             <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    ບໍ່ພົບຂໍ້ມູນສິນຄ້າ
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>

             <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{isEdit ? 'ແກ້ໄຂຂໍ້ມູນສິນຄ້າ' : 'ເພີ່ມສິນຄ້າໃໝ່'}</DialogTitle>
                        <DialogDescription>
                            {isEdit ? 'ອັບເດດລາຍລະອຽດຂອງສິນຄ້າໃນຄັງ' : 'ກະລຸນາຕື່ມຂໍ້ມູນເພື່ອເພີ່ມສິນຄ້າໃໝ່ເຂົ້າຄັງ'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">ວັນທີ</Label>
                            <Input id="date" type="date" value={currentItem.date || ''} onChange={e => setCurrentItem({...currentItem, date: e.target.value})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="productCode" className="text-right">ລະຫັດສິນຄ້າ</Label>
                            <Input id="productCode" value={currentItem.productCode || ''} onChange={e => setCurrentItem({...currentItem, productCode: e.target.value.toUpperCase()})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="productName" className="text-right">ຊື່ສິນຄ້າ</Label>
                            <Input id="productName" value={currentItem.productName || ''} onChange={e => setCurrentItem({...currentItem, productName: e.target.value})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="quantity" className="text-right">ຈຳນວນ</Label>
                            <Input id="quantity" type="number" value={currentItem.quantity ?? ''} onChange={e => setCurrentItem({...currentItem, quantity: Number(e.target.value)})} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="costPrice" className="text-right">ລາຄາຕົ້ນທຶນ</Label>
                            <Input id="costPrice" type="number" value={currentItem.costPrice ?? ''} onChange={e => setCurrentItem({...currentItem, costPrice: Number(e.target.value)})} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="sellPrice" className="text-right">ລາຄາຂາຍ</Label>
                            <Input id="sellPrice" type="number" value={currentItem.sellPrice ?? ''} onChange={e => setCurrentItem({...currentItem, sellPrice: Number(e.target.value)})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="supplier" className="text-right">ຜູ້ສະໜອງ</Label>
                            <Input id="supplier" value={currentItem.supplier || ''} onChange={e => setCurrentItem({...currentItem, supplier: e.target.value})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="note" className="text-right">ໝາຍເຫດ</Label>
                            <Input id="note" value={currentItem.note || ''} onChange={e => setCurrentItem({...currentItem, note: e.target.value})} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">ຍົກເລີກ</Button>
                        </DialogClose>
                        <Button type="submit" onClick={handleSave}>ບັນທຶກ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
