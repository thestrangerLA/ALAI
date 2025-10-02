"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Calendar as CalendarIcon, Calculator, Pencil, Trash2 } from 'lucide-react';
import { SavedCalculation } from './tour/calculator/[id]/page';
import { useToast } from "@/hooks/use-toast";


const SAVED_CALCULATIONS_KEY = 'tour-savedCalculations';

export default function TourListPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);
    const [groupedCalculations, setGroupedCalculations] = useState<Record<string, SavedCalculation[]>>({});
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [availableYears, setAvailableYears] = useState<string[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem(SAVED_CALCULATIONS_KEY);
        if (saved) {
            const calculations: SavedCalculation[] = JSON.parse(saved, (key, value) => {
                if (key === 'savedAt' || key === 'startDate' || key === 'endDate' || key === 'checkInDate' || key === 'departureDate') {
                    return value ? new Date(value) : undefined;
                }
                return value;
            });
            setSavedCalculations(calculations);
            
            const years = [...new Set(calculations.map(c => new Date(c.savedAt).getFullYear().toString()))];
            const currentYear = new Date().getFullYear().toString();
            if (!years.includes(currentYear)) {
                years.push(currentYear);
            }
            setAvailableYears(years.sort((a, b) => parseInt(b) - parseInt(a)));
        } else {
             setAvailableYears([new Date().getFullYear().toString()]);
        }
    }, []);

    useEffect(() => {
        const filtered = savedCalculations.filter(c => new Date(c.savedAt).getFullYear().toString() === selectedYear);
        const grouped = filtered.reduce((acc, calc) => {
            const month = format(new Date(calc.savedAt), 'MMMM yyyy');
            if (!acc[month]) {
                acc[month] = [];
            }
            acc[month].push(calc);
            // Sort calculations within each month by date
            acc[month].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
            return acc;
        }, {} as Record<string, SavedCalculation[]>);

        const sortedGroupKeys = Object.keys(grouped).sort((a, b) => {
            return new Date(b).getTime() - new Date(a).getTime();
        });

        const sortedGroupedCalculations: Record<string, SavedCalculation[]> = {};
        for(const key of sortedGroupKeys) {
            sortedGroupedCalculations[key] = grouped[key];
        }

        setGroupedCalculations(sortedGroupedCalculations);
    }, [savedCalculations, selectedYear]);

    const handleAddNewCalculation = () => {
        const newId = uuidv4();
        const newCalculation: SavedCalculation = {
            id: newId,
            savedAt: new Date(),
            tourInfo: {
                mouContact: '',
                groupCode: `LTH${format(new Date(),'yyyyMMddHHmmss')}`,
                destinationCountry: '',
                program: '',
                startDate: undefined,
                endDate: undefined,
                numDays: 1,
                numNights: 0,
                numPeople: 1,
                travelerInfo: ''
            },
            allCosts: {
                accommodations: [],
                trips: [],
                flights: [],
                trainTickets: [],
                entranceFees: [],
                meals: [],
                guides: [],
                documents: [],
            },
        };
        
        const updatedSaved = [...savedCalculations, newCalculation];
        localStorage.setItem(SAVED_CALCULATIONS_KEY, JSON.stringify(updatedSaved));
        setSavedCalculations(updatedSaved);
        router.push(`/tour/calculator/${newId}`);
    };
    
    const navigateToCalculation = (id: string) => {
        router.push(`/tour/calculator/${id}`);
    }
    
    const handleDeleteCalculation = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent row click event
        if (window.confirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຂໍ້ມູນການຄຳນວນນີ້?")) {
            const updatedSaved = savedCalculations.filter(c => c.id !== id);
            localStorage.setItem(SAVED_CALCULATIONS_KEY, JSON.stringify(updatedSaved));
            setSavedCalculations(updatedSaved);
            toast({
                title: "ລຶບຂໍ້ມູນສຳເລັດ",
                variant: "destructive"
            });
        }
    };


    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
             <header className="sticky top-0 z-30 flex h-20 items-center gap-4 bg-primary px-4 text-primary-foreground sm:px-6">
                <div className="flex-1">
                    <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <Calculator className="h-6 w-6"/>
                        ລາຍການຄຳນວນທັງໝົດ
                    </h1>
                </div>
                 <div className="flex items-center gap-2">
                     <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5"/>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-[120px] bg-primary text-primary-foreground border-primary-foreground">
                                <SelectValue placeholder="ເລືອກປີ" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableYears.map(year => (
                                    <SelectItem key={year} value={year}>ປີ {parseInt(year) + 543}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                     </div>
                    <Button onClick={handleAddNewCalculation}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        ເພີ່ມການຄຳນວນໃໝ່
                    </Button>
                </div>
            </header>
            <main className="flex w-full flex-1 flex-col gap-8 p-4 sm:px-6 sm:py-4">
                 <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-4">
                     {Object.keys(groupedCalculations).length > 0 ? (
                        <Accordion type="multiple" defaultValue={Object.keys(groupedCalculations)} className="w-full space-y-4">
                            {Object.entries(groupedCalculations).map(([month, calcs]) => (
                                <AccordionItem value={month} key={month} className="border-none">
                                     <Card className="overflow-hidden">
                                        <AccordionTrigger className="px-6 py-4 bg-card hover:no-underline">
                                            <h2 className="text-lg font-semibold">{month}</h2>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-0">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted/50">
                                                        <tr className="text-left">
                                                            <th className="p-3 font-medium">ວັນທີບັນທຶກ</th>
                                                            <th className="p-3 font-medium">Group Code</th>
                                                            <th className="p-3 font-medium">ໂປຣແກຣມ</th>
                                                            <th className="p-3 font-medium">ຈຸດໝາຍ</th>
                                                            <th className="p-3 font-medium">ຈຳນວນຄົນ</th>
                                                            <th className="p-3 font-medium text-right">ການກະທຳ</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {calcs.map(calc => (
                                                            <tr key={calc.id} className="border-b border-muted/50 last:border-b-0 cursor-pointer hover:bg-muted/30" onClick={() => navigateToCalculation(calc.id)}>
                                                                <td className="p-3">{format(new Date(calc.savedAt), 'dd/MM/yyyy HH:mm')}</td>
                                                                <td className="p-3">{calc.tourInfo.groupCode}</td>
                                                                <td className="p-3">{calc.tourInfo.program}</td>
                                                                <td className="p-3">{calc.tourInfo.destinationCountry}</td>
                                                                <td className="p-3">{calc.tourInfo.numPeople}</td>
                                                                <td className="p-3 text-right">
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigateToCalculation(calc.id); }}>
                                                                        <Pencil className="h-4 w-4 text-blue-500" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleDeleteCalculation(e, calc.id)}>
                                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </AccordionContent>
                                    </Card>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                         <Card>
                            <CardContent className="p-10 text-center text-muted-foreground">
                                <p>ບໍ່ມີຂໍ້ມູນການຄຳນວນໃນປີ {parseInt(selectedYear)+543}.</p>
                                <p>ກົດ "ເພີ່ມການຄຳນວນໃໝ່" ເພື່ອເລີ່ມຕົ້ນ.</p>
                             </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
