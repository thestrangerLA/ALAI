
'use client';

import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TourCalculatorDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">ລາຍລະອຽດການຄຳນວນ</h1>
        <p className="text-muted-foreground">ID: {id}</p>
        <p className="bg-yellow-100 text-yellow-800 p-4 rounded-lg">ກະລຸນາສົ່ງໂຄ້ດສຳລັບໜ້າ "ລາຍລະອຽດ (Detail Page)" ມາໃຫ້ຂ້າພະເຈົ້າ ເພື່ອໃຫ້ໜ້ານີ້ສົມບູນ.</p>
        <Button asChild variant="outline">
          <Link href="/tour/cost-calculator">
            <ArrowLeft className="mr-2 h-4 w-4" /> ກັບໄປລາຍຊື່
          </Link>
        </Button>
      </div>
    </div>
  );
}
