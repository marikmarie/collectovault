import { useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import { ArrowUpRight, ArrowDownLeft, ChevronRight } from "lucide-react";
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
    } catch (err) {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await Promise.allSettled([fetchInvoices(), fetchTransactions()]);
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
      <main className="max-w-4xl mx-auto px-4 mt-0">
        
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
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tx.type === 'Earn' ? 'bg-green-50' : 'bg-red-50'}`}>
                    {tx.type === "Earn" ? <ArrowUpRight className="w-6 h-6 text-green-600" /> : <ArrowDownLeft className="w-6 h-6 text-red-600" />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-base">{tx.description}</p>
                    <p className="text-[11px] text-gray-400 font-extrabold uppercase tracking-wider">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-lg ${tx.type === 'Earn' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'Earn' ? '+' : '-'}{tx.points.toLocaleString()} pts
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Payment Sheet */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-black/60 z-100 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-8 animate-in slide-in-from-bottom duration-300">
            <h4 className="font-black text-xl mb-6 text-center">Payment Method</h4>
            <div className="space-y-3">
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as any)} className="w-full p-4 bg-gray-50 rounded-2xl mb-2 outline-none font-bold border-none">
                <option value="points">Use Points Balance</option>
                <option value="mm">Mobile Money</option>
                </select>
                {payMethod === 'mm' && (
                <input value={payPhone} onChange={(e) => setPayPhone(e.target.value)} placeholder="07XX XXX XXX" className="w-full p-4 bg-gray-50 rounded-2xl mb-4 font-bold border-none" />
                )}
            </div>
            <div className="flex gap-4 mt-4">
              <button onClick={() => handlePayInvoice(payingInvoice)} className="flex-1 bg-[#D81B60] text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-transform">Confirm</button>
              <button onClick={() => setPayingInvoice(null)} className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl active:scale-95 transition-transform">Cancel</button>
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