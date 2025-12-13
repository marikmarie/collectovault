import { useState } from 'react';
import { Coins, Plus, Edit } from 'lucide-react';

interface Package {
  id: number;
  name: string;
  points: number;
  price: string;
  popular: boolean;
}

export default function Packages() {
  const [packages, setPackages] = useState<Package[]>([
    { id: 1, name: 'Small Bundle', points: 1000, price: '10,000', popular: false },
    { id: 2, name: 'Best Value', points: 5500, price: '50,000', popular: true },
    { id: 3, name: 'Mega Pack', points: 12000, price: '100,000', popular: false },
  ]);

  const handlePriceChange = (id: number, newPrice: string) => {
    setPackages(prevPackages => prevPackages.map(pkg => 
        pkg.id === id ? { ...pkg, price: newPrice } : pkg
    ));
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Coins className="w-7 h-7 text-blue-600" /> Point Packages ({packages.length})
        </h1>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> Create New Package
        </button>
      </div>
      <p className="text-gray-500 max-w-3xl">Manage point packages available for direct purchase by users.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.id} className="relative bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow group">
            {pkg.popular && (
              <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wide py-1 px-3 rounded-bl-xl rounded-tr-xl">
                Popular
              </span>
            )}
            
            <div className="flex justify-between items-center mb-4">
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                <Coins className="w-6 h-6" />
              </div>
              <button className="text-gray-400 hover:text-blue-600">
                <Edit className="w-4 h-4" />
              </button>
            </div>
            
            <h4 className="text-lg font-bold text-gray-900">{pkg.name}</h4>
            
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">{pkg.points.toLocaleString()}</span>
              <span className="text-sm text-gray-500 font-medium">Points</span>
            </div>
            
            <div className="text-sm text-gray-500 mt-4 flex items-center gap-1">
                Cost: UGX 
                <input
                    type="text"
                    value={pkg.price}
                    onChange={(e) => handlePriceChange(pkg.id, e.target.value)}
                    className="w-24 text-sm font-semibold border-gray-200 rounded-md p-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            <p className="text-xs text-gray-400 mt-2">124 sold last month</p>
          </div>
        ))}
        {/* Add New Card Placeholder */}
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer min-h-[220px]">
            <Plus className="w-6 h-6 text-gray-400 mb-2" />
            <h4 className="text-sm font-semibold text-gray-900">Add New Package</h4>
        </div>
      </div>
    </div>
  );
}