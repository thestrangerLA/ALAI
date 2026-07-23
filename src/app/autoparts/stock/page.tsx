
"use client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DollarSign, Package, Wrench } from "lucide-react"
import type { StockItem } from "@/lib/types"
import { StatCard } from "@/components/stat-card"
import { StockTable } from "@/components/stock-table"
import { useState, useEffect } from "react"
import { listenToAutoPartsStockItems, addAutoPartsStockItem, updateAutoPartsStockItem, deleteAutoPartsStockItem } from '@/services/autoPartsStockService'
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AutoPartsStockPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubscribe = listenToAutoPartsStockItems(setStockItems);
    return () => unsubscribe();
  }, []);

  const handleAddItem = async (newItem: Omit<StockItem, 'id'>) => {
    await addAutoPartsStockItem(newItem);
  };

  const handleUpdateItem = async (id: string, updatedFields: Partial<StockItem>) => {
    await updateAutoPartsStockItem(id, updatedFields);
  };

  const handleDeleteItem = async (id: string) => {
    await deleteAutoPartsStockItem(id);
  };

  const totalValueKip = stockItems.reduce((acc, item) => {
    return acc + item.currentStock * item.costPrice;
  }, 0);

  const categories = [...new Set(stockItems.map(item => item.category))];

  const filteredStockItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (value: number, currency: 'Kip' | 'Baht') => {
    const currencySymbol = currency === 'Kip' ? ' ກີບ' : ' ບາດ';
    return new Intl.NumberFormat('lo-LA', { minimumFractionDigits: 0 }).format(value) + currencySymbol;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
            <Link href="/autoparts">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">ກັບໄປໜ້າຫຼັກ</span>
            </Link>
        </Button>
        <div className="flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight font-headline">ຈັດການສະຕັອກອາໄຫຼລົດ</h1>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <StatCard 
                title="ມູນຄ່າສະຕັອກທັງໝົດ (ກີບ)"
                value={formatCurrency(totalValueKip, 'Kip')}
                icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                description="ມູນຄ່າໂດຍປະມານຂອງສິນຄ້າທັງໝົດໃນສະກຸນເງິນກີບ"
            />
             <StatCard 
                title="ສິນຄ້າທັງໝົດ"
                value={stockItems.length.toString()}
                icon={<Package className="h-4 w-4 text-muted-foreground" />}
                description="ຈຳນວນລາຍການສິນຄ້າໃນສະຕັອກ"
            />
        </div>
        <div className="grid grid-cols-1">
            <StockTable 
              data={filteredStockItems} 
              categories={categories}
              onAddItem={handleAddItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
            />
        </div>
      </main>
    </div>
  )
}
