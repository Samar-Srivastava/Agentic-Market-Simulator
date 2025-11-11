import { Link } from "react-router-dom"
import stockIcon from '../../assets/stock.png'

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center px-6 md:px-10 py-4 bg-white/95 backdrop-blur-sm shadow-lg shadow-indigo-100/50 sticky top-0 z-10 border-b border-indigo-100">
      
      <div className="flex items-center space-x-2">
            <img 
            src={stockIcon} 
            alt="Stock Icon" 
            className="w-8 h-8" 
        />
        <h1 className="text-2xl font-extrabold text-indigo-700 tracking-tight">
            Agentic Market Simulator
        </h1>
      </div>
      
      <div className="space-x-8">
        <Link 
          to="/" 
          className="text-lg font-medium text-gray-600 hover:text-indigo-600 transition-all duration-200 hover:border-b-2 hover:border-indigo-600 py-1"
        >
          Home
        </Link>
        <Link 
          to="/market" 
          className="text-lg font-medium text-gray-600 hover:text-indigo-600 transition-all duration-200 hover:border-b-2 hover:border-indigo-600 py-1"
        >
          Market
        </Link>
        <Link 
          to="/agents" 
          className="text-lg font-medium text-gray-600 hover:text-indigo-600 transition-all duration-200 hover:border-b-2 hover:border-indigo-600 py-1"
        >
          Agents
        </Link>
      </div>
    </nav>
  )
}

export default Navbar