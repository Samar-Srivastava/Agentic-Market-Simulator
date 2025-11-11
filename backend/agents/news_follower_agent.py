# agents/news_follower_agent.py (FINAL ROBUST LOGIC)

from agents.base_agent import BaseAgent
import random
from utils.config import ORDER_QTY_MAX, ORDER_CASH_FRACTION 


"""This agent trades based exclusively on the net positive/negative score aggregated from 
the LLM-generated news headlines for the current day, assuming an informational advantage."""

class NewsFollowerAgent(BaseAgent):
    def __init__(self, name, news_feed):
        super().__init__(name)
        self.news_feed = news_feed

    def decide(self, sector, day=None): 
        
        current_day = day if day is not None else (sector.history and len(sector.history))
        
        if not self.news_feed:
            return ("HOLD", 0)

        today_news = [n for n in self.news_feed 
                    if n.get("Sector") == sector.name and (current_day is None or n.get("Day") == current_day)]
        
        if not today_news:
            return ("HOLD", 0)

        sentiment_score = 0
        for n in today_news:
            if n.get("Sentiment") == "positive":
                sentiment_score += 1
            elif n.get("Sentiment") == "negative":
                sentiment_score -= 1

        action = "HOLD"
        
        if sentiment_score > 0:
            action = "BUY"
        elif sentiment_score < 0:
            action = "SELL"
        else:
            return ("HOLD", 0)

        max_fraction = 0.5
        score_base = max(1, abs(sentiment_score)) 
        
        qty_raw = int(min(ORDER_QTY_MAX * max_fraction, score_base * 5 + random.randint(1, 10))) 

        current_price = sector.price
        
        if action == "BUY":
            exec_qty = self.can_buy_max(current_price, qty_raw, ORDER_CASH_FRACTION)
            if exec_qty > 0:
                return ("BUY", exec_qty)
        
        elif action == "SELL":
            held = self.holdings.get(sector.name, 0)
            exec_qty = min(qty_raw, held)
            if exec_qty > 0:
                return ("SELL", exec_qty)
        
        return ("HOLD", 0)