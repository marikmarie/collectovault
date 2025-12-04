import { useState } from "react";
import Header from "../../components/Header";
import Slider from "../../components/Slider";
import PointsCard from "../../components/PointsCard";
import TierProgress from "../../components/TierProgress";
import OfferCard from "../../components/OfferCard";
import BottomNav from "../../components/BottomNav";
import TopNav from "../../components/TopNav";
import ServicesList from "../../components/ServicesList";
import BuyPoints from "../customer/BuyPoints";


const mockUser = {
  name: "Mariam Tukasingura",
  phone: "721 695 645",
  avatar: "/images/avatar-placeholder.jpg",
  pointsBalance: 4500,
  tier: "Blue",
  tierProgress: 0.12,
  expiryDate: "30 Apr 2027",
};

export default function Dashboard() {
  // 0 = Points (default), 1 = Tier
  const [activeSlide, setActiveSlide] = useState<number>(0);

  // Modal state
  const [buyPointsOpen, setBuyPointsOpen] = useState<boolean>(false);

  const slides = [
    {
      key: "points",
      node: (
        <PointsCard
          points={mockUser.pointsBalance}
          tier={mockUser.tier}
          expiry={mockUser.expiryDate}
        />
      ),
    },
    {
      key: "tier",
      node: (
        <TierProgress
          currentTier={mockUser.tier}
          progress={mockUser.tierProgress}
        />
      ),
    },
  ];

  const labelText = activeSlide === 0 ? "Points" : "Tier";

  return (
    <div className="page-with-bottomnav min-h-screen pb-6 bg-gray-50 antialiased">
      {/* Desktop: top nav */}
      <div className="hidden md:block">
        <TopNav />
      </div>

      <Header
        name={mockUser.name}
        phone={mockUser.phone}
        avatar={mockUser.avatar}
        useVideo={true}
        useTexture={false}
      />

      <main className="pt-2 px-0">
        {/* label and small controls */}
        <div className="px-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Overview</div>
            <div className="text-lg font-semibold">{labelText}</div>
          </div>

          <div>
            <button
              onClick={() => setBuyPointsOpen(true)} // <-- OPEN MODAL
              className="text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white/60 shadow-sm"
            >
              Buy Points
            </button>
          </div>
        </div>

        <div className="mt-2">
          <Slider
            slides={slides}
            initialIndex={0}
            height="h-48"
            onChange={(i) => setActiveSlide(i)}
          />
        </div>

        <div className="mt-4">
          {activeSlide === 0 ? (
            <>
              <div className="px-4 mb-2">
                <h3 className="text-lg font-semibold">Redeemable offers</h3>
              </div>

              <OfferCard
                title="Spend now"
                subtitle="Use your points on exclusive offers"
                img="/images/offer-1.jpg"
              />
              <OfferCard
                title="Weekend hotel discount"
                subtitle="Redeem points for 20% off"
                img="/images/offer-2.jpg"
              />
            </>
          ) : (
            <>
              <div className="px-4 mb-2">
                <h3 className="text-lg font-semibold">Earn points from</h3>
              </div>

              <ServicesList />
            </>
          )}
        </div>
      </main>

      {/* Mobile bottom nav only */}
      <div className="md:hidden">
        <BottomNav />
      </div>

      {/* ------------------------- */}
      {/* Buy Points Modal */}
      {/* ------------------------- */}
      <BuyPoints
        open={buyPointsOpen}
        onClose={() => setBuyPointsOpen(false)}
        onSuccess={() => {
          // later you can refresh user points here
        }}
      />
    </div>
  );
}
