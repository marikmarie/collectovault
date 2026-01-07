import { useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import { Search, ShoppingCart, Filter, ChevronDown } from "lucide-react";
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

  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");


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

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold flex gap-2 items-center text-gray-800">
            <Icon name="services" className="text-[#d81b60]" size={20} />
            Services / Products
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
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-[#d81b60] font-medium bg-pink-50 px-2 py-0.5 rounded-md inline-block">
                        {s.category}
                      </span>
                      {s.isProduct && (
                        <span className="text-[10px] text-gray-700 font-medium bg-gray-100 px-2 py-0.5 rounded-md inline-block">
                          Product
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-black text-gray-800 text-left">
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
                      className="w-7 h-7 flex items-center justify-center text-xs rounded bg-gray-100"
                    >
                      +
                    </button>

                    <div className="text-xs font-semibold bg-white border px-2 py-0.5 rounded">{qty}</div>

                    <button
                      onClick={() => {
                        if (selected) {
                          if (qty > 1) updateQuantity(s.id, qty - 1);
                          else removeFromCart(s.id);
                        }
                      }}
                      aria-label={`Decrease quantity for ${s.name}`}
                      className="w-7 h-7 flex items-center justify-center text-xs rounded bg-gray-100"
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

      {/* Cart Modal */}
      {cartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white p-6 rounded-t-3xl md:rounded-2xl w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom md:zoom-in duration-300">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-xl text-gray-900">Your Cart</h3>
                <p className="text-sm text-gray-500 mt-1">{cart.length} items — UGX {cartTotal.toLocaleString()}</p>
              </div>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 p-2 text-xl">✕</button>
            </div>

            <div className="space-y-3 mb-4">
              {cart.length === 0 && <div className="text-center text-gray-500 py-6">Your cart is empty.</div>}

              {cart.map((it) => (
                <div key={it.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                  <div className="w-12 h-12 rounded-md bg-white overflow-hidden border">
                    {it.photo ? (
                      <img src={`${photosBaseUrl}${it.photo}`} alt={it.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[12px] text-gray-400">No Img</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 truncate">{it.name}</div>
                    <div className="text-xs text-gray-500">{it.category}</div>
                    <div className="text-sm font-black text-gray-800 mt-1">UGX {it.unitAmount.toLocaleString()}</div>
                  </div>

                  <div className="px-3 py-1 bg-white border rounded text-sm">{it.quantity}</div>

                  <div className="ml-4 text-right">
                    {/* <div className="text-sm text-gray-500">Line</div> */}
                    <div className="font-black">UGX {(it.unitAmount * it.quantity).toLocaleString()}</div>
                    <button onClick={() => removeFromCart(it.id)} className="text-xs text-red-500 mt-1">Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-4 rounded-xl mb-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">Total</div>
                <div className="text-xl font-black">UGX {cartTotal.toLocaleString()}</div>
              </div>
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
                onClick={async () => {
                  // pay cart
                  if (cart.length === 0) return alert('Cart is empty');
                  setLoading(true);
                  try {
                    const payload = {
                      items: cart.map((c) => ({ serviceId: c.id, serviceName: c.name, amount: c.unitAmount, quantity: c.quantity })),
                      amount: cartTotal,
                      phone,
                    };
                    const { data } = await api.post('/pay', payload);
                    alert(`Payment initiated: ${data.receiptId ?? 'unknown'}`);
                    setCart([]);
                    setCartOpen(false);
                  } catch (err: any) {
                    console.error('Cart pay failed:', err);
                    alert(err.message || 'Payment failed');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full py-4 bg-[#e0d5d8] text-gray-800 rounded-xl font-bold hover:bg-gray-500 disabled:opacity-50 transition-all"
              >
                {loading ? 'Processing...' : 'Pay Now'}
              </button>
              <button
                onClick={async () => {
                  if (cart.length === 0) return alert('Cart is empty');
                  setLoading(true);
                  try {
                    const payload = {
                      items: cart.map((c) => ({ serviceId: c.id, serviceName: c.name, amount: c.unitAmount, quantity: c.quantity })),
                      amount: cartTotal,
                    };
                    const { data } = await api.post('/invoice', payload);
                    alert(`Invoice created: ${data.invoiceId ?? 'unknown'}`);
                    setCart([]);
                    setCartOpen(false);
                  } catch (err: any) {
                    console.error('Cart invoice failed:', err);
                    alert(err.message || 'Failed to create invoice');
                  } finally {
                    setLoading(false);
                  }
                }}
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