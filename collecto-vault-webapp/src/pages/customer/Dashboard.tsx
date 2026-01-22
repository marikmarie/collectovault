import { useState, useEffect } from "react";
import Header from "../../components/Header";
import TierProgress from "../../components/TierProgress";
import TopNav from "../../components/TopNav";
import ServicesList from "../../components/ServicesList";
import BuyPoints from "../customer/BuyPoints";
import SpendPointsModal from "./SpendPoints";
import TierDetailsModal from "./TierDetails";
import Slider from "../../components/Slider";
import { X } from "lucide-react";
import { customerService } from "../../api/customer";
import { mockUser } from "../../data/mockUser";

type TabType = "points" | "tier";

interface RedeemableOffer {
  id: string;
  title: string;
  desc?: string;
  pointsCost: number;
}

// Dummy redeemable offers fallback
const DUMMY_OFFERS: RedeemableOffer[] = [
  {
    id: "offer_1",
    title: "10% Discount on Next Purchase",
    desc: "Get 10% off your next purchase over 15%",
    pointsCost: 500,
  },
  {
    id: "offer_2",
    title: "Free concert ticket",
    desc: "Redeem for a free ticket to a local concert event",
    pointsCost: 250,
  },
  {
    id: "offer_3",
    title: "Exclusive Member Offer",
    desc: "Special discount available only to tier members",
    pointsCost: 1000,
  },
];

interface UserProfile {
  name?: string;
  phone?: string;
  avatar?: string;
  avatarsize?: number;
  expiryDate?: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("tier");
  // Initialize user with any name stored at login and sensible defaults
  const [user] = useState<UserProfile>(() => ({
    name: localStorage.getItem("userName") ?? undefined,
    phone: undefined,
    avatar: "/photo.png",
    avatarsize: 120,
    expiryDate: undefined,
  }));

  // Customer data from API (points, tier, progress)
  const [pointsBalance, setPointsBalance] = useState<number>(0);
  const [tier, setTier] = useState<string>("N/A");
  const [tierProgress, setTierProgress] = useState<number>(0);

  const [buyPointsOpen, setBuyPointsOpen] = useState<boolean>(false);
  const [spendPointsOpen, setSpendPointsOpen] = useState<boolean>(false);
  const [tierDetailsOpen, setTierDetailsOpen] = useState<boolean>(false);

  const [selectedRedeemOffer, setSelectedRedeemOffer] =
    useState<RedeemableOffer | null>(null);

  // Offers state
  const [redeemableOffers, setRedeemableOffers] = useState<RedeemableOffer[]>(
    []
  );
  const [offersLoading, setOffersLoading] = useState<boolean>(false);

  // Recent points activity (ascending order)
  interface LedgerItem {
    id: string;
    date: string;
    desc: string;
    change: number;
  }
  const [recentPoints, setRecentPoints] = useState<LedgerItem[]>([]);

  useEffect(() => {
    const fetchPointsAndTier = async () => {
      try {
        const clientId = localStorage.getItem("clientId");
        if (!clientId) {
          console.warn("No clientId found in localStorage");
          return;
        }

        // Fetch customer data including points and tier
        const res = await customerService.getCustomerData(clientId);
        const data = res.data?.data ?? res.data;

        if (data) {
          setPointsBalance(data.pointsBalance || 0);
          setTier(data.tier || "N/A");
          setTierProgress(data.tierProgress || 0);
        }
      } catch (err) {
        console.warn("Failed to fetch customer points and tier", err);
      }
    };

    const fetchOffers = async () => {
      setOffersLoading(true);
      try {
        const res = await customerService.getRedeemableOffers();
        const offers = res.data?.offers ?? res.data ?? [];

        // Use dummy offers if no offers found
        if (!Array.isArray(offers) || offers.length === 0) {
          console.warn("No offers from API, using dummy offers");
          setRedeemableOffers(DUMMY_OFFERS);
        } else {
          setRedeemableOffers(offers);
        }
      } catch (err) {
        console.warn(
          "Failed to fetch redeemable offers, using dummy offers",
          err
        );
        setRedeemableOffers(DUMMY_OFFERS);
      } finally {
        setOffersLoading(false);
      }
    };

    // Fetch tier and offers data
    fetchPointsAndTier();
    fetchOffers();
  }, []);

