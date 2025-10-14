

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    categories: string[];
    onAddItem: (item: Omit<StockItem, 'id' | 'createdAt'>) => void;
    onUpdateItem: (id: string, updatedFields: Partial<StockItem>) => void;
    onDeleteItem: (id: string) => void;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
}

export function StockTable({ data, categories, onAddItem, onUpdateItem, onDeleteItem, searchQuery, onSearchQueryChange }: StockTableProps) {
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
                partCode: '',
                partName: '',
                category: '',
                quantity: 0,
                price: 0
            });
        }
        setDialogOpen(true);
    };

    const handleSave = () => {
        if (isEdit && currentItem.id) {
            onUpdateItem(currentItem.id, currentItem);
        } else {
            onAddItem(currentItem as Omit<StockItem, 'id' | 'createdAt'>);
        }
        setDialogOpen(false);
    };

    const handleCategoryChange = (value: string) => {
        if (value === 'add_new_category') {
            const newCategory = prompt('ກະລຸນາໃສ່ຊື່ໝວດໝູ່ໃໝ່:');
            if (newCategory) {
                setCurrentItem({ ...currentItem, category: newCategory });
            }
        } else {
            setCurrentItem({ ...currentItem, category: value });
        }
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ລະຫັດສິ້ນສ່ວນ</TableHead>
                            <TableHead>ຊື່ສິ້ນສ່ວນ</TableHead>
                            <TableHead>ໝວດໝູ່</TableHead>
                            <TableHead className="text-right">ລາຄາຂາຍ</TableHead>
                            <TableHead className="text-right">ຈຳນວນຄົງເຫຼືອ</TableHead>
                            <TableHead>ສະຖານະ</TableHead>
                            <TableHead className="text-right">ຈັດການ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length > 0 ? data.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.partCode}</TableCell>
                                <TableCell>{item.partName}</TableCell>
                                <TableCell>{item.category}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                <TableCell className="text-right font-medium">{item.quantity.toLocaleString('lo-LA')}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(item)}`}>
                                        {getStockStatus(item)}
                                    </span>
                                </TableCell>
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
                                <TableCell colSpan={7} className="h-24 text-center">
                                    ບໍ່ພົບຂໍ້ມູນສິນຄ້າ
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>

             <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{isEdit ? 'ແກ້ໄຂຂໍ້ມູນສິນຄ້າ' : 'ເພີ່ມສິນຄ້າໃໝ່'}</DialogTitle>
                        <DialogDescription>
                            {isEdit ? 'ອັບເດດລາຍລະອຽດຂອງສິນຄ້າໃນຄັງ' : 'ກະລຸນາຕື່ມຂໍ້ມູນເພື່ອເພີ່ມສິນຄ້າໃໝ່ເຂົ້າຄັງ'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="partCode" className="text-right">ລະຫັດສິ້ນສ່ວນ</Label>
                            <Input id="partCode" value={currentItem.partCode || ''} onChange={e => setCurrentItem({...currentItem, partCode: e.target.value.toUpperCase()})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="partName" className="text-right">ຊື່ສິ້ນສ່ວນ</Label>
                            <Input id="partName" value={currentItem.partName || ''} onChange={e => setCurrentItem({...currentItem, partName: e.target.value})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                             <Label htmlFor="category" className="text-right">ໝວດໝູ່</Label>
                             <Select
                                value={currentItem.category || ''}
                                onValueChange={handleCategoryChange}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="ເລືອກໝວດໝູ່" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.filter(Boolean).map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                    <SelectItem value="add_new_category" className="text-blue-600 font-semibold">
                                        + ເພີ່ມໝວດໝູ່ໃໝ່
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="quantity" className="text-right">ຈຳນວນ</Label>
                            <Input id="quantity" type="number" value={currentItem.quantity ?? ''} onChange={e => setCurrentItem({...currentItem, quantity: Number(e.target.value)})} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">ລາຄາຂາຍ</Label>
                            <Input id="price" type="number" value={currentItem.price ?? ''} onChange={e => setCurrentItem({...currentItem, price: Number(e.target.value)})} className="col-span-3" />
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

    
