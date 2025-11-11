// File: src/components/home/GeneratePanel.tsx

import { useState, useEffect } from "react";
import { Play, Loader2, Check } from "lucide-react";
import { 
    useConfigStore,
    type SimulationStatusType 
} from "../../hooks/useConfigStore";
import { 
    runSimulation, 
    getStatus, 
    type RunConfig,
    type RunResponse,
    type SimulationStatus,
} from "../../api/index";

// --- Type Definitions ---
type StatusSummary = { message: string, phase: string } | null;

const POLLING_INTERVAL = 2000; 

export default function GeneratePanel() {
    const { 
        numDays: cfgNumDays, 
        initialPrices: cfgInitialPrices, 
        agents: cfgAgents, 
        volatility: cfgVolatility, 
        newsEnabled: cfgNewsEnabled, 
        simStatus: globalSimStatus,        
        setSimStatus: setGlobalSimStatus, 
    } = useConfigStore((s) => ({
        numDays: s.numDays,
        initialPrices: s.initialPrices,
        agents: s.agents,
        volatility: s.volatility,
        newsEnabled: s.newsEnabled, 
        simStatus: s.simStatus,
        setSimStatus: s.setSimStatus
    }));

    const cfg: RunConfig = {
        numDays: cfgNumDays,
        initialPrices: cfgInitialPrices,
        agents: cfgAgents,
        volatility: cfgVolatility,
        newsEnabled: cfgNewsEnabled,
    };
    
    const [running, setRunning] = useState(false); 
    const [summary, setSummary] = useState<StatusSummary>(null);
    const [error, setError] = useState<string | null>(null);
    
    const isRunningOrPolling = globalSimStatus === 'RUNNING';
    const isCompleted = globalSimStatus === 'COMPLETE';
    const displayStatus = globalSimStatus;


    useEffect(() => {
        if (globalSimStatus !== 'RUNNING') return; 

        const checkStatus = async () => {
            try {
                const statusData: SimulationStatus = await getStatus();
                const { status: backendStatus, day, total_days, error: backendError } = statusData;

                let newStatus: SimulationStatusType = 'RUNNING'; 
                
                if (backendStatus === "COMPLETE") {
                    newStatus = 'COMPLETE';
                } else if (backendStatus === "FAILED") {
                    newStatus = 'FAILED';
                } else if (backendStatus === "IDLE") {
                    newStatus = 'IDLE'; 
                }

                if (backendStatus !== "IDLE") {
                    
                    const newsGenerated = newStatus === 'COMPLETE' ? cfg.newsEnabled : undefined;

                    setGlobalSimStatus(newStatus, day, newsGenerated); 
                    
                    if (newStatus === 'COMPLETE') {
                        setSummary(null); 
                    } else if (newStatus === 'FAILED') {
                        const failMessage = backendError || `Simulation job failed on the server.`;
                        setError(failMessage);
                        setSummary(null);
                    } else {
                        const currentDay = Math.min(day, total_days);
                        setSummary({
                            message: `Day ${currentDay} of ${total_days}.`,
                            phase: backendStatus.replace(/_/g, ' ') 
                        });
                    }
                }

            } catch (err) {
                console.error("Polling API Error:", err);
                setError("Error checking simulation status. Polling stopped.");
                setGlobalSimStatus('FAILED'); 
            }
        };

        const intervalId = setInterval(checkStatus, POLLING_INTERVAL);
        return () => clearInterval(intervalId);
    }, [globalSimStatus, setGlobalSimStatus, cfg.newsEnabled]); 


    async function handleGenerate() {
        setRunning(true);
        setError(null);
        setSummary(null);
        setGlobalSimStatus('RUNNING', 0); 

        try {
            const payload = { ...cfg }; 
            const data: RunResponse = await runSimulation(payload);

            if (data.state.status !== "FAILED") { 
                setSummary({ 
                    message: data.message || "Simulation job successfully started.", 
                    phase: data.state.status 
                });
            } else {
                setError(data.message || "Simulation failed to start.");
                setGlobalSimStatus('FAILED');
            }
        } catch (err) {
            console.error("Simulation API Error:", err);
            const msg = err instanceof Error ? err.message : "An unexpected network or runtime error occurred.";
            setError(`Failed to initiate simulation: ${msg}`);
            setGlobalSimStatus('FAILED');
        } finally {
            setRunning(false);
        }
    }

    return (
        <div className="mt-6 flex items-center gap-4">
            <button
                onClick={handleGenerate}
                disabled={isRunningOrPolling || isCompleted} 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg shadow hover:scale-[1.02] transition-transform duration-150 disabled:opacity-60"
            >
                {(displayStatus === 'RUNNING' || running) ? <Loader2 className="animate-spin w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span className="font-semibold">
                    {running ? "Starting..." : displayStatus === 'RUNNING' ? "Running..." : isCompleted ? "Generate New" : "Generate Simulation"}
                </span>
            </button>

            <div className="text-sm flex-1">
                {summary && displayStatus === 'RUNNING' && (
                    <div className={`flex items-center gap-2 text-sm text-blue-700 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-md`}>
                        <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                        <div>
                            <div className="font-medium">{summary.phase.toUpperCase().replace(/_/g, ' ')}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                {summary.message}
                            </div>
                        </div>
                    </div>
                )}
                
                {displayStatus === 'COMPLETE' && (
                    <div className={`flex items-center gap-2 text-sm text-green-700 bg-green-50 dark:bg-green-900/30 p-2 rounded-md`}>
                        <Check className="w-4 h-4 shrink-0" />
                        <div className="font-medium">Simulation Completed!</div>
                    </div>
                )}

                {error && displayStatus === 'FAILED' && (
                    <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 p-2 rounded-md mt-1">
                        **ERROR**: {error}
                    </div>
                )}
            </div>
        </div>
    );
}