import React, { useState } from 'react';
import { Trophy, Plus, Trash2, Edit, X } from 'lucide-react';

// --- Type Definitions ---
interface Tier {
  id: number;
  name: string;
  threshold: number;
  multiplier: number;
  color: string;
  tailwindColorClass: string;
}

// --- Mock Data ---
const initialTiers: Tier[] = [
  {
    id: 1,
    name: 'Standard',
    threshold: 0,
    multiplier: 1.0,
    color: '#880666', // From the user's gradient
    tailwindColorClass: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    id: 2,
    name: 'Silver',
    threshold: 500,
    multiplier: 1.2,
    color: '#cb0d6c', // From the user's gradient
    tailwindColorClass: 'bg-pink-100 text-pink-800 border-pink-200',
  },
  {
    id: 3,
    name: 'Gold',
    threshold: 2000,
    multiplier: 1.5,
    color: '#ef4155', // From the user's gradient (Red)
    tailwindColorClass: 'bg-red-100 text-red-800 border-red-200',
  },
];

// --- Sub-components ---

interface TierCardProps {
    tier: Tier;
    onEdit: (tier: Tier) => void;
    onRemove: (id: number) => void;
}

const TierCard: React.FC<TierCardProps> = ({ tier, onEdit, onRemove }) => (
    <div className="group relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-red-400 hover:shadow-lg transition-all">
        <div className="flex gap-6 items-start">
            
            {/* Badge Preview */}
            <div className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center text-xl font-bold border-2 ${tier.tailwindColorClass}`}>
                <Trophy className="w-6 h-6" />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-3">
                <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Entry Threshold</p>
                        <p className="font-semibold text-gray-700">{tier.threshold.toLocaleString()} Pts</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Earning Multiplier</p>
                        <p className="font-semibold text-red-600">{tier.multiplier.toFixed(1)}x</p>
                    </div>
                </div>
            </div>

            {/* Actions (Hidden until hover/focus) */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4">
                <button 
                    onClick={() => onEdit(tier)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Edit Tier"
                >
                    <Edit className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => onRemove(tier.id)}
                    className="p-2 text-gray-400 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                    title="Remove Tier"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    </div>
);


// --- Main Component ---

const TierLevels: React.FC = () => {
  const [tiers, setTiers] = useState<Tier[]>(initialTiers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);

  const handleCreateOrEdit = (tier?: Tier) => {
    setEditingTier(tier || null);
    setIsModalOpen(true);
  };

  const handleRemoveTier = (id: number) => {
    if (window.confirm('Are you sure you want to remove this tier?')) {
      setTiers((prevTiers) => prevTiers.filter((tier) => tier.id !== id));
    }
  };

  const handleSaveTier = (tierData: Omit<Tier, 'id' | 'color' | 'tailwindColorClass'>) => {
    // Placeholder logic for saving
    if (editingTier) {
        // Edit existing
        setTiers(prevTiers => prevTiers.map(t => t.id === editingTier.id ? {...t, ...tierData} as Tier : t));
    } else {
        // Create new
        const newTier: Tier = {
            id: Date.now(),
            ...tierData,
            color: '#000000', // Mock placeholder
            tailwindColorClass: 'bg-gray-100 text-gray-800 border-gray-200' // Mock placeholder
        };
        setTiers(prevTiers => [...prevTiers, newTier]);
    }
    setIsModalOpen(false);
    setEditingTier(null);
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Tier Hierarchy ({tiers.length} Tiers)</h2>
        <button
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 shadow-lg transition-colors"
          onClick={() => handleCreateOrEdit()}
        >
          <Plus className="w-4 h-4" /> Create New Tier
        </button>
      </div>

      <p className="text-gray-500">
        Customers automatically progress to higher tiers based on their lifetime points.
      </p>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tiers.map((tier) => (
          <TierCard key={tier.id} tier={tier} onEdit={handleCreateOrEdit} onRemove={handleRemoveTier} />
        ))}
      </div>

      {/* Modal Placeholder for Create/Edit */}
      {isModalOpen && (
        <TierModal
            initialData={editingTier}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveTier}
        />
      )}
    </div>
  );
};

export default TierLevels;


// --- Modal Component (Placeholder for structure) ---

interface TierModalProps {
    initialData: Tier | null;
    onClose: () => void;
    onSave: (tierData: Omit<Tier, 'id' | 'color' | 'tailwindColorClass'>) => void;
}

const TierModal: React.FC<TierModalProps> = ({ initialData, onClose, onSave }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [threshold, setThreshold] = useState(initialData?.threshold || 0);
    const [multiplier, setMultiplier] = useState(initialData?.multiplier || 1.0);
    
    // Simple mock save function
    const handleSubmit = () => {
        onSave({ name, threshold, multiplier });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                        {initialData ? 'Edit Tier' : 'Create New Tier'}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tier Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Entry Threshold (Points)</label>
                        <input type="number" value={threshold} onChange={e => setThreshold(parseInt(e.target.value) || 0)} className="w-full border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Earning Multiplier</label>
                        <input type="number" step="0.1" value={multiplier} onChange={e => setMultiplier(parseFloat(e.target.value) || 1.0)} className="w-full border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" />
                    </div>
                    
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
                        {initialData ? 'Update Tier' : 'Create Tier'}
                    </button>
                </div>
            </div>
        </div>
    );
};