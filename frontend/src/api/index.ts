// File: src/api/index.ts 

import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:8000",
  timeout: 120000, 
});

export type RunConfig = {
  numDays: number;
  initialPrices: Record<string, number>;
  agents: string[];
  volatility: number;
  newsEnabled: boolean;
};

// **BACKEND STATUS TYPE**: Matches the SIMULATION_STATUS global state in server.py
export type SimulationStatus = {
  status: string; 
  day: number;
  total_days: number;
  error?: string; 
};


// **POST RESPONSE TYPE**: Matches the immediate response from POST /run-simulation.
export type RunResponse = {
  message: string; 
  state: SimulationStatus; 
};

// **NEW DATA TYPE**: Structure for market prices from /data/market_prices
export type MarketPriceData = {
    Day: number;
    [sector: string]: number; 
}[];


async function mockSimulation(cfg: RunConfig): Promise<RunResponse> {
  console.log("🧪 Mock simulation running with config:", cfg);
  await new Promise((res) => setTimeout(res, 500)); 

  return {
    message: "Simulation job started successfully (mock)",
    state: { status: "GENERATING_NEWS", day: 0, total_days: cfg.numDays },
  };
}

export async function runSimulation(cfg: RunConfig): Promise<RunResponse> {
  try {
    const resp = await API.post<RunResponse>("/run-simulation", cfg);
    return resp.data;
  } catch (error) {
    console.warn("⚠️ Backend offline, using mock data instead.");
    return mockSimulation(cfg);
  }
}

export async function getStatus(): Promise<SimulationStatus> {
  try {
    const res = await API.get<SimulationStatus>("/status");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch simulation status:", error);
    throw new Error("API status check failed.");
  }
}

export async function getMarketData<T>(route: 'market_prices' | 'agent_snapshots' | 'transactions' | 'agent_performance' | 'news' | 'agent_params'): Promise<T> {
  try {
    const res = await API.get<T>(`/data/${route}`);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error(`Data file not found for route: ${route}. Run simulation first.`);
    }
    console.error(`Failed to fetch ${route}:`, error);
    throw error;
  }
}

export default API;