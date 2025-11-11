// src/components/agents/AgentMetricsHero.tsx 

import React, { useMemo } from "react";
// Using larger, more distinct icons
import {TrendingDown, TrendingUp } from "lucide-react"; 
import { Card, CardContent } from "@/components/ui/card";
import bear from "../../assets/bear-market.png";
import bull from "../../assets/bull-market.png";
import rabbit from "../../assets/rabbit.png";

interface AgentPerformance {
    name: string;
    total_profit: number; 
    roi: number;
    volatility: number;
    sharpe_ratio: number;
    history: { day: number; profit: number }[];
}

interface MetricCardProps {
    title: string;
    icon: React.ReactNode;
    name: string;
    profit: number; 
    roi: number;
    volatility: number;
    borderColor: string;
    bgColor: string;
}

interface Props {
    agents: AgentPerformance[];
}


export const AgentMetricsHero: React.FC<Props> = ({ agents }) => {
    const metrics = useMemo(() => {
        if (!agents || agents.length === 0) return null;

        const sortedByProfit = [...agents].sort(
            (a, b) => b.total_profit - a.total_profit 
        );
        const sortedByVolatility = [...agents].sort(
            (a, b) => b.volatility - a.volatility 
        );
        const sortedBySharpe = [...agents].sort(
            (a, b) => b.sharpe_ratio - a.sharpe_ratio 
        );

        return {
            winner: sortedByProfit[0],
            loser: sortedByProfit[sortedByProfit.length - 1],
            volatile: sortedByVolatility[0],
            sharpe: sortedBySharpe[0],
        };
    }, [agents]);

    if (!metrics) return null;


    return (
        <div className="space-y-6">
        

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                
                <MetricCard
                    title="Max Winner (Most Profitable)"
                    icon={<img  src={bull} className="text-green-700 w-20 h-20" />}
                    name={metrics.winner.name}
                    profit={metrics.winner.total_profit}
                    roi={metrics.winner.roi}
                    volatility={metrics.winner.volatility}
                    borderColor="border-green-500"
                    bgColor="bg-green-50"
                />

                <MetricCard
                    title="Biggest Loser"
                    icon={<img src={bear} className="text-red-600 w-20 h-20" />}
                    name={metrics.loser.name}
                    profit={metrics.loser.total_profit}
                    roi={metrics.loser.roi}
                    volatility={metrics.loser.volatility}
                    borderColor="border-red-500"
                    bgColor="bg-red-50"
                />

                <MetricCard
                    title="Most Volatile (Highest Risk)"
                    icon={<img src={rabbit} className="text-purple-600 w-20 h-20" />}
                    name={metrics.volatile.name}
                    profit={metrics.volatile.total_profit}
                    roi={metrics.volatile.roi}
                    volatility={metrics.volatile.volatility}
                    borderColor="border-purple-500"
                    bgColor="bg-purple-50"
                />
            </div>
        </div>
    );
};


const MetricCard: React.FC<MetricCardProps> = ({
    title,
    icon,
    name,
    profit,
    roi,
    volatility,
    borderColor,
    bgColor,
}) => {
    const isPositive = profit >= 0;
    const profitColor = isPositive ? "text-green-600" : "text-red-600";
    
    return (
        <Card className={`border-t-4 ${borderColor} ${bgColor} hover:shadow-xl transition-shadow duration-300`}>
            <CardContent className="p-5 flex flex-col gap-3">
                
                <div className="flex justify-between items-start">
                    
                    <div className="flex flex-col gap-2 flex-grow">
                        
                        <span className="text-md text-gray-800 font-semibold">{title}</span>

                        <div className="border-b pb-3">
                            <h3 className="text-xl font-bold text-gray-900 truncate">{name}</h3>
                            <div className={`text-3xl font-extrabold ${profitColor} mt-1 flex items-center`}>
                                {profit.toFixed(2)}%
                                {profit !== 0 && (isPositive ? 
                                    <TrendingUp className="w-5 h-5 ml-2" /> : 
                                    <TrendingDown className="w-5 h-5 ml-2" />
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className=""> 
                        {icon} 
                    </div>
                </div>

                <div className="text-sm text-gray-600 space-y-1 ">
                    <div className="flex justify-between">
                        <span className="font-medium text-gray-500">ROI (Ratio):</span>
                        <span className="font-semibold text-gray-800">{(roi * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Volatility (Annualized):</span>
                        <span className="font-semibold text-gray-800">{(volatility * 100).toFixed(2)}%</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};