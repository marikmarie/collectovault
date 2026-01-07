import { useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import { ArrowUpRight, ArrowDownLeft, TrendingUp } from "lucide-react";
import { transactionService, invoiceService } from "../../api/collecto";
import InvoiceDetailModal from "./InvoiceDetailModal";

// Local toast helper
const useLocalToast = () => {
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };
  return { toast, showToast };
};

interface Transaction {
  id: string | number;
  type: "Earn" | "Redeem";
  description: string;
  points: number;
  ugxValue?: number | string;
  date: string;
} 

export default function Statement() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<'points' | 'mm'>('points');
  const [payPhone, setPayPhone] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const { toast, showToast } = useLocalToast();

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const res = await transactionService.getTransactions("me");
        const data = res.data?.transactions ?? res.data ?? [];
        setTransactions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("Failed to fetch transactions", err);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const res = await invoiceService.getInvoices();
        const data = res.data?.data ?? res.data ?? [];
        setInvoices(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("Failed to fetch invoices", err);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    // load default tab
    if (activeTab === 'invoices') fetchInvoices();
    else fetchTransactions();
  }, [activeTab]);

  const formatPoints = (points: number, type: "Earn" | "Redeem") => { 
    const sign = type === "Earn" ? "+" : "-";
    const color = type === "Earn" ? "text-green-600" : "text-red-600";
    return (
      <span className={`font-semibold ${color}`}>
        {sign} {points.toLocaleString()} pts
      </span>
    );
  };

  const getIcon = (type: "Earn" | "Redeem") => {
    if (type === "Earn") return <ArrowUpRight className="w-5 h-5 text-green-600" />;
    return <ArrowDownLeft className="w-5 h-5 text-red-600" />;
  };

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      await invoiceService.payInvoice({ invoiceId, method: payMethod, phone: payMethod === 'mm' ? payPhone : undefined });
      // refresh invoices
      const res = await invoiceService.getInvoices();
      const data = res.data?.data ?? res.data ?? [];
      setInvoices(Array.isArray(data) ? data : []);
      setPayingInvoice(null);
      showToast('Payment initiated', 'success');
    } catch (err: any) {
      console.error('Invoice payment failed', err);
      showToast(err?.message || 'Payment failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <TopNav />

      {toast && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-auto px-4 py-2 rounded shadow-lg text-sm ${toast.type === 'success' ? 'bg-green-600 text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}

      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-[#0b4b78]" /> 
          Transaction Statement
        </h1>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-700">{activeTab === 'invoices' ? 'Invoices' : 'Payments'}</h2>
            <div className="space-x-2">
              <button onClick={() => setActiveTab('invoices')} className={`px-3 py-1 rounded ${activeTab === 'invoices' ? 'bg-[#d81b60] text-white' : 'bg-gray-50 text-gray-600'}`}>Invoices</button>
              <button onClick={() => setActiveTab('payments')} className={`px-3 py-1 rounded ${activeTab === 'payments' ? 'bg-[#d81b60] text-white' : 'bg-gray-50 text-gray-600'}`}>Payments</button>
            </div>
          </div>

          {activeTab === 'invoices' ? (
            <ul className="divide-y divide-gray-100">
              {loading ? (
                <li className="p-4 sm:p-6 text-center text-sm text-gray-500">Loading invoices…</li>
              ) : invoices.length === 0 ? (
                <li className="p-4 sm:p-6 text-center text-sm text-gray-500">No invoices found.</li>
              ) : (
                invoices.map((inv: any) => (
                  <li key={inv.id || inv.invoiceId} onClick={() => setSelectedInvoice(inv)} className="p-4 sm:p-6 flex justify-between items-start hover:bg-gray-50 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-800">{inv.invoiceId ?? inv.reference ?? inv.id}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(inv.createdAt || inv.created_at || inv.date).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      <div className="text-sm text-gray-600 mt-1">Total: UGX {Number(inv.amount ?? inv.totalAmount ?? inv.total).toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Status: {inv.status ?? inv.state ?? 'unknown'}</div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        {(inv.status ?? inv.state) !== 'PAID' && (
                          <button onClick={(e) => { e.stopPropagation(); setPayingInvoice(inv.invoiceId ?? inv.id); }} className="px-3 py-2 bg-[#d81b60] text-white rounded">Pay</button>
                        )}

                        <button onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv); }} className="px-3 py-2 bg-gray-100 text-gray-700 rounded">View</button>
                      </div>

                      {payingInvoice === (inv.invoiceId ?? inv.id) && (
                        <div onClick={(e) => e.stopPropagation()} className="mt-3 bg-gray-50 p-3 rounded w-full">
                          <label className="text-xs text-gray-600">Method</label>
                          <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as any)} className="w-full p-2 mt-1 mb-2 border rounded">
                            <option value="points">Points</option>
                            <option value="mm">Mobile Money</option>
                          </select>

                          {payMethod === 'mm' && (
                            <input value={payPhone} onChange={(e) => setPayPhone(e.target.value)} placeholder="07xxxxxxxx" className="w-full p-2 border rounded mb-2" />
                          )}

                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); handlePayInvoice(inv.invoiceId ?? inv.id); }} className="px-3 py-2 bg-green-600 text-white rounded">Confirm Pay</button>
                            <button onClick={(e) => { e.stopPropagation(); setPayingInvoice(null); }} className="px-3 py-2 bg-gray-200 rounded">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <ul className="divide-y divide-gray-100">
              {loading ? (
                <li className="p-4 sm:p-6 text-center text-sm text-gray-500">Loading payments…</li>
              ) : transactions.length === 0 ? (
                <li className="p-4 sm:p-6 text-center text-sm text-gray-500">No payments found.</li>
              ) : (
                transactions.map((tx) => (
                <li key={tx.id} className="p-4 sm:p-6 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-gray-100">
                      {getIcon(tx.type as "Earn" | "Redeem")}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{tx.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(tx.date).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {formatPoints(tx.points, tx.type as "Earn" | "Redeem")}
                    <p className="text-xs text-gray-400 mt-1">~UGX {Number(String(tx.ugxValue).replace(/[^0-9.-]+/g,'') || 0).toLocaleString()}</p>
                  </div>
                </li>
                ))
              )}
            </ul>
          )}
        </div>
      </main>

      {selectedInvoice && <InvoiceDetailModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
    </div>
  );
}