import  { useCallback, useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import { ArrowDownLeft, ChevronRight, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { transactionService, invoiceService } from "../../api/collecto";
import api from "../../api";
import InvoiceDetailModal from "./InvoiceDetailModal";
import Button from "../../components/Button";
import {customerService} from "../../api/customer";

/*
  StatementWithPoints.tsx
  - Rebuilt from user's existing Statement component
  - Adds: points balance display, points-to-UGX conversion, points-only / mobile-money / mixed payment flows
  - Uses existing endpoints provided by user: /vaultPackages, customerService.getCustomerData, transactionService.getTransactions, invoiceService.getInvoices, invoiceService.payInvoice, api.post('/verifyPhoneNumber')

  Notes/assumptions made:
  - The vaultPackages endpoint returns packages with pointsAmount and price (used to estimate UGX-per-point).
  - invoiceService.payInvoice accepts payloads with different paymentOption values: "points", "mobilemoney", and "mixed". If your backend expects different fields, adjust the payload shapes accordingly.
  - If no packages are available we fall back to 1 UGX per point (conservative fallback).
*/

// Local toast helper
const useLocalToast = () => {
  const [toast, setToast] = useState<null | { type: "success" | "error" | "info"; message: string }>(null);
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };
  return { toast, showToast };
};

const vaultOTPToken = sessionStorage.getItem("vaultOtpToken") || undefined;
const collectoId = localStorage.getItem("collectoId") || undefined;
const clientId = localStorage.getItem("clientId") || undefined;

export default function StatementWithPoints() {
  // Lists
  const [invoices, setInvoices] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [, setPackages] = useState<any[]>([]);

  // UI/Loading
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<"invoices" | "transactions" | "packages" | null>(null);
  const [activeTab, setActiveTab] = useState<"invoices" | "payments">("invoices");

  // Selection / modals
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  // Payment controls
  const [payMethod, setPayMethod] = useState<"points" | "mobilemoney" | "mixed">("points");
  const [payPhone, setPayPhone] = useState("");
  const [pointsToUse, setPointsToUse] = useState<number | null>(null); // used in mixed flow

  // Verification states for phone
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Customer data
  const [pointsBalance, setPointsBalance] = useState<number>(0);
  const [tier, setTier] = useState<string | null>(null);
  const [tierProgress, setTierProgress] = useState<number>(0);

  // Derived conversion: UGX per point
  const [ugxPerPoint, setUgxPerPoint] = useState<number>(1);

  const { toast, showToast } = useLocalToast();

  // Verify phone number helper (reused from original code)
  const verifyPhoneNumber = useCallback(async (number: string) => {
    const trimmed = number.trim();
    if (trimmed.length < 10) return;

    try {
      setVerifying(true);
      setVerified(false);
      setAccountName(null);
      setPhoneError(null);

      const res = await api.post("/verifyPhoneNumber", {
        vaultOTPToken,
        collectoId,
        clientId,
        phoneNumber: trimmed,
      });

      const payload = res?.data ?? {};
      const nested = payload?.data ?? {};
      const deeper = nested?.data ?? {};

      const name =
        (deeper?.name && String(deeper.name).trim()) ||
        (nested?.name && String(nested.name).trim()) ||
        (payload?.name && String(payload.name).trim()) ||
        null;

      const verifiedFlag = Boolean(
        nested?.verifyPhoneNumber ?? deeper?.verifyPhoneNumber ?? String(payload?.status_message ?? "").toLowerCase() === "success",
      );

      if (verifiedFlag) {
        setVerified(true);
        if (name) setAccountName(name);
      } else {
        setPhoneError(nested?.message || payload?.message || "Verification failed");
      }
    } catch (err: any) {
      setPhoneError(err?.response?.data?.message || err?.message || "Error verifying number");
    } finally {
      setVerifying(false);
    }
  }, []);

  // Fetch active packages (used to compute UGX-per-point)
  const fetchActivePackages = useCallback(async () => {
    setLoadingType("packages");
    setLoading(true);
    try {
      const res = await api.get("/vaultPackages");
      const apiData: any[] = res.data?.data ?? [];
      const mapped = apiData.map((pkg: any) => ({
        id: pkg.id,
        points: pkg.pointsAmount,
        price: pkg.price,
        recommended: pkg.isPopular,
        label: pkg.name,
      }));
      setPackages(mapped);

      // compute UGX per point as weighted average (price / points)
      const totalPoints = mapped.reduce((s: number, p: any) => s + (p.points || 0), 0);
      const totalPrice = mapped.reduce((s: number, p: any) => s + (p.price || 0), 0);
      if (totalPoints > 0) {
        setUgxPerPoint(totalPrice / totalPoints);
      } else if (mapped.length > 0) {
        // fallback: take average of per-package ratio
        const avg = mapped.reduce((s: number, p: any) => s + (p.price / (p.points || 1)), 0) / mapped.length;
        setUgxPerPoint(avg || 1);
      } else {
        setUgxPerPoint(1); // conservative fallback
      }

      return mapped;
    } catch (err) {
      console.error("Failed to load packages", err);
      setPackages([]);
      setUgxPerPoint(1);
      return [];
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  }, []);

  // Fetch invoices and annotate them with points-equivalent (rounded)
  const fetchInvoices = useCallback(async (invoiceId?: string | null) => {
    setLoading(true);
    setLoadingType("invoices");
    try {
      const res = await invoiceService.getInvoices({ vaultOTPToken, collectoId, clientId, invoiceId: invoiceId ?? null });
      const invoiceArray = res.data?.data?.data;
      const validatedData = Array.isArray(invoiceArray) ? invoiceArray : [];

      // Sort descending by invoice_date
      const sortedData = validatedData.sort((a: any, b: any) => {
        const dateA = new Date(a.details?.invoice_date || 0).getTime();
        const dateB = new Date(b.details?.invoice_date || 0).getTime();
        return dateB - dateA;
      });

      // Attach pointsEquivalent using ugxPerPoint
      const annotated = sortedData.map((inv: any) => {
        const amount = Number(inv.details?.invoice_amount ?? inv.details?.amount ?? 0);
        const pointsEquivalent = Math.max(0, Math.ceil(amount / ugxPerPoint));
        return { ...inv, pointsEquivalent };
      });

      setInvoices(annotated);
      return annotated;
    } catch (err) {
      console.error("Fetch Invoices Error:", err);
      setInvoices([]);
      return [];
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  }, [ugxPerPoint]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setLoadingType("transactions");
    try {
      const customerId = clientId || "";
      const res = await transactionService.getTransactions(customerId);
      const data = res.data?.data?.data ?? res.data?.transactions ?? [];
      setTransactions(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.error("Fetch Transactions Error:", err);
      setTransactions([]);
      return [];
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  }, []);

  // Fetch customer profile (points & tier) and transactions
  const fetchCustomerAndRelated = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const customerRes = await customerService.getCustomerData(clientId);
      const cData = customerRes.data;
      if (cData?.customer) {
        setPointsBalance(cData.customer.currentPoints || 0);
        setTier(cData.currentTier?.name || "N/A");

        if (cData.currentTier && cData.tiers) {
          const idx = cData.tiers.findIndex((t: any) => t.id === cData.currentTier.id);
          if (idx !== -1 && idx < cData.tiers.length - 1) {
            const next = cData.tiers[idx + 1];
            const diff = next.pointsRequired - cData.currentTier.pointsRequired;
            const earned = cData.customer.currentPoints - cData.currentTier.pointsRequired;
            setTierProgress(Math.min(100, Math.max(0, (earned / diff) * 100)));
          } else {
            setTierProgress(100);
          }
        }
      }

      const txRes = await transactionService.getTransactions(clientId);
      setTransactions(txRes.data?.transactions || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Master fetch on mount: packages -> derive ugxPerPoint -> customer -> invoices & txs
  useEffect(() => {
    (async () => {
      await fetchActivePackages();
      await fetchCustomerAndRelated();
      await fetchInvoices();
      await fetchTransactions();
    })();
  }, [fetchActivePackages, fetchCustomerAndRelated, fetchInvoices, fetchTransactions]);

  // Payment handler supporting points / mobilemoney / mixed
  const handlePayInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);

      const targetInvoice = invoices.find((inv) => inv.details?.id === invoiceId);
      const balanceDue = Number(targetInvoice?.amount_less ?? targetInvoice?.details?.invoice_amount ?? 0);

      // Format phone
      const formattedPhone = payPhone ? payPhone.replace(/^0/, "256") : payPhone;

      // Build payload depending on method
      let payload: any = { vaultOTPToken, collectoId, clientId, reference: invoiceId };

      if (payMethod === "points") {
        // compute required points to fully cover invoice
        const pointsNeeded = Math.max(0, Math.ceil(balanceDue / ugxPerPoint));
        if (pointsBalance < pointsNeeded) {
          showToast("Insufficient points to cover invoice", "error");
          return;
        }

        payload = { ...payload, paymentOption: "points", points: pointsNeeded };

      } else if (payMethod === "mobilemoney") {
        payload = { ...payload, paymentOption: "mobilemoney", phone: formattedPhone, amount: balanceDue };
      } else if (payMethod === "mixed") {
        // pointsToUse must be set; ensure it's within bounds
        const pointsUse = Math.max(0, Math.floor(pointsToUse || 0));
        if (pointsUse <= 0) {
          showToast("Choose points to apply for mixed payment", "error");
          return;
        }
        if (pointsUse > pointsBalance) {
          showToast("You don't have that many points", "error");
          return;
        }

        const pointsValueUGX = pointsUse * ugxPerPoint;
        const mobileAmount = Math.max(0, balanceDue - pointsValueUGX);

        payload = { ...payload, paymentOption: "mixed", points: pointsUse, phone: formattedPhone, amount: mobileAmount };
      }

      await invoiceService.payInvoice(payload);

      // optimistic updates
      if (payMethod === "points") {
        const pointsNeeded = Math.max(0, Math.ceil(balanceDue / ugxPerPoint));
        setPointsBalance((p) => Math.max(0, p - pointsNeeded));
      } else if (payMethod === "mixed") {
        const pointsUse = Math.max(0, Math.floor(pointsToUse || 0));
        setPointsBalance((p) => Math.max(0, p - pointsUse));
      }

      await fetchInvoices();
      await fetchTransactions();

      setPayingInvoice(null);
      setPointsToUse(null);
      setPayPhone("");
      setAccountName(null);
      setVerified(false);

      showToast("Payment initiated. Check your phone if prompted.", "success");
    } catch (err: any) {
      console.error("Payment failed:", err);
      showToast(err?.response?.data?.message || "Payment failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // Utility: compute UGX equivalent of points and vice-versa
  const pointsToUGX = (points: number) => Math.round(points * ugxPerPoint);
  const ugxToPoints = (ugx: number) => Math.ceil(ugx / ugxPerPoint);

  return (
    <div className="min-h-screen bg-[#f3f3f3] font-sans pb-20">
      <TopNav />

      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-sm bg-black text-white">
          {toast.message}
        </div>
      )}

      {/* Header: Points balance */}
      <div className="w-full bg-white shadow-md flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="text-xs text-gray-500 uppercase font-bold">Points balance</p>
          <p className="text-2xl font-black text-gray-900">{pointsBalance.toLocaleString()} pts</p>
          <p className="text-xs text-gray-400">UGX {pointsToUGX(pointsBalance).toLocaleString()}</p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase font-bold">Tier</p>
          <p className="text-lg font-bold text-gray-900">{tier}</p>
          <p className="text-xs text-gray-400">Progress: {Math.round(tierProgress)}%</p>
        </div>
      </div>

      <div className="w-full bg-white shadow-md flex divide-x divide-gray-100 border-b border-gray-100">
        <button onClick={() => setActiveTab("invoices")} className={`flex-1 py-6 flex flex-col items-center justify-center relative transition-colors ${activeTab === "invoices" ? "bg-white" : "bg-gray-50/30"}`}>
          <span className="text-xs font-bold text-gray-400 uppercase mt-1 tracking-widest">Invoices</span>
          {activeTab === "invoices" && <div className="absolute bottom-0 w-full h-1 bg-[#cb0d6c]" />}
        </button>

        <button onClick={() => setActiveTab("payments")} className={`flex-1 py-6 flex flex-col items-center justify-center relative transition-colors ${activeTab === "payments" ? "bg-white" : "bg-gray-50/30"}`}>
          <span className="text-xs font-bold text-gray-400 uppercase mt-1 tracking-widest">Payments</span>
          {activeTab === "payments" && <div className="absolute bottom-0 w-full h-1 bg-[#cb0d6c]" />}
        </button>
      </div>

      <main className="w-full px-4 mt-0">
        <div className="mt-6 mb-6 text-center">
          {!loading && (
            <p className="text-gray-400 text-sm font-medium">{activeTab === "invoices" ? `${invoices.length} invoices found` : `${transactions.length} payments found`}</p>
          )}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[#cb0d6c] animate-spin" />
              <p className="text-gray-600 font-semibold">{loadingType === "invoices" ? "Fetching invoices..." : loadingType === "transactions" ? "Fetching transactions..." : "Loading..."}</p>
            </div>
          ) : activeTab === "invoices" ? (
            invoices.map((inv: any) => {
              const invId = inv.details?.id || "N/A";
              const dateRaw = inv.details?.invoice_date || "N/A";
              const amount = Number(inv.details?.invoice_amount ?? inv.details?.amount ?? 0);
              const isPaid = Number(inv.amount_less) === 0;
              const pointsEquivalent = inv.pointsEquivalent ?? ugxToPoints(amount);

              return (
                <div key={invId} onClick={() => setSelectedInvoice(inv)} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                      <ArrowDownLeft className="w-6 h-6 text-gray-300" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-base">{invId}</p>
                      <div className="flex items-center gap-1 text-[11px] uppercase font-extrabold tracking-wider">
                        <span className="text-gray-500">{dateRaw}</span>
                        <span className="text-gray-400">•</span>
                        <span className={isPaid ? "text-green-600" : "text-red-600"}>{isPaid ? "PAID" : "PENDING"}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Equivalent: {pointsEquivalent.toLocaleString()} pts UGX {pointsToUGX(pointsEquivalent).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="font-black text-gray-900 text-lg">UGX {Number(amount).toLocaleString()}</p>
                      {!isPaid && (
                        <button onClick={(e) => { e.stopPropagation(); setPayingInvoice(invId); setPointsToUse(Math.min(pointsBalance, inv.pointsEquivalent || ugxToPoints(amount))); }} className="text-[11px] text-black uppercase bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 transition">Pay Now</button>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
                </div>
              );
            })
          ) : (
            transactions.map((tx: any) => {
              const statusColor = tx.paymentStatus === "SUCCESS" ? "text-green-600" : tx.paymentStatus === "PENDING" ? "text-yellow-600" : "text-red-600";
              const createdDate = new Date(tx.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

              return (
                <div key={tx.id} onClick={() => setSelectedTransaction(tx)} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50">
                      <ArrowDownLeft className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-base">{tx.transactionId}</p>
                      <div className="flex items-center gap-1 text-[11px] uppercase font-extrabold tracking-wider">
                        <span className="text-gray-500">{createdDate}</span>
                        <span className="text-gray-400">•</span>
                        <span className={statusColor}>{tx.paymentStatus}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="font-black text-lg text-gray-900">UGX {Number(tx.amount || 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-500 font-semibold">{tx.points} points</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Payment Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-2xl font-black text-gray-900">Payment Details</h4>
              <button onClick={() => { setPayingInvoice(null); setAccountName(null); setVerified(false); setPayPhone(""); setPhoneError(null); setPointsToUse(null); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="bg-linear-to-br from-pink-50 to-orange-50 rounded-xl p-4 mb-5 border border-pink-100">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Invoice Reference</p>
                  <p className="text-lg font-black text-gray-900">{payingInvoice}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 font-medium mb-1">Balance Due</p>
                  <p className="text-lg font-black text-[#D81B60]">UGX {Number(invoices.find((i) => i.details?.id === payingInvoice)?.amount_less || invoices.find((i) => i.details?.id === payingInvoice)?.details?.invoice_amount || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Equivalent: {Math.ceil((invoices.find((i) => i.details?.id === payingInvoice)?.amount_less || invoices.find((i) => i.details?.id === payingInvoice)?.details?.invoice_amount || 0) / ugxPerPoint).toLocaleString()} pts</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-bold text-gray-700 uppercase mb-3">Select Method</p>
              <div className="flex gap-3 bg-gray-100 p-1 rounded-2xl">
                <button onClick={() => setPayMethod("points")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm ${payMethod === "points" ? "bg-white text-[#D81B60] shadow-md" : "text-gray-600"}`}>💰 Points</button>
                <button onClick={() => setPayMethod("mobilemoney")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm ${payMethod === "mobilemoney" ? "bg-white text-[#D81B60] shadow-md" : "text-gray-600"}`}>📱 Mobile Money</button>
                <button onClick={() => setPayMethod("mixed")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm ${payMethod === "mixed" ? "bg-white text-[#D81B60] shadow-md" : "text-gray-600"}`}>🔀 Mixed</button>
              </div>
            </div>

            {payMethod === "mobilemoney" && (
              <div className="mb-6">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Phone Number</label>
                <div className="relative">
                  <input value={payPhone} onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setPayPhone(digits);
                    setAccountName(null);
                    setVerified(false);
                    setPhoneError(null);
                    if (digits.length === 10) verifyPhoneNumber(digits);
                  }} placeholder="07XXXXXXXX" maxLength={10} className={`w-full p-4 bg-gray-50 border-2 rounded-xl outline-none focus:border-[#D81B60] transition-all ${verified ? "border-green-500" : phoneError ? "border-red-500" : "border-gray-200"}`} />
                  {verifying && (<div className="absolute right-4 top-4"><Loader2 className="w-5 h-5 animate-spin text-[#D81B60]" /></div>)}
                </div>

                {accountName && (
                  <div className="mt-2 flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-lg border border-green-100"><CheckCircle2 className="w-4 h-4" /><span className="text-xs font-bold uppercase">{accountName}</span></div>
                )}
                {phoneError && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg border border-red-100"><AlertCircle className="w-4 h-4" /><span className="text-xs font-medium">{phoneError}</span></div>
                )}
              </div>
            )}

            {payMethod === "points" && (
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Pay with points</p>
                <p className="text-sm text-gray-600">This will use points to fully settle the invoice. You need at least the equivalent points shown above.</p>
                <div className="mt-3">
                  <p className="text-sm font-bold">Your balance: {pointsBalance.toLocaleString()} pts (UGX {pointsToUGX(pointsBalance).toLocaleString()})</p>
                </div>
              </div>
            )}

            {payMethod === "mixed" && (
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Mixed payment</p>
                <p className="text-sm text-gray-600">Choose how many points to apply. The remainder will be paid via Mobile Money.</p>

                <div className="mt-3">
                  <p className="text-sm font-bold">Available points: {pointsBalance.toLocaleString()} pts (UGX {pointsToUGX(pointsBalance).toLocaleString()})</p>

                  <div className="mt-3">
                    <input type="range" min={0} max={Math.min(pointsBalance, invoices.find((i) => i.details?.id === payingInvoice)?.pointsEquivalent || pointsBalance)} value={pointsToUse ?? Math.min(pointsBalance, invoices.find((i) => i.details?.id === payingInvoice)?.pointsEquivalent || pointsBalance)} onChange={(e) => setPointsToUse(Number(e.target.value))} className="w-full" />

                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                      <span>0 pts</span>
                      <span>{Math.min(pointsBalance, invoices.find((i) => i.details?.id === payingInvoice)?.pointsEquivalent || pointsBalance).toLocaleString()} pts</span>
                    </div>

                    <div className="mt-2">
                      <p className="text-sm">Applying: <span className="font-bold">{(pointsToUse ?? 0).toLocaleString()} pts</span> UGX {pointsToUGX(pointsToUse ?? 0).toLocaleString()}</p>

                      <p className="text-sm mt-1">Remaining to pay by mobile money: <span className="font-bold">UGX {(() => {
                        const invoice = invoices.find((i) => i.details?.id === payingInvoice);
                        const due = Number(invoice?.amount_less ?? invoice?.details?.invoice_amount ?? 0);
                        const remaining = Math.max(0, due - pointsToUGX(pointsToUse ?? 0));
                        return remaining.toLocaleString();
                      })()}</span></p>
                    </div>

                    <div className="mt-4">
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Phone Number (for mobile money portion)</label>
                      <input value={payPhone} onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setPayPhone(digits);
                        setAccountName(null);
                        setVerified(false);
                        setPhoneError(null);
                        if (digits.length === 10) verifyPhoneNumber(digits);
                      }} placeholder="07XXXXXXXX" maxLength={10} className={`w-full p-4 bg-gray-50 border-2 rounded-xl outline-none focus:border-[#D81B60] transition-all ${verified ? "border-green-500" : phoneError ? "border-red-500" : "border-gray-200"}`} />
                    </div>

                    {accountName && (<div className="mt-2 flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-lg border border-green-100"><CheckCircle2 className="w-4 h-4" /><span className="text-xs font-bold uppercase">{accountName}</span></div>)}
                    {phoneError && (<div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg border border-red-100"><AlertCircle className="w-4 h-4" /><span className="text-xs font-medium">{phoneError}</span></div>)}

                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => setPayingInvoice(null)} className="bg-gray-200 text-black font-semibold py-2 px-6 rounded-lg">Cancel</button>
              <Button onClick={() => handlePayInvoice(payingInvoice!)} disabled={loading || verifying || (payMethod === "mobilemoney" && !verified) || (payMethod === "mixed" && !verified && (Number(pointsToUse || 0) < Math.min(pointsBalance, invoices.find((i) => i.details?.id === payingInvoice)?.pointsEquivalent || 0)))} className="bg-[#D81B60] text-black font-semibold py-2 px-4 rounded-lg">
                {loading ? "Processing..." : "Pay Now"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <InvoiceDetailModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onPaid={async () => { await fetchInvoices(); setSelectedInvoice(null); showToast("Payment successful", "success"); }} />
      )}

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-2xl font-black text-gray-900">Transaction Details</h4>
              <button onClick={() => setSelectedTransaction(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="space-y-5">
              {/* Transaction ID */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-600 font-bold uppercase mb-1 tracking-wider">Transaction ID</p>
                <p className="text-lg font-black text-gray-900">{selectedTransaction.transactionId}</p>
              </div>

              {/* Status */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-600 font-bold uppercase mb-1 tracking-wider">Status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${selectedTransaction.paymentStatus === "SUCCESS" ? "bg-green-500" : selectedTransaction.paymentStatus === "PENDING" ? "bg-yellow-500" : "bg-red-500"}`} />
                  <p className={`font-bold text-base ${selectedTransaction.paymentStatus === "SUCCESS" ? "text-green-600" : selectedTransaction.paymentStatus === "PENDING" ? "text-yellow-600" : "text-red-600"}`}>{selectedTransaction.paymentStatus}</p>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-linear-to-br from-pink-50 to-orange-50 rounded-xl p-4 border border-pink-100">
                <p className="text-xs text-gray-600 font-bold uppercase mb-1 tracking-wider">Amount</p>
                <p className="text-2xl font-black text-[#D81B60]">UGX {Number(selectedTransaction.amount).toLocaleString()}</p>
              </div>

              {/* Points */}
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <p className="text-xs text-gray-600 font-bold uppercase mb-1 tracking-wider">Points Earned</p>
                <p className="text-2xl font-black text-purple-600">{selectedTransaction.points} pts</p>
              </div>

              {/* Payment Method */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-600 font-bold uppercase mb-1 tracking-wider">Payment Method</p>
                <p className="text-base font-bold text-gray-900">{selectedTransaction.paymentMethod}</p>
              </div>

              {/* Reference */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-600 font-bold uppercase mb-1 tracking-wider">Reference</p>
                <p className="text-base font-bold text-gray-900">{selectedTransaction.reference}</p>
              </div>

              {/* Date Created */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-600 font-bold uppercase mb-1 tracking-wider">Date</p>
                <p className="text-base font-bold text-gray-900">{new Date(selectedTransaction.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>

              {/* Confirmed Date */}
              {selectedTransaction.confirmedAt && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-600 font-bold uppercase mb-1 tracking-wider">Confirmed</p>
                  <p className="text-base font-bold text-gray-900">{new Date(selectedTransaction.confirmedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              )}

            </div>

            <div className="mt-8 pt-4 border-t border-gray-100">
              <button onClick={() => setSelectedTransaction(null)} className="w-full bg-[#D81B60] text-white font-bold py-3 rounded-xl hover:bg-[#c01a5e] transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
