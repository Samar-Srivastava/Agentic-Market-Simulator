// src/components/market/StockTable.tsx 

import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, User, DollarSign } from "lucide-react";
import { getMarketData } from "../../api/index"; 

type AgentSnapshot = {
    Day: number;
    Agent: string;
    Cash: number;
    TotalValue: number;
};

function useAgentSnapshots() {
    const [finalPerformance, setFinalPerformance] = useState<AgentSnapshot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const initialCapital = 100000; 

    useEffect(() => {
        const fetchSnapshots = async () => {
            setLoading(true);
            setError(null);
            try {
                const allSnapshots: AgentSnapshot[] = await getMarketData('agent_snapshots');

                if (!allSnapshots || allSnapshots.length === 0) {
                    throw new Error("No agent snapshot data available. Run a simulation first.");
                }
                
                const maxDay = Math.max(...allSnapshots.map(s => s.Day));
                const finalDaySnapshots = allSnapshots
                    .filter(s => s.Day === maxDay)
                    .sort((a, b) => b.TotalValue - a.TotalValue); 
                setFinalPerformance(finalDaySnapshots);

            } catch (err) {
                console.error("Agent data fetch failed:", err);
                setError(err instanceof Error 
                    ? err.message 
                    : "An unknown error occurred fetching agent snapshots."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchSnapshots();
    }, []);

    return { finalPerformance, loading, error, initialCapital };
}


export default function StockTable() {
    const { finalPerformance, loading, error, initialCapital } = useAgentSnapshots();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48 bg-gray-50 rounded-xl shadow-md mt-6">
                <Loader2 className="animate-spin w-6 h-6 text-indigo-600 mr-2" />
                <p className="text-lg text-gray-700">Loading Agent Performance...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex items-center p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl shadow-md mt-6">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <p className="text-sm font-medium">{error}</p>
            </div>
        );
    }

    if (finalPerformance.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-48 p-4 bg-gray-50 rounded-xl shadow-md mt-6 text-gray-500">
                <User className="w-6 h-6 mb-2" />
                <p className="text-base">No agent performance data found.</p>
                <p className="text-sm">Please ensure a simulation was run successfully.</p>
            </div>
        );
    }

    return (
        <div className="mt-6 bg-white rounded-xl shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                Final Agent Performance (Day {finalPerformance[0]?.Day})
            </h2>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent Name</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Final Value (₹)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Profit (%)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {finalPerformance.map((agent, index) => {
                            const netProfit = (agent.TotalValue - initialCapital) / initialCapital * 100;
                            const profitColor = netProfit >= 0 ? "text-green-600" : "text-red-600";
                            const rankColor = index === 0 ? "bg-yellow-50/50 font-bold" : "bg-white";

                            return (
                                <tr key={agent.Agent} className={`hover:bg-gray-50 ${rankColor}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold">
                                        {index === 0 ? "🏆" : index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {agent.Agent}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                                        ₹{agent.TotalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${profitColor}`}>
                                        {netProfit > 0 ? "+" : ""}{netProfit.toFixed(2)}%
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}