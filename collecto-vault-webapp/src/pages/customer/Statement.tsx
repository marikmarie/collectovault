import { useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import { ArrowDownLeft, ChevronRight } from "lucide-react";
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

// Dummy data for demo
const dummyInvoices = [
  { id: 'INV-001', invoiceId: 'INV-001', amount: 250000, status: 'PAID', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'INV-002', invoiceId: 'INV-002', amount: 500000, status: 'PENDING', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'INV-003', invoiceId: 'INV-003', amount: 150000, status: 'PAID', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
];

const dummyTransactions = [
  { id: '1', type: 'Payment' as const, description: 'Mobile Phone Service Purchase', amount: 50000, method: 'Mobile Money', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '2', type: 'Payment' as const, description: 'Internet Bundle', amount: 75000, method: 'Points Redeemed', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '3', type: 'Payment' as const, description: 'Utility Payment', amount: 120000, method: 'Mobile Money', date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
];

interface Transaction {
  id: string | number;
  type: "Payment";
  description: string;
  amount: number;
  method: string;
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

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await invoiceService.getInvoices();
      const data = res.data?.data ?? res.data ?? [];
      setInvoices(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
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
      const data = res.data?.transactions ?? res.data ?? [];
      setTransactions(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      setTransactions([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const invData = await fetchInvoices();
      const txData = await fetchTransactions();
      // Use dummy data if API returns empty
      if (!invData || invData.length === 0) {
        setInvoices(dummyInvoices);
      }
      if (!txData || txData.length === 0) {
        setTransactions(dummyTransactions);
      }
    })();
  }, []);

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      await invoiceService.payInvoice({ invoiceId, method: payMethod, phone: payMethod === 'mm' ? payPhone : undefined });
      const res = await invoiceService.getInvoices();
      const data = res.data?.data ?? res.data ?? [];
      setInvoices(Array.isArray(data) ? data : []);
      setPayingInvoice(null);
      showToast('Payment initiated', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Payment failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF7] font-sans pb-20">
      <TopNav />

      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-sm bg-black text-white">
          {toast.message}
        </div>
      )}

      {/* --- FULL WIDTH DASHBOARD TABS IMMEDIATELY BELOW NAV --- */}
      <div className="w-full bg-white shadow-md flex divide-x divide-gray-100 border-b border-gray-100">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex-1 py-6 flex flex-col items-center justify-center relative transition-colors ${activeTab === 'invoices' ? 'bg-white' : 'bg-gray-50/30'}`}
        >
          {/* <span className="text-4xl text-gray-800 font-light tracking-tight">{invoices.length}</span> */}
          <span className="text-xs font-bold text-gray-400 uppercase mt-1 tracking-widest">Invoices</span>
          {activeTab === 'invoices' && (
            <div className="absolute bottom-0 w-full h-1 bg-[#cb0d6c]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex-1 py-6 flex flex-col items-center justify-center relative transition-colors ${activeTab === 'payments' ? 'bg-white' : 'bg-gray-50/30'}`}
        >
          {/* <span className="text-4xl text-gray-800 font-light tracking-tight">{transactions.length}</span> */}
          <span className="text-xs font-bold text-gray-400 uppercase mt-1 tracking-widest">Payments</span>
          {activeTab === 'payments' && (
            <div className="absolute bottom-0 w-full h-1 bg-[#cb0d6c]" />
          )}
        </button>
      </div>

      {/* Centered Content Below Tabs */}
      <main className="w-full px-4 mt-0">
        
        <div className="mt-6 mb-6 text-center">
             {!loading && (
                <p className="text-gray-400 text-sm font-medium">
                    {activeTab === 'invoices' 
                        ? (invoices.length > 0 ? `${invoices.length} invoices found` : 'No invoices found')
                        : (transactions.length > 0 ? `${transactions.length} payments found` : 'No payments found')
                    }
                </p>
             )}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading...</div>
          ) : activeTab === 'invoices' ? (
            invoices.map((inv: any) => (
              <div 
                key={inv.id || inv.invoiceId} 
                onClick={() => setSelectedInvoice(inv)}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                    <ArrowDownLeft className="w-6 h-6 text-gray-300" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-base">{inv.invoiceId ?? inv.id}</p>
                    <p className="text-[11px] text-gray-400 uppercase font-extrabold tracking-wider">
                        {new Date(inv.createdAt || inv.date).toLocaleDateString()} • {inv.status ?? 'Pending'}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="font-black text-gray-900 text-lg">UGX {Number(inv.amount ?? 0).toLocaleString()}</p>
                    {(inv.status ?? inv.state) !== 'PAID' && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setPayingInvoice(inv.invoiceId ?? inv.id); }}
                            className="text-[11px] text-[#D81B60] font-black uppercase underline"
                        >
                            Pay Now
                        </button>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </div>
            ))
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50">
                    <ArrowDownLeft className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-base">{tx.description}</p>
                    <p className="text-[11px] text-gray-400 font-extrabold uppercase tracking-wider">{tx.method} • {new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-lg text-gray-900">
                    UGX {tx.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Payment Sheet */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in fade-in scale-in duration-300 border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-2xl font-black text-gray-900">Payment Details</h4>
              <button onClick={() => setPayingInvoice(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Invoice Amount Display */}
            <div className="bg-linear-to-br from-pink-50 to-orange-50 rounded-xl p-4 mb-5 border border-pink-100">
              <p className="text-xs text-gray-600 font-medium mb-1">Amount to Pay</p>
              <p className="text-2xl font-black text-gray-900">
                UGX {invoices.find((inv: any) => (inv.invoiceId ?? inv.id) === payingInvoice)?.amount?.toLocaleString() ?? 0}
              </p>
            </div>

            {/* Payment Method Tabs */}
            <div className="mb-6">
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Select Payment Method</p>
              <div className="flex gap-3 bg-gray-100 p-1 rounded-2xl">
                <button
                  onClick={() => setPayMethod('points')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${
                    payMethod === 'points'
                      ? 'bg-white text-[#D81B60] shadow-md'
                      : 'bg-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  💰 Points
                </button>
                <button
                  onClick={() => setPayMethod('mm')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${
                    payMethod === 'mm'
                      ? 'bg-white text-[#D81B60] shadow-md'
                      : 'bg-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📱 Mobile Money
                </button>
              </div>
            </div>

            {/* Conditional Input for Mobile Money */}
            {payMethod === 'mm' && (
              <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wide block mb-2">Phone Number</label>
                <input
                  value={payPhone}
                  onChange={(e) => setPayPhone(e.target.value)}
                  placeholder="07XX XXX XXX"
                  className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl font-semibold focus:border-[#D81B60] focus:ring-2 focus:ring-[#D81B60]/20 outline-none transition-all"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setPayingInvoice(null)}
                className="flex-1 py-2 px-3 bg-gray-300 text-slate-700 font-semibold text-sm rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePayInvoice(payingInvoice)}
                disabled={payMethod === 'mm' && (!payPhone || payPhone.trim().length < 10)}
                className="flex-1 py-2 px-3 bg-gray-300 text-gray-800 font-semibold text-sm rounded-lg hover:bg-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onPaid={async (invoiceId: string) => {
            const data = await fetchInvoices();
            const updated = (data ?? []).find((inv: any) => (inv.invoiceId ?? inv.id) === invoiceId);
            setSelectedInvoice(updated ?? null);
            showToast('Payment successful', 'success');
          }}
        />
      )}
    </div>
  );
}