// src/pages/AgentDetailsPage.tsx 

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertTriangle, User, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { getMarketData } from '../api/index';

import { AgentPnlChart } from '../components/agents/AgentPnlChart';
import { AgentTransactionLog } from '../components/agents/AgentTransactionLog';
import { AgentProfileHeader } from '../components/agents/AgentProfileHeader'; 

type AgentSnapshot = { Day: number; Agent: string; Cash: number; TotalValue: number; [key: string]: number | string; };
type TransactionItem = { Day: number; Agent: string; Sector: string; Action: 'BUY' | 'SELL'; Price: number; Qty: number; };
type AgentParamConfig = Record<string, Record<string, any>>; 

const INITIAL_CAPITAL = 100000; 

function useAgentData(agentName: string) {
    const [agentSnapshots, setAgentSnapshots] = useState<AgentSnapshot[]>([]);
    const [agentTransactions, setAgentTransactions] = useState<TransactionItem[]>([]);
    const [agentParams, setAgentParams] = useState<Record<string, any>>({}); 
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [snapshots, transactions, paramsConfig] = await Promise.all([
                getMarketData('agent_snapshots') as Promise<AgentSnapshot[]>,
                getMarketData('transactions') as Promise<TransactionItem[]>,
                getMarketData('agent_params') as Promise<AgentParamConfig>, 
            ]);

            if (snapshots.length === 0) {
                throw new Error("No simulation snapshots found. Run simulation.");
            }
            
            const filteredSnapshots = snapshots.filter(s => s.Agent === agentName).sort((a, b) => a.Day - b.Day);
            const filteredTransactions = transactions.filter(t => t.Agent === agentName).sort((a, b) => a.Day - b.Day);

            if (filteredSnapshots.length === 0) {
                throw new Error(`Data for agent "${agentName}" not found. Check the agent list.`);
            }

            setAgentSnapshots(filteredSnapshots);
            setAgentTransactions(filteredTransactions);
            
            setAgentParams(paramsConfig); 

        } catch (err: any) {
            console.error(`Error loading data for ${agentName}:`, err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [agentName]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    return { agentSnapshots, agentTransactions, agentParams, loading, error };
}


export const AgentDetailsPage: React.FC = () => {
    const { name } = useParams<{ name: string }>();
    const agentName = name || 'Unknown Agent';

    const { agentSnapshots, agentTransactions, agentParams, loading, error } = useAgentData(agentName);

    const agentSpecificParams = agentParams[agentName] || {};

    const metrics = useMemo(() => {
        if (!agentSnapshots.length) return null;
        
        const initialSnapshot = agentSnapshots[0];
        const finalSnapshot = agentSnapshots[agentSnapshots.length - 1];

        
        const initialCash = initialSnapshot?.Cash || INITIAL_CAPITAL; 
        const initialValue = initialSnapshot?.TotalValue || INITIAL_CAPITAL;
        const finalValue = finalSnapshot?.TotalValue || INITIAL_CAPITAL;
        const profitPct = ((finalValue - initialValue) / initialValue) * 100;
        
        const totalTrades = agentTransactions.length; 

    const extractHoldings = (snapshot: AgentSnapshot) => 
            Object.entries(snapshot).filter(([key]) => key !== 'Day' && key !== 'Agent' && key !== 'Cash' && key !== 'TotalValue').reduce((acc, [key, value]) => {
                if (typeof value === 'number' && value > 0) {
                    acc[key] = value;
                }
                return acc;
            }, {} as Record<string, number>);
    
    const initialHoldings = extractHoldings(initialSnapshot);
    
    const finalHoldings = extractHoldings(finalSnapshot);
        return { 
            finalValue, profitPct, totalTrades, initialCash, initialValue, initialHoldings, finalHoldings,
        };
    }, [agentSnapshots, agentTransactions]);


    if (loading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
                <span className="ml-4 text-gray-600">Loading diagnostics for {agentName}...</span>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="p-10 text-center bg-red-50 border border-red-300 rounded-lg mx-auto my-10 max-w-xl text-red-700 font-medium">
                <AlertTriangle className="w-6 h-6 inline mr-2" />
                Error loading data: {error}
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8 min-h-screen">
            
            <h1 className="text-4xl font-extrabold text-gray-900 border-b pb-4 flex items-center justify-between">
                <span></span>
                <span className="text-xl text-gray-600 font-medium">
                    Day 1 to Day {agentSnapshots.length > 0 ? agentSnapshots[agentSnapshots.length - 1].Day : '?'}
                </span>
            </h1>

            <AgentProfileHeader 
                agentName={agentName} 
                metrics={metrics}
                initialHoldings={metrics?.initialHoldings ?? {}} 
                finalHoldings={metrics?.finalHoldings ?? {}} 
                extraInfo={agentSpecificParams} 
            />
            
            {metrics && (
                <div className="grid grid-cols-3 gap-6 text-center">
                    <MetricBox icon={DollarSign} title="Final Portfolio Value" value={`₹${metrics.finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                    <MetricBox 
                        icon={metrics.profitPct >= 0 ? TrendingUp : TrendingDown} 
                        title="Total Profit/Loss" 
                        value={`${metrics.profitPct >= 0 ? '+' : ''}${metrics.profitPct.toFixed(2)}%`} 
                        color={metrics.profitPct >= 0 ? 'text-green-600' : 'text-red-600'}
                    />
                    <MetricBox icon={User} title="Total Trades Executed" value={metrics.totalTrades.toLocaleString()} />
                </div>
            )}
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4">Cumulative Performance Chart</h3>
                <AgentPnlChart snapshots={agentSnapshots} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4">Transaction History</h3>
                <AgentTransactionLog transactions={agentTransactions} />
            </div>
        </div>
    );
};

const MetricBox = ({ icon: Icon, title, value, color = 'text-gray-900' }: { icon: React.ElementType, title: string, value: string, color?: string }) => (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
        <Icon className={`w-8 h-8 mx-auto mb-2 ${color}`} />
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
    </div>
);

export default AgentDetailsPage;