import { useEffect, useState } from "react";
import { X, Gift } from "lucide-react";
import { customerService } from "../../api/customer";
import { transactionService } from "../../api/collecto";

interface SpendPointsModalProps {
  open: boolean;
  onClose: () => void;
  currentPoints: number;
}

interface Offer {
  id: string | number;
  title?: string;
  name?: string;
  desc?: string;
  detail?: string;
  pointsCost?: number;
}

export default function SpendPoints({ open, onClose, currentPoints }: SpendPointsModalProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [redeemingId, setRedeemingId] = useState<string | number | null>(null);

  useEffect(() => {
    if (!open) return;

    const fetchOffers = async () => {
      setLoading(true);
      try {
        const res = await customerService.getRedeemableOffers();
        const data = res.data?.offers ?? res.data ?? [];
        setOffers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("Failed to fetch redeemable offers", err);
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [open]);

  const handleRedeem = async (offer: Offer) => {
    const offerId = offer.id;
    setRedeemingId(offerId);
    const pts = offer.pointsCost ?? (offer as any).points ?? (offer as any).cost ?? 0;
    try {
      await transactionService.redeemPoints("me", { offerId });
      alert(`Redeemed ${pts} points for ${offer.title ?? offer.name}`);
      // Optionally close modal after redeem
      onClose();
    } catch (err: any) {
      const msg = err?.message || err?.error || "Failed to redeem";
      alert(msg);
    } finally {
      setRedeemingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Redeem Points</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-gray-700">
              Your Current Balance: <span className="text-lg font-extrabold text-[#ffa727]">{currentPoints.toLocaleString()}</span> points
            </p>
          </div>

          <h3 className="text-md font-semibold text-gray-700 mb-3">Available Rewards</h3>
          
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {loading ? (
              <div className="text-center py-6 text-sm text-gray-500">Loading offers…</div>
            ) : offers.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500">No redeemable offers available.</div>
            ) : (
              offers.map((offer) => {
                const points = offer.pointsCost ?? (offer as any).points ?? (offer as any).cost ?? 0;
                const title = offer.title ?? offer.name ?? "Offer";
                const desc = offer.desc ?? offer.detail ?? "";
                const idKey = String(offer.id);

                return (
                  <div key={idKey} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-100">
                    <div className="flex items-center gap-3">
                      <Gift className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">{title}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </div>
                    <button 
                      disabled={(currentPoints ?? 0) < points || redeemingId === offer.id}
                      className={`text-sm font-semibold px-4 py-2 rounded-full transition-all ${
                        (currentPoints ?? 0) >= points && redeemingId !== offer.id
                          ? "bg-[#cb0d6c] text-white hover:bg-[#ef4155]"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                      onClick={() => handleRedeem(offer)}
                    >
                      {redeemingId === offer.id ? "Processing…" : `${points.toLocaleString()} pts`}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-full text-gray-600 hover:bg-gray-100">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}