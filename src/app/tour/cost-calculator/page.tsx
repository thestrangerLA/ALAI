
"use client"

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, isSameMonth, isSameYear } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Calculator, MoreHorizontal, Search, ArrowLeft } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useUser, useAuth, initiateAnonymousSignIn } from '@/firebase';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toDateSafe } from '@/lib/timestamp';

export interface SavedCalculation {
    id: string;
    savedAt: any;
    tourInfo: {
        mouContact: string;
        groupCode: string;
        destinationCountry: string;
        program: string;
        startDate: any;
        endDate: any;
        numDays: number;
        numNights: number;
        numPeople: number;
        travelerInfo: string;
    };
    allCosts: any;
    ownerId: string;
}

export default function TourCostCalculatorListPage() {
    const router = useRouter();
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const auth = useAuth();

    const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);
    const [calculationsLoading, setCalculationsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');

    // Ensure user is signed in anonymously if not already
    useEffect(() => {
        if (!isUserLoading && !user && auth) {
            initiateAnonymousSignIn(auth);
        }
    }, [user, isUserLoading, auth]);

    useEffect(() => {
        if (!firestore || !user) return;

        setCalculationsLoading(true);
        // Path must match security rules: /users/{userId}/tourCalculations/{id}
        const calculationsColRef = collection(firestore, 'users', user.uid, 'tourCalculations');
        const q = query(calculationsColRef, orderBy('savedAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const calcs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedCalculation));
            setSavedCalculations(calcs);
            setCalculationsLoading(false);
        }, (error) => {
            console.error("Error fetching calculations:", error);
            setCalculationsLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, user]);

    const availableMonths = useMemo(() => {
        const monthSet = new Set<string>();
        savedCalculations.forEach(calc => {
            const date = toDateSafe(calc.savedAt);
            if (date) {
                monthSet.add(format(date, 'yyyy-MM'));
            }
        });
        return Array.from(monthSet).sort((a,b) => b.localeCompare(a));
    }, [savedCalculations]);

    const filteredCalculations = useMemo(() => {
         const filteredByMonth = savedCalculations.filter(calc => {
            if (selectedMonth === 'all') {
                return true;
            }
            const savedAtDate = toDateSafe(calc.savedAt);
            if (!savedAtDate) return false;
            
            const [year, month] = selectedMonth.split('-').map(Number);
            const selectedDate = new Date(year, month - 1);
            return isSameMonth(savedAtDate, selectedDate) && isSameYear(savedAtDate, selectedDate);
        });
        
        return filteredByMonth.filter(calc => {
            const groupCode = calc.tourInfo?.groupCode?.toLowerCase() || '';
            const program = calc.tourInfo?.program?.toLowerCase() || '';
            const destination = calc.tourInfo?.destinationCountry?.toLowerCase() || '';
            const queryText = searchQuery.toLowerCase();
            return groupCode.includes(queryText) || 
                   program.includes(queryText) ||
                   destination.includes(queryText);
        });
    }, [savedCalculations, searchQuery, selectedMonth]);

    const handleAddNewCalculation = async () => {
        if (!firestore || !user) {
            alert("ກະລຸນາລໍຖ້າການເຊື່ອມຕໍ່ລະບົບ...");
            return;
        }

        try {
            const newCalculationData = {
                ownerId: user.uid, // Required by security rules
                savedAt: serverTimestamp(),
                tourInfo: {
                    mouContact: '',
                    groupCode: `LTH${format(new Date(), 'yyyyMMddHHmmss')}`,
                    destinationCountry: '',
                    program: '',
                    startDate: null,
                    endDate: null,
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
                    overseasPackages: [],
                    activities: []
                },
            };
            const calculationsColRef = collection(firestore, 'users', user.uid, 'tourCalculations');
            const newDocRef = await addDoc(calculationsColRef, newCalculationData);
            router.push(`/tour/cost-calculator/${newDocRef.id}`);
        } catch (error) {
            console.error("Error adding new calculation:", error);
            alert("ເກີດຂໍ້ຜິດພາດໃນການສ້າງຂໍ້ມູນໃໝ່. ກະລຸນາລອງໃໝ່ອີກຄັ້ງ.");
        }
    };
    
    const handleDeleteCalculation = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!firestore || !user) return;

        if (window.confirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຂໍ້ມູນການຄຳນວນນີ້?")) {
            try {
                const docRef = doc(firestore, 'users', user.uid, 'tourCalculations', id);
                await deleteDoc(docRef);
            } catch (error) {
                console.error("Error deleting calculation:", error);
                alert("ເກີດຂໍ້ຜິດພາດໃນການລຶບຂໍ້ມູນ.");
            }
        }
    };

    if (isUserLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#f0f9f1]">
                <p className="text-lg">ກຳລັງກວດສອບສິດການເຂົ້າເຖິງ...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-[#f0f9f1]">
             <header className="sticky top-0 z-30 flex h-20 items-center gap-4 bg-[#67a36f] px-4 text-white sm:px-6">
                <Button variant="outline" size="icon" className="h-10 w-10 bg-transparent text-white border-white/40 hover:bg-white/10" asChild>
                    <Link href="/">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">ກັບໄປໜ້າຫຼັກ</span>
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <Calculator className="h-7 w-7"/>
                    <h1 className="text-2xl font-bold tracking-tight">
                        ລາຍການຄຳນວນຕົ້ນທຶນທັງໝົດ
                    </h1>
                </div>
                 <div className="ml-auto flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="search"
                            placeholder="ຄົ້ນຫາ..."
                            className="pl-9 sm:w-[300px] bg-white text-black border-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[180px] bg-white text-black border-none">
                            <SelectValue placeholder="ເລືອກເດືອນ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">ທຸກເດືອນ</SelectItem>
                            {availableMonths.map(month => (
                                <SelectItem key={month} value={month}>
                                    {format(new Date(month + '-02'), 'LLLL yyyy')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleAddNewCalculation} variant="ghost" className="text-white hover:bg-white/10 flex items-center gap-2">
                        <PlusCircle className="h-5 w-5" />
                        ເພີ່ມການຄຳນວນໃໝ່
                    </Button>
                </div>
            </header>
            <main className="flex w-full flex-1 flex-col gap-8 p-0">
                <div className="w-full">
                     {calculationsLoading ? (
                        <div className="p-20 text-center text-muted-foreground">
                            <p className="text-lg">ກຳລັງໂຫຼດຂໍ້ມູນການຄຳນວນ...</p>
                        </div>
                     ) : (
                        <div className="bg-white min-h-screen shadow-sm">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-[#f8fcf9]">
                                        <TableRow className="border-b border-gray-100 hover:bg-transparent">
                                            <TableHead className="w-[150px] font-bold text-gray-500 text-base py-5 pl-8">ວັນທີບັນທຶກ</TableHead>
                                            <TableHead className="font-bold text-gray-500 text-base py-5">Group Code</TableHead>
                                            <TableHead className="font-bold text-gray-500 text-base py-5">ໂປຣແກຣມ</TableHead>
                                            <TableHead className="font-bold text-gray-500 text-base py-5">ຈຸດໝາຍ</TableHead>
                                            <TableHead className="font-bold text-gray-500 text-base py-5 text-center">ຈຳນວນຄົນ</TableHead>
                                            <TableHead className="font-bold text-gray-500 text-base py-5 text-right pr-8">ການກະທຳ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredCalculations.length > 0 ? filteredCalculations.map(calc => {
                                            const savedAtDate = toDateSafe(calc.savedAt);
                                            return (
                                            <TableRow key={calc.id} className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50" onClick={() => router.push(`/tour/cost-calculator/${calc.id}`)}>
                                                <TableCell className="py-5 pl-8 text-base">{savedAtDate ? format(savedAtDate, 'dd/MM/yyyy') : '...'}</TableCell>
                                                <TableCell className="py-5 font-bold text-base text-gray-800">{calc.tourInfo?.groupCode}</TableCell>
                                                <TableCell className="py-5 text-base">{calc.tourInfo?.program || '-'}</TableCell>
                                                <TableCell className="py-5 text-base">{calc.tourInfo?.destinationCountry || '-'}</TableCell>
                                                <TableCell className="py-5 text-center text-base">{calc.tourInfo?.numPeople}</TableCell>
                                                <TableCell className="py-5 text-right pr-8" onClick={(e) => e.stopPropagation()}>
                                                     <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button size="icon" variant="ghost" className="hover:bg-gray-100">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Toggle menu</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem onSelect={() => router.push(`/tour/cost-calculator/${calc.id}`)}>Edit</DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={(e) => handleDeleteCalculation(e as any, calc.id)} className="text-red-500">Delete</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                            );
                                        }) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                                                    ບໍ່ພົບຂໍ້ມູນການຄຳນວນ.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
