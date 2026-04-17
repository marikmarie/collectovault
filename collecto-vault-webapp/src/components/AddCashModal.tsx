import { useEffect, useState, useRef } from "react";
import { X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { invoiceService } from "../api/collecto";
import { customerService } from "../api/customer";
import api from "../api";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  clientAddCash?: {
    charge: number;
    charge_client: number;
  };
};

export default function AddCashModal({ open, onClose,  clientAddCash }: Props) {
  const [amount, setAmount] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [verified, setVerified] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [accountName, setAccountName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchedClientAddCash, setFetchedClientAddCash] = useState<any>(null);
  const [chargeAmount, setChargeAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  // Payment result / status tracking
  const [paymentResult, setPaymentResult] = useState<null | {
    transactionId: string | null;
    message?: string;
    status?: string;
  }>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [lastQueriedStatus, setLastQueriedStatus] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) {
      // Clean up polling on close
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      
      setAmount("");
      setPhone("");
      setVerified(false);
      setVerifying(false);
      setAccountName("");
      setError("");
      setLoading(false);
      setPaymentResult(null);
      setQueryError(null);
      setLastQueriedStatus(null);

      // Fetch clientAddCash if not provided
      if (!clientAddCash) {
        fetchClientAddCash();
      }
    }
  }, [open, clientAddCash]);

  // Auto-polling effect
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
      }, 10000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [paymentResult?.transactionId, lastQueriedStatus]);

  useEffect(() => {
    const numAmount = Number(amount) || 0;
    const effectiveClientAddCash = clientAddCash || fetchedClientAddCash;
    if (effectiveClientAddCash && effectiveClientAddCash.charge_client === 1) {
      const charge = (numAmount * effectiveClientAddCash.charge) / 100;
      setChargeAmount(charge);
      setTotalAmount(numAmount + charge);
    } else {
      setChargeAmount(0);
      setTotalAmount(numAmount);
    }
  }, [amount, clientAddCash, fetchedClientAddCash]);

  const fetchClientAddCash = async () => {
    try {
      const collectoId = localStorage.getItem("collectoId") || "";
      const clientId = localStorage.getItem("clientId") || "";
      const customerRes = await customerService.getCustomerData(collectoId, clientId);
      const loyaltySettings = customerRes.data?.data?.loyaltySettings ?? {};
      setFetchedClientAddCash(loyaltySettings?.client_add_cash);
    } catch (err) {
      console.error('Failed to fetch clientAddCash:', err);
    }
  };

  const verifyPhone = async (phoneValue?: string) => {
    const trimmed = ((phoneValue ?? phone) || "").trim();
    if (!/^0?7\d{8}$/.test(trimmed)) {
      setError("Please enter a valid 10-digit mobile number starting with 07");
      return;
    }

    setError("");
    setVerifying(true);
    try {
      const collectoId = localStorage.getItem("collectoId") || "";
      const clientId = localStorage.getItem("clientId") || "";

      const res = await invoiceService.verifyPhone({
        vaultOTPToken: sessionStorage.getItem("vaultOtpToken") || undefined,
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
        "";

      const verifiedFlag =
        Boolean(nested?.verifyPhoneNumber ?? deeper?.verifyPhoneNumber) ||
        String(payload?.status_message ?? "").toLowerCase() === "success";

      if (verifiedFlag) {
        setVerified(true);
        setAccountName(name || "Verified");
        setError("");
      } else {
        setVerified(false);
        setAccountName("");
        setError(
          nested?.message ?? payload?.message ?? "Phone verification failed",
        );
      }
    } catch (err: any) {
      setVerified(false);
      setAccountName("");
      setError(err?.message ?? "Unable to verify phone");
    } finally {
      setVerifying(false);
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
      const vaultOTPToken = sessionStorage.getItem("vaultOtpToken") || undefined;
      const collectoId = localStorage.getItem("collectoId") || "";
      const clientId = localStorage.getItem("clientId") || "";

      const res = await api.post("/requestToPayStatus", {
        vaultOTPToken,
        collectoId,
        clientId,
        transactionId: String(finalTxId),
        clientAddCash: clientAddCash || fetchedClientAddCash || undefined,
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

      if (["confirmed", "success", "paid", "completed", "true", "successful", "successfull"].includes(status)) {
        setLastQueriedStatus("success");
        setQueryError(null);
        setPaymentResult((prev) =>
          prev ? { ...prev, status: "success", message } : prev,
        );
      } else if (["pending", "processing", "in_progress"].includes(status)) {
        setLastQueriedStatus("pending");
        setQueryError(null);
        setPaymentResult((prev) =>
          prev ? { ...prev, status: "pending", message } : prev,
        );
      } else if (["failed", "false"].includes(status)) {
        setLastQueriedStatus("failed");
        setQueryError(null);
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

  const submit = async () => {
    if (!verified) {
      setError("Please verify phone before adding cash.");
      return;
    }

    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      setError("Please enter a valid amount above 0.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const collectoId = localStorage.getItem("collectoId") || "";
      const clientId = localStorage.getItem("clientId") || "";

      let effectiveClientAddCash = clientAddCash || fetchedClientAddCash;
      if (effectiveClientAddCash) {
        effectiveClientAddCash = { ...effectiveClientAddCash };
        effectiveClientAddCash.charge = effectiveClientAddCash.charge_client === 1 ? effectiveClientAddCash.charge : 0;
      }

      const requestPayload = {
        vaultOTPToken: sessionStorage.getItem("vaultOtpToken") || undefined,
        collectoId,
        clientId,
        paymentOption: "mobilemoney",
        phone: trimmedPhone(phone),
        amount: parsed,
        reference: `ADDCASH-${Date.now()}`,
        clientAddCash: effectiveClientAddCash || {
          charge: 0,
          charge_client: 0,
        },
      };

     
     // const response = await invoiceService.requestPayment(requestPayload);
      const response = await invoiceService.clientAddCash(requestPayload);
      
      const responseData = response?.data ?? {};
      const innerData = responseData.data ?? responseData;
      const txId = innerData.transactionId ?? innerData.transaction_id ?? innerData.id ?? responseData.transactionId ?? responseData.transaction_id ?? responseData.id ?? null;
      const status = String(responseData?.status ?? "").toLowerCase();

      if (txId && (status === "200" || status === "success" || txId)) {
        // Set payment result to start polling
        setPaymentResult({
          transactionId: txId,
          status: "pending",
          message: innerData?.message ?? responseData?.message ?? "Payment request sent. Waiting for confirmation...",
        });
        setLastQueriedStatus("pending");
        // Start querying immediately
        setTimeout(() => queryTxStatus(txId), 1000);
      } else {
        setError(
          innerData?.message ?? responseData?.message ?? "Failed to create add-cash request",
        );
      }
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong while adding cash");
    } finally {
      setLoading(false);
    }
  };

  const trimmedPhone = (value: string) => {
    const num = value.trim();
    if (num.startsWith("0")) {
      return `256${num.slice(1)}`;
    }
    if (num.startsWith("+256")) {
      return num.replace("+", "");
    }
    return num;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold">Add Cash</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {!paymentResult ? (
            <>
              <div className="text-sm text-gray-600">
                Add cash using your mobile money number (MTN/ Airtel).{" "}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">
                  Amount (UGX)
                </label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min={5000}
                  placeholder="500000"
                  className="w-full mt-1 px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-pink-200"
                  disabled={loading}
                />
                {chargeAmount > 0 && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                    <div className="text-xs text-gray-600">
                      Service Charge: UGX {chargeAmount.toLocaleString()}
                    </div>
                    <div className="text-sm font-bold text-pink-600">
                      Total to Pay: UGX {totalAmount.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">
                  Phone number
                </label>
                <div className="mt-1">
                  <input
                    value={phone}
                    onChange={(e) => {
                      const nextPhone = e.target.value;
                      setPhone(nextPhone);
                      setVerified(false);
                      setAccountName("");
                      setError("");

                      const trimmedPhone = nextPhone.trim();
                      if (/^0?7\d{8}$/.test(trimmedPhone)) {
                        void verifyPhone(trimmedPhone);
                      }
                    }}
                    type="tel"
                    placeholder="07XXXXXXXX"
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-pink-200"
                    disabled={loading || verifying}
                  />
                </div>

                <p className="mt-1 text-xs text-gray-400">
                  Auto-verifies when a valid 10-digit mobile number is entered.
                </p>

                {verified && accountName && (
                  <div className="mt-2 text-sm text-green-700 flex items-center gap-1">
                    <CheckCircle2 size={16} /> {accountName}
                  </div>
                )}
              </div>

              {error && (
                <div className="p-2 bg-red-50 text-red-700 rounded-md flex items-center gap-2 text-sm">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={submit}
                  className="flex-[0.7] py-2 rounded-lg bg-[#d81b60] text-white font-bold hover:bg-[#b30f4d] disabled:opacity-50"
                  disabled={loading || !verified}
                >
                  {loading ? "Processing..." : "Request Payment"}
                </button>
                <button
                  onClick={onClose}
                  className="flex-[0.3] py-2 rounded-lg bg-white border border-[#d81b60] text-[#d81b60] font-bold hover:bg-gray-50 disabled:opacity-50"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                {paymentResult.status === "pending" && (
                  <>
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center animate-spin">
                      <Loader2 size={24} className="text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-center">Processing</h3>
                    <p className="text-sm text-gray-600 text-center">
                      {paymentResult.message || "Verifying your payment..."}
                    </p>
                  </>
                )}

                {paymentResult.status === "success" && (
                  <>
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-center text-green-700">Payment Confirmed</h3>
                    <p className="text-sm text-gray-600 text-center">
                      {paymentResult.message || "Your cash has been added successfully!"}
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 w-full text-center">
                      <p className="text-xs text-gray-600">Transaction ID</p>
                      <p className="text-sm font-mono font-bold text-gray-800">{paymentResult.transactionId}</p>
                    </div>
                  </>
                )}

                {paymentResult.status === "failed" && (
                  <>
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle size={32} className="text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-center text-red-700">Payment Failed</h3>
                    <p className="text-sm text-gray-600 text-center">
                      {paymentResult.message || "Your payment could not be processed."}
                    </p>
                  </>
                )}

                {queryError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2 text-sm w-full">
                    <AlertCircle size={14} /> {queryError}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {paymentResult.status === "pending" && (
                  <button
                    onClick={() => queryTxStatus(paymentResult.transactionId)}
                    className="flex-1 py-2 rounded-lg bg-[#d81b60] text-white font-bold hover:bg-[#b30f4d] disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={queryLoading}
                  >
                    {queryLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Checking...
                      </>
                    ) : (
                      "Check Status"
                    )}
                  </button>
                )}

                {paymentResult.status === "success" && (
                  <button
                    onClick={onClose}
                    className="flex-1 py-2 rounded-lg bg-[#d81b60] text-white font-bold hover:bg-[#b30f4d]"
                  >
                    Close
                  </button>
                )}

                {paymentResult.status === "failed" && (
                  <>
                    <button
                      onClick={() => {
                        setPaymentResult(null);
                        setLastQueriedStatus(null);
                        setQueryError(null);
                      }}
                      className="flex-1 py-2 rounded-lg bg-[#d81b60] text-white font-bold hover:bg-[#b30f4d]"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 py-2 rounded-lg bg-white border border-[#d81b60] text-[#d81b60] font-bold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
