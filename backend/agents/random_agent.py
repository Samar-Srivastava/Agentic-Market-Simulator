# agents/random_agent.py (REFINED LOGIC)

from agents.base_agent import BaseAgent
import random
from utils.config import ORDER_QTY_MAX, ORDER_CASH_FRACTION, P_EXPLORE

class RandomAgent(BaseAgent):
    """
    Random Agent: Provides the stochastic baseline by making decisions 
    based on fixed probabilities, ignoring all market signals.
    """
    def decide(self, sector):
        current_price = sector.price
        r = random.random()
        
        if r < 0.40:
            action = "BUY"
        elif r < 0.80:
            action = "SELL"
        else:
            action = "HOLD"

        if action == "BUY":
            max_qty = self.can_buy_max(current_price, ORDER_QTY_MAX, ORDER_CASH_FRACTION)  
            qty = random.randint(1, max(1, max_qty)) if max_qty > 0 else 0      
            return ("BUY", qty)
            
        elif action == "SELL":
            held = self.holdings.get(sector.name, 0)
            qty = random.randint(1, held) if held > 0 else 0
            return ("SELL", qty)
            
        else:
            return ("HOLD", 0)