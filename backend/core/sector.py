import random

class Sector:
    def __init__(self, name: str, base_price: float):
        self.name = name
        self.price = base_price
        self.history = [base_price]

    def update_price(self, demand_factor: float):

        volatility = random.uniform(0.98, 1.02)
        new_price = self.price * demand_factor * volatility
        self.price = round(new_price, 2)
        self.history.append(self.price)
