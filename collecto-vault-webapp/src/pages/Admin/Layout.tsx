import React, { useState } from 'react';
import {
  LogOut,
  User,
  LayoutDashboard,
  Trophy,
  Coins, // Fixed: Now used in navItems for "Point Rules"
  Settings,
  Users,
  CreditCard,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

// Import local logo
// Ensure logo.png is in the same directory or update path
// import logoImg from './logo.png'; 

// Import Tab Components
import Dashboard from './Dashboard';
import PointRules from './PointRules'; 
import Tiers from './Tiers';
import PointPackages from './PointPackages';
import UsersManagement from './UsersPage';

// --- Type Definitions ---
type Tab = 'dashboard' | 'tiers' | 'rules' | 'packages' | 'users';

// --- Configuration ---
const THEME_GRADIENT = "linear-gradient(to right top, #18010e, #2b0a1f, #3f0b31, #530a46, #67095d, #880666, #aa056b, #cb0d6c, #ef4155, #ff743c, #ffa727, #f2d931)";

const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
  { id: 'tiers', label: 'Tier Levels', icon: <Trophy className="w-5 h-5" /> },
 { id: 'rules', label: 'Point Rules', icon: <Coins className="w-5 h-5" /> }, 
  { id: 'packages', label: 'Packages', icon: <CreditCard className="w-5 h-5" /> },
];

const TabContent: Record<Tab, React.FC> = {
  dashboard: Dashboard,
  users: UsersManagement,
  tiers: Tiers,
  rules: PointRules,
  packages: PointPackages,
};

// --- Sub-Components ---

interface NavItemProps {
  id: Tab;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: (id: Tab) => void;
}

const NavItem: React.FC<NavItemProps> = ({ id, label, icon, isActive, onClick }) => {
  // Styles for the dark gradient background (Glassmorphism)
  // Active: Semi-transparent white background with a bright yellow border accent
  const activeClasses = 'bg-white/20 text-white border-r-4 border-[#f2d931] shadow-inner backdrop-blur-sm';
  // Inactive: Lower opacity white, hover brightens it
  const inactiveClasses = 'text-white/60 hover:bg-white/10 hover:text-white border-r-4 border-transparent';

  return (
    <button
      onClick={() => onClick(id)}
      className={`
        flex items-center gap-3 p-4 w-full text-left transition-all duration-200 ease-in-out mb-1 rounded-l-lg
        ${isActive ? activeClasses : inactiveClasses}
      `}
    >
      {icon}
      <span className="font-medium tracking-wide">{label}</span>
    </button>
  );
};

// --- Main Component ---

export default function Layout() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const CurrentTabComponent = TabContent[activeTab];

  const handleViewProfile = () => {
    alert('Viewing Profile...');
    setIsProfileMenuOpen(false);
  };
  
  const handleLogout = () => {
    if(window.confirm("Are you sure you want to log out?")) {
        console.log("Logging out...");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      
      {/* Mobile Menu Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-72 z-50 transition-transform duration-300 ease-in-out shadow-2xl
          lg:translate-x-0 lg:static lg:shadow-xl
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ background: THEME_GRADIENT }}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Logo Area */}
          <div className="p-6 border-b border-white/10 flex justify-center items-center">
            {/* Logo Image */}
            <div className="bg-white/90 p-3 rounded-xl shadow-lg w-full flex justify-center backdrop-blur-sm">
                <img 
                    // src={"logo.png"} 
                    src="/logo.png"
                    alt="CollectoVault Logo" 
                    className="h-12 w-auto object-contain"
                />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
             <div className="text-xs font-black text-yellow-50 uppercase tracking-wider mb-4 px-4">
                Main Menu
             </div>
             {navItems.map((item) => (
                <NavItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  icon={item.icon}
                  isActive={activeTab === item.id}
                  onClick={(id) => {
                    setActiveTab(id);
                    setIsSidebarOpen(false);
                  }}
                />
              ))}
          </nav>

          {/* Sidebar Footer / Logout */}
          <div className="p-6 border-t border-white/10 bg-black/10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-left text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors group"
            >
              <LogOut className="w-5 h-5 group-hover:text-red-300 transition-colors" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Header/Top Bar */}
        <header 
            className="shadow-md z-30 px-6 py-4 flex justify-between items-center text-white"
            style={{ background: THEME_GRADIENT }}
        >
            <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                className="p-2 text-white/80 hover:bg-white/10 rounded-lg lg:hidden transition-colors"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>

                <h1 className="text-2xl font-bold tracking-tight capitalize drop-shadow-md">
                {navItems.find(item => item.id === activeTab)?.label}
                </h1>
            </div>

            {/* Profile Section */}
            <div className="relative">
                <button
                    className="flex items-center gap-3 p-2 rounded-full hover:bg-white/10 transition-colors border border-white/20"
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                >
                    <div className="w-9 h-9 rounded-full bg-white text-[#aa056b] flex items-center justify-center font-bold text-sm shadow-sm">
                        TM
                    </div>
                    <div className="hidden sm:block text-right">
                        <p className="text-sm font-semibold leading-none">Samson Kwiz</p>
                        <p className="text-[10px] text-white/70 mt-1 uppercase tracking-wide">Administrator</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-white/70 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsProfileMenuOpen(false)} />
                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl py-2 z-20 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 border-b border-gray-100 mb-1">
                                <p className="text-sm font-semibold text-gray-900">Tukas M</p>
                                <p className="text-xs text-gray-500">admin@company.com</p>
                            </div>
                            <a
                                href="#"
                                onClick={handleViewProfile}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <User className="w-4 h-4 text-gray-400" /> View Profile
                            </a>
                            <a
                                href="#"
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Settings className="w-4 h-4 text-gray-400" /> Settings
                            </a>
                            <div className="h-px bg-gray-100 my-1" />
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-4 h-4" /> Logout
                            </button>
                        </div>
                    </>
                )}
            </div>
        </header>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 md:p-8 relative">
          {/* Decorative background circle to tie content to theme */}
          <div className="absolute top-0 left-0 w-full h-64 bg-linear-to-b from-gray-200 to-transparent pointer-events-none -z-10" />
          
           <div className="w-full">
             <CurrentTabComponent />
           </div>
        </div>

      </main>
    </div>
  );
}