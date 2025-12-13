import React from 'react';
import { 
    Home, 
    Users, 
    TrendingUp, 
    DollarSign, 
    BarChart3, 
    Settings, 
    Trophy, 
    Coins,
    UserCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom'; // Assuming you use React Router DOM for navigation

// Define the custom gradient (for background or key elements)
const CUSTOM_GRADIENT = 'linear-gradient(to right top, #18010e, #2b0a1f, #3f0b31, #530a46, #67095d, #880666, #aa056b, #cb0d6c, #ef4155, #ff743c, #ffa727, #f2d931)';

// Define key colors from the gradient for consistency
const PRIMARY_COLOR = '#ff743c'; // Mid-orange/red for highlights
const SECONDARY_COLOR = '#67095d'; // Deep purple for backgrounds/accents
const TEXT_COLOR = '#f2d931'; // Light yellow for key text

// Navigation Links Data Structure
const adminPages = [
    { name: 'Reports', path: '/reports', icon: BarChart3, description: 'View and export system reports.' },
    { name: 'Point Rules', path: '/point-rules', icon: Settings, description: 'Set conversion rates and fixed rewards.' },
    { name: 'Tier Levels', path: '/tiers', icon: Trophy, description: 'Manage tier hierarchy and multipliers.' },
    { name: 'Packages', path: '/packages', icon: Coins, description: 'Edit point purchase bundles.' },
    { name: 'User Management', path: '/users', icon: UserCircle, description: 'Search, suspend, and modify user accounts.' },
];

export default function Dashboard() {
  return (
    // Applying the custom gradient as the main background
    <div className="p-8 space-y-10 min-h-screen text-gray-100" style={{ background: CUSTOM_GRADIENT }}>
      
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-700/50">
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: TEXT_COLOR }}>
              Admin Control Panel
          </h1>
          <p className="text-sm font-medium text-gray-300">Welcome, Administrator</p>
      </div>

      {/* Stats Grid */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-200">System Metrics Snapshot</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Users" value="8,450" icon={<Users />} trend="+12% last month" />
          <StatCard title="Active Points" value="5.2M" icon={<DollarSign />} trend="-5% redemption rate" />
          <StatCard title="Avg Tier Level" value="Silver (1.8)" icon={<TrendingUp />} trend="Stable" />
          <StatCard title="Tier Upgrades" value="230" icon={<Trophy />} trend="+25% this week" />
        </div>
      </section>

      {/* Navigation Cards Section */}
      <section className="pt-4 space-y-4">
        <h2 className="text-2xl font-semibold text-gray-200">Quick Navigation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminPages.map((page) => (
                <NavCard 
                    key={page.path}
                    name={page.name}
                    path={page.path}
                    icon={page.icon}
                    description={page.description}
                />
            ))}
        </div>
      </section>

    </div>
  );
}

// --- Sub-Components (Styled with new colors) ---

// 1. Stat Card
const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; trend: string }> = ({ title, value, icon, trend }) => (
    <div className="p-6 rounded-xl shadow-xl transition-all" style={{ backgroundColor: SECONDARY_COLOR }}>
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium uppercase tracking-wider text-gray-300">{title}</h3>
            <div className="w-6 h-6" style={{ color: PRIMARY_COLOR }}>
                {React.cloneElement(icon as React.ReactElement)}
            </div>
        </div>
        <p className="mt-1 text-3xl font-bold" style={{ color: TEXT_COLOR }}>{value}</p>
        <p className="mt-2 text-xs font-medium text-gray-400">{trend}</p>
    </div>
);

// 2. Navigation Card (Crucial for the user request)
interface NavCardProps {
    name: string;
    path: string;
    icon: React.ElementType; // Use React.ElementType for the Icon component
    description: string;
}

const NavCard: React.FC<NavCardProps> = ({ name, path, icon: Icon, description }) => (
    <Link 
        to={path} 
        className="block p-6 rounded-xl border border-gray-700/50 hover:shadow-2xl transition-all duration-200 group relative overflow-hidden" 
        style={{ backgroundColor: SECONDARY_COLOR }}
    >
        {/* Decorative Gradient Bar */}
        <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(to right, ${PRIMARY_COLOR}, ${TEXT_COLOR})` }}></div>

        <div className="flex items-start gap-4">
            <div className="p-3 rounded-full shrink-0" style={{ backgroundColor: PRIMARY_COLOR }}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <h3 className="text-xl font-bold group-hover:underline" style={{ color: TEXT_COLOR }}>{name}</h3>
                <p className="mt-1 text-sm text-gray-400">{description}</p>
            </div>
        </div>
    </Link>
);