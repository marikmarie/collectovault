import { useEffect, useState } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { invoiceService } from "../api/collecto";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function TransferCashModal({ open, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [verified, setVerified] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [accountName, setAccountName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!open) {
      setAmount("");
      setPhone("");
      setVerified(false);
      setVerifying(false);
      setAccountName("");
      setError("");
      setLoading(false);
    }
  }, [open]);

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
        setError(nested?.message ?? payload?.message ?? "Phone verification failed");
      }
    } catch (err: any) {
      setVerified(false);
      setAccountName("");
      setError(err?.message ?? "Unable to verify phone");
    } finally {
      setVerifying(false);
    }
  };

  const submit = async () => {
    if (!verified) {
      setError("Please verify recipient phone before transferring cash.");
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

      const requestPayload = {
        vaultOTPToken: sessionStorage.getItem("vaultOtpToken") || undefined,
        collectoId,
        clientId,
        paymentOption: "mobilemoney",
        phone: normalizePhone(phone),
        amount: parsed,
        reference: `TRANSFER-${Date.now()}`,
      };

      const response = await invoiceService.requestPayment(requestPayload);
      const status = String(response?.data?.status ?? "").toLowerCase();

      if (status === "200" || status === "success") {
        onSuccess?.();
        onClose();
      } else {
        setError(response?.data?.message ?? "Failed to init transfer");
      }
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong while transferring cash");
    } finally {
      setLoading(false);
    }
  };

  const normalizePhone = (value: string) => {
    const num = value.trim();
    if (num.startsWith("0")) {
      return `256${num.slice(1)}`;
    }
    if (num.startsWith("+256")) {
      return num.slice(1);
    }
    return num;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold">Transfer Cash</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X /></button>
        </div>

        <div className="p-4 space-y-3">
          <div className="text-sm text-gray-600">Transfer cash to another wallet number using mobile money.</div>

          <div>
            <label className="text-xs font-semibold uppercase text-gray-500">Amount (UGX)</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              min={1}
              placeholder="10000"
              className="w-full mt-1 px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-pink-200"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-gray-500">Recipient phone</label>
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

            <p className="mt-1 text-xs text-gray-400">Auto-verifies when a valid 10-digit mobile number is entered.</p>

            {verified && accountName && (
              <div className="mt-2 text-sm text-green-700 flex items-center gap-1">
                <CheckCircle2 size={16} /> {accountName}
              </div>
            )}
            {!verified && !verifying && <p className="mt-1 text-xs text-gray-400">Enter recipient number to verify.</p>}
          </div>

          {error && (
            <div className="p-2 bg-red-50 text-red-700 rounded-md flex items-center gap-2 text-sm">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button
            onClick={submit}
            className="w-full py-2 rounded-lg bg-[#d81b60] text-white font-bold hover:bg-[#b30f4d] disabled:opacity-50"
            disabled={loading || !verified}
          >
            {loading ? "Processing..." : "Send Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}
