
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    description?: string;
}

export function StatCard({ title, value, icon, description }: StatCardProps) {
    return (
        <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground">{description}</p>
                )}
            </CardContent>
        </Card>
    )
}
