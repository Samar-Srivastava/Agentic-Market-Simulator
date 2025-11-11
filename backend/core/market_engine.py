# core/market_engine.py
import math
import random
from core.sector import Sector
from utils.config import (
    KAPPA, SIGMA_NOISE, NEWS_CAP_NORMAL, NEWS_CAP_SHOCK, MAX_DAILY_MOVE,
    LIQUIDITY, IMPACT_ALPHA, SPILLOVER, TRANSACTION_COST
)

class MarketEngine:
    def __init__(self, agents, sectors_config):
        self.agents = agents
        self.sectors = [Sector(name, price) for name, price in sectors_config.items()]
        self.transaction_log = []  
        self.agent_snapshots = []   
        self.news_effects = None   
        self.herd_memory = {}       

        for s in self.sectors:
            s.fundamental = s.history[0] if s.history else s.price

    def _aggregate_orders(self, day):
        
        net_qty = {s.name: 0 for s in self.sectors}

        for agent in self.agents:
            for sector in self.sectors:
                state = None
                if hasattr(agent, "_build_state"):
                    try:
                        state = agent._build_state(sector)
                    except Exception:
                        state = None

                try:
                    if state is not None:
                        decision = agent.decide(sector, state)
                    else:
                        decision = agent.decide(sector)
                except TypeError:
                    try:
                        decision = agent.decide(sector, day)
                    except Exception as e:
                        print(f"⚠️ Agent {getattr(agent,'name', '?')} decide error: {e}")
                        decision = ("HOLD", 0)

                if isinstance(decision, tuple):
                    action, qty = decision
                else:
                    action, qty = decision, 0

                if action == "BUY" and qty > 0:
                    max_qty = agent.can_buy_max(sector.price, qty, 0.10)
                    exec_qty = min(qty, max_qty)
                    if exec_qty > 0:
                        cost = sector.price * exec_qty * (1 + TRANSACTION_COST)
                        if agent.cash >= cost:
                            agent.buy(sector.name, sector.price, exec_qty)
                            net_qty[sector.name] += exec_qty
                            self.transaction_log.append({
                                "Agent": agent.name,
                                "Day": day,
                                "Sector": sector.name,
                                "Action": "BUY",
                                "Price": sector.price,
                                "Qty": exec_qty
                            })

                elif action == "SELL" and qty > 0:
                    held = agent.holdings.get(sector.name, 0)
                    exec_qty = min(qty, held)
                    if exec_qty > 0:
                        agent.sell(sector.name, sector.price, exec_qty)
                        net_qty[sector.name] -= exec_qty
                        self.transaction_log.append({
                            "Agent": agent.name,
                            "Day": day,
                            "Sector": sector.name,
                            "Action": "SELL",
                            "Price": sector.price,
                            "Qty": exec_qty
                        })

        return net_qty

    def _get_news_effects(self, day):

        if self.news_effects is None:
            return {s.name: 0.0 for s in self.sectors}

        try:
            row = self.news_effects[self.news_effects["Day"] == day]
            if row.empty:
                return {s.name: 0.0 for s in self.sectors}
            row_dict = row.iloc[0].to_dict()
            return {s.name: row_dict.get(s.name, 0.0) for s in self.sectors}
        except Exception:
            return {s.name: 0.0 for s in self.sectors}

    def simulate_day(self, day):
        net_qty = self._aggregate_orders(day)
        news_pct = self._get_news_effects(day)
        for s in self.sectors:
            old = s.price
            Q = net_qty.get(s.name, 0)
            V = LIQUIDITY.get(s.name, 1_000_000)
            if Q == 0:
                impact_pct = 0.0
            else:
                impact_pct = IMPACT_ALPHA * math.copysign(math.sqrt(abs(Q) / V), Q) * 100.0
            impact_factor = 1.0 + impact_pct / 100.0

            nf_pct = news_pct.get(s.name, 0.0)
            cap = NEWS_CAP_SHOCK if abs(nf_pct) > NEWS_CAP_NORMAL else NEWS_CAP_NORMAL
            nf_pct = max(-cap, min(cap, nf_pct))
            news_factor = 1.0 + nf_pct / 100.0

            noise = random.gauss(0, SIGMA_NOISE)

            reversion = KAPPA * (s.fundamental - s.price) / s.price

            candidate = old * impact_factor * news_factor * (1.0 + noise)
            candidate += old * reversion

            pct_move = (candidate - old) / old * 100.0
            pct_move = max(-MAX_DAILY_MOVE, min(MAX_DAILY_MOVE, pct_move))
            new_price = round(old * (1.0 + pct_move / 100.0), 2)

            s.price = new_price
            s.history.append(new_price)

        for (src, tgt), weight in SPILLOVER.items():
            try:
                src_sector = next(x for x in self.sectors if x.name == src)
                tgt_sector = next(x for x in self.sectors if x.name == tgt)
            except StopIteration:
                continue
            if len(src_sector.history) < 2:
                continue
            src_old = src_sector.history[-2]
            src_new = src_sector.history[-1]
            if src_old == 0:
                continue
            src_pct = (src_new - src_old) / src_old
            ripple = weight * src_pct
            tgt_sector.price = round(tgt_sector.price * (1 + ripple), 2)
            if len(tgt_sector.history) >= 1:
                tgt_sector.history[-1] = tgt_sector.price

        prices = {s.name: s.price for s in self.sectors}
        for txn in self.transaction_log:
            if txn.get("Day") is None:
                txn["Day"] = day

        for agent in self.agents:
            total_val = agent.portfolio_value(prices)
            agent.wealth_history.append(round(total_val, 2))
            holdings_data = agent.get_snapshot_data() 
            
            log_entry = {
                "Day": day,
                "Agent": agent.name,
                "TotalValue": round(total_val, 2),
            }
            log_entry.update(holdings_data) 
            
            self.agent_snapshots.append(log_entry)

        if hasattr(self, "herd_memory"):
            for s in self.sectors:
                buys = sum(1 for txn in self.transaction_log if txn["Day"] == day and txn["Sector"] == s.name and txn["Action"] == "BUY")
                sells = sum(1 for txn in self.transaction_log if txn["Day"] == day and txn["Sector"] == s.name and txn["Action"] == "SELL")
                self.herd_memory[s.name] = {"buy": buys, "sell": sells}

        prices = {s.name: s.price for s in self.sectors}
        for agent in self.agents:
            if hasattr(agent, "is_rl_agent") and agent.is_rl_agent:
                if len(agent.wealth_history) >= 2:
                    prev_val = agent.wealth_history[-2]
                    curr_val = agent.wealth_history[-1]
                else:
                    prev_val = curr_val = agent.portfolio_value(prices)
                reward = curr_val - prev_val
                if hasattr(agent, "store_reward"):
                    try:
                        agent.store_reward(reward, done=False)
                    except Exception as e:
                        print(f" store_reward error for {agent.name}: {e}")

        for agent in self.agents:
            if hasattr(agent, "on_day_end"):
                try:
                    agent.on_day_end(day, prices)
                except Exception as e:
                    print(f" Agent on_day_end error: {agent.name} {e}")

    def get_sector_data(self):
        return {s.name: s.history for s in self.sectors}
