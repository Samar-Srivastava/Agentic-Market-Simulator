// src/pages/MarketPage.tsx

import { Card } from "@/components/ui/card";
import { AlertTriangle, Home, LayoutDashboard } from "lucide-react"; 
import { useConfigStore } from "../hooks/useConfigStore"; 

import MarketOverview from "../components/market/MarketOverview";
import StockPerformanceChart from "../components/market/StockPerformanceChart";
import SectorOverviewAccordion from "../components/market/SectorOverviewAccordion";
import NewsFeed from "../components/market/NewsFeed";

export default function MarketPage() {
    const hasData = useConfigStore(s => s.hasData);
    
    if (!hasData) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="p-12 bg-white border-4 border-dashed border-indigo-200 rounded-3xl shadow-2xl text-center max-w-lg transform transition-all duration-300 hover:shadow-indigo-300/50 -mt-36">
                    <AlertTriangle className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-pulse" />
                    <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
                        Simulation Required
                    </h1>
                    <p className="text-lg text-gray-600 mb-6">
                        This dashboard requires market data. Please initiate a simulation run from the Home Page to view results.
                    </p>
                    
                    <a 
                    href="/" 
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-md text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150 ease-in-out"
                    >
                    <Home className="w-5 h-5 mr-2" />
                    Go to Home Page
                    </a>
                </div>
            </div>
        );
    }
    
    return (
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white/90 min-h-screen">
            
            <header className="mb-8 border-b border-gray-200 pb-4 flex items-center gap-3">
                <LayoutDashboard className="w-7 h-7 text-indigo-600" />
                <h1 className="text-3xl font-extrabold text-gray-800">
                    Live Market Dashboard
                </h1>
                <span className="ml-4 text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    Active Run
                </span>
            </header>

            <div className="grid gap-8 md:grid-cols-3">
                
                <div className="md:col-span-2 space-y-8">
                    
                    <Card className="p-6 shadow-lg hover:shadow-5xl transition-shadow duration-300">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700">Market Overview</h2>
                        <MarketOverview />
                    </Card>
                    
                    <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700">Stock Performance Chart</h2>
                        <StockPerformanceChart />
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card className="p-6 shadow-lg h-full min-h-[400px] hover:shadow-xl transition-shadow duration-300">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700">LLM News Feed</h2>
                        <NewsFeed />
                    </Card>
                </div>

                <div className="md:col-span-3">
                    <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700">Sector Performance Detail</h2>
                        <SectorOverviewAccordion />
                    </Card>
                </div>
            </div>
        </div>
    );
}