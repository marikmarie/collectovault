import { useState, useEffect } from "react";
import Header from "../../components/Header";
import TierProgress from "../../components/TierProgress";
import TopNav from "../../components/TopNav";
import ServicesList from "../../components/ServicesList";
import BuyPoints from "../customer/BuyPoints";
import SpendPointsModal from "./SpendPoints";
import TierDetailsModal from "./TierDetails";
// Added CheckCircle, Clock for status icons
import { X } from "lucide-react";
import { customerService } from "../../api/customer";


type TabType = "points" | "tier";

interface RedeemableOffer {
  id: string;
  title: string;
  desc?: string;
  pointsCost: number;
}



interface UserProfile {
  name?: string;
  phone?: string;
  avatar?: string;
  pointsBalance?: number;
  avatarsize?: number;
  tier?: string;
  tierProgress?: number;
  expiryDate?: string;
  invoicesCount?: number;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("tier");
  // Initialize user with any name stored at login and sensible defaults
  const [user, setUser] = useState<UserProfile>(() => ({
    name: localStorage.getItem('userName') ?? undefined,
    phone: undefined,
    avatar: '/photo.png',
    pointsBalance: 0,
    avatarsize: 120,
    tier: undefined,
    tierProgress: 0,
    expiryDate: undefined,
    invoicesCount: 0,
  }));

  const [buyPointsOpen, setBuyPointsOpen] = useState<boolean>(false);
  const [spendPointsOpen, setSpendPointsOpen] = useState<boolean>(false);
  const [tierDetailsOpen, setTierDetailsOpen] = useState<boolean>(false);

const [selectedRedeemOffer, setSelectedRedeemOffer] =
    useState<RedeemableOffer | null>(null);

  // Offers state
  const [redeemableOffers, setRedeemableOffers] = useState<RedeemableOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await customerService.getProfile();
        const profile = res.data ?? {};
        setUser((prev) => ({ ...prev, ...profile }));
      } catch (err) {
        console.warn("Failed to fetch profile", err);
      }
    };

    const fetchOffers = async () => {
      setOffersLoading(true);
      try {
        const res = await customerService.getRedeemableOffers();
        setRedeemableOffers(res.data?.offers ?? res.data ?? []);
      } catch (err) {
        console.warn("Failed to fetch redeemable offers", err);
        setRedeemableOffers([]);
      } finally {
        setOffersLoading(false);
      }
    };

    // Start by refreshing profile (which may provide counts/points) then fetch other resources
    fetchProfile();
    fetchOffers();
  }, []);

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
        name={user.name ?? localStorage.getItem('userName') ?? 'User'}
        phone={user.phone ?? ''}
        avatar={user.avatar ?? '/photo.png'}
        useVideo={false}
        onAvatarFileChange={() => {}}
      />

      <main className="px-0">
        {/* --- TABS SECTION --- */}
       
        <div className="bg-white shadow-lg flex divide-x divide-gray-100">
          {/* TAB 1: POINTS */}
          <button
            onClick={() => setActiveTab("points")}
            className={`flex-1 py-4 flex flex-col items-center justify-center relative transition-colors ${
              activeTab === "points" ? "bg-white" : "bg-gray-50/50"
            }`}
          >
            <span className="text-3xl text-gray-800 font-light tracking-tight">
              {(user.pointsBalance ?? 0).toLocaleString()}
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
              {user.tier ?? 'N/A'}
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
          {/* Action Buttons (Points tab only) */}
          <div className="flex items-center justify-end mb-4 gap-3">
            {activeTab === "points" && (
              <>
                <button
                  onClick={() => setSpendPointsOpen(true)}
                  className="text-sm font-semibold px-5 py-2 rounded-full border border-gray-300 bg-white text-(btn-) shadow-sm hover:(--btn-hover-bg) active:scale-95 transition-all"
                >
                  Spend Points
                </button>
                <button
                  onClick={() => setBuyPointsOpen(true)}
                  className="text-sm font-semibold px-5 py-2 rounded-full bg-(--btn-bg) text-(--btn-text) shadow-md shadow-[#ef4155]/30 hover:bg-(--btn-hover-bg) active:scale-95 transition-all"
                >
                  Buy Points
                </button>
              </>
            )}
          </div>

          {/* Tier Progress (Tier tab only) */}
          <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
            {activeTab === "tier" && (
              <TierProgress
                currentTier={user.tier ?? 'N/A'}
                progress={user.tierProgress ?? 0}
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
                  Redeemable Offers
                </h3>
              </div>
              <div className="space-y-4 px-4 pb-20">
                {offersLoading ? (
                  <div className="text-center py-6 text-sm text-gray-500">Loading offers…</div>
                ) : redeemableOffers.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-500">No redeemable offers found.</div>
                ) : (
                  redeemableOffers.map((offer, index) => (
                    <div
                      key={offer.id}
                      className="overflow-hidden flex items-center bg-white rounded-lg shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">
                          {index + 1}. {offer.title}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {offer.desc}
                        </div>
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
                  ))
                )}
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
                  <button
                    type="button"
                    className="text-lg font-semibold text-gray-900 w-full py-2"
                  >
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
      <BuyPoints
        open={buyPointsOpen}
        onClose={() => setBuyPointsOpen(false)}
        onSuccess={() => {}}
      />

      <SpendPointsModal
        open={spendPointsOpen}
        onClose={() => setSpendPointsOpen(false)}
        currentPoints={user.pointsBalance ?? 0}
      />

      <TierDetailsModal
        open={tierDetailsOpen}
        onClose={() => setTierDetailsOpen(false)}
        tier={user.tier ?? 'N/A'}
        expiry={user.expiryDate ?? ''}
        pointsToNextTier={1500}
      />


      {/* --- REDEEM OFFER MODAL --- */}
      {selectedRedeemOffer && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedRedeemOffer(null)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-bold text-gray-800">
                Redeem Offer Details
              </h4>
              <button
                onClick={() => setSelectedRedeemOffer(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="font-semibold text-gray-900">
              {selectedRedeemOffer.title}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              {selectedRedeemOffer.desc}
            </p>

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
                disabled={

                  (user.pointsBalance ?? 0) < selectedRedeemOffer.pointsCost
                }
                className={`flex-1 text-sm font-semibold px-4 py-2 rounded-full transition-all ${
                  (user.pointsBalance ?? 0) >= selectedRedeemOffer.pointsCost
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

