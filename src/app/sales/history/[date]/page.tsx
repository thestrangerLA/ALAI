
import { getAllSales, getSalesForDate } from '@/services/salesService';
import DailySalesHistoryClient from '@/components/daily-sales-history-client';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const sales = await getAllSales();
  
  // Create a Set to store unique date strings (YYYY-MM-DD)
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

    try {
        const { sales, totalSales, totalProfit } = await getSalesForDate(dateString);
        
        return (
            <DailySalesHistoryClient
                dateString={dateString}
                initialSales={JSON.parse(JSON.stringify(sales))}
                initialTotalSales={totalSales}
                initialTotalProfit={totalProfit}
            />
        );
    } catch (error) {
        console.error("Error fetching daily sales data:", error);
        notFound();
    }
}
