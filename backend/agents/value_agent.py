# agents/value_agent.py (FINAL ROBUST LOGIC & STRATEGIC ADJUSTMENT)

from agents.base_agent import BaseAgent
from utils.config import ORDER_QTY_MAX, ORDER_CASH_FRACTION

class ValueAgent(BaseAgent):
    """
    Value Agent: Buys when the market price is significantly below the sector's 
    fundamental value and sells when it's overvalued. Trade quantity is scaled 
    by the degree of mispricing.
    """
    
    MIN_DEVIATION = 0.025 
    
    MAX_TRADE_FRACTION = 0.4 

    def decide(self, sector):
        base_value = getattr(sector, 'fundamental', sector.history[0] if sector.history else sector.price)
        current_price = sector.price
        
        if base_value == 0:
            return ("HOLD", 0)
        
        mispricing_ratio = (base_value - current_price) / base_value 

        action = "HOLD"
        trade_fraction = 0

        if mispricing_ratio > self.MIN_DEVIATION:
            action = "BUY"
            trade_fraction = min(self.MAX_TRADE_FRACTION, mispricing_ratio / self.MIN_DEVIATION * 0.1) # Scale aggressively
            
        elif mispricing_ratio < -self.MIN_DEVIATION:
            action = "SELL"
            trade_fraction = min(self.MAX_TRADE_FRACTION, abs(mispricing_ratio) / self.MIN_DEVIATION * 0.1)

        qty_raw = int(ORDER_QTY_MAX * trade_fraction)
        
        if action == "BUY":
            exec_qty = self.can_buy_max(current_price, qty_raw, ORDER_CASH_FRACTION)
            if exec_qty > 0:
                return ("BUY", exec_qty)
            
        elif action == "SELL":
            held = self.holdings.get(sector.name, 0)
            exec_qty = int(min(qty_raw, held))
            if exec_qty > 0:
                return ("SELL", exec_qty)
        
        return ("HOLD", 0)