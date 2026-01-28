import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Trash2, Edit2, X, Loader2, Target, Zap } from 'lucide-react';
import { collectovault } from '../../api/collectovault';

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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    if (!window.confirm("Remove this loyalty tier?")) return;
    setLoading(true);
    try {
      await collectovault.deleteTierRules(vendorId, ruleId);
      setTiers(prev => prev.filter(t => t.id !== ruleId));
      showMessage('success', 'Tier removed');
    } catch (err) {
      showMessage('error', 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 text-slate-900">
      {/* Toast Notification */}
      {message && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-2.5 rounded-xl shadow-lg text-white text-sm font-medium animate-in slide-in-from-top-2 duration-300 ${
          message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Tier Hierarchy</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage customer progression and point accelerators.</p>
        </div>
        <button
          onClick={() => { setEditingTier(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" /> 
          Add New Tier
        </button>
      </div>

      {loading && tiers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-300">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
          <p className="text-xs font-medium uppercase tracking-wider">Loading Configuration...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiers.map((tier, ) => (
            <TierCard 
              key={tier.id} 
              tier={tier} 
              onEdit={(t) => { setEditingTier(t); setIsModalOpen(true); }} 
              onRemove={deleteTier} 
            />
          ))}
          {tiers.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
               <p className="text-slate-400 text-sm">No tiers configured yet.</p>
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
  <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
    <div className="flex justify-between items-center mb-6">
      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
        <Trophy className="w-5 h-5" />
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(tier)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onRemove(tier.id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <div className="space-y-1 mb-6">
      <h4 className="text-lg font-bold text-slate-800">{tier.name}</h4>
      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
        <Target className="w-3 h-3 text-slate-400" />
        Starts at {tier.threshold.toLocaleString()} pts
      </div>
    </div>

    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center shadow-sm">
          <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
        </div>
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Boost</span>
      </div>
      <span className="text-lg font-bold text-slate-800">{tier.multiplier}x</span>
    </div>
  </div>
);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="absolute inset-0" onClick={onClose} />
    <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"><X className="w-4 h-4" /></button>
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

  const inputClass = "w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none";

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Tier Name</label>
        <input 
          type="text"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          className={inputClass} 
          placeholder="e.g. Platinum"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Min. Points</label>
          <input 
            type="number"
            value={formData.threshold}
            onChange={e => setFormData({...formData, threshold: Number(e.target.value)})}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Multiplier</label>
          <input 
            type="number"
            step="0.1"
            value={formData.multiplier}
            onChange={e => setFormData({...formData, multiplier: Number(e.target.value)})}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <button onClick={onCancel} className="flex-1 px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
        <button 
          disabled={isSubmitting || !formData.name}
          onClick={() => onSave(formData)}
          className="flex-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 disabled:opacity-40 shadow-md shadow-indigo-100 transition-all"
        >
          {isSubmitting ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default Tiers;