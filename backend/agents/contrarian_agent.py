# agents/contrarian_agent.py (REFINED LOGIC)

import random
import numpy as np
from agents.base_agent import BaseAgent
from utils.config import ORDER_QTY_MAX, ORDER_CASH_FRACTION

class ContrarianAgent(BaseAgent):
    """
    Contrarian Agent: Trades against extreme, short-term trends, 
    using deviation from a longer moving average as a signal.
    """
    MA_WINDOW = 5 
    DEVIATION_THRESHOLD = 0.03 
    MAX_TRADE_FRACTION = 0.5 
    def decide(self, sector):
        history = sector.history
        
        if len(history) < self.MA_WINDOW:
            return ("HOLD", 0)

        current_price = history[-1]
        
        sma = np.mean(history[-self.MA_WINDOW:])
        
        deviation = (current_price - sma) / sma

        action = "HOLD"
        qty_fraction = min(self.MAX_TRADE_FRACTION, abs(deviation) / self.DEVIATION_THRESHOLD * 0.15) 
        
        qty_raw = int(ORDER_QTY_MAX * qty_fraction)

        if deviation < -self.DEVIATION_THRESHOLD:
            action = "BUY"
        elif deviation > self.DEVIATION_THRESHOLD:
            action = "SELL"
        else:
            return ("HOLD", 0)

        if action == "BUY":
            trade_qty = self.can_buy_max(sector.price, qty_raw, ORDER_CASH_FRACTION)
            
        elif action == "SELL":
            held = self.holdings.get(sector.name, 0)
            trade_qty = int(min(qty_raw, held)) 
            
        else:
            trade_qty = 0

        if trade_qty > 0:
            return (action, trade_qty)
        else:
            return ("HOLD", 0)