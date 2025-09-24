"use client"

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Save, Trash2, MapPin, Calendar as CalendarIcon, BedDouble, Truck, Plane, TrainFront, PlusCircle, Camera, UtensilsCrossed, Users, FileText, Copy, Clock, Eye, EyeOff, Download, History, Printer, ChevronsRight, Percent, TrendingUp, Calculator, RotateCcw } from "lucide-react";
import { format, isValid } from 'date-fns';
import TotalCostCard from '@/components/tour/TotalCostCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { SavedCalculation, TourInfo, TourCosts, Accommodation, Room, Trip, Flight, TrainTicket, EntranceFee, MealCost, GuideFee, DocumentFee } from '@/lib/types';
import { updateCalculation } from '@/services/tourCalculatorService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";


// Types
type Currency = 'USD' | 'THB' | 'LAK' | 'CNY';

const currencySymbols: Record<Currency, string> = {
    USD: '$ (ດอลลár)',
    THB: '฿ (ບາດ)',
    LAK: '₭ (ກີບ)',
    CNY: '¥ (ຢວນ)',
};

const formatNumber = (num: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat('en-US', options).format(num);

const categoryIcons: { [key: string]: React.ReactNode } = {
    'ຄ່າທີ່ພັກ': <BedDouble className="h-5 w-5" />,
    'ຄ່າຂົນສົ່ງ': <Truck className="h-5 w-5" />,
    'ຄ່າປີ້ຍົນ': <Plane className="h-5 w-5" />,
    'ຄ່າປີ້ລົດໄຟ': <TrainFront className="h-5 w-5" />,
    'ຄ່າເຂົ້າຊົມສະຖານທີ່': <Camera className="h-5 w-5" />,
    'ຄ່າອາຫານ': <UtensilsCrossed className="h-5 w-5" />,
    'ຄ່າໄກ້': <Users className="h-5 w-5" />,
    'ຄ່າເອກະສານ': <FileText className="h-5 w-5" />,
};

type ExchangeRateMatrix = {
    [key in Currency]: {
        [key in Currency]: number;
    };
};

const CostCategoryContent = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
     <AccordionItem value={title.toLowerCase().replace(/\s/g, '-')} className="break-inside-avoid">
        <AccordionTrigger className="text-lg font-semibold">
          <div className="flex items-center gap-3">
            {icon} {title}
          </div>
        </AccordionTrigger>
        <AccordionContent>
            {children}
        </AccordionContent>
    </AccordionItem>
);

