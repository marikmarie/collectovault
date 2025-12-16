import React from 'react';
import { Users, Coins, Trophy, DollarSign } from 'lucide-react';

// Custom colors: Primary red: 'bg-red-600', Secondary orange: 'bg-orange-500'

// --- Mock Data ---
const stats = [
  {
    name: 'Total Users',
    value: '1,245',
    icon: <Users className="w-6 h-6 text-red-600" />,
    color: 'bg-red-50',
  },
  {
    name: 'Total Points Issued',
    value: '5,020,400',
    icon: <Coins className="w-6 h-6 text-orange-500" />,
    color: 'bg-orange-50',
  },
  {
    name: 'Top Tier Members (Gold)',
    value: '230',
    icon: <Trophy className="w-6 h-6 text-yellow-600" />,
    color: 'bg-yellow-50',
  },
  {
    name: 'Package Revenue (MoM)',
    value: 'UGX 5.2M',
    icon: <DollarSign className="w-6 h-6 text-green-600" />,
    color: 'bg-green-50',
  },
];

// --- Main Component ---

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item) => (
          <div
            key={item.name}
            className="bg-white p-6 rounded-xl shadow-md border border-gray-200 transition-all hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-xl flex items-center justify-center ${item.color}`}
              >
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{item.name}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {item.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts/Recent Activity - Placeholder Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Loyalty Activity
          </h3>
          {/* List of activities */}
          <div className="space-y-4 text-sm">
            <p className="text-gray-700">User Mariam reached **Gold Tier**.</p>
            <p className="text-gray-700">
              New rule "Holiday Bonus" created by **Admin**.
            </p>
            <p className="text-gray-700">
              Package "Pro Value" updated price to **UGX 55,000**.
            </p>
          </div>
          <button className="mt-4 text-sm font-medium text-red-600 hover:text-red-700">
            View All Activity →
          </button>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <button className="w-full text-left flex items-center gap-3 p-3 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors">
            <Users className="w-5 h-5" />
            Add New User
          </button>
          <button className="w-full text-left flex items-center gap-3 p-3 bg-orange-50 text-orange-600 font-medium rounded-lg hover:bg-orange-100 transition-colors">
            <Trophy className="w-5 h-5" />
            Create New Tier
          </button>
          <button className="w-full text-left flex items-center gap-3 p-3 bg-gray-50 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors">
            <Coins className="w-5 h-5" />
            Issue Points Manually
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;