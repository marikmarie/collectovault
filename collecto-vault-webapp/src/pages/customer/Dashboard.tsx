import { useState, useEffect } from "react";
import Header from "../../components/Header";
import TopNav from "../../components/TopNav";
import AddCashModal from "../../components/AddCashModal";
import TransferCashModal from "../../components/TransferCashModal";
import BuyPoints from "../customer/BuyPoints";
import {  RefreshCw, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { customerService } from "../../api/customer";
import { transactionService } from "../../api/collecto";

export default function Dashboard() {
  const [earnedPoints, setEarnedPoints] = useState<number>(0);
  const [boughtPoints, setBoughtPoints] = useState<number>(0);
  const [, setUgxPerPoint] = useState<number>(0);
  const [walletAmount, setWalletAmount] = useState<number | null>(null);
  const [loyaltyName, setLoyaltyName] = useState<string>("");
  const [loyaltySettings, setLoyaltySettings] = useState<any>(null);
  const [showWalletAmount, setShowWalletAmount] = useState(true);

  // UI States
  const [addCashOpen, setAddCashOpen] = useState(false);
  const [transferCashOpen, setTransferCashOpen] = useState(false);
  const [buyPointsOpen, setBuyPointsOpen] = useState(false);
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
      const loyaltySettings = customerRes.data?.data?.loyaltySettings ?? {};

      setLoyaltySettings(loyaltySettings);

      const earned = loyaltySettings?.loyalty_points?.earned ?? 0;
      const bought = loyaltySettings?.loyalty_points?.bought ?? 0;
      const points =
        loyaltySettings?.points ??
        (earned + bought);

      const pointValue =
        loyaltySettings?.point_value ?? loyaltySettings?.pointValue ?? null;
      const perPoint =
        typeof pointValue === 'number' && points > 0 ? pointValue / points : 0;

      setLoyaltyName(
        typeof loyaltySettings?.name === 'string' && loyaltySettings.name.trim()
          ? loyaltySettings.name.trim()
          : ''
      );
      setEarnedPoints(earned);
      setBoughtPoints(bought);
      setUgxPerPoint(perPoint);
      setWalletAmount(perPoint > 0 ? Math.round(points * perPoint) : null);

      const txRes = await transactionService.getTransactions(clientId, 10, 0);
      const txList = txRes.data?.transactions ?? txRes.data?.data?.data ?? [];
      setTransactions(Array.isArray(txList) ? txList : []);

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
        name={loyaltyName || userName}
        phone=""
       
      />

      <main className="w-full mt-0">
        {/* --- WALLET SUMMARY --- */}
        <div className="mx-4 my-4 rounded-2xl bg-linear-to-r from-[#d81b60] via-[#8f0a43] to-[#f06292] text-white p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs uppercase font-semibold opacity-90">Cash Balance</div>
              <div className="text-3xl font-black">
                {showWalletAmount ? (walletAmount !== null ? `UGX ${walletAmount.toLocaleString()}` : '—') : '••••••'}
              </div>
              {/* <div className="text-[11px] mt-1 opacity-80">
                {ugxPerPoint > 0 ? `1 point = UGX ${ugxPerPoint.toFixed(2)}` : 'Point value not available'}
              </div> */}
            </div>
            <button
              className="text-sm px-3 py-1 bg-white/20 rounded-full"
              onClick={() => setShowWalletAmount((value) => !value)}
            >
              {showWalletAmount ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-white/90">
            <div className="rounded-xl bg-white/10 p-3">
              <div className="font-semibold">Earned Points</div>
              <div className="font-bold text-lg">{earnedPoints.toLocaleString()} pts</div>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <div className="font-semibold">Bought Points</div>
              <div className="font-bold text-lg">{boughtPoints.toLocaleString()} pts</div>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <div className="font-semibold">Total Points</div>
              <div className="font-bold text-lg">{(earnedPoints + boughtPoints).toLocaleString()} pts</div>
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* --- ACTIONS --- */}
          <div className="flex flex-wrap justify-end gap-2 mb-6">
            <button
              onClick={() => setAddCashOpen(true)}
              className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-bold shadow-xs hover:bg-gray-50 transition-all"
            >
              Add Cash
            </button>
            <button
              onClick={() => setTransferCashOpen(true)}
              className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-bold shadow-xs hover:bg-gray-50 transition-all"
            >
              Use Cash
            </button>
            <button
              onClick={() => setBuyPointsOpen(true)}
              className="px-4 py-2 rounded-full bg-[#f0edee] text-gray-800 text-sm font-bold shadow-md hover:opacity-90 transition-all"
            >
              Buy Points
            </button>
          </div>

          {/* --- CONTENT: POINTS --- */}
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
                    transactions.slice(0, 3).map((tx) => {
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

                  {transactions.length > 3 && (
                    <div className="mt-4">
                      <button
                        onClick={() => alert('Navigate to full statement page')}
                        className="w-full py-2 rounded-xl border border-gray-200 text-sm font-semibold text-[#cb0d6c] bg-white hover:bg-gray-50"
                      >
                        View All Transactions
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>

        </div>
      </main>

      {/* --- MODALS --- */}
      <AddCashModal
        open={addCashOpen}
        onClose={() => setAddCashOpen(false)}
        onSuccess={fetchData}
        clientAddCash={loyaltySettings?.client_add_cash}
      />

      <TransferCashModal
        open={transferCashOpen}
        onClose={() => setTransferCashOpen(false)}
        onSuccess={fetchData}
      />

      <BuyPoints 
        open={buyPointsOpen} 
        onClose={() => setBuyPointsOpen(false)} 
        onSuccess={fetchData} 
      />

    </div>
  );
}