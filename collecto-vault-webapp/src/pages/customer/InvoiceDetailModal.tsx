import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  invoice: any;
  onClose: () => void;
  onPaid?: () => Promise<void>;
}

export default function InvoiceDetailModal({ invoice, onClose }: Props) {
  const [tab, setTab] = useState<"details" | "payment">("details");

  const details = invoice?.details || {};
  const invoiceItems = details?.invoice_details || [];
  const payments = invoice?.payments || [];
  const amountLess = invoice?.amount_less ?? 0;
  const totalPaid = invoice?.total_amount_paid ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="p-6 pb-2 flex justify-between items-start">
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
            {details.id || "N/A"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        {/* Navigation & Action Bar */}
        <div className="px-6 flex justify-between items-center border-b border-gray-100">
          <div className="flex gap-8">
            <button
              onClick={() => setTab("details")}
              className={`py-3 text-lg font-medium transition-all relative ${tab === "details" ? "text-[#9c27b0]" : "text-gray-400"}`}
            >
              Details
              {tab === "details" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#9c27b0]" />
              )}
            </button>
            <button
              onClick={() => setTab("payment")}
              className={`py-3 text-lg font-medium transition-all relative ${tab === "payment" ? "text-[#9c27b0]" : "text-gray-400"}`}
            >
              Payments
              {tab === "payment" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#9c27b0]" />
              )}
            </button>
          </div>

        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto">
          {tab === "details" ? (
            <table className="w-full border-collapse">
              <tbody className="text-gray-700">
                <tr className="border-b border-gray-100">
                  <td className="py-3 font-bold text-gray-800 w-1/3 text-sm uppercase tracking-wider">
                    Date
                  </td>
                  <td className="py-3 text-sm">{details.invoice_date}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 font-bold text-gray-800 text-sm uppercase tracking-wider">
                    Client
                  </td>
                  <td className="py-3 text-sm">{details.client_name}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 font-bold text-gray-800 align-top text-sm uppercase tracking-wider">
                    Services
                  </td>
                  <td className="py-3">
                    {invoiceItems.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between mb-2 last:mb-0 text-sm"
                      >
                        <span>{item.name}</span>
                        <span className="font-medium">
                          {Number(item.amount).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 font-bold text-gray-800 text-sm uppercase tracking-wider">
                    Total
                  </td>
                  <td className="py-3 font-bold text-right text-lg">
                    {Number(details.invoice_amount).toLocaleString()}
                  </td>
                </tr>
                <tr className="border-b border-gray-100 text-green-600">
                  <td className="py-3 font-bold text-sm uppercase tracking-wider">
                    Paid
                  </td>
                  <td className="py-3 font-bold text-right">
                    {Number(totalPaid).toLocaleString()}
                  </td>
                </tr>
                <tr className="border-b border-gray-100 text-red-500">
                  <td className="py-3 font-bold text-sm uppercase tracking-wider">
                    Balance
                  </td>
                  <td className="py-3 font-bold text-right text-lg">
                    {Number(amountLess).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-gray-800 text-sm uppercase tracking-wider">
                    Issued By
                  </td>
                  <td className="py-3 text-sm">{details.invoice_by_name}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="w-full">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-800 font-bold border-b-2 border-gray-100 uppercase text-xs tracking-widest">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Info</th>
                    <th className="pb-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  {payments.map((pay: any, i: number) => (
                    <tr
                      key={i}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="py-4 text-[13px]">{pay.paid_date}</td>
                      <td className="py-4">
                        <div className="font-bold text-gray-800 text-sm">
                          {pay.payment_option}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {pay.transaction_id}
                        </div>
                      </td>
                      <td className="py-4">
                         <div className="text-[11px] text-gray-500 font-mono">
                          {pay.phone}
                        </div>
                         <div className="text-[13px] italic">
                           By: {pay.user_name}
                        </div>                    
                      </td>
                      <td className="py-4 text-right font-bold text-gray-600 text-sm">
                        {Number(pay.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 flex justify-between items-center bg-gray-100 p-3 rounded font-bold">
                <span className="uppercase text-xs tracking-widest text-gray-700">
                  Total Paid
                </span>
                <span className="text-lg">
                  {Number(totalPaid).toLocaleString()}
                </span>
              </div>

              {payments.length === 0 && (
                <div className="text-center py-10 text-gray-400 italic text-sm">
                  No payment records found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
