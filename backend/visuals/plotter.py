import matplotlib.pyplot as plt
import pandas as pd
import os

def plot_price_histories(df_prices, save_path="output/sector_trends.png"):
    
    plt.figure(figsize=(10, 6))
    for col in df_prices.columns:
        if col != "Day":
            plt.plot(df_prices["Day"], df_prices[col], label=col)
    plt.xlabel("Day")
    plt.ylabel("Stock Price")
    plt.title("Sector Price Trends Over Time")
    plt.legend()
    plt.grid(True, alpha=0.3)
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    plt.savefig(save_path, bbox_inches="tight")
    plt.close()
    print(f"Sector trends saved → {save_path}")


def plot_agent_performance(agents):
    data = []
    for agent in agents:
        if hasattr(agent, "wealth_history"):
            for day, wealth in enumerate(agent.wealth_history, start=1):
                data.append({"Agent": agent.name, "Day": day, "Wealth": wealth})

    if not data:
        print(" No agent performance data to plot.")
        return

    df_agents = pd.DataFrame(data)

    plt.figure(figsize=(8, 5))
    for agent_name in df_agents["Agent"].unique():
        df_subset = df_agents[df_agents["Agent"] == agent_name]
        plt.plot(df_subset["Day"], df_subset["Wealth"], label=agent_name)

    plt.title("Agent Wealth Over Time")
    plt.xlabel("Day")
    plt.ylabel("Wealth (₹)")
    plt.legend()
    plt.tight_layout()

    os.makedirs("output", exist_ok=True)
    plt.savefig("output/agent_performance.png")
    plt.close()

    print("Agent performance saved → output/agent_performance.png")