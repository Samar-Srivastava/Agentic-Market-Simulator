# agents/panic_trader_agent.py (FINAL ROBUST LOGIC)

from agents.base_agent import BaseAgent
import random
from utils.config import ORDER_QTY_MAX, ORDER_CASH_FRACTION 

class PanicTrader(BaseAgent):
    """Emotionally reactive trader that sells on fear and buys from FOMO."""
    
    def decide(self, sector):
        if len(sector.history) < 2:
            return ("HOLD", 0)

        pct_change = (sector.history[-1] - sector.history[-2]) / sector.history[-2] * 100
        current_price = sector.history[-1]
        
        max_commit_qty = int(ORDER_QTY_MAX) 
        
        if pct_change < -2:
            held = self.holdings.get(sector.name, 0)
            panic_factor = random.uniform(0.5, 1.0)
            
            sell_qty_raw = int(max_commit_qty * panic_factor) 
            sell_qty = int(min(held, sell_qty_raw))
            
            if sell_qty > 0:
                return ("SELL", sell_qty)

        elif pct_change > 2:
            fomo_qty_raw = int(max_commit_qty * random.uniform(0.3, 0.8))
            
            buy_qty = self.can_buy_max(current_price, fomo_qty_raw, ORDER_CASH_FRACTION)
            
            if buy_qty > 0:
                return ("BUY", buy_qty)

        elif random.random() < 0.1:
            impulse_qty_raw = int(max_commit_qty * 0.5)
            
            if random.random() < 0.5: 
                buy_qty = self.can_buy_max(current_price, impulse_qty_raw, ORDER_CASH_FRACTION)
                if buy_qty > 0:
                    return ("BUY", buy_qty)
            else:
                held = self.holdings.get(sector.name, 0)
                sell_qty = int(min(held, impulse_qty_raw))
                if sell_qty > 0:
                    return ("SELL", sell_qty)

        return ("HOLD", 0)