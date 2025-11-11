// File: src/hooks/useConfigStore.ts 

import { create } from 'zustand';

export type SimulationStatusType = 'IDLE' | 'RUNNING' | 'COMPLETE' | 'FAILED';

export type ConfigState = {
    numDays: number;
    initialPrices: Record<string, number>;
    agents: string[];
    volatility: number;
    newsEnabled: boolean;

    simStatus: SimulationStatusType;
    lastRunDay: number;
    hasData: boolean;
    lastRunIncludedNews: boolean; 
    setConfig: (cfg: Partial<Omit<ConfigState, "setConfig" | "reset" | "setSimStatus" | "lastRunIncludedNews">>) => void;
    setSimStatus: (status: SimulationStatusType, day?: number, newsGenerated?: boolean) => void;
    reset: () => void;
};

const DEFAULT_PRICES = {
    "Tech": 450.0, "Pharma": 220.0, "Finance": 180.0, "Energy": 85.0, "Gold": 1200.0,
};

const DEFAULT_AGENTS = [
    "AggressiveAgent", "ConservativeAgent", "ContrarianAgent", "GeneticTraderAgent",
    "HerdFollowerAgent", "LongTermInvestorAgent", "LSTMTraderAgent", "MomentumAgent",
].slice(0, 8);

const defaultState: Omit<ConfigState, "setConfig" | "setSimStatus" | "reset"> = {
    numDays: 30,
    initialPrices: DEFAULT_PRICES,
    agents: DEFAULT_AGENTS,
    volatility: 1.0,
    newsEnabled: true,
    simStatus: 'IDLE',
    lastRunDay: 0,
    hasData: false,
    lastRunIncludedNews: false, 
}


export const useConfigStore = create<ConfigState>((set) => ({
    ...defaultState as any,

    setConfig: (cfg) => set((s) => ({ ...s, ...cfg })),

    setSimStatus: (status, day, newsGenerated) => set((state) => ({
        simStatus: status,
        lastRunDay: day !== undefined ? day : 0,
        hasData: (status === 'COMPLETE') ? true : state.hasData,
        lastRunIncludedNews: (status === 'COMPLETE' && newsGenerated !== undefined)
            ? newsGenerated
            : state.lastRunIncludedNews,
    })),

    reset: () => set(() => ({ ...defaultState, hasData: false, lastRunIncludedNews: false })),
}));