
import type { Sale, Debtor } from '@/lib/types'; // Note: Debtor is structurally identical to Sale
import { deleteSale } from './salesService';
import { deleteDebtor } from './debtorService';

export async function deleteTransaction(transaction: Sale | Debtor): Promise<void> {
    if (!transaction || !transaction.id) {
        throw new Error('Invalid transaction data provided.');
    }

    // The function to call depends on the status of the transaction
    if (transaction.status === 'paid') {
        // This transaction is a completed sale
        await deleteSale(transaction as Sale);
    } else if (transaction.status === 'unpaid') {
        // This transaction is an outstanding debt
        await deleteDebtor(transaction as Debtor);
    } else {
        // If status is undefined or something else, throw an error.
        // This makes the logic cleaner and avoids accidental deletions.
        throw new Error(`Unknown or missing transaction status: '${transaction.status}'. Cannot delete.`);
    }
}
