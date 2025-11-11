# agents/herd_follower_agent.py (FINAL ROBUST LOGIC)

from agents.base_agent import BaseAgent
import random
from utils.config import ORDER_QTY_MAX, ORDER_CASH_FRACTION 

class Sector:
    history: list[float]
    name: str
    price: float

class HerdFollowerAgent(BaseAgent):
    def __init__(self, name: str, herd_memory: dict, herd_strength: float = 1.5):
        """
        herd_strength: controls how aggressively the agent follows herd sentiment
        """
        super().__init__(name)
        self.herd_memory = herd_memory
        self.herd_strength = herd_strength
        self.last_direction = {} 

    def decide(self, sector: Sector):
        stats = self.herd_memory.get(sector.name, {"buy": 0, "sell": 0})
        total = stats["buy"] + stats["sell"]

        if total == 0:
            return ("HOLD", 0)

        buy_ratio = stats["buy"] / total
        sell_ratio = stats["sell"] / total

        if random.random() < 0.05:
            return ("HOLD", 0)

        threshold = 0.52 
        bias = buy_ratio - sell_ratio

        bias_strength = abs(bias - 0.0) * 10 

        base_qty = int(self.herd_strength * bias_strength) + 1
        
        qty_raw = min(base_qty, ORDER_QTY_MAX)

        if buy_ratio > threshold:
            exec_qty = self.can_buy_max(sector.price, qty_raw, ORDER_CASH_FRACTION)
            if exec_qty > 0:
                self.last_direction[sector.name] = "BUY"
                return ("BUY", exec_qty)

        elif sell_ratio > threshold:
            held = self.holdings.get(sector.name, 0)
            qty_to_sell = min(qty_raw, held)
            if qty_to_sell > 0:
                self.last_direction[sector.name] = "SELL"
                return ("SELL", qty_to_sell)

        return ("HOLD", 0)