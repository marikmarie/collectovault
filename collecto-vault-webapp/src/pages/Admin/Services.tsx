import { useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import { DollarSign } from "lucide-react";
import api from "../../api";
import { customerService } from "../../api/customer";

type Service = {
  id: string;
  name: string;
  amount: number; // Mapped from 'price' in API
  photo: string;
  description: string;
};

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [photosBaseUrl, setPhotosBaseUrl] = useState<string>("");
  const [selected, setSelected] = useState<Service | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  // async function fetchServices() {
  //   setLoading(true);
  //   try {
  //     // Using a hardcoded ID or getting from localStorage as per your previous logic
  //     const collectoId = localStorage.getItem("collectoId") || "141122";

  //     //const response = await api.post("/services", { collectoId });
  //     const response = await customerService.getServices(collectoId);

  //     // Navigate the nested structure: response.data.data.records
  //     const apiData = response.data?.data;
  //     const records = apiData?.records || [];
  //     const baseUrl = apiData?.metadata?.photosUrl || "";

  //     const mappedServices = records.map((item: any) => ({
  //       id: item.id,
  //       name: item.name,
  //       amount: item.price,
  //       photo: item.photo,
  //       description: item.description,
  //     }));

  //     setPhotosBaseUrl(baseUrl);
  //     setServices(mappedServices);
  //   } catch (err: any) {
  //     console.error("Failed to fetch services:", err);
  //     setServices([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // }
async function fetchServices() {
  setLoading(true);
  try {
    const collectoId = localStorage.getItem("collectoId") || "141122";
    const response = await customerService.getServices(collectoId);

    // --- THE CHANGE IS HERE ---
    // Based on your DevTools: response.data (Axios) -> .data (API Root) -> .data (Payload)
    const payload = response.data?.data; 
    const innerData = payload?.data; 
    const records = innerData?.records || [];
    const baseUrl = innerData?.metadata?.photosUrl || "";
    // --------------------------

    const mappedServices = records.map((item: any) => ({
      id: item.id,
      name: item.name,
      amount: item.price,
      photo: item.photo,
      description: item.description,
    }));

    setPhotosBaseUrl(baseUrl);
    setServices(mappedServices);
  } catch (err: any) {
    console.error("Failed to fetch services:", err);
    setServices([]);
  } finally {
    setLoading(false);
  }
}
  async function payLater() {
    if (!selected) return;
    setLoading(true);
    try {
      const { data } = await api.post("/invoice", {
        serviceId: selected.id,
        serviceName: selected.name,
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
      const { data } = await api.post("/pay", {
        serviceId: selected.id,
        serviceName: selected.name,
        amount: selected.amount,
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

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 flex gap-2 items-center text-gray-800">
          <DollarSign className="text-[#d81b60]" />
          Available Services
        </h1>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d81b60]"></div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {services.map((s) => (
            <div
              key={s.id}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                {/* Service Image */}
                <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  {s.photo ? (
                    <img
                      src={`${photosBaseUrl}${s.photo}`}
                      alt={s.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                      No Img
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900">{s.name}</h2>
                  <p className="text-xs text-gray-500 line-clamp-1 mb-1">
                    {s.description}
                  </p>
                  <p className="text-sm font-bold text-[#d81b60]">
                    UGX {s.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelected(s)}
                className="px-5 py-2 rounded-full bg-(--btn-bg) text-(--btn-text) text-sm font-medium hover:(--btn-hover-bg) transition-colors"
              >
                Purchase
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Purchase Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-xl text-gray-800">
                {selected.name}
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="text-lg font-semibold text-[#d81b60] mb-4">
              UGX {selected.amount.toLocaleString()}
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Money Number
            </label>
            <input
              placeholder="e.g. 256770000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-lg mb-6 focus:ring-2 focus:ring-[#0b4b78] focus:border-transparent outline-none"
            />

            <div className="flex flex-col gap-3">
              <button
                onClick={payNow}
                disabled={loading}
                className="w-full py-3 bg-[#0b4b78] text-white rounded-lg font-bold hover:bg-[#083a5e] disabled:opacity-50 transition-all"
              >
                {loading ? "Processing..." : "Pay Now"}
              </button>
              <button
                onClick={payLater}
                disabled={loading}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
              >
                Generate Invoice (Pay Later)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
