"use client"

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Save, Trash2, Calendar as CalendarIcon, FileText, Printer, PlusCircle } from "lucide-react";
import { th } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { ExchangeRateCard, type ExchangeRates } from '@/components/tour/ExchangeRateCard';
import { toDateSafe } from '@/lib/timestamp';
import { useDebouncedCallback } from 'use-debounce';
import type { TourProgram, TourCostItem, TourIncomeItem, Currency, DividendItem } from '@/lib/types';
import { 
    listenToTourCostItemsForProgram, 
    addTourCostItem, 
    updateTourCostItem, 
    deleteTourCostItem, 
    listenToTourIncomeItemsForProgram,
    addTourIncomeItem,
    updateTourIncomeItem,
    deleteTourIncomeItem,
    updateTourProgram,
} from '@/services/tourProgramService';

const allCurrencies: Currency[] = ['LAK', 'THB', 'USD', 'CNY'];

const initialRates: ExchangeRates = {
    USD: { THB: 38, LAK: 25000, CNY: 8 },
    THB: { USD: 0.032, LAK: 700, CNY: 0.25 },
    CNY: { USD: 0.20, THB: 6, LAK: 3500 },
    LAK: { USD: 0.00005, THB: 0.0015, CNY: 0.00035 },
};

const initialDividendStructure: DividendItem[] = [
    { id: '1', name: 'ບໍລິສັດ', percentage: 0.30 },
    { id: '2', name: 'xiuge', percentage: 0.10 },
    { id: '3', name: 'wenyan', percentage: 0.10 },
    { id: '4', name: 'ການຕະຫຼາດ', percentage: 0.15 },
    { id: '5', name: 'CEO', percentage: 0.30 },
    { id: '6', name: 'ບັນຊີ', percentage: 0.05 },
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0 }).format(value);
};

const SummaryCard = ({ title, value, currency }: { title: string, value: number, currency: Currency }) => (
    <Card>
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{title} ({currency})</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(value)}</p>
        </CardContent>
    </Card>
);

