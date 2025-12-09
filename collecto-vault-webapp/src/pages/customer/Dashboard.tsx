import { useState } from "react";
import Header from "../../components/Header";
import TierProgress from "../../components/TierProgress";
import TopNav from "../../components/TopNav";
import ServicesList from "../../components/ServicesList";
import BuyPoints from "../customer/BuyPoints"; 
import SpendPointsModal from "./SpendPoints"; 
import TierDetailsModal from "./TierDetails"; 
import { X, FileText, Download } from "lucide-react"; 

const REDEEMABLE_OFFERS = [
  { id: "r1", title: "20% off Hotel Stays", desc: "Redeem points for 20% off hotel stays.", pointsCost: 1000 },
  { id: "r2", title: "50% Travel Upgrades", desc: "Use points to upgrade your next travel.", pointsCost: 2500 },
  { id: "r3", title: " Lounge Access", desc: "Redeem points for complimentary lounge access.", pointsCost: 500 },
];

const MOCK_INVOICES = [
  { id: "INV-2024-001", date: "12 May 2024", amount: "UGX 150,000", status: "Paid" },
  { id: "INV-2024-002", date: "28 Apr 2024", amount: "UGX 45,000", status: "Paid" },
  { id: "INV-2024-003", date: "10 Apr 2024", amount: "UGX 320,000", status: "Pending" },
];

// -----------------------------------------------------

const mockUser = {
  name: "Mariam Tukasingura",
  phone: "256721695 645",
  avatar: "/photo.png",
  pointsBalance: 5000,
  avatarsize: 120,
  tier: "Blue",
  tierProgress: 30, 
  expiryDate: "30 Apr 2027",
  invoicesCount: 12, // NEW: Count for the tab
};

