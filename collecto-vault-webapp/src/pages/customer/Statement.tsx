// StatementWithPoints.tsx
import { useCallback, useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import {
  ArrowDownLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { transactionService, invoiceService } from "../../api/collecto";
import api from "../../api";
import InvoiceDetailModal from "./InvoiceDetailModal";
import Button from "../../components/Button";
import { customerService } from "../../api/customer";

const useLocalToast = () => {
  const [toast, setToast] = useState<null | {
    type: "success" | "error" | "info";
    message: string;
  }>(null);
  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
  ) => {
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
  const [loadingType, setLoadingType] = useState<
    "invoices" | "transactions" | "packages" | null
  >(null);
  const [activeTab, setActiveTab] = useState<"invoices" | "payments">(
    "invoices",
  );

  // Selection / modals
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(
    null,
  );

  // Payment controls (single combined flow)
  const [payPhone, setPayPhone] = useState("");
  const [pointsToUse, setPointsToUse] = useState<number | null>(null);

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
        nested?.verifyPhoneNumber ??
        deeper?.verifyPhoneNumber ??
        String(payload?.status_message ?? "").toLowerCase() === "success",
      );

      if (verifiedFlag) {
        setVerified(true);
        if (name) setAccountName(name);
      } else {
        setPhoneError(
          nested?.message || payload?.message || "Verification failed",
        );
      }
    } catch (err: any) {
      setPhoneError(
        err?.response?.data?.message ||
          err?.message ||
          "Error verifying number",
      );
    } finally {
      setVerifying(false);
    }
  }, []);

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

      const totalPoints = mapped.reduce(
        (s: number, p: any) => s + (p.points || 0),
        0,
      );
      const totalPrice = mapped.reduce(
        (s: number, p: any) => s + (p.price || 0),
        0,
      );
      if (totalPoints > 0) {
        setUgxPerPoint(totalPrice / totalPoints);
      } else if (mapped.length > 0) {
        const avg =
          mapped.reduce(
            (s: number, p: any) => s + p.price / (p.points || 1),
            0,
          ) / mapped.length;
        setUgxPerPoint(avg || 1);
      } else {
        setUgxPerPoint(1);
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

  const fetchInvoices = useCallback(
    async (invoiceId?: string | null) => {
      setLoading(true);
      setLoadingType("invoices");
      try {
        // console.log(vaultOTPToken);
        const res = await invoiceService.getInvoices({
          vaultOTPToken,
          collectoId,
          clientId,
          invoiceId: invoiceId ?? null,
        });
        const invoiceArray = res.data?.data?.data;
        const validatedData = Array.isArray(invoiceArray) ? invoiceArray : [];

        const sortedData = validatedData.sort((a: any, b: any) => {
          const dateA = new Date(a.details?.invoice_date || 0).getTime();
          const dateB = new Date(b.details?.invoice_date || 0).getTime();
          return dateB - dateA;
        });

        const annotated = sortedData.map((inv: any) => {
          const amount = Number(
            inv.details?.invoice_amount ?? inv.details?.amount ?? 0,
          );
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
    },
    [ugxPerPoint],
  );

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
          const idx = cData.tiers.findIndex(
            (t: any) => t.id === cData.currentTier.id,
          );
          if (idx !== -1 && idx < cData.tiers.length - 1) {
            const next = cData.tiers[idx + 1];
            const diff = next.pointsRequired - cData.currentTier.pointsRequired;
            const earned =
              cData.customer.currentPoints - cData.currentTier.pointsRequired;
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

  useEffect(() => {
    (async () => {
      await fetchActivePackages();
      await fetchCustomerAndRelated();
      await fetchInvoices();
      await fetchTransactions();
    })();
  }, [
    fetchActivePackages,
    fetchCustomerAndRelated,
    fetchInvoices,
    fetchTransactions,
  ]);

  // Helpers
  const pointsToUGX = (points: number) => Math.round(points * ugxPerPoint);
  const ugxToPoints = (ugx: number) => Math.ceil(ugx / ugxPerPoint);

  // Compute safe max points for the FlexPay (ensure mobile portion > 0)
  const computeMaxPointsForInvoice = (
    invoiceAmount: number,
    invoicePointsEquivalent: number,
  ) => {
    // Ensure at least 1 UGX remains for mobile money after applying points
    // maxPoints = floor((invoiceAmount - 1) / ugxPerPoint)
    const maxFromAmount = Math.max(
      0,
      Math.floor((invoiceAmount - 1) / ugxPerPoint),
    );
    return Math.min(pointsBalance, invoicePointsEquivalent, maxFromAmount);
  };
  const handlePayInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);

      const targetInvoice = invoices.find(
        (inv) => inv.details?.id === invoiceId,
      );

      // 1. Calculate balance
      const balanceDue = Number(
        targetInvoice?.amount_less ??
          targetInvoice?.details?.invoice_amount ??
          0,
      );

      // 2. Points Validation
      const pointsUse = Math.max(0, Math.floor(pointsToUse || 0));
      if (pointsUse <= 0) {
        showToast("Please choose some points to apply for payment.", "error");
        setLoading(false); // Ensure loading stops if we return early
        return;
      }

      // 3. Phone Validation
      if (!payPhone || !verified) {
        showToast(
          "Please verify a phone number for the mobile money portion.",
          "error",
        );
        setLoading(false);
        return;
      }

      const pointsValueUGX = pointsUse * ugxPerPoint;

      // New line:
      const mobileAmount = Math.round(Math.max(0, balanceDue - pointsValueUGX));

      if (mobileAmount <= 0) {
        showToast(
          "Payment requires a non-zero mobile money portion. Reduce points used.",
          "error",
        );
        setLoading(false);
        return;
      }

      // 4. Format Phone (Using Uganda Country Code)
      const formattedPhone = payPhone.startsWith("0")
        ? payPhone.replace(/^0/, "256")
        : payPhone;

      // 5. Build Payload (using your saved clientId/collectoId)
      const payload = {
        vaultOTPToken,
        collectoId, // From your auth session
        clientId, // From your auth session
        reference: invoiceId,
        paymentOption: "mobilemoney",
        phone: formattedPhone,
        amount: mobileAmount,
        points: {
          points_used: pointsUse,
          discount_amount: pointsValueUGX,
        },
      };

      // 6. Execute Request and capture Response
      const response = await invoiceService.payInvoice(payload);

      // Access the data based on your JSON structure: res.data.data
      const responseData = response.data?.data;

      // 7. Optimistic UI Updates
      setPointsBalance((p) => Math.max(0, p - pointsUse));

      await Promise.all([fetchInvoices(), fetchTransactions()]);

      // 8. Reset States
      setPayingInvoice(null);
      setPointsToUse(null);
      setPayPhone("");
      setAccountName(null);
      setVerified(false);

      // 9. Show dynamic success message from backend
      const successMsg =
        responseData?.message || "Payment initiated — check your phone.";
      showToast(successMsg, "success");
    } catch (err: any) {
      console.error("Payment failed:", err);
      
      const errorMsg =
        err?.response?.data?.message || err?.message || "Payment failed";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] font-sans pb-20">
      <TopNav />

      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm bg-black text-white">
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="w-full bg-white shadow-sm flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div>
          <p className="text-xs text-gray-500 uppercase font-bold">
            Points balance
          </p>
          <p className="text-2xl font-extrabold text-gray-900">
            {pointsBalance.toLocaleString()} pts
          </p>
          <p className="text-xs text-gray-400">
            UGX {pointsToUGX(pointsBalance).toLocaleString()}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase font-bold">Tier</p>
          <p className="text-lg font-bold text-gray-900">{tier}</p>
          <p className="text-xs text-gray-400">
            Progress: {Math.round(tierProgress)}%
          </p>
        </div>
      </div>

      <div className="w-full bg-white shadow-md flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex-1 py-5 text-center ${activeTab === "invoices" ? "border-b-2 border-[#cb0d6c]" : "text-gray-500"}`}
        >
          <span className="text-xs font-bold uppercase tracking-widest">
            Invoices
          </span>
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`flex-1 py-5 text-center ${activeTab === "payments" ? "border-b-2 border-[#cb0d6c]" : "text-gray-500"}`}
        >
          <span className="text-xs font-bold uppercase tracking-widest">
            Payments
          </span>
        </button>
      </div>

      <main className="w-full px-4 mt-6 max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          {!loading && (
            <p className="text-gray-500 text-sm">
              {activeTab === "invoices"
                ? `${invoices.length} invoices found`
                : `${transactions.length} payments found`}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[#cb0d6c] animate-spin" />
              <p className="text-gray-600 font-semibold">
                {loadingType === "invoices"
                  ? "Fetching invoices..."
                  : loadingType === "transactions"
                    ? "Fetching transactions..."
                    : "Loading..."}
              </p>
            </div>
          ) : activeTab === "invoices" ? (
            invoices.map((inv: any) => {
              const invId = inv.details?.id || "N/A";
              const dateRaw = inv.details?.invoice_date || "N/A";
              const amount = Number(
                inv.details?.invoice_amount ?? inv.details?.amount ?? 0,
              );
              const isPaid = Number(inv.amount_less) === 0;
              const pointsEquivalent =
                inv.pointsEquivalent ?? ugxToPoints(amount);

              return (
                <div
                  key={invId}
                  onClick={() => setSelectedInvoice(inv)}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-transform active:scale-[0.99]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                      <ArrowDownLeft className="w-6 h-6 text-gray-300" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-base">
                        {invId}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] uppercase font-extrabold tracking-wider">
                        <span className="text-gray-500">{dateRaw}</span>
                        <span className="text-gray-400">•</span>
                        <span
                          className={isPaid ? "text-green-600" : "text-red-600"}
                        >
                          {isPaid ? "PAID" : "PENDING"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Equivalent: {pointsEquivalent.toLocaleString()} pts •
                        UGX {pointsToUGX(pointsEquivalent).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="font-extrabold text-gray-900 text-lg">
                        UGX {Number(amount).toLocaleString()}
                      </p>
                      {!isPaid && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPayingInvoice(invId);
                            // pick a sensible default: min(balance, pointsEquivalent but ensure mixed constraint)
                            const defaultMax = computeMaxPointsForInvoice(
                              amount,
                              pointsEquivalent,
                            );
                            setPointsToUse(
                              Math.max(0, Math.min(pointsBalance, defaultMax)),
                            );
                          }}
                          className="text-[11px] text-black uppercase bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 transition"
                        >
                          Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            transactions.map((tx: any) => {
              const statusColor =
                tx.paymentStatus === "SUCCESS"
                  ? "text-green-600"
                  : tx.paymentStatus === "PENDING"
                    ? "text-yellow-600"
                    : "text-red-600";
              const createdDate = new Date(tx.createdAt).toLocaleDateString(
                "en-US",
                { year: "numeric", month: "short", day: "numeric" },
              );

              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTransaction(tx)}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-transform active:scale-[0.99]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50">
                      <ArrowDownLeft className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-base">
                        {tx.transactionId}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] uppercase font-extrabold tracking-wider">
                        <span className="text-gray-500">{createdDate}</span>
                        <span className="text-gray-400">•</span>
                        <span className={statusColor}>{tx.paymentStatus}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="font-extrabold text-lg text-gray-900">
                        UGX {Number(tx.amount || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 font-semibold">
                        {tx.points} points
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Payment Modal — single Payment flow */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-2xl font-extrabold text-gray-900">
                  Payment — Points + Mobile Money
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Apply points and complete the remainder with mobile money.
                </p>
              </div>
              <button
                onClick={() => {
                  setPayingInvoice(null);
                  setAccountName(null);
                  setVerified(false);
                  setPayPhone("");
                  setPhoneError(null);
                  setPointsToUse(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-md"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden mb-3 border border-pink-50 shadow-sm">
              <div className="bg-linear-to-r from-pink-50 via-white to-yellow-50 px-4 py-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[11px] text-gray-600 font-medium mb-0.5">
                      Invoice
                    </p>
                    <p className="text-base font-extrabold text-gray-900">
                      {payingInvoice}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[11px] text-gray-600 font-medium mb-0.5">
                      Balance Due
                    </p>
                    <p className="text-base font-extrabold text-[#D81B60] leading-tight">
                      UGX{" "}
                      {Number(
                        invoices.find((i) => i.details?.id === payingInvoice)
                          ?.amount_less ??
                          invoices.find((i) => i.details?.id === payingInvoice)
                            ?.details?.invoice_amount ??
                          0,
                      ).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-gray-500 leading-tight">
                      Equivalent:{" "}
                      {Math.ceil(
                        (invoices.find((i) => i.details?.id === payingInvoice)
                          ?.amount_less ??
                          invoices.find((i) => i.details?.id === payingInvoice)
                            ?.details?.invoice_amount ??
                          0) / ugxPerPoint,
                      ).toLocaleString()}{" "}
                      pts
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FlexPay controls */}
            <div className="mb-4">
              <p className="text-sm font-bold text-gray-700 uppercase mb-2">
                Apply points
              </p>
              <p className="text-sm text-gray-600">
                Slide to choose how many points to apply.
              </p>

              <div className="mt-4">
                <p className="text-sm font-bold">
                  Your balance: {pointsBalance.toLocaleString()} pts (UGX{" "}
                  {pointsToUGX(pointsBalance).toLocaleString()})
                </p>

                <div className="mt-3">
                  {/* compute invoice-specific values */}
                  {(() => {
                    const invoice = invoices.find(
                      (i) => i.details?.id === payingInvoice,
                    );
                    const amount = Number(
                      invoice?.amount_less ??
                        invoice?.details?.invoice_amount ??
                        0,
                    );
                    const pointsEquivalent =
                      invoice?.pointsEquivalent ?? ugxToPoints(amount);
                    const safeMaxPoints = computeMaxPointsForInvoice(
                      amount,
                      pointsEquivalent,
                    );
                    // Set a default if not already set
                    if (pointsToUse === null) {
                      // set default to min(safeMaxPoints, pointsBalance) — let this be 0 if not possible
                      setPointsToUse((prev) => {
                        if (prev !== null) return prev;
                        return Math.max(
                          0,
                          Math.min(pointsBalance, safeMaxPoints),
                        );
                      });
                    }

                    return (
                      <>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(0, safeMaxPoints)}
                          value={Math.max(0, pointsToUse ?? 0)}
                          onChange={(e) =>
                            setPointsToUse(Number(e.target.value))
                          }
                          className="w-full"
                        />

                        <div className="flex justify-between text-xs text-gray-600 mt-2">
                          <span>0 pts</span>
                          <span>
                            {Math.max(0, safeMaxPoints).toLocaleString()} pts
                          </span>
                        </div>

                        <div className="mt-3 text-sm">
                          <p>
                            Applying:{" "}
                            <span className="font-bold">
                              {(pointsToUse ?? 0).toLocaleString()} pts • UGX{" "}
                              {pointsToUGX(pointsToUse ?? 0).toLocaleString()}
                            </span>
                          </p>

                          <p className="text-sm mt-1">
                            Remaining to pay by mobile money:{" "}
                            <span className="font-bold">
                              UGX{" "}
                              {(() => {
                                const remaining = Math.max(
                                  0,
                                  amount - pointsToUGX(pointsToUse ?? 0),
                                );
                                return remaining.toLocaleString();
                              })()}
                            </span>
                          </p>

                          {(() => {
                            const remaining = Math.max(
                              0,
                              amount - pointsToUGX(pointsToUse ?? 0),
                            );
                            if (remaining <= 0) {
                              return (
                                <p className="text-xs mt-2 text-red-600">
                                  Reduce points so that there is a mobile-money
                                  portion (Payment requires both).
                                </p>
                              );
                            }
                            if ((pointsToUse ?? 0) <= 0) {
                              return (
                                <p className="text-xs mt-2 text-yellow-700">
                                  Please choose points to apply for Payment.
                                </p>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Phone input for mobile money portion */}
            <div className="mb-6">
              <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
                Phone Number
              </label>
              <div className="relative">
                <input
                  value={payPhone}
                  onChange={(e) => {
                    const digits = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    setPayPhone(digits);
                    setAccountName(null);
                    setVerified(false);
                    setPhoneError(null);
                    if (digits.length === 10) verifyPhoneNumber(digits);
                  }}
                  placeholder="07XXXXXXXX"
                  maxLength={10}
                  className={`w-full py-2 px-4 bg-gray-50 border-2 rounded-xl outline-none focus:border-[#D81B60] transition-all ${
                    verified
                      ? "border-green-500"
                      : phoneError
                        ? "border-red-500"
                        : "border-gray-200"
                  }`}
                />
                {verifying && (
                  /* Adjusted top-4 to a centered positioning */
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#D81B60]" />
                  </div>
                )}
              </div>

              {accountName && (
                <div className="mt-2 flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-lg border border-green-100">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">
                    {accountName}
                  </span>
                </div>
              )}
              {phoneError && (
                <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">{phoneError}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setPayingInvoice(null);
                  setAccountName(null);
                  setVerified(false);
                  setPayPhone("");
                  setPhoneError(null);
                  setPointsToUse(null);
                }}
                className="bg-gray-200 text-black font-semibold py-2 px-6 rounded-lg"
              >
                Cancel
              </button>

              <Button
                onClick={() => handlePayInvoice(payingInvoice!)}
                disabled={
                  loading ||
                  verifying ||
                  !verified ||
                  (pointsToUse ?? 0) <= 0 ||
                  (() => {
                    const invoice = invoices.find(
                      (i) => i.details?.id === payingInvoice,
                    );
                    const amount = Number(
                      invoice?.amount_less ??
                        invoice?.details?.invoice_amount ??
                        0,
                    );
                    const remaining = Math.max(
                      0,
                      amount - pointsToUGX(pointsToUse ?? 0),
                    );
                    return remaining <= 0;
                  })()
                }
                className="bg-[#e9e0e3] text-gray-900 font-semibold py-2 px-6 rounded-lg"
              >
                {loading ? "Processing..." : "Continue"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onPaid={async () => {
            await fetchInvoices();
            setSelectedInvoice(null);
            showToast("Payment successful", "success");
          }}
        />
      )}

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-2xl font-extrabold text-gray-900">
                Transaction Details
              </h4>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-600 font-bold uppercase mb-1 tracking-wider">
                  Transaction ID
                </p>
                <p className="text-lg font-extrabold text-gray-900">
                  {selectedTransaction.transactionId}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-600 font-bold uppercase mb-1 tracking-wider">
                  Status
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${selectedTransaction.paymentStatus === "SUCCESS" ? "bg-green-500" : selectedTransaction.paymentStatus === "PENDING" ? "bg-yellow-500" : "bg-red-500"}`}
                  />
                  <p
                    className={`font-bold text-base ${selectedTransaction.paymentStatus === "SUCCESS" ? "text-green-600" : selectedTransaction.paymentStatus === "PENDING" ? "text-yellow-600" : "text-red-600"}`}
                  >
                    {selectedTransaction.paymentStatus}
                  </p>
                </div>
              </div>

              <div className="bg-linear-to-r from-pink-50 to-orange-50 rounded-xl p-4 border border-pink-100">
                <p className="text-xs text-gray-600 font-bold uppercase mb-1 tracking-wider">
                  Amount
                </p>
                <p className="text-2xl font-extrabold text-[#D81B60]">
                  UGX {Number(selectedTransaction.amount).toLocaleString()}
                </p>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <p className="text-xs text-gray-600 font-bold uppercase mb-1 tracking-wider">
                  Points Earned
                </p>
                <p className="text-2xl font-extrabold text-purple-600">
                  {selectedTransaction.points} pts
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-600 font-bold uppercase mb-1 tracking-wider">
                  Payment Method
                </p>
                <p className="text-base font-bold text-gray-900">
                  {selectedTransaction.paymentMethod}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-600 font-bold uppercase mb-1 tracking-wider">
                  Reference
                </p>
                <p className="text-base font-bold text-gray-900">
                  {selectedTransaction.reference}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-600 font-bold uppercase mb-1 tracking-wider">
                  Date
                </p>
                <p className="text-base font-bold text-gray-900">
                  {new Date(selectedTransaction.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </p>
              </div>

              {selectedTransaction.confirmedAt && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-600 font-bold uppercase mb-1 tracking-wider">
                    Confirmed
                  </p>
                  <p className="text-base font-bold text-gray-900">
                    {new Date(
                      selectedTransaction.confirmedAt,
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="w-full bg-[#D81B60] text-white font-bold py-3 rounded-xl hover:bg-[#c01a5e] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
