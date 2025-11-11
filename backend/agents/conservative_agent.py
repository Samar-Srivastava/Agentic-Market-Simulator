# agents/conservative_agent.py (INCREASED ACTIVITY)

from agents.base_agent import BaseAgent
from utils.config import ORDER_QTY_MAX, ORDER_CASH_FRACTION
import numpy as np

class ConservativeTrader(BaseAgent):
    """
    Conservative Trader: Trades only when strong multi-day signals appear, 
    with a proportional trade size, prioritizing capital preservation.
    """
    
    LOOKBACK = 5 
    
    MIN_TRADE_THRESHOLD = 0.4 
    
    def decide(self, sector):
        history = sector.history
        
        if len(history) < self.LOOKBACK + 1:
            return ("HOLD", 0)

        returns = np.diff(history[-(self.LOOKBACK + 1):]) / history[-(self.LOOKBACK + 1):-1] 
        weights = np.arange(1, self.LOOKBACK + 1)
        weighted_signal = np.dot(returns, weights) / np.sum(weights) * 100 # Convert to %
        
        
        volatility = np.std(returns) * 100 or 1
        
        threshold = max(self.MIN_TRADE_THRESHOLD, volatility * 0.8) 
        
        signal_strength = abs(weighted_signal) / threshold
        
        MAX_TRADE_FRACTION = 0.30 
        
        trade_fraction = max(0.1, min(MAX_TRADE_FRACTION, signal_strength * 0.15)) 
        qty_raw = int(ORDER_QTY_MAX * trade_fraction)

        
        if weighted_signal > threshold: 
            exec_qty = self.can_buy_max(sector.price, qty_raw, ORDER_CASH_FRACTION)
            return ("BUY", exec_qty)
            
        elif weighted_signal < -threshold:
            held = self.holdings.get(sector.name, 0)
            qty_to_sell = min(qty_raw, held)
            return ("SELL", qty_to_sell)
            
        else:
            return ("HOLD", 0)