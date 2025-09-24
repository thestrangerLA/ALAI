"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Currency = 'USD' | 'THB' | 'LAK' | 'CNY';

const currencySymbols: Record<Currency, string> = {
    USD: '$',
    THB: '฿',
    LAK: '₭',
    CNY: '¥',
};

const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

interface TotalCostCardProps {
    totalsByCategory: {
        [category: string]: Record<Currency, number>;
    };
}

export const TotalCostCard = ({ totalsByCategory }: TotalCostCardProps) => {
    return (
        <Card className="print:border-none print:shadow-none">
            <CardHeader className="print:px-0 print:py-2">
                <CardTitle className="print:text-lg">ສະຫຼຸບຄ່າໃຊ້ຈ່າຍ</CardTitle>
                <CardDescription className="print:hidden">ຄ່າໃຊ້ຈ່າຍທັງໝົດແຍກຕາມປະເພດ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 print:p-0">
                {Object.entries(totalsByCategory).map(([category, totals]) => {
                    const filteredTotals = Object.entries(totals).filter(([, value]) => value > 0);
                    if (filteredTotals.length === 0) return null;

                    return (
                        <div key={category} className="flex justify-between items-center border-b pb-2 print:text-xs">
                            <span className="font-medium">{category}</span>
                            <div className="flex items-center gap-x-4 gap-y-1 flex-wrap justify-end">
                                {filteredTotals.map(([currency, value]) => (
                                    <span key={currency} className="font-semibold whitespace-nowrap">
                                        {`${currencySymbols[currency as Currency]} ${formatNumber(value)}`}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};
