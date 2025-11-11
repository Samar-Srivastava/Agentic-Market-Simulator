import React from "react";
import ConfigForm from "../components/home/ConfigForm";
import GeneratePanel from "../components/home/GeneratePanel"; 
import { FileText, Activity, Cpu } from "lucide-react";

interface FeatureTagProps {
  icon: React.ElementType;
  label: string;
  className: string;
  iconClassName: string;
}

const FeatureTag: React.FC<FeatureTagProps> = ({ icon: Icon, label, className, iconClassName }) => (
  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${className}`}>
    <Icon className={`w-4 h-4 ${iconClassName}`} />
    <span className="font-medium">{label}</span>
  </div>
);

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-4 py-8">
      
      <header className="bg-white rounded-xl p-6 mb-8 shadow-xl shadow-indigo-100/50 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          
          <div className="flex-1">
            <h1 className="text-5xl font-extrabold text-gray-800 flex items-center gap-3">
              Agentic Market Simulator
            </h1>
            <p className="mt-7 text-gray-600 max-w-3xl">
              Simulate a multi-sector market populated by algorithmic agents (Rule based, heuristic, ML traders). Generate LLM-driven news, run scenarios and inspect agent behaviours, portfolio curves, and news impacts.
            </p>
            
            <div className="flex flex-wrap gap-2 mt-4">
              <FeatureTag 
                icon={FileText} 
                label="News-driven" 
                className="bg-blue-50 border border-blue-200 text-blue-800" 
                iconClassName="text-blue-600" 
              />
              <FeatureTag 
                icon={Cpu} 
                label="Adaptive AI Strategies" 
                className="bg-green-50 border border-green-200 text-green-800" 
                iconClassName="text-green-600" 
              />
              <FeatureTag 
                icon={Activity} 
                label="Multi-agent" 
                className="bg-purple-50 border border-purple-200 text-purple-800" 
                iconClassName="text-purple-600" 
              />
            </div>
          </div>
          
          <div className="flex flex-col items-start md:items-end gap-2 p-3 md:p-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6">
            
            <GeneratePanel /> 
          </div>
        </div>
      </header>

      <section className="mt-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800 border-b border-indigo-100 pb-2">
          Configuration Parameters
        </h2>
        <ConfigForm /> 
      </section>      
    </div>
  );
}