// Tiers.tsx
import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Trash2, Edit, X, Loader2 } from 'lucide-react';
import { collectovault } from '../../api/collectovault';

// --- Type Definitions ---
interface Tier {
  id: number;
  name: string;
  threshold: number;
  multiplier: number;
  color?: string;
  tailwindColorClass?: string;
}

// --- Main Component ---
const Tiers: React.FC = () => {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const vendorId = localStorage.getItem('collectoId') || '141122';

  useEffect(() => {
    fetchTiers();
  }, []);

  // --- API Actions ---

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const res = await collectovault.getTierRules(vendorId);
      // Adjusting based on common API response structures
      const data = res.data?.data || res.data || [];
      
      const mappedTiers: Tier[] = data.map((tier: any) => ({
        id: tier.id,
        name: tier.name || tier.tier_name,
        threshold: tier.threshold || tier.min_points || 0,
        multiplier: tier.multiplier || tier.earn_multiplier || 1.0,
        tailwindColorClass: 'bg-orange-50 text-orange-600 border-orange-100', // Default style
      }));
      
      setTiers(mappedTiers);
    } catch (err) {
      showMessage('error', 'Failed to fetch tier hierarchy');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTier = async (formData: Omit<Tier, 'id' | 'tailwindColorClass'>) => {
    setLoading(true);
    try {
      // Both Create and Update use saveTierRule based on your API file
      const payload = editingTier 
        ? { ...formData, id: editingTier.id } // Include ID for updates
        : formData;

      await collectovault.saveTierRule(vendorId, payload);
      
      showMessage('success', `Tier ${editingTier ? 'updated' : 'created'} successfully`);
      setIsModalOpen(false);
      fetchTiers(); // Refresh list from source of truth
    } catch (err) {
      showMessage('error', 'Could not save tier changes');
    } finally {
      setLoading(false);
    }
  };

  const deleteTier = async (ruleId: number) => {
    setLoading(true);
    try {
      // Using the specific delete method from your API file
      await collectovault.deleteTierRules(vendorId, ruleId);
      
      setTiers(prev => prev.filter(t => t.id !== ruleId));
      showMessage('success', 'Tier removed successfully');
    } catch (err) {
      showMessage('error', 'Failed to delete tier');
    } finally {
      setLoading(false);
    }
  };

  // --- Helpers ---

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Toast Notification */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-xl text-white animate-in slide-in-from-right-5 ${
          message.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">Tiers & Loyalty</h2>
          <p className="text-gray-500 mt-1">Define how customers level up based on points.</p>
        </div>
        <button
          onClick={() => { setEditingTier(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-all shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" /> Add Tier
        </button>
      </div>

      <hr className="border-gray-100" />

      {loading && tiers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p>Syncing vault data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <TierCard 
              key={tier.id} 
              tier={tier} 
              onEdit={(t) => { setEditingTier(t); setIsModalOpen(true); }} 
              onRemove={deleteTier} 
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <TierModal
          initialData={editingTier}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveTier}
          isSubmitting={loading}
        />
      )}
    </div>
  );
};

// --- Sub-Components ---

const TierCard: React.FC<{ tier: Tier; onEdit: (t: Tier) => void; onRemove: (id: number) => void }> = ({ tier, onEdit, onRemove }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-xl transition-all group relative">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tier.tailwindColorClass}`}>
        <Trophy className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-800 text-lg">{tier.name}</h4>
        <p className="text-sm text-gray-500">{tier.threshold.toLocaleString()} Points Required</p>
      </div>
    </div>
    
    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
      <span className="text-sm font-medium text-gray-600">Multiplier: <b className="text-orange-600">{tier.multiplier}x</b></span>
      <div className="flex gap-1">
        <button onClick={() => onEdit(tier)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
          <Edit className="w-4 h-4" />
        </button>
        <button onClick={() => onRemove(tier.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);

const TierModal: React.FC<{ initialData: Tier | null; onClose: () => void; onSave: (data: any) => void; isSubmitting: boolean }> = ({ initialData, onClose, onSave, isSubmitting }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    threshold: initialData?.threshold || 0,
    multiplier: initialData?.multiplier || 1.0
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{initialData ? 'Update Tier' : 'New Tier'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tier Name</label>
            <input 
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500" 
              placeholder="e.g. Gold"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min. Points</label>
              <input 
                type="number"
                value={formData.threshold}
                onChange={e => setFormData({...formData, threshold: Number(e.target.value)})}
                className="w-full border-gray-300 rounded-lg shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Multiplier</label>
              <input 
                type="number"
                step="0.1"
                value={formData.multiplier}
                onChange={e => setFormData({...formData, multiplier: Number(e.target.value)})}
                className="w-full border-gray-300 rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
          <button 
            disabled={isSubmitting}
            onClick={() => onSave(formData)}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Tier'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tiers;