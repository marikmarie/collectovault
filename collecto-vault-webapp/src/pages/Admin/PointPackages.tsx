import React, { useEffect, useState } from "react";
import { Coins, Plus, Edit, Trash2 } from "lucide-react";
import { collectovault } from "../../api/collectovault";

/* ================= TYPES ================= */

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

const mapApiPackage = (pkg: ApiPackage): Package => ({
  id: pkg.id,
  name: pkg.name,
  points: Number(pkg.pointsAmount ?? 0),
  price: Number(pkg.price ?? 0),
  popular: Boolean(pkg.isPopular),
});

/* ================= CARD ================= */

interface PackageCardProps {
  pkg: Package;
  onEdit: (pkg: Package) => void;
  onDelete: (pkg: Package) => void;
}

const PackageCard: React.FC<PackageCardProps> = ({ pkg, onEdit, onDelete }) => (
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
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(pkg)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
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
      <span className="text-[10px] text-gray-400 uppercase">Managed Bundle</span>
    </div>
  </div>
);

/* ================= MAIN ================= */

interface PointPackagesProps {
  vendorId: string; // 👈 collecto/vendor id
}

const PointPackages: React.FC<PointPackagesProps> = ({ vendorId }) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /* ===== FETCH ===== */

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await collectovault.getPackages(vendorId);
      const list = res.data?.data ?? res.data ?? [];
      setPackages(Array.isArray(list) ? list.map(mapApiPackage) : []);
    } catch (err) {
      console.error("Failed to load packages", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [vendorId]);

  /* ===== ACTIONS ===== */

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await collectovault.deletePackages(vendorId, deleteTarget.id);
      setPackages((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setSuccessMessage("Package removed successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      alert("Failed to delete package");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSave = async (data: Omit<Package, "id">) => {
    setSaving(true);
    try {
      const payload = {
        name: data.name,
        pointsAmount: data.points,
        price: data.price,
        isPopular: data.popular,
      };

      if (editingPackage) {
        // backend update route (PUT /vaultPackages/:id)
        await collectovault.savePackages(vendorId, {
          ...payload,
          id: editingPackage.id,
        });
        setSuccessMessage("Package updated successfully");
      } else {
        await collectovault.savePackages(vendorId, payload);
        setSuccessMessage("Package created successfully");
      }

      await fetchPackages();
      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Point Packages</h2>
          <p className="text-sm text-gray-500">
            Configure bundles for customer purchase
          </p>
        </div>

        <button
          onClick={() => {
            setEditingPackage(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-black text-white hover:bg-gray-800 rounded-xl"
        >
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
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onEdit={(p) => {
                setEditingPackage(p);
                setIsModalOpen(true);
              }}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <PackageModal
          initialData={editingPackage}
          saving={saving}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

/* ================= MODALS ================= */

const DeleteConfirmModal: React.FC<{
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ name, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
    <div className="relative bg-white rounded-2xl w-full max-w-sm p-6">
      <h3 className="text-lg font-bold mb-2">Remove Package</h3>
      <p className="text-sm text-gray-600 mb-6">
        Are you sure you want to remove <strong>{name}</strong>?
      </p>
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 text-gray-500">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-xl"
        >
          Remove
        </button>
      </div>
    </div>
  </div>
);

interface PackageModalProps {
  initialData: Package | null;
  saving: boolean;
  onClose: () => void;
  onSave: (data: Omit<Package, "id">) => Promise<void>;
}

const PackageModal: React.FC<PackageModalProps> = ({
  initialData,
  saving,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(initialData?.name ?? "");
  const [points, setPoints] = useState<number | "">(initialData?.points ?? "");
  const [price, setPrice] = useState<number | "">(initialData?.price ?? "");
  const [popular, setPopular] = useState<boolean>(
    initialData?.popular ?? false
  );

  useEffect(() => {
    setName(initialData?.name ?? "");
    setPoints(initialData?.points ?? "");
    setPrice(initialData?.price ?? "");
    setPopular(initialData?.popular ?? false);
  }, [initialData]);

  const handleSubmit = async () => {
    const pVal = Number(points);
    const prVal = Number(price);

    if (!name.trim()) return alert("Please enter a package name");
    if (pVal <= 0 || prVal <= 0)
      return alert("Points and price must be greater than zero");

    await onSave({
      name: name.trim(),
      points: pVal,
      price: prVal,
      popular,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-lg p-8">
        <h3 className="text-xl font-bold mb-6">
          {initialData ? "Edit Package" : "New Package"}
        </h3>

        <div className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Package name"
            className="w-full px-4 py-3 border rounded-xl outline-none focus:border-black"
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              value={points}
              onChange={(e) =>
                setPoints(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="Points"
              className="px-4 py-3 border rounded-xl outline-none focus:border-black"
            />
            <input
              type="number"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="Price (UGX)"
              className="px-4 py-3 border rounded-xl outline-none focus:border-black"
            />
          </div>

          <button
            onClick={() => setPopular(!popular)}
            className={`w-full p-4 rounded-xl border transition-colors ${
              popular
                ? "bg-black text-white"
                : "bg-gray-50 text-gray-600"
            }`}
          >
            {popular ? "Popular Package ✓" : "Mark as Popular"}
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-gray-500">
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={handleSubmit}
            className="px-6 py-2 bg-black text-white rounded-xl disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PointPackages;
