
import { getAllCustomers, getCustomerTransactions } from '@/services/customerService';
import CustomerDetailClient from '@/components/customer-detail-client';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const customers = await getAllCustomers();
  
  // Create a Set to store unique customer names
  const uniqueCustomerNames = new Set<string>();
  customers.forEach(c => uniqueCustomerNames.add(c.name));

  return Array.from(uniqueCustomerNames).map((name) => ({
    name: encodeURIComponent(name),
  }));
}

export default async function CustomerDetailPage({ params }: { params: { name: string } }) {
    const customerName = decodeURIComponent(params.name);

    try {
        const { transactions, stats } = await getCustomerTransactions(customerName);
        
        return (
            <CustomerDetailClient
                customerName={customerName}
                initialTransactions={JSON.parse(JSON.stringify(transactions))}
                initialStats={stats}
            />
        );
    } catch (error) {
        console.error("Error fetching customer data:", error);
        notFound();
    }
}