  // Load recent points activity from mock data (ascending by date)
  useEffect(() => {
    const ledger = (mockUser.ledger ?? []).slice();
    ledger.sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setRecentPoints(ledger as any);
  }, []);

  const handleViewRedeemOffer = (offer: RedeemableOffer) => {
    setSelectedRedeemOffer(offer);
  };

  const handleSpendFromDetails = () => {
    setSelectedRedeemOffer(null);
    setSpendPointsOpen(true);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-[#faf9f7] font-sans">
      <TopNav />
      <Header
        name={user.name ?? localStorage.getItem("userName") ?? "User"}
        phone={user.phone ?? ""}
        avatar={user.avatar ?? "/photo.png"}
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
              {pointsBalance.toLocaleString()}
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
              {tier}
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
                  className="text-sm font-semibold px-5 py-2 rounded-full border border-gray-300 bg-white text-(btn-text) shadow-sm hover:(--btn-hover-bg) active:scale-95 transition-all"
                >
                  Spend Points
                </button>
                <button
                  onClick={() => setBuyPointsOpen(true)}
                  className="text-sm font-semibold px-5 py-2 rounded-full border border-gray-300 bg-(--btn-bg) text-(--btn-text) shadow-md hover:bg-(--btn-hover-bg) active:scale-95 transition-all"
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
                currentTier={tier}
                progress={tierProgress}
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

              <div className="px-4 pb-4">
                {offersLoading ? (
                  <div className="text-center py-6 text-sm text-gray-500">
                    Loading offers…
                  </div>
                ) : redeemableOffers.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-500">
                    No redeemable offers found.
                  </div>
                ) : (
                  <Slider
                    slides={redeemableOffers.map((offer) => ({
                      key: offer.id,
                      node: (
                        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-2 h-full flex flex-col justify-between">
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">
                              {offer.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {offer.desc}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="text-xs text-gray-700 font-semibold">
                              {offer.pointsCost.toLocaleString()} pts
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewRedeemOffer(offer)}
                                className="text-[10px] px-2 py-1 rounded-full bg-[#f0eced] hover:bg-[#e6dfe3] text-gray-800 font-medium"
                              >
                                View
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedRedeemOffer(offer);
                                }}
                                disabled={
                                  pointsBalance < offer.pointsCost
                                }
                                className={`text-[10px] px-2 py-1 rounded-full font-semibold transition-all ${
                                  pointsBalance >= offer.pointsCost
                                    ? "bg-[#ef4155] text-white hover:bg-[#cb0d6c]"
                                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                }`}
                              >
                                Redeem
                              </button>
                            </div>
                          </div>
                        </div>
                      ),
                    }))}
                    height="h-32"
                    className="pb-1"
                  />
                )}

                {/* Recent Points Activity (ascending) */}
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-800">
                    Recent Points Activity
                  </h4>
                  <div className="mt-3 space-y-3">
                    {recentPoints.length === 0 ? (
                      <div className="text-sm text-gray-500">
                        No recent points activity.
                      </div>
                    ) : (
                      recentPoints.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white p-3 rounded-lg border border-gray-100 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium text-gray-800">
                              {item.desc}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(item.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div
                            className={`font-black ${
                              item.change > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {item.change > 0 ? "+" : ""}
                            {item.change.toLocaleString()} pts
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
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
        onSuccess={(details) => {
          const added =
            typeof details?.addedPoints === "number" ? details.addedPoints : 0;
          if (added > 0) {
            setPointsBalance((prev) => prev + added);

            setRecentPoints((prev) => [
              ...prev,
              {
                id: `tx_${Date.now()}`,
                date: new Date().toISOString(),
                desc: "Bought points",
                change: added,
              },
            ]);
          }
          // Do not auto-close modal here so user can see the success message and then close manually
        }}
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
        expiry={user.expiryDate ?? ""}
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
                  pointsBalance < selectedRedeemOffer.pointsCost
                }
                className={`flex-1 text-sm font-semibold px-4 py-2 rounded-full transition-all ${
                  pointsBalance >= selectedRedeemOffer.pointsCost
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
