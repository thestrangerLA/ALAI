'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth, useUser, useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, addDoc, deleteDoc, serverTimestamp, collection } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Save, Trash2, LogIn, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { Part } from '@/lib/types';

export default function PartEditPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const id = params.id as string;
  const isDeleteIntent = searchParams.get('delete') === 'true';

  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const partDocRef = useMemo(() => {
    if (!user || !firestore || !id) return null;
    return doc(firestore, 'users', user.uid, 'parts', id);
  }, [user, firestore, id]);

  const { data: part, loading: partLoading, error } = useDoc(partDocRef);

  const [formData, setFormData] = useState<Partial<Part>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(isDeleteIntent);
  const [initialQuantity, setInitialQuantity] = useState<number | null>(null);

  useEffect(() => {
    if (part) {
      setFormData(part);
      if (initialQuantity === null) {
        setInitialQuantity(part.quantity);
      }
    }
  }, [part, initialQuantity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumberField = ['quantity', 'costPrice', 'sellingPrice', 'lowStockThreshold'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumberField ? Number(value) : value }));
  };

  const handleSave = async () => {
    if (!partDocRef || !firestore || !user) return;

    try {
      const updatedData = {
        ...formData,
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(partDocRef, updatedData, { merge: true });

      // Check if quantity has changed to create a stock movement record
      const quantityChanged = initialQuantity !== null && formData.quantity !== initialQuantity;
      if (quantityChanged) {
        const change = (formData.quantity || 0) - (initialQuantity || 0);
        const movementType = change > 0 ? 'Stock In' : 'Stock Out';
        if (change !== 0) {
            await addDoc(collection(firestore, 'users', user.uid, 'stockMovements'), {
                partId: id,
                partName: formData.name || 'N/A',
                quantityChange: change,
                newQuantity: formData.quantity,
                type: movementType,
                reason: 'Manual Adjustment',
                timestamp: serverTimestamp(),
            });
        }
      }

      toast({
        title: 'Success!',
        description: 'Part details have been saved.',
      });
      router.push('/');
    } catch (e) {
      console.error('Error saving part:', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save part details.',
      });
    }
  };

  const handleDelete = async () => {
    if (!partDocRef) return;
    try {
      await deleteDoc(partDocRef);
      toast({
        title: 'Part Deleted',
        description: `${formData.name || 'The part'} has been removed from your inventory.`,
      });
      router.push('/');
    } catch (e) {
      console.error('Error deleting part:', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not delete the part.',
      });
    }
  };

  const isLoading = userLoading || (id !== 'new' && partLoading);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>Please sign in to manage parts.</CardDescription>
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

  if (id !== 'new' && !part && !partLoading) {
      return (
           <div className="flex flex-col items-center justify-center min-h-screen text-center">
                <AlertCircle className="w-16 h-16 text-destructive mb-4" />
                <h1 className="text-2xl font-bold">Part Not Found</h1>
                <p className="text-muted-foreground mb-6">The part you are looking for does not exist or has been deleted.</p>
                <Button asChild>
                    <Link href="/"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Inventory</Link>
                </Button>
            </div>
      )
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          {part?.name || 'New Part'}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          {id !== 'new' && (
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Part Details</CardTitle>
            <CardDescription>Enter the information for the new spare part.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Part Name</Label>
                  <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} placeholder="e.g., Brake Pads" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                  <Input id="sku" name="sku" value={formData.sku || ''} onChange={handleChange} placeholder="e.g., BP-00123" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" value={formData.category || ''} onChange={handleChange} placeholder="e.g., Brakes, Engine, Suspension" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" name="brand" value={formData.brand || ''} onChange={handleChange} placeholder="e.g., Brembo, Bosch" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="compatibleModels">Compatible Vehicle Models</Label>
                <Textarea id="compatibleModels" name="compatibleModels" value={formData.compatibleModels || ''} onChange={handleChange} placeholder="e.g., Toyota Camry (2018-2022), Honda Accord (2019-2021)" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="oemCode">OEM Code</Label>
                <Input id="oemCode" name="oemCode" value={formData.oemCode || ''} onChange={handleChange} placeholder="Original Equipment Manufacturer Code" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity on Hand</Label>
                  <Input id="quantity" name="quantity" type="number" value={formData.quantity || 0} onChange={handleChange} />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                  <Input id="lowStockThreshold" name="lowStockThreshold" type="number" value={formData.lowStockThreshold || 0} onChange={handleChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="costPrice">Cost Price ($)</Label>
                  <Input id="costPrice" name="costPrice" type="number" value={formData.costPrice || 0} onChange={handleChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sellingPrice">Selling Price ($)</Label>
                  <Input id="sellingPrice" name="sellingPrice" type="number" value={formData.sellingPrice || 0} onChange={handleChange} />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the part
              <span className="font-bold"> "{formData.name || ''}" </span>
              from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
