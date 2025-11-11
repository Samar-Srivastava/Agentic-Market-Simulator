// src/components/agents/AgentProfileHeader.tsx 

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Archive, BookOpen, DollarSign, Layers } from 'lucide-react'; 
import { STRATEGY_PROFILES } from '../../data/agent-strategies'; 

interface AgentMetric { profitPct: number; totalTrades: number; initialCash: number; initialValue: number; }
interface AgentDetailsProps {
    agentName: string;
    metrics: AgentMetric | null;
    initialHoldings: Record<string, number>; 
    finalHoldings: Record<string, number>; 
    extraInfo?: Record<string, any>; 
}


export const AgentProfileHeader: React.FC<AgentDetailsProps> = ({ 
    agentName, 
    metrics, 
    initialHoldings, 
    finalHoldings, 
}) => {

    const cleanAgentName = agentName.replace(/_[0-9]+$/, ''); 
    const agentClass = cleanAgentName.replace(/Agent|Trader/g, ''); 
    
    const profileKey = Object.keys(STRATEGY_PROFILES).find(key => 
        key.includes(agentClass)
    ) || agentName;
    
    const profile = STRATEGY_PROFILES[profileKey] || STRATEGY_PROFILES[agentName]; 
    
    const strategyTitle = profile?.title || `${cleanAgentName} Strategy`;
    const strategyDescription = profile?.description || "Strategy description not available. Likely a custom or advanced model.";
    const specialty = profile?.specialty || 'N/A';
    
    let performanceStatus = "Awaiting Data";
    let statusColor = "bg-gray-400";
    
    if (metrics) {
        if (metrics.profitPct >= 5) {
            performanceStatus = "TOP TIER PERFORMANCE";
            statusColor = "bg-amber-500";
        } else if (metrics.profitPct > 0) {
            performanceStatus = "SOLID PROFITABLE RUN";
            statusColor = "bg-green-600";
        } else if (metrics.profitPct <= -5) {
            performanceStatus = "LOSS LEADER (SIGNIFICANT EROSION)";
            statusColor = "bg-red-600";
        } else {
            performanceStatus = "UNDERPERFORMING / MARGINAL RETURNS";
            statusColor = "bg-orange-500";
        }
    }

    const holdingKeys = Object.keys(initialHoldings).filter(k => initialHoldings[k] > 0);
    const initialHoldingDisplay = holdingKeys.length > 0 
        ? holdingKeys.map(k => `${k}: ${initialHoldings[k]}`).join(', ')
        : 'Started with Cash Only';
    const finalHoldingKeys = Object.keys(finalHoldings).filter(k => finalHoldings[k] > 0);
    const finalHoldingDisplay = finalHoldingKeys.length > 0 
        ? finalHoldingKeys.map(k => `${k}: ${finalHoldings[k]}`).join(', ')
        : 'Liquidated to Cash';

    return (
        <Card className="shadow-2xl border-t-8 border-indigo-600">
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                
                <div className="md:col-span-2 space-y-4 border-r pr-6">
                    <div className={`px-3 py-1 text-sm font-bold text-white uppercase rounded-full inline-block ${statusColor}`}>
                        {performanceStatus}
                    </div>

                    <h2 className="text-4xl font-extrabold text-gray-900 mt-2">
                        {strategyTitle}
                    </h2>
                    
                    <p className="text-gray-700 text-xl leading-relaxed italic border-l-4 border-indigo-200 pl-3">
                        <BookOpen className="w-5 h-5 inline mr-2 text-indigo-500" />
                        {strategyDescription}
                    </p>
                    
                    <div className="text-lg text-gray-700 pt-2">
                        <span className="font-semibold">Specialty:</span> {specialty}
                    </div>
                </div>

                <div className="md:col-span-1 space-y-4">
                    <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Agent Diagnostics</h3>

                    <MetricLine 
                        Icon={DollarSign} 
                        title="Initial Capital" 
                        value={`₹${metrics?.initialCash?.toLocaleString() || 'N/A'}`} 
                    />
                    <MetricLine 
                        Icon={Archive} 
                        title="Starting Inventory" 
                        value={initialHoldingDisplay} 
                    />
                    <MetricLine 
                        Icon={Layers} 
                        title="Final Inventory" 
                        value={finalHoldingDisplay} 
                    />

                
                </div>
            </CardContent>
        </Card>
    );
};

const MetricLine: React.FC<{ Icon: React.ElementType, title: string, value: string }> = ({ Icon, title, value }) => (
    <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-indigo-500 shrink-0" />
        <div>
            <p className="text-xs font-medium text-gray-500">{title}</p>
            <p className="text-base font-semibold text-gray-800">{value}</p>
        </div>
    </div>
);