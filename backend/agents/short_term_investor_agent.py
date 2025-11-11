# agents/short_term_investor_agent.py (FINAL ROBUST LOGIC)

from agents.base_agent import BaseAgent
import random
import numpy as np
from utils.config import ORDER_QTY_MAX, ORDER_CASH_FRACTION # CRITICAL IMPORTS

class ShortTermInvestorAgent(BaseAgent):
    """High-frequency trader that capitalizes on short-term, risk-adjusted momentum."""
    
    def __init__(self, name="STI_1", lookback=3, sensitivity=2.0):
        super().__init__(name)
        self.lookback = lookback
        self.sensitivity = sensitivity

    def decide(self, sector):
        history = sector.history
        if len(history) < self.lookback + 1:
            return ("HOLD", 0)

        prices_window = history[-self.lookback - 1:]
        returns = np.diff(prices_window) / prices_window[:-1]
        
        momentum = np.mean(returns)
        volatility = np.std(returns) + 1e-6 
        signal_strength = momentum / volatility
        
        action = "HOLD"
        
        threshold = 0.8 * self.sensitivity 

        if signal_strength > threshold:
            action = "BUY"
        elif signal_strength < -threshold:
            action = "SELL"
        else:
            return ("HOLD", 0)

        
        qty_raw = int(30 * abs(signal_strength)) + random.randint(1, 5)
        
        qty_requested = min(qty_raw, ORDER_QTY_MAX)

        current_price = sector.price
        
        if action == "BUY":
            exec_qty = self.can_buy_max(current_price, qty_requested, ORDER_CASH_FRACTION)
            if exec_qty > 0:
                return ("BUY", exec_qty)
            
        elif action == "SELL":
            held = self.holdings.get(sector.name, 0)
            exec_qty = int(min(qty_requested, held))
            if exec_qty > 0:
                return ("SELL", exec_qty)
        
        return ("HOLD", 0)