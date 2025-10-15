
import type { Sale, Debtor } from '@/lib/types';
import { deleteSale } from './salesService';
import { deleteDebtor } from './debtorService';

export async function deleteTransaction(transaction: Sale | Debtor): Promise<void> {
    if (!transaction || !transaction.id) {
        throw new Error('Invalid transaction data provided.');
    }

    // Check if the transaction object is a Sale (has status 'paid')
    if ('status' in transaction && transaction.status === 'paid') {
        await deleteSale(transaction as Sale);
    } 
    // Check if the transaction object is a Debtor (has status 'unpaid')
    else if ('status' in transaction && transaction.status === 'unpaid') {
        await deleteDebtor(transaction as Debtor);
    } 
    // Handle cases where status might be missing or different
    else {
        // Fallback for older data that might not have a status but should be treated as a sale
        const isLikelySale = 'items' in transaction && 'totalAmount' in transaction;
        if (isLikelySale && !('status' in transaction)) {
             await deleteSale(transaction as Sale);
        } else {
             throw new Error(`Unknown transaction status: ${'status' in transaction ? transaction.status : 'undefined'}`);
        }
    }
}