const CurrencyInput = ({ label, amount, currency, onAmountChange, onCurrencyChange }: {
    label: string;
    amount: number;
    currency: Currency;
    onAmountChange: (value: number) => void;
    onCurrencyChange: (value: Currency) => void;
}) => (
    <div className="grid gap-2">
        <Label htmlFor={label.toLowerCase()}>{label}</Label>
        <div className="flex gap-2">
            <Input
                id={label.toLowerCase()}
                type="number"
                value={amount || ''}
                onChange={(e) => onAmountChange(Number(e.target.value))}
                className="w-2/3"
            />
            <Select value={currency} onValueChange={(v) => onCurrencyChange(v as Currency)}>
                <SelectTrigger className="w-1/3">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {allCurrencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
    </div>
);

function CurrencyEntryTable({ items, onAddItem, onUpdateItem, onDeleteItem, title, description, onSave, isSaving }: {
    items: any[];
    onAddItem: () => void;
    onUpdateItem: (id: string, field: any, value: any) => void;
    onDeleteItem: (id: string) => void;
    title: string;
    description: string;
    onSave: () => void;
    isSaving: boolean;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
                <div className="flex gap-2">
                     <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກທັງໝົດ'}
                    </Button>
                    <Button size="sm" onClick={onAddItem}><PlusCircle className="mr-2 h-4 w-4" />ເພີ່ມລາຍການ</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30%]">ລາຍລະອຽດ</TableHead>
                            <TableHead className="text-right">KIP</TableHead>
                            <TableHead className="text-right">THB</TableHead>
                            <TableHead className="text-right">USD</TableHead>
                            <TableHead className="text-right">CNY</TableHead>
                            <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="p-1">
                                    <Input 
                                        value={item.detail || ''} 
                                        onChange={(e) => onUpdateItem(item.id, 'detail', e.target.value)}
                                        placeholder="ລາຍລະອຽດ..."
                                        className="h-8"
                                    />
                                </TableCell>
                                <TableCell className="p-1">
                                    <Input 
                                        type="number" 
                                        value={item.lak || ''} 
                                        onChange={(e) => onUpdateItem(item.id, 'lak', Number(e.target.value))}
                                        className="h-8 text-right font-mono"
                                    />
                                </TableCell>
                                <TableCell className="p-1">
                                    <Input 
                                        type="number" 
                                        value={item.thb || ''} 
                                        onChange={(e) => onUpdateItem(item.id, 'thb', Number(e.target.value))}
                                        className="h-8 text-right font-mono"
                                    />
                                </TableCell>
                                <TableCell className="p-1">
                                    <Input 
                                        type="number" 
                                        value={item.usd || ''} 
                                        onChange={(e) => onUpdateItem(item.id, 'usd', Number(e.target.value))}
                                        className="h-8 text-right font-mono"
                                    />
                                </TableCell>
                                <TableCell className="p-1">
                                    <Input 
                                        type="number" 
                                        value={item.cny || ''} 
                                        onChange={(e) => onUpdateItem(item.id, 'cny', Number(e.target.value))}
                                        className="h-8 text-right font-mono"
                                    />
                                </TableCell>
                                <TableCell className="p-1">
                                    <Button variant="ghost" size="icon" onClick={() => onDeleteItem(item.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

type TabValue = 'info' | 'income' | 'costs' | 'summary' | 'dividend';

export default function TourProgramClientPage({ initialCalculation }: { initialCalculation: TourProgram | null }) {
    const { toast } = useToast();
    const router = useRouter();

    const [localProgram, setLocalProgram] = useState<TourProgram | null>(initialCalculation);
    const [costItems, setCostItems] = useState<TourCostItem[]>([]);
    const [incomeItems, setIncomeItems] = useState<TourIncomeItem[]>([]);
    const [printCurrencies, setPrintCurrencies] = useState<Currency[]>(['LAK']);
    
    const [isSaving, setIsSaving] = useState(false);
    const [isTableSaving, setIsTableSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<TabValue>('info');
    const [dividendStructure, setDividendStructure] = useState<DividendItem[]>(initialDividendStructure);
    const [dividendCurrency, setDividendCurrency] = useState<Currency>('LAK');

    const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(initialCalculation?.exchangeRates || initialRates);
    const [calculatedTotals, setCalculatedTotals] = useState({
        income: 0,
        cost: 0,
        profit: 0,
        currency: 'LAK' as Currency,
    });

    const debouncedSaveRates = useDebouncedCallback(async (rates: ExchangeRates) => {
        if (!localProgram?.id) return;
        setIsSaving(true);
        try {
            await updateTourProgram(localProgram.id, { exchangeRates: rates });
            toast({ title: "ບັນທຶກອັດຕາແລກປ່ຽນສຳເລັດ" });
        } catch (error) {
            console.error("Failed to save exchange rates:", error);
            toast({ title: "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }, 1500);

    const handleRatesChange = (newRates: ExchangeRates) => {
        setExchangeRates(newRates);
        debouncedSaveRates(newRates);
    };

    useEffect(() => {
        if (!localProgram?.id) return;

        const unsubscribeCosts = listenToTourCostItemsForProgram(localProgram.id, setCostItems);
        const unsubscribeIncomes = listenToTourIncomeItemsForProgram(localProgram.id, setIncomeItems);
        
        if (localProgram.priceCurrency) {
            setPrintCurrencies([localProgram.priceCurrency]);
        }

        return () => {
            unsubscribeCosts();
            unsubscribeIncomes();
        };
    }, [localProgram?.id]);

    const handleProgramChange = useCallback((field: keyof TourProgram, value: any) => {
        setLocalProgram(prev => prev ? ({ ...prev, [field]: value }) : null);
    }, []);

    const handleSaveProgramInfo = useCallback(async () => {
        if (!localProgram || isSaving) return;
        setIsSaving(true);
        try {
            const { id, createdAt, date, ...dataToUpdate } = localProgram;
            await updateTourProgram(id, dataToUpdate);
            toast({ title: "ບັນທຶກຂໍ້ມູນໂປຣແກຣມແລ້ວ" });
        } catch (error) {
             console.error("Failed to save program info:", error);
            toast({ title: "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }, [localProgram, isSaving, toast]);
    
    const handleAddCostItem = async () => {
        if (!localProgram?.id) return;
        await addTourCostItem(localProgram.id);
    };
    
    const handleUpdateCostItem = (itemId: string, field: keyof TourCostItem, value: any) => {
        setCostItems(prev => prev.map(item => item.id === itemId ? { ...item, [field]: value } : item));
    };

    const handleSaveCostItems = async () => {
        setIsTableSaving(true);
        try {
            await Promise.all(costItems.map(item => {
                const { id, ...data } = item;
                return updateTourCostItem(id, data);
            }));
            toast({ title: "ບັນທຶກລາຍຈ່າຍສຳເລັດ" });
        } catch (error) {
            toast({ title: "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ", variant: "destructive" });
        } finally {
            setIsTableSaving(false);
        }
    };

    const handleAddIncomeItem = async () => {
        if (!localProgram?.id) return;
        await addTourIncomeItem(localProgram.id);
    };

    const handleUpdateIncomeItem = (itemId: string, field: keyof TourIncomeItem, value: any) => {
        setIncomeItems(prev => prev.map(item => item.id === itemId ? { ...item, [field]: value } : item));
    };
    
    const handleSaveIncomeItems = async () => {
        setIsTableSaving(true);
        try {
            await Promise.all(incomeItems.map(item => {
                const { id, ...data } = item;
                return updateTourIncomeItem(id, data);
            }));
            toast({ title: "ບັນທຶກລາຍຮັບສຳເລັດ" });
        } catch (error) {
            toast({ title: "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ", variant: "destructive" });
        } finally {
            setIsTableSaving(false);
        }
    };

    const summaryData = useMemo(() => {
        const totalCosts: Record<Currency, number> = { LAK: 0, THB: 0, USD: 0, CNY: 0 };
        costItems.forEach(item => {
            totalCosts.LAK += item.lak || 0;
            totalCosts.THB += item.thb || 0;
            totalCosts.USD += item.usd || 0;
            totalCosts.CNY += item.cny || 0;
        });

        const programIncome: Record<Currency, number> = { LAK: 0, THB: 0, USD: 0, CNY: 0 };
        if (localProgram) {
            if (localProgram.price > 0 && localProgram.priceCurrency) programIncome[localProgram.priceCurrency] += localProgram.price;
            if (localProgram.bankCharge > 0 && localProgram.bankChargeCurrency) programIncome[localProgram.bankChargeCurrency] += localProgram.bankCharge;
        }

        const totalIncomes = allCurrencies.reduce((acc, c) => {
            acc[c] = (programIncome[c] || 0) + incomeItems.reduce((sum, item) => sum + (item[c.toLowerCase() as keyof typeof item] as number || 0), 0);
            return acc;
        }, { LAK: 0, THB: 0, USD: 0, CNY: 0 } as Record<Currency, number>);
        
        const profit = allCurrencies.reduce((acc, c) => {
            acc[c] = (totalIncomes[c] || 0) - (totalCosts[c] || 0);
            return acc;
        }, { LAK: 0, THB: 0, USD: 0, CNY: 0 } as Record<Currency, number>);
        
        return { totalCosts, totalIncomes, profit };
    }, [costItems, incomeItems, localProgram]);

    const totalProfitInSelectedCurrency = useMemo(() => {
        const rates = exchangeRates;
        const profit = summaryData.profit;
        return (Object.keys(profit) as Currency[]).reduce((total, currency) => {
            const amount = profit[currency] || 0;
            if (currency === dividendCurrency) return total + amount;
            const rate = rates[currency]?.[dividendCurrency];
            return rate ? total + (amount * rate) : total;
        }, 0);
    }, [summaryData.profit, exchangeRates, dividendCurrency]);

    const handleCalculatedTotalsChange = useCallback((totals: any) => {
        setCalculatedTotals(totals);
    }, []);

    if (!localProgram) return <div className="p-8 text-center">ບໍ່ພົບຂໍ້ມູນໂປຣແກຣມ.</div>;

    const PrintHeader = ({ title }: { title: string }) => (
        <div className="hidden print:block print:space-y-4 pb-4 mb-4 text-center border-b-2">
            <h2 className="text-xl font-bold font-lao">{title}</h2>
            <div className="grid grid-cols-2 text-sm text-left gap-4">
                <div><strong>ໂປຣແກຣມ:</strong> {localProgram.programName}</div>
                <div><strong>ລະຫັດກຸ່ມ:</strong> {localProgram.tourCode}</div>
                <div><strong>ວັນທີເດີນທາງ:</strong> {localProgram.tourDates}</div>
                <div><strong>ຈຳນວນຄົນ:</strong> {localProgram.pax}</div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40 print:bg-white">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 print:hidden">
                <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                    <Link href="/tour-programs"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-xl font-bold tracking-tight">{localProgram.programName}</h1>
                <div className="ml-auto flex items-center gap-2">
                    <Button onClick={() => window.print()} size="sm" variant="outline"><Printer className="mr-2 h-4 w-4" />ພິມ</Button>
                </div>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8 print:p-0">
                <Tabs defaultValue="info" onValueChange={(v) => setActiveTab(v as TabValue)} className="mt-4">
                    <TabsList className="grid w-full grid-cols-5 print:hidden">
                        <TabsTrigger value="info">ຂໍ້ມູນໂປຣແກຣມ</TabsTrigger>
                        <TabsTrigger value="income">ບັນທຶກລາຍຮັບ</TabsTrigger>
                        <TabsTrigger value="costs">ຄຳນວນຕົ້ນທຶນ</TabsTrigger>
                        <TabsTrigger value="summary">ສະຫຼຸບຜົນ</TabsTrigger>
                        <TabsTrigger value="dividend">ປັນຜົນ</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="info" className="mt-4 space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle>ຂໍ້ມູນກຸ່ມທົວ</CardTitle>
                                <Button onClick={handleSaveProgramInfo} disabled={isSaving}>
                                    <Save className="mr-2 h-4 w-4" /> {isSaving ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ'}
                                </Button>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>ຊື່ໂປຣແກຣມ</Label><Input value={localProgram.programName} onChange={e => handleProgramChange('programName', e.target.value)} /></div>
                                <div className="space-y-2"><Label>ລະຫັດກຸ່ມ</Label><Input value={localProgram.tourCode} onChange={e => handleProgramChange('tourCode', e.target.value)} /></div>
                                <div className="space-y-2"><Label>ວັນທີເດີນທາງ</Label><Input value={localProgram.tourDates} onChange={e => handleProgramChange('tourDates', e.target.value)} /></div>
                                <div className="space-y-2"><Label>ຈຳນວນຄົນ</Label><Input type="number" value={localProgram.pax} onChange={e => handleProgramChange('pax', Number(e.target.value))} /></div>
                                <div className="space-y-2"><Label>ລາຄາທົວ</Label><CurrencyInput label="Price" amount={localProgram.price} currency={localProgram.priceCurrency} onAmountChange={v => handleProgramChange('price', v)} onCurrencyChange={v => handleProgramChange('priceCurrency', v)} /></div>
                                <div className="space-y-2"><Label>ຄ່າທຳນຽມທະນາຄານ</Label><CurrencyInput label="Bank Charge" amount={localProgram.bankCharge} currency={localProgram.bankChargeCurrency} onAmountChange={v => handleProgramChange('bankCharge', v)} onCurrencyChange={v => handleProgramChange('bankChargeCurrency', v)} /></div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="income" className="mt-4">
                        <PrintHeader title="ລາຍຮັບທັງໝົດ (Total Income)" />
                        <CurrencyEntryTable 
                            items={incomeItems} 
                            onAddItem={handleAddIncomeItem} 
                            onUpdateItem={handleUpdateIncomeItem} 
                            onDeleteItem={handleDeleteIncomeItem}
                            onSave={handleSaveIncomeItems}
                            isSaving={isTableSaving}
                            title="ລາຍຮັບ" description="ບັນທຶກລາຍຮັບທັງໝົດຂອງໂປຣແກຣມ"
                        />
                    </TabsContent>

                    <TabsContent value="costs" className="mt-4">
                        <PrintHeader title="ລາຍຈ່າຍທັງໝົດ (Total Costs)" />
                        <CurrencyEntryTable 
                            items={costItems} 
                            onAddItem={handleAddCostItem} 
                            onUpdateItem={handleUpdateCostItem} 
                            onDeleteItem={handleDeleteCostItem}
                            onSave={handleSaveCostItems}
                            isSaving={isTableSaving}
                            title="ລາຍຈ່າຍ" description="ບັນທຶກລາຍຈ່າຍ/ຕົ້ນທຶນທັງໝົດ"
                        />
                    </TabsContent>

                    <TabsContent value="summary" className="mt-4 space-y-4">
                        <PrintHeader title="ສະຫຼຸບກຳໄລ-ຂາດທຶນ (Profit/Loss Summary)" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
                            <SummaryCard title="ລາຍຮັບ (KIP)" value={summaryData.totalIncomes.LAK} currency="LAK" />
                            <SummaryCard title="ລາຍຮັບ (THB)" value={summaryData.totalIncomes.THB} currency="THB" />
                            <SummaryCard title="ລາຍຮັບ (USD)" value={summaryData.totalIncomes.USD} currency="USD" />
                            <SummaryCard title="ລາຍຮັບ (CNY)" value={summaryData.totalIncomes.CNY} currency="CNY" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
                            <SummaryCard title="ຕົ້ນທຶນ (KIP)" value={summaryData.totalCosts.LAK} currency="LAK" />
                            <SummaryCard title="ຕົ້ນທຶນ (THB)" value={summaryData.totalCosts.THB} currency="THB" />
                            <SummaryCard title="ຕົ້ນທຶນ (USD)" value={summaryData.totalCosts.USD} currency="USD" />
                            <SummaryCard title="ຕົ້ນທຶນ (CNY)" value={summaryData.totalCosts.CNY} currency="CNY" />
                        </div>
                        <ExchangeRateCard 
                            totalIncome={summaryData.totalIncomes} 
                            totalCost={summaryData.totalCosts} 
                            rates={exchangeRates} 
                            onRatesChange={handleRatesChange}
                            onCalculatedTotalsChange={handleCalculatedTotalsChange}
                        />
                    </TabsContent>

                    <TabsContent value="dividend" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>ການປັນຜົນກຳໄລ</CardTitle>
                                <div className="flex items-center gap-4 mt-2">
                                    <Label>ສະກຸນເງິນປັນຜົນ:</Label>
                                    <Select value={dividendCurrency} onValueChange={(v: Currency) => setDividendCurrency(v)}>
                                        <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>{allCurrencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <span className="font-bold text-lg">ກຳໄລລວມ: {formatCurrency(totalProfitInSelectedCurrency)} {dividendCurrency}</span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ຜູ້ຮັບຜົນປະໂຫຍດ</TableHead>
                                            <TableHead className="text-center">ເປີເຊັນ (%)</TableHead>
                                            <TableHead className="text-right">ຈຳນວນເງິນ</TableHead>
                                            <TableHead className="w-12"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dividendStructure.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell><Input value={item.name} onChange={e => handleDividendChange(item.id, 'name', e.target.value)} /></TableCell>
                                                <TableCell><Input type="number" className="text-center" value={item.percentage * 100} onChange={e => handleDividendChange(item.id, 'percentage', e.target.value)} /></TableCell>
                                                <TableCell className="text-right font-mono">{formatCurrency(totalProfitInSelectedCurrency * item.percentage)}</TableCell>
                                                <TableCell><Button variant="ghost" size="icon" onClick={() => removeDividendRow(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="font-bold bg-muted">
                                            <TableCell>ລວມ</TableCell>
                                            <TableCell className="text-center">{(dividendStructure.reduce((s, i) => s + i.percentage, 0) * 100).toFixed(0)}%</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(totalProfitInSelectedCurrency * dividendStructure.reduce((s, i) => s + i.percentage, 0))}</TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                                <Button className="mt-4" variant="outline" onClick={addDividendRow}><PlusCircle className="mr-2 h-4 w-4" />ເພີ່ມລາຍການ</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
