# agents/lstm_trader_agent.py (FINAL COMPLETE ROBUST CODE - NORMALIZATION REMOVED)

import os
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from typing import List, Optional


from agents.base_agent import BaseAgent
from utils.config import ORDER_QTY_MAX, ORDER_CASH_FRACTION

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


"""Uses a trained deep learning model (LSTM) to predict the next day's market 
direction (Up, Down, or Neutral) based on technical features like RSI and SMA.""" 

def compute_features(prices: List[float]):
    
    prices = np.array(prices, dtype=np.float32)
    
    window_feature = 5
    if len(prices) < window_feature:
        return np.zeros((len(prices), 4), dtype=np.float32)

    returns = np.concatenate([[0], np.diff(prices) / (prices[:-1] + 1e-9)])
    momentum = returns.copy()

    sma = np.convolve(prices, np.ones(window_feature) / window_feature, mode="full")[:len(prices)]
    for i in range(window_feature - 1):
        sma[i] = np.mean(prices[:i + 1]) 
    sma_ratio = sma / (prices + 1e-9)

    delta = np.diff(prices, prepend=prices[0])
    gain = np.where(delta > 0, delta, 0)
    loss = np.where(delta < 0, -delta, 0)
    
    avg_gain = np.zeros_like(gain)
    avg_loss = np.zeros_like(loss)
    
    for i in range(window_feature, len(prices)):
        avg_gain[i] = np.mean(gain[i - window_feature + 1 : i + 1])
        avg_loss[i] = np.mean(loss[i - window_feature + 1 : i + 1])

    rs = np.divide(avg_gain, avg_loss, out=np.zeros_like(avg_gain), where=avg_loss!=0)
    rsi = 100 - (100 / (1 + rs))
    rsi_norm = rsi / 100.0

    features = np.stack([returns, sma_ratio, rsi_norm, momentum], axis=1)
    return features



class LSTMClassifier(nn.Module):
    def __init__(self, input_size=4, hidden_size=64, num_layers=1, dropout=0.2):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size, hidden_size, num_layers,
            batch_first=True, dropout=dropout
        )
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_size, 3) 

    def forward(self, x):
        out, _ = self.lstm(x)
        last = self.dropout(out[:, -1, :])
        logits = self.fc(last)
        return logits

class LSTMTrader(BaseAgent):
    def __init__(
        self,
        name: str,
        window_size: int = 10,
        hidden_size: int = 64,
        num_layers: int = 1,
        conf_threshold: float = 0.45,  
        qty_fraction: float = 0.3,
    ):
        super().__init__(name)
        self.window_size = window_size
        self.conf_threshold = conf_threshold
        self.qty_fraction = qty_fraction

        self.model = LSTMClassifier(
            input_size=4, hidden_size=hidden_size, num_layers=num_layers
        ).to(DEVICE)
        model_path="models/lstm_cls_v2.pt"
        if model_path and os.path.exists(model_path):
            try:
                self.load(model_path)
                print(f"LSTM Model loaded successfully from {model_path} for {name}.")
            except Exception as e:
                print(f"ERROR loading LSTM model from {model_path} for {name}: {e}")
        else:
            print(f"LSTM Model file NOT FOUND at path: {model_path} for {name}.")

        self.pred_history = []
        self.conf_history = []

    def _prepare_window(self, prices: List[float]) -> Optional[torch.Tensor]:
        full_feats = compute_features(prices) 
        
        if len(full_feats) < self.window_size:
            return None
            
        feats = full_feats[-self.window_size:]
        
        
        x = torch.tensor(feats, dtype=torch.float32, device=DEVICE).unsqueeze(0)
        return x  
    
    def decide(self, sector):
        prices = sector.history
        x = self._prepare_window(prices)
        if x is None:
            return ("HOLD", 0)

        self.model.eval()
        with torch.no_grad():
            logits = self.model(x)
            probs = torch.softmax(logits, dim=-1).cpu().numpy().flatten()
            pred_idx = np.argmax(probs)
            conf = probs[pred_idx]

        self.pred_history.append(pred_idx)
        self.conf_history.append(conf)

        if len(self.pred_history) >= 3:
            recent = self.pred_history[-3:]
            avg_pred = max(set(recent), key=recent.count)
        else:
            avg_pred = pred_idx

        recent_prices = np.array(prices[-self.window_size:])
        volatility = np.std(np.diff(np.log(recent_prices + 1e-9)))
        dyn_thresh = min(0.8, self.conf_threshold + 0.2 * volatility) 

        if conf < dyn_thresh:
            return ("HOLD", 0)

        last_price = prices[-1]
        
        if avg_pred == 2:  
            qty_raw = max(1, int(ORDER_QTY_MAX * self.qty_fraction))
            exec_qty = self.can_buy_max(last_price, qty_raw, ORDER_CASH_FRACTION)
            return ("BUY", exec_qty)

        elif avg_pred == 0:  # down (index 0) → SELL
            held = self.holdings.get(sector.name, 0)
            qty_raw = max(1, int(ORDER_QTY_MAX * self.qty_fraction))
            qty_to_sell = min(held, qty_raw) 
            return ("SELL", qty_to_sell)

        return ("HOLD", 0)

    
    def save(self, path: str):
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        torch.save(self.model.state_dict(), path)

    def load(self, path: str):
        self.model.load_state_dict(torch.load(path, map_location=DEVICE))


def build_training_data(prices, window=10):
    X, y = [], []
    feats = compute_features(prices)
    for i in range(window, len(feats) - 1):
        seq = feats[i - window:i]
        next_ret = (prices[i + 1] - prices[i]) / prices[i]
        label = 2 if next_ret > 0.002 else 0 if next_ret < -0.002 else 1
        X.append(seq)
        y.append(label)
    return np.array(X), np.array(y)


def train_sample_model(save_path="models/lstm_cls_v2.pt"):
    prices = [100 + np.sin(i / 5) * 2 + np.random.randn() * 0.3 for i in range(300)]
    X, y = build_training_data(prices)
    model = LSTMClassifier()
    opt = optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-5)
    loss_fn = nn.CrossEntropyLoss()

    for ep in range(40):
        idx = np.random.permutation(len(X))
        for i in range(0, len(X), 32):
            bx = torch.tensor(X[idx[i:i + 32]], dtype=torch.float32)
            by = torch.tensor(y[idx[i:i + 32]], dtype=torch.long)
            opt.zero_grad()
            out = model(bx)
            loss = loss_fn(out, by)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 2.0)
            opt.step()
        if (ep + 1) % 5 == 0:
            print(f"Epoch {ep+1}: loss={loss.item():.4f}")

    torch.save(model.state_dict(), save_path)
    print(f"✅ Model saved to {save_path}")
    
if __name__ == "__main__":
    train_sample_model()