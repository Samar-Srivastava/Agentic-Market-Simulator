// src/components/home/ConfigForm.tsx 

import { useConfigStore } from "../../hooks/useConfigStore";
import { CheckSquare, Square, Settings, Minus, Plus, Zap } from "lucide-react"; 

const AgentList = [
    "AggressiveAgent",
    "ConservativeAgent",
    "ContrarianAgent",
    "GeneticTraderAgent", 
    "HerdFollowerAgent",
    "LongTermInvestorAgent", 
    "LSTMTraderAgent", 
    "MomentumAgent",
    "NewsFollowerAgent",
    "PanicTraderAgent",
    "PpoTraderAgent", 
    "RandomAgent",
    "RlTraderAgent", 
    "ShortTermInvestorAgent", 
    "ValueAgent",
    "RelativeStrengthAgent",
];



function DaySelector() {
    const { numDays, setConfig } = useConfigStore();
    const commonDays = [15, 30, 45, 90];
    const maxDays = 365;

    const setDaysValue = (value: number) => {
        const validatedValue = Math.max(1, Math.min(Math.round(value), maxDays));
        setConfig({ numDays: validatedValue }); 
    };

    return (
        <div>
            <span className="text-sm text-gray-600 block mb-1">Number of days (Max: {maxDays})</span>
            <div className="flex items-center gap-3">
                
                <div className="flex-1 flex border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                    <button
                        onClick={() => setDaysValue(numDays - 1)}
                        className="p-3 border-r border-gray-300 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                        disabled={numDays <= 1}
                    >
                        <Minus className="w-4 h-4 text-gray-700" />
                    </button>
                    <input
                        type="number"
                        min={1}
                        max={maxDays}
                        value={numDays}
                        onChange={(e) => setDaysValue(Number(e.target.value))}
                        className="w-full text-center border-none p-3 font-semibold text-lg text-gray-800 focus:ring-0"
                        style={{ MozAppearance: 'textfield', WebkitAppearance: 'none', appearance: 'none' }}
                    />
                    <button
                        onClick={() => setDaysValue(numDays + 1)}
                        className="p-3 border-l border-gray-300 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                        disabled={numDays >= maxDays}
                    >
                        <Plus className="w-4 h-4 text-gray-700" />
                    </button>
                </div>

                <div className="flex space-x-1.5">
                    {commonDays.map((d) => (
                        <button
                            key={d}
                            onClick={() => setDaysValue(d)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm ${
                                numDays === d
                                    ? "bg-indigo-600 text-white"
                                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                            }`}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}


export default function ConfigForm() {
    const { 
        numDays, initialPrices, agents, volatility, newsEnabled, 
        setConfig, reset: resetStore 
    } = useConfigStore();

    function toggleAgent(name: string) {
        const newAgents = agents.includes(name) 
            ? agents.filter((x) => x !== name) 
            : [...agents, name];
        setConfig({ agents: newAgents }); 
    }

    function updatePrice(sector: string, v: string) {
        const num = parseFloat(v);
        if (!Number.isNaN(num) && num >= 0) { 
            setConfig({ initialPrices: { ...initialPrices, [sector]: Number(num) } });
        } else if (v === "") {
            setConfig({ initialPrices: { ...initialPrices, [sector]: 0 } });
        }
    }

    function handleReset() {
        resetStore();
    }
    
    const volLevel = volatility;
    let volText = 'Low';
    let volColor = 'text-green-500';
    if (volLevel >= 1.5) { volText = 'Medium'; volColor = 'text-yellow-500'; }
    if (volLevel >= 3.0) { volText = 'High'; volColor = 'text-red-500'; }


    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-2xl p-6 space-y-6">
                
                <div className="flex items-center gap-2 border-b pb-3">
                    <Settings className="w-6 h-6 text-indigo-600" />
                    <h3 className="text-xl font-bold text-gray-800">Simulation Parameters</h3>
                </div>

                <div className="space-y-6">
                    
                    <DaySelector />
                    
                    <div>
                        <span className="text-sm text-gray-600 font-semibold block mb-2">Sector Initial Prices</span>
                        <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg border">
                            {Object.keys(initialPrices).map((s) => (
                                <div key={s} className="flex items-center gap-2">
                                    <span className="w-20 text-sm font-medium text-gray-700">{s}</span>
                                    <input
                                        type="number"
                                        min={0}
                                        step={0.1}
                                        // Live read from the store
                                        value={initialPrices[s] || ""} 
                                        onChange={(e) => updatePrice(s, e.target.value)}
                                        className="rounded-md border-gray-300 flex-1 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600 font-semibold">Volatility</span>
                            <div className={`font-bold text-sm ${volColor} flex items-center gap-1`}>
                                <Zap className="w-4 h-4" />
                                <span>{volText}: **{volLevel.toFixed(1)}**</span>
                            </div>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={5}
                            step={0.1}
                            value={volatility}
                            onChange={(e) => setConfig({ volatility: Number(e.target.value) })}
                            className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer range-lg"
                        />
                    </div>

                    <label className="flex items-center gap-3 select-none p-2 bg-indigo-50 rounded-lg border border-indigo-200 transition-colors hover:bg-indigo-100">
                        <input
                            type="checkbox"
                            checked={newsEnabled}
                            // Live update the store directly
                            onChange={(e) => setConfig({ newsEnabled: e.target.checked })}
                            className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-md font-medium text-indigo-800">Enable LLM News Generation</span>
                    </label>
                    
                    <div>
                        <span className="text-sm text-gray-600 font-semibold block mb-2">Select Agents ({agents.length} Active)</span>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-3 rounded-lg bg-gray-50">
                            {AgentList.map((a) => {
                                const active = agents.includes(a);
                                const displayName = a.replace('Agent', '').replace('Trader', '');

                                return (
                                    <button
                                        key={a}
                                        onClick={() => toggleAgent(a)}
                                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                                            active
                                                ? "bg-blue-600 text-white shadow-md transform scale-[1.01]"
                                                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                                        }`}
                                    >
                                        <span className="truncate">{displayName}</span>
                                        {active ? (
                                            <CheckSquare className="w-4 h-4 shrink-0" />
                                        ) : (
                                            <Square className="w-4 h-4 shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t mt-4">
                        <button
                            onClick={handleReset}
                            className="px-6 py-2 rounded-lg border border-gray-400 text-md text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                        >
                            Reset to Default
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-2xl p-6">
                <h4 className="text-xl font-bold mb-4 text-gray-800">Live Preview</h4>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <PreviewCard title="Days" value={numDays} />
                        <PreviewCard title="Volatility" value={volatility.toFixed(1)} />
                        <PreviewCard title="News" value={newsEnabled ? "Enabled" : "Disabled"} color={newsEnabled ? "green" : "red"} />
                    </div>

                    <div>
                        <h5 className="text-sm font-semibold mb-2 text-gray-700">Initial Prices</h5>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(initialPrices).map(([k, v]) => (
                                <div key={k} className="px-3 py-1 bg-indigo-50 rounded-md text-sm">
                                    <div className="text-xs text-indigo-500">{k}</div>
                                    <div className="font-semibold text-indigo-800">₹{v.toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h5 className="text-sm font-semibold mb-2 text-gray-700">Active Agents ({agents.length})</h5>
                        <div className="text-xs text-gray-600 max-h-40 overflow-y-auto p-2 border rounded-md bg-gray-50">
                            {agents.length > 0 ? agents.map(a => a.replace('Agent', '').replace('Trader', '')).join(" / ") : "No agents selected."}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const PreviewCard = ({ title, value, color = 'indigo' }: { title: string, value: string | number, color?: string }) => (
    <div className={`p-4 rounded-lg bg-${color}-50 border border-${color}-200`}>
        <div className={`text-xs font-medium text-${color}-600`}>{title}</div>
        <div className={`text-xl font-bold text-${color}-800 mt-1`}>{value}</div>
    </div>
);