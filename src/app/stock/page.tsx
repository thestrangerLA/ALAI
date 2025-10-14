
"use client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Leaf, DollarSign, Package, Tags } from "lucide-react"
import type { StockItem } from "@/lib/types"
import { StatCard } from "@/components/stat-card"
import { StockTable } from "@/components/stock-table"
import { useState, useEffect } from "react"
import { listenToStockItems, addStockItem, updateStockItem, deleteStockItem } from "@/services/stockService"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
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
    await deleteStockItem(id);
  };

  const totalValueKip = stockItems.reduce((acc, item) => {
    return acc + item.currentStock * item.costPrice;
  }, 0);

  const totalValueBaht = stockItems.reduce((acc, item) => {
    return acc + item.currentStock * item.costPriceBaht;
  }, 0);

  const categories = [...new Set(stockItems.map(item => item.category))];

  const filteredStockItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const valuePerCategory = stockItems.reduce((acc, item) => {
    const value = item.currentStock * item.costPrice;
    if (!acc[item.category]) {
      acc[item.category] = 0;
    }
    acc[item.category] += value;
    return acc;
  }, {} as Record<string, number>);

  const formatCurrency = (value: number, currency: 'Kip' | 'Baht') => {
    const currencySymbol = currency === 'Kip' ? ' ກີບ' : ' ບາດ';
    return new Intl.NumberFormat('lo-LA', { minimumFractionDigits: 0 }).format(value) + currencySymbol;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
            <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">ກັບໄປໜ້າຫຼັກ</span>
            </Link>
        </Button>
        <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight font-headline">ຈັດການສະຕັອກສິນຄ້າ</h1>
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
                title="ມູນຄ່າສະຕັອກທັງໝົດ (ບາດ)"
                value={formatCurrency(totalValueBaht, 'Baht')}
                icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                description="ມູນຄ່າໂດຍປະມານຂອງສິນຄ້າທັງໝົດໃນສະກຸນເງິນບາດ"
            />
             <StatCard 
                title="ສິນຄ້າທັງໝົດ"
                value={stockItems.length.toString()}
                icon={<Package className="h-4 w-4 text-muted-foreground" />}
                description="ຈຳນວນລາຍການສິນຄ້າໃນສະຕັອກ"
            />
             <StatCard 
                title="ໝວດໝູ່ທັງໝົດ"
                value={categories.length.toString()}
                icon={<Tags className="h-4 w-4 text-muted-foreground" />}
                description="ຈຳນວນໝວດໝູ່ສິນຄ້າທັງໝົດ"
            />
        </div>
        <Card>
            <CardHeader>
                <CardTitle>ມູນຄ່າຕາມໝວດໝູ່ (ກີບ)</CardTitle>
                <CardDescription>ມູນຄ່າລວມຂອງສິນຄ້າໃນແຕ່ລະໝວດໝູ່</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Object.entries(valuePerCategory).sort(([a], [b]) => a.localeCompare(b)).map(([category, value]) => (
                    <StatCard
                        key={category}
                        title={category}
                        value={formatCurrency(value, 'Kip')}
                        icon={<Tags className="h-4 w-4 text-muted-foreground" />}
                        description={`ມູນຄ່າລວມໃນໝວດໝູ່ ${category}`}
                    />
                ))}
            </CardContent>
        </Card>
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

    