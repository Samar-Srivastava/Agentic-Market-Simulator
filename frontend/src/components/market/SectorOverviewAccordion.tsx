// src/components/market/SectorOverviewAccordion.tsx 

import { useState, useEffect, useMemo, type ReactElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Layers, BarChart, TrendingUp, TrendingDown, Zap, Tag, ArrowRight } from "lucide-react"; 
import { getMarketData} from "../../api/index";
import { Loader2, AlertTriangle } from "lucide-react";

type PriceHistoryItem = {
    Day: number;
    [sector: string]: number; 
};

type SectorMetrics = {
    name: string;
    finalPrice: number;
    totalChangePct: number;
    volatilityIndex: number; 
    dailyNetVolume: { day: number, netQty: number }[];
};
type TransactionItem = { Day: number; Sector: string; Action: 'BUY' | 'SELL'; Qty: number };

const SECTOR_INSIGHTS = (sectorName: string, isPositive: boolean) => {
    const generalSectorInfo: Record<string, string> = {
        "Tech": 
            "Technology stocks often reflect broad market health, driven by innovation, but their high valuation makes them sensitive to interest rate policy and market pullbacks. Major algorithmic funds frequently rebalance Tech, leading to larger swings after earnings releases.",
        "Pharma": 
            "The Pharmaceutical sector is generally defensive, reliant on regulatory approvals and long-term research pipelines. Mergers and breakthroughs can trigger sudden sector rotations, despite the usual slow-and-steady trend.",
        "Finance":
            "Financial institutions are deeply tied to the economic cycle. Performance reflects lending profitability, market confidence, and central bank monetary policy shifts. Volatility often spikes during rate announcements and quarterly stress tests.",
        "Energy": 
            "The Energy sector is primarily dictated by global commodity supply, demand forecasting, and geopolitical stability, leading to volatile price swings. Seasonal demand and OPEC decisions regularly create short-term momentum trades.",
        "Gold": 
            "Gold is traditionally viewed as a safe-haven asset, performing well during periods of high inflation, geopolitical turmoil, or when confidence in fiat currencies declines. ETF flows and central bank purchases are strong secondary drivers."
    };
    
    const performanceComment = isPositive 
        ? `The simulation closed with significant gains, suggesting positive underlying sentiment.`
        : `The simulation closed with losses, indicating persistent negative sentiment.`;
    return {
        description: generalSectorInfo[sectorName] || "General market sector information.",
        performance: performanceComment,
    };
};

