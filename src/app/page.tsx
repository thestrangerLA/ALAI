
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FerrisWheel, Briefcase, Wrench, Landmark } from "lucide-react"
import Link from 'next/link'
import { listenToTourAccountSummary } from '@/services/tourAccountancyService';
import { listenToAutoPartsAccountSummary } from '@/services/autoPartsAccountancyService';
import type { TourAccountSummary, AccountSummary, CurrencyValues } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('lo-LA', { minimumFractionDigits: 0 }).format(value);
};

const BusinessCard = ({ title, icon, href, children }: { title: string, icon: React.ReactNode, href: string, children: React.ReactNode }) => (
    <Link href={href}>
        <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold font-headline">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent className="flex-grow">
                {children}
            </CardContent>
        </Card>
    </Link>
);


export default function Home() {
    const [tourSummary, setTourSummary] = useState<TourAccountSummary | null>(null);
    const [autoPartsSummary, setAutoPartsSummary] = useState<AccountSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubTour = listenToTourAccountSummary(setTourSummary);
        const unsubAuto = listenToAutoPartsAccountSummary(setAutoPartsSummary);

        // Simple loading state timer
        const timer = setTimeout(() => setLoading(false), 1000);

        return () => {
            unsubTour();
            unsubAuto();
            clearTimeout(timer);
        };
    }, []);
    
    const tourTotals = useMemo(() => {
        if (!tourSummary) return { kip: 0, baht: 0, usd: 0, cny: 0 };
        const total = (summary: TourAccountSummary) => ({
            kip: (summary.cash?.kip || 0) + (summary.transfer?.kip || 0),
            baht: (summary.cash?.baht || 0) + (summary.transfer?.baht || 0),
            usd: (summary.cash?.usd || 0) + (summary.transfer?.usd || 0),
            cny: (summary.cash?.cny || 0) + (summary.transfer?.cny || 0),
        });
        return total(tourSummary);
    }, [tourSummary]);

    const autoPartsTotal = useMemo(() => {
        if (!autoPartsSummary) return 0;
        return (autoPartsSummary.cash || 0) + (autoPartsSummary.transfer || 0);
    }, [autoPartsSummary]);


  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight font-headline">My Business Hub</h1>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto">
            <BusinessCard title="ທຸລະກິດທ່ອງທ່ຽວ" href="/tour" icon={<FerrisWheel className="h-8 w-8 text-primary" />}>
                 {loading ? <Skeleton className="h-24 w-full" /> : tourSummary ? (
                    <div className="space-y-1 text-sm">
                       <p className="font-semibold text-muted-foreground">ຍອດເງິນລວມ:</p>
                       <p>KIP: <span className="font-mono font-semibold">{formatCurrency(tourTotals.kip)}</span></p>
                       <p>THB: <span className="font-mono font-semibold">{formatCurrency(tourTotals.baht)}</span></p>
                       <p>USD: <span className="font-mono font-semibold">{formatCurrency(tourTotals.usd)}</span></p>
                    </div>
                ) : <p className="text-muted-foreground italic">ບໍ່ມີຂໍ້ມູນ</p>}
            </BusinessCard>

            <BusinessCard title="ທຸລະກິດອາໄຫຼລົດ" href="/autoparts" icon={<Wrench className="h-8 w-8 text-blue-500" />}>
                 {loading ? <Skeleton className="h-24 w-full" /> : autoPartsSummary ? (
                    <div className="space-y-1 text-sm">
                       <p className="font-semibold text-muted-foreground">ຍອດເງິນລວມ:</p>
                       <p className="text-lg font-bold text-blue-600">{formatCurrency(autoPartsTotal)} <span className="text-xs font-normal">KIP</span></p>
                       <div className="pt-2 text-xs text-muted-foreground grid grid-cols-2 gap-1">
                            <div>ເງິນສົດ: {formatCurrency(autoPartsSummary.cash)}</div>
                            <div>ເງິນໂອນ: {formatCurrency(autoPartsSummary.transfer)}</div>
                       </div>
                    </div>
                ) : <p className="text-muted-foreground italic">ບໍ່ມີຂໍ້ມູນ</p>}
            </BusinessCard>

            <BusinessCard title="ສະຫະກອນ" href="/tee/cooperative" icon={<Landmark className="h-8 w-8 text-purple-500" />}>
                <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">ຈັດການລະບົບບັນຊີສະຫະກອນ, ເງິນຝາກ ແລະ ສິນເຊື່ອ</p>
                    <p className="text-xs text-purple-600 font-semibold pt-2">ຄລິກເພື່ອເຂົ້າສູ່ລະບົບ</p>
                </div>
            </BusinessCard>
        </div>
      </main>
    </div>
  )
}
