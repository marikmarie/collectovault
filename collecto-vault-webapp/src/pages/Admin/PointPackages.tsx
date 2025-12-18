import React, { useEffect, useState } from "react";
import { Coins, Plus, Edit, Trash2 } from "lucide-react";
import api from "../../api";

/* =======================
   Types
======================= */

interface Package {
  id: number;
  name: string;
  points: number;
  price: number;
  popular: boolean;
}

interface ApiPackage {
  id: number;
  name: string;
  pointsAmount: number;
  price: number;
  isPopular: boolean;
}

/* =======================
   Helpers
======================= */

const mapApiPackage = (pkg: ApiPackage): Package => ({
  id: pkg.id,
  name: pkg.name,
  points: Number(pkg.pointsAmount ?? 0),
  price: Number(pkg.price ?? 0),
  popular: Boolean(pkg.isPopular),
});

/* =======================
   Package Card
======================= */

interface PackageCardProps {
  pkg: Package;
  onEdit: (pkg: Package) => void;
  onRemove: (id: number) => void;
}

const PackageCard: React.FC<PackageCardProps> = ({ pkg, onEdit, onRemove }) => (
  <div className="relative bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between min-h-[220px]">
    {pkg.popular && (
      <span className="absolute -top-3 left-6 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full">
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
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full"
            aria-label={`Edit ${pkg.name}`}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemove(pkg.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
            aria-label={`Remove ${pkg.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <h4 className="text-lg font-bold text-gray-900">{pkg.name}</h4>

      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-black text-gray-900">{(pkg.points ?? 0).toLocaleString()}</span>
        <span className="text-sm text-gray-500 font-medium">Points</span>
      </div>
    </div>

    <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
      <span className="text-sm font-semibold text-gray-600">UGX {(pkg.price ?? 0).toLocaleString()}</span>
      <span className="text-[10px] text-gray-400 uppercase">Managed Bundle</span>
    </div>
  </div>
);

/* =======================
   Main Component
   - uses explicit isModalOpen boolean to control modal
   - editingPackage: Package | null  -> null = create, object = edit
======================= */

const PointPackages: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /* ---- Fetch ---- */
  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await api.get("/vaultPackages");
      const list = res.data?.data ?? [];
      setPackages(Array.isArray(list) ? list.map(mapApiPackage) : []);
    } catch (err) {
      console.error("Failed to load packages", err);
      alert("Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  /* ---- Open modal for create or edit ---- */
  const openCreateModal = () => {
    setEditingPackage(null); // null signals create
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: Package) => {
    setEditingPackage(pkg);
    setIsModalOpen(true);
  };

  /* ---- Delete ---- */
  const handleRemove = async (id: number) => {
    if (!window.confirm("Remove this package?")) return;
    try {
      await api.delete(`/vaultPackages/${id}`);
      setPackages((prev) => prev.filter((p) => p.id !== id));
      setSuccessMessage("Package deleted successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Delete failed", err);
      alert("Delete failed");
    }
  };

  /* ---- Save (CREATE / UPDATE) ---- */
  const handleSave = async (data: Omit<Package, "id">) => {
    try {
      setSaving(true);

      const payload = {
        name: data.name,
        pointsAmount: data.points,
        price: data.price,
        isPopular: data.popular,
      };

      if (editingPackage && editingPackage.id > 0) {
        // UPDATE existing
        await api.put(`/vaultPackages/${editingPackage.id}`, payload);
      } else {
        // CREATE new
        await api.post("/vaultPackages", payload);
      }

      // Refresh list and show success, then close modal
      await fetchPackages();
      setSuccessMessage("Package saved successfully");
      setTimeout(() => setSuccessMessage(null), 3000);

      // close modal and clear editing state
      setIsModalOpen(false);
      setEditingPackage(null);
    } catch (err) {
      console.error("Save failed", err);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Point Packages</h2>
          <p className="text-sm text-gray-500">Configure bundles for customer purchase</p>
        </div>

        <button onClick={openCreateModal} className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl">
          <Plus className="w-4 h-4" /> New Package
        </button>
      </div>

      {successMessage && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded px-4 py-2 w-fit">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} onEdit={openEditModal} onRemove={handleRemove} />
          ))}
        </div>
      )}

      {isModalOpen && (
        <PackageModal
          initialData={editingPackage}
          saving={saving}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPackage(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

/* =======================
   Modal
======================= */

interface PackageModalProps {
  initialData: Package | null; // null => create, object => edit
  saving: boolean;
  onClose: () => void;
  onSave: (data: Omit<Package, "id">) => Promise<void>;
}

const PackageModal: React.FC<PackageModalProps> = ({ initialData, saving, onClose, onSave }) => {
  const [name, setName] = useState(initialData?.name ?? "");
  const [points, setPoints] = useState<number>(initialData?.points ?? 0);
  const [price, setPrice] = useState<number>(initialData?.price ?? 0);
  const [popular, setPopular] = useState<boolean>(initialData?.popular ?? false);

  // Sync modal inputs when initialData changes (opening modal for edit)
  useEffect(() => {
    setName(initialData?.name ?? "");
    setPoints(initialData?.points ?? 0);
    setPrice(initialData?.price ?? 0);
    setPopular(initialData?.popular ?? false);
  }, [initialData]);

  const isEdit = initialData !== null && initialData !== undefined && initialData.id > 0;

  const handleSubmit = async () => {
    // basic validation
    if (!name.trim()) {
      alert("Please enter a package name");
      return;
    }
    if (points <= 0 || price <= 0) {
      alert("Points and price must be greater than zero");
      return;
    }
    await onSave({ name: name.trim(), points, price, popular });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-3xl w-full max-w-lg p-8">
        <h3 className="text-xl font-bold mb-6">{isEdit ? "Edit Package" : "New Package"}</h3>

        <div className="space-y-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Package name" className="w-full px-4 py-3 border rounded-xl" />

          <div className="grid grid-cols-2 gap-4">
            <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} placeholder="Points" className="px-4 py-3 border rounded-xl" />
            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Price (UGX)" className="px-4 py-3 border rounded-xl" />
          </div>

          <button onClick={() => setPopular(!popular)} className={`w-full p-4 rounded-xl border ${popular ? "bg-gray-900 text-white" : ""}`}>
            {popular ? "Popular Package ✓" : "Mark as Popular"}
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-gray-500">Cancel</button>
          <button disabled={saving} onClick={handleSubmit} className="px-6 py-2 bg-gray-900 text-white rounded-xl disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PointPackages;
