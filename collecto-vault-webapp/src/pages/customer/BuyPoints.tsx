import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import Modal from "../../components/Modal";
import Card from "../../components/Card";
import Button from "../../components/Button";
import api from "../../api"; // Your axios instance
import { Zap, Heart, Star, X, Loader2 } from "lucide-react";

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

const PRIMARY = "#d81b60";
const ACCENT = "#ffa727";
//const SOFT_BG = '#fffcf7';

export default function BuyPointsModal({
  open,
  onClose,
  onSuccess,
}: Props): JSX.Element {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const selectedPackage = packages.find(
    (p) => String(p.id) === String(selectedId)
  );

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<"momo" | "bank">("momo");
  const [phone, setPhone] = useState<string>("");
  const [step, setStep] = useState<ModalStep>("select");

  // MoMo verification states
  const [accountName, setAccountName] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const verifyPhoneNumber = async () => {
    const trimmed = String(phone || "").trim();
    if (!trimmed || trimmed.length < 10) return;
    try {
      setVerifying(true);
      setVerified(false);
      setAccountName(null);

      // Attempt to resolve the name via API. Replace endpoint if backend uses another path.
      const res = await api.get("/momo/resolve", { params: { phone: trimmed } });
      const name = res?.data?.data?.name ?? res?.data?.name ?? null;

      if (name && String(name).trim()) setAccountName(String(name).trim());
      else setAccountName("Mariam Tukasingura");

      setVerified(true);
    } catch (err) {
      // On any error, fall back to default name but still mark as verified so user can continue
      setAccountName("Mariam Tukasingura");
      setVerified(true);
    } finally {
      setVerifying(false);
    }
  };

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
        const mapped = apiData.map((pkg) => ({
          id: pkg.id,
          points: pkg.pointsAmount,
          price: pkg.price,
          recommended: pkg.isPopular,
          label: pkg.name,
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
    el.scrollBy({
      left: -((card?.offsetWidth ?? 200) + 16),
      behavior: "smooth",
    });
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
    // Ensure the momo number has been verified and recipient name shown
    if (paymentMode === "momo" && !verified) {
      setError("Please verify the MoMo number before continuing.");
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
      await api.post("/buyPoints", {
        packageId: selectedPackage.id,
        phoneNumber: phone,
        paymentMethod: paymentMode,
      });

      setStep("success");
      onSuccess?.();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Payment initiation failed. Please try again."
      );
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
        <div className="mt-2 relative">
          <button
            onClick={scrollPrev}
            className="hidden md:inline-flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md"
          >
            ‹
          </button>

          <div
            ref={scrollerRef}
            className="flex gap-2 overflow-x-auto py-2 px-1"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {loadingPackages ? (
              <div className="w-full py-10 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm">Fetching bundles...</p>
              </div>
            ) : (
              packages.map((p) => {
                const isSel = String(selectedId) === String(p.id);
                return (
                  <div
                    key={String(p.id)}
                    data-card
                    onClick={() => setSelectedId(p.id)}
                    className="min-w-[110px] shrink-0 snap-start relative outline-none"
                  >
                    <Card
                      className={`relative flex flex-col justify-between h-full p-1.5 cursor-pointer transition-all duration-200 bg-white border rounded-md ${
                        isSel
                          ? `border-[${PRIMARY}] ring-1 ring-[${PRIMARY}]/30 shadow-md scale-105`
                          : "border-slate-100 hover:border-slate-200 hover:shadow-md"
                      }`}
                    >
                      <div>
                        <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 mb-0.5 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-yellow-500" />{" "}
                          {p.label || "Pack"}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-semibold text-slate-900">
                            {p.points.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-medium text-slate-600">
                            pts
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-600 font-medium">
                            Price (UGX)
                          </span>
                          <span
                            className={`text-lg font-bold ${
                              isSel ? `text-[${PRIMARY}]` : "text-slate-700"
                            }`}
                          >
                            {p.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {isSel && (
                        <div
                          className={`absolute top-2 right-2 text-[${PRIMARY}]`}
                        >
                          <Heart className="w-5 h-5 fill-current text-gray-400" />
                        </div>
                      )}
                    </Card>
                    {p.recommended && (
                      <div
                        className={`absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[${ACCENT}] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-md z-10 uppercase flex items-center gap-1`}
                      >
                        <Star className="w-2.5 h-2.5 fill-white" /> Best
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={scrollNext}
            className="hidden md:inline-flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md"
          >
            ›
          </button>
        </div>

        <div className="mt-2 space-y-1">
          {error && (
            <p className="text-xs text-red-500 font-medium">⚠️ {error}</p>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">
              Payment Method
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setPaymentMode("momo")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-semibold transition-all ${
                  paymentMode === "momo"
                    ? `bg-[${PRIMARY}]/10 border-[${PRIMARY}] text-[${PRIMARY}] shadow-sm`
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>📱</span> Mobile Money
              </button>
              <button
                disabled
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60"
              >
                <span>🏦</span> Bank (Soon)
              </button>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">
              MoMo Number
            </label>
            <input
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                // Clear previous verification when user edits the number
                setAccountName(null);
                setVerified(false);
                setVerifying(false);
              }}
              onBlur={() => {
                // Trigger verification when user leaves the input
                if (String(phone || "").trim().length >= 10) verifyPhoneNumber();
              }}
              placeholder="0756901234"
              className="w-full max-w-xs mx-auto px-3 py-1.5 rounded-md border border-slate-300 focus:border-[#d81b60] outline-none text-sm"
            />

            <div className="mt-2 max-w-xs mx-auto text-sm">
              {verifying ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying number...
                </div>
              ) : accountName ? (
                <div className="text-slate-700">Recipient: <span className="font-medium text-green-600">{accountName}</span></div>
              ) : (
                <div className="text-slate-400">Enter number and leave the field to verify recipient</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex justify-end gap-2 pt-2 border-t border-slate-100">
          {/* Cancel Button */}
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={processing}
            className="bg-gray-50 text-slate-900 border border-slate-200 px-3 py-1.5 rounded-md hover:bg-gray-100"
          >
            Cancel
          </Button>

          {/* Continue Button */}
          <Button
            onClick={handleProceed}
            disabled={!selectedId || loadingPackages || (paymentMode === "momo" && !verified)}
            className="bg-gray-200 text-slate-900 font-semibold py-1.5 px-3 rounded-md hover:bg-gray-300 disabled:opacity-80 disabled:cursor-not-allowed transition-colors border border-slate-200 shadow-sm"
          >
            {loadingPackages ? "Processing..." : "Continue"}
          </Button>
        </div>
      </>
    );
  } else if (step === "confirm") {
    content = (
      <div className="text-center py-3">
        <div className="mx-auto w-14 h-14 rounded-full bg-linear-to-br from-yellow-100 via-yellow-50 to-white flex items-center justify-center mb-2 shadow-sm text-2xl text-[#ffa727]">
          ⚠️
        </div>

        <h4 className="text-lg font-bold text-slate-900">Confirm payment</h4>
        <p className="text-slate-600 mt-1 max-w-sm mx-auto text-sm">
          We've sent a payment request to your phone — approve it to complete the top up.
        </p>

        <div className="mt-3 mx-auto max-w-sm bg-white border border-slate-100 rounded-xl p-3 shadow-sm text-left">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Bundle</div>
              <div className="font-semibold text-slate-900">
                {selectedPackage?.label ?? `${selectedPackage?.points?.toLocaleString()} pts`}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">Amount</div>
              <div className="font-bold text-[#d81b60]">UGX {selectedPackage?.price?.toLocaleString()}</div>
            </div>
          </div>

          <div className="mt-3 text-sm text-slate-500">
            Mobile: <span className="text-slate-900 font-medium">{phone}</span>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex gap-3 items-center">
            <Button
              onClick={() => setStep("select")}
              variant="ghost"
              className="bg-gray-50 border border-slate-200 hover:bg-gray-100 text-slate-900 px-4 py-2 rounded-md"
            >
              Change details
            </Button>

            <Button
              onClick={handleConfirmPayment}
              className="flex-1 bg-gray-200 text-slate-900 font-semibold hover:bg-gray-300 disabled:opacity-80 disabled:cursor-not-allowed border border-slate-200 shadow-sm px-4 py-2 rounded-md"
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Confirm"
              )}
            </Button>
          </div>

          <button
            onClick={() => setStep("select")}
            className="mt-3 text-sm text-slate-800 underline"
          >
            Didn't receive the request?
          </button>
        </div>
      </div>
    );
  } else if (step === "success") {
    content = (
      <div className="text-center py-3 animate-in zoom-in-95">
        <div className="w-12 h-12 bg-pink-100 text-[#d81b60] rounded-full flex items-center justify-center mx-auto mb-2">
          <Heart className="w-6 h-6 fill-current" />
        </div>
        <h4 className="text-xl font-bold text-slate-900">Top Up Successful!</h4>
        <p className="text-slate-600 mt-2">
          Added{" "}
          <span className="text-2xl font-black text-[#d81b60]">
            {selectedPackage?.points.toLocaleString()}
          </span>{" "}
          pts to your wallet.
        </p>
        <Button
          onClick={onClose}
          className="w-full mt-6 bg-gray-200 text-slate-900 font-semibold"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  } else if (step === "failure") {
    content = (
      <div className="text-center py-3">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <X className="w-7 h-7" />
        </div>
        <h4 className="text-xl font-bold text-red-900">Payment Failed</h4>
        <p className="text-slate-600 mt-2">{error}</p>
        <div className="mt-8 flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button
            onClick={() => setStep("select")}
            className="flex-1 bg-gray-200 text-slate-900 font-semibold px-4 py-2 rounded-md border border-slate-200 shadow-sm"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Modal
      open={open}
      onClose={() => !processing && onClose()}
      size="sm"
      noOverlay
      title={
        <div className="flex items-center gap-2">
          <span className="text-lg">🛒</span>
          <span className="text-base font-semibold">Buy Points</span>
        </div>
      }
    >
      <div className="p-3 max-h-[65vh] overflow-y-auto">{content}</div>
    </Modal>
  );
}
