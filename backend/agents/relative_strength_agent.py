# agents/relative_strength_agent.py

from agents.base_agent import BaseAgent
import numpy as np
import random
from utils.config import ORDER_QTY_MAX, ORDER_CASH_FRACTION

class RelativeStrengthAgent(BaseAgent):
    """
    Trades based on relative performance between sectors (Capital Rotation).
    Sells the weakest performing sector to buy the strongest performing sector.
    """
    
    LOOKBACK = 3
    TRADE_FRACTION = 0.30 

    def decide(self, sector):
        history = sector.history
        if len(history) < self.LOOKBACK + 1:
            return ("HOLD", 0)

        prices_window = history[-self.LOOKBACK - 1:]
        returns = np.diff(prices_window) / prices_window[:-1]
        
        momentum = np.mean(returns)
        
        THRESHOLD_SIMPLE = 0.002 
        
        action = "HOLD"
        
        if momentum > THRESHOLD_SIMPLE:
            action = "BUY"
        elif momentum < -THRESHOLD_SIMPLE:
            action = "SELL"
        else:
            return ("HOLD", 0)

        qty_raw = int(ORDER_QTY_MAX * self.TRADE_FRACTION) 

        if action == "BUY":
            current_price = sector.price
            exec_qty = self.can_buy_max(current_price, qty_raw, ORDER_CASH_FRACTION)
            return ("BUY", exec_qty)
            
        elif action == "SELL":
            held = self.holdings.get(sector.name, 0)
            exec_qty = min(qty_raw, held) 
            return ("SELL", exec_qty)
        
        return ("HOLD", 0)