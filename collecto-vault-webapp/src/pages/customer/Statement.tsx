// StatementWithPoints.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import TopNav from "../../components/TopNav";
import {
  ArrowDownLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { invoiceService } from "../../api/collecto";
import api from "../../api";
import InvoiceDetailModal from "./InvoiceDetailModal";
import Button from "../../components/Button";
import { customerService } from "../../api/customer";

/* =========================
   Local Toast
========================= */
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

/* =========================
   Storage
========================= */
const vaultOTPToken = sessionStorage.getItem("vaultOtpToken") || undefined;
const collectoId = localStorage.getItem("collectoId") || undefined;
const clientId = localStorage.getItem("clientId") || undefined;

/* =========================
   Component
========================= */
export default function StatementWithPoints() {
  const location = useLocation();
  
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

  const [staffId, setStaffId] = useState<string>("");
  const [mobileAmount, setMobileAmount] = useState<number | undefined>(
    undefined,
  );

  // Selection / modals
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(
    null,
  );

  // Payment controls
  const [payPhone, setPayPhone] = useState("");
  const [pointsToUse, setPointsToUse] = useState<number>(0);

  // Phone verification
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Customer data
  const [pointsBalance, setPointsBalance] = useState<number>(0);
  const [tier, setTier] = useState<string | null>(null);
  const [tierProgress, setTierProgress] = useState<number>(0);

  const [ugxPerPoint, setUgxPerPoint] = useState<number>(1);

  // Payment result / status
  const [paymentResult, setPaymentResult] = useState<null | {
    transactionId: string | null;
    message?: string;
    status?: string;
  }>(null);

  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [lastQueriedStatus, setLastQueriedStatus] = useState<string | null>(
    null,
  );

  const { toast, showToast } = useLocalToast();

  // Polling ref
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* =========================
     Helpers
  ========================= */
  const pointsToUGX = (points: number) => Math.round(points * ugxPerPoint);
  const ugxToPoints = (ugx: number) => Math.ceil(ugx / ugxPerPoint);

  const computeMaxPointsForInvoice = (
    invoiceAmount: number,
    invoicePointsEquivalent: number,
  ) => {
    const maxFromAmount = Math.max(
      0,
      Math.floor((invoiceAmount - 1) / ugxPerPoint),
    );
    return Math.min(pointsBalance, invoicePointsEquivalent, maxFromAmount);
  };

  const getInvoiceById = useCallback(
    (id: string | null) => {
      if (!id) return null;
      return invoices.find((i) => i.details?.id === id) ?? null;
    },
    [invoices],
  );

  /* =========================
     Auto Polling
  ========================= */
  useEffect(() => {
    const txId = paymentResult?.transactionId ?? null;

    if (!txId) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    if (lastQueriedStatus === "success" || lastQueriedStatus === "failed") {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    if (!pollIntervalRef.current) {
      pollIntervalRef.current = setInterval(async () => {
        await queryTxStatus(txId);
      }, 3000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [paymentResult?.transactionId, lastQueriedStatus]);


  const fetchActivePackages = useCallback(async () => {
    setLoadingType("packages");
    setLoading(true);
    try {
      const collectoId = localStorage.getItem("collectoId") || "";
      const clientId = localStorage.getItem("clientId") || "";

      const res = await api.post("/loyaltySettings", {
        collectoId,
        clientId,
      });

      const loyaltySettings = res?.data?.data?.loyaltySettings ?? {};
      const tiers = loyaltySettings.purchase_tiers ?? [];

      const mapped = (tiers || []).map((tier: any, index: number) => ({
        id: tier.id ?? `${tier.name}-${tier.points}-${tier.cost}-${index}`,
        points: tier.points ?? 0,
        price: tier.cost ?? 0,
        recommended: false,
        label: tier.name || `Package ${index + 1}`,
      }));

      setPackages(mapped);

      const pointValue = loyaltySettings.point_value;
      if (typeof pointValue === "number" && pointValue > 0) {
        setUgxPerPoint(pointValue);
      } else {
        const totalPoints = mapped.reduce((s: number, p: any) => s + (p.points || 0), 0);
        const totalPrice = mapped.reduce((s: number, p: any) => s + (p.price || 0), 0);
        setUgxPerPoint(totalPoints > 0 ? totalPrice / totalPoints : 1);
      }

      return mapped;
    } catch (err) {
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
        const res = await invoiceService.getInvoices({
          vaultOTPToken,
          collectoId,
          clientId,
          invoiceId: invoiceId ?? null,
        });

        const innerData = res.data?.data?.data || res.data?.data;
        let invoiceArray;
        
        if (Array.isArray(innerData)) {
          invoiceArray = innerData;
        } else if (innerData && typeof innerData === 'object' && innerData.details) {
          // Single invoice object - wrap it in an array
          invoiceArray = [innerData];
        } else {
          invoiceArray = [];
        }
        
        const validatedData = invoiceArray;

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
    setLoadingType("transactions");
    try {
      const customerId = clientId || "";
      
      // Get transactions from loyaltySettings
      const customerRes = await customerService.getCustomerData(collectoId || "", customerId || "");
      const loyaltySettings = customerRes.data?.data?.loyaltySettings ?? {};
      const cashDetails = loyaltySettings?.client_cash_details ?? {};
      const cashTransactions = Array.isArray(cashDetails?.transactions) ? cashDetails.transactions : [];
      
      setTransactions(cashTransactions);
      return cashTransactions;
    } catch (err) {
      console.error("Fetch Transactions Error:", err);
      setTransactions([]);
      return [];
    } finally {
      setLoadingType(null);
    }
  }, [collectoId, clientId]);

  const fetchCustomerAndRelated = useCallback(async () => {
    if (!clientId) return;
    try {
      const customerRes = await customerService.getCustomerData(collectoId || "", clientId || "");
      const loyaltySettings = customerRes.data?.data?.loyaltySettings;

      const points =
        loyaltySettings?.points ??
        ((loyaltySettings?.loyalty_points?.earned ?? 0) +
          (loyaltySettings?.loyalty_points?.bought ?? 0));

      setPointsBalance(points || 0);
      setTier('N/A');
      setTierProgress(0);
    } catch (err) {
      console.error("Error fetching customer data:", err);
    }
  }, [collectoId, clientId]);

  // Load packages separately to avoid blocking invoice/transaction fetching
  useEffect(() => {
    fetchActivePackages();
  }, []);

  // Load statement data (invoices, transactions, customer) in parallel
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Check if we're navigating from invoice creation with a specific invoiceId
        const invoiceIdFromState = (location.state as any)?.invoiceId;
        
        // Run customer data, invoices, and transactions in parallel
        const invoicePromise = invoiceIdFromState 
          ? fetchInvoices(invoiceIdFromState)
          : fetchInvoices();

        await Promise.all([
          fetchCustomerAndRelated(),
          invoicePromise,
          fetchTransactions(),
        ]);
      } catch (err) {
        console.error("Error in initial load:", err);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);

      const targetInvoice = invoices.find(
        (inv) => inv.details?.id === invoiceId,
      );

      const balanceDue = Number(
        targetInvoice?.amount_less ??
          targetInvoice?.details?.invoice_amount ??
          0,
      );

      const pointsUse = Math.max(0, Math.floor(pointsToUse || 0));
      const pointsValueUGX = pointsUse * ugxPerPoint;

      const mobilePayment =
        typeof mobileAmount === "number"
          ? mobileAmount
          : Math.max(0, balanceDue - pointsValueUGX);

      if (!payPhone || !verified) {
        showToast(
          "Please verify a phone number for the mobile money portion.",
          "error",
        );
        setLoading(false);
        return;
      }

      if (mobilePayment <= 0) {
        showToast("Please leave a mobile money portion > 0 UGX.", "error");
        setLoading(false);
        return;
      }

      const formattedPhone = payPhone.startsWith("0")
        ? payPhone.replace(/^0/, "256")
        : payPhone;

      const payload: any = {
        vaultOTPToken,
        collectoId,
        clientId,
        reference: invoiceId,
        paymentOption: "mobilemoney",
        phone: formattedPhone,
        staffId: staffId || "",
        amount: mobilePayment,
      };

      if (pointsUse > 0) {
        payload.points = {
          points_used: pointsUse,
          discount_amount: pointsValueUGX,
        };
      }

      const response = await invoiceService.payInvoice(payload);
      const apiPayload = response.data ?? {};

      const transactionId =
        apiPayload?.data?.transactionId ??
        apiPayload?.data?.transaction_id ??
        apiPayload?.transactionId ??
        apiPayload?.transaction_id ??
        apiPayload?.txId ??
        apiPayload?.tx_id ??
        null;

      const resultData = {
        transactionId,
        message:
          apiPayload?.data?.message ||
          apiPayload?.message ||
          "Payment initiated — check your phone.",
        status: apiPayload?.status_message || apiPayload?.status || undefined,
      };

      if (pointsUse > 0) {
        setPointsBalance((p) => Math.max(0, p - pointsUse));
      }

      setPaymentResult(resultData);
      showToast("Payment initiated — checking status...", "success");

      if (transactionId) {
        setTimeout(() => {
          queryTxStatus(transactionId);
        }, 400);
      }

      await Promise.allSettled([fetchInvoices(), fetchTransactions()]);

      setStaffId("");
      setPayPhone("");
      setAccountName(null);
      setVerified(false);
      setPhoneError(null);
    } catch (err: any) {
      console.error("Payment failed:", err);
      const errorMsg =
        err?.response?.data?.message || err?.message || "Payment failed";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };


  const queryTxStatus = async (txIdParam?: string | null) => {
    const finalTxId = txIdParam ?? paymentResult?.transactionId;

    if (!finalTxId) {
      setQueryError("No transaction ID found to track.");
      return;
    }

    setQueryLoading(true);
    setQueryError(null);

    try {
      const res = await api.post("/requestToPayStatus", {
        vaultOTPToken,
        collectoId,
        clientId,
        transactionId: String(finalTxId),
      });

      const data = res?.data ?? {};

      const statusRaw =
        data?.status ??
        data?.payment?.status ??
        data?.paymentStatus ??
        data?.data?.status ??
        data?.data?.paymentStatus ??
        data?.status_message ??
        data?.payment?.status_message ??
        "pending";

      const status = String(statusRaw).toLowerCase().trim();

      const message =
        data?.message ??
        data?.status_message ??
        data?.payment?.message ??
        null;

      if (["confirmed", "success", "paid", "completed", "true","successful","successfull"].includes(status)) {
        setLastQueriedStatus("success");
        await fetchTransactions();
        setPaymentResult((prev) =>
          prev ? { ...prev, status: "success", message } : prev,
        );
      } else if (["pending", "processing", "in_progress"].includes(status)) {
        setLastQueriedStatus("pending");
        setPaymentResult((prev) =>
          prev ? { ...prev, status: "pending", message } : prev,
        );
      } else if (["failed", "false"].includes(status)) {
        setLastQueriedStatus("failed");
        setPaymentResult((prev) =>
          prev ? { ...prev, status: "failed", message } : prev,
        );
      } else {
        setQueryError(message || "Transaction status unknown.");
      }
    } catch (err: any) {
      console.error("Status Query Error:", err);
      setQueryError(
        err?.response?.data?.message || "Unable to reach payment server.",
      );
    } finally {
      setQueryLoading(false);
    }
  };

  useEffect(() => {
    if (!payingInvoice) {
      setPointsToUse(0);
      setMobileAmount(undefined);
      setStaffId("");
      setPayPhone("");
      setAccountName(null);
      setVerified(false);
      setPhoneError(null);
      setPaymentResult(null);
      setQueryError(null);
      setLastQueriedStatus(null);
      return;
    }

    const invoice = getInvoiceById(payingInvoice);
    if (!invoice) return;

    const amount = Number(
      invoice?.amount_less ?? invoice?.details?.invoice_amount ?? 0,
    );

    setPointsToUse(0);
    setMobileAmount(amount);
    setPaymentResult(null);
    setQueryError(null);
    setLastQueriedStatus(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payingInvoice]); 

  /* =========================
     Derived Values
  ========================= */
  const currentInvoice = useMemo(
    () => getInvoiceById(payingInvoice),
    [getInvoiceById, payingInvoice],
  );

  const currentInvoiceAmount = useMemo(() => {
    if (!currentInvoice) return 0;
    return Number(
      currentInvoice?.amount_less ??
        currentInvoice?.details?.invoice_amount ??
        0,
    );
  }, [currentInvoice]);

  const currentPointsEquivalent =
    currentInvoice?.pointsEquivalent ?? ugxToPoints(currentInvoiceAmount);

  const safeMaxPoints = computeMaxPointsForInvoice(
    currentInvoiceAmount,
    currentPointsEquivalent,
  );

  const onSliderChange = (pts: number) => {
    const clamped = Math.max(0, Math.min(safeMaxPoints, pts));
    setPointsToUse(clamped);
    const remaining = Math.max(0, currentInvoiceAmount - pointsToUGX(clamped));
    setMobileAmount(remaining);
  };

  const onMobileAmountChange = (value: number) => {
    const newMobile = Math.max(0, value);
    setMobileAmount(newMobile);

    const impliedPointsUGX = Math.max(0, currentInvoiceAmount - newMobile);
    const impliedPoints = ugxToPoints(impliedPointsUGX);
    const newPts = Math.max(0, Math.min(safeMaxPoints, impliedPoints));
    setPointsToUse(newPts);
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
            transactions
              .filter((tx: any) =>
                !tx.status || ["success", "pending"].includes(tx.status.toLowerCase())
              )
              .map((tx: any) => {
                const statusColor =
                  tx.status === "SUCCESSFUL" || tx.status === "success"
                    ? "text-green-600"
                    : tx.status === "PENDING" || tx.status === "pending"
                      ? "text-yellow-600"
                      : "text-red-600";
                const transactionDate = tx.cash_date || new Date(tx.createdAt || tx.updated_on).toLocaleDateString(
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
                          {tx.cash_type || 'Transaction'}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] uppercase font-extrabold tracking-wider">
                          <span className="text-gray-500">{transactionDate}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">{tx.user_type || 'CLIENT'}</span>
                          <span className="text-gray-400">•</span>
                          <span className={statusColor}>{tx.status || 'PENDING'}</span>
                        </div>
                        {tx.reference && (
                          <div className="text-xs text-gray-500 mt-1">
                            Ref: {tx.reference}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="font-extrabold text-lg text-gray-900">
                          UGX {Number(tx.amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </main>

       {payingInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xl font-extrabold text-gray-900">
                  Points + Mobile Money
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Apply points and complete the remainder with mobile money.
                </p>
              </div>
              <button
                onClick={() => {
                  setPayingInvoice(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-md"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Payment result / query feedback - SHOW AT TOP if exists */}
            {paymentResult && (
              <>
                <div className={`mb-4 p-4 rounded-lg border-2 ${
                  lastQueriedStatus === "success"
                    ? "bg-green-50 border-green-300"
                    : lastQueriedStatus === "failed"
                      ? "bg-red-50 border-red-300"
                      : "bg-blue-50 border-blue-300"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {lastQueriedStatus === "success" && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    )}
                    {lastQueriedStatus === "failed" && (
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    )}
                    {(!lastQueriedStatus || lastQueriedStatus === "pending") && (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                    )}
                    <p className={`text-sm font-bold ${
                      lastQueriedStatus === "success"
                        ? "text-green-700"
                        : lastQueriedStatus === "failed"
                          ? "text-red-700"
                          : "text-blue-700"
                    }`}>
                      {lastQueriedStatus === "success"
                        ? "✅ Payment Confirmed!"
                        : lastQueriedStatus === "failed"
                          ? "❌ Payment Failed"
                          : "⏳ Processing Payment..."}
                    </p>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2">{paymentResult.message}</p>

                  {lastQueriedStatus && (
                    <p className={`text-xs font-semibold ${
                      lastQueriedStatus === "success"
                        ? "text-green-600"
                        : lastQueriedStatus === "failed"
                          ? "text-red-600"
                          : "text-blue-600"
                    }`}>
                      Status: {lastQueriedStatus.toUpperCase()}
                    </p>
                  )}

                  {queryError && (
                    <p className="mt-2 text-xs text-red-600 font-medium">{queryError}</p>
                  )}

                  {/* Query button in status box */}
                  {lastQueriedStatus === "pending" && (
                    <button
                      onClick={() => queryTxStatus(paymentResult.transactionId)}
                      disabled={queryLoading}
                      className="mt-3 w-full bg-blue-600 text-white font-semibold py-2 px-3 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {queryLoading ? "⏳ Checking..." : "🔄 Check Status Now"}
                    </button>
                  )}
                </div>
                <hr className="mb-4 border-gray-200" />
              </>
            )}

            {/* Invoice and payment form - HIDE when result shows */}
            {!paymentResult && (
              <>
                <div className="rounded-2xl overflow-hidden mb-3 border border-pink-50 shadow-sm">
              <div className="px-4 py-2">
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
                        getInvoiceById(payingInvoice)?.amount_less ??
                          getInvoiceById(payingInvoice)?.details
                            ?.invoice_amount ??
                          0,
                      ).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-gray-500 leading-tight">
                      Equivalent:{" "}
                      {Math.ceil(
                        (getInvoiceById(payingInvoice)?.amount_less ??
                          getInvoiceById(payingInvoice)?.details
                            ?.invoice_amount ??
                          0) / ugxPerPoint,
                      ).toLocaleString()}{" "}
                      pts
                    </p>
                  </div>
                </div>
              </div>
            </div>

            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-gray-700 uppercase mb-1">
                    Apply points (Slide)
                  </p>
                </div>

                {/* Show points balance / value */}
                <div className="text-right text-xs">
                  <p className="font-semibold">Balance</p>
                  <p>{pointsBalance.toLocaleString()} pts</p>
                  <p className="text-gray-500">
                    UGX {pointsToUGX(pointsBalance).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-2">
                <input
                  type="range"
                  min={0}
                  max={safeMaxPoints}
                  value={pointsToUse}
                  onChange={(e) => onSliderChange(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>0 pts</span>
                  <span>{safeMaxPoints.toLocaleString()} pts</span>
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Points applied</p>
                    <p className="text-lg font-bold">
                      {pointsToUse.toLocaleString()} pts
                    </p>
                  </div>

                  <div className="flex-1 text-right">
                    <p className="text-xs text-gray-500">Value</p>
                    <p className="text-lg font-bold">
                      UGX {pointsToUGX(pointsToUse).toLocaleString()}
                    </p>
                  </div>
                </div>

                
                <div className="flex items-start gap-3 mt-4">
                  <div className="flex-1" style={{ flexBasis: "40%" }}>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                      Staff ID
                    </label>
                    <input
                      type="text"
                      placeholder="Staff ID"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      className="w-full py-1.5 px-2 text-sm border border-gray-200 rounded-lg focus:border-[#D81B60] outline-none transition-colors"
                    />
                  </div>

                  <div className="flex-1" style={{ flexBasis: "60%" }}>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                      Amount (mobile money)
                    </label>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={
                        typeof mobileAmount === "number" ? mobileAmount : ""
                      }
                      onChange={(e) =>
                        onMobileAmountChange(Number(e.target.value))
                      }
                      className="w-full py-1.5 px-2 text-sm border border-gray-200 rounded-lg focus:border-[#D81B60] outline-none transition-colors"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Total invoice: UGX {currentInvoiceAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Optional warning if points exceed invoice */}
                {(() => {
                  const remaining = Math.max(
                    0,
                    currentInvoiceAmount - pointsToUGX(pointsToUse ?? 0),
                  );
                  if ((pointsToUse ?? 0) > 0 && remaining <= 0) {
                    return (
                      <p className="text-xs mt-2 text-red-600">
                        Reduce points so that there is a mobile-money portion.
                      </p>
                    );
                  }
                  return null;
                })()}
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
                  className={`w-full py-1.5 px-3 bg-gray-50 border-2 rounded-lg text-sm outline-none focus:border-[#D81B60] transition-all ${
                    verified
                      ? "border-green-500"
                      : phoneError
                        ? "border-red-500"
                        : "border-gray-200"
                  }`}
                />
                {verifying && (
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

                {/* Action buttons */}
                <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setPayingInvoice(null);
                    }}
                    className="bg-gray-100 text-gray-700 font-bold py-1.5 px-4 rounded-md text-sm hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>

                  <Button
                    onClick={() => handlePayInvoice(payingInvoice!)}
                    disabled={loading || verifying || !verified}
                    className="bg-[#e9e0e3] text-gray-900 font-bold py-1.5 px-5 rounded-md text-sm disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Continue"}
                  </Button>
                </div>
              </>
            )}

            {/* Close button when showing result */}
            {paymentResult && (
              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setPayingInvoice(null);
                  }}
                  className="bg-gray-900 text-white font-bold py-2 px-6 rounded-md text-sm hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
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
          <div className="bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 pb-2 flex justify-between items-start border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                {selectedTransaction.reference || 'Transaction'}
              </h2>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <table className="w-full">
                <tbody className="text-gray-700 text-sm">
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 font-bold text-gray-800 w-2/5 text-xs tracking-wider">
                      Amount
                    </td>
                    <td className="py-2.5 text-right font-bold text-[#D81B60] text-base">
                      UGX {Number(selectedTransaction.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 font-bold text-gray-800 text-xs tracking-wider">
                      Status
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            selectedTransaction.status === "SUCCESSFUL" || selectedTransaction.status === "success"
                              ? "bg-green-500"
                              : selectedTransaction.status === "PENDING" || selectedTransaction.status === "pending"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                        />
                        <span
                          className={`font-bold text-xs ${
                            selectedTransaction.status === "SUCCESSFUL" || selectedTransaction.status === "success"
                              ? "text-green-600"
                              : selectedTransaction.status === "PENDING" || selectedTransaction.status === "pending"
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {selectedTransaction.status || 'PENDING'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 font-bold text-gray-800 text-xs tracking-wider">
                      Type
                    </td>
                    <td className="py-2.5 text-right text-xs">
                      {selectedTransaction.cash_type || 'N/A'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 font-bold text-gray-800 text-xs tracking-wider">
                      Date
                    </td>
                    <td className="py-2.5 text-right text-xs">
                      {selectedTransaction.cash_date || new Date(selectedTransaction.updated_on || selectedTransaction.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 font-bold text-gray-800 text-xs tracking-wider">
                      User Type
                    </td>
                    <td className="py-2.5 text-right text-xs">
                      {selectedTransaction.user_type || 'CLIENT'}
                    </td>
                  </tr>
                  {selectedTransaction.shared_by_name && (
                    <tr>
                      <td className="py-2.5 font-bold text-gray-800 text-xs tracking-wider">
                        Shared By
                      </td>
                      <td className="py-2.5 text-right text-xs">
                        {selectedTransaction.shared_by_name}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Action Buttons - 50/50 */}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
              <button
                onClick={() => queryTxStatus(selectedTransaction.reference)}
                disabled={queryLoading}
                className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-xs"
              >
                {queryLoading ? "⏳ Checking..." : "🔄 Query"}
              </button>

              <button
                onClick={() => setSelectedTransaction(null)}
                className="flex-1 bg-[#D81B60] text-white font-bold py-2 rounded-lg hover:bg-[#c01a5e] transition-colors text-xs"
              >
                Close
              </button>
            </div>

            {/* Error/Status Messages */}
            {queryError && (
              <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-xs text-red-600">
                {queryError}
              </div>
            )}
            {lastQueriedStatus && (
              <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 text-xs text-blue-700">
                Last check: <span className="font-bold">{lastQueriedStatus.toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
