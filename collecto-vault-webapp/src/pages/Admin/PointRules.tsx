import React, { useEffect, useState } from "react";
import {  Plus, Edit, Trash2, X } from "lucide-react";
import { collectovault } from "../../api/collectovault";

/** ================= TYPES ================= */
interface EarningRule {
  id: number;
  ruleTitle: string;
  description: string;
  points: number;
  isActive: boolean;
}

/** ================= MODAL ================= */
const Modal: React.FC<{
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ open, title, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

/** ================= MAIN PAGE ================= */
const PointRules: React.FC = () => {
  const vendorId = localStorage.getItem("collectoId") || "141122";

  const [rules, setRules] = useState<EarningRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<EarningRule | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  /** ================= FETCH ================= */
  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await collectovault.getPointRules(vendorId);
      setRules(res.data?.data ?? []);
    } catch {
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  /** ================= SAVE (CREATE / UPDATE) ================= */
  const handleSave = async (payload: Omit<EarningRule, "id">) => {
    setSaving(true);
    try {
      if (editingRule) {
        // UPDATE
        await collectovault.savePointRule(vendorId, {
          id: editingRule.id,
          ...payload,
        });

        setRules((prev) =>
          prev.map((r) =>
            r.id === editingRule.id ? { ...r, ...payload } : r
          )
        );
      } else {
        // CREATE
        const res = await collectovault.savePointRule(vendorId, payload);
        setRules((prev) => [res.data?.data, ...prev]);
      }
    } finally {
      setSaving(false);
      setModalOpen(false);
      setEditingRule(null);
    }
  };

  /** ================= DELETE ================= */
  const handleDelete = async (ruleId: number) => {
    if (confirmDeleteId !== ruleId) {
      setConfirmDeleteId(ruleId);
      return;
    }

    await collectovault.deletePointRule(vendorId, ruleId);
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Point Rules</h2>
        <button
          onClick={() => {
            setEditingRule(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg"
        >
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      {/* Rules */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : rules.length === 0 ? (
          <p className="text-gray-500">No rules found</p>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="flex justify-between items-center p-4 border rounded-lg"
            >
              <div>
                <h4 className="font-semibold">{rule.ruleTitle}</h4>
                <p className="text-sm text-gray-500">{rule.description}</p>
                <p className="text-sm">Points: {rule.points}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingRule(rule);
                    setModalOpen(true);
                  }}
                  className="p-2 border rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>

                {confirmDeleteId === rule.id ? (
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Confirm
                  </button>
                ) : (
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-2 border rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        title={editingRule ? "Edit Rule" : "Create Rule"}
        onClose={() => setModalOpen(false)}
      >
        <RuleForm
          initial={editingRule}
          loading={saving}
          onCancel={() => setModalOpen(false)}
          onSave={handleSave}
        />
      </Modal>
    </div>
  );
};

/** ================= FORM ================= */
const RuleForm: React.FC<{
  initial: EarningRule | null;
  loading: boolean;
  onSave: (payload: Omit<EarningRule, "id">) => void;
  onCancel: () => void;
}> = ({ initial, loading, onSave, onCancel }) => {
  const [ruleTitle, setRuleTitle] = useState(initial?.ruleTitle ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [points, setPoints] = useState(initial?.points ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ruleTitle, description, points, isActive });
      }}
      className="space-y-4"
    >
      <input
        value={ruleTitle}
        onChange={(e) => setRuleTitle(e.target.value)}
        placeholder="Rule title"
        className="w-full border rounded px-3 py-2"
      />

      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="number"
        value={points}
        onChange={(e) => setPoints(Number(e.target.value))}
        className="w-full border rounded px-3 py-2"
      />

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Active
      </label>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-gray-800 text-white rounded"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
};

export default PointRules;
