import TopNav from "../../components/TopNav";
import { Users, CreditCard, Gift, BarChart3 } from "lucide-react";

// Mock data for key metrics
const mockMetrics = [
  { 
    title: "Total Members", 
    value: "15,400", 
    trend: "+2.1%", 
    icon: Users, 
    color: "bg-blue-500" 
  },
  { 
    title: "Points Issued (Last 30 Days)", 
    value: "1.2M", 
    trend: "+5.5%", 
    icon: CreditCard, 
    color: "bg-green-500" 
  },
  { 
    title: "Points Redeemed Value", 
    value: "UGX 9,500,000", 
    trend: "-1.2%", 
    icon: Gift, 
    color: "bg-red-500" 
  },
];

export default function Reports() {
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <TopNav />
      <main className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2">
           <BarChart3 className="w-8 h-8 text-[#0b4b78]" />
           Program Overview Reports (Admin View)
        </h1>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {mockMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                  <div className={`p-2 rounded-full text-white ${metric.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-gray-800">{metric.value}</div>
                <div className="mt-2 text-sm">
                  <span className={metric.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                    {metric.trend}
                  </span> 
                  <span className="text-gray-500"> vs previous month</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Placeholder for detailed charts/tables */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-lg h-96 flex items-center justify-center text-gray-400">
            <p>Detailed Tier Performance Chart Placeholder</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg h-64 flex items-center justify-center text-gray-400">
            <p>Recent Admin Activity Log Placeholder</p>
          </div>
        </div>
      </main>
    </div>
  );
}