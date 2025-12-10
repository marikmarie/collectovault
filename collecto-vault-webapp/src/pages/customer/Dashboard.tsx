import { useState } from "react";
import Header from "../../components/Header";
import TierProgress from "../../components/TierProgress";
import TopNav from "../../components/TopNav";
import ServicesList from "../../components/ServicesList";
import BuyPoints from "../customer/BuyPoints";
import SpendPointsModal from "./SpendPoints";
import TierDetailsModal from "./TierDetails";
// Added CheckCircle, Clock, AlertCircle for status icons
import { X, CheckCircle, Clock, AlertCircle, Download } from "lucide-react";

const REDEEMABLE_OFFERS = [
  {
    id: "r1",
    title: "20% off Hotel Stays",
    desc: "Redeem points for 20% off hotel stays.",
    pointsCost: 1000,
  },
  {
    id: "r2",
    title: "50% Travel Upgrades",
    desc: "Use points to upgrade your next travel.",
    pointsCost: 2500,
  },
  {
    id: "r3",
    title: " Lounge Access",
    desc: "Redeem points for complimentary lounge access.",
    pointsCost: 500,
  },
];

// UPDATED: Extended Mock Data to support new requirements
const MOCK_INVOICES = [
  {
    id: "INV-2024-001",
    date: "12 May 2024",
    totalAmount: "150,000",
    remaining: "0", // Paid
    lastPaid: "150,000",
    lastPaidDate: "14 May 2024", // Used to calc days
    daysAgo: 2,
    status: "Paid",
    items: [
      {
        desc: "Consultation Fee",
        service: "Consultation",
        client: "Acme Corp",
        phone: "+256712345678",
        totalAmount: "150,000",
      },
    ],
    payments: [
      { date: "14 May 2024", method: "Mobile Money", amount: "150,000", tranId: "MM123456789" },
    ],
  },
  {
    id: "INV-2024-002",
    date: "28 Apr 2024",
    totalAmount: "45,000",
    remaining: "0",
    lastPaid: "45,000",
    lastPaidDate: "29 Apr 2024",
    daysAgo: 15,
    status: "Paid",
    items: [
      {
        desc: "Subscription Renewal",
        service: "Subscription",
        client: "Acme Corp",
        phone: "+256712345678",
        totalAmount: "45,000",
      },
    ],
    payments: [
      { date: "29 Apr 2024", method: "Visa **** 4242", amount: "45,000", tranId: "CC987654321" },
    ],
  },
  {
    id: "INV-2024-003",
    date: "10 Apr 2024",
    totalAmount: "320,000",
    remaining: "120,000",
    lastPaid: "200,000",
    lastPaidDate: "15 Apr 2024",
    daysAgo: 25,
    status: "Pending",
    items: [
      {
        desc: "Annual Service Charge",
        service: "Annual Service Charge",
        client: "Acme Corp",
        phone: "+256712345678",
        totalAmount: "300,000",
      },
      {
        desc: "Tax",
        service: "Tax",
        client: "Acme Corp",
        phone: "+256712345678",
        totalAmount: "20,000",
      },
    ],
    payments: [{ date: "15 Apr 2024", method: "Cash", amount: "200,000" }],
  },
  {
    id: "INV-2024-004",
    date: "01 Mar 2024",
    totalAmount: "500,000",
    remaining: "500,000",
    lastPaid: "0",
    lastPaidDate: null,
    daysAgo: null,
    status: "Overdue", // Red
    items: [
      {
        desc: "System Installation",
        service: "Installation",
        client: "Acme Corp",
        phone: "+256712345678",
        totalAmount: "500,000",
      },
    ],
    payments: [],
  },
];

const mockUser = {
  name: "Mariam Tukasingura",
  phone: "256721695 645",
  avatar: "/photo.png",
  pointsBalance: 5000,
  avatarsize: 120,
  tier: "Blue",
  tierProgress: 30,
  expiryDate: "30 Apr 2027",
  invoicesCount: 4,
};

