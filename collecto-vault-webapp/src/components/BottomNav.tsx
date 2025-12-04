// BottomNav.tsx
import { NavLink } from "react-router-dom";

// Define the expected prop type for the click handler
interface BottomNavProps {
  onBuyPointsClick: () => void;
}

// NOTE: You will need to install an icon library (e.g., react-icons, heroicons)
// Here, we use simple text placeholders for icons.

export default function BottomNav({ onBuyPointsClick }: BottomNavProps) {
  // Use a strong, defined color for the active state
  const activeColor = 'text-blue-600'; 
  const inactiveColor = 'text-gray-500 hover:text-blue-500';

  const itemClass = (isActive: boolean) =>
    `flex flex-col items-center justify-center flex-1 py-2 transition-colors duration-200 ${
      isActive ? activeColor : inactiveColor
    }`;

  const iconClass = "w-6 h-6 mb-1"; // Class for a standard icon size

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-xl flex h-16">
      
      {/* 1. Home Link */}
      <NavLink to="/dashboard" className={({ isActive }) => itemClass(isActive)}>
        {/* Replace with your Home Icon */}
        <div className={iconClass}>🏠</div> 
        <div className="text-xs">Home</div>
      </NavLink>
      
      {/* 2. Buy-Points (Trigger Popup/Page) */}
      {/* Changed to <div> and added onClick handler */}
      <div 
        onClick={onBuyPointsClick} 
        className={`flex flex-col items-center justify-center flex-1 py-2 cursor-pointer transition-colors duration-200 ${inactiveColor}`}
      >
        {/* Replace with your Buy Points Icon */}
        <div className={iconClass}>💰</div> 
        <div className="text-xs">Buy-Points</div>
      </div>
      
      {/* 3. Transactions Link */}
      <NavLink to="/statement" className={({ isActive }) => itemClass(isActive)}>
        {/* Replace with your Transactions Icon */}
        <div className={iconClass}>📜</div> 
        <div className="text-xs">Transactions</div>
      </NavLink>
      
      {/* 4. CollectoVault Link (Non-active example) */}
      <a className={itemClass(false)} href="#"> 
        {/* Replace with your CollectoVault Icon */}
        <div className={iconClass}>📦</div> 
        <div className="text-xs">CollectoVault</div>
      </a>
      
    </nav>
  );
}