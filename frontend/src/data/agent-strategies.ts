// src/data/agent-strategies.ts

export const STRATEGY_PROFILES: Record<string, { title: string, description: string, specialty: string }> = {
    
    "RandomAgent": {
        title: "Stochastic Baseline Trader",
        description: "This agent operates without any strategic logic, making decisions based purely on fixed, random probabilities. Its performance provides the essential stochastic baseline against which all other strategies are measured.",
        specialty: "Baseline Testing / Market Noise"
    },
    
    "AggressiveTrader": {
        title: "High-Frequency Momentum Chaser",
        description: "Utilizes short-term momentum (2-day average returns) to execute large, high-conviction trades. It seeks to amplify small movements into rapid profit opportunities, committing a high fraction of its maximum trade size.",
        specialty: "High Volatility / Quick Gains"
    },
    
    "ConservativeTrader": {
        title: "Disciplined Trend Follower",
        description: "Relies on validated, multi-day trends (5-day weighted returns). It maintains a high threshold, only acting when the signal overcomes both a minimum return and market volatility, prioritizing stability over speed.",
        specialty: "Capital Preservation / Stable Returns"
    },
    
    "ContrarianAgent": {
        title: "Mean-Reversion Trader",
        description: "Specializes in exploiting short-term market overreactions. It uses the 5-day moving average as a baseline, betting that prices that deviate significantly (e.g., >3%) will snap back toward the mean.",
        specialty: "Exploiting Overbought/Oversold Conditions"
    },

    "RelativeStrengthAgent": {
    title: "Simplified Absolute Momentum Trader",
    description: "Initially intended for sector rotation, this agent was simplified to execute trades based on whether the current sector's price movement exceeds a (0.2% average return) over a short 3-day lookback window.",
    specialty: "Short-Term Trend Following / Quick Entry/Exit"
    },

    "ValueAgent": {
        title: "Intrinsic Value Investor",
        description: "This agent operates on the belief that markets are inefficient. It maintains an anchoring 'fundamental' price and only executes trades when the market price deviates by more than 2.5% from this intrinsic value.",
        specialty: "Discount/Premium Hunting"
    },
    
    "LongTermInvestorAgent": {
        title: "Adaptive Fundamental Value Investor",
        description: "A patient agent that attempts to determine a sector's 'fair value' which slowly adapts over time. It trades infrequently, focusing on significant deviations from this evolving fundamental value.",
        specialty: "Long-Term Conviction / Low Frequency"
    },
    
    "ShortTermInvestorAgent": {
        title: "Short-Term Risk-Adjusted Trader",
        description: "A high-frequency trader that prioritizes signals offering the best return relative to risk (volatility/Sharpe-like ratio) over a short 3-day time horizon.",
        specialty: "High Signal-to-Noise Ratio"
    },
    
    "NewsFollowerAgent": {
        title: "Reactive Sentiment Trader",
        description: "This agent trades based exclusively on the net positive/negative score aggregated from the LLM-generated news headlines for the current day, assuming an informational advantage.",
        specialty: "External Information Arbitrage"
    },
    
    "HerdFollowerAgent": {
        title: "Behavioral Imitation Follower",
        description: "Specializes in social imitation, trading based purely on the aggregate buy/sell pressure of all other active agents. It reacts quickly to any consensus above a minimal threshold.",
        specialty: "Following Market Consensus / Panic Participation"
    },
    
    "PanicTraderAgent": {
        title: "Emotionally Reactive Trader",
        description: "Ignores all analysis, basing its actions purely on large, immediate single-day price changes (Panic < -2%, FOMO > 2%). It is the simulation's test case for irrational behavior.",
        specialty: "Extreme Behavior / High Whipsaw Risk"
    },

    "LSTMTraderAgent": {
        title: "Neural Network Forecaster (LSTM)",
        description: "Uses a trained deep learning model (LSTM) to predict the next day's market direction (Up, Down, or Neutral) based on technical features like RSI and SMA. It acts only when its prediction confidence is high.",
        specialty: "Time-Series Pattern Recognition"
    },
    "PpoTraderAgent": {
        title: "Policy Optimization (PPO) Trader",
        description: "A stable Reinforcement Learning agent that learns an optimal trading policy by maximizing expected returns while using a clipping mechanism to prevent erratic behavior during training.",
        specialty: "Stable Policy Learning / On-Policy Optimization"
    },
    "RlTraderAgent": {
        title: "Deep Q-Network (DQN) Trader",
        description: "A Reinforcement Learning agent that learns the optimal action for any given state (price, cash, holdings) by approximating the future value (Q-value) of each discrete action.",
        specialty: "Value-Function Approximation / Experience Replay"
    },
    "GeneticTrader": {
        title: "Evolutionary Hybrid Trader (GA-Optimized)",
        description: "Its trading rules (genome) are optimized via a Genetic Algorithm. It is explicitly trained to find the best compromise between risk and reward (Sharpe Ratio) in the multi-agent market.",
        specialty: "Machine-Optimized Risk/Reward"
    },
    "MomentumAgent": {
        title: "Sustained Trend Follower (Adaptive Sizing)",
        description: "Trades in the direction of a validated, multi-day trend (5-day window). It requires the average daily change to exceed a 0.3% threshold. Crucially, its trade size is proportional to the strength of the momentum signal, reflecting higher conviction for stronger trends.",
        specialty: "Medium-Term Trend Validation / Adaptive Trade Sizing"
    },
};