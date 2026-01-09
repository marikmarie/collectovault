import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Trash2, Edit, X } from 'lucide-react';
import { collectovault } from '../../api/collectovault';

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
const initialTiers: Tier[] = [];

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

const Tiers: React.FC = () => {
  const [tiers, setTiers] = useState<Tier[]>(initialTiers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const vendorId = localStorage.getItem('collectoId') || '141122';

  // Fetch tiers on component mount
  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const res = await collectovault.getTierRules(vendorId);
      const data = res.data?.data ?? res.data ?? res;
      const tiersArray = Array.isArray(data) ? data : (data?.tiers ?? data?.items ?? []);
      
      // Map API data to Tier format
      const mappedTiers: Tier[] = tiersArray.map((tier: any, idx: number) => ({
        id: tier.id || idx,
        name: tier.name || tier.tierName || `Tier ${idx + 1}`,
        threshold: tier.threshold || tier.minimumPoints || 0,
        multiplier: tier.multiplier || tier.earnMultiplier || 1.0,
        color: tier.color || '#000000',
        tailwindColorClass: tier.tailwindColorClass || 'bg-gray-100 text-gray-800 border-gray-200',
      }));
      setTiers(mappedTiers);
    } catch (err: any) {
      console.error('Failed to load tiers', err);
      showMessage('error', 'Failed to load tiers');
      setTiers([]);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateOrEdit = (tier?: Tier) => {
    setEditingTier(tier || null);
    setIsModalOpen(true);
  };

  const handleRemoveTier = (id: number) => {
    if (window.confirm('Are you sure you want to remove this tier?')) {
      deleteTier(id);
    }
  };

  const deleteTier = async (id: number) => {
    try {
      // API endpoint for deleting tier (adjust if needed)
      await collectovault.saveTierRule(vendorId, { id, _method: 'DELETE' });
      setTiers((prevTiers) => prevTiers.filter((tier) => tier.id !== id));
      showMessage('success', 'Tier deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete tier', err);
      showMessage('error', 'Failed to delete tier');
    }
  };

  const handleSaveTier = async (tierData: Omit<Tier, 'id' | 'color' | 'tailwindColorClass'>) => {
    try {
      if (editingTier) {
        // Edit existing tier
        const updateData = { id: editingTier.id, ...tierData };
        const res = await collectovault.saveTierRule(vendorId, updateData);
        const updated = res.data?.data ?? res.data ?? res;
        setTiers(prevTiers => prevTiers.map(t => t.id === editingTier.id ? { ...t, ...updated } as Tier : t));
        showMessage('success', 'Tier updated successfully');
      } else {
        // Create new tier
        const res = await collectovault.saveTierRule(vendorId, tierData);
        const created = res.data?.data ?? res.data ?? res;
        const newTier: Tier = {
          id: created.id || Date.now(),
          ...tierData,
          color: created.color || '#000000',
          tailwindColorClass: created.tailwindColorClass || 'bg-gray-100 text-gray-800 border-gray-200'
        };
        setTiers(prevTiers => [...prevTiers, newTier]);
        showMessage('success', 'Tier created successfully');
      }
      setIsModalOpen(false);
      setEditingTier(null);
    } catch (err: any) {
      console.error('Failed to save tier', err);
      showMessage('error', 'Failed to save tier');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      {message && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded shadow max-w-md w-full text-center text-white ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`} role="status" aria-live="polite">
          {message.text}
        </div>
      )}
      
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
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 ${isModalOpen ? 'blur-sm' : ''}`}>
        {loading ? (
          <div className="text-center py-6 text-sm text-gray-500">Loading tiers…</div>
        ) : tiers.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-500">No tiers defined yet.</div>
        ) : (
          tiers.map((tier) => (
            <TierCard key={tier.id} tier={tier} onEdit={handleCreateOrEdit} onRemove={handleRemoveTier} />
          ))
        )}
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

export default Tiers;


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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Semi-transparent backdrop */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-md" onClick={onClose} />
            
            {/* Modal - positioned above backdrop */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-gray-100 animate-in fade-in scale-in duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">
                        {initialData ? 'Edit Tier' : 'Create New Tier'}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Close"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tier Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                          placeholder="e.g., Silver"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Entry Threshold (Points)</label>
                        <input
                          type="number"
                          value={threshold}
                          onChange={e => setThreshold(parseInt(e.target.value) || 0)}
                          className="w-full bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Earning Multiplier</label>
                        <input
                          type="number"
                          step="0.1"
                          value={multiplier}
                          onChange={e => setMultiplier(parseFloat(e.target.value) || 1.0)}
                          className="w-full bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        />
                    </div>
                </div>
                
                <div className="mt-8 flex justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-md"
                    >
                        {initialData ? 'Update Tier' : 'Create Tier'}
                    </button>
                </div>
            </div>
        </div>
    );
};