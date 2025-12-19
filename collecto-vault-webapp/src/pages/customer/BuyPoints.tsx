import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import Modal from "../../components/Modal";
import Card from "../../components/Card";
import Button from "../../components/Button";
import api from "../../api"; // Your axios instance
import { Zap, Heart, Star, X, Loader2 } from 'lucide-react';

/* =======================
   Types
======================= */

type Package = {
  id: number | string;
  points: number;
  price: number;
  label?: string;
  recommended?: boolean;
};

// Interface to match your Backend Controller response
interface ApiPackage {
  id: number;
  name: string;
  pointsAmount: number;
  price: number;
  isPopular: boolean;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type ModalStep = "select" | "confirm" | "success" | "failure";

/* =======================
   Styling Constants
======================= */
const PRIMARY = '#d81b60'; 
const ACCENT = '#ffa727';  
//const SOFT_BG = '#fffcf7'; 

export default function BuyPointsModal({ open, onClose, onSuccess }: Props): JSX.Element {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const selectedPackage = packages.find(p => String(p.id) === String(selectedId));
  
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<"momo" | "bank">("momo");
  const [phone, setPhone] = useState<string>("");
  const [step, setStep] = useState<ModalStep>("select");

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  /* ---- Load Real Data from API ---- */
  useEffect(() => {
    if (!open) return;

    const fetchActivePackages = async () => {
      try {
        setLoadingPackages(true);
        const res = await api.get("/vaultPackages");
        // Map API fields (pointsAmount -> points, isPopular -> recommended)
        const apiData: ApiPackage[] = res.data?.data ?? [];
        const mapped = apiData.map(pkg => ({
          id: pkg.id,
          points: pkg.pointsAmount,
          price: pkg.price,
          recommended: pkg.isPopular,
          label: pkg.name
        }));
        setPackages(mapped);
      } catch (err) {
        console.error("Failed to load packages", err);
        setError("Could not load packages. Please try again later.");
      } finally {
        setLoadingPackages(false);
      }
    };

    // Reset UI State
    setError(null);
    setSelectedId(null);
    setPaymentMode("momo");
    setPhone("");
    setStep("select");
    fetchActivePackages();
    
    requestAnimationFrame(() => scrollerRef.current?.scrollTo({ left: 0 }));
  }, [open]);

  /* ---- Navigation Helpers ---- */
  const scrollNext = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    el.scrollBy({ left: (card?.offsetWidth ?? 200) + 16, behavior: "smooth" });
  };

