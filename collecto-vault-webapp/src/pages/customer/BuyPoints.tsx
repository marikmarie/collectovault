import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import Modal from "../../components/Modal";
import Card from "../../components/Card";
import Button from "../../components/Button";
import api from "../../api"; // Your axios instance
import { Zap, Heart, Star, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

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
  onSuccess?: (details?: { addedPoints?: number }) => void;
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
  const [paymentMode, setPaymentMode] = useState<"mobilemoney" | "bank">("mobilemoney");
  const [phone, setPhone] = useState<string>("");
  const [step, setStep] = useState<ModalStep>("select");

  // mobilemoney verification states
  const [accountName, setAccountName] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Transaction tracking / query states
  const [txId, setTxId] = useState<string | number | null>(null);
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "failed">("idle");
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  const verifyPhoneNumber = async () => {
    const trimmed = String(phone || "").trim();
    if (!trimmed || trimmed.length < 10) return;
    try {
      setVerifying(true);
      setVerified(false);
      setAccountName(null);
      setPhoneError(null);

        const vaultOTPToken = sessionStorage.getItem('vaultOtpToken') || undefined;
        const collectoId = localStorage.getItem("collectoId") || undefined;
        const clientId = localStorage.getItem("clientId") || undefined;
      
        const res = await api.post("/verifyPhoneNumber", { vaultOTPToken,collectoId,clientId,phoneNumber: trimmed });

      // Response shapes:
      // { status, status_message, data: { verifyPhoneNumber: true, message, data: { name, phone } } }
      // or older: { data: { name } }
      const payload = res?.data ?? {};
      const nested = payload?.data ?? {};
      const deeper = nested?.data ?? {};

      const name = (deeper?.name && String(deeper.name).trim())
        || (nested?.name && String(nested.name).trim())
        || (payload?.name && String(payload.name).trim())
        || null;

      const verifiedFlag = Boolean(
        nested?.verifyPhoneNumber ?? deeper?.verifyPhoneNumber ?? (String(payload?.status_message ?? "").toLowerCase() === "success")
      );

      const serverMessage = nested?.message ?? payload?.message ?? null;

      if (verifiedFlag) {
        setVerified(true);
        setPhoneError(null);
        if (name) setAccountName(String(name).trim());
        else setAccountName(null); // do not use default name
      } else {
        // Not verified: show server message if provided and do not set a default name
        setAccountName(null);
        setVerified(false);
        setPhoneError(serverMessage ?? "Could not verify the phone number at the moment");
      }
    } catch (err: any) {
      // On any error, do not set a default name; show error message
      setAccountName(null);
      setVerified(false);
      setPhoneError(err?.response?.data?.message ?? err?.message ?? "Could not verify the phone number at the moment");
    } finally {
      setVerifying(false);
    }
  };

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Reset all internal UI state
  const resetState = () => {
    setError(null);
    setSelectedId(null);
    setPaymentMode("mobilemoney");
    setPhone("");
    setStep("select");
    setAccountName(null);
    setVerified(false);
    setVerifying(false);
    setPhoneError(null);
    setTxId(null);
    setTxStatus("idle");
    setQueryLoading(false);
    setQueryError(null);
    setProcessing(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

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
    setPaymentMode("mobilemoney");
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
      // bring package scroller into view to hint where to select
      requestAnimationFrame(() => scrollerRef.current?.scrollTo({ left: 0, behavior: "smooth" }));
      return;
    }
    if (paymentMode === "mobilemoney" && !/^\d{10}$/.test(String(phone || ""))) {
      setError("Enter a valid 10-digit phone number (e.g., 0756901234)");
      return;
    }
    // Ensure the mobilemoney number has been verified and recipient name shown
    if (paymentMode === "mobilemoney" && !verified) {
      setError("Please verify the mobilemoney number before continuing.");
      return;
    }
    setStep("confirm");
  };

  // --- Payment Handlers ---
const handleConfirmPayment = async () => {
  if (!selectedPackage) return;
  setProcessing(true);
  setError(null);
  setTxId(null);
  setTxStatus("idle");

  try {
    const vaultOTPToken = sessionStorage.getItem('vaultOtpToken') || undefined;
    const collectoId = localStorage.getItem('collectoId') ?? undefined;
    const clientId = localStorage.getItem('clientId') ?? undefined;

    const formattedPhone = phone ? phone.replace(/^0/, '256') : phone;

    const res = await api.post("/requestToPay", {
      vaultOTPToken,
      collectoId,
      clientId,
      packageId: selectedPackage.id,
      phone: formattedPhone, 
      paymentOption: paymentMode,
      amount: selectedPackage.price,
      reference: `BUYPOINTS-${Date.now()}`,
    });

    // Accessing flat res.data
    const data = res?.data; 
    const apiStatus = String(data?.status || ""); 
    
    // Extracting transactionId from the nested data property in the response
    const transactionId = data?.data?.transactionId || data?.transactionId || null;

    if (apiStatus === "200") {
      setTxId(transactionId);
      setTxStatus("pending");
      setStep("confirm");

      // Check if prompt is active
      if (data?.data?.requestToPay === true) {
        setTxStatus("pending");
        setStep("confirm");
      } else if (String(data?.status_message).toLowerCase() === "success") {
        setTxStatus("success");
        setStep("success");
        onSuccess?.({ addedPoints: selectedPackage.points });
      }
    } else {
      setTxStatus("failed");
      setStep("failure");
      setError(data?.status_message || "Payment initiation failed.");
    }
  } catch (err: any) {
    setError(err.response?.data?.message || "Payment initiation failed. Please try again.");
    setStep("failure");
  } finally {
    setProcessing(false);
  }
};
// --- Transaction Status Query ---
// --- Transaction Status Query ---
const queryTxStatus = async () => {
  if (!txId) {
    setQueryError("No transaction ID found to track.");
    return;
  }

  setQueryLoading(true);
  setQueryError(null);

  try {
    // Retrieve identifiers for the request
    const vaultOTPToken = sessionStorage.getItem('vaultOtpToken') || undefined;
    const collectoId = localStorage.getItem('collectoId') ?? undefined;
    const clientId = localStorage.getItem('clientId') ?? undefined;

    /** * Calling the updated status endpoint with full context
     */
    const res = await api.post("/requestToPayStatus", { 
       vaultOTPToken,
      collectoId,
      clientId,
      transactionId: String(txId),
     
    });

    const data = res?.data;
    
    // Normalize status from the response
    const status = String(data?.status || "pending").toLowerCase();

    if (["confirmed", "success", "paid", "completed"].includes(status)) {
      setTxStatus("success");
      setStep("success");
      
      if (selectedPackage) {
        onSuccess?.({ addedPoints: selectedPackage.points });
      }
    } else if (["pending", "processing", "in_progress"].includes(status)) {
      setTxStatus("pending");
      // UI remains on the "confirm" step waiting for user to finish on phone
    } else if (status === "failed") {
      setTxStatus("failed");
      setStep("failure");
      setError(data?.message || "Transaction was declined or failed.");
    } else {
      setQueryError(data?.message || "Transaction status unknown. Please check your phone.");
    }
  } catch (err: any) {
    console.error("Status Query Error:", err);
    const errorMessage = err?.response?.data?.message || "Unable to reach payment server.";
    setQueryError(errorMessage);
  } finally {
    setQueryLoading(false);
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
                      className={`relative flex flex-col justify-between h-full p-1.5 cursor-pointer transition-all duration-200 bg-white border rounded-md width:95% ${
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
                onClick={() => setPaymentMode("mobilemoney")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-semibold transition-all ${
                  paymentMode === "mobilemoney"
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
            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Phone Number</label>
            <div className="relative">
              <input
                value={phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setPhone(digits);
                  setAccountName(null);
                  setVerified(false);
                  setPhoneError(null);
                  if (digits.length === 10) verifyPhoneNumber();
                }}
                placeholder="07XXXXXXXX"
                maxLength={10}
                className={`w-full p-2 bg-gray-50 border-2 rounded-xl outline-none focus:border-[#D81B60] transition-all ${verified ? 'border-green-500' : phoneError ? 'border-red-500' : 'border-gray-200'}`}
              />
              {verifying && <div className="absolute right-4 top-4"><Loader2 className="w-5 h-5 animate-spin text-[#D81B60]" /></div>}
            </div>
            
            {accountName && (
              <div className="mt-2 flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-lg border border-green-100">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">{accountName}</span>
              </div>
            )}
            {phoneError && (
              <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium">{phoneError}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex justify-end gap-2 pt-2 border-t border-slate-100">
          {/* Cancel Button */}
          <Button
            variant="ghost"
          onClick={() => !processing && handleClose()}
          >
            Cancel
          </Button>

          {/* Continue Button */}
          <Button
            onClick={handleProceed}
            disabled={loadingPackages || processing}
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

          {/* Transaction status area */}
          {txStatus !== "idle" && (
            <div className="mt-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className={`text-xs font-semibold ${
                    txStatus === "pending" ? "text-amber-600" : txStatus === "success" ? "text-green-600" : "text-red-600"
                  }`}>Status: {String(txStatus).toUpperCase()}</div>
                  {txStatus === "success" && (
                    <div className="text-xs text-green-600">Points purchase completed</div>
                  )}
                  {queryError && <div className="text-xs text-red-600">{queryError}</div>}
                </div>

                {txStatus === "pending" && (
                  <div className="flex items-center gap-2">
                    <button
                      disabled={queryLoading}
                      onClick={queryTxStatus}
                      className="text-sm font-semibold px-3 py-1 rounded-md bg-white border border-slate-200 shadow-sm"
                    >
                      {queryLoading ? 'Checking...' : 'Query status'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

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
          onClick={() => handleClose()}
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
      onClose={() => !processing && handleClose()}
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
