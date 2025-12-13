import React, { useState } from 'react';
import { Coins, Plus, Edit, Trash2, X } from 'lucide-react';

// --- Type Definitions ---
interface Package {
  id: number;
  name: string;
  points: number;
  price: number; // Use number for logic, format for display
  popular: boolean;
}

// --- Mock Data ---
const initialPackages: Package[] = [
  { id: 1, name: 'Starter Boost', points: 1000, price: 10000, popular: false },
  { id: 2, name: 'Pro Value', points: 5500, price: 50000, popular: true },
  { id: 3, name: 'Ultimate Saver', points: 12000, price: 100000, popular: false },
];

// --- Sub-components ---

interface PackageCardProps {
    pkg: Package;
    onEdit: (pkg: Package) => void;
    onRemove: (id: number) => void;
}

const PackageCard: React.FC<PackageCardProps> = ({ pkg, onEdit, onRemove }) => {
    const formattedPrice = `UGX ${pkg.price.toLocaleString()}`;

    return (
        <div className="relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow group">
            {pkg.popular && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wide py-1 px-3 rounded-bl-xl rounded-tr-xl">
                    Popular
                </span>
            )}
            
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                    <Coins className="w-6 h-6" />
                </div>
                
                {/* Actions Menu */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => onEdit(pkg)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Edit Package"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => onRemove(pkg.id)}
                        className="p-1 text-gray-400 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                        title="Remove Package"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            <h4 className="text-xl font-bold text-gray-900">{pkg.name}</h4>
            <div className="mt-2 mb-4">
                <span className="text-4xl font-extrabold text-red-600">
                    {pkg.points.toLocaleString()}
                </span>
                <span className="text-base text-gray-500 font-medium ml-2">Points</span>
            </div>
            <p className="text-sm font-medium text-gray-700">Cost: {formattedPrice}</p>
            <p className="text-xs text-gray-400 mt-2">124 sold this month</p>
        </div>
    );
};

// --- Main Component ---

const PointPackages: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>(initialPackages);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  const handleCreateOrEdit = (pkg?: Package) => {
    setEditingPackage(pkg || null);
    setIsModalOpen(true);
  };

  const handleRemovePackage = (id: number) => {
    if (window.confirm('Are you sure you want to remove this package?')) {
      setPackages((prevPackages) => prevPackages.filter((pkg) => pkg.id !== id));
    }
  };

  const handleSavePackage = (pkgData: Omit<Package, 'id'>) => {
    // Placeholder logic for saving
    if (editingPackage) {
        // Edit existing
        setPackages(prevPackages => prevPackages.map(p => p.id === editingPackage.id ? {...p, ...pkgData} : p));
    } else {
        // Create new
        const newPackage: Package = {
            id: Date.now(),
            ...pkgData,
        };
        setPackages(prevPackages => [...prevPackages, newPackage]);
    }
    setIsModalOpen(false);
    setEditingPackage(null);
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Point Packages ({packages.length})</h2>
        <button
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-lg transition-colors"
          onClick={() => handleCreateOrEdit()}
        >
          <Plus className="w-4 h-4" /> Create New Package
        </button>
        
      </div>
      
      <p className="text-gray-500">
        Manage the point bundles customers can purchase directly.
      </p>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} onEdit={handleCreateOrEdit} onRemove={handleRemovePackage} />
        ))}
        
        {/* Add New Card Placeholder */}
        <div 
            onClick={() => handleCreateOrEdit()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-red-400 hover:bg-red-50/50 transition-all cursor-pointer min-h-48"
        >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-3">
                <Plus className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900">Add New Package</h4>
            <p className="text-xs text-gray-500 mt-1">Define the points and price.</p>
        </div>
      </div>
      
      {/* Modal Placeholder for Create/Edit */}
      {isModalOpen && (
        <PackageModal
            initialData={editingPackage}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSavePackage}
        />
      )}
    </div>
  );
};

export default PointPackages;

// --- Modal Component (Updated) ---

interface PackageModalProps {
    initialData: Package | null;
    onClose: () => void;
    onSave: (pkgData: Omit<Package, 'id'>) => void;
}

const PackageModal: React.FC<PackageModalProps> = ({ initialData, onClose, onSave }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [points, setPoints] = useState(initialData?.points || 0);
    const [price, setPrice] = useState(initialData?.price || 0);
    const [popular, setPopular] = useState(initialData?.popular || false);

    // Simple mock save function
    const handleSubmit = () => {
        onSave({ name, points, price, popular });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                        {initialData ? 'Edit Package' : 'Create New Package'}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            placeholder="e.g., Bronze Bundle" // Added Placeholder
                            // Updated border for visibility
                            className="w-full border-gray-400 rounded-lg focus:ring-red-500 focus:border-red-500" 
                            autoComplete="off" // changed from `autocomplete` to `autoComplete`
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Points Amount</label>
                        <input 
                            type="number" 
                            value={points} 
                            onChange={e => setPoints(parseInt(e.target.value) || 0)} 
                            placeholder="e.g., 5000" // Added Placeholder
                            // Updated border for visibility
                            className="w-full border-gray-400 rounded-lg focus:ring-red-500 focus:border-red-500" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (UGX)</label>
                        <input 
                            type="number" 
                            value={price} 
                            onChange={e => setPrice(parseInt(e.target.value) || 0)} 
                            placeholder="e.g., 50000" // Added Placeholder
                            // Updated border for visibility
                            className="w-full border-gray-400 rounded-lg focus:ring-red-500 focus:border-red-500" 
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={popular} onChange={e => setPopular(e.target.checked)} className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                        <label className="text-sm font-medium text-gray-700">Mark as Popular</label>
                    </div>
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
                        {initialData ? 'Update Package' : 'Create Package'}
                    </button>
                </div>
            </div>
        </div>
    );
};