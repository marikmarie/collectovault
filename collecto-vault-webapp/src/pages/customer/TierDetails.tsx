import { useEffect, useState } from "react";
import { X, Briefcase, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom"; 
import { customerService } from "../../api/customer";

interface TierDetailsModalProps {
  open: boolean;
  onClose: () => void;
  tier: string;
  expiry: string;
  pointsToNextTier: number;
}

interface Benefit {
  id: string | number;
  title?: string;
  detail?: string;
  description?: string;
}

export default function TierDetails({ open, onClose, tier, expiry, pointsToNextTier }: TierDetailsModalProps) {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!open) return;

    const fetchBenefits = async () => {
      setLoading(true);
      try {
        // Try customer-specific endpoint for tier benefits
        const res = await customerService.getTierBenefits(undefined, tier);
        const data = res.data?.benefits ?? res.data ?? [];
        setBenefits(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("Failed to fetch tier benefits", err);
        setBenefits([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBenefits();
  }, [open, tier]);

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
              You are <span className="font-semibold">{pointsToNextTier.toLocaleString()}</span> points away from reaching the next tier level!
            </p>
          </div>
          
          {/* Benefits List */}
          <h3 className="text-lg font-semibold text-gray-800">Your Exclusive Privileges</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-6 text-sm text-gray-500">Loading benefits…</div>
            ) : benefits.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500">No benefits available for this tier.</div>
            ) : (
              benefits.map((benefit) => (
                <div key={String(benefit.id)} className="bg-white p-4 rounded-lg border border-gray-100 flex items-start gap-4">
                  <div className="p-2 rounded-full bg-[#cb0d6c]/10">
                    <Briefcase className="w-5 h-5 text-[#cb0d6c]" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{benefit.title ?? benefit.description}</p>
                    <p className="text-sm text-gray-500">{benefit.detail ?? benefit.description ?? ""}</p>
                  </div>
                </div>
              ))
            )}
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