import { useState, useEffect } from "react";
import EarnPoints from "./EarnPoints"; // NEW Component
import { customerService } from "../api/customer";

// Service type returned by the backend
interface Service {
  id: string;
  title?: string;
  desc?: string;
  pointsPerUGX?: number;
  category?: string;
}

export default function ServicesList() {
  // Fetched services state
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // State to hold the service object currently selected for viewing
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
        if (!collectoId) {
          console.warn("Collecto ID not found");
          setServices([]);
          return;
        }
        const res = await customerService.getServices(collectoId);
        const data = res.data?.services ?? res.data ?? [];
        setServices(Array.isArray(data) ? data : []);
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
              <div className="flex-1">
                <div className="font-semibold text-gray-800">{s.title}</div>
                <div className="text-sm text-gray-600 mt-1">{s.desc}</div>
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
            title: selectedService.title ?? "",
            desc: selectedService.desc ?? "",
            pointsPerUGX: selectedService.pointsPerUGX ?? 1000,
            category: selectedService.category ?? "General",
          }}
        />
      )}
    </>
  );
}