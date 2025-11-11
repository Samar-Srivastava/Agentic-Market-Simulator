# agents/ppo_trader_agent.py 

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from agents.base_agent import BaseAgent
from utils.config import ORDER_QTY_MAX, ORDER_CASH_FRACTION, INVENTORY_LIMIT, STARTING_CASH 


DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class PolicyNetwork(nn.Module):
    def __init__(self, input_dim, hidden_dim=64, action_dim=3):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.action_head = nn.Linear(hidden_dim, action_dim)
        self.value_head = nn.Linear(hidden_dim, 1)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        logits = self.action_head(x)
        value = self.value_head(x)
        return logits, value



class PPOTrader(BaseAgent):
    def __init__(self, name="PPOTrader", lookback=3, qty_fraction=0.3): 
        super().__init__(name)
        self.lookback = lookback
        self.is_rl_agent = True
        self.qty_fraction = qty_fraction 

        self.gamma = 0.99
        self.clip_epsilon = 0.2
        self.lr = 3e-4

        self.policy = PolicyNetwork(input_dim=self.lookback + 2).to(DEVICE)
        self.optimizer = optim.Adam(self.policy.parameters(), lr=self.lr)

        self.states = []
        self.actions = []
        self.rewards = []
        self.log_probs = []
        self.values = []
        self.dones = []

    def _build_state(self, sector):
        hist = sector.history
        returns = []
        for i in range(self.lookback):
            idx = -(i + 1)
            if len(hist) + idx - 1 >= 0:
                prev = hist[idx - 1]
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

        state = np.array(list(returns) + [holdings_frac, cash_ratio], dtype=np.float32)
        return state

    def decide(self, sector, state=None):
        if state is None:
            state = self._build_state(sector)

        state_tensor = torch.tensor(state, dtype=torch.float32, device=DEVICE).unsqueeze(0)
        logits, value = self.policy(state_tensor)
        probs = torch.softmax(logits, dim=-1)
        dist = torch.distributions.Categorical(probs)
        action = dist.sample()
        logprob = dist.log_prob(action)

        self.states.append(state)
        self.actions.append(action.item())
        self.log_probs.append(logprob)
        self.values.append(value.squeeze().detach())

        action_idx = action.item()
        current_price = sector.price
        
        qty_raw = int(ORDER_QTY_MAX * self.qty_fraction) 
        
        if action_idx == 0:
            return ("HOLD", 0)
            
        elif action_idx == 1:
            buy_qty = self.can_buy_max(current_price, qty_raw, ORDER_CASH_FRACTION)
            return ("BUY", buy_qty)
            
        else: 
            held = self.holdings.get(sector.name, 0)
            sell_qty = min(qty_raw, held)
            return ("SELL", sell_qty)

    def store_reward(self, reward, done=False):
        self.rewards.append(reward)
        self.dones.append(done)

    def update(self):
        if len(self.rewards) == 0:
            return

        states = torch.tensor(np.stack(self.states), dtype=torch.float32, device=DEVICE)
        actions = torch.tensor(self.actions, dtype=torch.long, device=DEVICE)
        old_log_probs = torch.stack(self.log_probs).detach()
        values = torch.stack(self.values).to(DEVICE)
        rewards = torch.tensor(self.rewards, dtype=torch.float32, device=DEVICE)
        dones = torch.tensor(self.dones, dtype=torch.float32, device=DEVICE)

        returns = []
        G = 0
        for r, done in zip(reversed(rewards), reversed(dones)):
            if done:
                G = 0
            G = r + self.gamma * G
            returns.insert(0, G)
        returns = torch.tensor(returns, dtype=torch.float32, device=DEVICE)

        min_len = min(len(returns), len(values), len(actions), len(old_log_probs))
        returns = returns[:min_len]
        values = values[:min_len]
        actions = actions[:min_len]
        old_log_probs = old_log_probs[:min_len]
        states = states[:min_len]

        advantages = returns - values.detach()

        logits, new_values = self.policy(states)
        probs = torch.softmax(logits, dim=-1)
        dist = torch.distributions.Categorical(probs)
        new_log_probs = dist.log_prob(actions)
        ratio = torch.exp(new_log_probs - old_log_probs)

        # PPO clipped objective
        surr1 = ratio * advantages
        surr2 = torch.clamp(ratio, 1 - self.clip_epsilon, 1 + self.clip_epsilon) * advantages
        actor_loss = -torch.min(surr1, surr2).mean()
        critic_loss = (returns - new_values.squeeze()).pow(2).mean()

        loss = actor_loss + 0.5 * critic_loss

        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()

        self.states.clear()
        self.actions.clear()
        self.rewards.clear()
        self.log_probs.clear()
        self.values.clear()
        self.dones.clear()

    def store_reward(self, reward, done=False):
        self.rewards.append(reward)
        self.dones.append(done)

    def save(self, path):
        torch.save({
            "qnet": self.policy.state_dict(),
            "optimizer": self.optimizer.state_dict(),
        }, path)

    def load(self, path):
        data = torch.load(path, map_location=DEVICE)
        self.policy.load_state_dict(data["qnet"])
        self.optimizer.load_state_dict(data["optimizer"])