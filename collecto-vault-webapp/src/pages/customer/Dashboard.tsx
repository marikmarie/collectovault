import { useState } from "react";
import Header from "../../components/Header";
import TierProgress from "../../components/TierProgress";
import TopNav from "../../components/TopNav";
import ServicesList from "../../components/ServicesList";
import BuyPoints from "../customer/BuyPoints"; 
import SpendPointsModal from "./SpendPoints"; 
import TierDetailsModal from "./TierDetails"; 
import { X } from "lucide-react"; 

const REDEEMABLE_OFFERS = [
  { id: "r1", title: "20% off Hotel Stays", desc: "Redeem points for 20% off hotel stays.", pointsCost: 1000 },
  { id: "r2", title: "50% Travel Upgrades", desc: "Use points to upgrade your next travel.", pointsCost: 2500 },
  { id: "r3", title: " Lounge Access", desc: "Redeem points for complimentary lounge access.", pointsCost: 500 },
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
};

type TabType = "points" | "tier";
type RedeemableOffer = typeof REDEEMABLE_OFFERS[0]; // Type definition for clarity

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("tier"); 
  const [buyPointsOpen, setBuyPointsOpen] = useState<boolean>(false);
  const [spendPointsOpen, setSpendPointsOpen] = useState<boolean>(false);
  const [tierDetailsOpen, setTierDetailsOpen] = useState<boolean>(false);
  
  // NEW State for viewing specific offer details (Redeemable)
  const [selectedRedeemOffer, setSelectedRedeemOffer] = useState<RedeemableOffer | null>(null);


  // Handler to open the Redeemable Offer details modal
  const handleViewRedeemOffer = (offer: RedeemableOffer) => {
    setSelectedRedeemOffer(offer);
  };

  // Handler for the "Spend" button inside the details modal
  const handleSpendFromDetails = () => {
    setSelectedRedeemOffer(null); // Close the details modal first
    setSpendPointsOpen(true); // Open the main Spend Points modal (which lists all options)
    // NOTE: In a production app, you would pass the selected offer to the SpendPointsModal
  };


  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-[#fff8e7] font-sans">
      <TopNav />
      <Header
        name={mockUser.name}
        phone={mockUser.phone}
        avatar={mockUser.avatar}
        useVideo={false}
        useTexture={false}
      />

      <main className="px-0">
     
        {/* ... (Tabs section remains unchanged) ... */}
        <div className="bg-white shadow-lg flex divide-x divide-gray-100">
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
        </div>


        {/* --- MAIN CONTENT AREA --- */}
        <div className="mt-6 px-4">
        
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

          <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
            {activeTab === "points" ? null : (
              <TierProgress
                currentTier={mockUser.tier}
                progress={mockUser.tierProgress}
              />
            )}
          </div>
        </div>


        {/* --- BOTTOM LISTS --- */}
        <div className="mt-8">
          {activeTab === "points" ? (
            <>
              <div className="px-4 mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  Redeemable Offers (Plain Services)
                </h3>
              </div>

              {/* START: UPDATED REDEEMABLE OFFERS WITH VIEW BUTTONS */}
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
                            onClick={() => handleViewRedeemOffer(offer)} // Open the new details modal
                            className="text-sm px-4 py-2 rounded-full bg-[#d81b60] hover:bg-[#b81752] text-white font-medium transition-colors active:scale-95"
                        >
                          View
                        </button>
                      </div>
                    </div>
                ))}
              </div>
              {/* END: UPDATED REDEEMABLE OFFERS */}
            </>
          ) : (
            <>
              {/* Tier View Content (Remains unchanged) */}
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
        pointsToNextTier={1500} // Mock value
      />

      {/* NEW: Inline Offer Details Modal (Redeemable) */}
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