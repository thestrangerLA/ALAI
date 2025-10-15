
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookUser, UserPlus, FileSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CustomersPage() {
  
  // Placeholder state and functions for future implementation
  const [customers, setCustomers] = useState([]);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [isAddCustomerOpen, setAddCustomerOpen] = useState(false);

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
                        <Button className="w-full" onClick={() => { /* Logic to save customer */ alert('ຈະເພີ່ມຟັງຊັນບັນທຶກໃນໄວໆນີ້') }}>
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
                            <CardDescription>ຄົ້ນຫາ ແລະ ເບິ່ງປະຫວັດການຊື້ຂອງລູກຄ້າ</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     <p className="text-center text-gray-500 mb-4">(ລາຍການ ແລະ ຂໍ້ມູນການຊື້ຂອງລູກຄ້າຈະສະແດງຢູ່ນີ້)</p>
                     <Button className="w-full" variant="secondary">
                        <FileSearch className="mr-2 h-4 w-4"/> ເບິ່ງລາຍງານ
                    </Button>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
