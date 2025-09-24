// src/app/tour/calculator/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, Trash2, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { listenToSavedCalculations, deleteCalculation } from '@/services/tourCalculatorService';
import type { SavedCalculation } from '@/lib/types';
import { format } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";

export default function TourCalculationsListPage() {
    const [calculations, setCalculations] = useState<SavedCalculation[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = listenToSavedCalculations((data) => {
            setCalculations(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);
    
    const handleDelete = async (id: string, name: string) => {
        if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายการคำนวณ "${name}"?`)) {
            try {
                await deleteCalculation(id);
                toast({
                    title: "ลบสำเร็จ",
                    description: `รายการคำนวณ "${name}" ถูกลบแล้ว`,
                });
            } catch (error) {
                toast({
                    title: "เกิดข้อผิดพลาด",
                    description: "ไม่สามารถลบรายการคำนวณได้",
                    variant: "destructive",
                });
                console.error("Failed to delete calculation:", error);
            }
        }
    };


    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                 <h1 className="text-xl font-bold tracking-tight">ລາຍການຄຳນວນຕົ້ນທຶນທົວ</h1>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>ລາຍການທັງໝົດ</CardTitle>
                                <CardDescription>ລາຍການຄຳນວນຕົ້ນທຶນທີ່ບັນທຶກໄວ້</CardDescription>
                            </div>
                             <Button asChild>
                                <Link href="/tour/calculator/new">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    <span>ເພີ່ມການຄຳນວນໃໝ່</span>
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ຊື່ລາຍການ</TableHead>
                                    <TableHead>Group Code</TableHead>
                                    <TableHead>ວັນທີ່ບັນທຶກ</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">
                                            ກຳລັງໂຫຼດ...
                                        </TableCell>
                                    </TableRow>
                                ) : calculations.length > 0 ? (
                                    calculations.map((calc) => (
                                        <TableRow key={calc.id}>
                                            <TableCell className="font-medium">{calc.name || calc.tourInfo.program}</TableCell>
                                            <TableCell>{calc.tourInfo.groupCode}</TableCell>
                                            <TableCell>
                                                {calc.savedAt && 'seconds' in calc.savedAt ? format(new Date(calc.savedAt.seconds * 1000), 'dd/MM/yyyy p') : 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Toggle menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onSelect={() => router.push(`/tour/calculator/${calc.id}`)}>
                                                             <Edit className="mr-2 h-4 w-4"/>
                                                            ແກ້ໄຂ
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onSelect={() => handleDelete(calc.id, calc.name || calc.tourInfo.program)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            ລົບ
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">
                                            ຍັງບໍ່ມີລາຍການຄຳນວນ
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}