
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/stat-card';
import Link from 'next/link';
import { ArrowLeft, Truck, DollarSign, Calendar, PlusCircle, Eye, Trash2, Receipt } from 'lucide-react';
import { listenToPurchases, addPurchase } from '@/services/purchaseService';
import { listenToOtherExpenses, addOtherExpense, deleteOtherExpense } from '@/services/otherExpensesService';
import { listenToStockItems } from '@/services/stockService';
import type { Purchase, StockItem, OtherExpense } from '@/lib/types';
import { PurchaseFormDialog } from '@/components/purchase-form-dialog';
import { PurchaseDetailsDialog } from '@/components/purchase-details-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

export default function PurchasesPage() {
  const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);
  const [allOtherExpenses, setAllOtherExpenses] = useState<OtherExpense[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [filteredOtherExpenses, setFilteredOtherExpenses] = useState<OtherExpense[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isPurchaseFormOpen, setPurchaseFormOpen] = useState(false);
  const [isExpenseFormOpen, setExpenseFormOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Filter states
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  useEffect(() => {
    const unsubscribePurchases = listenToPurchases(setAllPurchases);
    const unsubscribeOtherExpenses = listenToOtherExpenses(setAllOtherExpenses);
    const unsubscribeStock = listenToStockItems(setStockItems);
    return () => {
      unsubscribePurchases();
      unsubscribeOtherExpenses();
      unsubscribeStock();
    };
  }, []);
  
  const allTransactionDates = useMemo(() => {
    const purchaseDates = allPurchases.map(p => p.purchaseDate);
    const expenseDates = allOtherExpenses.map(e => e.date);
    return [...purchaseDates, ...expenseDates];
  }, [allPurchases, allOtherExpenses]);

  const availableYears = useMemo(() => {
    const years = new Set(allTransactionDates.map(ts => ts ? ts.toDate().getFullYear().toString() : null).filter(Boolean));
    return Array.from(years as Set<string>).sort((a, b) => parseInt(b) - parseInt(a));
  }, [allTransactionDates]);

  useEffect(() => {
    const filterItems = <T extends { purchaseDate?: any; date?: any }>(items: T[]): T[] => {
      let itemsToFilter = items;
      const getDate = (item: T) => item.purchaseDate || item.date;

      if (selectedYear !== 'all') {
        itemsToFilter = itemsToFilter.filter(item => {
          const date = getDate(item);
          return date ? date.toDate().getFullYear().toString() === selectedYear : false;
        });
      }
      if (selectedMonth !== 'all') {
        itemsToFilter = itemsToFilter.filter(item => {
          const date = getDate(item);
          return date ? (date.toDate().getMonth() + 1).toString() === selectedMonth : false;
        });
      }
      return itemsToFilter;
    };
    
    setFilteredPurchases(filterItems(allPurchases));
    setFilteredOtherExpenses(filterItems(allOtherExpenses));

  }, [selectedYear, selectedMonth, allPurchases, allOtherExpenses]);

  const handleResetFilters = () => {
    setSelectedYear('all');
    setSelectedMonth('all');
  }

  const totalPurchaseAmount = allPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalOtherExpensesAmount = allOtherExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = totalPurchaseAmount + totalOtherExpensesAmount;

  const totalFilteredPurchaseAmount = useMemo(() => filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0), [filteredPurchases]);
  const totalFilteredOtherExpensesAmount = useMemo(() => filteredOtherExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredOtherExpenses]);
  const totalFilteredExpenses = totalFilteredPurchaseAmount + totalFilteredOtherExpensesAmount;
  
  const handleSavePurchase = async (purchaseData: Omit<Purchase, 'id' | 'purchaseDate'> & { purchaseDate: Date }) => {
    const result = await addPurchase(purchaseData);
    if (result.success) {
      alert('ບັນທຶກການຊື້ສຳເລັດ!');
      setPurchaseFormOpen(false);
    } else {
      alert(`ເກີດຂໍ້ຜິດພາດ: ${result.message}`);
    }
  };

  const handleSaveExpense = async (description: string, amount: number) => {
    if (!description || amount <= 0) {
      alert("ກະລຸນາປ້ອນລາຍລະອຽດ ແລະ ຈຳນວນເງິນໃຫ້ຖືກຕ້ອງ.");
      return;
    }
    const result = await addOtherExpense({ description, amount });
    if (result.success) {
        alert("ບັນທຶກຄ່າໃຊ້ຈ່າຍສຳເລັດ!");
        setExpenseFormOpen(false);
    } else {
        alert(`ເກີດຂໍ້ຜິດພາດ: ${result.message}`);
    }
  };
  
  const handleDeleteExpense = async (id: string) => {
    if (window.confirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບລາຍຈ່າຍນີ້?")) {
        const result = await deleteOtherExpense(id);
        if (result.success) {
            alert("ລຶບລາຍຈ່າຍສຳເລັດ!");
        } else {
            alert(`ເກີດຂໍ້ຜິດພາດ: ${result.message}`);
        }
    }
  }

  const groupedPurchases = useMemo(() => {
    const groups: { [key: string]: Purchase[] } = {};
    filteredPurchases.forEach(purchase => {
      const dateString = purchase.purchaseDate.toDate().toLocaleDateString('en-CA');
      if (!groups[dateString]) groups[dateString] = [];
      groups[dateString].push(purchase);
    });
    return Object.entries(groups).sort(([dateA], [dateB]) => dateB.localeCompare(dateA));
  }, [filteredPurchases]);

  const groupedOtherExpenses = useMemo(() => {
    const groups: { [key: string]: OtherExpense[] } = {};
    filteredOtherExpenses.forEach(expense => {
      const dateString = expense.date.toDate().toLocaleDateString('en-CA');
      if (!groups[dateString]) groups[dateString] = [];
      groups[dateString].push(expense);
    });
    return Object.entries(groups).sort(([dateA], [dateB]) => dateB.localeCompare(dateA));
  }, [filteredOtherExpenses]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(value);
  
  const OtherExpenseForm = ({ isOpen, onOpenChange, onSave }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (desc: string, amount: number) => void }) => {
      const [description, setDescription] = useState('');
      const [amount, setAmount] = useState(0);

      const handleSaveClick = () => {
          onSave(description, amount);
          setDescription('');
          setAmount(0);
      };

      return (
          <Dialog open={isOpen} onOpenChange={onOpenChange}>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>ບັນທຶກຄ່າໃຊ້ຈ່າຍອື່ນໆ</DialogTitle>
                      <DialogDescription>
                          ປ້ອນລາຍລະອຽດຂອງຄ່າໃຊ້ຈ່າຍທີ່ບໍ່ແມ່ນການຊື້ສິນຄ້າ.
                      </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                      <div>
                          <label htmlFor="exp-desc">ລາຍລະອຽດ</label>
                          <Input id="exp-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="ຕົວຢ່າງ: ຄ່າໄຟຟ້າ, ຄ່ານ້ຳປະປາ..." />
                      </div>
                      <div>
                          <label htmlFor="exp-amount">ຈຳນວນເງິນ (ກີບ)</label>
                          <Input id="exp-amount" type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} />
                      </div>
                  </div>
                  <DialogFooter>
                      <DialogClose asChild><Button variant="secondary">ຍົກເລີກ</Button></DialogClose>
                      <Button onClick={handleSaveClick}>ບັນທຶກ</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      );
  };


  return (
    <>
      <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-orange-50 to-yellow-100">
        <header className="bg-white shadow-md sticky top-0 z-30 flex h-20 items-center gap-4 border-b px-4 sm:px-6">
          <Button variant="outline" size="icon" className="h-10 w-10" asChild>
            <Link href="/finance">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">ກັບໄປໜ້າການເງິນ</span>
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-3 rounded-lg"><Receipt className="h-6 w-6 text-white" /></div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">ລາຍງານລາຍຈ່າຍ</h1>
              <p className="text-sm text-muted-foreground">ປະຫວັດການຊື້ສິນຄ້າ ແລະ ຄ່າໃຊ້ຈ່າຍອື່ນໆ</p>
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-8 md:gap-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                  title="ລາຍຈ່າຍລວມທັງໝົດ"
                  value={formatCurrency(totalExpenses)}
                  icon={<DollarSign className="h-5 w-5 text-red-500" />}
                  description={`ຊື້ສິນຄ້າ: ${formatCurrency(totalPurchaseAmount)} | ອື່ນໆ: ${formatCurrency(totalOtherExpensesAmount)}`}
              />
          </div>

          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Select value={selectedYear} onValueChange={setSelectedYear}><SelectTrigger className="w-[120px]"><SelectValue placeholder="ເລືອກປີ" /></SelectTrigger><SelectContent><SelectItem value="all">ທຸກໆປີ</SelectItem>{availableYears.map(year => (<SelectItem key={year} value={year}>{year}</SelectItem>))}</SelectContent></Select>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}><SelectTrigger className="w-[120px]"><SelectValue placeholder="ເລືອກເດືອນ" /></SelectTrigger><SelectContent><SelectItem value="all">ທຸກໆເດືອນ</SelectItem>{Array.from({length: 12}, (_, i) => i + 1).map(month => (<SelectItem key={month} value={month.toString()}>{`ເດືອນ ${month}`}</SelectItem>))}</SelectContent></Select>
                <Button variant="outline" onClick={handleResetFilters}>ລ້າງຕົວກອງ</Button>
              </div>
              <div className="flex items-center gap-2">
                 <Button onClick={() => setExpenseFormOpen(true)} variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> ບັນທຶກຄ່າໃຊ້ຈ່າຍອື່ນໆ</Button>
                 <Button onClick={() => setPurchaseFormOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> ບັນທຶກການຊື້ໃໝ່</Button>
              </div>
          </div>
          
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">ລາຍຈ່າຍຕາມການກັ່ນຕອງ: <span className="text-red-600">{formatCurrency(totalFilteredExpenses)}</span></h2>
            <p className="text-sm text-muted-foreground">{`ຊື້ສິນຄ້າ: ${formatCurrency(totalFilteredPurchaseAmount)} | ອື່ນໆ: ${formatCurrency(totalFilteredOtherExpensesAmount)}`}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader><CardTitle>ລາຍການຊື້ສິນຄ້າເຂົ້າ</CardTitle></CardHeader>
              <CardContent>
                {groupedPurchases.length > 0 ? (
                  <Accordion type="multiple" className="w-full">
                    {groupedPurchases.map(([date, dailyPurchases]) => {
                      const dailyTotal = dailyPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
                      return (
                        <AccordionItem value={date} key={date}>
                          <AccordionTrigger><div className='flex justify-between w-full pr-4'><span>{new Date(date).toLocaleDateString('lo-LA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span><span className='font-semibold text-green-600'>{formatCurrency(dailyTotal)}</span></div></AccordionTrigger>
                          <AccordionContent>
                              <Table>
                                  <TableHeader><TableRow><TableHead>ເວລາ</TableHead><TableHead>ຜູ້ສະໜອງ</TableHead><TableHead className="text-right">ຍອດລວມ</TableHead><TableHead className="text-center">ຈັດການ</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                  {dailyPurchases.map(purchase => (
                                      <TableRow key={purchase.id}>
                                          <TableCell>{purchase.purchaseDate.toDate().toLocaleTimeString('lo-LA')}</TableCell>
                                          <TableCell className="font-medium">{purchase.supplierName || '-'}</TableCell>
                                          <TableCell className="text-right font-semibold text-green-600">{formatCurrency(purchase.totalAmount)}</TableCell>
                                          <TableCell className="text-center"><Button variant="outline" size="sm" onClick={() => setSelectedPurchase(purchase)}><Eye className="h-4 w-4 mr-1"/> ເບິ່ງ</Button></TableCell>
                                      </TableRow>
                                  ))}
                                  </TableBody>
                              </Table>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                ) : (<div className="h-48 text-center content-center text-gray-500"><p>-- ບໍ່ພົບຂໍ້ມູນການຊື້ສິນຄ້າ --</p></div>)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>ຄ່າໃຊ້ຈ່າຍອື່ນໆ</CardTitle></CardHeader>
              <CardContent>
                {groupedOtherExpenses.length > 0 ? (
                  <Accordion type="multiple" className="w-full">
                     {groupedOtherExpenses.map(([date, dailyExpenses]) => {
                       const dailyTotal = dailyExpenses.reduce((sum, e) => sum + e.amount, 0);
                       return (
                          <AccordionItem value={date} key={date}>
                            <AccordionTrigger><div className='flex justify-between w-full pr-4'><span>{new Date(date).toLocaleDateString('lo-LA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span><span className='font-semibold text-red-600'>{formatCurrency(dailyTotal)}</span></div></AccordionTrigger>
                            <AccordionContent>
                               <Table>
                                  <TableHeader><TableRow><TableHead>ເວລາ</TableHead><TableHead>ລາຍລະອຽດ</TableHead><TableHead className="text-right">ຈຳນວນເງິນ</TableHead><TableHead className="text-center">ຈັດການ</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                  {dailyExpenses.map(expense => (
                                    <TableRow key={expense.id}>
                                        <TableCell>{expense.date.toDate().toLocaleTimeString('lo-LA')}</TableCell>
                                        <TableCell className="font-medium">{expense.description}</TableCell>
                                        <TableCell className="text-right font-semibold text-red-600">{formatCurrency(expense.amount)}</TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteExpense(expense.id)}><Trash2 className="h-4 w-4"/></Button>
                                        </TableCell>
                                    </TableRow>
                                  ))}
                                  </TableBody>
                               </Table>
                            </AccordionContent>
                          </AccordionItem>
                       )
                     })}
                  </Accordion>
                ) : (<div className="h-48 text-center content-center text-gray-500"><p>-- ບໍ່ພົບຂໍ້ມູນຄ່າໃຊ້ຈ່າຍອື່ນໆ --</p></div>)}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <PurchaseFormDialog isOpen={isPurchaseFormOpen} onOpenChange={setPurchaseFormOpen} onSave={handleSavePurchase} stockItems={stockItems}/>
      <OtherExpenseForm isOpen={isExpenseFormOpen} onOpenChange={setExpenseFormOpen} onSave={handleSaveExpense} />
      {selectedPurchase && (<PurchaseDetailsDialog isOpen={!!selectedPurchase} onOpenChange={() => setSelectedPurchase(null)} purchase={selectedPurchase}/>)}
    </>
  );
}
