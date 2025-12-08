import { X, Briefcase, Plane, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom"; // Assumes react-router-dom is used for the Earn link

interface TierDetailsModalProps {
  open: boolean;
  onClose: () => void;
  tier: string;
  expiry: string;
  pointsToNextTier: number;
}

// Mock Benefits (matching the previous component structure)
const mockBenefits = [
  { id: 1, title: "Dedicated Relationship Manager", detail: "Direct line access for priority support.", icon: Briefcase },
  { id: 2, title: "10% Earning Accelerator", detail: "Bonus points on all travel and accommodation purchases.", icon: Zap },
  { id: 3, title: "Exclusive Upgrade Vouchers", detail: "Two complimentary travel class upgrade vouchers annually.", icon: Plane },
];

export default function TierDetails({ open, onClose, tier, expiry, pointsToNextTier }: TierDetailsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">{tier} Tier Benefits</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Status & Progress */}
          <div className="bg-blue-50/70 p-4 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-800">
              Status Expiry: <span className="font-semibold">{expiry}</span>
            </p>
            <p className="mt-2 text-sm text-gray-700">
              You are **{pointsToNextTier.toLocaleString()} points** away from reaching the next tier level!
            </p>
          </div>
          
          {/* Benefits List */}
          <h3 className="text-lg font-semibold text-gray-800">Your Exclusive Privileges</h3>
          <div className="space-y-4">
            {mockBenefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.id} className="bg-white p-4 rounded-lg border border-gray-100 flex items-start gap-4">
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

        {/* Footer with Action Buttons */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center">
          <button 
            onClick={onClose} 
            className="text-sm font-medium px-4 py-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          
          <Link 
            to="/servicelist" // Navigate to the Services page for earning
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full bg-[#ffa727] text-white hover:bg-[#f2d931] transition-colors shadow-md shadow-[#ffa727]/30"
          >
            Start Earning Points <ArrowRight className="w-4 h-4"/>
          </Link>
        </div>
      </div>
    </div>
  );
}