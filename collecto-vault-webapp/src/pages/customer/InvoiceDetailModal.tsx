import { useState } from 'react';
import { X, Download, CheckCircle } from 'lucide-react';
import { invoiceService } from '../../api/collecto';

export default function InvoiceDetailModal({ invoice, onClose, onPaid }: { invoice: any; onClose: () => void; onPaid?: (invoiceId: string) => void; }) {
  const [tab, setTab] = useState<'details' | 'payment'>('details');
  const [payMethod, setPayMethod] = useState<'points' | 'mobilemoney'>('points');
  const [payPhone, setPayPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDownload = () => {
    const jsonString = JSON.stringify(invoice, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${invoice.id || invoice.invoiceId}_Data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePay = async () => {
    if (!invoice) return;
    try {
      setLoading(true);
      const invoiceId = invoice.invoiceId ?? invoice.id;
      await invoiceService.payInvoice({ invoiceId, paymentOption: payMethod, phone: payMethod === 'mobilemoney' ? payPhone : undefined });
      if (onPaid) onPaid(invoice.invoiceId ?? invoice.id);
    } catch (err: any) {
      console.error('Pay failed', err);
      alert(err?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const isPaid = String((invoice.status ?? invoice.state ?? '')).toUpperCase() === 'PAID';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{invoice.invoiceId ?? invoice.reference ?? invoice.id}</h3>
            <p className="text-xs text-gray-500">Issued: {invoice.createdAt ?? invoice.date}</p>
          </div>

          <div className="flex gap-2">
            <button onClick={handleDownload} title="Download Invoice Data" className="p-2 bg-white rounded-full text-gray-500 hover:text-[#c01754] shadow-sm border border-gray-100 transition-colors">
              <Download size={18} />
            </button>
            <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-500 hover:text-gray-800 shadow-sm border border-gray-100">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-200">
          <button onClick={() => setTab('details')} className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${tab === 'details' ? 'border-[#c01754] text-[#c01754] bg-[#c01754]/5' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>Details</button>
          <button onClick={() => setTab('payment')} className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${tab === 'payment' ? 'border-[#c01754] text-[#c01754] bg-[#c01754]/5' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>Payment</button>
        </div>

        <div className="p-6 overflow-y-auto">
          {tab === 'details' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Invoice Items</p>
                <div className="bg-white rounded-lg p-2">
                  {(invoice.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-gray-700 text-sm font-medium">{item.serviceName ?? item.service}</span>
                      <span className="text-gray-900 text-sm font-medium">UGX {Number(item.amount ?? item.unitAmount ?? 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Client</span>
                  <span className="font-medium text-gray-900">{invoice.clientId ?? invoice.client ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Mobile</span>
                  <span className="font-medium text-gray-900">{invoice.phone ?? invoice.clientPhone ?? 'N/A'}</span>
                </div>

                <div className="border-t border-gray-200 my-2 pt-2"></div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Amount</span>
                  <span className="font-medium text-gray-900">UGX {Number(invoice.amount ?? invoice.totalAmount ?? invoice.total ?? 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Paid Amount</span>
                  <span className="font-medium text-[#c01754]">{invoice.lastPaid ?? invoice.paid ?? '0'}</span>
                </div>

                <div className="border-t border-gray-200 my-2 pt-2 flex justify-between text-base">
                  <span className="font-bold text-gray-800">Remaining</span>
                  <span className="font-bold text-gray-900">UGX {Number(invoice.remaining ?? invoice.amount ?? 0 - (invoice.paid ?? 0)).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {tab === 'payment' && (
            <div className="space-y-4">

              {!isPaid ? (
                <div className="mb-4 bg-gray-50 p-3 rounded">
                  <label className="text-xs text-gray-600">Method</label>
                  <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as any)} className="w-full p-2 mt-1 mb-2 border rounded">
                    <option value="points">Points</option>
                    <option value="mobilemoney">Mobile Money</option>
                  </select>

                  {payMethod === 'mobilemoney' && (
                    <input value={payPhone} onChange={(e) => setPayPhone(e.target.value)} placeholder="07xxxxxxxx" className="w-full p-2 border rounded mb-2" />
                  )}

                  <div className="flex gap-2">
                    <button onClick={handlePay} disabled={loading} className="px-3 py-2 bg-green-600 text-white rounded">{loading ? 'Processing...' : 'Confirm Pay'}</button>
                    <button onClick={onClose} className="px-3 py-2 bg-gray-200 rounded">Close</button>
                  </div>
                </div>
              ) : (
                <div className="p-3 mb-4 bg-green-50 rounded">This invoice is already paid.</div>
              )}

              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment History</p>

              {(invoice.payments || []).length > 0 ? (
                <div className="space-y-3">
                  {(invoice.payments || []).map((pay: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 bg-green-50/50 p-3 rounded-lg border border-green-100">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0 mt-0.5">
                        <CheckCircle size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-semibold text-gray-800">UGX {pay.amount}</p>
                          <p className="text-xs text-gray-400">{pay.date}</p>
                        </div>
                        <div className="mt-1 pt-1 border-t border-green-100/50">
                          <p className="text-[10px] text-gray-400 font-mono tracking-wide">Tran ID: <span className="text-gray-600 font-medium">{pay.tranId || 'N/A'}</span></p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{pay.method}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-400">
                    <X size={24} />
                  </div>
                  <p className="text-sm text-gray-500">No payments have been recorded for this invoice yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}