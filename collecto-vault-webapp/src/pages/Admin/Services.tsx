import { useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import { Search, ChevronDown } from "lucide-react";
import Icon from "../../components/Icon";
import api from "../../api";
import { customerService } from "../../api/customer";

type Service = {
  id: string;
  name: string;
  amount: number;
  photo: string;
  description: string;
  category: string;
  isProduct?: boolean;
};

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [photosBaseUrl, setPhotosBaseUrl] = useState<string>("");
  const [selected, setSelected] = useState<Service | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Quantity for products (1+)
  const [quantity, setQuantity] = useState<number>(1);

  // Pagination
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>(["All"]);

  useEffect(() => {
    fetchServices();
  }, [page]);

  useEffect(() => {
    let result = services;
    if (selectedCategory !== "All") {
      result = result.filter((s) => s.category === selectedCategory);
    }
    if (searchQuery) {
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredServices(result);
  }, [searchQuery, selectedCategory, services]);

  // Reset to first page whenever the filtered result changes (e.g., search or category changes)
  useEffect(() => {
    setPage(0);
  }, [filteredServices]);

  // Reset quantity whenever a new service/product is selected
  useEffect(() => {
    setQuantity(1);
  }, [selected]);

  async function fetchServices() {
    setLoading(true);
    try {
      const collectoId = localStorage.getItem("collectoId") || "141122";
      // send page (1-indexed) and limit to avoid huge responses from API
      const response = await customerService.getServices(collectoId, page + 1);
      const payload = response.data?.data;
      const innerData = payload?.data;
      const records = innerData?.records || [];
      const baseUrl = innerData?.metadata?.photosUrl || "";

      const mappedServices = records.map((item: any) => ({
        id: item.id,
        name: item.name,
        amount: item.price,
        photo: item.photo,
        description: item.description,
        category: item.category || "General",
        // API returns 1 or 0 for is_product
        isProduct: Boolean(item.is_product),
      }));

      const uniqueCategories: string[] = [
        "All",
        ...Array.from(new Set(mappedServices.map((s: any) => s.category))) as string[],
      ];

      setCategories(uniqueCategories);
      setPhotosBaseUrl(baseUrl);
      setServices(mappedServices);
      setFilteredServices(mappedServices);
    } catch (err: any) {
      console.error("Failed to fetch services:", err);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  // Payment functions (payNow, payLater) remain identical...
  async function payLater() {
    if (!selected) return;
    setLoading(true);
    try {
      const totalAmount = (selected.amount || 0) * (quantity || 1);
      const { data } = await api.post("/invoice", {
        serviceId: selected.id,
        serviceName: selected.name,
        quantity: selected.isProduct ? quantity : 1,
        amount: totalAmount,
      });
      alert(`Invoice created: ${data.invoiceId ?? "unknown"}`);
      setSelected(null);
    } catch (err: any) {
      console.error("Pay later failed:", err);
      alert(err.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  }

  async function payNow() {
    if (!selected) return;
    setLoading(true);
    try {
      const totalAmount = (selected.amount || 0) * (quantity || 1);
      const { data } = await api.post("/pay", {
        serviceId: selected.id,
        serviceName: selected.name,
        amount: totalAmount,
        quantity: selected.isProduct ? quantity : 1,
        phone,
      });
      alert(`Payment initiated: ${data.receiptId ?? "unknown"}`);
      setSelected(null);
    } catch (err: any) {
      console.error("Pay now failed:", err);
      alert(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  // Pagination helpers
  const paginatedServices = filteredServices.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
  const hasPrev = page > 0;
  const hasNext = (page + 1) * itemsPerPage < filteredServices.length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopNav />

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 flex gap-2 items-center text-gray-800">
          <Icon name="services" className="text-[#d81b60]" size={20} />
          Available Services
        </h1>

        {/* --- Single Line Search & Filter --- */}
        <div className="flex gap-2 md:gap-4 mb-8">
          <div className="relative flex-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-[#d81b60] outline-none transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="relative flex-1">
            <select
              className="w-full pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm appearance-none focus:ring-2 focus:ring-[#d81b60] outline-none transition-all cursor-pointer text-sm truncate"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d81b60]"></div>
          </div>
        )}

        {!loading && filteredServices.length === 0 && (
          <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
            No services found matching your criteria.
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {paginatedServices.map((s) => (
            <div
              key={s.id}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-pink-100 transition-all group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-50">
                  {s.photo ? (
                    <img
                      src={`${photosBaseUrl}${s.photo}`}
                      alt={s.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300">
                      NO IMAGE
                    </div>
                  )}
                </div>

                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="font-bold text-gray-900 truncate text-sm md:text-base text-left">{s.name}</h2>
                  </div>
                  <span className="text-[10px] text-[#d81b60] font-medium bg-pink-50 px-2 py-0.5 rounded-md mb-1 block">
                    {s.category}
                  </span>
                  <p className="text-sm font-black text-gray-800 text-left">
                    UGX {s.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelected(s)}
                className="ml-2 px-4 py-2 rounded-xl bg-gray-200 text-gray-800 text-xs font-bold hover:bg-[#b19ba3] transition-colors shrink-0"
              >
                Order Now
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-center items-center gap-3 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={!hasPrev}
            className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-gray-500">Page {page + 1} of {Math.max(1, Math.ceil(filteredServices.length / itemsPerPage))}</span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext}
            className="px-4 py-2 rounded-xl bg-[#cabbc0] text-gray-800 hover:opacity-90 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </main>

      {/* Purchase Modal stays the same... */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white p-6 rounded-t-3xl md:rounded-2xl w-full max-w-md shadow-2xl animate-in slide-in-from-bottom md:zoom-in duration-300">
             {/* Modal Content */}
             <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selected.category}</span>
                <h3 className="font-bold text-xl text-gray-900">{selected.name}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 p-2 text-xl">✕</button>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl mb-6">
              {selected.isProduct ? (
                <>
                  <p className="text-xs text-gray-500 mb-1">Unit Price</p>
                  <p className="text-lg font-bold text-gray-900">UGX {selected.amount.toLocaleString()}</p>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1 rounded-lg bg-gray-100 text-lg"
                    >
                      −
                    </button>

                    <div className="px-4 py-1 bg-white border rounded-lg">
                      {quantity}
                    </div>

                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3 py-1 rounded-lg bg-gray-100 text-lg"
                    >
                      +
                    </button>

                    <div className="ml-auto text-sm text-gray-500">Total: <span className="font-black">UGX {(selected.amount * quantity).toLocaleString()}</span></div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                  <p className="text-2xl font-black text-gray-900">UGX {selected.amount.toLocaleString()}</p>
                </>
              )}
            </div>

            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Mobile Money Number</label>
            <input
              type="tel"
              placeholder="0775617890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border-2 border-gray-100 p-4 rounded-xl mb-6 focus:border-[#d81b60] outline-none transition-all font-mono"
            />

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={payNow}
                disabled={loading}
                className="w-full py-4 bg-[#d1c7cb] text-gray-800 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 shadow-lg shadow-pink-200"
              >
                {loading ? "Processing..." : "Pay Now"}
              </button>
              <button
                onClick={payLater}
                disabled={loading}
                className="w-full py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Pay Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}