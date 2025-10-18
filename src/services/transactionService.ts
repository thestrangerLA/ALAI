
import type { Sale, Debtor } from '@/lib/types';
import { deleteSale } from './salesService';
import { deleteDebtor } from './debtorService';

export async function deleteTransaction(transaction: Sale | Debtor): Promise<void> {
    if (!transaction || !transaction.id) {
        throw new Error('Invalid transaction data provided.');
    }

    // Explicitly check the status to decide which deletion logic to use.
    if (transaction.status === 'paid') {
        await deleteSale(transaction as Sale);
    } else if (transaction.status === 'unpaid') {
        await deleteDebtor(transaction as Debtor);
    } else {
        // If status is undefined or something else, throw an error.
        // This makes the logic cleaner and avoids accidental deletions.
        throw new Error(`Unknown or missing transaction status: '${transaction.status}'. Cannot delete.`);
    }
}
