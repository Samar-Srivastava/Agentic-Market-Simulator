// src/components/market/MarketOverview.tsx

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; 
import { TrendingUp, TrendingDown, BarChart3, Layers, AlertTriangle, Loader2 } from "lucide-react";
import { getMarketData, type MarketPriceData } from "../../api/index"; 

type MarketSummary = {
    totalStocks: number;
    avgChange: number; 
    topGainer: string;
    topLoser: string;
    volatility: number;
};

const INITIAL_SUMMARY: MarketSummary = {
    totalStocks: 0,
    avgChange: 0,
    topGainer: "N/A",
    topLoser: "N/A",
    volatility: 0,
};

function useMarketSummary() {
    const [summary, setSummary] = useState<MarketSummary>(INITIAL_SUMMARY);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAndCalculate = useMemo(() => async () => {
        setLoading(true);
        setError(null);
        try {
            const priceHistory: MarketPriceData = await getMarketData('market_prices');

            if (!priceHistory || priceHistory.length < 2) {
                throw new Error("Simulation data is incomplete (need at least 2 days).");
            }
            
            const sectors = Object.keys(priceHistory[0] as Record<string, any>).filter(k => k !== 'Day');            const startPrices = sectors.map(s => priceHistory[0][s] as number);
            const endPrices = sectors.map(s => priceHistory[priceHistory.length - 1][s] as number);
            
            let totalNetChange = 0;
            let maxGain = -Infinity;
            let maxLoss = Infinity;
            let gainerName = "N/A";
            let loserName = "N/A";

            sectors.forEach((name, i) => {
                const start = startPrices[i];
                const end = endPrices[i];
                const change = (end - start) / start;
                const changePct = change * 100;
                totalNetChange += change;

                if (changePct > maxGain) {
                    maxGain = changePct;
                    gainerName = `${name} (+${changePct.toFixed(1)}%)`;
                }
                if (changePct < maxLoss) {
                    maxLoss = changePct;
                    loserName = `${name} (${changePct.toFixed(1)}%)`;
                }
            });

            const finalPrices = endPrices;
            const mean = finalPrices.reduce((a, b) => a + b, 0) / finalPrices.length;
            const variance = finalPrices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / finalPrices.length;
            const volatilityIndex = Math.sqrt(variance) / mean; 

            setSummary({
                totalStocks: sectors.length,
                avgChange: (totalNetChange / sectors.length) * 100,
                topGainer: gainerName,
                topLoser: loserName,
                volatility: volatilityIndex,
            });

        } catch (err) {
            console.error("Failed to load market data:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred fetching market data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAndCalculate();
    }, [fetchAndCalculate]);

    return { summary, loading, error };
}


export default function MarketOverview() {
    const { summary, loading, error } = useMarketSummary();

    const cards = [
        {
            title: "Total Stocks",
            icon: Layers,
            value: summary.totalStocks,
            cardColorClass: "bg-indigo-50/50 border-indigo-200", 
            accentColorClass: "text-indigo-600 bg-indigo-100", 
            format: (val: any) => val,
        },
        {
            title: "Average Change",
            icon: summary.avgChange >= 0 ? TrendingUp : TrendingDown,
            value: summary.avgChange,
            cardColorClass: summary.avgChange >= 0 ? "bg-green-50/50 border-green-200" : "bg-red-50/50 border-red-200",
            accentColorClass: summary.avgChange >= 0 ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100",
            format: (val: number) => `${val > 0 ? "+" : ""}${val.toFixed(2)}%`,
        },
        {
            title: "Top Gainer",
            icon: TrendingUp,
            value: summary.topGainer,
            cardColorClass: "bg-green-50/50 border-green-200",
            accentColorClass: "text-green-600 bg-green-100",
            format: (val: string) => val.split(' ')[0], 
            subValue: summary.topGainer,
        },
        {
            title: "Top Loser",
            icon: TrendingDown,
            value: summary.topLoser,
            cardColorClass: "bg-red-50/50 border-red-200",
            accentColorClass: "text-red-600 bg-red-100",
            format: (val: string) => val.split(' ')[0], 
            subValue: summary.topLoser,
        },
        {
            title: "Market Volatility",
            icon: BarChart3,
            value: summary.volatility,
            cardColorClass: "bg-amber-50/50 border-amber-200",
            accentColorClass: "text-amber-600 bg-amber-100",
            format: (val: number) => val.toFixed(3),
        },
    ];
    
    if (loading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-xl shadow-sm animate-pulse h-28 bg-gray-100 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-indigo-400" />
                    </div>
                ))}
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex items-start p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-lg shadow-sm">
                <AlertTriangle className="w-5 h-5 mr-3 mt-1 flex-shrink-0" />
                <div>
                    <p className="text-base font-semibold">Data Load Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {cards.map((card, idx) => {
                const isGainerLoser = card.title.includes("Gainer") || card.title.includes("Loser");
                const [textColor, bgColor] = card.accentColorClass.split(' ');
                
                return (
                    <Card key={idx} className={`border-2 ${card.cardColorClass} transition-all duration-300 p-2 hover:shadow-lg`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
                            <CardTitle className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{card.title}</CardTitle>
                            <div className={`p-2 rounded-full ${bgColor}`}>
                                <card.icon className={`w-5 h-5 ${textColor}`} />
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <div className={`text-3xl font-extrabold ${textColor}`}>
                                {card.format(card.value)}
                            </div>
                            
                            {isGainerLoser && (
                                <p className="text-xs text-gray-600 truncate mt-1">
                                    {card.subValue!.split(' ').slice(1).join(' ')} 
                                </p>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}