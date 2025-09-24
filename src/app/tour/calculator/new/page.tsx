
"use client"

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, PlusCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { saveCalculation } from '@/services/tourCalculatorService';
import type { SavedCalculation } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import StaticExportWrapper from '@/components/StaticExportWrapper';


function NewCalculationPageComponent() {
    const { toast } = useToast();
    const router = useRouter();
    const [groupCode, setGroupCode] = useState(`NewCalc-${uuidv4().substring(0, 4)}`);
    const [programName, setProgramName] = useState('New Calculation');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        const newCalculationData: Omit<SavedCalculation, 'id'| 'savedAt'> = {
            name: programName,
            tourInfo: {
                mouContact: '',
                groupCode: groupCode,
                destinationCountry: '',
                program: programName,
                startDate: new Date(),
                endDate: new Date(),
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
            }
        };
        
        try {
            const newId = await saveCalculation(newCalculationData);
             toast({
                title: "ສ້າງລາຍການຄຳນວນໃໝ່ສຳເລັດ",
                description: "ກຳລັງໄປທີ່ໜ້າລາຍລະອຽດ...",
            });
            router.push(`/tour/calculator/${newId}`);
        } catch (error) {
             toast({
                title: "ເກີດຂໍ້ຜິດພາດ",
                description: "ບໍ່ສາມາດສ້າງລາຍການຄຳນວນໃໝ່ໄດ້",
                variant: "destructive",
            });
            console.error("Failed to create new calculation:", error);
            setIsSaving(false);
        }
    };


    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                    <Link href="/tour/calculator">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">ກັບໄປໜ້າລາຍການ</span>
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <PlusCircle className="h-6 w-6 text-primary"/>
                    <h1 className="text-xl font-bold tracking-tight">ເພີ່ມການຄຳນວນໃໝ່</h1>
                </div>
            </header>

            <main className="flex flex-1 flex-col items-center justify-start gap-4 p-4 mt-8">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle>ສ້າງການຄຳນວນໃໝ່</CardTitle>
                        <CardDescription>ປ້ອນຂໍ້ມູນເບື້ອງຕົ້ນເພື່ອເລີ່ມການຄຳນວນ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                             <div className="grid gap-2">
                                <Label htmlFor="programName">ຊື່ໂປຣແກຣມ/ລາຍການ</Label>
                                <Input
                                    id="programName"
                                    value={programName}
                                    onChange={(e) => setProgramName(e.target.value)}
                                    placeholder="ເຊັ່ນ: ທົວວຽງຈັນ 3 ມື້ 2 ຄືນ"
                                    required
                                />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="groupCode">Group Code</Label>
                                <Input
                                    id="groupCode"
                                    value={groupCode}
                                    onChange={(e) => setGroupCode(e.target.value)}
                                    placeholder="ລະຫັດກຸ່ມທົວ"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" asChild>
                                    <Link href="/tour/calculator">
                                        ຍົກເລີກ
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={isSaving}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {isSaving ? 'ກຳລັງສ້າງ...' : 'ສ້າງ ແລະ ເລີ່ມຄຳນວນ'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
    );
}

export default function NewCalculationPage() {
    return (
        <StaticExportWrapper fallback={<LoadingFallback />}>
            <NewCalculationPageComponent />
        </StaticExportWrapper>
    )
}
