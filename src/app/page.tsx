'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Search, LogIn, Car, Wrench, Package, AlertTriangle } from 'lucide-react';
import { UserButton } from '@/components/auth/UserButton';
import type { Part } from '@/lib/types';

export default function PartsDashboard() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const [searchTerm, setSearchTerm] = useState('');

  const partsQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'parts'), orderBy('name', 'asc'));
  }, [user, firestore]);

  const { data: parts, loading: partsLoading } = useCollection(partsQuery);

  const filteredParts = useMemo(() => {
    if (!parts) return [];
    return parts.filter((part) =>
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.oemCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [parts, searchTerm]);

  const handleAddNew = async () => {
    if (!user || !firestore) return;
    const newPartRef = await addDoc(collection(firestore, 'users', user.uid, 'parts'), {
      name: "New Part",
      createdAt: serverTimestamp(),
      quantity: 0,
      category: "Uncategorized",
    });
    router.push(`/part/${newPartRef.id}`);
  };

  const isLoading = userLoading || partsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading inventory...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to Auto Parts Inventory</CardTitle>
            <CardDescription>Please sign in to manage your inventory.</CardDescription>
          </CardHeader>
          <CardContent>
            {auth && (
              <Button className="w-full" onClick={() => signInAnonymously(auth)}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In Anonymously
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6" />
          <h1 className="text-xl font-semibold">Parts Inventory</h1>
        </div>
        <div className="relative flex-1 ml-auto md:grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search parts..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <UserButton />
      </header>
      <main className="flex-1 p-4 sm:px-6 sm:py-0">
        <div className="flex items-center pt-4">
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Part
            </Button>
          </div>
        </div>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Your Inventory</CardTitle>
            <CardDescription>A list of all parts in your stock.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden md:table-cell">SKU</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.length > 0 ? (
                  filteredParts.map((part: Part) => (
                    <TableRow key={part.id}>
                      <TableCell className="font-medium">{part.name}</TableCell>
                      <TableCell>{part.brand || 'N/A'}</TableCell>
                      <TableCell className="hidden md:table-cell">{part.category}</TableCell>
                      <TableCell className="hidden md:table-cell">{part.sku || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        {part.quantity <= (part.lowStockThreshold || 0) ? (
                          <Badge variant="destructive" className="flex items-center justify-end gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {part.quantity}
                          </Badge>
                        ) : (
                          <Badge variant="outline">{part.quantity}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/part/${part.id}`)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500" onClick={() => router.push(`/part/${part.id}?delete=true`)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No parts found. Get started by adding a new part.
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
