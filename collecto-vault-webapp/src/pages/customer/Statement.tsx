import { useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import { ArrowUpRight, ArrowDownLeft, TrendingUp } from "lucide-react";
import { transactionService } from "../../api/collecto";

interface Transaction {
  id: string | number;
  type: "Earn" | "Redeem";
  description: string;
  points: number;
  ugxValue?: number | string;
  date: string;
} 

export default function Statement() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const res = await transactionService.getTransactions("me");
        const data = res.data?.transactions ?? res.data ?? [];
        setTransactions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("Failed to fetch transactions", err);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

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
          Transaction Statement
        </h1>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-700">Recent Activity</h2>
          </div>

          <ul className="divide-y divide-gray-100">
            {loading ? (
              <li className="p-4 sm:p-6 text-center text-sm text-gray-500">Loading transactions…</li>
            ) : transactions.length === 0 ? (
              <li className="p-4 sm:p-6 text-center text-sm text-gray-500">No recent activity.</li>
            ) : (
              transactions.map((tx) => (
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
                  <p className="text-xs text-gray-400 mt-1">~UGX {Number(String(tx.ugxValue).replace(/[^0-9.-]+/g,'') || 0).toLocaleString()}</p>
                </div>
              </li>
              ))
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}