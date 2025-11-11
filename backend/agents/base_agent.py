# agents/base_agent.py
from typing import Dict
import random
from utils.config import STARTING_CASH, INITIAL_HOLDINGS_PROB, INITIAL_HOLDINGS_MAX, INVENTORY_LIMIT, TRANSACTION_COST

class BaseAgent:
    def __init__(self, name: str, starting_cash: float = STARTING_CASH):
        self.name = name
        self.cash = float(starting_cash)
        self.holdings: Dict[str, int] = {}   
        self.wealth_history = []
        for sector in []:
            pass

    def initialize_holdings(self, sector_names):
        self.wealth_history.clear() 
        if getattr(self, 'is_rl_agent', False): 
            for s in sector_names:
                self.holdings[s] = 0
            return
        for s in sector_names:
            if random.random() < INITIAL_HOLDINGS_PROB:
                qty = random.randint(1, INITIAL_HOLDINGS_MAX)
                self.holdings[s] = qty
            else:
                self.holdings[s] = 0

    def can_buy_max(self, price: float, order_qty_max: int, order_cash_fraction: float):
        afford_qty = int(self.cash // price)
        cap_by_cash_fraction = int(max(1, (self.cash * order_cash_fraction) // price))
        qty = min(order_qty_max, afford_qty, cap_by_cash_fraction, INVENTORY_LIMIT)
        return max(0, qty)

    
    def buy(self, sector_name: str, price: float, qty: int):
        cost_total = price * qty * (1 + TRANSACTION_COST)
        
        if qty <= 0: 
            return False
            
        if self.cash >= cost_total and self.holdings.get(sector_name, 0) + qty <= INVENTORY_LIMIT:
            
            self.cash -= cost_total
            self.holdings[sector_name] = self.holdings.get(sector_name, 0) + qty
            return True
        return False
   
    def sell(self, sector_name: str, price: float, qty: int):
        if qty <= 0:
            return False
        if self.holdings.get(sector_name, 0) >= qty: 
            self.holdings[sector_name] -= qty
            self.cash += price * qty * (1 - TRANSACTION_COST) 
            return True
        return False
    def portfolio_value(self, market_prices: dict):
        holdings_val = sum(self.holdings.get(s, 0) * market_prices.get(s, 0.0) for s in self.holdings)
        return self.cash + holdings_val

    def decide(self, sector):
        raise NotImplementedError
    
    def get_snapshot_data(self) -> Dict[str, float | int]:
        
        data = {"Cash": self.cash}
        data.update(self.holdings) 
        return data
