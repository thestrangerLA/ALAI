
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
                       (totalCost.THB * (rates.THB.USD || 0)) + 
                       (totalCost.LAK * (rates.LAK.USD || 0)) + 
                       (totalCost.CNY * (rates.CNY.USD || 0));

    const profit = totalInUSD * (profitPercentage / 100);
    const totalWithProfit = totalInUSD + profit;

    const RateRow = ({ base, targets }: { base: keyof ExchangeRates, targets: (keyof ExchangeRates)[] }) => (
        <div className="bg-white border rounded-lg p-3 space-y-3">
            <p className="text-sm font-bold flex items-center gap-2">
                1 {base} =
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {targets.map(target => (
                    <div key={target} className="flex items-center gap-2">
                        <Input 
                            type="number" 
                            step="any"
                            value={(rates[base] as any)[target]} 
                            onChange={e => updateRate(base, target, parseFloat(e.target.value) || 0)}
                            className="bg-[#f8faf9]"
                        />
                        <span className="text-xs font-bold w-8">{target}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">ອັດຕາແລກປ່ຽນ</h2>
                    {isSaving && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                </div>
                <p className="text-sm text-muted-foreground">ລະບົບຈະບັນທຶກອັດຕະໂນມັດເມື່ອມີການປ່ຽນແປງ</p>
            </div>

            <Card className="bg-[#f0f9f1] border-none shadow-none">
                <CardContent className="p-4 space-y-4">
                    <RateRow base="USD" targets={['THB', 'LAK', 'CNY']} />
                    <RateRow base="THB" targets={['USD', 'LAK', 'CNY']} />
                    <RateRow base="CNY" targets={['USD', 'THB', 'LAK']} />
                    <RateRow base="LAK" targets={['USD', 'THB', 'CNY']} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">ກຳໄລ ແລະ ສະຫຼຸບລາຄາຂາຍ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="max-w-xs space-y-2">
                        <Label className="font-bold">ກຳໄລ (%)</Label>
                        <Input 
                            type="number" 
                            value={profitPercentage} 
                            onChange={e => onProfitPercentageChange(parseFloat(e.target.value) || 0)} 
                        />
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
        </div>
    );
}
