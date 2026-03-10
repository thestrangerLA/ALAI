
'use client';

import Link from 'next/link';
import { Calculator, LayoutDashboard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="max-w-3xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">ລະບົບຈັດການຂໍ້ມູນ</h1>
          <p className="text-xl text-muted-foreground">ຍິນດີຕ້ອນຮັບເຂົ້າສູ່ລະບົບ, ກະລຸນາເລືອກລາຍການທີ່ຕ້ອງການຈັດການ.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <Link href="/tour/cost-calculator" className="block group">
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-primary">
              <CardHeader>
                <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calculator className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Tour Cost Calculator</CardTitle>
                <CardDescription>ລະບົບຄຳນວນຕົ້ນທຶນທົວ, ຈັດການລາຍການຄ່າໃຊ້ຈ່າຍ ແລະ ອອກບົດສະຫຼຸບ.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">ເປີດໃຊ້ງານ</Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/tour" className="block group">
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500">
              <CardHeader>
                <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <LayoutDashboard className="w-8 h-8 text-blue-500" />
                </div>
                <CardTitle className="text-2xl">Tour Dashboard</CardTitle>
                <CardDescription>ພາບລວມການຈັດການທົວ ແລະ ຂໍ້ມູນທີ່ກ່ຽວຂ້ອງທັງໝົດ.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full border-blue-500 text-blue-500 hover:bg-blue-50">ເບິ່ງ Dashboard</Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
