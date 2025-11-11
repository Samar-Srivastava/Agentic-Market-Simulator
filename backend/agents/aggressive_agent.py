# agents/aggressive_agent.py (REFINED LOGIC)

from agents.base_agent import BaseAgent
import random
import numpy as np
from utils.config import ORDER_QTY_MAX, ORDER_CASH_FRACTION

class AggressiveTrader(BaseAgent):
    """High-frequency momentum chaser; amplifies even small moves."""
    
    def decide(self, sector):
        history = sector.history
        if len(history) < 3:
            return ("HOLD", 0)

        changes = np.diff(history[-3:]) / history[-3:-1]
        avg_change_pct = np.mean(changes) * 100
        volatility = np.std(changes) * 100 or 0.5
        
        aggression_multiplier = random.uniform(1.5, 3.0) 

        qty_factor = (abs(avg_change_pct) / (volatility + 0.1)) * 0.5 
        
        qty_base = ORDER_QTY_MAX * aggression_multiplier * qty_factor
        
        qty = int(max(1, min(qty_base, ORDER_QTY_MAX * 3.0)))

        if avg_change_pct > 0.1:  
            exec_qty = self.can_buy_max(sector.price, qty, ORDER_CASH_FRACTION)
            return ("BUY", exec_qty)
            
        elif avg_change_pct < -0.1:  
            held = self.holdings.get(sector.name, 0)
            exec_qty = min(qty, held)
            return ("SELL", exec_qty)
            
        else:
            if random.random() < 0.2:
                impulse_action = random.choice(["BUY", "SELL"])
                
                impulse_qty = int(ORDER_QTY_MAX * random.uniform(0.5, 1.0))
                
                if impulse_action == "SELL":
                    held = self.holdings.get(sector.name, 0)
                    impulse_qty = min(impulse_qty, held)
                    return ("SELL", impulse_qty)
                else:
                    exec_qty = self.can_buy_max(sector.price, impulse_qty, ORDER_CASH_FRACTION)
                    return ("BUY", exec_qty)
                    
            return ("HOLD", 0)