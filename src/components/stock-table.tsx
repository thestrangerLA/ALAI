
// This is a placeholder for the StockTable component.
// A full implementation would require more UI components like Dialog, Form, Input, etc.
// For now, it will render a simple table.

import type { StockItem } from "@/lib/types";

interface StockTableProps {
    data: StockItem[];
    categories: string[];
    onAddItem: (item: Omit<StockItem, 'id'>) => void;
    onUpdateItem: (id: string, updatedFields: Partial<StockItem>) => void;
    onDeleteItem: (id: string) => void;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
}

export function StockTable({ data, searchQuery, onSearchQueryChange }: StockTableProps) {
    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Stock Items</h2>
            <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="w-full p-2 border rounded mb-4"
            />
            <table className="w-full">
                <thead>
                    <tr className="border-b">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Category</th>
                        <th className="text-left p-2">Stock</th>
                        <th className="text-left p-2">Cost Price (Kip)</th>
                        <th className="text-left p-2">Cost Price (Baht)</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(item => (
                        <tr key={item.id} className="border-b">
                            <td className="p-2">{item.name}</td>
                            <td className="p-2">{item.category}</td>
                            <td className="p-2">{item.currentStock}</td>
                            <td className="p-2">{item.costPrice}</td>
                            <td className="p-2">{item.costPriceBaht}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

    