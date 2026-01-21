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

  // Service detail modal state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const openDetail = (s: Service) => { setSelectedService(s); setDetailOpen(true); setActivePreviewId(null); };
  const closeDetail = () => { setSelectedService(null); setDetailOpen(false); };

  // Pagination
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;

  // Search & Category Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchServices();

    // Initialize clientId from the login step if available
    
    const storedClientId = localStorage.getItem('clientId');
    if (storedClientId) setClientId(storedClientId);
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

  // Close active inline preview when clicking *outside* a card
  useEffect(() => {
    const onDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-service-card]')) {
        setActivePreviewId(null);
      }
    };
    document.addEventListener('click', onDocumentClick);
    return () => document.removeEventListener('click', onDocumentClick);
  }, []);

  // Reset to first page whenever the filtered result changes (e.g., search or category changes)
  useEffect(() => {
    setPage(0);
  }, [filteredServices]);



  async function fetchServices() {
    setLoading(true);
    try {
      const vaultOTPToken = sessionStorage.getItem("vaultOTPToken") || undefined;
      const collectoId = localStorage.getItem("collectoId") || undefined;
      // send page (1-indexed) and limit to avoid huge responses from API
      const response = await customerService.getServices(vaultOTPToken,collectoId, page + 1, itemsPerPage);
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
const paginatedServices = filteredServices; 
  // const hasPrev = page > 0;
  // const hasNext = services.length === itemsPerPage; 

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

  // Place order helper (creates invoice)
const handlePlaceOrder = async () => {
  if (cart.length === 0) {
    showToast('Cart is empty', 'error');
    return;
  }

  setLoading(true);

  try {
    const collectoId = localStorage.getItem("collectoId") || "141122";
    if (!clientId) {
      showToast('Customer ID missing. Please login.', 'error');
      setLoading(false);
      return;
    }

    const payload = {
      vaultOTPToken: sessionStorage.getItem('vaultOtpToken') || undefined,
      collectoId,
      clientId,
      totalAmount: Number(cartTotal),
      items: cart.map((c) => ({
        serviceId: c.id,
        serviceName: c.name,
        quantity: c.quantity,
        totalAmount: Number(c.unitAmount * c.quantity),
      })),
    };

    const response = await invoiceService.createInvoice(payload);

    // --- CAREFUL EXTRACTION ---
    // 1. Get the main body (Axios .data)
    const apiRoot = response.data; 
    const invoiceId = apiRoot?.data?.invoiceId;

    // LOGGING FOR DEBUGGING
    console.log("Full API Root:", apiRoot);
    console.log("Extracted Invoice ID:", invoiceId);
  if (invoiceId && apiRoot?.status?.toString() === "200") {
      
      // Success: We have a valid ID and a 200 status
      showToast(`Order placed: ${invoiceId}`, 'success');

      try {
        window.dispatchEvent(new CustomEvent('invoice:created', { 
          detail: invoiceId 
        }));
      } catch (e) { /* silent fail */ }

      setCart([]);
      setCartOpen(false);

    } else {
      // Failure: ID is missing or status is not 200
      const errorMsg = apiRoot?.data?.message || "Invoice ID was not returned by the server.";
      showToast(errorMsg, 'error');
    }

  } catch (err: any) {
    console.error('Place order failed:', err);
    const msg = err?.response?.data?.data?.message || err.message || 'Failed to place order';
    showToast(msg, 'error');
  } finally {
    setLoading(false);
  }
};
  const cartCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const cartTotal = cart.reduce((acc, it) => acc + it.unitAmount * it.quantity, 0);

  return (
    <div className="min-h-screen bg-gray- 50 pb-20">
      <TopNav />

      {/* Toast (global) */}
      {toast && !cartOpen && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-auto px-4 py-2 rounded shadow-lg text-sm ${toast.type === 'success' ? 'bg-green-600 text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}

      <main className="w-full p-3 md:p-4 pt-0">
        <div className="flex flex-col items-start mb-6">
          <h1 className="text-2xl md:text-3xl font-bold flex gap-0.5 items-center text-gray-800">
            <Icon name="services" className="text-[#d81b60]" size={20} />
            Services and Products
          </h1>

          <div className="w-full flex justify-start mt-2">
            <button
              onClick={() => setCartOpen(true)}
              className="relative rounded-full p-2 bg-white border border-gray-200 shadow-sm hover:shadow-md flex items-center gap-2"
              aria-label="Open cart"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              <span className="text-sm font-bold text-gray-400">UGX {cartTotal.toLocaleString()}</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#d3c7cb] text-gray-900 text-[10px] rounded-full px-1.5 py-0.5">{cartCount}</span>
              )}
            </button>
          </div>
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
                data-service-card={s.id}
                onClick={() => {
                  if (activePreviewId === s.id) {
                    // second tap => open details modal
                    openDetail(s);
                  } else {
                    // first tap => show inline preview
                    setActivePreviewId(s.id);
                  }
                }}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between transition-all group relative cursor-pointer"
              > 
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-50">
                    {s.photo ? (
                      <img

                        src={`${photosBaseUrl}${s.photo}`}
                        alt={s.name}
                        className="w-full h-full object-cover transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300">
                        NO IMAGE
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="font-bold text-gray-900 truncate text-xs text-left">{s.name}</h2>
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
                    <p className="text-xs font-semibold text-gray-800">
                      {s.amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="ml-2 flex items-center shrink-0">
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
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
                      onClick={(e) => {
                        e.stopPropagation();
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

                {/* Tap preview (replaces hover) */}
                <div
                  className={`absolute inset-0 bg-white/95 p-4 rounded-2xl shadow-lg ${activePreviewId === s.id ? 'flex' : 'hidden'} flex-col justify-between`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={(e) => { e.stopPropagation(); setActivePreviewId(null); }} className="absolute top-3 right-3 p-1 rounded-full text-gray-600 hover:bg-gray-100">✕</button>

                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{s.name}</h3>
                    <p className="text-xs text-gray-600 mt-2 max-h-14 overflow-hidden">{s.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">UGX {s.amount.toLocaleString()}</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); addToCart(s); showToast('Added to cart', 'success'); }}
                      className="py-2 px-3 bg-[#d81b60] text-white rounded-xl text-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div> 
            );
          })}
        </div>

      </main>

      {/* Inline Cart Popup Modal */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />

          <div className="relative w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-lg p-4 z-10">
            <div className="flex items-start justify-between mb-3">
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

      {/* Service detail modal */}
      {detailOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeDetail} />
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-lg p-4 z-10">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{selectedService.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedService.category}</p>
              </div>
              <button onClick={closeDetail} className="text-gray-400 p-2 text-lg">✕</button>
            </div>

            {selectedService.photo && (
              <img src={`${photosBaseUrl}${selectedService.photo}`} alt={selectedService.name} className="w-full h-48 object-cover rounded-md mb-3" />
            )}

            <p className="text-sm text-gray-700 mb-4">{selectedService.description}</p>

            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">UGX {selectedService.amount.toLocaleString()}</div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(selectedService);
                    showToast('Added to cart', 'success');
                    setDetailOpen(false);
                  }}
                  className="py-2 px-4 bg-[#d81b60] text-white rounded-xl font-bold"
                >
                  Add to Cart
                </button>
                <button onClick={closeDetail} className="py-2 px-4 border border-gray-200 rounded-xl">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

            <div className="mb-4 max-h-60 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 py-6">Your cart is empty.</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {cart.map((it) => (
                    <li key={it.id} className="flex items-center justify-between py-2">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-800 text-xs truncate">
                          {it.name} <span className="text-gray-600 text-xs">({it.quantity})</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">UGX {it.unitAmount.toLocaleString()} each</div>
                      </div>

                      <div className="ml-4 text-right">
                        <div className="font-semibold text-sm">UGX {(it.unitAmount * it.quantity).toLocaleString()}</div>
                        <button onClick={() => removeFromCart(it.id)} className="text-xs text-red-500 mt-1">Remove</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
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

            <div className="flex gap-2">
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="flex-1 py-3 bg-[#ddd2d6] text-gray-800 rounded-xl font-bold hover:opacity-95 disabled:opacity-50 transition-all"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>

              <button onClick={() => setCartOpen(false)} className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}