# server.py 

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List
import os
import json
import pandas as pd
import numpy as np

from core.market_engine import MarketEngine
from core.ga_evolver import evolve
import utils.config as config_module
from utils.config import (
    SECTORS, 
    NUM_DAYS
) 
from llm.news_generator import generate_market_news
from core.news_injector import simulate_from_news
from visuals.plotter import plot_price_histories, plot_agent_performance

from agents.random_agent import RandomAgent
from agents.momentum_agent import MomentumAgent
from agents.value_agent import ValueAgent
from agents.contrarian_agent import ContrarianAgent
from agents.herd_follower_agent import HerdFollowerAgent
from agents.news_follower_agent import NewsFollowerAgent
from agents.long_term_investor_agent import LongTermInvestorAgent
from agents.short_term_investor_agent import ShortTermInvestorAgent
from agents.aggressive_agent import AggressiveTrader
from agents.conservative_agent import ConservativeTrader
from agents.panic_trader_agent import PanicTrader
from agents.rl_trader_agent import RLTrader
from agents.ppo_trader_agent import PPOTrader
from agents.genetic_trader_agent import GeneticTrader
from agents.lstm_trader_agent import LSTMTrader
from agents.relative_strength_agent import RelativeStrengthAgent

AGENT_MAP = {
    "RandomAgent": RandomAgent, "Random": RandomAgent,
    "MomentumAgent": MomentumAgent, "Momentum": MomentumAgent,
    "ValueAgent": ValueAgent, "Value": ValueAgent,
    "ContrarianAgent": ContrarianAgent, "Contrarian": ContrarianAgent,
    "HerdFollowerAgent": HerdFollowerAgent, "HerdFollower": HerdFollowerAgent,
    "NewsFollowerAgent": NewsFollowerAgent, "NewsFollower": NewsFollowerAgent,
    "LongTermInvestorAgent": LongTermInvestorAgent, "LongTerm": LongTermInvestorAgent,
    "ShortTermInvestorAgent": ShortTermInvestorAgent, "ShortTerm": ShortTermInvestorAgent,
    "AggressiveTrader": AggressiveTrader, "Aggressive": AggressiveTrader, "AggressiveAgent": AggressiveTrader,
    "ConservativeTrader": ConservativeTrader, "Conservative": ConservativeTrader, "ConservativeAgent": ConservativeTrader,
    "GeneticTrader": GeneticTrader, "GeneticTraderAgent": GeneticTrader,  #
    "LSTMTrader": LSTMTrader, "LstmTraderAgent": LSTMTrader, "LSTMTraderAgent": LSTMTrader,
    "PanicTrader": PanicTrader, "PanicTraderAgent": PanicTrader,      # <-- FIX: Added Alias
    "RLTrader": RLTrader, "RlTraderAgent": RLTrader,            # <-- FIX: Added Alias
    "PPOTrader": PPOTrader, "PpoTraderAgent": PPOTrader,
    "RelativeStrengthAgent":RelativeStrengthAgent, "RelativeStrength": RelativeStrengthAgent,
}


app = FastAPI(title="Market Simulation API", version="2.0")

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "https://agentic-market-simulator.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

SIMULATION_STATUS = {"status": "IDLE", "day": 0, "total_days": NUM_DAYS} 

def save_dataframe_as_json(df: pd.DataFrame, file_name_base: str):
    file_path = os.path.join(OUTPUT_DIR, f"{file_name_base}.json")
    df.to_json(file_path, orient="records", indent=2)

