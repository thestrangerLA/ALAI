
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TotalCostCardProps {
    totalCost?: Record<string, number>;
    totalsByCategory?: Record<string, Record<string, number>>;
}

export function TotalCostCard({ totalCost, totalsByCategory }: TotalCostCardProps) {
    const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

    if (totalsByCategory) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>ສະຫຼຸບລາຍຈ່າຍແຍກຕາມໝວດໝູ່</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Object.entries(totalsByCategory).map(([category, totals]) => {
                        const activeTotals = Object.entries(totals).filter(([, v]) => v > 0);
                        if (activeTotals.length === 0) return null;
                        return (
                            <div key={category} className="flex justify-between items-center border-b pb-2 last:border-0">
                                <span className="font-medium">{category}</span>
                                <div className="flex gap-2">
                                    {activeTotals.map(([cur, val]) => (
                                        <span key={cur} className="text-sm bg-muted px-2 py-0.5 rounded">{cur} {formatNumber(val)}</span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        );
    }

    return null;
}
