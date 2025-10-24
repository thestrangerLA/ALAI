
import { getAllSales } from '@/services/salesService';
import DailySalesHistoryClient from '@/components/daily-sales-history-client';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const sales = await getAllSales();
  
  const uniqueDates = new Set<string>();
  sales.forEach(sale => {
    uniqueDates.add(sale.saleDate.toDate().toLocaleDateString('en-CA'));
  });

  return Array.from(uniqueDates).map((date) => ({
    date: date,
  }));
}

export default async function DailySalesHistoryPage({ params }: { params: { date: string } }) {
    const { date: dateString } = params;
    
    // Data is now fetched on the client side.
    // We just pass the date string.
    return (
        <DailySalesHistoryClient
            dateString={dateString}
        />
    );
}
