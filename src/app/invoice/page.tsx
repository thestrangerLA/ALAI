
'use client';

import { useState, useEffect } from 'react';
import { listenToStockItems } from '@/services/stockService';
import type { StockItem } from '@/lib/types';
import { InvoiceForm } from '@/components/invoice-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function InvoicePage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  useEffect(() => {
    const unsubscribe = listenToStockItems(setStockItems);
    return () => unsubscribe();
  }, []);

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
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ອອກໃບເກັບເງິນ / INVOICE</h1>
            <p className="text-sm text-muted-foreground">ສ້າງ ແລະ ພິມໃບເກັບເງິນສຳລັບລູກຄ້າ</p>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-8 md:gap-8">
        <InvoiceForm allItems={stockItems} />
      </main>
    </div>
  );
}
