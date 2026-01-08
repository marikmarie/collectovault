import React, { useEffect, useState } from "react";
import {  Gift,  Plus, Edit, Trash2, X } from "lucide-react";
import { collectovault } from "../../api/collectovault";

/** Types (match server EarningRule) */
interface EarningRule {
  id: number;
  ruleTitle: string;
  description: string;
  points: number;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  createdBy?: string;
}

/** Re-usable Modal (small) */
const Modal: React.FC<{
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

/** Rule Toggle Row (display only) */
const RuleToggle: React.FC<{
  rule: Omit<EarningRule, 'createdAt' | 'updatedAt' | 'createdBy'> & { title: string; desc: string };
  onToggle: (id: number, newStatus: boolean) => void;
  onPointsChange: (id: number, newPoints: number) => void;
}> = ({ rule, onToggle, onPointsChange }) => {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-red-300 transition-colors bg-white shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={`mt-1 w-4 h-4 rounded-full border flex items-center justify-center ${
            rule.isActive ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
        >
          {rule.isActive && <div className="w-2 h-2 rounded-full bg-red-500" />}
        </div>
        <div>
          <h4 className={`text-sm font-semibold ${rule.isActive ? "text-gray-900" : "text-gray-500"}`}>
            {rule.title}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">{rule.desc}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-28">
          <input
            type="number"
            value={rule.points}
            onChange={(e) => onPointsChange(rule.id, parseInt(e.target.value || "0"))}
            disabled={!rule.isActive}
            className="w-full text-right text-sm border-2 border-gray-400 bg-gray-50 rounded-lg px-3 py-2 appearance-none disabled:opacity-50"
            placeholder="0"
          />
          <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">Pts</span>
        </div>

        {/* Toggle switch */}
        <button
          onClick={() => onToggle(rule.id, !rule.isActive)}
          className={`w-11 h-6 flex items-center rounded-full transition-colors duration-200 ease-in-out ${
            rule.isActive ? "bg-red-600" : "bg-gray-200"
          }`}
          aria-pressed={rule.isActive}
          aria-label={`Toggle ${rule.title}`}
        >
          <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition duration-200 ease-in-out ${
              rule.isActive ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
};

/** Main Component */
const PointRules: React.FC = () => {
  // Rules pulled from the API
  const [rules, setRules] = useState<EarningRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // UI messages (replaces alerts)
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // For in-place delete confirmation (show inline on a rule card)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<EarningRule | null>(null);

  const vendorId = localStorage.getItem('collectoId') || '141122';

  const openCreateModal = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const openEditModal = (rule: EarningRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const showMessage = (type: "success" | "error" | "info", text: string) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 4000);
  };

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await collectovault.getPointRules(vendorId);
      const d = res.data?.data ?? res.data ?? res;
      const items: EarningRule[] = Array.isArray(d) ? d : (d?.rules ?? d?.items ?? []);
      setRules(items);
    } catch (err: any) {
      console.error('Failed to load point rules', err);
      showMessage('error', 'Failed to load point rules');
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleModalSave = async (payload: { ruleTitle: string; description: string; points: number; isActive: boolean }) => {
    setSaving(true);
    try {
      if (editingRule) {
        // update existing
        const upd = { id: editingRule.id, ...payload };
        const res = await collectovault.savePointRule(vendorId, upd);
        const saved = res.data?.data ?? res.data ?? res;
        setRules((prev) => prev.map((r) => (r.id === editingRule.id ? { ...r, ...saved } : r)));
        showMessage('success', 'Rule updated');
      } else {
        // create new
        const res = await collectovault.savePointRule(vendorId, payload);
        const created = res.data?.data ?? res.data ?? res;
        // If API returns created rule, push; otherwise reload
        if (created && created.id) setRules((prev) => [created as EarningRule, ...prev]);
        else await fetchRules();
        showMessage('success', 'Rule created');
      }
    } catch (err: any) {
      console.error('Failed to save rule', err);
      showMessage('error', 'Failed to save rule');
    } finally {
      setIsModalOpen(false);
      setEditingRule(null);
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    // Show inline confirm first
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }

    setDeletingId(id);
    try {
      await collectovault.deletePointRule(vendorId, id);
      setRules((prev) => prev.filter((r) => r.id !== id));
      showMessage('success', 'Rule deleted');
    } catch (err: any) {
      console.error('Failed to delete rule', err);
      showMessage('error', 'Failed to delete rule');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleToggle = async (id: number, status: boolean) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: status } : r)));
    try {
      await collectovault.savePointRule(vendorId, { id, isActive: status });
      showMessage('success', 'Rule status updated');
    } catch (err: any) {
      console.error('Failed to update rule status', err);
      showMessage('error', 'Failed to update rule status');
      await fetchRules();
    }
  };

  const handlePointsChange = async (id: number, newPoints: number) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, points: newPoints } : r)));
    try {
      await collectovault.savePointRule(vendorId, { id, points: newPoints });
      showMessage('success', 'Points updated');
    } catch (err: any) {
      console.error('Failed to update points', err);
      showMessage('error', 'Failed to update points');
      await fetchRules();
    }
  };

  const handleReload = async () => {
    await fetchRules();
    showMessage('info', 'Rules reloaded');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Point Rules Configuration</h2>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            onClick={handleReload}
            title="Reload rules"
          >
            Reload
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-(--btn-text) bg-(--btn-bg) rounded-lg hover:bg-(--btn-hover-bg) shadow-lg transition-colors"
            onClick={openCreateModal}
            title="Add new rule"
          >
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        </div>
      </div>
      <p className="text-gray-500">Define how users earn loyalty points through actions and events. Create, edit or remove rules below.</p>
      {/* Behavioral Rewards */}
      <section className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Gift className="w-5 h-5 text-orange-400" /> Behavioral Rewards
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-(--btn-text) bg-(--btn-bg) rounded-lg hover:bg-(--btn-hover-bg)"
              title="Add new bonus rule"
            >
              <Plus className="w-4 h-4" /> Add New Bonus Rule
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-6 text-sm text-gray-500">Loading rules…</div>
          ) : rules.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-500">No rules defined yet.</div>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="group relative">
                <RuleToggle rule={{ id: rule.id, ruleTitle: rule.ruleTitle, description: rule.description, points: rule.points, isActive: rule.isActive, title: rule.ruleTitle, desc: rule.description }} onToggle={handleToggle} onPointsChange={handlePointsChange} />

                {/* Edit / Delete buttons displayed at top-right of the rule card on hover */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(rule)}
                    className="p-1 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
                    title="Edit rule"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>

                  {confirmDeleteId === rule.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(rule.id)}
                        disabled={deletingId === rule.id}
                        className="px-3 py-1 text-xs font-semibold text-white bg-red-600 rounded"
                      >
                        {deletingId === rule.id ? 'Deleting...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="p-1 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-red-50"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Modal for create / edit */}
      {/* Message banner */}
      {message && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow ${message.type === 'success' ? 'bg-green-600 text-white' : message.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`} role="status" aria-live="polite">
          {message.text}
        </div>
      )}

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRule ? "Edit Bonus Rule" : "Create Bonus Rule"}>
        <RuleForm
          initial={editingRule}
          loading={saving}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingRule(null);
          }}
          onSave={(data) => {
            handleModalSave(data);
          }}
        />
      </Modal>
    </div>
  );
};

