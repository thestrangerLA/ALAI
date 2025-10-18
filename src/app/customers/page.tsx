
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookUser, UserPlus, FileSearch, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addCustomer, listenToCustomers, deleteCustomer } from '@/services/customerService';
import type { Customer } from '@/lib/types';


export default function CustomersPage() {
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newCustomerName, setNewCustomerName] = useState('');
  
  useEffect(() => {
    const unsubscribe = listenToCustomers(setCustomers);
    return () => unsubscribe();
  }, []);

  const handleSaveCustomer = async () => {
    if (newCustomerName.trim() === '') {
        alert('ກະລຸນາປ້ອນຊື່ລູກຄ້າກ່ອນ.');
        return;
    }
    const result = await addCustomer({ name: newCustomerName });
    if (result.success) {
        setNewCustomerName(''); // Clear input field
        alert(`ບັນທຶກລູກຄ້າ "${newCustomerName}" ສຳເລັດ!`);
    } else {
        alert(`ເກີດຂໍ້ຜິດພາດ: ${result.message}`);
    }
  };

  const handleDeleteCustomer = async (customerId: string, customerName: string) => {
    if (window.confirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບລູກຄ້າ "${customerName}"?`)) {
        const result = await deleteCustomer(customerId);
        if (result.success) {
            alert(`ລຶບລູກຄ້າ "${customerName}" ສຳເລັດ!`);
        } else {
            alert(`ເກີດຂໍ້ຜິດພາດ: ${result.message}`);
        }
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-cyan-50 to-blue-100">
      <header className="bg-white shadow-md sticky top-0 z-30 flex h-20 items-center gap-4 border-b px-4 sm:px-6">
        <Button variant="outline" size="icon" className="h-10 w-10" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">ກັບໄປໜ້າຫຼັກ</span>
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500 p-3 rounded-lg">
            <BookUser className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ຈັດການຂໍ້ມູນລູກຄ້າ</h1>
            <p className="text-sm text-muted-foreground">ເພີ່ມ, ຄົ້ນຫາ, ແລະ ເບິ່ງຂໍ້ມູນລູກຄ້າ</p>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-8 md:gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card for adding new customers */}
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <UserPlus className="w-8 h-8 text-blue-500"/>
                        <div>
                            <CardTitle>ລົງທະບຽນລູກຄ້າໃໝ່</CardTitle>
                            <CardDescription>ເພີ່ມຂໍ້ມູນລູກຄ້າໃໝ່ເຂົ້າໃນລະບົບ</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer-name">ຊື່ລູກຄ້າ</Label>
                            <Input 
                                id="customer-name" 
                                placeholder="ປ້ອນຊື່ ແລະ ນາມສະກຸນ" 
                                value={newCustomerName}
                                onChange={(e) => setNewCustomerName(e.target.value)}
                            />
                        </div>
                         {/* Add more fields like phone number, address here in the future */}
                        <Button className="w-full" onClick={handleSaveCustomer}>
                            <UserPlus className="mr-2 h-4 w-4"/> ບັນທຶກລູກຄ້າ
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Card for viewing customer reports */}
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <FileSearch className="w-8 h-8 text-green-500"/>
                        <div>
                            <CardTitle>ລາຍງານຂໍ້ມູນລູກຄ້າ</CardTitle>
                            <CardDescription>ລາຍຊື່ລູກຄ້າທີ່ບັນທຶກໄວ້ໃນລະບົບ</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {customers.length > 0 ? (
                        <ul className="space-y-3">
                            {customers.map((customer) => (
                                <li key={customer.id} className="flex items-center justify-between gap-3 p-2 bg-gray-50 rounded-md">
                                    <div className="flex items-center gap-3">
                                        <User className="h-5 w-5 text-gray-600"/>
                                        <span className="font-medium">{customer.name}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-100 hover:text-red-600" onClick={() => handleDeleteCustomer(customer.id, customer.name)}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">ລຶບ</span>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-4">-- ຍັງບໍ່ມີຂໍ້ມູນລູກຄ້າ --</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