def _read_json_data(file_name_base: str):
    file_path = os.path.join(OUTPUT_DIR, f"{file_name_base}.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"{file_name_base}.json not found. Run simulation first.")
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        return JSONResponse(content=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading {file_name_base}.json: {e}")

class SimulationConfig(BaseModel):
    numDays: int
    initialPrices: Dict[str, float]
    agents: List[str]
    volatility: float
    newsEnabled: bool


def run_full_simulation_task(cfg: SimulationConfig):
    global SIMULATION_STATUS
    
    original_sigma_noise = config_module.SIGMA_NOISE 

    try:
        SIMULATION_STATUS = {"status": "GENERATING_NEWS", "day": 0, "total_days": cfg.numDays}
        print(f" Simulation config received: {cfg.dict()}")
        active_sigma_noise = original_sigma_noise * cfg.volatility
        config_module.SIGMA_NOISE = active_sigma_noise
        print(f" SIGMA_NOISE temporarily set to: {config_module.SIGMA_NOISE:.6f}")
        
        sim_sector_prices = cfg.initialPrices 
        herd_memory = {}
        if cfg.newsEnabled:
            news_data = generate_market_news(cfg.numDays)
            news_effects_df = simulate_from_news(os.path.join(OUTPUT_DIR, "news.json")) 
        else:
            print("News generation skipped (newsEnabled=False).")
            news_data, news_effects_df = {}, pd.DataFrame()

        SIMULATION_STATUS["status"] = "EVOLVING_AGENTS"
        background = [
            RandomAgent("BG_Rand"), MomentumAgent("BG_Mom"), ValueAgent("BG_Val"), ContrarianAgent("BG_Contra")
        ]
        result = evolve(pop_size=20, generations=8, eval_days=15, background_agents=background, sectors=SECTORS)
        best_genome = result["best_genome"]
        with open(os.path.join(OUTPUT_DIR, "best_ga_genome.json"), "w") as f:
            json.dump(best_genome, f, indent=2)
        SIMULATION_STATUS["status"] = "INITIALIZING_MARKET"
        
        agents = []
        
        for i, agent_name in enumerate(cfg.agents):
            AgentClass = AGENT_MAP.get(agent_name)
            if AgentClass:
                base_name = agent_name.replace('Agent','').replace('Trader','') 
                unique_name = f"{base_name}_{i+1}"
                
                if agent_name in ["HerdFollowerAgent", "HerdFollower"]:
                    agents.append(AgentClass(unique_name, herd_memory, herd_strength=1.0))
                elif agent_name in ["NewsFollowerAgent", "NewsFollower"]:
                    agents.append(AgentClass(unique_name, news_data))
                elif agent_name in ["LongTermInvestorAgent", "LongTerm"]:
                    agents.append(AgentClass(unique_name, SECTORS)) 
                elif agent_name in ["GeneticTrader", "GA"]:
                    agents.append(AgentClass(unique_name, genome=best_genome, track_history=True))
                else:
                    agents.append(AgentClass(unique_name))
            else:
                print(f"Warning: Agent class not found for name: {agent_name}")

        for agent in agents:
            agent.initialize_holdings(list(sim_sector_prices.keys())) 
        agent_params_log = {}

        for agent in agents:
            params = {}
            if hasattr(agent, 'genome'):
                params['genome'] = agent.genome
                params['fitness'] = getattr(agent, 'fitness', 0.0)
            
            if hasattr(agent, 'lookback'):
                params['lookback'] = agent.lookback
            if hasattr(agent, 'conf_threshold'): 
                params['conf_threshold'] = agent.conf_threshold
            if hasattr(agent, 'qty_fraction'): 
                params['qty_fraction'] = agent.qty_fraction
            if hasattr(agent, 'epsilon_min'): 
                params['epsilon_min'] = agent.epsilon_min
            if hasattr(agent, 'clip_epsilon'): 
                params['clip_epsilon'] = agent.clip_epsilon
            
            if hasattr(agent, 'MIN_DEVIATION'): 
                params['MIN_DEVIATION'] = agent.MIN_DEVIATION
            if hasattr(agent, 'MOMENTUM_THRESHOLD_PCT'): 
                params['MOMENTUM_THRESHOLD_PCT'] = agent.MOMENTUM_THRESHOLD_PCT

            cleaned_params = {k: float(v) if isinstance(v, (float, int, np.float32, np.int64)) else v for k, v in params.items()}
            
            
            agent_params_log[agent.name] = cleaned_params
        
        with open(os.path.join(OUTPUT_DIR, "agent_params.json"), "w") as f:
            json.dump(agent_params_log, f, indent=2)
        engine = MarketEngine(agents, sim_sector_prices)
        engine.news_effects = news_effects_df
        engine.herd_memory = herd_memory
        
        SIMULATION_STATUS["status"] = "SIMULATING"
        PPO_BATCH_SIZE = 5
        for day in range(1, cfg.numDays + 1):
            SIMULATION_STATUS["day"] = day
            engine.simulate_day(day)
            if day % PPO_BATCH_SIZE == 0:
                for agent in engine.agents:
                    if getattr(agent, "is_rl_agent", False) and hasattr(agent, "update"):
                        agent.update()

        ga_agent = next((a for a in agents if a.name.startswith("GeneticTrader") or a.name.startswith("GA_")), None)
        if ga_agent:
            ga_agent.wealth_history = ga_agent.wealth_history[-cfg.numDays:]

        for agent in engine.agents:
            if getattr(agent, "is_rl_agent", False) and hasattr(agent, "update"):
                agent.update()

        SIMULATION_STATUS["status"] = "SAVING_RESULTS"

        df_prices = pd.DataFrame(engine.get_sector_data())
        df_prices["Day"] = range(len(df_prices))
        save_dataframe_as_json(df_prices, "market_prices")
        
        plot_price_histories(df_prices) 

        plot_agent_performance(agents) 
        
        df_transactions = pd.DataFrame(engine.transaction_log)
        save_dataframe_as_json(df_transactions, "transactions")
        
        df_snapshots = pd.DataFrame(engine.agent_snapshots)
        save_dataframe_as_json(df_snapshots, "agent_snapshots")

        SIMULATION_STATUS = {"status": "COMPLETE", "day": cfg.numDays, "total_days": cfg.numDays}
        print(" Simulation successfully completed and results saved.")

    except Exception as e:
        SIMULATION_STATUS = {"status": "FAILED", "error": str(e)}
        print(f" Simulation FAILED: {e}")

    finally:
        config_module.SIGMA_NOISE = original_sigma_noise


@app.get("/")
def read_root():
    return {"status": "API Running", "simulation_state": SIMULATION_STATUS}

@app.post("/run-simulation")
async def run_simulation(cfg: SimulationConfig, background_tasks: BackgroundTasks):
    if SIMULATION_STATUS["status"] not in ["IDLE", "COMPLETE", "FAILED"]:
        return {"message": "Simulation is already running or busy.", "state": SIMULATION_STATUS}

    background_tasks.add_task(run_full_simulation_task, cfg)
    return {"message": "Simulation started with custom config!", "state": SIMULATION_STATUS}

@app.get("/status")
def get_status():
    return SIMULATION_STATUS

@app.get("/data/market_prices")
def get_market_prices():
    return _read_json_data("market_prices")

@app.get("/data/agent_performance")
def get_agent_performance():
    return _read_json_data("agent_performance")

@app.get("/data/transactions")
def get_transactions():
    return _read_json_data("transactions")

@app.get("/data/agent_snapshots")
def get_agent_snapshots():
    return _read_json_data("agent_snapshots")

@app.get("/data/news")
def get_news_feed():
    return _read_json_data("news")

@app.get("/data/agent_params")
def get_agent_params():
    return _read_json_data("agent_params")