# agents/long_term_investor_agent.py (FINAL ROBUST LOGIC)

from agents.base_agent import BaseAgent
import random
from utils.config import ORDER_QTY_MAX, ORDER_CASH_FRACTION 

class LongTermInvestorAgent(BaseAgent):
    def __init__(self, name, base_values, window=5, rebalance_freq=2, adapt_rate=0.02):
        super().__init__(name)
        self.base_values = {k: v for k, v in base_values.items()} 
        self.window = window
        self.rebalance_freq = rebalance_freq
        self.adapt_rate = adapt_rate
        self.counter = 0

    def decide(self, sector):
        self.counter += 1
        
        history = sector.history
        if len(history) < self.window:
            return ("HOLD", 0)

        if self.counter % self.rebalance_freq != 0:
            return ("HOLD", 0)

        base_val = self.base_values.get(sector.name, history[-1])
        self.base_values[sector.name] = base_val * (1 + self.adapt_rate * random.uniform(-1, 1))

        deviation = (sector.price - self.base_values[sector.name]) / self.base_values[sector.name]

        if deviation < -0.02: 
            action = "BUY"
        elif deviation > 0.03: 
            action = "SELL"
        else:
            return ("HOLD", 0)

        qty_raw = int((abs(deviation) * 400) + random.randint(10, 30))

        if action == "BUY":
            exec_qty = self.can_buy_max(sector.price, qty_raw, ORDER_CASH_FRACTION)
            if exec_qty > 0:
                return ("BUY", exec_qty)
        
        elif action == "SELL":
            held = self.holdings.get(sector.name, 0)
            exec_qty = min(qty_raw, held)
            if exec_qty > 0:
                return ("SELL", exec_qty)
        
        return ("HOLD", 0)