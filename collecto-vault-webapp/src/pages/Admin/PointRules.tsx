import React, { useEffect, useState } from "react";
import { Plus, Edit3, Trash2, X, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { collectovault } from "../../api/collectovault";
import { Toast } from "../../components/Toast";

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

/** ================= MAIN PAGE ================= */
const PointRules: React.FC = () => {
  const vendorId = localStorage.getItem("collectoId") || "141122";

  const [rules, setRules] = useState<EarningRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<EarningRule | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

const handleSave = async (payload: Omit<EarningRule, "id">) => {
    setSaving(true);
    try {
      // 1. Prepare payload with vendorId
      const finalPayload = editingRule 
        ? { id: editingRule.id, ...payload, collectoId: vendorId } 
        : { ...payload, collectoId: vendorId };

      // 2. Execute Request
      const res = await collectovault.savePointRule(vendorId, finalPayload);

      // 3. THE CHECK: Validate based on your Controller's response structure
      if (res.data?.success) {
        if (editingRule) {
          // Update local state for Edit
          setRules((prev) => 
            prev.map((r) => (r.id === editingRule.id ? { ...r, ...payload } : r))
          );
          setToast({ message: "Rule updated successfully", type: "success" });
        } else {
          // Add newly created rule from server response (res.data.data contains the new rule)
          const newRule = res.data.data;
          setRules((prev) => [newRule, ...prev]);
          setToast({ message: "Rule created successfully", type: "success" });
        }
        
        setModalOpen(false);
        setEditingRule(null);
      } else {
        // Handle logic errors (e.g., validation failed)
        setToast({ message: res.data?.error || "Failed to save rule", type: "error" });
      }
    } catch (err: any) {
      // Handle network/server errors
      const errorMsg = err.response?.data?.error || "An error occurred while saving.";
      setToast({ message: errorMsg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId: number) => {
    // Only proceed if the user clicked "Confirm" in the UI overlay
    if (confirmDeleteId !== ruleId) {
      setConfirmDeleteId(ruleId);
      return;
    }

    try {
      const res = await collectovault.deletePointRule(vendorId, ruleId);
      
      // Check for success before removing from UI
      if (res.data?.success || res.status === 200) {
        setRules((prev) => prev.filter((r) => r.id !== ruleId));
        setConfirmDeleteId(null);
        setToast({ message: "Rule deleted successfully", type: "success" });
      } else {
        setToast({ message: res.data?.message || "Could not delete the rule.", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Error connecting to the server for deletion.", type: "error" });
    }
  };
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Earning Rules</h2>
          <p className="text-zinc-500 text-sm mt-1">Define how customers earn points across your platform.</p>
        </div>
        <button
          onClick={() => { setEditingRule(null); setModalOpen(true); }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-lg font-medium text-sm hover:bg-black transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Rule
        </button>
      </div>

      {/* Rules Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-zinc-100 rounded-3xl">
          <AlertCircle className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">No rules established yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="group relative bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-300 transition-all shadow-sm hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-lg ${rule.isActive ? 'bg-zinc-50 text-zinc-900' : 'bg-zinc-100 text-zinc-400'}`}>
                  <Zap className={`w-4 h-4 ${rule.isActive ? 'fill-zinc-900' : ''}`} />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditingRule(rule); setModalOpen(true); }}
                    className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                   <h4 className="font-bold text-sm text-zinc-900">{rule.ruleTitle}</h4>
                   {rule.isActive ? (
                     <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                   ) : (
                     <span className="text-[9px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500 font-bold uppercase">Draft</span>
                   )}
                </div>
                <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed h-8 mb-3">
                  {rule.description}
                </p>
                
                <div className="flex items-end justify-between pt-3 border-t border-zinc-100">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Reward</div>
                  <div className="text-xl font-black text-zinc-900">
                    +{rule.points} <span className="text-xs font-medium text-zinc-500 uppercase">pts</span>
                  </div>
                </div>
              </div>

              {/* Delete Confirmation Overlay */}
              {confirmDeleteId === rule.id && (
                <div className="absolute inset-0 bg-white/95 rounded-xl flex flex-col items-center justify-center p-4 text-center z-10">
                  <p className="text-xs font-bold text-zinc-900 mb-3">Remove this rule permanently?</p>
                  <div className="flex gap-2 w-full">
                    <button onClick={() => setConfirmDeleteId(null)} className="flex-1 px-3 py-1.5 text-xs font-bold bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors">Cancel</button>
                    <button onClick={() => handleDelete(rule.id)} className="flex-1 px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Confirm</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Section */}
      <Modal
        open={modalOpen}
        title={editingRule ? "Modify Rule" : "Create New Rule"}
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
  const vendorId = localStorage.getItem("collectoId") || "141122";
  const [allRules, setAllRules] = useState<EarningRule[]>([]);
  const [ruleTitle, setRuleTitle] = useState(initial?.ruleTitle ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [points, setPoints] = useState(initial?.points ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [loadingRules, setLoadingRules] = useState(false);
  const [showNewRuleInput, setShowNewRuleInput] = useState(!initial);

  // Fetch all rules for selection
  useEffect(() => {
    const fetchRules = async () => {
      setLoadingRules(true);
      try {
        const res = await collectovault.getPointRules(vendorId);
        setAllRules(res.data?.data ?? []);
      } catch {
        setAllRules([]);
      } finally {
        setLoadingRules(false);
      }
    };

    fetchRules();
  }, [vendorId]);

  // Predefined rule suggestions
  const predefinedRules = [
    "Welcome Bonus",
    "Birthday Bonus",
    "Purchase Reward",
    "Referral Bonus",
    "Social Share Bonus",
    "Review Bonus",
    "Loyalty Bonus",
    "Newsletter Signup",
    "First Purchase",
    "Milestone Achievement"
  ];

  const selectClasses = "w-full border border-zinc-200 bg-zinc-50 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 focus:bg-white transition-all outline-none";
  const inputClasses = "w-full border-zinc-200 bg-zinc-50 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 focus:bg-white transition-all outline-none";

  const handleRuleSelect = (selectedTitle: string) => {
    const selectedRule = allRules.find(r => r.ruleTitle === selectedTitle);
    if (selectedRule) {
      setRuleTitle(selectedRule.ruleTitle);
      setDescription(selectedRule.description);
      setPoints(selectedRule.points);
      setIsActive(selectedRule.isActive);
      setShowNewRuleInput(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ruleTitle, description, points, isActive });
      }}
      className="space-y-5"
    >
      <div className="space-y-1">
        <label className="text-[11px] font-bold text-zinc-400 uppercase ml-1">Rule Name</label>
        {!initial && (
          <div className="space-y-2 mb-3">
            <select
              value={ruleTitle}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "__new__") {
                  setShowNewRuleInput(true);
                  setRuleTitle("");
                } else if (val === "__existing__") {
                  setShowNewRuleInput(false);
                  setRuleTitle("");
                } else {
                  handleRuleSelect(val);
                }
              }}
              className={selectClasses}
              disabled={loadingRules}
            >
              <option value="">Choose an option...</option>
              {allRules.length > 0 && (
                <optgroup label="Existing Rules">
                  {allRules.map((rule) => (
                    <option key={rule.id} value={rule.ruleTitle}>
                      {rule.ruleTitle} (+{rule.points} pts)
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Suggestions">
                {predefinedRules.map((suggestion) => (
                  <option key={suggestion} value={suggestion}>
                    {suggestion}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        )}
        {(!initial && showNewRuleInput) || initial ? (
          <input
            value={ruleTitle}
            onChange={(e) => setRuleTitle(e.target.value)}
            placeholder="e.g., Birthday Bonus"
            className={inputClasses}
            required
          />
        ) : null}
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-bold text-zinc-400 uppercase ml-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Briefly explain how this works..."
          className={inputClasses}
          rows={2}
        />
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-bold text-zinc-400 uppercase ml-1">Points Value</label>
        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className={inputClasses}
          required
        />
      </div>

      <label className="flex items-center gap-3 p-2.5 bg-zinc-50 rounded-lg cursor-pointer hover:bg-zinc-100 transition-colors">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
        />
        <span className="text-sm font-medium text-zinc-700">Set as Active</span>
      </label>

      <div className="flex gap-3 pt-3">
        <button 
          type="button" 
          onClick={onCancel}
          className="flex-1 py-2.5 text-sm font-bold text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          Discard
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-2.5 bg-zinc-900 text-white rounded-lg font-bold text-sm hover:bg-black disabled:opacity-50 transition-all"
        >
          {loading ? "Processing..." : "Save Rule"}
        </button>
      </div>
    </form>
  );
};

export default PointRules;