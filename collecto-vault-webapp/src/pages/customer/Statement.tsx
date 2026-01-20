import { useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import { ArrowDownLeft, ChevronRight } from "lucide-react";
import { transactionService, invoiceService } from "../../api/collecto";
import InvoiceDetailModal from "./InvoiceDetailModal";
import Button from "../../components/Button";

// Local toast helper
const useLocalToast = () => {
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
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

export default function Statement() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"invoices" | "payments">(
    "invoices",
  );
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<"points" | "mobilemoney">("points");
  const [payPhone, setPayPhone] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const { toast, showToast } = useLocalToast();

  const fetchInvoices = async (invoiceId?: string | null) => {
    setLoading(true);
    try {
      const res = await invoiceService.getInvoices({
        vaultOTPToken,
        collectoId,
        clientId,
        // invoiceId: invoiceId ?? "CINV:00000003425",
        invoiceId: invoiceId ?? null,
      });

      // Based on your JSON: res.data (top) -> .data (middle) -> .data (array)
      const invoiceArray = res.data?.data?.data;
      const validatedData = Array.isArray(invoiceArray) ? invoiceArray : [];

      setInvoices(validatedData);
      return validatedData;
    } catch (err) {
      console.error("Fetch Invoices Error:", err);
      setInvoices([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await transactionService.getTransactions("me");
      // Adjust this path if your transaction API has a similar nested structure
      const data = res.data?.data?.data ?? res.data?.transactions ?? [];
      setTransactions(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.error("Fetch Transactions Error:", err);
      setTransactions([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchTransactions();
  }, []);

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const formattedPhone = payPhone
        ? payPhone.replace(/^0/, "256")
        : payPhone;

      const payload = {
        vaultOTPToken,
        collectoId,
        clientId,
        phone: formattedPhone,
        paymentOption: payMethod,
        reference: invoiceId,
      };

      await invoiceService.payInvoice(payload);

      // Refresh list after payment
      await fetchInvoices();

      setPayingInvoice(null);
      showToast(
        "Payment initiated. Please check your phone for the prompt.",
        "success",
      );
    } catch (err: any) {
      console.error("Invoice Payment Error:", err);
      showToast(
        err.response?.data?.message || err?.message || "Payment failed",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f3f3] font-sans pb-20">
      <TopNav />

      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-sm bg-black text-white">
          {toast.message}
        </div>
      )}

      <div className="w-full bg-white shadow-md flex divide-x divide-gray-100 border-b border-gray-100">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex-1 py-6 flex flex-col items-center justify-center relative transition-colors ${
            activeTab === "invoices" ? "bg-white" : "bg-gray-50/30"
          }`}
        >
          <span className="text-xs font-bold text-gray-400 uppercase mt-1 tracking-widest">
            Invoices
          </span>
          {activeTab === "invoices" && (
            <div className="absolute bottom-0 w-full h-1 bg-[#cb0d6c]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`flex-1 py-6 flex flex-col items-center justify-center relative transition-colors ${
            activeTab === "payments" ? "bg-white" : "bg-gray-50/30"
          }`}
        >
          <span className="text-xs font-bold text-gray-400 uppercase mt-1 tracking-widest">
            Payments
          </span>
          {activeTab === "payments" && (
            <div className="absolute bottom-0 w-full h-1 bg-[#cb0d6c]" />
          )}
        </button>
      </div>

      <main className="w-full px-4 mt-0">
        <div className="mt-6 mb-6 text-center">
          {!loading && (
            <p className="text-gray-400 text-sm font-medium">
              {activeTab === "invoices"
                ? `${invoices.length} invoices found`
                : `${transactions.length} payments found`}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading...</div>
          ) : activeTab === "invoices" ? (
            invoices.map((inv: any) => {
              // Extracting data from your specific JSON structure
              const invId = inv.details?.id || "N/A";
              const dateRaw =
                inv.details?.invoice_date_formarted ||
                inv.details?.invoice_date;
              const amount = inv.details?.invoice_details?.[0]?.amount || 0;
              const status = inv.details?.status || "PENDING";

              return (
                <div
                  key={invId}
                  onClick={() => setSelectedInvoice(inv)}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                      <ArrowDownLeft className="w-6 h-6 text-gray-300" />
                    </div>
                    <div>
                   
                      <div>
                        <p className="font-bold text-gray-800 text-base">
                          {invId}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] uppercase font-extrabold tracking-wider">
                          {/* Date is now explicitly black/dark gray */}
                          <span className="text-gray-900">{dateRaw}</span>

                          <span className="text-gray-400">•</span>

                          {/* Status remains color-coded */}
                          <span
                            className={
                              status === "PAID"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="font-black text-gray-900 text-lg">
                        UGX {Number(amount).toLocaleString()}
                      </p>
                      {status !== "PAID" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPayingInvoice(invId);
                          }}
                          className="text-[11px] text-gray-800 font-black uppercase underline"
                        >
                          Pay Now
                        </button>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
                </div>
              );
            })
          ) : (
            transactions.map((tx: any) => (
              <div
                key={tx.id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50">
                    <ArrowDownLeft className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-base">
                      {tx.description || "Payment"}
                    </p>
                    <p className="text-[11px] text-gray-400 font-extrabold uppercase tracking-wider">
                      {tx.method} • {tx.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-lg text-gray-900">
                    UGX {Number(tx.amount || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Payment Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-2xl font-black text-gray-900">
                Payment Details
              </h4>
              <button
                onClick={() => setPayingInvoice(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="bg-linear-to-br from-pink-50 to-orange-50 rounded-xl p-4 mb-5 border border-pink-100">
              <p className="text-xs text-gray-600 font-medium mb-1">
                Invoice Reference
              </p>
              <p className="text-xl font-black text-gray-900">
                {payingInvoice}
              </p>
            </div>

            <div className="mb-6">
              <p className="text-sm font-bold text-gray-700 uppercase mb-3">
                Select Method
              </p>
              <div className="flex gap-3 bg-gray-100 p-1 rounded-2xl">
                <button
                  onClick={() => setPayMethod("points")}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm ${payMethod === "points" ? "bg-white text-[#D81B60] shadow-md" : "text-gray-600"}`}
                >
                  💰 Points
                </button>
                <button
                  onClick={() => setPayMethod("mobilemoney")}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm ${payMethod === "mobilemoney" ? "bg-white text-[#D81B60] shadow-md" : "text-gray-600"}`}
                >
                  📱 Mobile Money
                </button>
              </div>
            </div>

            {payMethod === "mobilemoney" && (
              <div className="mb-6">
                <label className="text-sm font-bold text-gray-700 uppercase block mb-2">
                  Phone Number
                </label>
                <input
                  value={payPhone}
                  onChange={(e) => setPayPhone(e.target.value)}
                  placeholder="07XX XXX XXX"
                  className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-[#D81B60]"
                />
              </div>
            )}

            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setPayingInvoice(null)}
                className="bg-gray-200 text-black font-semibold py-2 px-6 rounded-lg"
              >
                Cancel
              </button>
              <Button
                onClick={() => handlePayInvoice(payingInvoice)}
                disabled={loading || (payMethod === "mobilemoney" && !payPhone)}
                className="bg-[#D81B60] text-white font-semibold py-2 px-4 rounded-lg"
              >
                {loading ? "Processing..." : "Pay Now"}
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
    </div>
  );
}
