import React, { useState } from 'react';
import { Coins, Plus, Edit, Trash2, X, Check } from 'lucide-react';

interface Package {
    id: number;
    name: string;
    points: number;
    price: number;
    popular: boolean;
}

// --- Package Card Component ---

interface PackageCardProps {
    pkg: Package;
    onEdit: (pkg: Package) => void;
    onRemove: (id: number) => void;
}

const PackageCard: React.FC<PackageCardProps> = ({ pkg, onEdit, onRemove }) => {
    return (
        <div className="relative bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between min-h-[220px]">
            {pkg.popular && (
                <span className="absolute -top-3 left-6 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full shadow-sm">
                    Most Popular
                </span>
            )}
            
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-gray-50 rounded-xl text-gray-600 border border-gray-100">
                        <Coins className="w-6 h-6" />
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => onEdit(pkg)}
                            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => onRemove(pkg.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                
                <h4 className="text-lg font-bold text-gray-900">{pkg.name}</h4>
                <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-gray-900">
                        {pkg.points.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 font-medium">Points</span>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-600">
                    UGX {pkg.price.toLocaleString()}
                </span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                    Managed Bundle
                </span>
            </div>
        </div>
    );
};

// --- Main Component ---

const PointPackages: React.FC = () => {
    const [packages, setPackages] = useState<Package[]>([]); // Initialize empty for API logic
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<Package | null>(null);

    const handleCreateOrEdit = (pkg?: Package) => {
        setEditingPackage(pkg || null);
        setIsModalOpen(true);
    };

    const handleRemovePackage = (id: number) => {
        if (window.confirm('Remove this package?')) {
            setPackages(prev => prev.filter(p => p.id !== id));
        }
    };

    const handleSavePackage = (pkgData: Omit<Package, 'id'>) => {
        if (editingPackage) {
            setPackages(prev => prev.map(p => p.id === editingPackage.id ? { ...p, ...pkgData } : p));
        } else {
            const newPackage: Package = { id: Date.now(), ...pkgData };
            setPackages(prev => [...prev, newPackage]);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Point Packages</h2>
                    <p className="text-sm text-gray-500 mt-1">Configure bundles for customer purchase.</p>
                </div>
                {/* <button

                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:btn-hover-bg transition-all shadow-sm"
                    onClick={() => handleCreateOrEdit()}
                >
                    <Plus className="w-4 h-4" /> New Package
                </button> */}

                <button
  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-(--btn-text) bg-(--btn-bg) border border-(--btn-border) rounded-xl hover:bg-(--btn-hover-bg) transition-all shadow-sm"
  onClick={() => handleCreateOrEdit()}
>
  <Plus className="w-4 h-4" /> New Package
</button>
                
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                    <PackageCard key={pkg.id} pkg={pkg} onEdit={handleCreateOrEdit} onRemove={handleRemovePackage} />
                ))}
                
                <button 
                    onClick={() => handleCreateOrEdit()}
                    className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-gray-400 hover:bg-gray-50 transition-all group min-h-[220px]"
                >
                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform mb-3">
                        <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">Add Package</span>
                </button>
            </div>

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

// --- REDESIGNED MODAL COMPONENT ---

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

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop with blur */}
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            {/* Modal Body */}
            <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {initialData ? 'Edit Package' : 'New Bundle'}
                            </h3>
                            <p className="text-sm text-gray-500">Define your customer rewards package.</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Input Group */}
                        <div className="grid grid-cols-1 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Package Title</label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    placeholder="e.g., Platinum Savings"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:bg-white outline-none transition-all text-gray-900 font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Points</label>
                                    <input 
                                        type="number" 
                                        value={points} 
                                        onChange={e => setPoints(Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:bg-white outline-none transition-all text-gray-900 font-medium"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Price (UGX)</label>
                                    <input 
                                        type="number" 
                                        value={price} 
                                        onChange={e => setPrice(Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:bg-white outline-none transition-all text-gray-900 font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Custom Toggle for Popularity */}
                        <button 
                            type="button"
                            onClick={() => setPopular(!popular)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                popular ? 'bg-(--btn-hover-bg) border-(--btn-border)' : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex flex-col items-start">
                                <span className={`text-sm font-bold ${popular ? 'text-white' : 'text-(--btn-text)'}`}>Highlight as Popular</span>
                                <span className={`text-xs ${popular ? 'text-gray-400' : 'text-gray-500'}`}>Badges this package for users</span>
                            </div>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                                popular ? 'bg-white border-white text-gray-900' : 'bg-gray-50 border-gray-200'
                            }`}>
                                {popular && <Check className="w-4 h-4" />}
                            </div>
                        </button>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        Discard
                    </button>
                    {/* //text-(--btn-text) */}
                    <button 
                        onClick={() => onSave({ name, points, price, popular })}
                        className="px-8 py-2.5 bg-(--btn-bg) text-(--btn-text) text-sm font-bold rounded-xl hover:bg-(--btn-hover-bg) transition-all shadow-md active:scale-95"
                    >
                        {initialData ? 'Save Changes' : 'Add Package'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PointPackages;