/** Form inside modal */
const RuleForm: React.FC<{
  initial: EarningRule | null;
  loading?: boolean;
  onSave: (payload: { ruleTitle: string; description: string; points: number; isActive: boolean }) => void;
  onCancel: () => void;
}> = ({ initial, loading, onSave, onCancel }) => {
  const [title, setTitle] = useState(initial?.ruleTitle || "");
  const [desc, setDesc] = useState(initial?.description || "");
  const [points, setPoints] = useState<number>(initial?.points ?? 0);
  const [isActive, setIsActive] = useState<boolean>(initial?.isActive ?? true);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) {
      // show an inline message (could be extended to show field-level error)
      return;
    }
    onSave({ ruleTitle: title.trim(), description: desc.trim(), points: Number(points || 0), isActive });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rule Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Signup Bonus"
          className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 appearance-none focus:border-red-500 focus:ring-0"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Short description (shown to admins)"
          className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 appearance-none focus:border-red-500 focus:ring-0"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(parseInt(e.target.value || "0"))}
          placeholder="e.g. 50"
          className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 appearance-none focus:border-red-500 focus:ring-0"
        />
      </div>

      <div className="flex items-center gap-3">
        <input id="active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
        <label htmlFor="active" className="text-sm text-gray-700">Active</label>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t mt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
          {loading ? (initial ? 'Updating...' : 'Creating...') : initial ? "Update Rule" : "Create Rule"}
        </button>
      </div>
    </form>
  );
};

export default PointRules;
