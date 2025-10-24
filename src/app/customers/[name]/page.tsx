
import { getAllCustomers } from '@/services/customerService';
import CustomerDetailClient from '@/components/customer-detail-client';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const customers = await getAllCustomers();
  
  const uniqueCustomerNames = new Set<string>();
  customers.forEach(c => uniqueCustomerNames.add(c.name));

  return Array.from(uniqueCustomerNames).map((name) => ({
    name: encodeURIComponent(name),
  }));
}

export default async function CustomerDetailPage({ params }: { params: { name: string } }) {
    const customerName = decodeURIComponent(params.name);

    // Data will now be fetched on the client side.
    // We just pass the customer name.
    return (
        <CustomerDetailClient
            customerName={customerName}
        />
    );
}
