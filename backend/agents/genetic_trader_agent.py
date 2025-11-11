# agents/genetic_trader_agent.py (FINAL ROBUST EXECUTION)

import random
from agents.base_agent import BaseAgent
from utils.config import ORDER_QTY_MAX, ORDER_CASH_FRACTION 

class GeneticTrader(BaseAgent):
    """A rule-based trader controlled by an evolved genome."""

    def __init__(self, name, genome=None,track_history=True):
        super().__init__(name)
        self.genome = genome or {
            "momentum_thresh": 0.01,
            "reversion_thresh": 0.01,
            "trade_qty": 10,
            "aggressiveness": 1.0,
            "news_sensitivity": 1.0,
            "herd_sensitivity": 0.0,
        }

        self.txn_count = 0
        self._engine_ref = None
        self.net_worth = self.cash
        self.fitness = 0.0
        self.last_prices = {}
        self.track_history = track_history 

        self.wealth_history = []

    def decide(self, sector):
        hist = sector.history
        if len(hist) < 2:
            return ("HOLD", 0)

        ret = (hist[-1] - hist[-2]) / max(1e-9, hist[-2])

        news = getattr(sector, "last_news_pct", 0.0)
        news_signal = self.genome["news_sensitivity"] * news / 100.0

        herd_signal = 0.0
        if self._engine_ref and hasattr(self._engine_ref, "herd_memory"):
            mem = self._engine_ref.herd_memory.get(sector.name, {})
            total = max(1, mem.get("buy", 0) + mem.get("sell", 0))
            herd_signal = self.genome["herd_sensitivity"] * (
                (mem.get("buy", 0) - mem.get("sell", 0)) / total
            )

        signal = ret + news_signal + herd_signal
        
        qty_raw = int(self.genome["trade_qty"] * self.genome["aggressiveness"])
        
        if signal > self.genome["momentum_thresh"]:
            trade_qty = self.can_buy_max(sector.price, qty_raw, ORDER_CASH_FRACTION)
            if trade_qty > 0:
                self.txn_count += 1
                return ("BUY", trade_qty)
        
        elif signal < -self.genome["reversion_thresh"]:
            held = self.holdings.get(sector.name, 0)
            trade_qty = min(qty_raw, held)
            if trade_qty > 0:
                self.txn_count += 1
                return ("SELL", trade_qty)
        
        return ("HOLD", 0)

    def attach_engine(self, engine):
        self._engine_ref = engine

    def on_day_end(self, day, prices):
        total_value = self.portfolio_value(prices)
        self.net_worth = total_value
        self.fitness = total_value
        if self.track_history:
            self.wealth_history.append(round(total_value, 2))

    def mutate(self, rate=0.1):
        for key in self.genome.keys():
            if random.random() < rate:
                factor = random.uniform(0.8, 1.2)
                self.genome[key] *= factor
        return self

    def crossover(self, other):
        child_genome = {}
        for key in self.genome.keys():
            if random.random() < 0.5:
                child_genome[key] = self.genome[key]
            else:
                child_genome[key] = other.genome[key]
        return GeneticTrader(name=f"{self.name}_child", genome=child_genome)