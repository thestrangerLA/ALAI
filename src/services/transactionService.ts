
import type { Sale, Debtor } from '@/lib/types';
import { deleteSale } from './salesService';
import { deleteDebtor } from './debtorService';

export async function deleteTransaction(transaction: Sale | Debtor): Promise<void> {
    if (!transaction || !transaction.id) {
        throw new Error('Invalid transaction data provided.');
    }

    if (transaction.status === 'paid') {
        // It's a Sale
        await deleteSale(transaction as Sale);
    } else if (transaction.status === 'unpaid') {
        // It's a Debtor
        await deleteDebtor(transaction as Debtor);
    } else {
        throw new Error(`Unknown transaction status: ${transaction.status}`);
    }
}
