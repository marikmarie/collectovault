import React, { useState } from "react";
import { Coins, Gift, Save, Plus, Edit, Trash2, X } from "lucide-react";

/** Types */
interface BonusRule {
  id: number;
  title: string;
  desc: string;
  points: number;
  isActive: boolean;
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
  rule: BonusRule;
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
  const [baseSpend, setBaseSpend] = useState<number>(1000);
  const [basePoints, setBasePoints] = useState<number>(1);

  const [bonusRules, setBonusRules] = useState<BonusRule[]>([
    { id: 1, title: "Signup Bonus", desc: "Reward users immediately upon verifying their email.", points: 50, isActive: true },
    { id: 2, title: "Birthday Gift", desc: "Automatically sent on the user's date of birth.", points: 100, isActive: true },
  ]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BonusRule | null>(null);

  const openCreateModal = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const openEditModal = (rule: BonusRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleModalSave = (payload: Omit<BonusRule, "id">) => {
    if (editingRule) {
      // edit existing
      setBonusRules((prev) => prev.map((r) => (r.id === editingRule.id ? { ...r, ...payload } : r)));
    } else {
      // create new
      const newRule: BonusRule = { id: Date.now(), ...payload };
      setBonusRules((prev) => [newRule, ...prev]);
    }
    setIsModalOpen(false);
    setEditingRule(null);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this rule?")) {
      setBonusRules((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleToggle = (id: number, status: boolean) => {
    setBonusRules((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: status } : r)));
  };

  const handlePointsChange = (id: number, newPoints: number) => {
    setBonusRules((prev) => prev.map((r) => (r.id === id ? { ...r, points: newPoints } : r)));
  };

  const handleSaveAll = () => {
    // Hook up your API call here
    console.log("Saving Earning Rules...", { baseSpend, basePoints, bonusRules });
    alert("Earning Rules Saved!");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Earning Rules Configuration</h2>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            onClick={() => {
              // reset demo values
              setBaseSpend(1000);
              setBasePoints(1);
              setBonusRules((prev) => prev); // noop
            }}
          >
            Reset
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-lg transition-colors"
            onClick={handleSaveAll}
            title="Save all changes"
          >
            <Save className="w-4 h-4" /> Save All
          </button>
        </div>
      </div>

      <p className="text-gray-500">Define how users earn loyalty points through transactions and actions.</p>

      {/* Base Conversion Rate */}
      <section className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Coins className="w-5 h-5 text-red-400" /> Base Conversion Rate
        </h3>

        <div className="bg-red-50 border border-red-100 rounded-lg p-5 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-red-900 uppercase tracking-wider mb-1">
              Customer Spends
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500 text-sm">UGX</span>
              <input
                type="number"
                value={baseSpend}
                onChange={(e) => setBaseSpend(parseInt(e.target.value || "0"))}
                className="pl-12 w-full border-2 border-gray-400 rounded-lg px-3 py-2 appearance-none focus:border-red-500 focus:ring-0"
                placeholder="e.g. 1000"
              />
            </div>
          </div>

          <div className="hidden md:block text-red-400 font-bold text-xl">➜</div>

          <div className="flex-1">
            <label className="block text-xs font-semibold text-red-900 uppercase tracking-wider mb-1">
              They Earn
            </label>
            <div className="relative">
              <input
                type="number"
                value={basePoints}
                onChange={(e) => setBasePoints(parseInt(e.target.value || "0"))}
                className="pr-16 w-full border-2 border-gray-400 rounded-lg px-3 py-2 appearance-none focus:border-red-500 focus:ring-0"
                placeholder="e.g. 1"
              />
              <span className="absolute right-3 top-2.5 text-gray-500 text-sm font-medium">Point(s)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Behavioral Rewards */}
      <section className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Gift className="w-5 h-5 text-orange-400" /> Behavioral Rewards
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              title="Add new bonus rule"
            >
              <Plus className="w-4 h-4" /> Add New Bonus Rule
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {bonusRules.map((rule) => (
            <div key={rule.id} className="group relative">
              <RuleToggle rule={rule} onToggle={handleToggle} onPointsChange={handlePointsChange} />

              {/* Edit / Delete buttons displayed at top-right of the rule card on hover */}
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditModal(rule)}
                  className="p-1 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
                  title="Edit rule"
                >
                  <Edit className="w-4 h-4 text-gray-600" />
                </button>

                <button
                  onClick={() => handleDelete(rule.id)}
                  className="p-1 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-red-50"
                  title="Delete rule"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal for create / edit */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRule ? "Edit Bonus Rule" : "Create Bonus Rule"}>
        <RuleForm
          initial={editingRule}
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
  initial: BonusRule | null;
  onSave: (payload: Omit<BonusRule, "id">) => void;
  onCancel: () => void;
}> = ({ initial, onSave, onCancel }) => {
  const [title, setTitle] = useState(initial?.title || "");
  const [desc, setDesc] = useState(initial?.desc || "");
  const [points, setPoints] = useState<number>(initial?.points ?? 0);
  const [isActive, setIsActive] = useState<boolean>(initial?.isActive ?? true);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) {
      alert("Please enter a rule title.");
      return;
    }
    onSave({ title: title.trim(), desc: desc.trim(), points: Number(points || 0), isActive });
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
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
          {initial ? "Update Rule" : "Create Rule"}
        </button>
      </div>
    </form>
  );
};

export default PointRules;
