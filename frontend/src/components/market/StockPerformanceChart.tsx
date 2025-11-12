// src/components/market/StockPerformanceChart.tsx 

import { useState, useEffect, useMemo } from "react";
// @ts-ignore
import Plot from "react-plotly.js";
import { Loader2, AlertTriangle, Scale, Percent } from "lucide-react"; 
import { getMarketData, type MarketPriceData } from "../../api/index"; 

type PlotlyTrace = {
    x: (number | string)[];
    y: (number | string)[];
    type: 'scatter';
    mode: 'lines';
    name: string;
    line: { color: string, width: number };
    hoverinfo: 'x+y+name' | 'x+y' | 'name' | 'none';
};

function usePriceHistory() {
    const [rawTraces, setRawTraces] = useState<PlotlyTrace[]>([]);
    const [percentTraces, setPercentTraces] = useState<PlotlyTrace[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPrices = async () => {
            setLoading(true);
            setError(null);
            try {
                const priceHistory: MarketPriceData = await getMarketData('market_prices');

                if (!priceHistory || priceHistory.length < 2) {
                    throw new Error("No market price data available. Run a simulation first.");
                }
                
                const firstDay = priceHistory[0];
                const sectorKeys = Object.keys(firstDay).filter(key => key !== 'Day');
                
                const newRawTraces: PlotlyTrace[] = [];
                const newPercentTraces: PlotlyTrace[] = [];

                sectorKeys.forEach((sector, index) => {
                    const color = `hsl(${(index * 50) % 360}, 70%, 50%)`;
                    const prices = priceHistory.map(dayData => dayData[sector] as number);
                    const days = priceHistory.map(dayData => dayData.Day);
                    const initialPrice = prices[0];

                    newRawTraces.push({
                        x: days,
                        y: prices,
                        type: "scatter",
                        mode: "lines",
                        name: sector,
                        line: { color: color, width: 2 },
                        hoverinfo: "x+y+name",
                    } as PlotlyTrace);

                    const percentChange = prices.map(price => 
                        ((price - initialPrice) / initialPrice) * 100
                    );

                    newPercentTraces.push({
                        x: days,
                        y: percentChange,
                        type: "scatter",
                        mode: "lines",
                        name: sector,
                        line: { color: color, width: 2 },
                        hoverinfo: "x+y+name",
                    } as PlotlyTrace);
                });

                setRawTraces(newRawTraces);
                setPercentTraces(newPercentTraces);

            } catch (err) {
                console.error("Chart data fetch failed:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred fetching price data.");
            } finally {
                setLoading(false);
            }
        };

        fetchPrices();
    }, []);

    return { rawTraces, percentTraces, loading, error };
}


export default function StockPerformanceChart() {
    const { rawTraces, percentTraces, loading, error } = usePriceHistory();
    const [chartType, setChartType] = useState<'raw' | 'percent'>('raw'); 

    const { data, layoutTitle, yAxisTitle } = useMemo(() => {
        const data = chartType === 'raw' ? rawTraces : percentTraces;
        const layoutTitle = chartType === 'raw' ? "Sector Price History (Raw Value)" : "Sector Performance (Total Return)";
        const yAxisTitle = chartType === 'raw' ? "Price ($)" : "Total Return (%)";
        return { data, layoutTitle, yAxisTitle };
    }, [chartType, rawTraces, percentTraces]);


    if (loading) {
        return (
            <div className="flex justify-center items-center h-96 bg-gray-50 rounded-2xl shadow-md">
                <Loader2 className="animate-spin w-8 h-8 text-indigo-600 mr-3" />
                <p className="text-xl text-gray-700">Loading price history...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96 p-6 bg-red-50 border border-red-300 text-red-700 rounded-2xl shadow-md">
                <AlertTriangle className="w-8 h-8 mb-3" />
                <p className="text-lg font-semibold mb-2">Data Error</p>
                <p className="text-sm text-center max-w-lg">{error}</p>
            </div>
        );
    }

    if (data.length === 0 && !loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 p-6 bg-gray-50 rounded-2xl shadow-md">
                <AlertTriangle className="w-8 h-8 mb-3 text-gray-400" />
                <p className="text-lg font-semibold mb-2 text-gray-600">No Data Available</p>
                <p className="text-sm text-center max-w-lg text-gray-500">
                    Run a simulation to generate market price history.
                </p>
            </div>
        );
    }


    return (
        <div className="mt-6 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800">
            
            <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    {layoutTitle}
                </h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setChartType('raw')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
                            chartType === 'raw' 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <Scale className="w-4 h-4" /> Raw Price
                    </button>
                    <button
                        onClick={() => setChartType('percent')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
                            chartType === 'percent' 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <Percent className="w-4 h-4" /> Total Return
                    </button>
                </div>
            </div>
            
            <Plot
                data={data}
                layout={{
                    autosize: true,
                    height: 400,
                    margin: { t: 20, b: 50, l: 60, r: 20 },
                    xaxis: { title: {text:"Day"}, showgrid: true }, 
                    yaxis: { title:{text: yAxisTitle}, showgrid: true, fixedrange: false }, 
                    legend: { orientation: "h", y: -0.2, x: 0.5, xanchor: 'center' },
                    paper_bgcolor: "transparent",
                    plot_bgcolor: "transparent",
                    font: { color: "#374151" },
                    hovermode: 'x unified', 
                }}
                config={{
                    responsive: true,
                    displayModeBar: false,
                }}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler
            />
        </div>
    );
}