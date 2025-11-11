// src/components/agents/AgentPnlChart.tsx

import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card"; 

interface AgentSnapshot {
    Day: number;
    Agent: string;
    Cash: number;
    TotalValue: number; 
}

interface Props {
    snapshots: AgentSnapshot[];
}

const INITIAL_CAPITAL = 100000; 

export const AgentPnlChart: React.FC<Props> = ({ snapshots }) => {
    if (!snapshots || snapshots.length === 0) {
        return (
            <Card className="h-96">
                <CardContent className="flex items-center justify-center h-full text-gray-500">
                    No historical snapshots available for this agent.
                </CardContent>
            </Card>
        );
    }

    const agentName = snapshots[0]?.Agent || "Agent";

    const chartData = snapshots.map(s => ({
        Day: s.Day,
        'Portfolio Value': s.TotalValue,
    }));
    
    const dataMin = Math.min(...snapshots.map(s => s.TotalValue));
    const dataMax = Math.max(...snapshots.map(s => s.TotalValue));
    
    const yMin = Math.floor(Math.min(dataMin, INITIAL_CAPITAL) * 0.995);
    const yMax = Math.ceil(Math.max(dataMax, INITIAL_CAPITAL) * 1.005);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const value = payload[0].value;
            const profit = value - INITIAL_CAPITAL;
            const profitPct = (profit / INITIAL_CAPITAL) * 100;
            const status = profit >= 0 ? "Profit" : "Loss";
            
            return (
                <div className="bg-white p-3 border rounded-lg shadow-md text-sm">
                    <p className="font-bold text-gray-700">Day {label}</p>
                    <p className="text-indigo-600">Value: ₹{value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    <p className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {status}: {profit >= 0 ? '+' : ''}₹{profit.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({profitPct.toFixed(2)}%)
                    </p>
                </div>
            );
        }
        return null;
    };


    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 10, bottom: 15 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                    dataKey="Day" 
                    label={{ value: "Simulation Day", position: "bottom", offset: 0, className: "font-semibold text-sm" }}
                />
                <YAxis
                    domain={[yMin, yMax]}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} // Format to thousands
                    label={{ value: "Portfolio Value", angle: -90, position: "left", offset: 0, className: "font-semibold text-sm" }}
                />
                
                <ReferenceLine 
                    y={INITIAL_CAPITAL} 
                    stroke="#4F46E5" 
                    strokeDasharray="5 5" 
                    label={{ value: `Initial Capital (₹${(INITIAL_CAPITAL/1000).toFixed(0)}k)`, position: 'top', fill: '#4F46E5', fontSize: 12 }} 
                />
                
                <Tooltip content={<CustomTooltip />} />
                
                <Line
                    type="monotone"
                    dataKey="Portfolio Value"
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={false}
                    name={`${agentName} Portfolio Value`}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};