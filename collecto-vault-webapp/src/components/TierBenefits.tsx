import { Briefcase, Plane, Zap } from "lucide-react";

interface TierBenefitsProps {
  tier: string;
  expiry: string;
  pointsToNextTier: number;
}

// Mock Benefits based on the existing "Blue" tier
const mockBenefits = [
  { 
    id: 1, 
    title: "Dedicated Relationship Manager", 
    detail: "Direct line access for priority support.", 
    icon: Briefcase 
  },
  { 
    id: 2, 
    title: "10% Earning Accelerator", 
    detail: "Bonus points on all travel and accommodation purchases.", 
    icon: Zap 
  },
  { 
    id: 3, 
    title: "Exclusive Upgrade Vouchers", 
    detail: "Two complimentary travel class upgrade vouchers annually.", 
    icon: Plane 
  },
];

export default function TierBenefits({ tier, expiry, pointsToNextTier }: TierBenefitsProps) {
  return (
    <div className="space-y-6">
      
      {/* Tier Status Card */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-[#f2d931]/50">
        <h3 className="text-xl font-extrabold text-[#cb0d6c] mb-2">
          Your {tier} Tier Status
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Status expires on: <span className="font-semibold text-gray-800">{expiry}</span>
        </p>

        {/* Progress Callout */}
        <div className="bg-blue-50/70 p-4 rounded-lg flex justify-between items-center border border-blue-100">
          <p className="text-sm font-medium text-blue-800">
            Keep up the great work! You need **{pointsToNextTier.toLocaleString()} more points** to reach the next tier.
          </p>
        </div>
      </div>
      
      {/* List of Benefits */}
      <div className="px-4 mb-3">
        <h3 className="text-lg font-semibold text-gray-800">
          Exclusive {tier} Tier Benefits
        </h3>
      </div>
      
      <div className="space-y-4">
        {mockBenefits.map((benefit) => {
          const Icon = benefit.icon;
          return (
            <div 
              key={benefit.id} 
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow"
            >
              <div className="p-2 rounded-full bg-[#cb0d6c]/10">
                <Icon className="w-5 h-5 text-[#cb0d6c]" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{benefit.title}</p>
                <p className="text-sm text-gray-500">{benefit.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}