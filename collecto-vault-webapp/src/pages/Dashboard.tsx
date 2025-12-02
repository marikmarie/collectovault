//import React from "react";
import Header from "../components/Header";
import PointsCard from "../components/PointsCard";
import TierProgress from "../components/TierProgress";
import OfferCard from "../components/OfferCard";
import BottomNav from "../components/BottomNav";
import { mockUser } from "../data/mockUser";

export default function Dashboard() {
  const user = mockUser;

  return (
    <div className="pb-20 min-h-screen">
      <Header name={user.name} phone={user.phone} avatar={user.avatar} />
      <main className="pt-2">
        <PointsCard points={user.pointsBalance} tier={user.tier} expiry={user.expiryDate} />
        <TierProgress currentTier={user.tier} progress={user.tierProgress} />
        <div className="px-4">
          <h3 className="text-lg font-semibold">Explore offers</h3>
        </div>
        <OfferCard title="Spend now" subtitle="Use your points on exclusive offers" img="/images/offer-1.jpg" />
        <OfferCard title="Achieve Silver" subtitle="Earn 25,000 Tier Miles" img="/images/offer-2.jpg" />
      </main>

      <BottomNav />
    </div>
  );
}
