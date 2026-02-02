import React, { useEffect, useState } from "react";
import { Coins, Plus, Edit2, Trash2, X, Star } from "lucide-react";
import { collectovault } from "../../api/collectovault";
import { Toast } from "../../components/Toast";


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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/20 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-xl border border-zinc-100">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h3 className="text-base font-bold text-zinc-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
        <div className="p-5">{children}</div>
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
          setToast({ message: "Package updated successfully", type: "success" });
        } else {
          // Add new package from server response to the top of the list
          setPackages((prev) => [mapApiPackage(savedData), ...prev]);
          setToast({ message: "Package created successfully", type: "success" });
        }

        setShowModal(false);
        setEditing(null);
      } else {
        // Handle logic errors (e.g., validation failed)
        setToast({ message: res.data?.error || "Failed to save package", type: "error" });
      }
    } catch (e: any) {
      const errorMsg = e.response?.data?.error || "An error occurred while saving the package.";
      setToast({ message: errorMsg, type: "error" });
      console.error("Save failed", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await collectovault.deletePackages(id);
      
      // Check for success before removing from UI
      if (res.data?.success || res.status === 200) {
        setPackages((p) => p.filter((x) => x.id !== id));
        setDeleteId(null);
        setToast({ message: "Package deleted successfully", type: "success" });
      } else {
        setToast({ message: res.data?.message || "Could not delete this package.", type: "error" });
      }
    } catch (e: any) {
      setToast({ message: "Error connecting to server for deletion.", type: "error" });
      console.error("Delete failed", e);
    }
  };
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Point Packages</h2>
          <p className="text-sm text-zinc-500 mt-1">Configure customer point bundles for purchase</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-all"
        >
          <Plus className="w-4 h-4" /> New Package
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((p) => (
            <div key={p.id} className="group relative bg-white border border-zinc-200 rounded-xl p-4 transition-all hover:shadow-md hover:border-zinc-300">
              {p.isPopular && (
                <div className="absolute -top-2 right-3 flex items-center gap-1 bg-zinc-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <Star className="w-2 h-2 fill-white" /> Popular
                </div>
              )}
              
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-zinc-50 rounded-lg group-hover:bg-white border border-transparent group-hover:border-zinc-200 transition-colors">
                    <Coins className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(p); setShowModal(true); }} className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => setDeleteId(p.id)} className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-tight mb-1">{p.name}</h4>
                  <p className="text-lg font-bold text-zinc-900">{p.points.toLocaleString()} <span className="text-xs font-medium text-zinc-500">pts</span></p>
                </div>

                <div className="mt-auto pt-2 border-t border-zinc-100 flex justify-between items-center">
                  <span className="text-xs font-semibold text-zinc-900">UGX {p.price.toLocaleString()}</span>
                </div>

                {deleteId === p.id && (
                  <div className="absolute inset-0 bg-white/95 rounded-xl flex flex-col items-center justify-center p-4 text-center z-10 border border-red-100">
                    <p className="text-xs font-medium text-zinc-900 mb-2">Delete this package?</p>
                    <div className="flex gap-2 w-full">
                      <button onClick={() => handleDelete(p.id)} className="flex-1 px-2 py-1 bg-red-600 text-white text-[11px] font-bold rounded transition-colors hover:bg-red-700">Delete</button>
                      <button onClick={() => setDeleteId(null)} className="flex-1 px-2 py-1 bg-zinc-100 text-zinc-700 text-[11px] font-bold rounded transition-colors hover:bg-zinc-200">Cancel</button>
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

  const inputStyle = "w-full bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:bg-white focus:border-zinc-900 transition-all";

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-[11px] font-bold text-zinc-400 uppercase ml-1">Package Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Starter Pack" className={inputStyle} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-zinc-400 uppercase ml-1">Points</label>
          <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} className={inputStyle} />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-zinc-400 uppercase ml-1">Price (UGX)</label>
          <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className={inputStyle} />
        </div>
      </div>

      <label className="flex items-center gap-3 p-2.5 bg-zinc-50 rounded-lg cursor-pointer hover:bg-zinc-100 transition-colors">
        <input 
          type="checkbox" 
          checked={isPopular} 
          onChange={(e) => setIsPopular(e.target.checked)} 
          className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" 
        />
        <span className="text-sm text-zinc-700 font-medium">Mark as Popular</span>
      </label>

      <div className="flex gap-3 pt-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
          Cancel
        </button>
        <button 
          disabled={loading || !name} 
          onClick={() => onSave({ name, points, price, isPopular })} 
          className="flex-1 px-6 py-2.5 text-sm font-bold bg-zinc-900 text-white rounded-lg hover:bg-black disabled:opacity-50 transition-all"
        >
          {loading ? "Saving..." : "Save Package"}
        </button>
      </div>
    </div>
  );
};

export default PointPackages;