// UPDATED: Added 'invoices' to the type
type TabType = "points" | "tier" | "invoices";
type RedeemableOffer = typeof REDEEMABLE_OFFERS[0]; 

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("tier"); 
  const [buyPointsOpen, setBuyPointsOpen] = useState<boolean>(false);
  const [spendPointsOpen, setSpendPointsOpen] = useState<boolean>(false);
  const [tierDetailsOpen, setTierDetailsOpen] = useState<boolean>(false);
  
  const [selectedRedeemOffer, setSelectedRedeemOffer] = useState<RedeemableOffer | null>(null);

  const handleViewRedeemOffer = (offer: RedeemableOffer) => {
    setSelectedRedeemOffer(offer);
  };

  const handleSpendFromDetails = () => {
    setSelectedRedeemOffer(null); 
    setSpendPointsOpen(true); 
  };


  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-[#fff8e7] font-sans">
      <TopNav />
      <Header
        name={mockUser.name}
        phone={mockUser.phone}
        avatar={mockUser.avatar}
        useVideo={false}
        onAvatarFileChange={() => {}}
      />

      <main className="px-0">
      
        {/* --- TABS SECTION (UPDATED TO 3 TABS) --- */}
        <div className="bg-white shadow-lg flex divide-x divide-gray-100">
          
          {/* TAB 1: POINTS */}
          <button
            onClick={() => setActiveTab("points")}
            className={`flex-1 py-4 flex flex-col items-center justify-center relative transition-colors ${
              activeTab === "points" ? "bg-white" : "bg-gray-50/50"
            }`}
          >
            <span className="text-3xl text-gray-800 font-light tracking-tight">
              {mockUser.pointsBalance.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-gray-500 uppercase mt-1">
              Your Points
            </span>
            {activeTab === "points" && (
              <div className="absolute bottom-0 w-full h-[3px] bg-[#cb0d6c] animate-in fade-in zoom-in duration-200" />
            )}
          </button>

          {/* TAB 2: TIER */}
          <button
            onClick={() => setActiveTab("tier")}
            className={`flex-1 py-4 flex flex-col items-center justify-center relative transition-colors ${
              activeTab === "tier" ? "bg-white" : "bg-gray-50/50"
            }`}
          >
            <span className="text-3xl text-gray-800 font-light tracking-tight">
              {mockUser.tier}
            </span>
            <span className="text-xs font-medium text-gray-500 uppercase mt-1">
              Tier
            </span>
            {activeTab === "tier" && (
              <div className="absolute bottom-0 w-full h-[3px] bg-[#cb0d6c] animate-in fade-in zoom-in duration-200" />
            )}
          </button>

          {/* TAB 3: INVOICES (NEW) */}
          <button
            onClick={() => setActiveTab("invoices")}
            className={`flex-1 py-4 flex flex-col items-center justify-center relative transition-colors ${
              activeTab === "invoices" ? "bg-white" : "bg-gray-50/50"
            }`}
          >
            <span className="text-3xl text-gray-800 font-light tracking-tight">
              {mockUser.invoicesCount}
            </span>
            <span className="text-xs font-medium text-gray-500 uppercase mt-1">
              My Invoices
            </span>
            {activeTab === "invoices" && (
              <div className="absolute bottom-0 w-full h-[3px] bg-[#cb0d6c] animate-in fade-in zoom-in duration-200" />
            )}
          </button>
        </div>


        {/* --- MAIN CONTENT AREA --- */}
        <div className="mt-6 px-4">
        
          {/* Action Buttons (Only visible on Points tab) */}
          <div className="flex items-center justify-end mb-4 gap-3">
            {activeTab === "points" && (
              <>
                <button
                  onClick={() => setSpendPointsOpen(true)} 
                  className="text-sm font-semibold px-5 py-2 rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
                >
                  Spend Points
                </button>
                <button
                  onClick={() => setBuyPointsOpen(true)}
                  className="text-sm font-semibold px-5 py-2 rounded-full bg-[#ef4155] text-white shadow-md shadow-[#ef4155]/30 hover:bg-[#cb0d6c] active:scale-95 transition-all"
                >
                  Buy Points
                </button>
              </>
            )}
          </div>

          {/* Tier Progress (Only visible on Tier tab) */}
          <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
            {activeTab === "tier" && (
              <TierProgress
                currentTier={mockUser.tier}
                progress={mockUser.tierProgress}
              />
            )}
          </div>
        </div>


        {/* --- BOTTOM LISTS --- */}
        <div className="mt-8">
          
          {/* 1. VIEW: POINTS TAB */}
          {activeTab === "points" && (
            <>
              <div className="px-4 mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  Redeemable Offers (Plain Services)
                </h3>
              </div>
              <div className="space-y-4 px-4">
                {REDEEMABLE_OFFERS.map((offer, index) => (
                    <div 
                      key={offer.id} 
                      className="overflow-hidden flex items-center bg-white rounded-lg shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{index + 1}. {offer.title}</div>
                        <div className="text-sm text-gray-600 mt-1">{offer.desc}</div>
                      </div>
                      <div className="p-1 shrink-0">
                        <button 
                            onClick={() => handleViewRedeemOffer(offer)}
                            className="text-sm px-4 py-2 rounded-full bg-[#d81b60] hover:bg-[#b81752] text-white font-medium transition-colors active:scale-95"
                        >
                          View
                        </button>
                      </div>
                    </div>
                ))}
              </div>
            </>
          )}

          {/* 2. VIEW: TIER TAB */}
          {activeTab === "tier" && (
            <>
              <div className="px-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Tier Benefits
                </h3>
              </div>
              
              <div className="px-4">
                 <div 
                   onClick={() => setTierDetailsOpen(true)}
                   className="cursor-pointer bg-white py-4 mx-4 rounded-lg border border-gray-100 shadow-sm text-center hover:shadow-lg transition-shadow"
                 >
                    <button type="button" className="text-lg font-semibold text-gray-900 w-full py-2">
                       View All Benefits & Details
                    </button>
                 </div>
              </div>

              <div className="mt-6">
                <div className="px-4 mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Earn points from
                  </h3>
                </div>
                <ServicesList />
              </div>
            </>
          )}

          {/* 3. VIEW: INVOICES TAB (NEW) */}
          {activeTab === "invoices" && (
            <div className="px-4 pb-20 animate-in slide-in-from-bottom-2 fade-in duration-300">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Recent Invoices</h3>
                <span className="text-xs font-medium text-gray-500 uppercase">Last 30 Days</span>
              </div>

              <div className="space-y-3">
                {MOCK_INVOICES.map((inv) => (
                  <div key={inv.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{inv.amount}</p>
                        <p className="text-xs text-gray-500">{inv.id} • {inv.date}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {inv.status}
                      </span>
                      <button className="text-gray-400 hover:text-gray-700">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* --- MODALS --- */}
      <BuyPoints open={buyPointsOpen} onClose={() => setBuyPointsOpen(false)} onSuccess={() => {}} />

      <SpendPointsModal
        open={spendPointsOpen}
        onClose={() => setSpendPointsOpen(false)}
        currentPoints={mockUser.pointsBalance}
      />

      <TierDetailsModal
        open={tierDetailsOpen}
        onClose={() => setTierDetailsOpen(false)}
        tier={mockUser.tier}
        expiry={mockUser.expiryDate}
        pointsToNextTier={1500} 
      />

      {selectedRedeemOffer && (
        <div className="fixed inset-0 z-70 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedRedeemOffer(null)}>
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-bold text-gray-800">Redeem Offer Details</h4>
                    <button onClick={() => setSelectedRedeemOffer(null)} className="text-gray-400 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <p className="font-semibold text-gray-900">{selectedRedeemOffer.title}</p>
                <p className="text-sm text-gray-600 mb-4">{selectedRedeemOffer.desc}</p>
                
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-6">
                    <p className="text-sm text-red-700 font-semibold">
                        Cost: {selectedRedeemOffer.pointsCost.toLocaleString()} Points
                    </p>
                </div>

                <div className="flex justify-between gap-3">
                    <button 
                        onClick={() => setSelectedRedeemOffer(null)} 
                        className="flex-1 text-sm font-medium px-4 py-2 rounded-full text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => handleSpendFromDetails()}
                        disabled={mockUser.pointsBalance < selectedRedeemOffer.pointsCost}
                        className={`flex-1 text-sm font-semibold px-4 py-2 rounded-full transition-all ${
                            mockUser.pointsBalance >= selectedRedeemOffer.pointsCost
                                ? "bg-[#ef4155] text-white hover:bg-[#cb0d6c] shadow-md shadow-[#ef4155]/30"
                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                        Spend Points
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}