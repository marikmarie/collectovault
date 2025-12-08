import TopNav from "../../components/TopNav";
import { ArrowUpRight, ArrowDownLeft, TrendingUp } from "lucide-react";

// Mock data for transactions (assuming 1 Point = UGX 10)
const mockTransactions = [
  { id: 1, type: "Earn", description: "Hotel Booking - Serena Kigo", points: 2500, ugxValue: "25,000", date: "2025-11-28" },
  { id: 2, type: "Redeem", description: "Flight Upgrade - Entebbe to Dubai", points: 1500, ugxValue: "15,000", date: "2025-11-25" },
  { id: 3, type: "Earn", description: "Purchased Points (Bonus 10%)", points: 1000, ugxValue: "10,000", date: "2025-11-20" },
  { id: 4, type: "Redeem", description: "Car Rental Discount", points: 500, ugxValue: "5,000", date: "2025-11-15" },
];

export default function Statement() {
  const formatPoints = (points: number, type: "Earn" | "Redeem") => {
    const sign = type === "Earn" ? "+" : "-";
    const color = type === "Earn" ? "text-green-600" : "text-red-600";
    return (
      <span className={`font-semibold ${color}`}>
        {sign} {points.toLocaleString()} pts
      </span>
    );
  };

  const getIcon = (type: "Earn" | "Redeem") => {
    if (type === "Earn") return <ArrowUpRight className="w-5 h-5 text-green-600" />;
    return <ArrowDownLeft className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <TopNav />
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-[#0b4b78]" /> 
          Points Statement
        </h1>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-700">Recent Activity</h2>
          </div>

          <ul className="divide-y divide-gray-100">
            {mockTransactions.map((tx) => (
              <li key={tx.id} className="p-4 sm:p-6 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-gray-100">
                    {getIcon(tx.type as "Earn" | "Redeem")}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{tx.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(tx.date).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {formatPoints(tx.points, tx.type as "Earn" | "Redeem")}
                  <p className="text-xs text-gray-400 mt-1">~UGX {tx.ugxValue.toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}