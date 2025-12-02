// import React from "react";
import Header from "../components/Header";
import Slider from "../components/Slider";
import PointsCard from "../components/PointsCard";
import TierProgress from "../components/TierProgress";
import OfferCard from "../components/OfferCard";
import BottomNav from "../components/BottomNav";

const mockUser = {
  name: "Kwikiriza Samson",
  phone: "721 695 645",
  avatar: "/images/avatar-placeholder.jpg",
  pointsBalance: 4200,
  tier: "Blue",
  tierProgress: 0.12,
  expiryDate: "30 Apr 2027"
};

export default function Dashboard() {
  const slides = [
    { key: "points", node: <PointsCard points={mockUser.pointsBalance} tier={mockUser.tier} expiry={mockUser.expiryDate} /> },
    { key: "tier", node: <TierProgress currentTier={mockUser.tier} progress={mockUser.tierProgress} /> }
  ];

  return (
    <div className="page-with-bottomnav min-h-screen pb-6 bg-gray-50">
      <Header name={mockUser.name} phone={mockUser.phone} avatar={mockUser.avatar} useVideo={true} useTexture={false} />
      <main className="pt-2">
        <Slider slides={slides} height="h-48" />
        <div className="px-4 mt-4">
          <h3 className="text-lg font-semibold">Explore offers</h3>
        </div>
        <OfferCard title="Spend now" subtitle="Use your points on exclusive offers" img="/images/offer-1.jpg" />
        <OfferCard title="Achieve Silver" subtitle="Earn 25,000 Tier Miles" img="/images/offer-2.jpg" />
      </main>

      <BottomNav />
    </div>
  );
}
