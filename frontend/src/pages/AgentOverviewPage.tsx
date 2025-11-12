// src/pages/AgentOverviewPage.tsx 

import React, { useEffect, useState} from "react";
import { useConfigStore } from "../hooks/useConfigStore";
import { AgentMetricsHero } from "../components/agents/AgentMetricsHero";
import { AgentComparisonChart } from "../components/agents/AgentComparisonChart";
import { AgentCardGrid } from "../components/agents/AgentCardGrid";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertTriangle, Home} from "lucide-react"; 
import { getMarketData } from "../api";

interface RawSnapshot {
    Day: number;
    Agent: string;
    Cash: number;
    TotalValue: number;
}

interface AgentPerformance {
    name: string;
    total_profit: number; 
    roi: number; 
    volatility: number;
    sharpe_ratio: number;
    history: { day: number; profit: number }[]; 
}

const INITIAL_CAPITAL = 100000;

const processAgentData = (snapshots: RawSnapshot[]): AgentPerformance[] => {
    if (!snapshots || snapshots.length === 0) return [];
    
    const agentsMap = new Map<string, RawSnapshot[]>();

    snapshots.forEach(s => {
        if (!agentsMap.has(s.Agent)) {
            agentsMap.set(s.Agent, []);
        }
        agentsMap.get(s.Agent)!.push(s);
    });

    const results: AgentPerformance[] = [];

    for (const [agentName, agentHistory] of agentsMap.entries()) {
        const sortedHistory = agentHistory.sort((a, b) => a.Day - b.Day);
        
        const initialPortfolioValue = sortedHistory[0]?.TotalValue || INITIAL_CAPITAL;
        
        const profitHistory = sortedHistory.map((s) => {
            const profitPct = ((s.TotalValue - initialPortfolioValue) / initialPortfolioValue) * 100;
            return { day: s.Day, profit: profitPct };
        });

        const finalProfitPct = profitHistory[profitHistory.length - 1]?.profit || 0;
        
        let dailyReturns: number[] = [];
    for (let i = 1; i < sortedHistory.length; i++) {
        const prevVal = sortedHistory[i - 1].TotalValue;
        const currVal = sortedHistory[i].TotalValue;
        
        if (prevVal > 0) { 
            dailyReturns.push((currVal - prevVal) / prevVal);
        }
    }

    let volatility = 0;
    let sharpe_ratio = 0;
    console.log(sharpe_ratio)

    if (dailyReturns.length > 0) {
        const meanReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
        
        const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / dailyReturns.length;
        volatility = Math.sqrt(variance) * Math.sqrt(365); // Annualized

        if (volatility > 1e-9) { 
            
            sharpe_ratio = (meanReturn * Math.sqrt(365)) / volatility; 
        } else {
            sharpe_ratio = finalProfitPct > 0 ? 1000 : finalProfitPct < 0 ? -1000 : 0; 
        }
    }
        results.push({
            name: agentName,
            total_profit: finalProfitPct, 
            roi: finalProfitPct / 100,
            volatility: volatility,
            sharpe_ratio: finalProfitPct > 0 ? (finalProfitPct / (volatility * 100)) : 0, 
            history: profitHistory,
        });
    }

    return results.sort((a, b) => b.total_profit - a.total_profit);
};
    
export const AgentOverviewPage: React.FC = () => {
    // 1. Fetch Global State
    const hasData = useConfigStore(s => s.hasData);
    
    const [agents, setAgents] = useState<AgentPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAndProcessAgents = async () => {
            if (!hasData) {
                setLoading(false);
                return; 
            }
            
            try {
                const rawData: RawSnapshot[] = await getMarketData<RawSnapshot[]>("agent_snapshots"); 
                const processedData = processAgentData(rawData);
                
                setAgents(processedData);

            } catch (err: any) {
                setError(err.message);
                console.error("Agent Data Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAndProcessAgents();
    }, [hasData]); 

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
                <span className="ml-2 text-gray-600">Calculating agent results...</span>
            </div>
        );
    }

    if (!hasData || agents.length === 0) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="p-12 bg-white border-4 border-dashed border-indigo-200 rounded-3xl shadow-2xl text-center max-w-lg transform transition-all duration-300 hover:shadow-indigo-300/50 -mt-36">
                    <AlertTriangle className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-pulse" />
                    <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
                        Simulation Required
                    </h1>
                    <p className="text-lg text-gray-600 mb-6">
                        This dashboard requires market data. Please initiate a simulation run from the Home Page to view results.
                    </p>
                    <a 
                    href="/" 
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-md text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150 ease-in-out"
                    >
                    <Home className="w-5 h-5 mr-2" />
                    Go to Home Page
                    </a>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-10 text-center bg-red-50 border border-red-300 rounded-lg mx-auto my-10 max-w-xl text-red-700 font-medium">
                <AlertTriangle className="w-6 h-6 inline mr-2" />
                Error: {error}
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6">
            <h1 className="text-4xl font-extrabold text-gray-900 border-b pb-4">
                Agent Performance Hub
            </h1>

            <AgentMetricsHero agents={agents} />

            <Card className="shadow-md">
                <CardContent className="p-6">
                    <AgentComparisonChart agents={agents} />
                </CardContent>
            </Card>

            <Card className="shadow-md">
                <CardContent className="p-6">
                    <AgentCardGrid agents={agents} />
                </CardContent>
            </Card>
        </div>
    );
};

export default AgentOverviewPage;