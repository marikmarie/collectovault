import { useState, useEffect } from "react";
import Header from "../../components/Header";
import TierProgress from "../../components/TierProgress";
import TopNav from "../../components/TopNav";
import ServicesList from "../../components/ServicesList";
import BuyPoints from "../customer/BuyPoints";
import SpendPointsModal from "./SpendPoints";
import TierDetailsModal from "./TierDetails";
import {  RefreshCw, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { customerService } from "../../api/customer";
import { transactionService } from "../../api/collecto";

type TabType = "points" | "tier";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("tier");
  const [pointsBalance, setPointsBalance] = useState<number>(0);
  const [tier, setTier] = useState<string>("N/A");
  const [tierProgress, setTierProgress] = useState<number>(0);
  
  // UI States
  const [buyPointsOpen, setBuyPointsOpen] = useState(false);
  const [spendPointsOpen, setSpendPointsOpen] = useState(false);
  const [tierDetailsOpen, setTierDetailsOpen] = useState(false);
  
  // Data States
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  const clientId = localStorage.getItem("clientId") || "";
  const collectoId = localStorage.getItem("collectoId") || "";
  const userName = localStorage.getItem("userName") || "User";

  // --- API FETCHERS ---

  const fetchData = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      // 1. Fetch Customer Profile (Points)
      const customerRes = await customerService.getCustomerData(collectoId, clientId);
      const loyaltySettings = customerRes.data?.data?.loyaltySettings;

      const points =
        loyaltySettings?.points ??
        ((loyaltySettings?.loyalty_points?.earned ?? 0) +
          (loyaltySettings?.loyalty_points?.bought ?? 0));

      setPointsBalance(points || 0);
      setTier('N/A');
      setTierProgress(0);

      
      const txRes = await transactionService.getTransactions(clientId);
      setTransactions(txRes.data?.transactions || []);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clientId]);



  

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 lg:pb-0">
      <TopNav />
      <Header
        name={userName}
        phone=""
        avatar="/photo.png"
        useVideo={false}
        onAvatarFileChange={() => {}}
      />

      <main className="w-full mt-0">
        {/* --- TABS --- */}
        <div className="bg-white shadow-sm flex sticky top-16 z-20">
          <button 
            onClick={() => setActiveTab("points")} 
            className={`flex-1 py-5 flex flex-col items-center transition-all ${activeTab === "points" ? "border-b-4 border-[#cb0d6c]" : "opacity-50"}`}
          >
            <span className="text-2xl font-bold text-gray-900">{pointsBalance.toLocaleString()}</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Available Points</span>
          </button>
          <button 
            onClick={() => setActiveTab("tier")} 
            className={`flex-1 py-5 flex flex-col items-center transition-all ${activeTab === "tier" ? "border-b-4 border-[#cb0d6c]" : "opacity-50"}`}
          >
            <span className="text-2xl font-bold text-gray-900">{tier}</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Current Tier</span>
          </button>
        </div>

        <div className="p-4">
          {/* --- ACTIONS --- */}
          <div className="flex justify-end gap-3 mb-6">
            {activeTab === "points" && (
              <>
                <button onClick={() => setSpendPointsOpen(true)} className="px-6 py-2 rounded-full border border-gray-200 bg-white text-sm font-bold shadow-xs hover:bg-gray-50 transition-all">Spend</button>
                <button onClick={() => setBuyPointsOpen(true)} className="px-6 py-2 rounded-full bg-[#f0edee] text-gray-800 text-sm font-bold shadow-md hover:opacity-90 transition-all">Buy Points</button>
              </>
            )}
          </div>

          {/* --- CONTENT: POINTS TAB --- */}
          {activeTab === "points" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Transactions Ledger */}
              <section>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
                  <button onClick={fetchData} className="p-2 text-gray-400 hover:text-[#cb0d6c] transition-colors">
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                  </button>
                </div>

                <div className="space-y-3">
                  {transactions.length === 0 ? (
                    <div className="bg-white p-10 rounded-2xl text-center text-gray-400 border border-dashed border-gray-200">
                      No transactions found yet.
                    </div>
                  ) : (
                    transactions.map((tx) => {
                      const isConfirmed = ["success", "confirmed"].includes(tx.paymentStatus?.toLowerCase());
                      const isInvoice = tx.reference === "INVOICE_PURCHASE";
                      
                      return (
                        <div key={tx.id} className="bg-white p-4 rounded-2xl border border-gray-50 shadow-xs flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isInvoice ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"}`}>
                            {isInvoice ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm">
                                  {isInvoice ? "Earned from Service" : "Points Purchase"}
                                </h4>
                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{tx.transactionId}</p>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-[#cb0d6c] text-sm">+{tx.points.toLocaleString()} pts</span>
                                <p className="text-[10px] text-gray-400">{tx.amount.toLocaleString()} UGX</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                📅 {new Date(tx.createdAt).toLocaleDateString()}
                              </span>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isConfirmed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                {tx.paymentStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>
          )}

          {/* --- CONTENT: TIER TAB --- */}
          {activeTab === "tier" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <TierProgress currentTier={tier} progress={tierProgress} />
              
              <div className="bg-linear-to-br from-gray-300 to-gray-200 p-6 rounded-3xl text-gray-900 shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-2">Tier Benefits</h3>
                  <p className="text-gray-900 text-sm mb-6">Enjoy exclusive rewards and priority services as a {tier} member.</p>
                  <button 
                    onClick={() => setTierDetailsOpen(true)}
                    className="w-full py-3 bg-white text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors"
                  >
                    View All Benefits
                  </button>
                </div>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-[#cb0d6c] rounded-full blur-3xl opacity-20"></div>
              </div>

              <section>
                <h3 className="text-lg font-bold text-gray-800 mb-4">How to earn points</h3>
                <ServicesList />
              </section>
            </div>
          )}
        </div>
      </main>

      {/* --- MODALS --- */}
      <BuyPoints 
        open={buyPointsOpen} 
        onClose={() => setBuyPointsOpen(false)} 
        onSuccess={fetchData} 
      />
      
      <SpendPointsModal 
        open={spendPointsOpen} 
        onClose={() => setSpendPointsOpen(false)} 
        currentPoints={pointsBalance} 
      />

      <TierDetailsModal 
        open={tierDetailsOpen} 
        onClose={() => setTierDetailsOpen(false)} 
        tier={tier} 
        expiry="" 
        pointsToNextTier={1500} 
      />
    </div>
  );
}