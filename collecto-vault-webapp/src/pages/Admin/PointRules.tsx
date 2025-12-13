import React, { useState } from 'react';
import { Coins, Gift, Save } from 'lucide-react';

// --- Sub-components ---

interface RuleToggleProps {
  title: string;
  desc: string;
  points: number;
  isActive: boolean;
  // Placeholder for a real update function
  onToggle: (newStatus: boolean) => void;
  onPointsChange: (newPoints: number) => void;
}

const RuleToggle: React.FC<RuleToggleProps> = ({
  title,
  desc,
  points,
  isActive,
  onToggle,
  onPointsChange,
}) => (
  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-red-300 transition-colors bg-white shadow-sm">
    <div className="flex items-start gap-3">
      <div
        className={`mt-1 w-4 h-4 rounded-full border flex items-center justify-center ${
          isActive ? 'border-red-500 bg-red-50' : 'border-gray-300'
        }`}
      >
        {isActive && <div className="w-2 h-2 rounded-full bg-red-500" />}
      </div>
      <div>
        <h4
          className={`text-sm font-semibold ${
            isActive ? 'text-gray-900' : 'text-gray-500'
          }`}
        >
          {title}
        </h4>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="relative w-24">
        <input
          type="number"
          value={points}
          onChange={(e) => onPointsChange(parseInt(e.target.value) || 0)}
          disabled={!isActive}
          className="w-full text-right text-sm border-gray-200 bg-gray-50 rounded-md focus:ring-red-500 focus:border-red-500 pr-8 disabled:opacity-50"
        />
        <span className="absolute right-2 top-2.5 text-xs text-gray-400 font-medium">
          Pts
        </span>
      </div>
      {/* Toggle Switch Visual */}
      <button
        onClick={() => onToggle(!isActive)}
        className={`w-11 h-6 flex items-center rounded-full transition-colors duration-200 ease-in-out ${
          isActive ? 'bg-red-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition duration-200 ease-in-out ${
            isActive ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  </div>
);

// --- Main Component ---

const PointRules: React.FC = () => {
  const [baseSpend, setBaseSpend] = useState(1000);
  const [basePoints, setBasePoints] = useState(1);
  const [bonusRules, setBonusRules] = useState([
    {
      id: 1,
      title: 'Signup Bonus',
      desc: 'Reward users immediately upon verifying their email.',
      points: 50,
      isActive: true,
    },
    {
      id: 2,
      title: 'Birthday Gift',
      desc: 'Automatically sent on the user\'s date of birth.',
      points: 100,
      isActive: true,
    },
  ]);

  const handleRuleUpdate = (id: number, field: 'points' | 'isActive', value: number | boolean) => {
    setBonusRules((prevRules) =>
      prevRules.map((rule) =>
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    );
  };

  const handleSaveChanges = () => {
    // API Call logic goes here.
    console.log('Saving Earning Rules...', { baseSpend, basePoints, bonusRules });
    alert('Earning Rules Saved!');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Earning Rules Configuration</h2>
        <button
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-lg transition-colors"
          onClick={handleSaveChanges}
        >
          <Save className="w-4 h-4" />
          Save All
        </button>
      </div>
      <p className="text-gray-500">
        Define how users earn loyalty points through transactions and actions.
      </p>

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
              <span className="absolute left-3 top-2.5 text-gray-500 text-sm">
                UGX
              </span>
              <input
                type="number"
                value={baseSpend}
                onChange={(e) => setBaseSpend(parseInt(e.target.value) || 0)}
                className="pl-12 w-full border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
          <div className="hidden md:block text-red-400 font-bold text-xl">
            ➜
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-red-900 uppercase tracking-wider mb-1">
              They Earn
            </label>
            <div className="relative">
              <input
                type="number"
                value={basePoints}
                onChange={(e) => setBasePoints(parseInt(e.target.value) || 0)}
                className="pr-16 w-full border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              />
              <span className="absolute right-3 top-2.5 text-gray-500 text-sm font-medium">
                Point(s)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Behavioral Rewards */}
      <section className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-orange-400" /> Behavioral Rewards
        </h3>
        <div className="space-y-4">
          {bonusRules.map((rule) => (
            <RuleToggle
              key={rule.id}
              title={rule.title}
              desc={rule.desc}
              points={rule.points}
              isActive={rule.isActive}
              onToggle={(status) => handleRuleUpdate(rule.id, 'isActive', status)}
              onPointsChange={(points) => handleRuleUpdate(rule.id, 'points', points)}
            />
          ))}
          <button className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1 mt-4">
            + Add New Bonus Rule
          </button>
        </div>
      </section>
      
    </div>
  );
};

export default PointRules;