// src/components/agents/AgentTransactionLog.tsx

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ListChecks, Search, ArrowUp, ArrowDown } from 'lucide-react';

interface TransactionItem {
    Day: number;
    Agent: string;
    Sector: string;
    Action: 'BUY' | 'SELL';
    Price: number;
    Qty: number;
}

interface Props {
    transactions: TransactionItem[];
}

export const AgentTransactionLog: React.FC<Props> = ({ transactions }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'Day' | 'Sector' | 'Action' | 'Price' | 'Qty'>('Day');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const handleSort = (key: keyof TransactionItem) => {
        if (sortBy === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key as any); 
            setSortDirection('desc');
        }
    };

    const sortedAndFilteredTransactions = useMemo(() => {
        let filtered = transactions.filter(t => 
            t.Sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.Action.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.sort((a, b) => {
            let aVal: any = a[sortBy];
            let bVal: any = b[sortBy];

            if (sortBy === 'Action') { 
                aVal = aVal === 'BUY' ? 1 : 0;
                bVal = bVal === 'BUY' ? 1 : 0;
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [transactions, searchTerm, sortBy, sortDirection]);

    const renderSortIcon = (key: keyof TransactionItem) => {
        if (sortBy !== key) return null;
        return sortDirection === 'asc' 
            ? <ArrowUp className="w-3 h-3 ml-1 inline" />
            : <ArrowDown className="w-3 h-3 ml-1 inline" />;
    };
    
    if (transactions.length === 0) {
         return (
            <div className="text-gray-500 text-center py-10 bg-gray-50 rounded-lg">
                <ListChecks className="w-8 h-8 mx-auto mb-2" />
                <p>This agent did not execute any trades during the simulation.</p>
            </div>
        );
    }


    return (
        <Card className="shadow-lg">
            <CardHeader className="p-4 border-b">
                <CardTitle className="flex items-center justify-between text-xl font-bold">
                    <span><ListChecks className="w-6 h-6 mr-2 inline text-indigo-600" /> Transaction History ({transactions.length} Trades)</span>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Filter by sector or action..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border rounded-lg w-64 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Day', 'Sector', 'Action', 'Price', 'Qty'].map(key => (
                                <th
                                    key={key}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort(key as keyof TransactionItem)}
                                >
                                    {key}
                                    {renderSortIcon(key as keyof TransactionItem)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {sortedAndFilteredTransactions.map((t, index) => {
                            const isBuy = t.Action === 'BUY';
                            const actionClass = isBuy ? "text-green-600 font-bold" : "text-red-600 font-bold";

                            return (
                                <tr key={index} className="hover:bg-indigo-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.Day}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-200">{t.Sector}</span>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${actionClass}`}>
                                        {t.Action}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₹{t.Price.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {t.Qty}
                                    </td>
                                </tr>
                            );
                        })}
                        {sortedAndFilteredTransactions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center text-gray-500 py-4">
                                    No trades matched your filter criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
};