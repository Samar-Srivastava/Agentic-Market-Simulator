# Agentic Market Simulator 
### An AI-Driven Behavioral Finance Engine

---

##  Overview

**Agentic Market Simulator** is a **high-fidelity, full-stack market simulation platform** designed to model and analyze **complex, emergent behavior** in financial markets.  
It operates as a **closed-loop ecosystem** where **16 distinct algorithmic agents** interact dynamically within a realistic economic environment.

This platform provides a research-grade environment for **behavioral finance, reinforcement learning, and market microstructure** studies.

---

##  Core Simulation Engine

The backend is powered by **FastAPI + PyTorch**, featuring a **custom market engine** that enforces realistic economic "physics" such as:

- **Mean Reversion**
- **Dynamic Volatility**
- **Price Impact** proportional to trading volume

The simulated market is populated by **16 distinct algorithmic agents**, covering a full behavioral and technical spectrum:

###  Agent Categories

- **Heuristic / Behavioral Agents:**  
  Trend followers, value investors, mean-reverters, panic sellers, and herd followers.  

- **Advanced AI Agents:**  
  State-of-the-art learning agents including:  
  - **DQN (Deep Q-Network)**  
  - **PPO (Proximal Policy Optimization)**  
  - **LSTM-based temporal trader**  
  - **GA-Optimized Hybrid Trader** (Genetic Algorithm-enhanced)

These agents adapt and evolve their trading strategies **online during simulation**, generating emergent, lifelike market behavior.

---

##  The 16 Strategic Archetypes

Each agent is modeled as a distinct **market personality**, from disciplined technical analysts to emotion-driven participants.

Some examples include:

| Agent Name | Strategy Focus |
|-------------|----------------|
| **Disciplined Trend Follower** | Trades based on multi-day validated trends |
| **Emotionally Reactive Trader** | Acts impulsively on short-term market shocks |
| **Value Seeker** | Buys undervalued assets, sells overvalued ones |
| **Herd Follower** | Mimics popular sentiment regardless of fundamentals |

This diversity creates **rich market interactions** — from bubbles and crashes to realistic volatility clustering.

---

##  Diagnostic & Visualization Dashboard

The **React + TypeScript** frontend provides real-time forensic tools and research-grade analytics.

### Key Features

- **Dynamic Configuration:**  
  Adjust volatility, initial prices, and agent selection before simulation.

- **Forensic Agent Hub:**  
  Deep-dive into individual agent behavior with:
  - Profit/Loss over time  
  - Transaction logs  
  - Unique tuning parameters (GA genomes, LSTM thresholds)

- **LLM News Injection (Gemini API):**  
  Integrates **Google Gemini** to generate **sequential, realistic news narratives** that act as market shocks — dynamically influencing agent sentiment.

---

##  Tech Stack

**Backend:** FastAPI, PyTorch (RL/NN), Pandas  
**Frontend:** React, TypeScript, Zustand  
**Containerization:** Docker & Docker Compose  
**AI Integration:** Google Gemini API  

---

##  Local Installation Guide

### 1. Clone the Repository
```bash
git clone https://github.com/Samar-Srivastava/Agentic-Market-Simulator.git
cd Agentic-Market-Simulator
```

### 2. Configure Environment Variables

Create a .env file inside the backend directory:
```bash
GEMINI_API_KEY="YOUR_API_KEY_HERE"
```

### 3. Build and Run via Docker Compose

From the project root:
```bash
cd backend
docker compose up --build
```

### 4. Run Frontend (React)

In a new terminal:
```bash
cd frontend
npm install
npm run dev
```

---


## Research & Extension Ideas

Integrate Transformer-based agents for multi-modal decision making
Add real-time sentiment data feeds from financial APIs
Extend dashboard with multi-agent correlation visualizations
Conduct behavioral stability and chaos analysis on agent ecosystems

---

Developed by **Samar Kumar Srivastava**

Special thanks to open-source contributors and the research community advancing AI in Finance.
