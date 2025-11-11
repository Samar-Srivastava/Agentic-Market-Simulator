// src/components/agents/AgentCardGrid.tsx 

import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Zap, Scale, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AgentPerformance {
    name: string;
    total_profit: number; 
    roi: number;
    volatility: number;
    sharpe_ratio: number;
    history: { day: number; profit: number }[];
}

interface Props {
    agents: AgentPerformance[];
}


export const AgentCardGrid: React.FC<Props> = ({ agents }) => {
    const navigate = useNavigate();

    if (!agents || agents.length === 0)
        return (
            <div className="text-gray-500 text-center py-10">
                No agent data available. Run a simulation first.
            </div>
        );

    const displayAgents = agents; 

    return (
        <section className="mt-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Agent Strategies & Performance Metrics
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"> 
                {displayAgents.map((agent) => { // Iterate over the unsorted list
                    const isPositive = agent.total_profit >= 0; 
                    const profitColor = isPositive ? "text-green-600" : "text-red-600";
                    const Icon = isPositive ? TrendingUp : TrendingDown;
                    
                    const styleClass = "border border-gray-200"; 

                    return (
                        <Card
                            key={agent.name}
                            className={`
                                cursor-pointer 
                                transition-all duration-300 
                                hover:shadow-xl hover:scale-[1.01] 
                                flex flex-col 
                                ${styleClass}
                            `}
                            onClick={() => navigate(`/agents/${agent.name}`)}
                        >
                            <CardHeader className="flex flex-row justify-between items-start p-4 border-b">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-extrabold text-gray-900 truncate">
                                        {agent.name}
                                    </h3>
                                </div>
                                
                                <div className={`rounded-full p-2 ${isPositive ? "bg-green-100" : "bg-red-100"}`}>
                                    <Icon className={`h-6 w-6 ${profitColor}`} />
                                </div>
                            </CardHeader>
                            
                            <CardContent className="p-4 flex flex-col justify-between flex-grow">
                                
                                <div className="mb-4">
                                    <p className="text-sm text-gray-500 mb-1 font-medium">Total Profit/Loss</p>
                                    <div className={`text-3xl font-extrabold ${profitColor}`}>
                                        {agent.total_profit.toFixed(2)}%
                                    </div>
                                </div>

                                <div className="space-y-3 pt-3 border-t">
                                    
                                    <div className="flex items-center justify-between text-base text-gray-700">
                                        <span className="flex items-center gap-2 font-medium">
                                            <Scale className="w-5 h-5 text-indigo-500" />
                                            ROI
                                        </span>
                                        <span className="font-bold">{(agent.roi * 100).toFixed(2)}%</span> 
                                    </div>

                                    <div className="flex items-center justify-between text-base text-gray-700">
                                        <span className="flex items-center gap-2 font-medium">
                                            <Zap className="w-5 h-5 text-orange-500" />
                                            Volatility
                                        </span>
                                        <span className="font-bold">{(agent.volatility * 100).toFixed(2)}%</span>
                                    </div>

                                    <div className="flex items-center justify-between text-base text-gray-700">
                                        <span className="flex items-center gap-2 font-medium">
                                            <DollarSign className="w-5 h-5 text-blue-500" />
                                            Sharpe Ratio
                                        </span>
                                        <span className="font-bold">{agent.sharpe_ratio.toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </section>
    );
};