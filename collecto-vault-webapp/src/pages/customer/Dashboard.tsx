import { useState, useEffect } from "react";
import Header from "../../components/Header";
import TierProgress from "../../components/TierProgress";
import TopNav from "../../components/TopNav";
import ServicesList from "../../components/ServicesList";
import BuyPoints from "../customer/BuyPoints";
import SpendPointsModal from "./SpendPoints";
import TierDetailsModal from "./TierDetails";
import Slider from "../../components/Slider";
import {  RefreshCw, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import { customerService } from "../../api/customer";
import { transactionService } from "../../api/collecto";

type TabType = "points" | "tier";

interface RedeemableOffer {
  id: string;
  title: string;
  desc?: string;
  pointsCost: number;
}

const DUMMY_OFFERS: RedeemableOffer[] = [
  { id: "offer_1", title: "10% Discount on Next Purchase", desc: "Get 10% off your next purchase over 15%", pointsCost: 500 },
  { id: "offer_2", title: "Free concert ticket", desc: "Redeem for a free ticket to a local concert event", pointsCost: 250 },
  { id: "offer_3", title: "Exclusive Member Offer", desc: "Special discount available only to tier members", pointsCost: 1000 },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("tier");
  const [pointsBalance, setPointsBalance] = useState<number>(0);
  const [tier, setTier] = useState<string>("N/A");
  const [tierProgress, setTierProgress] = useState<number>(0);
  
  // UI States
  const [buyPointsOpen, setBuyPointsOpen] = useState(false);
  const [spendPointsOpen, setSpendPointsOpen] = useState(false);
  const [tierDetailsOpen, setTierDetailsOpen] = useState(false);
  const [selectedRedeemOffer, setSelectedRedeemOffer] = useState<RedeemableOffer | null>(null);
  
  // Data States
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [redeemableOffers, setRedeemableOffers] = useState<RedeemableOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);

  const clientId = localStorage.getItem("clientId") || "";
  const userName = localStorage.getItem("userName") || "User";

  // --- API FETCHERS ---

  const fetchData = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      // 1. Fetch Customer Profile (Points/Tier)
      const customerRes = await customerService.getCustomerData(clientId);
      const cData = customerRes.data;
      if (cData?.customer) {
        setPointsBalance(cData.customer.currentPoints || 0);
        setTier(cData.currentTier?.name || "N/A");
        
        // Calculate Progress
        if (cData.currentTier && cData.tiers) {
          const idx = cData.tiers.findIndex((t: any) => t.id === cData.currentTier.id);
          if (idx !== -1 && idx < cData.tiers.length - 1) {
            const next = cData.tiers[idx + 1];
            const diff = next.pointsRequired - cData.currentTier.pointsRequired;
            const earned = cData.customer.currentPoints - cData.currentTier.pointsRequired;
            setTierProgress(Math.min(100, Math.max(0, (earned / diff) * 100)));
          } else {
            setTierProgress(100);
          }
        }
      }

      // 2. Fetch Transactions
      const txRes = await transactionService.getTransactions(clientId);
      setTransactions(txRes.data?.transactions || []);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async () => {
    setOffersLoading(true);
    try {
      const res = await customerService.getRedeemableOffers();
      const offers = res.data?.offers ?? res.data ?? [];
      setRedeemableOffers(Array.isArray(offers) && offers.length > 0 ? offers : DUMMY_OFFERS);
    } catch (err) {
      setRedeemableOffers(DUMMY_OFFERS);
    } finally {
      setOffersLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchOffers();
  }, [clientId]);

  // --- HANDLERS ---

  const handleSpendFromDetails = () => {
    setSelectedRedeemOffer(null);
    setSpendPointsOpen(true);
  };

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

      <main className="max-w-4xl mx-auto">
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
                <button onClick={() => setBuyPointsOpen(true)} className="px-6 py-2 rounded-full bg-[#cb0d6c] text-white text-sm font-bold shadow-md hover:opacity-90 transition-all">Buy Points</button>
              </>
            )}
          </div>

          {/* --- CONTENT: POINTS TAB --- */}
          {activeTab === "points" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Offers Slider */}
              <section>
                <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">Exclusive Offers</h3>
                {offersLoading ? (
                  <div className="h-32 flex items-center justify-center text-gray-400 text-sm">Loading offers...</div>
                ) : (
                  <Slider
                    height="h-40"
                    slides={redeemableOffers.map((offer) => ({
                      key: offer.id,
                      node: (
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col justify-between mr-2">
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{offer.title}</h4>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{offer.desc}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-[#cb0d6c]">{offer.pointsCost} pts</span>
                            <button 
                              onClick={() => setSelectedRedeemOffer(offer)}
                              className="text-[10px] bg-gray-900 text-white px-3 py-1.5 rounded-full font-bold"
                            >
                              Redeem
                            </button>
                          </div>
                        </div>
                      )
                    }))}
                  />
                )}
              </section>

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
                                <Clock size={10} /> {new Date(tx.createdAt).toLocaleDateString()}
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
              
              <div className="bg-linear-to-br from-gray-400 to-gray-300 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-2">Tier Benefits</h3>
                  <p className="text-gray-400 text-sm mb-6">Enjoy exclusive rewards and priority services as a {tier} member.</p>
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

      {/* Redeem Detail Overlay */}
      {selectedRedeemOffer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setSelectedRedeemOffer(null)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h4 className="text-xl font-black text-gray-900 mb-2">{selectedRedeemOffer.title}</h4>
            <p className="text-gray-500 text-sm mb-6">{selectedRedeemOffer.desc}</p>
            
            <div className="bg-red-50 p-4 rounded-2xl mb-8 border border-red-100">
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Redemption Cost</span>
              <p className="text-2xl font-black text-red-600">{selectedRedeemOffer.pointsCost.toLocaleString()} Points</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setSelectedRedeemOffer(null)} className="py-3 rounded-xl font-bold text-gray-500 border border-gray-200">Close</button>
              <button 
                onClick={handleSpendFromDetails}
                disabled={pointsBalance < selectedRedeemOffer.pointsCost}
                className={`py-3 rounded-xl font-bold text-white shadow-lg ${pointsBalance >= selectedRedeemOffer.pointsCost ? "bg-[#cb0d6c] shadow-[#cb0d6c]/30" : "bg-gray-300 cursor-not-allowed"}`}
              >
                Claim Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}