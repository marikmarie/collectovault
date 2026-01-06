import { useState, useEffect } from "react";
import EarnPoints from "./EarnPoints";
import { customerService } from "../api/customer";

// Updated Service type to match your real API response
interface Service {
  id: string;
  name: string; // Changed from title
  description: string; // Changed from desc
  category: string;
  price: number;
  photo: string;
  is_product: number;
  is_price_fixed: number;
}

export default function ServicesList() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [photosBaseUrl, setPhotosBaseUrl] = useState<string>("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const handleViewDetails = (service: Service) => {
    setSelectedService(service);
  };

  const handleCloseModal = () => {
    setSelectedService(null);
  };

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const collectoId = localStorage.getItem("collectoId") || "141122";
        // Request first page to avoid very large responses from the API
        const res = await customerService.getServices(collectoId, 1, 100);

        // Drilling down into the nested response: res.data.data.records
        const apiData = res.data?.data; 
        const records = apiData?.records || [];
        const baseUrl = apiData?.metadata?.photosUrl || "";

        setPhotosBaseUrl(baseUrl);
        setServices(Array.isArray(records) ? records : []);
      } catch (err) {
        console.warn("Failed to fetch services", err);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <>
      <div className="space-y-3 px-4 pb-6">
        {loading ? (
          <div className="text-center py-6 text-sm text-gray-500">Loading services…</div>
        ) : services.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-500">No services available.</div>
        ) : (
          services.map((s) => (
            <div
              key={s.id}
              className="card-like overflow-hidden flex items-center bg-white rounded-lg shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow"
            >
              {/* Image Preview */}
              <div className="w-16 h-16 rounded-md bg-gray-100 overflow-hidden mr-3 shrink-0">
                {s.photo ? (
                  <img 
                    src={`${photosBaseUrl}${s.photo}`} 
                    alt={s.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Service'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Img</div>
                )}
              </div>

              <div className="flex-1">
                <div className="font-semibold text-gray-800 line-clamp-1">{s.name}</div>
                <div className="text-[11px] font-medium text-[#d81b60] uppercase tracking-wide">{s.category}</div>
                <div className="text-sm text-gray-600 mt-0.5 line-clamp-1">{s.description}</div>
                <div className="text-xs font-bold text-gray-900 mt-1">
                  UGX {s.price.toLocaleString()}
                </div>
              </div>
              
              <div className="p-1 shrink-0">
                <button
                  onClick={() => handleViewDetails(s)}
                  className="text-sm px-4 py-2 rounded-full bg-[#d81b60] hover:bg-[#b81752] text-white font-medium transition-colors active:scale-95"
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedService && (
        <EarnPoints
          open={!!selectedService}
          onClose={handleCloseModal}
          service={{
            id: String(selectedService.id),
            title: selectedService.name,
            desc: selectedService.description,
            // Assuming points calculation or passing price if needed
            pointsPerUGX: 1000, 
            category: selectedService.category,
          }}
        />
      )}
    </>
  );
}