export default function TourCalculatorClientPage({ initialCalculation }: { initialCalculation: SavedCalculation }) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const [tourInfo, setTourInfo] = useState<TourInfo>(initialCalculation.tourInfo);
    const [allCosts, setAllCosts] = useState<TourCosts>(initialCalculation.allCosts);
    
    const [itemVisibility, setItemVisibility] = useState<Record<string, boolean>>({});
    
    const [exchangeRates, setExchangeRates] = useState<ExchangeRateMatrix>({
        USD: { USD: 1, THB: 36.7, LAK: 21800, CNY: 7.25 },
        THB: { USD: 1 / 36.7, THB: 1, LAK: 605, CNY: 0.19 },
        LAK: { USD: 1 / 21800, THB: 1 / 605, LAK: 1, CNY: 1 / 3000 },
        CNY: { USD: 1 / 7.25, THB: 5.1, LAK: 3000, CNY: 1 },
    });
    const [targetCurrency, setTargetCurrency] = useState<Currency>('LAK');
    const [sellingPricePercentage, setSellingPricePercentage] = useState(20);

    const handleSave = useCallback(async (andThen?: () => void) => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            await updateCalculation(initialCalculation.id, {
                tourInfo: tourInfo,
                allCosts: allCosts
            });
             toast({
                title: "บันทึกข้อมูลสำเร็จ",
                description: `ข้อมูล ${tourInfo.groupCode || 'ไม่มีชื่อ'} ถูกบันทึกแล้ว`,
            });
            if (andThen) {
                andThen();
            }
        } catch (e) {
            toast({
                title: "เกิดข้อผิดพลาด",
                description: "ไม่สามารถบันทึกข้อมูลได้",
                variant: 'destructive'
            });
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    }, [initialCalculation.id, tourInfo, allCosts, toast, isSaving]);


    const toggleItemVisibility = (itemId: string) => {
        setItemVisibility(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    const updateCosts = useCallback((category: keyof TourCosts, data: any) => {
        setAllCosts(prev => ({ ...prev, [category]: data }));
    }, []);

    // Generic CRUD operations
    const addItem = <T extends keyof TourCosts>(category: T, newItem: any) => {
        const currentItems = allCosts[category] as any[];
        updateCosts(category, [...currentItems, newItem]);
    };

    const updateItem = <T extends keyof TourCosts>(category: T, itemId: string, field: string, value: any) => {
        const currentItems = allCosts[category] as any[];
        const updatedItems = currentItems.map(item => item.id === itemId ? { ...item, [field]: value } : item);
        updateCosts(category, updatedItems as TourCosts[T]);
    };
    
    const deleteItem = <T extends keyof TourCosts>(category: T, itemId: string) => {
        const currentItems = allCosts[category] as any[];
        updateCosts(category, currentItems.filter(item => item.id !== itemId) as TourCosts[T]);
    };

    // Specific Component Logic
    const addAccommodation = () => addItem('accommodations', { id: uuidv4(), name: '', type: 'hotel', rooms: [{ id: uuidv4(), type: 'เตียงเดี่ยว', numRooms: 1, numNights: 1, price: 0, currency: 'USD' }] });
    const addRoom = (accId: string) => {
        const accommodations = allCosts.accommodations.map(acc => {
            if (acc.id === accId) {
                const newRoom = { id: uuidv4(), type: 'เตียงเดี่ยว', numRooms: 1, numNights: 1, price: 0, currency: 'USD' };
                return { ...acc, rooms: [...acc.rooms, newRoom] };
            }
            return acc;
        });
        updateCosts('accommodations', accommodations);
    };
    const updateRoom = (accId: string, roomId: string, field: keyof Room, value: any) => {
        const updatedAccommodations = allCosts.accommodations.map(acc => {
            if (acc.id === accId) {
                const updatedRooms = acc.rooms.map(room => 
                    room.id === roomId ? { ...room, [field]: value } : room
                );
                return { ...acc, rooms: updatedRooms };
            }
            return acc;
        });
        updateCosts('accommodations', updatedAccommodations);
    };
    const deleteRoom = (accId: string, roomId: string) => {
         const accommodations = allCosts.accommodations.map(acc => {
            if (acc.id === accId) {
                return { ...acc, rooms: acc.rooms.filter(room => room.id !== roomId) };
            }
            return acc;
        });
        updateCosts('accommodations', accommodations);
    };

    const addTrip = () => addItem('trips', { id: uuidv4(), location: '', route: '', vehicleType: 'ລົດຕູ້ທຳມະດາ', numVehicles: 1, numDays: 1, pricePerVehicle: 0, currency: 'USD' });
    const addFlight = () => addItem('flights', { id: uuidv4(), from: '', to: '', departureTime: '08:00', pricePerPerson: 0, numPeople: 1, currency: 'USD' });
    const addTrainTicket = () => addItem('trainTickets', { id: uuidv4(), from: '', to: '', departureTime: '08:00', ticketClass: '', numTickets: 1, pricePerTicket: 0, currency: 'LAK' });
    const addEntranceFee = () => addItem('entranceFees', { id: uuidv4(), locationName: '', pax: 1, numLocations: 1, price: 0, currency: 'LAK' });
    const addMealCost = () => addItem('meals', { id: uuidv4(), name: '', pax: 1, breakfast: 0, lunch: 0, dinner: 0, pricePerMeal: 0, currency: 'LAK' });
    const addGuideFee = () => addItem('guides', { id: uuidv4(), guideName: '', numGuides: 1, numDays: 1, pricePerDay: 0, currency: 'LAK' });
    const addDocumentFee = () => addItem('documents', { id: uuidv4(), documentName: '', pax: 1, price: 0, currency: 'LAK' });
    
    // --- Total Calculation Memos ---
    const accommodationTotals = useMemo(() => {
        const totals: Record<Currency, number> = { USD: 0, THB: 0, LAK: 0, CNY: 0 };
        allCosts.accommodations.forEach(acc => {
            acc.rooms.forEach(room => {
                totals[room.currency] += (room.numRooms || 0) * (room.numNights || 0) * (room.price || 0);
            });
        });
        return totals;
    }, [allCosts.accommodations]);

    const tripTotals = useMemo(() => {
        const totals: Record<Currency, number> = { USD: 0, THB: 0, LAK: 0, CNY: 0 };
        allCosts.trips.forEach(trip => {
            totals[trip.currency] += (trip.numVehicles || 0) * (trip.numDays || 0) * (trip.pricePerVehicle || 0);
        });
        return totals;
    }, [allCosts.trips]);

    const flightTotals = useMemo(() => {
        const totals: Record<Currency, number> = { USD: 0, THB: 0, LAK: 0, CNY: 0 };
        allCosts.flights.forEach(flight => {
            totals[flight.currency] += (flight.pricePerPerson || 0) * (flight.numPeople || 0);
        });
        return totals;
    }, [allCosts.flights]);
    
    const trainTotals = useMemo(() => {
        const totals: Record<Currency, number> = { USD: 0, THB: 0, LAK: 0, CNY: 0 };
        allCosts.trainTickets.forEach(ticket => {
            totals[ticket.currency] += (ticket.pricePerTicket || 0) * (ticket.numTickets || 0);
        });
        return totals;
    }, [allCosts.trainTickets]);

    const entranceFeeTotals = useMemo(() => {
        const totals: Record<Currency, number> = { USD: 0, THB: 0, LAK: 0, CNY: 0 };
        allCosts.entranceFees.forEach(fee => {
            totals[fee.currency] += (fee.pax || 0) * (fee.price || 0) * (fee.numLocations || 0);
        });
        return totals;
    }, [allCosts.entranceFees]);

    const mealTotals = useMemo(() => {
        const totals: Record<Currency, number> = { USD: 0, THB: 0, LAK: 0, CNY: 0 };
        allCosts.meals.forEach(meal => {
            totals[meal.currency] += ((meal.breakfast || 0) + (meal.lunch || 0) + (meal.dinner || 0)) * (meal.pricePerMeal || 0) * (meal.pax || 0);
        });
        return totals;
    }, [allCosts.meals]);

    const guideTotals = useMemo(() => {
        const totals: Record<Currency, number> = { USD: 0, THB: 0, LAK: 0, CNY: 0 };
        allCosts.guides.forEach(guide => {
            totals[guide.currency] += (guide.numGuides || 0) * (guide.numDays || 0) * (guide.pricePerDay || 0);
        });
        return totals;
    }, [allCosts.guides]);

    const documentTotals = useMemo(() => {
        const totals: Record<Currency, number> = { USD: 0, THB: 0, LAK: 0, CNY: 0 };
        allCosts.documents.forEach(doc => {
            totals[doc.currency] += (doc.pax || 0) * (doc.price || 0);
        });
        return totals;
    }, [allCosts.documents]);
    
    const totalsByCategory = {
        'ຄ່າທີ່ພັກ': accommodationTotals,
        'ຄ່າຂົນສົ່ງ': tripTotals,
        'ຄ່າປີ້ຍົນ': flightTotals,
        'ຄ່າປີ້ລົດໄຟ': trainTotals,
        'ຄ່າເຂົ້າຊົມສະຖານທີ່': entranceFeeTotals,
        'ຄ່າອາຫານ': mealTotals,
        'ຄ່າໄກ້': guideTotals,
        'ຄ່າເອກະສານ': documentTotals
    };

    const grandTotals = useMemo(() => {
        const totals: Record<Currency, number> = { USD: 0, THB: 0, LAK: 0, CNY: 0 };
        Object.values(totalsByCategory).forEach(categoryTotals => {
            (Object.keys(totals) as Currency[]).forEach(currency => {
                totals[currency] += categoryTotals[currency];
            });
        });
        return totals;
    }, [totalsByCategory]);
    
     const convertedTotal = useMemo(() => {
        let total = 0;
        (Object.keys(grandTotals) as Currency[]).forEach(fromCurrency => {
            const amount = grandTotals[fromCurrency];
            total += amount * (exchangeRates[fromCurrency][targetCurrency] || 0);
        });
        return total;
    }, [grandTotals, exchangeRates, targetCurrency]);

    const sellingPrice = useMemo(() => {
        return convertedTotal * (1 + (sellingPricePercentage || 0) / 100);
    }, [convertedTotal, sellingPricePercentage]);
    
    const profit = useMemo(() => {
        return sellingPrice - convertedTotal;
    }, [sellingPrice, convertedTotal]);

    const handleRateChange = (from: Currency, to: Currency, value: string) => {
        const rate = parseFloat(value) || 0;
        setExchangeRates(prev => ({
            ...prev,
            [from]: { ...prev[from], [to]: rate }
        }));
    };
    
    const handlePrint = () => {
        window.print();
    };


    const SummaryFooter = ({ title, totals }: { title: string; totals: Record<Currency, number> }) => {
        const filteredTotals = Object.entries(totals).filter(([, value]) => value > 0);
        if (filteredTotals.length === 0) return null;

        return (
            <div className="mt-4 rounded-lg bg-purple-100 p-3">
                <div className="flex items-center justify-between font-semibold text-purple-800">
                    <span>{title}:</span>
                    <div className="flex items-center gap-4">
                        {filteredTotals.map(([currency, value]) => (
                            <span key={currency}>{`${currencySymbols[currency as Currency].split(' ')[0]} ${formatNumber(value)}`}</span>
                        ))}
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-30 flex h-20 items-center gap-4 bg-primary px-4 text-primary-foreground sm:px-6 print:hidden">
                <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10" asChild>
                    <Link href="/tour/calculator">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">ກັບໄປໜ້າຫຼັກ</span>
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold tracking-tight">ລະບົບຈອງທົວ ແລະ ຄຳນວນຄ່າໃຊ້ຈ່າຍ</h1>
                    <p className="text-sm text-primary-foreground/80">{tourInfo.groupCode || 'New Calculation'}</p>
                </div>
                 <div className="flex items-center gap-2">
                     <Button variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10" onClick={() => handleSave()} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກຂໍ້ມູນ'}
                    </Button>
                    <Button variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        ພິມ
                    </Button>
                </div>
            </header>
            <main className="flex w-full flex-1 flex-col gap-8 p-4 sm:px-6 sm:py-4 bg-muted/40 print:p-0 print:bg-white print:gap-4">

                {/* Print View Page 1 */}
                <div id="print-content-page-1" className="hidden print:block print-container">
                     <div className="space-y-4 p-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <MapPin className="h-6 w-6 text-primary" />
                                    ຂໍ້ມູນທົວ
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 print:text-base">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                    <div><strong>MOU Contact:</strong> {tourInfo.mouContact}</div>
                                    <div><strong>Group Code:</strong> {tourInfo.groupCode}</div>
                                    <div><strong>ປະເທດປາຍທາງ:</strong> {tourInfo.destinationCountry}</div>
                                    <div><strong>ໂປຣແກຣມ:</strong> {tourInfo.program}</div>
                                    <div><strong>ວັນທີເດີນທາງ:</strong> {tourInfo.startDate && isValid(new Date(tourInfo.startDate)) ? format(new Date(tourInfo.startDate), "dd/MM/yyyy") : ''} - {tourInfo.endDate && isValid(new Date(tourInfo.endDate)) ? format(new Date(tourInfo.endDate), "dd/MM/yyyy") : ''}</div>
                                    <div><strong>ຈຳນວນວັນ:</strong> {tourInfo.numDays} ວັນ {tourInfo.numNights} ຄືນ</div>
                                    <div><strong>ຈຳນວນຄົນ:</strong> {tourInfo.numPeople}</div>
                                    <div><strong>ຂໍ້ມູນຜູ້ຮ່ວມເດີນທາງ:</strong> {tourInfo.travelerInfo}</div>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="mt-4">
                            <TotalCostCard totalsByCategory={totalsByCategory} />
                        </div>
                     </div>
                </div>

                {/* Print View Page 2 */}
                 <div id="print-content-page-2" className="hidden print:block print-page-break-before">
                     <div className="space-y-4 p-4">
                        <Card>
                             <CardHeader>
                                <CardTitle className="text-xl">ຄ່າໃຊ້ຈ່າຍລວມທັງໝົດ ແລະ ອັດຕາແລກປ່ຽນ</CardTitle>
                            </CardHeader>
                             <CardContent className="space-y-6">
                                <div className="grid grid-cols-4 gap-4">
                                    {(Object.keys(grandTotals) as Currency[]).filter(c => grandTotals[c] > 0).map(currency => (
                                        <Card key={currency}>
                                            <CardHeader className="pb-2"><CardTitle className="text-lg">{currency}</CardTitle></CardHeader>
                                            <CardContent><p className="text-2xl font-bold">{formatNumber(grandTotals[currency])}</p></CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <div className="grid grid-cols-3 gap-4 pt-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">ຍອດລວມທີ່ແປງແລ້ວ ({targetCurrency})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{formatNumber(convertedTotal, {maximumFractionDigits: 2})}</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">ລາຄາຂາຍ ({targetCurrency})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{formatNumber(sellingPrice, {maximumFractionDigits: 2})}</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">ກຳໄລ ({targetCurrency})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold text-green-600">{formatNumber(profit, {maximumFractionDigits: 2})}</p>
                                </CardContent>
                            </Card>
                        </div>
                     </div>
                </div>

                {/* Screen View */}
                <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-8 print:hidden">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-6 w-6 text-primary" />
                                ຂໍ້ມູນທົວ
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="mou-contact">MOU Contact:</Label>
                                    <Input id="mou-contact" placeholder="ຊື່ຜູ້ຕິດຕໍ່" value={tourInfo.mouContact} onChange={e => setTourInfo({...tourInfo, mouContact: e.target.value})} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="group-code">Group Code:</Label>
                                    <Input id="group-code" placeholder="ລະຫັດກຸ່ມ" value={tourInfo.groupCode} onChange={e => setTourInfo({...tourInfo, groupCode: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="destination-country">ປະເທດປາຍທາງ:</Label>
                                    <Input id="destination-country" placeholder="ປະເທດປາຍທາງ" value={tourInfo.destinationCountry} onChange={e => setTourInfo({...tourInfo, destinationCountry: e.target.value})} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="program">ໂປຣແກຣມ:</Label>
                                    <Input id="program" placeholder="ລະບຸໂປຣແກຣມ" value={tourInfo.program} onChange={e => setTourInfo({...tourInfo, program: e.target.value})} />
                                </div>
                            </div>
                                <div className="grid md:grid-cols-2 gap-6 items-end">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="travel-date-start">ວັນທີເດີນທາງ:</Label>
                                            <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant={"outline"} className="justify-start text-left font-normal">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {tourInfo.startDate && isValid(new Date(tourInfo.startDate)) ? format(new Date(tourInfo.startDate), "dd/MM/yyyy") : <span>mm/dd/yyyy</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={tourInfo.startDate ? new Date(tourInfo.startDate) : undefined} onSelect={date => setTourInfo({...tourInfo, startDate: date })} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="grid gap-2">
                                            <Label htmlFor="travel-date-end" className="text-transparent hidden md:block">-</Label>
                                            <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant={"outline"} className="justify-start text-left font-normal">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {tourInfo.endDate && isValid(new Date(tourInfo.endDate)) ? format(new Date(tourInfo.endDate), "dd/MM/yyyy") : <span>mm/dd/yyyy</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={tourInfo.endDate ? new Date(tourInfo.endDate) : undefined} onSelect={date => setTourInfo({...tourInfo, endDate: date })} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="num-days">ຈຳນວນວັນ:</Label>
                                        <Input id="num-days" type="number" placeholder="1" value={tourInfo.numDays || ''} onChange={e => setTourInfo({...tourInfo, numDays: Number(e.target.value) || 1})} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="num-nights">ຈຳນວນຄືນ:</Label>
                                        <Input id="num-nights" type="number" placeholder="0" value={tourInfo.numNights || ''} onChange={e => setTourInfo({...tourInfo, numNights: Number(e.target.value) || 0})} />
                                    </div>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="num-people">ຈຳນວນຄົນ:</Label>
                                    <Input id="num-people" type="number" placeholder="1" value={tourInfo.numPeople || ''} onChange={e => setTourInfo({...tourInfo, numPeople: Number(e.target.value) || 1})} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="traveler-info">ຂໍ້ມູນຜູ້ຮ່ວມເດີນທາງ:</Label>
                                    <Textarea id="traveler-info" placeholder="ຕົວຢ່າງ ກຸ່ມຄອບຄົວ, ຄູ່ຮັກ, ຜູ້ສູງອາຍຸ" className="min-h-[40px]" value={tourInfo.travelerInfo} onChange={e => setTourInfo({...tourInfo, travelerInfo: e.target.value})} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="print:hidden">
                        <CardHeader>
                            <CardTitle>ຄຳນວນຄ່າໃຊ້ຈ່າຍ</CardTitle>
                            <CardDescription>ເພີ່ມ ແລະ ຈັດການຄ່າໃຊ້ຈ່າຍຕ່າງໆ</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="multiple" className="w-full space-y-4 md:columns-2 md:gap-8">
                                {/* Accommodation */}
                                <CostCategoryContent title="ຄ່າທີ່ພັກ" icon={<BedDouble className="h-5 w-5" />}>
                                    <div className="space-y-4 pt-2">
                                        {allCosts.accommodations.map((acc, index) => (
                                            <Card key={acc.id} className="bg-muted/30">
                                                <CardHeader className="flex-row items-center justify-between p-3 bg-muted/50">
                                                    <CardTitle className="text-base">ທີ່ພັກ #{index + 1}</CardTitle>
                                                    <div className="print:hidden">
                                                        <Button variant="ghost" size="icon" onClick={() => deleteItem('accommodations', acc.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 space-y-4">
                                                    {/* Acc Fields */}
                                                        <div className="grid md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>ຊື່ທີ່ພັກ</Label>
                                                            <Input placeholder="ຊື່ທີ່ພັກ" value={acc.name} onChange={e => updateItem('accommodations', acc.id, 'name', e.target.value)} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>ວັນທີເຊັກອິນ</Label>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                                        {acc.checkInDate && isValid(new Date(acc.checkInDate)) ? format(new Date(acc.checkInDate), "dd/MM/yyyy") : <span>mm/dd/yyyy</span>}
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0">
                                                                    <Calendar mode="single" selected={acc.checkInDate ? new Date(acc.checkInDate): undefined} onSelect={(date) => updateItem('accommodations', acc.id, 'checkInDate', date)} initialFocus />
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>
                                                        </div>
                                                    {/* Rooms */}
                                                    {acc.rooms.map((room, roomIndex) => (
                                                        <div key={room.id} className="p-3 border rounded-md relative bg-background">
                                                            <Label className="absolute -top-2 left-2 bg-background px-1 text-xs text-muted-foreground">ຫ້ອງ #{roomIndex+1}</Label>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">ປະເພດ</Label>
                                                                    <Select value={room.type} onValueChange={(v) => updateRoom(acc.id, room.id, 'type', v)}>
                                                                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="เตียงเดี่ยว">ຕຽງດ່ຽວ</SelectItem>
                                                                            <SelectItem value="เตียงคู่">ຕຽງຄູ່</SelectItem>
                                                                            <SelectItem value="ห้องสวีท">ຫ້ອງສະວີດ</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                    <div className="space-y-1">
                                                                    <Label className="text-xs">ຈຳນວນຫ້ອງ</Label>
                                                                    <Input type="number" min="1" value={room.numRooms || ''} onChange={e => updateRoom(acc.id, room.id, 'numRooms', parseInt(e.target.value) || 1)} className="h-8" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">ຈຳນວນຄືນ</Label>
                                                                    <Input type="number" min="1" value={room.numNights || ''} onChange={e => updateRoom(acc.id, room.id, 'numNights', parseInt(e.target.value) || 1)} className="h-8" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">ລາຄາ/ຫ້ອງ/ຄືນ</Label>
                                                                    <Input type="number" min="0" value={room.price || ''} onChange={e => updateRoom(acc.id, room.id, 'price', parseFloat(e.target.value) || 0)} className="h-8" />
                                                                </div>
                                                                <div className="space-y-1 col-span-2">
                                                                    <Label className="text-xs">ສະກຸນເງິນ</Label>
                                                                    <Select value={room.currency} onValueChange={(v) => updateRoom(acc.id, room.id, 'currency', v)}>
                                                                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            {(Object.keys(currencySymbols) as Currency[]).map(c => (
                                                                                <SelectItem key={c} value={c}>{currencySymbols[c]}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                            {acc.rooms.length > 1 && <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6" onClick={() => deleteRoom(acc.id, room.id)}><Trash2 className="h-3 w-3 text-red-400"/></Button>}
                                                        </div>
                                                    ))}
                                                    <Button size="sm" variant="outline" onClick={() => addRoom(acc.id)}><PlusCircle className="mr-2 h-4 w-4" />ເພີ່ມຫ້ອງ</Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        <Button onClick={addAccommodation}><PlusCircle className="mr-2 h-4 w-4" />ເພີ່ມຄ່າທີ່ພັກ</Button>
                                    </div>
                                    <SummaryFooter title="ລວມຄ່າທີ່ພັກ" totals={accommodationTotals} />
                                </CostCategoryContent>
                                
                                {/* Transport */}
                                <CostCategoryContent title="ຄ່າຂົນສົ່ງ" icon={<Truck className="h-5 w-5" />}>
                                    <div className="space-y-4 pt-2">
                                        {allCosts.trips.map((trip, index) => (
                                            <Card key={trip.id} className="bg-muted/30">
                                                <CardHeader className="flex-row items-center justify-between p-3 bg-muted/50">
                                                    <CardTitle className="text-base">ການເດີນທາງ #{index + 1}</CardTitle>
                                                    <div className="print:hidden">
                                                        <Button variant="ghost" size="icon" onClick={() => deleteItem('trips', trip.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>ສະຖານທີ່</Label>
                                                            <Input placeholder="ສະຖານທີ່" value={trip.location} onChange={e => updateItem('trips', trip.id, 'location', e.target.value)} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>ເສັ້ນທາງ</Label>
                                                            <Input placeholder="ວຽງຈັນ - ວັງວຽງ" value={trip.route} onChange={e => updateItem('trips', trip.id, 'route', e.target.value)} />
                                                        </div>
                                                        <div className="col-span-2 space-y-2">
                                                            <Label>ປະເພດລົດ</Label>
                                                            <Input placeholder="ລົດຕູ້ທຳມະດາ" value={trip.vehicleType} onChange={e => updateItem('trips', trip.id, 'vehicleType', e.target.value)} />
                                                        </div>
                                                    </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">ຈຳນວນຄັນ</Label>
                                                            <Input type="number" min="1" value={trip.numVehicles || ''} onChange={e => updateItem('trips', trip.id, 'numVehicles', parseInt(e.target.value) || 1)} className="h-8"/>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">ຈຳນວນວັນ</Label>
                                                            <Input type="number" min="1" value={trip.numDays || ''} onChange={e => updateItem('trips', trip.id, 'numDays', parseInt(e.target.value) || 1)} className="h-8"/>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">ລາຄາ/ຄັນ</Label>
                                                            <Input type="number" min="0" value={trip.pricePerVehicle || ''} onChange={e => updateItem('trips', trip.id, 'pricePerVehicle', parseFloat(e.target.value) || 0)} className="h-8"/>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">ສະກຸນເງິນ</Label>
                                                            <Select value={trip.currency} onValueChange={(v) => updateItem('trips', trip.id, 'currency', v)}>
                                                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    {(Object.keys(currencySymbols) as Currency[]).map(c => (<SelectItem key={c} value={c}>{currencySymbols[c]}</SelectItem>))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        <Button onClick={addTrip}><PlusCircle className="mr-2 h-4 w-4" />ເພີ່ມຄ່າຂົນສົ່ງ</Button>
                                    </div>
                                    <SummaryFooter title="ລວມຄ່າຂົນສົ່ງ" totals={tripTotals} />
                                </CostCategoryContent>
                                {/* Flights */}
                                <CostCategoryContent title="ຄ່າປີ້ຍົນ" icon={<Plane className="h-5 w-5" />}>
                                    <div className="space-y-4 pt-2">
                                        {allCosts.flights.map((flight, index) => (
                                            <Card key={flight.id} className="bg-muted/30">
                                                <CardHeader className="flex-row items-center justify-between p-3 bg-muted/50">
                                                    <CardTitle className="text-base">ປີ້ຍົນ #{index + 1}</CardTitle>
                                                    <div className="print:hidden">
                                                        <Button variant="ghost" size="icon" onClick={() => deleteItem('flights', flight.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>ເສັ້ນທາງ</Label>
                                                            <div className="flex items-center gap-2">
                                                                <Input placeholder="ຈາກ" value={flight.from} onChange={e => updateItem('flights', flight.id, 'from', e.target.value)} />
                                                                <span>ໄປ</span>
                                                                <Input placeholder="ໄປ" value={flight.to} onChange={e => updateItem('flights', flight.id, 'to', e.target.value)} />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>ວັນ-ເວລາເດີນທາງ</Label>
                                                            <div className="flex items-center gap-2">
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <Button variant={"outline"} className="w-[180px] justify-start text-left font-normal">
                                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                                            {flight.departureDate && isValid(new Date(flight.departureDate)) ? format(new Date(flight.departureDate), "dd/MM/yyyy") : <span>mm/dd/yyyy</span>}
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-auto p-0">
                                                                        <Calendar mode="single" selected={flight.departureDate ? new Date(flight.departureDate) : undefined} onSelect={(date) => updateItem('flights', flight.id, 'departureDate', date)} initialFocus />
                                                                    </PopoverContent>
                                                                </Popover>
                                                                <div className="relative">
                                                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                    <Input type="time" value={flight.departureTime} onChange={e => updateItem('flights', flight.id, 'departureTime', e.target.value)} className="pl-10" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                        <div className="grid grid-cols-3 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>ລາຄາ/ຄົນ</Label>
                                                            <Input type="number" min="0" value={flight.pricePerPerson || ''} onChange={e => updateItem('flights', flight.id, 'pricePerPerson', parseFloat(e.target.value) || 0)} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>ຈຳນວນຄົນ</Label>
                                                            <Input type="number" min="1" value={flight.numPeople || ''} onChange={e => updateItem('flights', flight.id, 'numPeople', parseInt(e.target.value) || 1)} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>ສະກຸນເງິນ</Label>
                                                            <Select value={flight.currency} onValueChange={(v) => updateItem('flights', flight.id, 'currency', v)}>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>{(Object.keys(currencySymbols) as Currency[]).map(c => (<SelectItem key={c} value={c}>{currencySymbols[c]}</SelectItem>))}</SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        <Button onClick={addFlight}><PlusCircle className="mr-2 h-4 w-4" />ເພີ່ມຄ່າປີ້ຍົນ</Button>
                                    </div>
                                    <SummaryFooter title="ລວມຄ່າປີ້ຍົນ" totals={flightTotals} />
                                </CostCategoryContent>
                                {/* Train Tickets */}
                                <CostCategoryContent title="ຄ່າປີ້ລົດໄຟ" icon={<TrainFront className="h-5 w-5" />}>
                                    <div className="space-y-4 pt-2">
                                        {allCosts.trainTickets.map((ticket, index) => (
                                            <Card key={ticket.id} className="bg-muted/30">
                                                <CardHeader className="flex-row items-center justify-between p-3 bg-muted/50">
                                                    <CardTitle className="text-base">ປີ້ລົດໄຟ #{index + 1}</CardTitle>
                                                    <div className="print:hidden">
                                                        <Button variant="ghost" size="icon" onClick={() => deleteItem('trainTickets', ticket.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>ເສັ້ນທາງ</Label>
                                                            <div className="flex items-center gap-2">
                                                                <Input placeholder="ຈາກ" value={ticket.from} onChange={e => updateItem('trainTickets', ticket.id, 'from', e.target.value)} />
                                                                <span>ໄປ</span>
                                                                <Input placeholder="ໄປ" value={ticket.to} onChange={e => updateItem('trainTickets', ticket.id, 'to', e.target.value)} />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>ວັນ-ເວລາເດີນທາງ</Label>
                                                            <div className="flex items-center gap-2">
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <Button variant={"outline"} className="w-[180px] justify-start text-left font-normal">
                                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                                            {ticket.departureDate && isValid(new Date(ticket.departureDate)) ? format(new Date(ticket.departureDate), "dd/MM/yyyy") : <span>mm/dd/yyyy</span>}
                                                                        </Button>.
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-auto p-0">
                                                                        <Calendar mode="single" selected={ticket.departureDate ? new Date(ticket.departureDate) : undefined} onSelect={(date) => updateItem('trainTickets', ticket.id, 'departureDate', date)} initialFocus />
                                                                    </PopoverContent>
                                                                </Popover>
                                                                <div className="relative">
                                                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                    <Input type="time" value={ticket.departureTime} onChange={e => updateItem('trainTickets', ticket.id, 'departureTime', e.target.value)} className="pl-10" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>ລາຄາ/ປີ້</Label>
                                                            <Input type="number" min="0" value={ticket.pricePerTicket || ''} onChange={e => updateItem('trainTickets', ticket.id, 'pricePerTicket', parseFloat(e.target.value) || 0)} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>ຈຳນວນປີ້</Label>
                                                            <Input type="number" min="1" value={ticket.numTickets || ''} onChange={e => updateItem('trainTickets', ticket.id, 'numTickets', parseInt(e.target.value) || 1)} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>ຊັ້ນປີ້</Label>
                                                            <Input value={ticket.ticketClass} onChange={e => updateItem('trainTickets', ticket.id, 'ticketClass', e.target.value)} placeholder="ເຊັ່ນ: ຊັ້ນ 1, ຊັ້ນ 2" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>ສະກຸນເງິນ</Label>
                                                            <Select value={ticket.currency} onValueChange={(v) => updateItem('trainTickets', ticket.id, 'currency', v)}>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>{(Object.keys(currencySymbols) as Currency[]).map(c => (<SelectItem key={c} value={c}>{currencySymbols[c]}</SelectItem>))}</SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        <Button onClick={addTrainTicket}><PlusCircle className="mr-2 h-4 w-4" />ເພີ່ມຄ່າປີ້ລົດໄຟ</Button>
                                    </div>
                                    <SummaryFooter title="ລວມຄ່າປີ້ລົດໄຟ" totals={trainTotals} />
                                </CostCategoryContent>
                                {/* Entrance Fees */}
                                <CostCategoryContent title="ຄ່າເຂົ້າຊົມສະຖານທີ່" icon={<Camera className="h-5 w-5" />}>
                                    <div className="space-y-4 pt-2">
                                        {allCosts.entranceFees.map((fee, index) => (
                                            <Card key={fee.id} className="bg-muted/30">
                                                <CardHeader className="flex-row items-center justify-between p-3 bg-muted/50">
                                                    <CardTitle className="text-base">ຄ່າເຂົ້າຊົມ #{index + 1}</CardTitle>
                                                    <div className="print:hidden">
                                                        <Button variant="ghost" size="icon" onClick={() => deleteItem('entranceFees', fee.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>ຊື່ສະຖານທີ່</Label>
                                                            <Input value={fee.locationName} onChange={e => updateItem('entranceFees', fee.id, 'locationName', e.target.value)} placeholder="ເຊັ່ນ: ພະທາດຫຼວງ, ປະຕູໄຊ" />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Pax</Label>
                                                            <Input type="number" min="1" value={fee.pax || ''} onChange={e => updateItem('entranceFees', fee.id, 'pax', parseInt(e.target.value) || 1)} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>ຈຳນວນສະຖານທີ່</Label>
                                                            <Input type="number" min="1" value={fee.numLocations || ''} onChange={e => updateItem('entranceFees', fee.id, 'numLocations', parseInt(e.target.value) || 1)} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>ລາຄາ</Label>
                                                            <Input type="number" min="0" value={fee.price || ''} onChange={e => updateItem('entranceFees', fee.id, 'price', parseFloat(e.target.value) || 0)} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>ສະກຸນເເງິນ</Label>
                                                            <Select value={fee.currency} onValueChange={(v) => updateItem('entranceFees', fee.id, 'currency', v)}>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>{(Object.keys(currencySymbols) as Currency[]).map(c => (<SelectItem key={c} value={c}>{currencySymbols[c]}</SelectItem>))}</SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        <Button onClick={addEntranceFee}><PlusCircle className="mr-2 h-4 w-4" />ເພີ່ມຄ່າເຂົ້າຊົມ</Button>
                                    </div>
                                    <SummaryFooter title="ລວມຄ່າເຂົ້າຊົມ" totals={entranceFeeTotals} />
                                </CostCategoryContent>
                                {/* Meals */}
                                <CostCategoryContent title="ຄ່າອາຫານ" icon={<UtensilsCrossed className="h-5 w-5" />}>
                                <div className="space-y-4 pt-2">
                                        {allCosts.meals.map((meal, index) => (
                                            <Card key={meal.id} className="bg-muted/30">
                                                <CardHeader className="flex-row items-center justify-between p-3 bg-muted/50">
                                                    <CardTitle className="text-base">ລາຍການອາຫານ #{index + 1}</CardTitle>
                                                    <div className="print:hidden">
                                                        <Button variant="ghost" size="icon" onClick={() => deleteItem('meals', meal.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>ຊື່ລາຍການ</Label>
                                                            <Input value={meal.name} onChange={e => updateItem('meals', meal.id, 'name', e.target.value)} placeholder="เช่น อาหารเย็นวันแรก, ร้าน..." />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Pax</Label>
                                                            <Input type="number" min="1" value={meal.pax || ''} onChange={e => updateItem('meals', meal.id, 'pax', parseInt(e.target.value) || 1)} />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">ເຊົ້າ</Label>
                                                            <Input type="number" min="0" value={meal.breakfast || ''} onChange={e => updateItem('meals', meal.id, 'breakfast', parseInt(e.target.value) || 0)} className="h-8"/>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">ທ່ຽງ</Label>
                                                            <Input type="number" min="0" value={meal.lunch || ''} onChange={e => updateItem('meals', meal.id, 'lunch', parseInt(e.target.value) || 0)} className="h-8"/>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">ແລງ</Label>
                                                            <Input type="number" min="0" value={meal.dinner || ''} onChange={e => updateItem('meals', meal.id, 'dinner', parseInt(e.target.value) || 0)} className="h-8"/>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>ລາຄາ/ມື້</Label>
                                                            <Input type="number" min="0" value={meal.pricePerMeal || ''} onChange={e => updateItem('meals', meal.id, 'pricePerMeal', parseFloat(e.target.value) || 0)} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>ສະກຸນເງິນ</Label>
                                                            <Select value={meal.currency} onValueChange={(v) => updateItem('meals', meal.id, 'currency', v)}>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>{(Object.keys(currencySymbols) as Currency[]).map(c => (<SelectItem key={c} value={c}>{currencySymbols[c]}</SelectItem>))}</SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        <Button onClick={addMealCost}><PlusCircle className="mr-2 h-4 w-4" />ເພີ່ມຄ່າອາຫານ</Button>
                                </div>
                                <SummaryFooter title="ລວມຄ່າອາຫານ" totals={mealTotals} />
                                </CostCategoryContent>
                                {/* Guide */}
                                <CostCategoryContent title="ຄ່າໄກ້" icon={<Users className="h-5 w-5" />}>
                                <div className="space-y-4 pt-2">
                                        {allCosts.guides.map((guide, index) => (
                                            <Card key={guide.id} className="bg-muted/30">
                                                <CardHeader className="flex-row items-center justify-between p-3 bg-muted/50">
                                                    <CardTitle className="text-base">ລາຍການໄກ້ #{index + 1}</CardTitle>
                                                    <div className="print:hidden">
                                                        <Button variant="ghost" size="icon" onClick={() => deleteItem('guides', guide.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>ຊື່ໄກ້/ບໍລິສັດ</Label>
                                                            <Input value={guide.guideName} onChange={e => updateItem('guides', guide.id, 'guideName', e.target.value)} placeholder="ຊື່ໄກ້" />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>ຈຳນວນໄກ້</Label>
                                                            <Input type="number" min="1" value={guide.numGuides || ''} onChange={e => updateItem('guides', guide.id, 'numGuides', parseInt(e.target.value) || 1)} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>ຈຳນວນວັນ</Label>
                                                            <Input type="number" min="1" value={guide.numDays || ''} onChange={e => updateItem('guides', guide.id, 'numDays', parseInt(e.target.value) || 1)} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>ລາຄາ/ວັນ</Label>
                                                            <Input type="number" min="0" value={guide.pricePerDay || ''} onChange={e => updateItem('guides', guide.id, 'pricePerDay', parseFloat(e.target.value) || 0)} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>ສະກຸນເງິນ</Label>
                                                            <Select value={guide.currency} onValueChange={(v) => updateItem('guides', guide.id, 'currency', v)}>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>{(Object.keys(currencySymbols) as Currency[]).map(c => (<SelectItem key={c} value={c}>{currencySymbols[c]}</SelectItem>))}</SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        <Button onClick={addGuideFee}><PlusCircle className="mr-2 h-4 w-4" />ເພີ່ມຄ່າໄກ້</Button>
                                </div>
                                <SummaryFooter title="ລວມຄ່າໄກ້" totals={guideTotals} />
                                </CostCategoryContent>
                                {/* Documents */}
                                <CostCategoryContent title="ຄ່າເອກະສານ" icon={<FileText className="h-5 w-5" />}>
                                    <div className="space-y-4 pt-2">
                                        {allCosts.documents.map((doc, index) => (
                                            <Card key={doc.id} className="bg-muted/30">
                                                <CardHeader className="flex-row items-center justify-between p-3 bg-muted/50">
                                                    <CardTitle className="text-base">ລາຍການເອກະສານ #{index + 1}</CardTitle>
                                                    <div className="print:hidden">
                                                        <Button variant="ghost" size="icon" onClick={() => deleteItem('documents', doc.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                        <Label>ຊື່ເອກະສານ</Label>
                                                        <Input value={doc.documentName} onChange={e => updateItem('documents', doc.id, 'documentName', e.target.value)} placeholder="เช่น ค่าวีซ่า, ค่าเอกสารผ่านแดน" />
                                                    </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Pax</Label>
                                                            <Input type="number" min="1" value={doc.pax || ''} onChange={e => updateItem('documents', doc.id, 'pax', parseInt(e.target.value) || 1)} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>ລາຄາ</Label>
                                                            <Input type="number" min="0" value={doc.price || ''} onChange={e => updateItem('documents', doc.id, 'price', parseFloat(e.target.value) || 0)} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>ສະກຸນເງິນ</Label>
                                                            <Select value={doc.currency} onValueChange={(v) => updateItem('documents', doc.id, 'currency', v)}>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>{(Object.keys(currencySymbols) as Currency[]).map(c => (<SelectItem key={c} value={c}>{currencySymbols[c]}</SelectItem>))}</SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        <Button onClick={addDocumentFee}><PlusCircle className="mr-2 h-4 w-4" />ເພີ່ມຄ່າເອກະສານ</Button>
                                    </div>
                                    <SummaryFooter title="ລວມຄ່າເອກະສານ" totals={documentTotals} />
                                </CostCategoryContent>
                            </Accordion>
                        </CardContent>
                    </Card>
                    
                    <div className="print:hidden"><TotalCostCard totalsByCategory={totalsByCategory} /></div>

                    <div className="space-y-4 print:hidden">
                        <Card>
                            <CardHeader>
                                <CardTitle>ຄ່າໃຊ້ຈ່າຍລວມທັງໝົດ ແລະ ອັດຕາແລກປ່ຽນ</CardTitle>
                                <CardDescription>ສະຫຼຸບລວມຍອດຄ່າໃຊ້ຈ່າຍທັງໝົດ ແລະ ໃສ່ອັດຕາແລກປ່ຽນ</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {(Object.keys(grandTotals) as Currency[]).map(currency => (
                                            <Card key={currency}>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-lg">{currency}</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-2xl font-bold">{formatNumber(grandTotals[currency])}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {(Object.keys(exchangeRates) as (keyof ExchangeRateMatrix)[]).map(from => (
                                            <div key={from} className="space-y-2">
                                                <Label className="font-semibold">1 {from}</Label>
                                                {(Object.keys(exchangeRates[from]) as Currency[]).map(to => {
                                                    if (from === to) return null;
                                                    return (
                                                    <div key={to} className="flex items-center gap-2">
                                                        <ChevronsRight className="h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            type="number"
                                                            value={exchangeRates[from][to]}
                                                            onChange={(e) => handleRateChange(from, to, e.target.value)}
                                                            className="h-8"
                                                        />
                                                        <Label htmlFor={`${from}-to-${to}`} className="text-sm">{to}</Label>
                                                    </div>
                                                )})}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>ຍອດລວມທີ່ແປງແລ້ວ</CardTitle>
                                        <CardDescription>ຍອດລວມທັງໝົດໃນສະກຸນເງິນດຽວ</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="target-currency">ເລືອກສະກຸນເງິນ</Label>
                                            <Select value={targetCurrency} onValueChange={v => setTargetCurrency(v as Currency)}>
                                                <SelectTrigger id="target-currency">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(Object.keys(currencySymbols) as Currency[]).map(c => <SelectItem key={c} value={c}>{currencySymbols[c]}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="border bg-background rounded-lg p-4 text-center">
                                            <p className="text-sm text-muted-foreground">ຍອດລວມ</p>
                                            <p className="text-3xl font-bold text-primary">{formatNumber(convertedTotal, {maximumFractionDigits: 2})}</p>
                                            <p className="font-semibold">{targetCurrency}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>ລາຄາຂາຍ</CardTitle>
                                        <CardDescription>ຄຳນວນລາຄາຂາຍໂດຍອີງໃສ່ເປີເຊັນທີ່ເພີ່ມຂຶ້ນ</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="selling-percentage">ຍອດລວມ x %</Label>
                                            <div className="relative">
                                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="selling-percentage"
                                                    type="number"
                                                    value={sellingPricePercentage || ''}
                                                    onChange={(e) => setSellingPricePercentage(Number(e.target.value))}
                                                    placeholder="20"
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>
                                        <div className="border bg-background rounded-lg p-4 text-center">
                                            <p className="text-sm text-muted-foreground">ລາຄາຂາຍສຸດທິ</p>
                                            <p className="text-3xl font-bold text-primary">{formatNumber(sellingPrice, {maximumFractionDigits: 2})}</p>
                                            <p className="font-semibold">{targetCurrency}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><TrendingUp/>ກຳໄລ</CardTitle>
                                        <CardDescription>ກຳໄລຈາກເປີເຊັນທີ່ເພີ່ມຂຶ້ນ</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="border bg-background rounded-lg p-4 text-center h-full flex flex-col justify-center">
                                            <p className="text-sm text-muted-foreground">ກຳໄລ</p>
                                            <p className="text-3xl font-bold text-green-600">{formatNumber(profit, {maximumFractionDigits: 2})}</p>
                                            <p className="font-semibold">{targetCurrency}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                </div>
            </main>
        </div>
    );
}