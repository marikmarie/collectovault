import { useState } from "react";
import Header from "../../components/Header";
import TierProgress from "../../components/TierProgress";
import TopNav from "../../components/TopNav";
import ServicesList from "../../components/ServicesList";
import BuyPoints from "../customer/BuyPoints"; // Existing modal for buying
import SpendPointsModal from "./SpendPoints"; // NEW: For spending points
import TierDetailsModal from "./TierDetails"; // NEW: For viewing Tier Benefits

// Existing mock data remains
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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("tier"); 
  const [buyPointsOpen, setBuyPointsOpen] = useState<boolean>(false);
  // NEW State for new modals
  const [spendPointsOpen, setSpendPointsOpen] = useState<boolean>(false);
  const [tierDetailsOpen, setTierDetailsOpen] = useState<boolean>(false);


  return (
    // Updated background to use the Collecto Vault gradient
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
     
        <div className="bg-white shadow-lg flex divide-x divide-gray-100">
          {/* Tab 1: Points */}
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

            {/* Active Indicator Line (Uses magenta from the gradient: #cb0d6c) */}
            {activeTab === "points" && (
              <div className="absolute bottom-0 w-full h-[3px] bg-[#cb0d6c] animate-in fade-in zoom-in duration-200" />
            )}
          </button>

          {/* Tab 2: Tier */}
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

            {/* Active Indicator Line (Uses magenta from the gradient: #cb0d6c) */}
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
                  onClick={() => setSpendPointsOpen(true)} // NEW: Spend button
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
              <div className="space-y-4 px-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <p className="font-medium text-gray-900">
                    1. Spend your vacation on hotels
                  </p>
                  <p className="text-sm text-gray-500">
                    Redeem points for 20% off hotel stays.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <p className="font-medium text-gray-900">
                    2. Travel upgrades
                  </p>
                  <p className="text-sm text-gray-500">
                    Use your points to upgrade your next travel.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Tier View Content */}
              <div className="px-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Tier Benefits
                </h3>
              </div>
              
              <div className="px-4">
                 {/* Trigger modal when viewing benefits */}
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

      {/* NEW: Spend Points Modal */}
      <SpendPointsModal
        open={spendPointsOpen}
        onClose={() => setSpendPointsOpen(false)}
        currentPoints={mockUser.pointsBalance}
      />

      {/* NEW: Tier Details Modal */}
      <TierDetailsModal
        open={tierDetailsOpen}
        onClose={() => setTierDetailsOpen(false)}
        tier={mockUser.tier}
        expiry={mockUser.expiryDate}
        pointsToNextTier={1500} // Mock value
      />
    </div>
  );
}