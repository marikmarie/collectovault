import { useState } from "react";
import Header from "../../components/Header";
import TierProgress from "../../components/TierProgress";
import TopNav from "../../components/TopNav";
import ServicesList from "../../components/ServicesList";
import BuyPoints from "../customer/BuyPoints";


const mockUser = {
  name: "Mariam Tukasingura",
  phone: "256721695 645",
  avatar: "/images/avatar-placeholder.jpg",
  pointsBalance: 5000,
  tier: "Blue",
  tierProgress: 0, 
  expiryDate: "30 Apr 2027",
};

type TabType = "points" | "tier";

export default function Dashboard() {
  // State to track which tab is active
  const [activeTab, setActiveTab] = useState<TabType>("tier"); 

  // Modal state
  const [buyPointsOpen, setBuyPointsOpen] = useState<boolean>(false);

  return (
    <div className="page-with-bottomnav min-h-screen pb-6 bg-gray-100 antialiased font-sans">
      <TopNav />
      <Header
        name={mockUser.name}
        phone={mockUser.phone}
        avatar={mockUser.avatar}
        useVideo={true}
        useTexture={false}
      />

      <main className="px-0">
     
        <div className="bg-white shadow-sm flex divide-x divide-gray-100">
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

            {/* Active Indicator Line */}
            {activeTab === "points" && (
              <div className="absolute bottom-0 w-full h-[3px] bg-red-600 animate-in fade-in zoom-in duration-200" />
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

            {/* Active Indicator Line */}
            {activeTab === "tier" && (
              <div className="absolute bottom-0 w-full h-[3px] bg-red-600 animate-in fade-in zoom-in duration-200" />
            )}
          </button>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        {/* Content changes based on activeTab */}
        <div className="mt-6 px-4">
        
          <div className="flex items-center justify-end mb-4">
            {activeTab === "points" && (
              <button
                onClick={() => setBuyPointsOpen(true)}
                className="text-sm font-medium px-5 py-2 rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
              >
                Buy Points
              </button>
            )}
          </div>

          {/* Render the specific card based on tab */}
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

              {/* REPLACED OfferCard components with a simple list/service component */}
              <div className="space-y-4 px-4">
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <p className="font-medium text-gray-900">
                    1. Spend your vacation on hotels
                  </p>
                  <p className="text-sm text-gray-500">
                    Redeem points for 20% off hotel stays.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <p className="font-medium text-gray-900">
                    2. Travel upgrades
                  </p>
                  <p className="text-sm text-gray-500">
                    Use your points to upgrade your next travel.
                  </p>
                </div>
                {/* Add more plain service items here */}
              </div>
            </>
          ) : (
            <>
              <div className="px-4 mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  Tier Benefits
                </h3>
              </div>
              {/* Assuming ServicesList or a BenefitsList goes here for Tier view */}
              <div className="px-4 bg-white py-4 mx-4 rounded-lg border border-gray-100 shadow-sm text-center">
                <button className="text-lg font-semibold text-gray-900 w-full py-2">
                  See your benefits
                </button>
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

      {/* Buy Points Modal */}
      <BuyPoints
        open={buyPointsOpen}
        onClose={() => setBuyPointsOpen(false)}
        onSuccess={() => {
          // logic to refresh points
        }}
      />
    </div>
  );
}
