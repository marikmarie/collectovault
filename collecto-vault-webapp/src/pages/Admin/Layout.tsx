import React, { useState, useEffect } from 'react';
import {
  LogOut,
  User,
  LayoutDashboard,
  Trophy,
  Coins,
  Settings,
  Users,
  CreditCard,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

import { useTheme } from '../../theme/ThemeProvider';

// Import Tab Components
import Dashboard from './Dashboard';
import PointRules from './PointRules'; 
import Tiers from './Tiers';
import PointPackages from './PointPackages';
import UsersManagement from './UsersPage';

// --- Type Definitions ---
type Tab = 'dashboard' | 'tiers' | 'rules' | 'packages' | 'users';

interface UserData {
  clientId: string | null;
  collectoId: string | null;
  name: string;
  initials: string;
}

// --- Configuration ---

const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'rules', label: 'Point Rules', icon: <Coins className="w-5 h-5" /> }, 
  { id: 'packages', label: 'Packages', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'tiers', label: 'Tier Levels', icon: <Trophy className="w-5 h-5" /> },
  { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
];

const TabContent: Record<Tab, React.FC> = {
  dashboard: Dashboard,
  rules: PointRules,
  packages: PointPackages,
  tiers: Tiers,
  users: UsersManagement,
};

// --- Main Layout Component ---

export default function Layout() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const [user, setUser] = useState<UserData>({
    clientId: null,
    collectoId: null,
    name: 'Loading...',
    initials: 'AD'
  });

  useEffect(() => {
    // 1. Fetch individual keys from localStorage as set by authService
    const storedName = localStorage.getItem("userName");
    const storedCollectoId = localStorage.getItem("collectoId");
    const storedClientId = localStorage.getItem("clientId");

    if (storedName) {
      // 2. Generate Initials logic
      const nameParts = storedName.trim().split(' ');
      const initials = nameParts.length > 1 
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
        : storedName.substring(0, 2).toUpperCase();

      setUser({
        name: storedName,
        collectoId: storedCollectoId,
        clientId: storedClientId,
        initials: initials
      });
    }
  }, []);

  const handleLogout = () => {
    if(window.confirm("Are you sure you want to log out?")) {
        // Clear the specific keys used by your authService
        localStorage.removeItem("clientId");
        localStorage.removeItem("collectoId");
        localStorage.removeItem("userName");
        localStorage.removeItem("vaultOTPToken"); // Clear token if exists
        window.location.href = '/login';
    }
  };

  const CurrentTabComponent = TabContent[activeTab];

  const { theme } = useTheme();

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
        style={{ background: 'var(--header-gradient)' }}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10 flex justify-center items-center">
            <div className="bg-white/90 p-3 rounded-xl shadow-lg w-full flex justify-center backdrop-blur-sm">
              <img src={theme.logoUrl ?? "/logo.png"} alt="Logo" className="h-12 w-auto object-contain" />
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
             <div className="text-xs font-black text-yellow-50 uppercase tracking-wider mb-4 px-4">
                Main Menu
             </div>
             {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                  className={`flex items-center gap-3 p-4 w-full text-left transition-all mb-1 rounded-l-lg ${
                    activeTab === item.id 
                    ? 'bg-white/20 text-white border-r-4 border-[#f2d931] shadow-inner' 
                    : 'text-white/60 hover:bg-white/10 hover:text-white border-r-4 border-transparent'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
          </nav>

          <div className="p-6 border-t border-white/10 bg-black/10">
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-white/70 hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="shadow-md z-30 px-6 py-4 flex justify-between items-center text-white" style={{ background: 'var(--header-gradient)' }}>
            <div className="flex items-center gap-4">
                <button className="p-2 lg:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    {isSidebarOpen ? <X /> : <Menu />}
                </button>
                <h1 className="text-2xl font-bold capitalize">{activeTab}</h1>
            </div>

            {/* Profile Section */}
            <div className="relative">
                <button
                    className="flex items-center gap-3 p-2 rounded-full hover:bg-white/10 border border-white/20"
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                >
                    <div className="w-9 h-9 rounded-full bg-white text-[#aa056b] flex items-center justify-center font-bold text-sm">
                        {user.initials}
                    </div>
                    <div className="hidden sm:block text-right">
                        <p className="text-sm font-semibold leading-none">{user.name}</p>
                        <p className="text-[10px] text-white/70 mt-1 uppercase">Administrator</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsProfileMenuOpen(false)} />
                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl py-2 z-20 border border-gray-100 text-gray-800">
                            <div className="px-4 py-3 border-b border-gray-100 mb-1">
                                <p className="text-sm font-semibold">{user.name}</p>
                                <p className="text-[10px] text-gray-500">Collecto ID: {user.collectoId}</p>
                            </div>
                            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"><User className="w-4 h-4" /> Profile</button>
                            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"><Settings className="w-4 h-4" /> Settings</button>
                            <div className="h-px bg-gray-100 my-1" />
                            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                <LogOut className="w-4 h-4" /> Logout
                            </button>
                        </div>
                    </>
                )}
            </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-8">
           <CurrentTabComponent />
        </div>
      </main>
    </div>
  );
}