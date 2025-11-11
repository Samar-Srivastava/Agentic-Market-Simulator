# utils/config.py 

SECTORS = {
    "Tech": 450.0,    
    "Pharma": 220.0,
    "Finance": 180.0,
    "Energy": 85.0,
    "Gold": 1200.0    
}
NUM_DAYS = 45

KAPPA = 0.01
SIGMA_NOISE = 0.005 

NEWS_CAP_NORMAL = 5.0 
NEWS_CAP_SHOCK = 15.0 
MAX_DAILY_MOVE = 20.0 

LIQUIDITY = {
    "Tech": 1_000_000,
    "Pharma": 500_000,
    "Finance": 1_000_000,
    "Energy": 700_000,
    "Gold": 200_000
}
IMPACT_ALPHA = 0.02 


STARTING_CASH = 100_000
INITIAL_HOLDINGS_PROB = 0.3
INITIAL_HOLDINGS_MAX = 15 
ORDER_QTY_MAX = 100 
ORDER_CASH_FRACTION = 0.20
TRANSACTION_COST = 0.001 
INVENTORY_LIMIT = 10_000 
P_EXPLORE = 0.05 

SPILLOVER = {
    ("Tech", "Finance"): 0.25,
    ("Tech", "Pharma"): 0.1,
    ("Finance", "Tech"): 0.15,
    ("Gold", "Tech"): -0.1
}