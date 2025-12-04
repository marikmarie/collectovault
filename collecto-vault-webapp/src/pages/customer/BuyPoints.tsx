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

/** Example fallback packages for frontend development */
const FALLBACK_PACKAGES: Package[] = [
  { id: "p1", points: 100, price: 5000 },
  { id: "p2", points: 500, price: 10000, recommended: true },
  { id: "p3", points: 2500, price: 25000 },
  { id: "p4", points: 5000, price: 45000 },
];

export default function BuyPointsModal({ open, onClose, onSuccess }: Props): JSX.Element {
  // UI state
  const [packages, setPackages] = useState<Package[]>(FALLBACK_PACKAGES);
  const [selected, setSelected] = useState<string | number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<"momo" | "bank">("momo");
  const [phone, setPhone] = useState<string>("");

  // scroller ref for the horizontal carousel
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // reset whenever the modal opens
  useEffect(() => {
    if (!open) return;
    setMessage(null);
    setSelected(null);
    setPaymentMode("momo");
    setPhone("");
    setPackages(FALLBACK_PACKAGES);
    // scroll to start
    requestAnimationFrame(() => scrollerRef.current?.scrollTo({ left: 0 }));
  }, [open]);

  // helper: scroll carousel by one card width (approx)
  const scrollNext = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = (card?.offsetWidth ?? Math.round(el.clientWidth * 0.7)) + 12;
    el.scrollBy({ left: step, behavior: "smooth" });
  };

  const scrollPrev = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = (card?.offsetWidth ?? Math.round(el.clientWidth * 0.7)) + 12;
    el.scrollBy({ left: -step, behavior: "smooth" });
  };

  // keyboard support for arrow keys while focus is inside scroller
  const onScrollerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollNext();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollPrev();
    }
  };

  // frontend-only simulated purchase
  const handleBuy = () => {
    setMessage(null);
    if (!selected) {
      setMessage("Please select a package.");
      return;
    }

    if (paymentMode === "momo" && (!phone || phone.trim().length < 9)) {
      setMessage("Enter a valid mobile money phone number.");
      return;
    }

    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setMessage("Purchase simulated — success (mock).");
      onSuccess?.();
      setTimeout(() => {
        onClose();
      }, 700);
    }, 900);
  };

  return (
    <Modal open={open} onClose={() => !processing && onClose()}>
      {/* container: small centered popup */}
      <div className="mx-auto max-w-xl w-full rounded-xl p-4 bg-white shadow-xl ring-1 ring-black/6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Buy points</h3>
            <p className="text-sm text-slate-500 mt-1">Choose a package and pay with mobile money (MOMO).</p>
          </div>

          <div className="ml-2">
            <button
              onClick={() => !processing && onClose()}
              aria-label="Close"
              className="text-slate-400 hover:text-slate-600"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* horizontal sliding row */}
        <div className="mt-4 relative">
          {/* left arrow */}
          <button
            onClick={scrollPrev}
            className="hidden md:inline-flex absolute -left-2 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-8 h-8 rounded-full bg-white border shadow-sm text-slate-600"
            aria-label="Previous package"
          >
            ‹
          </button>

          <div
            ref={scrollerRef}
            onKeyDown={onScrollerKeyDown}
            tabIndex={0}
            role="list"
            aria-label="Point packages"
            className="flex gap-3 overflow-x-auto scrollbar-hidden py-2 px-1"
            style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
          >
            {packages.map((p) => {
              const isSel = String(selected) === String(p.id);
              return (
                <div
                  key={String(p.id)}
                  data-card
                  role="listitem"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelected(p.id);
                    }
                  }}
                  onClick={() => setSelected(p.id)}
                  className="min-w-[210px] shrink-0 scroll-mx-2 snap-start"
                >
                  <Card className={`p-3 transform transition-all duration-200 ${isSel ? "scale-105 ring-2 ring-emerald-400 border-emerald-400/30 shadow-lg" : "hover:scale-[1.02]"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">{p.label ?? "Package"}</div>
                        <div className="text-2xl font-bold text-slate-900">{p.points.toLocaleString()}</div>
                        <div className="text-sm text-slate-500 mt-1">pts</div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-slate-500">UGX</div>
                        <div className="text-lg font-semibold text-slate-900"> {p.price.toLocaleString()}</div>
                      </div>
                    </div>

                    {p.recommended && (
                      <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                        ★ Recommended
                      </div>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>

          {/* right arrow */}
          <button
            onClick={scrollNext}
            className="hidden md:inline-flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-8 h-8 rounded-full bg-white border shadow-sm text-slate-600"
            aria-label="Next package"
          >
            ›
          </button>
        </div>

        {/* payment method */}
        <div className="mt-4 grid grid-cols-1 gap-3">
          <div className="flex items-center gap-3">
            <label
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer ${
                paymentMode === "momo" ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-700"
              }`}
            >
              <input
                type="radio"
                name="paymentMode"
                value="momo"
                checked={paymentMode === "momo"}
                onChange={() => setPaymentMode("momo")}
                className="hidden"
              />
              <span className="text-sm font-medium">MOMO</span>
              <span className="text-xs text-slate-200 ml-2">Mobile money</span>
            </label>

            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-slate-100 text-slate-400 cursor-not-allowed" title="Bank payments coming soon">
              <input type="radio" name="paymentMode" value="bank" disabled />
              <span className="text-sm font-medium">Bank</span>
            </label>
          </div>

          {/* phone input */}
          {paymentMode === "momo" && (
            <div>
              <label className="block text-sm text-slate-600">Phone for MOMO</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 256771234567"
                className="mt-1 block w-full rounded-md px-3 py-2 border border-slate-200 bg-white text-slate-900"
                inputMode="tel"
                aria-label="Mobile money phone number"
              />
            </div>
          )}
        </div>

        {/* message */}
        {message && <div className="mt-3 text-sm text-amber-600">{message}</div>}

        {/* actions */}
        <div className="mt-4 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => !processing && onClose()} disabled={processing}>Cancel</Button>
          <Button onClick={handleBuy} disabled={processing}>
            {processing ? "Processing..." : "Proceed to pay"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