function useSectorMetrics() {
    const [sectors, setSectors] = useState<SectorMetrics[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMetrics = useMemo(() => async () => {
        setLoading(true);
        setError(null);
        try {
            const [priceHistory, transactionLog] = await Promise.all([
                getMarketData('market_prices') as Promise<PriceHistoryItem[]>,
                getMarketData('transactions') as Promise<TransactionItem[]>
            ]);
            
            if (!priceHistory || priceHistory.length < 2) throw new Error("Simulation data is incomplete (need at least 2 days).");
            
            const sectors = Object.keys(priceHistory[0] as Record<string, any>).filter(k => k !== 'Day'); 
            
            const startDay = priceHistory[0];
            const endDay = priceHistory[priceHistory.length - 1];
            
            const netVolumeMap = (transactionLog as TransactionItem[]).reduce((acc, txn) => {
                if (!acc[txn.Sector]) acc[txn.Sector] = {};
                if (!acc[txn.Sector][txn.Day]) acc[txn.Sector][txn.Day] = 0;
                const sign = txn.Action === 'BUY' ? 1 : -1;
                acc[txn.Sector][txn.Day] += txn.Qty * sign;
                return acc;
            }, {} as Record<string, Record<number, number>>);
            
            const sectorMetrics: SectorMetrics[] = sectors.map(name => {
                const prices = priceHistory.map(d => d[name] as number);
                const start = startDay[name] as number;
                const final = endDay[name] as number;
                const totalChange = (final - start) / start * 100;
                const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
                const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
                const volIndex = Math.sqrt(variance) / mean;
                
                const dailyVolumeData = priceHistory.map(d => ({
                    day: d.Day,
                    netQty: netVolumeMap[name]?.[d.Day] || 0
                }));
                
                return {
                    name,
                    finalPrice: final,
                    totalChangePct: totalChange,
                    volatilityIndex: volIndex,
                    dailyNetVolume: dailyVolumeData,
                };
            });
            setSectors(sectorMetrics);
        } catch (err) {
            console.error("Sector metrics fetch failed:", err);
            setError(err instanceof Error ? err.message : "An error occurred fetching sector data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);
    
    return { sectors, loading, error };
}

const InteractiveBarChart = ({ volumeData, days }: { volumeData: number[], days: number[] }): ReactElement => {
    const [hovered, setHovered] = useState<number | null>(null);
    const maxQty = Math.max(...volumeData.map(Math.abs), 1);
    const chartHeight = 170;
    const barWidth = 16;
    const barGap = 7;
    const columnWidth = barWidth + barGap; 

    const TOOLTIP_WIDTH = 80;
    const TOOLTIP_HEIGHT = 38;

    if (volumeData.every(q => q === 0)) {
        return <p className="text-gray-500 text-base italic text-center w-full mt-8">No significant trading activity recorded.</p>;
    }
    const totalWidth = volumeData.length * columnWidth;

    return (
        <svg viewBox={`0 0 ${totalWidth + 20} ${chartHeight + 20}`} className="w-full h-full" style={{ overflow: 'visible' }}>
            
            <defs>
                <linearGradient id="buyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34D399" />
                    <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
                <linearGradient id="sellGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F87171" />
                    <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
            </defs>

            <g transform="translate(10, 10)"> 
                
                <line x1="0" y1={chartHeight / 2} x2={totalWidth} y2={chartHeight / 2} stroke="#CBD5E1" strokeWidth="1" />
                
                {volumeData.map((qty, index) => {
                    const height = (Math.abs(qty) / maxQty) * chartHeight * 0.42;
                    const x = index * columnWidth; // Use columnWidth for x start position
                    const barColor = qty > 0 ? "url(#buyGradient)" : "url(#sellGradient)";
                    const shadow = qty > 0 ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)";
                    const y = qty > 0 ? (chartHeight / 2 - height) : chartHeight / 2;

                    let tooltipX = x - TOOLTIP_WIDTH / 2 + barWidth / 2;
                    tooltipX = Math.max(10 - 10, Math.min(tooltipX, totalWidth - TOOLTIP_WIDTH - 10));

                    let tooltipY;
                    const Y_BUFFER = 15;

                    if (qty > 0) {
                        tooltipY = y - TOOLTIP_HEIGHT - Y_BUFFER; 
                        if (tooltipY < 5) tooltipY = y + height + Y_BUFFER; 
                    } else { 
                        tooltipY = y + height + Y_BUFFER; 
                        if (tooltipY + TOOLTIP_HEIGHT > chartHeight + 10) tooltipY = y - TOOLTIP_HEIGHT - Y_BUFFER;
                    }
                    
                    tooltipY = Math.max(5, Math.min(tooltipY, chartHeight - TOOLTIP_HEIGHT - 5));

                    return (
                        <g key={index}>
                            <rect 
                                x={x}
                                y={0}
                                width={columnWidth} 
                                height={chartHeight}
                                fill="transparent"
                                style={{ cursor: "pointer" }}
                                onMouseEnter={() => setHovered(index)}
                                onMouseLeave={() => setHovered(null)}
                            />

                            <AnimatePresence>
                                {hovered === index && (
                                    <foreignObject
                                        x={tooltipX}
                                        y={tooltipY}
                                        width={TOOLTIP_WIDTH}
                                        height={TOOLTIP_HEIGHT}
                                    >
                                        <motion.div 
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.8, opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="pointer-events-none rounded-md shadow-xl bg-white border border-gray-300 px-2 py-1.5 text-xs text-gray-900 font-medium"
                                            style={{ minWidth: "60px", textAlign: "center" }}
                                        >
                                            <span className="font-bold text-indigo-600">Day {days[index]}</span>
                                                <div className={qty>0?"text-green-400":"text-red-400"}>Net: {qty}</div>
                                        </motion.div>
                                    </foreignObject>
                                )}
                            </AnimatePresence>
                            
                            <motion.rect
                                initial={{ height: 1, y: chartHeight / 2 }}
                                animate={{ height, y }}
                                transition={{ duration: 0.5, type: "spring" }}
                                x={x}
                                width={barWidth}
                                height={height}
                                fill={barColor}
                                rx="3"
                                ry="3"
                                style={{ filter: `drop-shadow(0px 2px 4px ${shadow})`, pointerEvents: 'none' }}
                            />
                        </g>
                    );
                })}
            </g>
        </svg>
    );
};
const SectorTile = ({ sector, isExpanded, toggleExpand }: { sector: SectorMetrics, isExpanded: boolean, toggleExpand: (name: string) => void }) => {
    const isPositive = sector.totalChangePct >= 0;
    const changeColor = isPositive ? "text-green-600" : "text-red-600";
    const bgColor = isPositive ? "bg-green-50/50" : "bg-red-50/50";

    let volColor = 'text-blue-500';
    let volLabel = 'LOW';
    if (sector.volatilityIndex > 0.3) { volColor = 'text-red-600'; volLabel = 'EXTREME'; }
    else if (sector.volatilityIndex > 0.1) { volColor = 'text-amber-600'; volLabel = 'HIGH'; }
    else if (sector.volatilityIndex > 0.05) { volColor = 'text-orange-500'; volLabel = 'MEDIUM'; }

    const insights = SECTOR_INSIGHTS(sector.name, isPositive);
    const volumeData = sector.dailyNetVolume.map(d => d.netQty);
    const daysData = sector.dailyNetVolume.map(d => d.day);

    return (
        <div className={`border-2 border-gray-200 rounded-xl mb-3 overflow-hidden shadow-lg transition-all duration-300 ${isExpanded ? 'shadow-indigo-200/50' : 'hover:shadow-xl'}`}>
            
            <button
                onClick={() => toggleExpand(sector.name)}
                className={`w-full flex items-center p-5 transition-all duration-200 ${bgColor} ${isExpanded ? 'border-b border-gray-200' : 'hover:bg-gray-100'}`}
            >
                <div className="flex-1 grid grid-cols-4 items-center gap-6">
                    <div className="flex items-center gap-3 col-span-1">
                        <Tag className={`w-7 h-7 ${changeColor} flex-shrink-0`} />
                        <span className="font-extrabold text-xl text-gray-900 text-left">{sector.name}</span>
                    </div>

                    <div className="text-left">
                        <div className="text-xs text-gray-600 font-medium uppercase">Final Price</div>
                        <div className="font-bold text-xl">₹{sector.finalPrice.toFixed(2)}</div>
                    </div>

                    <div className={`text-left ${changeColor}`}>
                        <div className="text-xs text-gray-600 font-medium uppercase">Total Change</div>
                        <div className="font-bold text-xl flex items-center gap-1">
                            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {sector.totalChangePct > 0 ? "+" : ""}{sector.totalChangePct.toFixed(2)}%
                        </div>
                    </div>

                    <div className="text-left">
                        <div className="text-xs text-gray-600 font-medium uppercase">Volatility ({volLabel})</div>
                        <div className="font-bold text-xl flex items-center gap-1">
                            <Zap className={`w-4 h-4 ${volColor}`} />
                            {sector.volatilityIndex.toFixed(4)}
                        </div>
                    </div>
                </div>

                <span className="p-2 border border-gray-300 rounded-full text-gray-700 ml-4">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </span>
            </button>
            
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="bg-white p-6 space-y-8"
                    >
                        <div className="space-y-4">
                            <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 flex items-center gap-2">
                                <ArrowRight className="w-4 h-4 text-indigo-600"/> Sector Insights
                            </h4>
                            <blockquote className="border-l-4 border-indigo-500 pl-4 text-gray-700 italic text-base">
                                {insights.description}
                            </blockquote>
                            <div className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-200">
                                <span className={`font-semibold ${changeColor}`}>Simulation Summary:</span> {insights.performance}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-lg text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                                <BarChart className="w-5 h-5 text-indigo-600" />
                                Daily Net Trading Pressure (Buys vs. Sells)
                            </h4>
                            <div className="relative flex justify-center items-center h-[200px] w-full bg-gray-50 border border-gray-300 rounded-lg p-2">
                                <div className="text-xs text-green-600 absolute top-2 left-4 font-medium">Net Buys ↑</div>
                                <div className="text-xs text-red-600 absolute bottom-2 left-4 font-medium">Net Sells ↓</div>
                                <InteractiveBarChart volumeData={volumeData} days={daysData} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function SectorOverviewAccordion() {
    const { sectors, loading, error } = useSectorMetrics();
    const [expandedSector, setExpandedSector] = useState<string | null>(null);

    const toggleExpand = (name: string) => {
        setExpandedSector(expandedSector === name ? null : name);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48 bg-gray-50 rounded-xl shadow-md">
                <Loader2 className="animate-spin w-6 h-6 text-indigo-600 mr-2" />
                <p className="text-lg text-gray-700">Analyzing Sector Performance...</p>
            </div>
        );
    }
    if (error) {
        return (
            <div className="flex items-start p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-xl shadow-sm">
                <AlertTriangle className="w-5 h-5 mr-3 mt-1 flex-shrink-0" />
                <div>
                    <p className="text-base font-semibold">Data Load Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }
    if (sectors.length === 0) {
        return (
            <div className="p-6 bg-gray-100 rounded-xl text-gray-600 border border-gray-200">
                <Layers className="w-6 h-6 mr-2 inline text-gray-500" /> No market sectors were found in the simulation data.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {sectors.map(sector => (
                <SectorTile 
                    key={sector.name}
                    sector={sector}
                    isExpanded={expandedSector === sector.name}
                    toggleExpand={toggleExpand}
                />
            ))}
        </div>
    );
}