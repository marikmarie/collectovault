import { useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import { DollarSign} from "lucide-react";
import api from "../../api"; 

type Service = {
  id: string;
  name: string;
  amount: number;
};

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<Service | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  // ✅ Safe way (handles nested objects or unexpected non-array responses)
async function fetchServices() {
  setLoading(true);
  try {
    const response = await api.get("/services");
    
    // Check if response.data is the array, or if it's inside response.data.services
    const actualData = Array.isArray(response.data) 
      ? response.data 
      : response.data.services || [];

    setServices(actualData);
  } catch (err: any) {
    console.error("Failed to fetch services:", err);
    setServices([]); // Reset to empty array on error to prevent .map crash
  } finally {
    setLoading(false);
  }
}
  // async function fetchServices() {
  //   setLoading(true);
  //   try {
  //     const { data } = await api.get("/api/services");
  //     setServices(data);
  //   } catch (err: any) {
  //     console.error("Failed to fetch services:", err);
  //     alert(err.message || "Failed to fetch services");
  //   } finally {
  //     setLoading(false);
  //   }
  // }

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
    <div className="min-h-screen bg-gray-100">
      <TopNav />

      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 flex gap-2 items-center">
          <DollarSign className="text-[#d81b60]" />
          Available Services
        </h1>

        {loading && <p className="text-sm text-gray-500">Loading services...</p>}

        <div className="space-y-4">
          {services.map((s) => (
            <div
              key={s.id}
              className="bg-white p-5 rounded-xl shadow flex justify-between"
            >
              <div>
                <h2 className="font-semibold">{s.name}</h2>
                <p className="text-sm text-gray-500">
                  UGX {s.amount.toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => setSelected(s)}
                className="text-sm text-[#0b4b78] hover:text-[#d81b60]"
              >
                Purchase
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Purchase Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="font-semibold text-lg">{selected.name}</h3>
            <p className="text-sm text-gray-500 mb-4">
              UGX {selected.amount.toLocaleString()}
            </p>

            <input
              placeholder="Phone (2567...)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border p-2 rounded mb-3"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={payLater}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 rounded"
              >
                Pay Later
              </button>
              <button
                onClick={payNow}
                disabled={loading}
                className="px-4 py-2 bg-[#0b4b78] text-white rounded"
              >
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
