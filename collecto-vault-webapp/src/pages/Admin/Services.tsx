import TopNav from "../../components/TopNav";
import { DollarSign, Star, AirVent, Hotel } from "lucide-react";

const mockServices = [
  { 
    name: "Luxury Hotel Stay", 
    description: "Redeem points for a night at select 5-star hotels.", 
    type: "Redeem", 
    cost: "25,000 pts", 
    ugxEquivalent: "UGX 250,000",
    icon: Hotel 
  },
  { 
    name: "International Flight Upgrade", 
    description: "Use points for an economy to business class upgrade.", 
    type: "Redeem", 
    cost: "15,000 pts", 
    ugxEquivalent: "UGX 150,000",
    icon: AirVent
  },
  { 
    name: "Earn from Online Shopping", 
    description: "Get 1 point for every UGX 100 spent at partner retailers.", 
    type: "Earn", 
    cost: "1 pt / UGX 100", 
    ugxEquivalent: null,
    icon: DollarSign 
  },
  { 
    name: "Tier Bonus - Blue Tier", 
    description: "Receive 10% bonus points on all qualifying earns.", 
    type: "Benefit", 
    cost: "10% Bonus", 
    ugxEquivalent: null,
    icon: Star
  },
];

export default function Services() {
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <TopNav />
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
           <DollarSign className="w-8 h-8 text-[#d81b60]" />
           Available Services & Rewards
        </h1>

        <div className="space-y-6">
          {mockServices.map((service, index) => {
            const Icon = service.icon;
            const isRedeem = service.type === "Redeem";
            return (
              <div 
                key={index} 
                className="bg-white p-6 rounded-xl shadow-lg flex items-start gap-4 transition-transform hover:shadow-xl"
              >
                <div className={`p-3 rounded-full ${isRedeem ? 'bg-red-50' : 'bg-green-50'}`}>
                  <Icon className={`w-6 h-6 ${isRedeem ? 'text-red-600' : 'text-green-600'}`} />
                </div>
                
                <div className="grow">
                  <h2 className="text-xl font-semibold text-gray-800">{service.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                </div>
                
                <div className="text-right min-w-[120px]">
                  <p className={`font-bold ${isRedeem ? 'text-red-600' : 'text-green-600'}`}>
                    {service.cost}
                  </p>
                  {service.ugxEquivalent && (
                    <p className="text-xs text-gray-400 mt-1">Value: {service.ugxEquivalent}</p>
                  )}
                  <button className="mt-2 text-xs font-medium text-[#0b4b78] hover:text-[#d81b60] transition-colors">
                    {isRedeem ? 'Redeem Now' : 'Learn How'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}