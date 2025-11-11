// src/types/agent-types.ts 

export interface AgentSnapshot { 
    Day: number; 
    Agent: string; 
    Cash: number; 
    TotalValue: number;
    [key: string]: number | string; 
}

export interface TransactionItem { 
    Day: number; 
    Agent: string; 
    Sector: string; 
    Action: 'BUY' | 'SELL'; 
    Price: number; 
    Qty: number; 
}

export interface AgentParamConfig {
    [agentName: string]: {
        genome?: Record<string, number>;
        lookback?: number;
        conf_threshold?: number;
        qty_fraction?: number;
        epsilon_min?: number;
        clip_epsilon?: number;
        [key: string]: any; 
    };
}



export interface AgentMetric { 
    finalValue: number; 
    profitPct: number; 
    totalTrades: number; 
    initialCash: number; 
    initialValue: number; 
    initialHoldings: Record<string, number>;
    finalHoldings: Record<string, number>;
}

export interface AgentPerformance {
    name: string;
    total_profit: number; 
    roi: number;
    volatility: number;
    sharpe_ratio: number; 
    history: { day: number; profit: number }[]; 
}