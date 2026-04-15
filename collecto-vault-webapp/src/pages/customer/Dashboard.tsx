import { useState, useEffect } from "react";
import Header from "../../components/Header";
import TopNav from "../../components/TopNav";
import AddCashModal from "../../components/AddCashModal";
import TransferCashModal from "../../components/TransferCashModal";
import BuyPoints from "../customer/BuyPoints";
import {   Eye, EyeOff, CreditCard, PlusCircle, Send, ShoppingCart } from "lucide-react";
import { customerService } from "../../api/customer";
import { transactionService } from "../../api/collecto";

export default function Dashboard() {
  const [earnedPoints, setEarnedPoints] = useState<number>(0);
  const [boughtPoints, setBoughtPoints] = useState<number>(0);
  const [, setUgxPerPoint] = useState<number>(0);
  const [, setWalletAmount] = useState<number | null>(null);
  const [cashBalance, setCashBalance] = useState<number | null>(null);
  const [, setRecentTransactions] = useState<any[]>([]);
  const [loyaltyName, setLoyaltyName] = useState<string>("");
  const [loyaltySettings, setLoyaltySettings] = useState<any>(null);
  const [showWalletAmount, setShowWalletAmount] = useState(true);

  // UI States
  const [addCashOpen, setAddCashOpen] = useState(false);
  const [transferCashOpen, setTransferCashOpen] = useState(false);
  const [buyPointsOpen, setBuyPointsOpen] = useState(false);
  // Data States
  const [, setLoading] = useState(false);
  const [, setTransactions] = useState<any[]>([]);

  const clientId = localStorage.getItem("clientId") || "";
  const collectoId = localStorage.getItem("collectoId") || "";
  const userName = localStorage.getItem("userName") || "User";

  // --- API FETCHERS ---

  const fetchData = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      // 1. Fetch Customer Profile (Points & Cash Balance)
      const customerRes = await customerService.getCustomerData(collectoId, clientId);
      const loyaltySettings = customerRes.data?.data?.loyaltySettings ?? {};

      setLoyaltySettings(loyaltySettings);

      const earned = loyaltySettings?.loyalty_points?.earned ?? 0;
      const bought = loyaltySettings?.loyalty_points?.bought ?? 0;
      const points =
        loyaltySettings?.points ??
        (earned + bought);

      // Get cash balance from cashDetails instead of calculating from points
      const cashDetails = loyaltySettings?.client_cash_details ?? {};
      const balanceAmount = typeof cashDetails?.balance === 'number' 
        ? cashDetails.balance 
        : 0;

      setLoyaltyName(
        typeof loyaltySettings?.name === 'string' && loyaltySettings.name.trim()
          ? loyaltySettings.name.trim()
          : ''
      );
      setEarnedPoints(earned);
      setBoughtPoints(bought);
      setWalletAmount(balanceAmount);
      setCashBalance(balanceAmount);

      // Use transactions from cashDetails if available
      const cashTransactions = Array.isArray(cashDetails?.transactions) ? cashDetails.transactions : [];
      setRecentTransactions(cashTransactions.slice(0, 5)); // Show last 5 transactions

      const pointValue =
        loyaltySettings?.point_value ?? loyaltySettings?.pointValue ?? null;
      const perPoint =
        typeof pointValue === 'number' && points > 0 ? pointValue / points : 0;
      setUgxPerPoint(perPoint);

      // Fallback: also fetch from transactionService if needed
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
        {/* <div className="mx-4 my-4 rounded-2xl bg-linear-to-r from-[#d81b60] via-[#8f0a43] to-[#f06292] text-white p-4 shadow-lg"> */}
        {/* Wallet Card */}
<div className="mx-0 my-4 rounded-2xl bg-[#d81b60] text-white p-5 shadow-md">
  <div className="flex items-start justify-between mb-4">
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <CreditCard size={13} className="opacity-70" />
        <span className="text-[11px] uppercase tracking-widest opacity-80 font-medium">
          Cash Balance
        </span>
      </div>
      <div className="text-4xl font-black tracking-tight">
        {showWalletAmount
          ? cashBalance !== null ? `UGX ${cashBalance.toLocaleString()}` : '—'
          : '••••••'}
      </div>
    </div>
    <button
      onClick={() => setShowWalletAmount(v => !v)}
      className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
    >
      {showWalletAmount ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  </div>

  <div className="flex gap-3 pt-4 border-t border-white/20">
    {[
      { label: 'Earned Pts', value: earnedPoints, isCurrency: false },
      { label: 'Bought Pts', value: boughtPoints, isCurrency: false },
      { label: 'Point Value',  value: loyaltySettings?.point_value ?? 0, isCurrency: true },
    ].map(({ label, value, isCurrency }) => (
      <div key={label} className="flex-1 bg-white/12 rounded-xl px-3 py-2.5">
        <div className="text-[9px] uppercase tracking-wide opacity-70 mb-1">{label}</div>
        <div className="text-sm font-bold">{isCurrency ? `UGX ${Number(value).toLocaleString()}` : `${Number(value).toLocaleString()} pts`}</div>
      </div>
    ))}
  </div>
</div>

{/* Action Buttons */}
<div className="flex gap-3 mb-5">
  {[
    { label: 'Add Cash',   icon: <PlusCircle size={18} color="#d81b60" />, action: () => setAddCashOpen(true) },
    { label: 'Use Cash',   icon: <Send       size={18} color="#d81b60" />, action: () => setTransferCashOpen(true) },
    { label: 'Buy Points', icon: <ShoppingCart size={18} color="#d81b60" />, action: () => setBuyPointsOpen(true) },
  ].map(({ label, icon, action }) => (
    <button
      key={label}
      onClick={action}
      className="flex-1 flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-xl py-3 shadow-xs hover:bg-gray-50 transition-colors"
    >
      <div className="w-9 h-9 rounded-full bg-[#fce4ec] flex items-center justify-center">
        {icon}
      </div>
      <span className="text-xs font-semibold text-gray-700">{label}</span>
    </button>
  ))}
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