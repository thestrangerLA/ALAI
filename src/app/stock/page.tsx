
"use client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DollarSign, Package } from "lucide-react"
import type { StockItem } from "@/lib/types"
import { StatCard } from "@/components/stat-card"
import { StockTable } from "@/components/stock-table"
import { useState, useEffect } from "react"
import { useSearchParams } from 'next/navigation'
import { listenToStockItems, addStockItem, updateStockItem, deleteStockItem, seedInitialData } from "@/services/stockService"
import Link from "next/link"
import { ArrowLeft, HardHat } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function StockPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    // Seed data if inventory is empty
    seedInitialData();

    const unsubscribe = listenToStockItems(setStockItems);
    
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
    }
    
    return () => unsubscribe();
  }, [searchParams]);

  const handleAddItem = async (newItem: Omit<StockItem, 'id' | 'createdAt'>) => {
    await addStockItem(newItem);
  };

  const handleUpdateItem = async (id: string, updatedFields: Partial<StockItem>) => {
    await updateStockItem(id, updatedFields);
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('ເຈົ້າແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບລາຍການນີ້?')) {
      await deleteStockItem(id);
    }
  };

  const totalValue = stockItems.reduce((acc, item) => {
    return acc + item.quantity * item.costPrice;
  }, 0);

  const filteredStockItems = stockItems.filter(item =>
    item.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.partCode.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const totalItems = stockItems.reduce((acc, item) => acc + item.quantity, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(value);
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-md sticky top-0 z-30 flex h-20 items-center gap-4 border-b px-4 sm:px-6">
        <Button variant="outline" size="icon" className="h-10 w-10" asChild>
            <Link href="/">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">ກັບໄປໜ້າຫຼັກ</span>
            </Link>
        </Button>
        <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-3 rounded-lg">
                <HardHat className="h-6 w-6 text-white" />
            </div>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">ຈັດການສະຕັອກສິນຄ້າ</h1>
                <p className="text-sm text-muted-foreground">ເພີ່ມ, ແກ້ໄຂ, ແລະເບິ່ງສິນຄ້າຄົງຄັງທັງໝົດ</p>
            </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-8 md:gap-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            <StatCard 
                title="ມູນຄ່າສະຕັອກທັງໝົດ"
                value={formatCurrency(totalValue)}
                icon={<DollarSign className="h-5 w-5 text-green-500" />}
                description="ມູນຄ່າລວມຂອງສິນຄ້າທັງໝົດໃນຄັງ (ຕົ້ນທຶນ * ຈຳນວນ)"
            />
             <StatCard 
                title="ຈຳນວນສິນຄ້າທັງໝົດ"
                value={`${totalItems.toLocaleString('lo-LA')} ອັນ`}
                icon={<Package className="h-5 w-5 text-blue-500" />}
                description={`ຈາກ ${stockItems.length} ລາຍການ`}
            />
        </div>
        <div className="grid grid-cols-1">
            <StockTable 
              data={filteredStockItems} 
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

    