// src/components/market/NewsFeed.tsx 

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle, Newspaper, TrendingUp, TrendingDown, Clock } from "lucide-react"; 
import { getMarketData } from "../../api/index";
import { useConfigStore } from "../../hooks/useConfigStore"; 

type NewsItem = { Day: number; Sector: string; Headline: string; Sentiment: 'positive' | 'neutral' | 'negative'; PercentChange: number; };
type StructuredNews = { day: string; headlines: { text: string; sector: string; change: number; sentiment: 'positive' | 'neutral' | 'negative'; }[]; };


function useLiveNewsFeed() {
    const { hasData, lastRunIncludedNews } = useConfigStore(s => ({ 
        hasData: s.hasData, 
        lastRunIncludedNews: s.lastRunIncludedNews 
    }));

    const [structuredNews, setStructuredNews] = useState<StructuredNews[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newsDisabled, setNewsDisabled] = useState(false); 

    useEffect(() => {
        if (!hasData) {
            setLoading(false);
            setNewsDisabled(false); 
            return; 
        }

        if (hasData && !lastRunIncludedNews) {
            setNewsDisabled(true);
            setLoading(false);
            return; 
        }

        const fetchNews = async () => {
            setLoading(true);
            setError(null);
            setNewsDisabled(false);
            
            try {
                const rawNews: NewsItem[] = await getMarketData('news');

                if (!rawNews || rawNews.length === 0) {
                    throw new Error("News file is empty.");
                }
                
                const groupedNews = rawNews.reduce((acc, item) => {
                    const dayKey = `Day ${item.Day}`;
                    if (!acc[dayKey]) {
                        acc[dayKey] = { day: dayKey, headlines: [] };
                    }
                    acc[dayKey].headlines.push({
                        text: item.Headline, sector: item.Sector, change: item.PercentChange, sentiment: item.Sentiment
                    });
                    return acc;
                }, {} as Record<string, StructuredNews>);

                const finalStructuredNews: StructuredNews[] = Object.values(groupedNews);
                setStructuredNews([...finalStructuredNews, ...finalStructuredNews]);

            } catch (err) {
                console.error("News data fetch failed:", err);
                setError(err instanceof Error 
                    ? err.message 
                    : "An unknown error occurred fetching news data."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [hasData, lastRunIncludedNews]); 

    return { structuredNews, loading, error, newsDisabled };
}


export default function NewsFeed() {
    const { structuredNews: seamlessNewsData, loading, error, newsDisabled } = useLiveNewsFeed();
    
    const totalDays = seamlessNewsData.length / 2;
    const durationSeconds = Math.max(30, totalDays * 2);

    if (loading) {
        return (
            <div className="mt-8 bg-gray-50 rounded-xl shadow-md p-4 h-[800px] flex items-center justify-center">
                <Loader2 className="animate-spin w-6 h-6 text-indigo-600 mr-3" />
                <p className="text-gray-700">Fetching live news feed...</p>
            </div>
        );
    }
    
    if (newsDisabled) {
        return (
            <div className="mt-8 bg-white rounded-xl shadow-2xl p-6 h-[800px] flex flex-col items-center justify-center text-gray-500 border border-indigo-100">
                <Clock className="w-8 h-8 mb-3 text-indigo-400" />
                <p className="text-lg font-semibold">News Feed Disabled</p>
                <p className="text-sm text-center mt-1">
                    The latest simulation run was configured to skip LLM news generation.
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-8 bg-red-50 rounded-xl shadow-md p-4 h-[800px] flex flex-col items-center justify-center text-red-700 border border-red-300">
                <AlertTriangle className="w-8 h-8 mb-3" />
                <p className="text-lg font-semibold">News Feed Error</p>
                <p className="text-sm text-center">{error}</p>
            </div>
        );
    }

    return (
        <div className="mt-8 bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 h-[800px]"> 
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2 border-b pb-3">
                <Newspaper className="w-6 h-6 text-blue-600" />
                Live Market News Feed
            </h2>

            <div className="overflow-hidden h-[calc(100%-60px)]"> 
                <motion.div
                    className="space-y-4"
                    animate={{ y: ["0%", "-50%"] }} 
                    transition={{
                        duration: durationSeconds,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    whileHover={{ animationPlayState: "paused" }}
                >
                    {seamlessNewsData.map((day, i) => (
                        <div
                            key={`${day.day}-${i}`} 
                            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700"
                        >
                            <h3 className="font-semibold text-sm text-indigo-600 mb-2 border-b border-gray-200 pb-1">
                                {day.day}
                            </h3>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-2">
                                {day.headlines.map((headline, j) => {
                                    const isPositive = headline.change >= 0.01;
                                    const isNegative = headline.change <= -0.01;
                                    const changeColor = isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-gray-600";
                                    const ChangeIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : null;

                                    return (
                                        <li key={j} className="flex items-start gap-2">
                                            {/* SECTOR TAG */}
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold shrink-0">
                                                {headline.sector}
                                            </span>
                                            
                                            <span className="flex-1 text-gray-800 dark:text-gray-200">
                                                {headline.text}
                                            </span>
                                            
                                            {/* PERCENT CHANGE WITH COLOR/ICON */}
                                            <span className={`font-semibold text-xs shrink-0 flex items-center gap-1 ${changeColor}`}>
                                                {ChangeIcon && <ChangeIcon className="w-3 h-3" />}
                                                {headline.change > 0 ? "+" : ""}
                                                {headline.change.toFixed(2)}%
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}