import React from 'react';
import { Home, Users, TrendingUp, DollarSign } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
        <Home className="w-7 h-7 text-indigo-500" /> Admin Dashboard
      </h1>
      <p className="text-gray-500">Quick view of key loyalty metrics and system health.</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value="8,450" icon={<Users />} trend="+12% last month" />
        <StatCard title="Active Points" value="5.2M" icon={<DollarSign />} trend="-5% redemption rate" />
        <StatCard title="Avg Tier Level" value="Silver (1.8)" icon={<TrendingUp />} trend="Stable" />
        <StatCard title="New Signups" value="230" icon={<Users />} trend="+25% this week" />
      </div>

      {/* Activity and Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>User 456 achieved **Gold** status.</li>
            <li>System processed 12,000 point transactions.</li>
            <li>New "Holiday Bonus" package deployed.</li>
          </ul>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4 flex items-center gap-2">
            System Alerts
          </h2>
          <p className="text-sm text-yellow-700">
            **Action Required:** Point Redemption API latency is high (2.5s average).
          </p>
        </div>
      </div>
    </div>
  );
}

// Sub-component for clean code
const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; trend: string }> = ({ title, value, icon, trend }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
            <div className="w-6 h-6 text-indigo-400">{icon}</div>
        </div>
        <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
        <p className="mt-2 text-xs font-medium text-gray-600">{trend}</p>
    </div>
);