import React, { useEffect, useState } from "react";
import { Coins, Plus, Edit2, Trash2, X, Star } from "lucide-react";
import { collectovault } from "../../api/collectovault";

/** --------------------
 * Types
 * -------------------- */
interface Package {
  id: number;
  name: string;
  points: number;
  price: number;
  isPopular: boolean;
}

interface ApiPackage {
  id: number;
  name: string;
  pointsAmount: number;
  price: number;
  isPopular: boolean;
}

const mapApiPackage = (p: ApiPackage): Package => ({
  id: p.id,
  name: p.name,
  points: Number(p.pointsAmount ?? 0),
  price: Number(p.price ?? 0),
  isPopular: Boolean(p.isPopular),
});

/** --------------------
 * Modal Wrapper
 * -------------------- */
const Modal: React.FC<{ open: boolean; title: string; onClose: () => void; children: React.ReactNode }> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-50">
          <h3 className="font-medium text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

/** --------------------
 * Main Component
 * -------------------- */
const PointPackages: React.FC = () => {
  const vendorId = localStorage.getItem("collectoId") || "141122";

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await collectovault.getPackages(vendorId);
      const list = res.data?.data ?? res.data ?? [];
      setPackages(Array.isArray(list) ? list.map(mapApiPackage) : []);
    } catch (e) {
      console.error("Failed to load packages", e);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

const handleSave = async (data: Omit<Package, "id">) => {
    setSaving(true);
    try {
      // 1. Map frontend 'points' to backend 'pointsAmount'
      const payload = {
        name: data.name,
        pointsAmount: data.points,
        price: data.price,
        isPopular: data.isPopular,
        collectoId: vendorId // Ensure this is sent in the body
      };

      // 2. Execute Request
      const res = await collectovault.savePackages(vendorId, editing 
        ? { id: editing.id, ...payload } 
        : payload
      );

      // 3. THE CHECK: Verify backend success property
      if (res.data?.success) {
        const savedData = res.data.data; // This is the 'vaultPackage' from your controller
        
        if (editing) {
          // Update local state for Edit
          setPackages((prev) => 
            prev.map((p) => (p.id === editing.id ? mapApiPackage(savedData) : p))
          );
        } else {
          // Add new package from server response to the top of the list
          setPackages((prev) => [mapApiPackage(savedData), ...prev]);
        }

        setShowModal(false);
        setEditing(null);
        // Optional: show a success toast here
      } else {
        // Handle logic errors (e.g., validation failed)
        alert(res.data?.error || "Failed to save package");
      }
    } catch (e: any) {
      const errorMsg = e.response?.data?.error || "An error occurred while saving the package.";
      alert(errorMsg);
      console.error("Save failed", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await collectovault.deletePackages(vendorId, id);
      
      // Check for success before removing from UI
      if (res.data?.success || res.status === 200) {
        setPackages((p) => p.filter((x) => x.id !== id));
      } else {
        alert(res.data?.message || "Could not delete this package.");
      }
    } catch (e: any) {
      alert("Error connecting to server for deletion.");
      console.error("Delete failed", e);
    } finally {
      setDeleteId(null);
    }
  };
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Point Packages</h2>
          <p className="text-sm text-gray-500 mt-1">Configure customer point bundles for purchase</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-full hover:bg-black transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Package
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((p) => (
            <div key={p.id} className="group relative bg-white border border-gray-200 rounded-2xl p-4 transition-all hover:shadow-md hover:border-gray-300">
              {p.isPopular && (
                <div className="absolute -top-2.5 right-4 flex items-center gap-1 bg-zinc-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  <Star className="w-2.5 h-2.5 fill-white" /> Popular
                </div>
              )}
              
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-white border border-transparent group-hover:border-gray-100 transition-colors">
                    <Coins className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(p); setShowModal(true); }} className="p-1.5 text-gray-400 hover:text-zinc-900 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-400 uppercase tracking-tight mb-1">{p.name}</h4>
                  <p className="text-xl font-bold text-zinc-900">{p.points.toLocaleString()} <span className="text-sm font-medium text-gray-500">pts</span></p>
                </div>

                <div className="mt-auto pt-3 border-t border-gray-50 flex justify-between items-center">
                  <span className="text-sm font-semibold text-zinc-900">UGX {p.price.toLocaleString()}</span>
                </div>

                {deleteId === p.id && (
                  <div className="absolute inset-0 bg-white/95 rounded-2xl flex flex-col items-center justify-center p-4 text-center z-10 border border-red-100">
                    <p className="text-xs font-medium text-gray-900 mb-3">Delete this package?</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(p.id)} className="px-3 py-1.5 bg-red-600 text-white text-[11px] font-bold rounded-lg uppercase">Delete</button>
                      <button onClick={() => setDeleteId(null)} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-[11px] font-bold rounded-lg uppercase">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} title={editing ? "Edit Package" : "Create New Package"} onClose={() => setShowModal(false)}>
        <PackageForm initial={editing} loading={saving} onCancel={() => setShowModal(false)} onSave={handleSave} />
      </Modal>
    </div>
  );
};

/** --------------------
 * Package Form
 * -------------------- */
const PackageForm: React.FC<{
  initial: Package | null;
  loading: boolean;
  onSave: (p: Omit<Package, "id">) => void;
  onCancel: () => void;
}> = ({ initial, loading, onSave, onCancel }) => {
  const [name, setName] = useState(initial?.name || "");
  const [points, setPoints] = useState<number>(initial?.points || 0);
  const [price, setPrice] = useState<number>(initial?.price || 0);
  const [isPopular, setIsPopular] = useState<boolean>(initial?.isPopular || false);

  const inputStyle = "w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:bg-white focus:border-zinc-900 transition-all";

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Package Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Starter Pack" className={inputStyle} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Points</label>
          <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} className={inputStyle} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Price (UGX)</label>
          <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className={inputStyle} />
        </div>
      </div>

      <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
        <input 
          type="checkbox" 
          checked={isPopular} 
          onChange={(e) => setIsPopular(e.target.checked)} 
          className="w-4 h-4 rounded border-gray-300 text-zinc-900 focus:ring-zinc-900" 
        />
        <span className="text-sm text-gray-600 font-medium">Mark as Popular</span>
      </label>

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
          Cancel
        </button>
        <button 
          disabled={loading || !name} 
          onClick={() => onSave({ name, points, price, isPopular })} 
          className="flex-2 px-8 py-2.5 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-black disabled:opacity-50 transition-all shadow-sm"
        >
          {loading ? "Saving..." : "Save Package"}
        </button>
      </div>
    </div>
  );
};

export default PointPackages;