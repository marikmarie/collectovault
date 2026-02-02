import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Trash2, Edit2, X, Loader2, Target, Zap } from 'lucide-react';
import { collectovault } from '../../api/collectovault';
import { Toast } from '../../components/Toast';

// --- Type Definitions ---
interface Tier {
  id: number;
  name: string;
  threshold: number;
  multiplier: number;
}

const Tiers: React.FC = () => {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const vendorId = localStorage.getItem('collectoId') || '141122';

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const res = await collectovault.getTierRules(vendorId);
      const data = res.data?.data || res.data || [];
      const mappedTiers: Tier[] = data.map((tier: any) => ({
        id: tier.id,
        name: tier.name || tier.tier_name,
        threshold: tier.threshold || tier.min_points || 0,
        multiplier: tier.multiplier || tier.earn_multiplier || 1.0,
      }));
      setTiers(mappedTiers.sort((a, b) => a.threshold - b.threshold));
    } catch (err) {
      showMessage('error', 'Failed to fetch tiers');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTier = async (formData: Omit<Tier, 'id'>) => {
    setLoading(true);
    try {
      // 1. Map frontend field names to backend field names
      const payload = editingTier 
        ? { 
            id: editingTier.id, 
            name: formData.name,
            pointsRequired: formData.threshold,
            earningMultiplier: formData.multiplier,
            collectoId: vendorId 
          } 
        : { 
            name: formData.name,
            pointsRequired: formData.threshold,
            earningMultiplier: formData.multiplier,
            collectoId: vendorId 
          };

      // 2. Execute Request
      const res = await collectovault.saveTierRule(vendorId, payload);

      // 3. THE CHECK: Verify the API response actually reports success
      // We check for res.data?.success (standard for your API) or a 2xx status code
      if (res.data?.success || res.status === 201 || res.status === 200) {
        showMessage('success', `Tier ${editingTier ? 'updated' : 'created'} successfully!`);
        setIsModalOpen(false);
        setEditingTier(null);
        fetchTiers(); // Refresh the list to get latest data from server
      } else {
        // Handle case where API returns 200 but 'success' is false (e.g., validation error)
        const errorMsg = res.data?.message || res.data?.error || 'Validation failed';
        showMessage('error', errorMsg);
      }
    } catch (err: any) {
      // 4. Handle Network or Server errors (400s, 500s)
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Could not connect to server';
      showMessage('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
  const deleteTier = async (ruleId: number) => {
    setLoading(true);
    try {
      await collectovault.deleteTierRules(vendorId, ruleId);
      setTiers(prev => prev.filter(t => t.id !== ruleId));
      showMessage('success', 'Tier removed successfully');
    } catch (err) {
      showMessage('error', 'Failed to delete tier');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 text-zinc-900">
      {/* Toast Notification */}
      {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Tier Hierarchy</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Manage customer progression and point accelerators.</p>
        </div>
        <button
          onClick={() => { setEditingTier(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-all"
        >
          <Plus className="w-4 h-4" /> 
          Add New Tier
        </button>
      </div>

      {loading && tiers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-300">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-zinc-900" />
          <p className="text-xs font-medium uppercase tracking-wider">Loading Configuration...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <TierCard 
              key={tier.id} 
              tier={tier} 
              onEdit={(t) => { setEditingTier(t); setIsModalOpen(true); }} 
              onRemove={deleteTier} 
            />
          ))}
          {tiers.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-100 rounded-2xl">
               <p className="text-zinc-400 text-sm">No tiers configured yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Integration */}
      {isModalOpen && (
        <Modal title={editingTier ? 'Update Tier' : 'New Tier'} onClose={() => setIsModalOpen(false)}>
          <TierForm 
            initial={editingTier} 
            isSubmitting={loading} 
            onSave={handleSaveTier} 
            onCancel={() => setIsModalOpen(false)} 
          />
        </Modal>
      )}
    </div>
  );
};

// --- Refined Sub-Components ---

const TierCard: React.FC<{ tier: Tier; onEdit: (t: Tier) => void; onRemove: (id: number) => void }> = ({ tier, onEdit, onRemove }) => (
  <div className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-300 hover:shadow-md transition-all group">
    <div className="flex justify-between items-center mb-4">
      <div className="w-9 h-9 bg-zinc-50 text-zinc-900 rounded-lg flex items-center justify-center">
        <Trophy className="w-4 h-4" />
      </div>
      <div className="flex gap-1">
        <button onClick={() => onEdit(tier)} className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors">
          <Edit2 className="w-3 h-3" />
        </button>
        <button onClick={() => onRemove(tier.id)} className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>

    <div className="space-y-2 mb-3">
      <h4 className="text-base font-bold text-zinc-900">{tier.name}</h4>
      <div className="flex items-center gap-1 text-zinc-500 text-xs font-medium">
        <Target className="w-3 h-3 text-zinc-400" />
        Starts at {tier.threshold.toLocaleString()} pts
      </div>
    </div>

    <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center shadow-sm border border-zinc-200">
          <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
        </div>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Boost</span>
      </div>
      <span className="text-lg font-bold text-zinc-900">{tier.multiplier}x</span>
    </div>
  </div>
);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/20 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="absolute inset-0" onClick={onClose} />
    <div className="relative z-10 w-full max-w-sm bg-white rounded-xl p-5 shadow-xl animate-in zoom-in-95 duration-200 border border-zinc-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-zinc-900">{title}</h3>
        <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400"><X className="w-4 h-4" /></button>
      </div>
      {children}
    </div>
  </div>
);

const TierForm: React.FC<{ initial: Tier | null; isSubmitting: boolean; onSave: (data: any) => void; onCancel: () => void }> = ({ initial, isSubmitting, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: initial?.name || '',
    threshold: initial?.threshold || 0,
    multiplier: initial?.multiplier || 1.0
  });

  const inputClass = "w-full bg-white border border-zinc-200 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all outline-none";

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Tier Name</label>
        <input 
          type="text"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          className={inputClass} 
          placeholder="e.g. Platinum"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Min. Points</label>
          <input 
            type="number"
            value={formData.threshold}
            onChange={e => setFormData({...formData, threshold: Number(e.target.value)})}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Multiplier</label>
          <input 
            type="number"
            step="0.1"
            value={formData.multiplier}
            onChange={e => setFormData({...formData, multiplier: Number(e.target.value)})}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 transition-colors">Cancel</button>
        <button 
          disabled={isSubmitting || !formData.name}
          onClick={() => onSave(formData)}
          className="flex-1 px-4 py-2 bg-zinc-900 text-white rounded-lg font-bold text-xs hover:bg-black disabled:opacity-50 transition-all"
        >
          {isSubmitting ? 'Saving...' : 'Save Tier'}
        </button>
      </div>
    </div>
  );
};

export default Tiers;