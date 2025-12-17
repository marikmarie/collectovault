import { useState } from "react";
import EarnPoints from "./EarnPoints"; // NEW Component

const SERVICES = [
  // Assumes UGX (Ugandan Shillings) based on context
  { id: "s1", title: "Dinner", desc: "Earn 1 point per UGX 1,000 spent on Dinner", pointsPerUGX: 1000, category: "Food" },
  { id: "s2", title: "Hotel Stay", desc: "Earn 1 point per UGX 1,500 spent on hotels", pointsPerUGX: 1500, category: "Travel" },
  { id: "s3", title: "Car Rental", desc: "Earn 1 point per UGX 1,000 spent on rentals", pointsPerUGX: 1000, category: "Travel" },
];

// Define the Service type for strong typing
type Service = typeof SERVICES[0];

export default function ServicesList() {
  // State to hold the service object currently selected for viewing
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const handleViewDetails = (service: Service) => {
    setSelectedService(service);
  };
  
  const handleCloseModal = () => {
    setSelectedService(null);
  };

  return (
    <>
      <div className="space-y-3 px-4 pb-6">
        {SERVICES.map(s => (
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
        ))}
      </div>

      {selectedService && (
        <EarnPoints
          open={!!selectedService}
          onClose={handleCloseModal}
          service={selectedService}
        />
      )}
    </>
  );
}