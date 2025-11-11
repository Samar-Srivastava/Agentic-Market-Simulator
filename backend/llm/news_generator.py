# core/news_generator.py 

import os
import json
import re
import google.generativeai as genai
from utils.config import SECTORS

PROMPT_TEMPLATE = """
You are a sophisticated financial news generator specializing in sequential, plausible market narratives.
Generate a realistic {num_days}-day sequence of news headlines, starting from Day 1.

**CRITICAL INSTRUCTIONS FOR MARKET REALISM:**

1.  **Narrative Plausibility:** When a strong event occurs on Day N, the news for Day N+1 should reflect a highly plausible sequel. This sequel should be one of three types:
    * **Continuation (High Probability):** The previous trend accelerates or continues smoothly.
    * **Consolidation (Medium Probability):** The market pauses or has a small dip/gain (Change < 1%), digesting the initial shock.
    * **Reversal/Shock (Low Probability):** An unrelated event or profit-taking causes the previous trend to abruptly fail.

2.  **Trend Variety:** Do not enforce a fixed trend length (e.g., 3-5 days). Cycles of sustained bullish or bearish activity should emerge naturally, running for random periods based on the model's probabilistic internal state.

3.  **Market Awareness:** Headlines must explicitly reference prior performance (e.g., 'Rebound After Yesterday's Plunge').

**Input Data:** Starting market sectors and their base values: {sectors}.

**Output Requirements (STRICTLY USE THIS FORMAT):**
- Each day must have 0–5 news headlines.
- Each item must strictly follow the JSON object format: Day, Sector, Headline, Sentiment (positive|neutral|negative), PercentChange (Float).
Output a single, continuous JSON list of objects.
"""

def generate_market_news(numDays):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError("❌ Missing GEMINI_API_KEY in environment or .env")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-pro")

    prompt = PROMPT_TEMPLATE.format(
        sectors=", ".join([f"{k} {v}" for k, v in SECTORS.items()]),
        num_days=numDays  
    )

    response = model.generate_content(prompt)
    text = response.text.strip()

    try:
        data = json.loads(text)
    except Exception:
        match = re.search(r"\[.*\]", text, re.S)
        if match:
            data = json.loads(match.group(0))
        else:
            print("⚠️ Failed to extract JSON from Gemini response.")
            data = []

    os.makedirs("output", exist_ok=True)
    with open("output/news.json", "w") as f:
        json.dump(data, f, indent=2)

    print(f"📰 Generated {len(data)} news items → output/news.json")
    return data