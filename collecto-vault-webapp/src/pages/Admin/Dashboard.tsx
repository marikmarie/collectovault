import React, { useState, useEffect } from 'react';
import { Users, Coins, Trophy, DollarSign, TrendingUp, Star, Activity } from 'lucide-react';
import api from '../../api';

interface DashboardData {
  totalUsers: number;
  totalPointsIssued: number;
  topTierMembers: number;
  packageRevenue: string;
}


const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalUsers: 0,
    totalPointsIssued: 0,
    topTierMembers: 0,
    packageRevenue: 'UGX 0',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const collectoId = localStorage.getItem('collectoId');
      
      if (!collectoId) {
        console.error('collectoId not found in localStorage');
        setLoading(false);
        return;
      }

      const response = await api.get('/admin/dashboard', {
        params: {
          collectoId: collectoId,
        },
      });
      
      // Handle the nested data structure from API response
      const data = response.data?.data || response.data;
      const packageRevenue = data.packageRevenue || 'UGX 0';
      // Ensure UGX prefix is always present
      const formattedRevenue = packageRevenue.startsWith('UGX') ? packageRevenue : `UGX ${packageRevenue}`;
      
      setDashboardData({
        totalUsers: data.totalUsers || 0,
        totalPointsIssued: data.totalPointsIssued || 0,
        topTierMembers: data.topTierMembers || 0,
        packageRevenue: formattedRevenue,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      name: 'Total Users',
      value: dashboardData.totalUsers.toLocaleString(),
      icon: <Users className="w-8 h-8" />,
      gradient: 'from-blue-500 to-blue-600',
      lightBg: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      name: 'Total Points Issued',
      value: dashboardData.totalPointsIssued.toLocaleString(),
      icon: <Coins className="w-8 h-8" />,
      gradient: 'from-amber-500 to-amber-600',
      lightBg: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
    {
      name: 'Top Tier Members',
      value: dashboardData.topTierMembers.toLocaleString(),
      icon: <Trophy className="w-8 h-8" />,
      gradient: 'from-yellow-500 to-yellow-600',
      lightBg: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      name: 'Package Revenue (MoM)',
      value: dashboardData.packageRevenue,
      icon: <DollarSign className="w-8 h-8" />,
      gradient: 'from-green-500 to-green-600',
      lightBg: 'bg-green-50',
      textColor: 'text-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-linear-to-br from-[#aa056b] to-[#c41882] rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Welcome back! Here's your loyalty program overview
            </h1>
          </div>
          {/* <p className="text-gray-600 ml-11">Welcome back! Here's your loyalty program overview</p> */}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((item, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-gray-200"
            >
              {/* Gradient background effect */}
              <div
                className={`absolute top-0 right-0 w-20 h-20 bg-linear-to-br ${item.gradient} opacity-5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500`}
              />

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-lg ${item.lightBg} group-hover:scale-110 transition-transform duration-300`}>
                    <div className={item.textColor}>{item.icon}</div>
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <p className="text-gray-600 text-xs font-medium mb-1">{item.name}</p>
                <p className={`text-2xl font-bold bg-linear-to-r ${item.gradient} bg-clip-text text-transparent`}>
                  {loading ? '—' : item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Featured Card */}
          <div className="lg:col-span-2 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
            <div className="bg-linear-to-r from-[#bb107a] to-[#af1775] p-4 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5" />
                <h2 className="text-lg font-bold">Premium Features</h2>
              </div>
              <p className="text-red-100 mb-4 text-sm">Unlock powerful tools to manage your loyalty program efficiently</p>
              <div className="grid grid-cols-2 gap-2">
                <button className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium py-2 px-3 rounded-lg text-sm transition-all duration-200 backdrop-blur-sm border border-white border-opacity-30">
                  📊 View Reports
                </button>
                <button className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium py-2 px-3 rounded-lg text-sm transition-all duration-200 backdrop-blur-sm border border-white border-opacity-30">
                  ⚙️ Settings
                </button>
              </div>
            </div>
          </div>

          {/* Stats Summary Card */}
          <div className="rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-3">System Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg border border-green-200">
                <span className="text-xs font-medium text-gray-700">API Status</span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-green-600">Online</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-xs font-medium text-gray-700">Database</span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-blue-600">Connected</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-purple-50 rounded-lg border border-purple-200">
                <span className="text-xs font-medium text-gray-700">Services</span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-purple-600">Active</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;