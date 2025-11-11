# core/ga_evolver.py

import random
import numpy as np
import copy
from tqdm import trange
from core.sector import Sector
from agents.genetic_trader_agent import GeneticTrader
from core.market_engine import MarketEngine


PARAM_SPACE = {
    "momentum_thresh": (0.001, 0.05),
    "reversion_thresh": (0.001, 0.05),
    "trade_qty": (1, 50),
    "aggressiveness": (0.5, 2.0),
    "news_sensitivity": (0.0, 2.0),
    "herd_sensitivity": (0.0, 2.0),
}


def random_genome():
    genome = {}
    for k, (low, high) in PARAM_SPACE.items():
        if isinstance(low, int) and isinstance(high, int):
            genome[k] = random.randint(low, high)
        else:
            genome[k] = random.uniform(low, high)
    return genome


def mutate(genome, rate=0.3, scale=0.25):
    new = copy.deepcopy(genome)
    for k, (low, high) in PARAM_SPACE.items():
        if random.random() < rate:
            span = high - low
            new_val = new[k] + np.random.uniform(-scale, scale) * span
            new[k] = float(np.clip(new_val, low, high))
    return new


def crossover(g1, g2):
    child = {}
    for k in PARAM_SPACE.keys():
        alpha = random.random()
        child[k] = alpha * g1[k] + (1 - alpha) * g2[k]
    return child


def evaluate_genome(genome, background_agents, sectors, eval_days=15, seed=None):
    if seed:
        random.seed(seed)
        np.random.seed(seed)

    trader = GeneticTrader("GA_Test", genome=genome, track_history=False)
    agents = background_agents + [trader]

    engine = MarketEngine(agents, sectors_config=sectors)
    daily_worth = []

    for day in range(1, eval_days + 1):
        engine.simulate_day(day)
        daily_worth.append(trader.net_worth)

    if len(daily_worth) < 2:
        return 0.0

    rets = np.diff(daily_worth) / np.maximum(1e-9, daily_worth[:-1])
    mean_ret = np.mean(rets)
    vol = np.std(rets) + 1e-9

    sharpe_like = mean_ret / vol
    final_networth = daily_worth[-1]

    fitness = (0.7 * sharpe_like) + (0.3 * (final_networth / 100000.0))
    return fitness

def evolve(
    pop_size=20,
    generations=10,
    eval_days=15,
    background_agents=None,
    sectors=None,
    elite_frac=0.2,
    mutation_rate=0.3,
    seed=None,
):
    if background_agents is None:
        background_agents = []
    if sectors is None:
        sectors = Sector

    if seed:
        random.seed(seed)
        np.random.seed(seed)

    population = [random_genome() for _ in range(pop_size)]
    best_genome = None
    best_fitness = -float("inf")

    for gen in trange(generations, desc="Evolving GA Traders"):
        fitnesses = []

        for genome in population:
            fit = evaluate_genome(genome, background_agents, sectors, eval_days)
            fitnesses.append(fit)

        ranked = sorted(zip(population, fitnesses), key=lambda x: x[1], reverse=True)
        best_genome_gen, best_fit_gen = ranked[0]

        if best_fit_gen > best_fitness:
            best_genome = best_genome_gen
            best_fitness = best_fit_gen

        print(
            f"Gen {gen+1}/{generations} | Best This Gen: {best_fit_gen:.4f} | "
            f"Overall Best: {best_fitness:.4f}"
        )

        n_elite = max(1, int(pop_size * elite_frac))
        elites = [p for p, _ in ranked[:n_elite]]

        new_population = elites.copy()
        while len(new_population) < pop_size:
            p1, p2 = random.sample(elites, 2)
            child = crossover(p1, p2)
            child = mutate(child, rate=mutation_rate)
            new_population.append(child)

        population = new_population

    print("\nEvolution Complete!")
    print(f" Best Fitness: {best_fitness:.4f}")
    print(f"Best Genome: {best_genome}")

    return {"best_genome": best_genome, "best_fitness": best_fitness}
