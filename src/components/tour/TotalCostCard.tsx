"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, BedDouble, Truck, Plane, TrainFront, Camera, UtensilsCrossed, Users, FileText } from 'lucide-react';

type Currency = 'USD' | 'THB' | 'LAK' | 'CNY';

type TotalsByCategory = {
    [key: string]: Record<Currency, number>;
};

type TotalCostCardProps = {
    totalsByCategory: TotalsByCategory;
};

const currencySymbols: Record<Currency, string> = {
    USD: '$',
    THB: '฿',
    LAK: '₭',
    CNY: '¥',
};

const formatNumber = (num: number) => {
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
};

const categoryIcons: { [key: string]: React.ReactNode } = {
    'ຄ່າທີ່ພັກ': <BedDouble className="h-6 w-6 text-purple-500" />,
    'ຄ່າຂົນສົ່ງ': <Truck className="h-6 w-6 text-green-500" />,
    'ຄ່າປີ້ຍົນ': <Plane className="h-6 w-6 text-blue-500" />,
    'ຄ່າປີ້ລົດໄຟ': <TrainFront className="h-6 w-6 text-orange-500" />,
    'ຄ່າເຂົ້າຊົມສະຖານທີ່': <Camera className="h-6 w-6 text-red-500" />,
    'ຄ່າອາຫານ': <UtensilsCrossed className="h-6 w-6 text-yellow-500" />,
    'ຄ່າໄກ້': <Users className="h-6 w-6 text-indigo-500" />,
    'ຄ່າເອກະສານ': <FileText className="h-6 w-6 text-pink-500" />,
};


export default function TotalCostCard({ totalsByCategory }: TotalCostCardProps) {
    const hasData = Object.values(totalsByCategory).some(categoryTotals =>
        Object.values(categoryTotals).some(value => value > 0)
    );

    return (
        <Card className="w-full shadow-md">
            <CardHeader className="flex flex-row items-center gap-3 bg-muted/50 rounded-t-lg">
                <Calculator className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">ສະຫຼຸບຕາມໝວດໝູ່</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                {hasData ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(totalsByCategory).map(([category, totals]) => {
                            const filteredTotals = Object.entries(totals).filter(([, value]) => value > 0);
                            if (filteredTotals.length === 0) return null;

                            return (
                                <Card key={category} className="bg-background shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 flex items-start gap-4">
                                        <div className="bg-muted p-3 rounded-full">
                                            {categoryIcons[category] || <Calculator className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground">{category}</p>
                                            {filteredTotals.map(([currency, value]) => (
                                                <p key={currency} className="text-lg font-bold">
                                                   {currencySymbols[currency as Currency]}{formatNumber(value)}
                                                </p>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        <p>ยังไม่มีข้อมูลค่าใช้จ่าย</p>
                        <p className="text-sm">กรอกข้อมูลในหมวดหมู่ต่างๆ เพื่อดูสรุปที่นี่</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}