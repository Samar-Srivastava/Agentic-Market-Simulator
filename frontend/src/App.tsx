import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import MarketPage from "./pages/MarketPage";
import AgentsPage from "./pages/AgentOverviewPage";
import AgentDetailsPage from "./pages/AgentDetailsPage"
import Navbar from "./components/common/Navbar";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar/>

      <main className="p-4 md:p-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/agents/:name" element={<AgentDetailsPage />} />
        </Routes>
      </main>
    </div>
  );
}
