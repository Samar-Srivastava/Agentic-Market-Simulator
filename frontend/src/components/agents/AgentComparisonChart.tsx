// src/components/agents/AgentComparisonChart.tsx 

import React, { useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid, 
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface AgentPerformance {
    name: string;
    history: { day: number; profit: number }[];
}

interface Props {
    agents: AgentPerformance[];
}

interface CustomLegendProps {
    payload?: any[];
    visibleAgents: Set<string>;
    toggleAgentVisibility: (name: string) => void;
}

const CustomLegend: React.FC<CustomLegendProps> = ({ payload, visibleAgents, toggleAgentVisibility }) => {
    return (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 p-2">
            {payload?.map((entry) => {
                const name = entry.value;
                const isActive = visibleAgents.has(name);
                
                return (
                    <span
                        key={name}
                        onClick={() => toggleAgentVisibility(name)}
                        className={`text-sm cursor-pointer transition-opacity duration-150 flex items-center gap-1 
                            ${isActive ? 'opacity-100 font-semibold' : 'opacity-40 hover:opacity-70'}`}
                    >
                        <svg width="10" height="10" viewBox="0 0 10 10">
                            <circle cx="5" cy="5" r="5" fill={entry.color} />
                        </svg>
                        {name}
                    </span>
                );
            })}
        </div>
    );
};


export const AgentComparisonChart: React.FC<Props> = ({ agents }) => {
    if (!agents || agents.length === 0) return null;

    const [visibleAgents, setVisibleAgents] = useState<Set<string>>(
        new Set(agents.map(a => a.name)) 
    );

    const toggleAgentVisibility = (name: string) => {
        setVisibleAgents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(name)) {
                newSet.delete(name);
            } else {
                newSet.add(name);
            }
            return newSet;
        });
    };

    const mergedData: Record<number, any> = {};
    agents.forEach((agent) => {
        agent.history.forEach((entry) => {
            if (!mergedData[entry.day]) mergedData[entry.day] = { day: entry.day };
            mergedData[entry.day][agent.name] = entry.profit;
        });
    });

    const chartData = Object.values(mergedData);

    return (
        <Card className="mt-8 hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    Profit/Loss Comparison
                </h2>
                <p className="text-gray-500 mb-6">
                    Tracks cumulative profit changes of all agents across the simulation period.
                </p>

                <div className="w-full h-[450px]"> 
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="day" label={{ value: "Day", position: "insideBottomRight", offset: -5 }} />
                            <YAxis
                                label={{
                                    value: "Cumulative Profit (%)", 
                                    angle: -90,
                                    position: "insideLeft",
                                    offset: 10,
                                }}
                                tickFormatter={(value: number) => `${value.toFixed(0)}%`} 
                            />
                            
                            
                            <Tooltip
                                contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #ccc" }}
                                formatter={(value: number) => `${value.toFixed(2)}%`}
                            />
                            
                            <Legend 
                                content={<CustomLegend 
                                    visibleAgents={visibleAgents} 
                                    toggleAgentVisibility={toggleAgentVisibility} 
                                />}
                            />

                        
                            {agents.map((agent, idx) => {
                                const isActive = visibleAgents.has(agent.name);
                                const color = `hsl(${(idx * 50) % 360}, 70%, 50%)`;

                                return (
                                    <Line
                                        key={agent.name}
                                        type="monotone"
                                        dataKey={agent.name}
                                        stroke={color}
                                        strokeWidth={isActive ? 2 : 0} 
                                        dot={isActive ? false : false}
                                        hide={!isActive} 
                                        isAnimationActive={false}
                                        connectNulls={true} 
                                    />
                                );
                            })}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};