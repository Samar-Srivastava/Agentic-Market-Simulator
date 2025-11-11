import json
import os
import pandas as pd
from utils.config import SECTORS

def simulate_from_news(news_path="output/news.json"):
    if not os.path.exists(news_path):
        raise FileNotFoundError(f" News file not found: {news_path}")

    with open(news_path, "r") as f:
        news_data = json.load(f)

    if not isinstance(news_data, list) or not news_data:
        print(" No news data found or invalid format.")
        return pd.DataFrame()

    df_changes = pd.DataFrame(columns=["Day", *SECTORS.keys()])
    max_day = max([item.get("Day", 0) for item in news_data if isinstance(item, dict)], default=0)
    daily_changes = {day: {s: 0.0 for s in SECTORS.keys()} for day in range(1, max_day + 1)}

    for item in news_data:
        try:
            day = int(item.get("Day", 0))
            sector = item.get("Sector")
            change = float(item.get("PercentChange", 0))
            if day > 0 and sector in daily_changes[day]:
                daily_changes[day][sector] += change
        except Exception as e:
            print(f"⚠️ Skipping bad news item: {item} ({e})")

    df_changes = pd.DataFrame.from_dict(daily_changes, orient="index").reset_index()
    df_changes.rename(columns={"index": "Day"}, inplace=True)
    df_changes = df_changes.round(2)

    os.makedirs("output", exist_ok=True)
    df_changes.to_csv("output/news_market_prices.csv", index=False)
    print("News-driven simulation done → output/news_market_prices.csv")

    return df_changes