  const scrollPrev = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    el.scrollBy({ left: -((card?.offsetWidth ?? 200) + 16), behavior: "smooth" });
  };

  const handleProceed = () => {
    setError(null);
    if (!selectedId) {
      setError("Please select a package.");
      return;
    }
    if (paymentMode === "momo" && (!phone || phone.trim().length < 10)) {
      setError("Enter a valid phone number (e.g., 077...)");
      return;
    }
    setStep("confirm");
  };

  /* ---- Real Payment Call ---- */
  const handleConfirmPayment = async () => {
    if (!selectedPackage) return;
    setProcessing(true);
    setError(null);

    try {
      // Replace this URL with your actual payment initiation endpoint
      await api.post("/transactions/buy-points", {
        packageId: selectedPackage.id,
        phoneNumber: phone,
        paymentMethod: paymentMode,
      });

      setStep("success");
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || "Payment initiation failed. Please try again.");
      setStep("failure");
    } finally {
      setProcessing(false);
    }
  };

  // --- UI Content ---
  let content;

  if (step === "select") {
    content = (
      <>
        <div className="mt-6 relative">
          <button onClick={scrollPrev} className="hidden md:inline-flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md">‹</button>

          <div ref={scrollerRef} className="flex gap-4 overflow-x-auto scrollbar-hidden py-4 px-1" style={{ scrollSnapType: "x mandatory" }}>
            {loadingPackages ? (
              <div className="w-full py-10 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm">Fetching bundles...</p>
              </div>
            ) : packages.map((p) => {
              const isSel = String(selectedId) === String(p.id);
              return (
                <div key={String(p.id)} data-card onClick={() => setSelectedId(p.id)} className="min-w-[200px] shrink-0 snap-start relative outline-none">
                  <Card className={`relative flex flex-col justify-between h-full p-5 cursor-pointer transition-all duration-200 bg-white border-2 rounded-xl ${isSel ? `border-[${PRIMARY}] ring-4 ring-[${PRIMARY}]/20 shadow-xl scale-[1.03]` : "border-slate-100 hover:border-slate-300 hover:shadow-lg"}`}>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-yellow-500" /> {p.label || 'Package'}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-slate-900">{p.points.toLocaleString()}</span>
                        <span className="text-sm font-medium text-slate-500">pts</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
                      <div className="flex justify-between items-end">
                        <span className="text-xs text-slate-400">Price</span>
                        <span className={`text-xl font-bold ${isSel ? `text-[${PRIMARY}]` : 'text-slate-700'}`}>
                          {p.price.toLocaleString()} <span className="text-sm font-normal text-slate-400">UGX</span>
                        </span>
                      </div>
                    </div>
                    {isSel && <div className={`absolute top-3 right-3 text-[${PRIMARY}]`}><Heart className="w-6 h-6 fill-current" /></div>}
                  </Card>
                  {p.recommended && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 bg-[${ACCENT}] text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-lg z-10 uppercase flex items-center gap-1`}>
                      <Star className="w-3 h-3 fill-white" /> Recommended
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={scrollNext} className="hidden md:inline-flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md">›</button>
        </div>

        <div className="mt-6 space-y-4">
          {error && <p className="text-xs text-red-500 font-medium">⚠️ {error}</p>}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">Payment Method</label>
            <div className="flex gap-3">
              <button onClick={() => setPaymentMode("momo")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all ${paymentMode === "momo" ? `bg-[${PRIMARY}]/10 border-[${PRIMARY}] text-[${PRIMARY}] shadow-sm` : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                <span>📱</span> Mobile Money
              </button>
              <button disabled className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60">
                <span>🏦</span> Bank (Soon)
              </button>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">MoMo Number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#d81b60] outline-none" />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
           <Button variant="ghost" onClick={onClose} disabled={processing}>Cancel</Button>
           <Button onClick={handleProceed} disabled={!selectedId || loadingPackages} className="bg-[#d81b60] text-white">Continue</Button>
        </div>
      </>
    );
  } else if (step === "confirm") {
    content = (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-yellow-100 text-[#ffa727] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">⚠️</div>
        <h4 className="text-xl font-bold text-slate-900">Check your phone</h4>
        <p className="text-slate-600 mt-2 max-w-sm mx-auto">
          Approve the UGX <span className="font-bold">{selectedPackage?.price.toLocaleString()}</span> request sent to <span className="font-semibold text-slate-900">{phone}</span>.
        </p>
        <div className="mt-8 space-y-3">
          <Button onClick={handleConfirmPayment} className="w-full justify-center bg-[#d81b60] text-white" disabled={processing}>
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "I have approved it"}
          </Button>
          <button onClick={() => setStep("select")} className="text-sm text-slate-500 underline">Change details</button>
        </div>
      </div>
    );
  } else if (step === "success") {
    content = (
      <div className="text-center py-6 animate-in zoom-in-95">
        <div className="w-16 h-16 bg-pink-100 text-[#d81b60] rounded-full flex items-center justify-center mx-auto mb-4"><Heart className="w-8 h-8 fill-current" /></div>
        <h4 className="text-xl font-bold text-slate-900">Top Up Successful!</h4>
        <p className="text-slate-600 mt-2">Added <span className="text-2xl font-black text-[#d81b60]">{selectedPackage?.points.toLocaleString()}</span> pts to your wallet.</p>
        <Button onClick={onClose} className="w-full mt-8 bg-[#d81b60] text-white">Back to Dashboard</Button>
      </div>
    );
  } else if (step === "failure") {
    content = (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><X className="w-8 h-8" /></div>
        <h4 className="text-xl font-bold text-red-900">Payment Failed</h4>
        <p className="text-slate-600 mt-2">{error}</p>
        <div className="mt-8 flex gap-3">
           <Button variant="ghost" onClick={onClose} className="flex-1">Close</Button>
           <Button onClick={() => setStep("select")} className="flex-1 bg-[#d81b60] text-white">Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <Modal open={open} onClose={() => !processing && onClose()}>
      <div className="bg-[#fffcf7] w-full max-w-lg mx-auto rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h3 className="text-lg font-bold text-slate-800">Buy Points</h3>
          </div>
          <button onClick={onClose} className="text-slate-400">✕</button>
        </div>
        <div className="p-6">{content}</div>
      </div>
    </Modal>
  );
}