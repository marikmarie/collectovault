// src/features/customer/BuyPointsModal.tsx
import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
// Assuming Modal, Card, and Button are imported from elsewhere
import Modal from "../../components/Modal"; 
import Card from "../../components/Card";
import Button from "../../components/Button";
import { Zap, Heart, Star, X } from 'lucide-react'; // Added icons for flair

type Package = {
  id: number | string;
  points: number;
  price: number;
  label?: string;
  recommended?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

/** Example fallback packages (Points and prices remain the same) */
const FALLBACK_PACKAGES: Package[] = [
  { id: "p1", points: 100, price: 5000 },
  { id: "p2", points: 500, price: 10000, recommended: true },
  { id: "p3", points: 2500, price: 25000 },
  { id: "p4", points: 5000, price: 45000 },
];

type ModalStep = "select" | "confirm" | "success" | "failure";

// Cute Color Palette:
const PRIMARY = '#d81b60'; // Bright Magenta (from your previous service list)
const ACCENT = '#ffa727';  // Gold/Orange (from your gradient)
const SOFT_BG = '#fffcf7'; // Off-white/Cream background

export default function BuyPointsModal({ open, onClose, onSuccess }: Props): JSX.Element {
  const [packages, setPackages] = useState<Package[]>(FALLBACK_PACKAGES);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const selectedPackage = packages.find(p => String(p.id) === String(selectedId));
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<"momo" | "bank">("momo");
  const [phone, setPhone] = useState<string>("");
  const [step, setStep] = useState<ModalStep>("select");

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSelectedId(null);
    setPaymentMode("momo");
    setPhone("");
    setPackages(FALLBACK_PACKAGES);
    setStep("select");
    requestAnimationFrame(() => scrollerRef.current?.scrollTo({ left: 0 }));
  }, [open]);

  // Scrolling logic (unchanged)
  const scrollNext = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const scrollAmount = (card?.offsetWidth ?? 200) + 16;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const scrollPrev = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const scrollAmount = (card?.offsetWidth ?? 200) + 16;
    el.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  const handleProceed = () => {
    setError(null);
    if (!selectedId) {
      setError("Please select a package.");
      return;
    }
    if (paymentMode === "momo" && (!phone || phone.trim().length < 9)) {
      setError("Enter a valid mobile money phone number.");
      return;
    }
    setStep("confirm");
  };

  const handleConfirmPayment = () => {
    if (!selectedPackage) return;
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      // Simulate 90% success rate
      if (Math.random() > 0.1) {
        setError(null);
        setStep("success");
        onSuccess?.();
      } else {
        setError("Payment failed. Please check your MoMo account and try again.");
        setStep("failure");
      }
    }, 2000);
  };

  // --- UI Content ---
  let content;

  if (step === "select") {
    content = (
      <>
        {/* Horizontal Card Scroller */}
        <div className="mt-6 relative">
          {/* Left Arrow (Styled with new colors) */}
          <button
            onClick={scrollPrev}
            className={`hidden md:inline-flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md text-slate-500 hover:text-[${PRIMARY}] hover:border-[${PRIMARY}]/50 transition`}
          >
            ‹
          </button>

          <div
            ref={scrollerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hidden py-4 px-1"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {packages.map((p) => {
              const isSel = String(selectedId) === String(p.id);
              return (
                <div
                  key={String(p.id)}
                  data-card
                  onClick={() => setSelectedId(p.id)}
                  className="min-w-[200px] shrink-0 snap-start relative outline-none"
                >
                  {/* Package Card (Styled for cute look) */}
                  <Card 
                    className={`
                      relative flex flex-col justify-between h-full p-5 cursor-pointer transition-all duration-200 
                      bg-white border-2 rounded-xl
                      ${isSel 
                        ? `border-[${PRIMARY}] ring-4 ring-[${PRIMARY}]/20 shadow-xl scale-[1.03]` 
                        : "border-slate-100 hover:border-slate-300 hover:shadow-lg"
                      }
                    `}
                  >
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-yellow-500" /> Package Power
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-slate-900">{p.points}</span>
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

                    {/* Checkmark Icon (Styled with new primary color) */}
                    {isSel && (
                      <div className={`absolute top-3 right-3 text-[${PRIMARY}]`}>
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                      </div>
                    )}
                  </Card>

                  {/* Recommended Badge (Styled with accent color) */}
                  {p.recommended && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 bg-[${ACCENT}] text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-lg z-10 whitespace-nowrap uppercase flex items-center gap-1`}>
                      <Star className="w-3 h-3 fill-white" /> Recommended
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Arrow (Styled with new colors) */}
          <button
            onClick={scrollNext}
            className={`hidden md:inline-flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md text-slate-500 hover:text-[${PRIMARY}] hover:border-[${PRIMARY}]/50 transition`}
          >
            ›
          </button>
        </div>

        {/* Payment & Inputs */}
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Payment Method</label>
            <div className="flex gap-3">
              <button
                onClick={() => setPaymentMode("momo")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all ${
                  paymentMode === "momo" 
                    ? `bg-[${PRIMARY}]/10 border-[${PRIMARY}] text-[${PRIMARY}] shadow-sm` 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>📱</span> Mobile Money
              </button>
              <button
                disabled
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60"
              >
                <span>🏦</span> Bank (Coming Soon)
              </button>
            </div>
          </div>

          {paymentMode === "momo" && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 07756890120"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[${PRIMARY}] focus:ring-1 focus:ring-[${PRIMARY}]/50 outline-none text-slate-900 placeholder:text-slate-400 bg-white"
              />
            </div>
          )}
        </div>

        {/* Footer Actions (Using PRIMARY color for main button) */}
        <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
           {/* Assume Button component supports dynamic color via style props or classes */}
           <Button variant="ghost" onClick={onClose} disabled={processing} className="text-slate-500 hover:bg-slate-100">Cancel</Button>
           <Button 
             onClick={handleProceed} 
             disabled={!selectedId || processing}
             className={`bg-[${PRIMARY}] text-white hover:bg-[#b81752]`}
           >
             {processing ? "Processing..." : "Continue"}
           </Button>
        </div>
      </>
    );
  } else if (step === "confirm") {
    content = (
      <div className="text-center py-6">
        <div className={`w-16 h-16 bg-yellow-100 text-[${ACCENT}] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl`}>
          ⚠️
        </div>
        <h4 className="text-xl font-bold text-slate-900">Confirm on your phone</h4>
        <p className="text-slate-600 mt-2 max-w-sm mx-auto">
          We've sent a prompt to <span className="font-semibold text-slate-900">{phone}</span>. 
          Please approve the payment of <span className={`font-semibold text-[${PRIMARY}]`}>UGX {selectedPackage?.price.toLocaleString()}</span>.
        </p>
        
        <div className="mt-8 space-y-3">
          <Button 
            onClick={handleConfirmPayment} 
            className={`w-full justify-center bg-[${PRIMARY}] text-white hover:bg-[#b81752]`} 
            disabled={processing}
          >
            {processing ? "Waiting for approval..." : "I have approved it"}
          </Button>
          <button 
            onClick={() => setStep("select")} 
            className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2"
          >
            Change phone number
          </button>
        </div>
      </div>
    );
  } else if (step === "success") {
    content = (
      <div className="text-center py-6">
        <div className={`w-16 h-16 bg-[${PRIMARY}]/20 text-[${PRIMARY}] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl`}>
          <Heart className="w-8 h-8 fill-current" />
        </div>
        <h4 className="text-xl font-bold text-slate-900">Points Added! 🎉</h4>
        <p className="text-slate-600 mt-2">
          You've successfully topped up with <br/>
          <span className="text-3xl font-extrabold text-[${PRIMARY}]">{selectedPackage?.points.toLocaleString()} pts</span>
        </p>
        <div className="mt-8">
           <Button 
             onClick={onClose} 
             className={`w-full justify-center bg-[${PRIMARY}] text-white hover:bg-[#b81752]`}
           >
             Continue to Dashboard
           </Button>
        </div>
      </div>
    );
  } else if (step === "failure") {
    content = (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          <X className="w-8 h-8" />
        </div>
        <h4 className="text-xl font-bold text-red-900">Oops! Payment Failed</h4>
        <p className="text-slate-600 mt-2">{error}</p>
        <div className="mt-8 flex gap-3">
           <Button variant="ghost" onClick={onClose} className="flex-1">Close</Button>
           <Button 
             onClick={() => setStep("select")} 
             className={`flex-1 bg-[${PRIMARY}] text-white hover:bg-[#b81752]`}
           >
             Try Again
           </Button>
        </div>
      </div>
    );
  }

  return (
    // The Modal component should handle the dark overlay.
    // We are setting the main container to be soft and cute.
    <Modal open={open} onClose={() => !processing && onClose()}>
      {/* REMOVAL OF 2 BACKGROUNDS:
        1. Dark Overlay: Assumed to be handled by the imported <Modal> component.
        2. White Container: Changed 'bg-white' to a soft cream 'bg-[#fffcf7]' (SOFT_BG) for a cute look,
           and softened the border radius and shadow.
      */}
      <div className={`bg-[${SOFT_BG}] w-full max-w-lg mx-auto rounded-3xl shadow-2xl shadow-slate-300/50 overflow-hidden`}>
        {/* Header (Styled with softer edges and colors) */}
        <div className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white`}>
          <div className="flex items-center gap-2">
            <span className={`text-xl text-[${PRIMARY}]`}>🛒</span>
            <h3 className="text-lg font-bold text-slate-800">Top Up Your Points</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
             ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {content}
        </div>
      </div>
    </Modal>
  );
}