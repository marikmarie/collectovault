const SERVICES = [
  // Removed 'img' property from data
  { id: "s1", title: "Dinner", desc: "Earn 1 point per 1000 on Dinner" },
  { id: "s2", title: "Hotel Stay", desc: "Earn 1 point per 1500 on hotels" },
  { id: "s3", title: "Car Rental", desc: "Earn 1 point per 1000 on rentals" },
];

export default function ServicesList() {
  return (
    <div className="space-y-3 px-4 pb-6">
      {SERVICES.map(s => (
        <div 
          key={s.id} 
          // Updated class to be a full-width card-like item without space for an image
          className="card-like overflow-hidden flex items-center bg-white rounded-lg shadow-sm border border-gray-100 p-3"
        >
          {/* Removed <img> tag entirely */}
          <div className="flex-1">
            <div className="font-semibold text-gray-800">{s.title}</div>
            <div className="text-sm text-gray-600 mt-1">{s.desc}</div>
          </div>
          <div className="p-1 shrink-0">
            <button className="text-sm px-4 py-2 rounded-full bg-[#d81b60] hover:bg-[#b81752] text-white font-medium transition-colors">
              View
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}