type TabType = "points" | "tier" | "invoices";
type RedeemableOffer = (typeof REDEEMABLE_OFFERS)[0];
type InvoiceType = (typeof MOCK_INVOICES)[0];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("tier");
  const [buyPointsOpen, setBuyPointsOpen] = useState<boolean>(false);
  const [spendPointsOpen, setSpendPointsOpen] = useState<boolean>(false);
  const [tierDetailsOpen, setTierDetailsOpen] = useState<boolean>(false);

  // NEW: State for selected Invoice
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceType | null>(
    null
  );
  const [selectedRedeemOffer, setSelectedRedeemOffer] =
    useState<RedeemableOffer | null>(null);

  const handleViewRedeemOffer = (offer: RedeemableOffer) => {
    setSelectedRedeemOffer(offer);
  };

  const handleSpendFromDetails = () => {
    setSelectedRedeemOffer(null);
    setSpendPointsOpen(true);
  };

  // Helper to determine status color and icon
  const getStatusVisuals = (status: string) => {
    switch (status) {
      case "Paid":
        return {
          color: "text-green-600 bg-green-50",
          icon: <CheckCircle size={18} className="fill-green-600 text-white" />,
        };
      case "Pending":
        return {
          color: "text-yellow-600 bg-yellow-50",
          icon: <Clock size={18} className="fill-yellow-500 text-white" />,
        };
      case "Overdue":
        return {
          color: "text-red-600 bg-red-50",
          icon: <AlertCircle size={18} className="fill-red-500 text-white" />,
        };
      default:
        return { color: "text-gray-600 bg-gray-50", icon: <Clock size={18} /> };
    }
  };

  // Calculate Total Amount for the Header
  // Note: We are mocking a sum of "Total Invoiced Amount" here.
  const totalInvoicedSum = "1,015,000";

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-[#fff8e7] font-sans">
      <TopNav />
      <Header
        name={mockUser.name}
        phone={mockUser.phone}
        avatar={mockUser.avatar}
        useVideo={false}
        onAvatarFileChange={() => {}}
      />

      <main className="px-0">
        {/* --- TABS SECTION --- */}
        <div className="bg-white shadow-lg flex divide-x divide-gray-100">
          {/* TAB 1: POINTS */}
          <button
            onClick={() => setActiveTab("points")}
            className={`flex-1 py-4 flex flex-col items-center justify-center relative transition-colors ${
              activeTab === "points" ? "bg-white" : "bg-gray-50/50"
            }`}
          >
            <span className="text-3xl text-gray-800 font-light tracking-tight">
              {mockUser.pointsBalance.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-gray-500 uppercase mt-1">
              Your Points
            </span>
            {activeTab === "points" && (
              <div className="absolute bottom-0 w-full h-[3px] bg-[#cb0d6c] animate-in fade-in zoom-in duration-200" />
            )}
          </button>

          {/* TAB 2: TIER */}
          <button
            onClick={() => setActiveTab("tier")}
            className={`flex-1 py-4 flex flex-col items-center justify-center relative transition-colors ${
              activeTab === "tier" ? "bg-white" : "bg-gray-50/50"
            }`}
          >
            <span className="text-3xl text-gray-800 font-light tracking-tight">
              {mockUser.tier}
            </span>
            <span className="text-xs font-medium text-gray-500 uppercase mt-1">
              Tier
            </span>
            {activeTab === "tier" && (
              <div className="absolute bottom-0 w-full h-[3px] bg-[#cb0d6c] animate-in fade-in zoom-in duration-200" />
            )}
          </button>

          {/* TAB 3: INVOICES */}
          <button
            onClick={() => setActiveTab("invoices")}
            className={`flex-1 py-4 flex flex-col items-center justify-center relative transition-colors ${
              activeTab === "invoices" ? "bg-white" : "bg-gray-50/50"
            }`}
          >
            <span className="text-3xl text-gray-800 font-light tracking-tight">
              {mockUser.invoicesCount}
            </span>
            <span className="text-xs font-medium text-gray-500 uppercase mt-1">
              My Invoices
            </span>
            {activeTab === "invoices" && (
              <div className="absolute bottom-0 w-full h-[3px] bg-[#cb0d6c] animate-in fade-in zoom-in duration-200" />
            )}
          </button>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="mt-6 px-4">
          {/* Action Buttons (Points tab only) */}
          <div className="flex items-center justify-end mb-4 gap-3">
            {activeTab === "points" && (
              <>
                <button
                  onClick={() => setSpendPointsOpen(true)}
                  className="text-sm font-semibold px-5 py-2 rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
                >
                  Spend Points
                </button>
                <button
                  onClick={() => setBuyPointsOpen(true)}
                  className="text-sm font-semibold px-5 py-2 rounded-full bg-[#ef4155] text-white shadow-md shadow-[#ef4155]/30 hover:bg-[#cb0d6c] active:scale-95 transition-all"
                >
                  Buy Points
                </button>
              </>
            )}
          </div>

          {/* Tier Progress (Tier tab only) */}
          <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
            {activeTab === "tier" && (
              <TierProgress
                currentTier={mockUser.tier}
                progress={mockUser.tierProgress}
              />
            )}
          </div>
        </div>

        {/* --- BOTTOM LISTS --- */}
        <div className="mt-8">
          {/* 1. VIEW: POINTS TAB */}
          {activeTab === "points" && (
            <>
              <div className="px-4 mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  Redeemable Offers
                </h3>
              </div>
              <div className="space-y-4 px-4 pb-20">
                {REDEEMABLE_OFFERS.map((offer, index) => (
                  <div
                    key={offer.id}
                    className="overflow-hidden flex items-center bg-white rounded-lg shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">
                        {index + 1}. {offer.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {offer.desc}
                      </div>
                    </div>
                    <div className="p-1 shrink-0">
                      <button
                        onClick={() => handleViewRedeemOffer(offer)}
                        className="text-sm px-4 py-2 rounded-full bg-[#d81b60] hover:bg-[#b81752] text-white font-medium transition-colors active:scale-95"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 2. VIEW: TIER TAB */}
          {activeTab === "tier" && (
            <>
              <div className="px-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Tier Benefits
                </h3>
              </div>

              <div className="px-4">
                <div
                  onClick={() => setTierDetailsOpen(true)}
                  className="cursor-pointer bg-white py-4 mx-4 rounded-lg border border-gray-100 shadow-sm text-center hover:shadow-lg transition-shadow"
                >
                  <button
                    type="button"
                    className="text-lg font-semibold text-gray-900 w-full py-2"
                  >
                    View All Benefits & Details
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <div className="px-4 mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Earn points from
                  </h3>
                </div>
                <ServicesList />
              </div>
            </>
          )}

          {/* 3. VIEW: INVOICES TAB (UPDATED) */}
          {activeTab === "invoices" && (
            <div className="px-4 pb-20 animate-in slide-in-from-bottom-2 fade-in duration-300">
              {/* Total Amount Header */}
              <div className="bg-[#b03f69] rounded-xl p-5 text-white shadow-lg shadow-blue-900/20 mb-6">
                <p className="text-blue-200 text-sm font-medium uppercase tracking-wide">
                  Total Invoiced
                </p>
                <h2 className="text-3xl font-bold mt-1">{totalInvoicedSum}</h2>
                <div className="mt-2 text-xs text-blue-300">
                  Total value across all invoices
                </div>
              </div>

              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">History</h3>
              </div>

              <div className="space-y-3">
                {MOCK_INVOICES.map((inv) => {
                  const visuals = getStatusVisuals(inv.status);

                  return (
                    <div
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group"
                    >
                      {/* Left: Invoice ID and Last Paid Info */}
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {/* Icon replaces FileText, generic file icon */}
                          <div className="" title={inv.status}>
                            {visuals.icon}
                          </div>
                        </div>
                        <div className="flex flex-col items-start">
                          <p className="font-bold text-gray-900 leading-none">
                            {inv.id}
                          </p>

                          {/* Last Paid Logic */}
                          {inv.lastPaid !== "0" ? (
                            <p className="text-xs text-gray-500 mt-1">
                              Last paid: {inv.lastPaid}{" "}
                              <span className="text-gray-400">
                                ({inv.daysAgo} days ago)
                              </span>
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 mt-1 italic">
                              No payments yet
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Remaining Amount & Status Icon */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          {/* Remaining Amount */}
                          <span className="block font-bold text-gray-800 text-sm">
                            {inv.remaining}
                          </span>
                          {/* <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                            Remaining
                          </span> */}
                        </div>

                        {/* Status Icon (Green/Yellow/Red) */}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- MODALS --- */}
      <BuyPoints
        open={buyPointsOpen}
        onClose={() => setBuyPointsOpen(false)}
        onSuccess={() => {}}
      />

      <SpendPointsModal
        open={spendPointsOpen}
        onClose={() => setSpendPointsOpen(false)}
        currentPoints={mockUser.pointsBalance}
      />

      <TierDetailsModal
        open={tierDetailsOpen}
        onClose={() => setTierDetailsOpen(false)}
        tier={mockUser.tier}
        expiry={mockUser.expiryDate}
        pointsToNextTier={1500}
      />

      {/* --- NEW INVOICE DETAIL MODAL --- */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* --- REDEEM OFFER MODAL --- */}
      {selectedRedeemOffer && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedRedeemOffer(null)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-bold text-gray-800">
                Redeem Offer Details
              </h4>
              <button
                onClick={() => setSelectedRedeemOffer(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="font-semibold text-gray-900">
              {selectedRedeemOffer.title}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              {selectedRedeemOffer.desc}
            </p>

            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-6">
              <p className="text-sm text-red-700 font-semibold">
                Cost: {selectedRedeemOffer.pointsCost.toLocaleString()} Points
              </p>
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={() => setSelectedRedeemOffer(null)}
                className="flex-1 text-sm font-medium px-4 py-2 rounded-full text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSpendFromDetails()}
                disabled={
                  mockUser.pointsBalance < selectedRedeemOffer.pointsCost
                }
                className={`flex-1 text-sm font-semibold px-4 py-2 rounded-full transition-all ${
                  mockUser.pointsBalance >= selectedRedeemOffer.pointsCost
                    ? "bg-[#ef4155] text-white hover:bg-[#cb0d6c] shadow-md shadow-[#ef4155]/30"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                Spend Points
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: INVOICE DETAIL MODAL ---


function InvoiceDetailModal({
  invoice,
  onClose,
}: {
  invoice: any; // Replaced with 'any' or your specific 'InvoiceType'
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"details" | "payment">("details");

  // Function to download the entire model (JSON data)
  const handleDownload = () => {
    // 1. Convert the invoice object to a JSON string
    const jsonString = JSON.stringify(invoice, null, 2);
    
    // 2. Create a Blob (file-like object)
    const blob = new Blob([jsonString], { type: "application/json" });
    
    // 3. Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);
    
    // 4. Create a hidden link element and trigger click
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice_${invoice.id}_Data.pdf`; // File name
    document.body.appendChild(link);
    link.click();
    
    // 5. Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{invoice.id}</h3>
            <p className="text-xs text-gray-500">Issued: {invoice.date}</p>
          </div>
          
          <div className="flex gap-2">
            {/* NEW: Download Button */}
            <button
              onClick={handleDownload}
              title="Download Invoice Data"
              className="p-2 bg-white rounded-full text-gray-500 hover:text-[#c01754] shadow-sm border border-gray-100 transition-colors"
            >
              <Download size={20} />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 bg-white rounded-full text-gray-500 hover:text-gray-800 shadow-sm border border-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Internal Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab("details")}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              tab === "details"
                ? "border-[#c01754] text-[#c01754] bg-[#c01754]/5"
                : "border-transparent text-gray-500 hover:bg-gray-50"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setTab("payment")}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              tab === "payment"
                ? "border-[#c01754] text-[#c01754] bg-[#c01754]/5"
                : "border-transparent text-gray-500 hover:bg-gray-50"
            }`}
          >
            Payment
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto">

          {/* DETAILS TAB CONTENT */}
          {tab === "details" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
              {/* INVOICE ITEMS SECTION */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Invoice Items
                </p>

                <div className="bg-white rounded-lg p-2">
                  {invoice.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-gray-700 text-sm font-medium">
                        Service/Product
                      </span>
                      <span className="text-gray-900 text-sm font-medium">
                        {item.service}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOTALS SECTION */}
              <div className="bg-gray-50 rounded-lg p-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Client</span>
                  <span className="font-medium text-gray-900">
                    {invoice.items[0]?.client || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Client Phone</span>
                  <span className="font-medium text-gray-900">
                    {invoice.items[0]?.phone || "N/A"}
                  </span>
                </div>
                <div className="border-t border-gray-200 my-2 pt-2"></div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Amount</span>
                  <span className="font-medium text-gray-900">
                    {invoice.totalAmount}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Paid Amount</span>
                  <span className="font-medium text-[#c01754]">
                    {invoice.lastPaid}
                  </span>
                </div>
                <div className="border-t border-gray-200 my-2 pt-2 flex justify-between text-base">
                  <span className="font-bold text-gray-800">Remaining</span>
                  <span className="font-bold text-gray-900">
                    {invoice.remaining}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* PAYMENT TAB CONTENT */}
          {tab === "payment" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Payment History
              </p>

              {invoice.payments && invoice.payments.length > 0 ? (
                <div className="space-y-3">
                  {invoice.payments.map((pay: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 bg-green-50/50 p-3 rounded-lg border border-green-100"
                    >
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0 mt-0.5">
                        <CheckCircle size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-semibold text-gray-800">
                            {pay.amount}
                          </p>
                          <p className="text-xs text-gray-400">
                            {pay.date}
                          </p>
                        </div>
                        
                         {/* NEW: Transaction ID Display */}
                        <div className="mt-1 pt-1 border-t border-green-100/50">
                          <p className="text-[10px] text-gray-400 font-mono tracking-wide">
                            Tran ID: <span className="text-gray-600 font-medium">{pay.tranId || "N/A"}</span>
                          </p>
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          {pay.method}
                        </p>
                        
                       
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-400">
                    <AlertCircle size={24} />
                  </div>
                  <p className="text-sm text-gray-500">
                    No payments have been recorded for this invoice yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}