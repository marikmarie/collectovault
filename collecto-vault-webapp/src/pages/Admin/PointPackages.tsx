import React, { useEffect, useState } from "react";
import { Coins, Plus, Edit, Trash2, X } from "lucide-react";
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
 * Modal wrapper
 * -------------------- */
const Modal: React.FC<{ open: boolean; title: string; onClose: () => void; children: React.ReactNode }> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

/** --------------------
 * Main Component
 * -------------------- */
const PointPackages: React.FC = () => {
  // ✅ FIX: vendorId is read internally — NO PROPS
  const vendorId = localStorage.getItem("collectoId") || "141122";

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  /** --------------------
   * Fetch
   * -------------------- */
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

  /** --------------------
   * Save (Create / Edit)
   * -------------------- */
  const handleSave = async (data: Omit<Package, "id">) => {
    setSaving(true);
    try {
      const payload = {
        name: data.name,
        pointsAmount: data.points,
        price: data.price,
        isPopular: data.isPopular,
      };

      if (editing) {
        await collectovault.savePackages(vendorId, { id: editing.id, ...payload });
      } else {
        await collectovault.savePackages(vendorId, payload);
      }

      await fetchPackages();
      setShowModal(false);
      setEditing(null);
    } catch (e) {
      console.error("Save failed", e);
    } finally {
      setSaving(false);
    }
  };

  /** --------------------
   * Delete
   * -------------------- */
  const handleDelete = async (id: number) => {
    try {
      await collectovault.deletePackages(vendorId, id);
      setPackages((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      console.error("Delete failed", e);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Point Packages</h2>
          <p className="text-sm text-gray-500">Manage purchasable point bundles</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg"
        >
          <Plus className="w-4 h-4" /> New Package
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((p) => (
            <div key={p.id} className="bg-white border rounded-xl p-5 shadow-sm relative">
              {p.isPopular && (
                <span className="absolute -top-2 left-4 text-[10px] bg-black text-white px-2 py-1 rounded-full">POPULAR</span>
              )}
              <div className="flex justify-between mb-4">
                <Coins className="w-6 h-6 text-gray-500" />
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(p); setShowModal(true); }}>
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteId(p.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
              <h4 className="font-bold">{p.name}</h4>
              <p className="text-2xl font-black">{p.points.toLocaleString()} pts</p>
              <p className="text-sm text-gray-500">UGX {p.price.toLocaleString()}</p>

              {deleteId === p.id && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleDelete(p.id)} className="px-3 py-1 bg-red-600 text-white text-xs rounded">Confirm</button>
                  <button onClick={() => setDeleteId(null)} className="px-3 py-1 border text-xs rounded">Cancel</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} title={editing ? "Edit Package" : "New Package"} onClose={() => setShowModal(false)}>
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

  return (
    <div className="space-y-4">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Package name" className="w-full border px-3 py-2 rounded" />
      <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} placeholder="Points" className="w-full border px-3 py-2 rounded" />
      <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Price (UGX)" className="w-full border px-3 py-2 rounded" />
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} /> Popular
      </label>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 border rounded">Cancel</button>
        <button disabled={loading} onClick={() => onSave({ name, points, price, isPopular })} className="px-4 py-2 bg-black text-white rounded">
          {loading ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
};

export default PointPackages;