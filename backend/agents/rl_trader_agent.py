# agents/rl_trader_agent.py (FINAL COMPLETE ROBUST CODE)

import random
from collections import deque
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim

from agents.base_agent import BaseAgent
from utils.config import STARTING_CASH, ORDER_QTY_MAX, ORDER_CASH_FRACTION, INVENTORY_LIMIT, P_EXPLORE

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class QNet(nn.Module):
    def __init__(self, input_dim, hidden=128, output_dim=3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden),
            nn.ReLU(),
            nn.Linear(hidden, hidden),
            nn.ReLU(),
            nn.Linear(hidden, output_dim)
        )

    def forward(self, x):
        return self.net(x)


class RLTrader(BaseAgent):
    def __init__(
        self,
        name,
        lookback=3,
        lr=1e-3,
        gamma=0.99,
        buffer_size=5000,
        batch_size=64,
        train_every=5,
        start_train_after=200,
        qty_fraction=0.3 
    ):
        super().__init__(name)
        self.lookback = lookback
        self.state_size = lookback + 2
        self.action_size = 3
        self.gamma = gamma
        self.batch_size = batch_size
        self.train_every = train_every
        self.start_train_after = start_train_after
        self.qty_fraction = qty_fraction 
        self.epsilon = 1.0
        self.epsilon_min = 0.05
        self.epsilon_decay = 0.995
        self.qnet = QNet(self.state_size).to(DEVICE)
        self.target_q = QNet(self.state_size).to(DEVICE)
        self.target_q.load_state_dict(self.qnet.state_dict())
        self.optimizer = optim.Adam(self.qnet.parameters(), lr=lr)
        self.loss_fn = nn.MSELoss()
        self.memory = deque(maxlen=buffer_size)
        self._pending = {}
        self.is_rl_agent = True
        self._steps = 0
        self._last_portfolio = None


    def _build_state(self, sector):
        hist = sector.history
        returns = []
        for i in range(self.lookback):
            idx = -(i+1)
            if len(hist) + idx - 1 >= 0:
                prev = hist[idx-1]
                cur = hist[idx]
                if prev != 0:
                    returns.append((cur - prev) / prev)
                else:
                    returns.append(0.0)
            else:
                returns.append(0.0)
        returns = returns[::-1]
        
        held = self.holdings.get(sector.name, 0)
        holdings_frac = held / max(1, INVENTORY_LIMIT)
        cash_ratio = self.cash / max(1.0, STARTING_CASH)

        arr = np.array(returns + [holdings_frac, cash_ratio], dtype=np.float32)
        return arr

    def _map_action_to_trade(self, action_idx, sector):
        if action_idx == 0:
            return ("HOLD", 0)
        elif action_idx == 1:
            qty_raw = int(ORDER_QTY_MAX * self.qty_fraction)
            max_qty = self.can_buy_max(sector.price, qty_raw, ORDER_CASH_FRACTION)
            
            if max_qty <= 0:
                return ("HOLD", 0)
            
            qty = max(1, max_qty) 
            return ("BUY", qty)
        else:
            held = self.holdings.get(sector.name, 0)
            if held <= 0:
                return ("HOLD", 0)
                
            qty_raw = int(ORDER_QTY_MAX * self.qty_fraction) 
            qty = max(1, min(held, qty_raw))
            return ("SELL", qty)

    
    def decide(self, sector,day=None):
        
        state = self._build_state(sector)
        if random.random() < self.epsilon or random.random() < P_EXPLORE:
            action_idx = random.randrange(self.action_size)
        else:
            with torch.no_grad():
                s = torch.tensor(state, dtype=torch.float32, device=DEVICE).unsqueeze(0)
                q = self.qnet(s).cpu().numpy()[0]
                action_idx = int(np.argmax(q))
        self._pending[sector.name] = (state, action_idx)
        return self._map_action_to_trade(action_idx, sector)

    def on_day_end(self, day, prices):
        
        cur_val = self.portfolio_value(prices)
        if self._last_portfolio is None:
            reward = 0.0
        else:
            reward = cur_val - self._last_portfolio

        for sector_name, (state, action_idx) in list(self._pending.items()):
            held = self.holdings.get(sector_name, 0)
            holdings_frac = held / max(1, INVENTORY_LIMIT)
            cash_ratio = self.cash / max(1.0, STARTING_CASH)
            next_state = np.array(list(state[:self.lookback]) + [holdings_frac, cash_ratio], dtype=np.float32)

            done = False 
            self.memory.append((state, action_idx, float(reward), next_state, done))

        self._pending.clear()
        self._last_portfolio = cur_val
        self._steps += 1


    def update(self):
        if len(self.memory) >= self.start_train_after:
            self._train_step()
            if self._steps % (self.train_every * 10) == 0:
                self.target_q.load_state_dict(self.qnet.state_dict())

    def _train_step(self):
        batch = random.sample(self.memory, min(self.batch_size, len(self.memory)))
        states = torch.tensor(np.stack([b[0] for b in batch]), dtype=torch.float32, device=DEVICE)
        actions = torch.tensor([b[1] for b in batch], dtype=torch.long, device=DEVICE)
        rewards = torch.tensor([b[2] for b in batch], dtype=torch.float32, device=DEVICE)
        next_states = torch.tensor(np.stack([b[3] for b in batch]), dtype=torch.float32, device=DEVICE)
        dones = torch.tensor([b[4] for b in batch], dtype=torch.float32, device=DEVICE)

        q_values = self.qnet(states)
        q_sa = q_values.gather(1, actions.unsqueeze(1)).squeeze(1)

        with torch.no_grad():
            q_next = self.target_q(next_states)
            max_q_next, _ = q_next.max(dim=1)
            target = rewards + (1.0 - dones) * self.gamma * max_q_next

        loss = self.loss_fn(q_sa, target)
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()

    def save(self, path):
        torch.save({
            "qnet": self.qnet.state_dict(),
            "target_q": self.target_q.state_dict(),
            "optimizer": self.optimizer.state_dict(),
            "epsilon": self.epsilon
        }, path)

    def load(self, path):
        data = torch.load(path, map_location=DEVICE)
        self.qnet.load_state_dict(data["qnet"])
        self.target_q.load_state_dict(data["target_q"])
        self.optimizer.load_state_dict(data["optimizer"])
        self.epsilon = data.get("epsilon", self.epsilon)