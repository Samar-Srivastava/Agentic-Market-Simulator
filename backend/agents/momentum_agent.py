# agents/momentum_agent.py (INCREASED ACTIVITY)

from agents.base_agent import BaseAgent
import random
import numpy as np
from utils.config import ORDER_QTY_MAX, ORDER_CASH_FRACTION

class MomentumAgent(BaseAgent):
    """
    Momentum Agent: Trades in the direction of a sustained, multi-day trend.
    Trade size is proportional to the strength of the momentum.
    """
    
    MOMENTUM_WINDOW = 5 
    MOMENTUM_THRESHOLD_PCT = 0.003  

    def decide(self, sector):
        history = sector.history
        
        if len(history) < self.MOMENTUM_WINDOW: 
            return ("HOLD", 0)

        old_price = history[-self.MOMENTUM_WINDOW] 
        current_price = history[-1]
        
        if old_price == 0:
            return ("HOLD", 0)
            
        total_change_return = (current_price - old_price) / old_price 
        avg_daily_change_pct = total_change_return / self.MOMENTUM_WINDOW 

        
        action = "HOLD"
        trade_fraction = 0

        if abs(avg_daily_change_pct) > self.MOMENTUM_THRESHOLD_PCT:

            trade_fraction = min(0.5, abs(avg_daily_change_pct) / self.MOMENTUM_THRESHOLD_PCT * 0.15) 
            
            if avg_daily_change_pct > 0:
                action = "BUY"
            else:
                action = "SELL"
            
        
        trade_qty_limit = int(ORDER_QTY_MAX * trade_fraction)
        current_price = history[-1]
        
        if action == "BUY":
            max_qty = self.can_buy_max(current_price, trade_qty_limit, ORDER_CASH_FRACTION)
            qty = max_qty
            
        elif action == "SELL":
            held = self.holdings.get(sector.name, 0)
            qty = min(trade_qty_limit, held) 
            
        else:
            return ("HOLD", 0)

        qty = int(qty * random.uniform(0.95, 1.05)) 

        if qty > 0:
            return (action, qty)
        else:
            return ("HOLD", 0)