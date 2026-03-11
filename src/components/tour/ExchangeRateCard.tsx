
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export interface ExchangeRates {
    USD: { THB: number; LAK: number; CNY: number; };
    THB: { USD: number; LAK: number; CNY: number; };
    CNY: { USD: number; THB: number; LAK: number; };
    LAK: { USD: number; THB: number; CNY: number; };
}

interface ExchangeRateCardProps {
    totalCost: Record<string, number>;
    rates: ExchangeRates;
    onRatesChange: (rates: ExchangeRates) => void;
    profitPercentage: number;
    onProfitPercentageChange: (val: number) => void;
    isSaving: boolean;
}

export function ExchangeRateCard({ totalCost, rates, onRatesChange, profitPercentage, onProfitPercentageChange, isSaving }: ExchangeRateCardProps) {
    const formatNumber = (num: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);

    const updateRate = (base: keyof ExchangeRates, target: string, val: number) => {
        const newRates = { ...rates };
        (newRates[base] as any)[target] = val;
        onRatesChange(newRates);
    };

    // Calculate Grand Total in USD for simplicity in this summary
    const totalInUSD = totalCost.USD + 
                       (totalCost.THB * rates.THB.USD) + 
                       (totalCost.LAK * rates.LAK.USD) + 
                       (totalCost.CNY * rates.CNY.USD);

    const profit = totalInUSD * (profitPercentage / 100);
    const totalWithProfit = totalInUSD + profit;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>ອັດຕາແລກປ່ຽນ ແລະ ກຳໄລ</CardTitle>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <Label className="font-bold">ອັດຕາແລກປ່ຽນ (Base USD)</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs">USD to THB</Label>
                                <Input type="number" value={rates.USD.THB} onChange={e => updateRate('USD', 'THB', parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">USD to LAK</Label>
                                <Input type="number" value={rates.USD.LAK} onChange={e => updateRate('USD', 'LAK', parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">USD to CNY</Label>
                                <Input type="number" value={rates.USD.CNY} onChange={e => updateRate('USD', 'CNY', parseFloat(e.target.value) || 0)} />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Label className="font-bold">ກຳໄລ (%)</Label>
                        <Input type="number" value={profitPercentage} onChange={e => onProfitPercentageChange(parseFloat(e.target.value) || 0)} />
                    </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <h3 className="font-bold text-lg mb-4">ສະຫຼຸບລາຄາຂາຍ (ລວມກຳໄລ)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-background border rounded">
                            <p className="text-xs text-muted-foreground">Total USD</p>
                            <p className="text-xl font-bold text-primary">${formatNumber(totalWithProfit)}</p>
                        </div>
                        <div className="p-3 bg-background border rounded">
                            <p className="text-xs text-muted-foreground">Total THB</p>
                            <p className="text-xl font-bold text-primary">฿{formatNumber(totalWithProfit * rates.USD.THB)}</p>
                        </div>
                        <div className="p-3 bg-background border rounded">
                            <p className="text-xs text-muted-foreground">Total LAK</p>
                            <p className="text-xl font-bold text-primary">₭{formatNumber(totalWithProfit * rates.USD.LAK)}</p>
                        </div>
                        <div className="p-3 bg-background border rounded">
                            <p className="text-xs text-muted-foreground">Total CNY</p>
                            <p className="text-xl font-bold text-primary">¥{formatNumber(totalWithProfit * rates.USD.CNY)}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
