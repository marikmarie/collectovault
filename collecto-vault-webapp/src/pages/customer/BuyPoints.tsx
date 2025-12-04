// src/features/customer/BuyPointsModal.tsx
import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import Modal from "../../components/Modal";
import Card from "../../components/Card";
import Button from "../../components/Button";

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

/** Example fallback packages */
const FALLBACK_PACKAGES: Package[] = [
  { id: "p1", points: 100, price: 5000 },
  { id: "p2", points: 500, price: 10000, recommended: true },
  { id: "p3", points: 2500, price: 25000 },
  { id: "p4", points: 5000, price: 45000 },
];

type ModalStep = "select" | "confirm" | "success" | "failure";

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

  // Scrolling logic
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
          {/* Left Arrow */}
          <button
            onClick={scrollPrev}
            className="hidden md:inline-flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition"
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
                  {/* FIX: Added 'bg-white' explicitly to remove dark/grey background */}
                  <Card 
                    className={`
                      relative flex flex-col justify-between h-full p-5 cursor-pointer transition-all duration-200 
                      bg-white border
                      ${isSel 
                        ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg scale-[1.02]" 
                        : "border-slate-200 hover:border-emerald-300 hover:shadow-md"
                      }
                    `}
                  >
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Package</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-slate-900">{p.points}</span>
                        <span className="text-sm font-medium text-slate-500">pts</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
                      <div className="flex justify-between items-end">
                        <span className="text-xs text-slate-400">Price</span>
                        <span className={`text-lg font-bold ${isSel ? 'text-emerald-600' : 'text-slate-700'}`}>
                          {p.price.toLocaleString()} <span className="text-xs font-normal text-slate-400">UGX</span>
                        </span>
                      </div>
                    </div>

                    {/* Checkmark Icon for selection */}
                    {isSel && (
                      <div className="absolute top-3 right-3 text-emerald-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                      </div>
                    )}
                  </Card>

                  {/* Recommended Badge positioned outside/over card for cleaner look */}
                  {p.recommended && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 whitespace-nowrap">
                      ★ BEST VALUE
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Arrow */}
          <button
            onClick={scrollNext}
            className="hidden md:inline-flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition"
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
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  paymentMode === "momo" 
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm" 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>📱</span> Mobile Money
              </button>
              <button
                disabled
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60"
              >
                <span>🏦</span> Bank
              </button>
            </div>
          </div>

          {paymentMode === "momo" && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 256 700 000000"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900 placeholder:text-slate-400 bg-white"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
           <Button variant="ghost" onClick={onClose} disabled={processing}>Cancel</Button>
           <Button onClick={handleProceed} disabled={!selectedId || processing}>
             {processing ? "Processing..." : "Continue"}
           </Button>
        </div>
      </>
    );
  } else if (step === "confirm") {
    content = (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          🔔
        </div>
        <h4 className="text-xl font-bold text-slate-900">Confirm on your phone</h4>
        <p className="text-slate-600 mt-2 max-w-sm mx-auto">
          We've sent a prompt to <span className="font-semibold text-slate-900">{phone}</span>. 
          Please approve the payment of <span className="font-semibold text-emerald-600">UGX {selectedPackage?.price.toLocaleString()}</span>.
        </p>
        
        <div className="mt-8 space-y-3">
          <Button onClick={handleConfirmPayment} className="w-full justify-center" disabled={processing}>
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
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          ✓
        </div>
        <h4 className="text-xl font-bold text-emerald-900">Payment Successful!</h4>
        <p className="text-slate-600 mt-2">
          Your wallet has been topped up with <br/>
          <span className="text-2xl font-bold text-slate-900">{selectedPackage?.points} pts</span>
        </p>
        <div className="mt-8">
           <Button onClick={onClose} className="w-full justify-center">Done</Button>
        </div>
      </div>
    );
  } else if (step === "failure") {
    content = (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          ✕
        </div>
        <h4 className="text-xl font-bold text-red-900">Payment Failed</h4>
        <p className="text-slate-600 mt-2">{error}</p>
        <div className="mt-8 flex gap-3">
           <Button variant="ghost" onClick={onClose} className="flex-1">Close</Button>
           <Button onClick={() => setStep("select")} className="flex-1">Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <Modal open={open} onClose={() => !processing && onClose()}>
      {/* NOTE: 'bg-white' here ensures the main modal container is white.
         If your modal is still dark, check the imported Modal component's overlay styles.
      */}
      <div className="bg-white w-full max-w-lg mx-auto rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h3 className="text-lg font-bold text-slate-800">Buy Points</h3>
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