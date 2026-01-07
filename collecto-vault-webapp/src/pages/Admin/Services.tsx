import { useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import { Search, ShoppingCart, Filter, ChevronDown } from "lucide-react";
import Icon from "../../components/Icon";
import { invoiceService } from "../../api/collecto";

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

  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);

  // Toast / notification
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  };


  // Cart
  type CartItem = {
    id: string;
    name: string;
    unitAmount: number;
    quantity: number;
    photo?: string;
    category?: string;
    isProduct?: boolean;
  };

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;

  // Search & Category Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchServices();

    // fetch client profile to get clientId for invoice payload
    (async () => {
      try {
        const res = await customerService.getProfile("me");
        const d = res.data?.data ?? res.data ?? res;
        // Try common id fields
        const id = d?.id ?? d?.customerId ?? d?.userId ?? null;
        if (id) setClientId(String(id));
      } catch (err) {
        // ignore
      }
    })();
  }, [page]);

  useEffect(() => {
    let result = services;
    if (selectedCategory && selectedCategory !== 'All') {
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



  async function fetchServices() {
    setLoading(true);
    try {
      const collectoId = localStorage.getItem("collectoId") || "141122";
      // send page (1-indexed) and limit to avoid huge responses from API
      const response = await customerService.getServices(collectoId, page + 1, itemsPerPage);
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

      const catSet = new Set<string>();
      mappedServices.forEach((s: any) => catSet.add((s.category ?? 'General') as string));
      const uniqueCategories: string[] = ["All", ...Array.from(catSet)];

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



  // Pagination helpers (server returns a page; if fewer than itemsPerPage returned then there's no next page)
  const paginatedServices = filteredServices; // already the current page
  const hasPrev = page > 0;
  const hasNext = services.length === itemsPerPage; // if current page returned a full page, there may be a next page

  // Cart helpers
  const addToCart = (s: Service) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === s.id);
      if (existing) {
        // increase quantity
        return prev.map((c) => (c.id === s.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [
        ...prev,
        {
          id: s.id,
          name: s.name,
          unitAmount: s.amount,
          quantity: 1,
          photo: s.photo,
          category: s.category,
          isProduct: s.isProduct,
        },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, quantity: Math.max(1, quantity) } : c)));
  };

  const cartCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const cartTotal = cart.reduce((acc, it) => acc + it.unitAmount * it.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopNav />

      {/* Toast (global) */}
      {toast && !cartOpen && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-auto px-4 py-2 rounded shadow-lg text-sm ${toast.type === 'success' ? 'bg-green-600 text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold flex gap-2 items-center text-gray-800">
            <Icon name="services" className="text-[#d81b60]" size={20} />
            Services and Products
          </h1>

          <button
            onClick={() => setCartOpen(true)}
            className="relative rounded-full p-2 bg-white border border-gray-200 shadow-sm hover:shadow-md flex items-center gap-2"
            aria-label="Open cart"
          >
            <ShoppingCart className="w-5 h-5 text-gray-700" />
            <span className="text-sm font-bold text-gray-700">UGX {cartTotal.toLocaleString()}</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#d81b60] text-white text-[10px] rounded-full px-1.5 py-0.5">{cartCount}</span>
            )}
          </button>
        </div>

        {/* --- Search with Category Dropdown --- */}
        <div className="flex gap-2 mb-8 items-center">
          <div className="relative w-1/2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-[#d81b60] outline-none transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {categories.length > 0 && (
            <div className="relative w-1/2">
              <Filter className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm appearance-none text-sm"
                aria-label="Filter by category"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          )}
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
          {paginatedServices.map((s) => {
            const cartItem = cart.find((c) => c.id === s.id);
            const selected = Boolean(cartItem);
            const qty = cartItem?.quantity || 0;
            return (
              <div
                key={s.id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-pink-100 transition-all group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-50">
                    {s.photo ? (
                      <img
                        src={`${photosBaseUrl}${s.photo}`}
                        alt={s.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300">
                        NO IMAGE
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="font-bold text-gray-900 truncate text-sm text-left">{s.name}</h2>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] text-[#d81b60] font-medium bg-pink-50 px-2 py-0.5 rounded-md inline-block">
                        {s.category}
                      </span>
                      {s.isProduct && (
                        <span className="text-[9px] text-gray-700 font-medium bg-gray-100 px-2 py-0.5 rounded-md inline-block">
                          Product
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-800 text-left">
                      UGX {s.amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="ml-2 flex items-center shrink-0">
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => {
                        if (selected) updateQuantity(s.id, qty + 1);
                        else addToCart(s);
                      }}
                      aria-label={`Increase quantity for ${s.name}`}
                      className="w-6 h-6 flex items-center justify-center text-[12px] rounded bg-gray-100"
                    >
                      +
                    </button>

                    <div className="text-[11px] font-semibold bg-white border px-2 py-0.5 rounded">{qty}</div>

                    <button
                      onClick={() => {
                        if (selected) {
                          if (qty > 1) updateQuantity(s.id, qty - 1);
                          else removeFromCart(s.id);
                        }
                      }}
                      aria-label={`Decrease quantity for ${s.name}`}
                      className="w-6 h-6 flex items-center justify-center text-[12px] rounded bg-gray-100"
                    >
                      −
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center items-center gap-3 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={!hasPrev}
            className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-gray-500">Page {page + 1}</span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext}
            className="px-4 py-2 rounded-xl bg-[#cabbc0] text-gray-800 hover:opacity-90 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </main>

      {/* Inline Cart Panel Below Services */}
      {cartOpen && (
        <div className="mx-auto max-w-4xl mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-lg text-gray-900">Your Cart</h3>
              <p className="text-sm text-gray-500 mt-1">{cart.length} items — UGX {cartTotal.toLocaleString()}</p>
            </div>
            <button onClick={() => setCartOpen(false)} className="text-gray-400 p-2 text-lg">✕</button>
          </div>

          {toast && cartOpen && (
            <div className={`mb-3 px-4 py-2 rounded text-sm ${toast.type === 'success' ? 'bg-green-600 text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`} role="status" aria-live="polite">
              {toast.message}
            </div>
          )}

          <div className="space-y-2 mb-4">
            {cart.length === 0 && <div className="text-center text-gray-500 py-4">Your cart is empty.</div>}

            {cart.map((it) => (
              <div key={it.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">{it.name}</div>
                  <div className="text-sm font-bold text-gray-800 mt-1">UGX {it.unitAmount.toLocaleString()}</div>
                </div>

                <div className="px-3 py-1 bg-white border rounded text-sm">Qty: {it.quantity}</div>

                <div className="ml-4 text-right">
                  <div className="font-bold text-sm">UGX {(it.unitAmount * it.quantity).toLocaleString()}</div>
                  <button onClick={() => removeFromCart(it.id)} className="text-xs text-red-500 mt-1">Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-3 rounded-xl mb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-lg font-bold">UGX {cartTotal.toLocaleString()}</div>
            </div>
          </div>

          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Mobile Money Number</label>
          <input
            type="tel"
            placeholder="0775617890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border-2 border-gray-100 p-3 rounded-xl mb-4 focus:border-[#d81b60] outline-none transition-all font-mono"
          />

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={async () => {
                if (cart.length === 0) { showToast('Cart is empty', 'error'); return; }
                setLoading(true);
                try {
                  const collectoId = localStorage.getItem("collectoId") || "141122";
                  if (!clientId) { showToast('Unable to determine your customer id. Please login or refresh your profile.', 'error'); setLoading(false); return; }
                  const payload = {
                    collectoId,
                    clientId: clientId,
                    items: cart.map((c) => ({ serviceId: c.id, serviceName: c.name, amount: c.unitAmount, quantity: c.quantity })),
                    amount: cartTotal,
                    phone,
                    payNow: 0, // Place Order creates invoice (not immediate payment)
                  };
                  const { data } = await invoiceService.createInvoice(payload);
                  showToast(`Order placed: ${data.invoiceId ?? 'unknown'}`, 'success');
                  setCart([]);
                  setCartOpen(false);
                } catch (err: any) {
                  console.error('Place order failed:', err);
                  showToast(err?.message || 'Failed to place order', 'error');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full py-3 bg-[#d81b60] text-white rounded-xl font-bold hover:opacity-95 disabled:opacity-50 transition-all"
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}