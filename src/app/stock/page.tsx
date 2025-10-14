
"use client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DollarSign, Package, Tags } from "lucide-react"
import type { StockItem } from "@/lib/types"
import { StatCard } from "@/components/stat-card"
import { StockTable } from "@/components/stock-table"
import { useState, useEffect } from "react"
import { listenToStockItems, addStockItem, updateStockItem, deleteStockItem } from "@/services/stockService"
import Link from "next/link"
import { ArrowLeft, HardHat } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function StockPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubscribe = listenToStockItems(setStockItems);
    return () => unsubscribe();
  }, []);

  const handleAddItem = async (newItem: Omit<StockItem, 'id'>) => {
    await addStockItem(newItem);
  };

  const handleUpdateItem = async (id: string, updatedFields: Partial<StockItem>) => {
    await updateStockItem(id, updatedFields);
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?')) {
      await deleteStockItem(id);
    }
  };

  const totalValue = stockItems.reduce((acc, item) => {
    return acc + item.currentStock * item.price;
  }, 0);

  const categories = [...new Set(stockItems.map(item => item.category))];

  const filteredStockItems = stockItems.filter(item =>
    item.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.partCode.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const totalItems = stockItems.reduce((acc, item) => acc + item.currentStock, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value);
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-md sticky top-0 z-30 flex h-20 items-center gap-4 border-b px-4 sm:px-6">
        <Button variant="outline" size="icon" className="h-10 w-10" asChild>
            <Link href="/">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">กลับไปหน้าหลัก</span>
            </Link>
        </Button>
        <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-3 rounded-lg">
                <HardHat className="h-6 w-6 text-white" />
            </div>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">จัดการสต๊อกสินค้า</h1>
                <p className="text-sm text-muted-foreground">เพิ่ม, แก้ไข, และดูสินค้าคงคลังทั้งหมด</p>
            </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-8 md:gap-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <StatCard 
                title="มูลค่าสต๊อกทั้งหมด"
                value={formatCurrency(totalValue)}
                icon={<DollarSign className="h-5 w-5 text-green-500" />}
                description="มูลค่ารวมของสินค้าทั้งหมดในคลัง"
            />
             <StatCard 
                title="จำนวนสินค้าทั้งหมด"
                value={`${totalItems.toLocaleString()} ชิ้น`}
                icon={<Package className="h-5 w-5 text-blue-500" />}
                description={`จาก ${stockItems.length} รายการ`}
            />
             <StatCard 
                title="จำนวนหมวดหมู่"
                value={`${categories.length} หมวดหมู่`}
                icon={<Tags className="h-5 w-5 text-orange-500" />}
                description="หมวดหมู่สินค้าทั้งหมดในระบบ"
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
