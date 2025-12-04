
const SERVICES = [
  { id: "s1", title: "Dinner", desc: "Earn 1 point per 1000 on Dinner", img: "/images/service-flight.jpg" },
  { id: "s2", title: "Hotel Stay", desc: "Earn 1 point per 1500 on hotels", img: "/images/service-hotel.jpg" },
  { id: "s3", title: "Car Rental", desc: "Earn 1 point per 1000 on rentals", img: "/images/service-car.jpg" },
];

export default function ServicesList() {
  return (
    <div className="space-y-3 px-4 pb-6">
      {SERVICES.map(s => (
        <div key={s.id} className="card-like overflow-hidden flex items-center">
          <img src={s.img} alt={s.title} className="w-28 h-20 object-cover" />
          <div className="p-3 flex-1">
            <div className="font-semibold">{s.title}</div>
            <div className="text-sm text-gray-600 mt-1">{s.desc}</div>
          </div>
          <div className="p-3">
            <button className="text-sm px-3 py-2 rounded-md bg-[#d81b60] text-white">View</button>
          </div>
        </div>
      ))}
    </div>
  );
}
