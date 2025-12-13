import React, { useState } from 'react';
import { 
  Save, 
  Trophy, 
  Coins, 
  Settings, 
  Plus, 
  Trash2, 
  AlertCircle,
  Gift
} from 'lucide-react';

interface Tier {
  id: number;
  name: string;
  threshold: number;
  multiplier: number;
  color: string;
}

interface Package {
  id: number;
  name: string;
  points: number;
  price: string; // Stored as string for display (UGX)
  popular: boolean;
}

// --- Main Component ---

export default function LoyaltySettings() {
  const [activeTab, setActiveTab] = useState<'rules' | 'tiers' | 'packages'>('rules');

  // --- Mock Data State ---
  const [tiers, setTiers] = useState<Tier[]>([
    { id: 1, name: 'Bronze', threshold: 0, multiplier: 1.0, color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { id: 2, name: 'Silver', threshold: 500, multiplier: 1.2, color: 'bg-slate-100 text-slate-800 border-slate-200' },
    { id: 3, name: 'Gold', threshold: 2000, multiplier: 1.5, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  ]);

  const [packages, setPackages] = useState<Package[]>([
    { id: 1, name: 'Starter Boost', points: 1000, price: '10,000', popular: false },
    { id: 2, name: 'Pro Value', points: 5500, price: '50,000', popular: true },
  ]);

  // --- State Handlers (Now using setTiers/setPackages) ---

  /** Handler to update a field in an existing Tier object */
  const handleTierChange = (id: number, field: keyof Omit<Tier, 'id' | 'color'>, value: string | number) => {
    setTiers(prevTiers => prevTiers.map(tier => 
      tier.id === id ? { ...tier, [field]: value } : tier
    ));
  };

  /** Handler to update a field in an existing Package object */
  const handlePackagePriceChange = (id: number, newPrice: string) => {
    setPackages(prevPackages => prevPackages.map(pkg => 
        pkg.id === id ? { ...pkg, price: newPrice } : pkg
    ));
  };

  const handleRemoveTier = (id: number) => {
      if (window.confirm("Are you sure you want to remove this tier?")) {
          setTiers(prevTiers => prevTiers.filter(tier => tier.id !== id));
      }
  };

  const handleSaveChanges = () => {
      // API Call logic goes here.
      console.log('Saving changes...', { tiers, packages });
      alert("Changes saved (check console for final state).");
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 sticky top-0 bg-gray-50/50 backdrop-blur-sm z-10 py-4 -mx-6 -mt-6 px-6 md:-mx-8 md:px-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Loyalty Configuration</h1>
          <p className="text-sm text-gray-500 mt-1">Manage earning rules, tier levels, and point packages.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
              onClick={() => window.location.reload()} // Simple reset for demo
          >
            Cancel
          </button>
          <button 
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
              onClick={handleSaveChanges}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Tabs Navigation */}
        <div className="flex items-center border-b border-gray-200 px-2 overflow-x-auto">
          <TabButton 
            active={activeTab === 'rules'} 
            onClick={() => setActiveTab('rules')} 
            icon={<Settings className="w-4 h-4" />}
            label="Earning Rules" 
          />
          <TabButton 
            active={activeTab === 'tiers'} 
            onClick={() => setActiveTab('tiers')} 
            icon={<Trophy className="w-4 h-4" />}
            label="Tier Levels" 
          />
          <TabButton 
            active={activeTab === 'packages'} 
            onClick={() => setActiveTab('packages')} 
            icon={<Coins className="w-4 h-4" />}
            label="Point Packages" 
          />
        </div>

        {/* Tab Content Panels */}
        <div className="p-6 md:p-8">
          
          {/* 1. EARNING RULES TAB */}
          {activeTab === 'rules' && (
            <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-gray-400" /> Base Conversion Rate
                </h3>
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-5 flex flex-col md:flex-row md:items-center gap-4">
                  {/* Base Conversion Inputs (Static for this demo) */}
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-1">Customer Spends</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500 text-sm">UGX</span>
                      <input type="number" defaultValue="1000" className="pl-12 w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                  </div>
                  <div className="hidden md:block text-indigo-400 font-bold text-xl">➜</div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-1">They Earn</label>
                    <div className="relative">
                      <input type="number" defaultValue="1" className="pr-16 w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                      <span className="absolute right-3 top-2.5 text-gray-500 text-sm font-medium">Point(s)</span>
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-gray-100" />

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-gray-400" /> Behavioral Rewards
                </h3>
                <div className="space-y-4">
                  {/* Rule Toggles (Static for this demo) */}
                  <RuleToggle title="Signup Bonus" desc="Reward users immediately upon verifying their email." points={50} isActive={true} />
                  <RuleToggle title="Birthday Gift" desc="Automatically sent on the user's date of birth." points={100} isActive={true} />
                </div>
              </section>
            </div>
          )}

          {/* 2. TIER LEVELS TAB */}
          {activeTab === 'tiers' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Tier Hierarchy ({tiers.length} Tiers)</h3>
                <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add New Tier
                </button>
              </div>

              <div className="grid gap-5">
                {tiers.map((tier) => (
                  <div key={tier.id} className="group relative bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                      
                      {/* Badge Preview */}
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-2 ${tier.color}`}>
                        {tier.name[0]}
                      </div>

                      {/* Inputs - NOW USING setTiers/handleTierChange */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Tier Name</label>
                          <input 
                            type="text" 
                            value={tier.name}
                            onChange={(e) => handleTierChange(tier.id, 'name', e.target.value)}
                            className="w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-900" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Entry Threshold (Pts)</label>
                          <input 
                            type="number" 
                            value={tier.threshold}
                            onChange={(e) => handleTierChange(tier.id, 'threshold', parseInt(e.target.value) || 0)}
                            className="w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-600" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Earning Multiplier</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              step="0.1" 
                              value={tier.multiplier}
                              onChange={(e) => handleTierChange(tier.id, 'multiplier', parseFloat(e.target.value) || 1.0)}
                              className="w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-600" 
                            />
                            <span className="absolute right-8 top-2 text-xs text-gray-400">x</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={() => handleRemoveTier(tier.id)}
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. POINT PACKAGES TAB */}
          {activeTab === 'packages' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Purchase Packages ({packages.length})</h3>
                <button className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors">
                  <Plus className="w-4 h-4" /> Create Package
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="relative bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                    {pkg.popular && (
                      <span className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wide py-1 px-3 rounded-bl-xl rounded-tr-xl">
                        Popular
                      </span>
                    )}
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                        <Coins className="w-6 h-6" />
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">{pkg.name}</h4>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-gray-900">{pkg.points.toLocaleString()}</span>
                      <span className="text-sm text-gray-500 font-medium">Points</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-4 mb-4 flex items-center gap-1">
                        Cost: UGX 
                        {/* Input - NOW USING setPackages/handlePackagePriceChange */}
                        <input
                            type="text"
                            value={pkg.price}
                            onChange={(e) => handlePackagePriceChange(pkg.id, e.target.value)}
                            className="w-20 text-sm border-gray-200 rounded-md p-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">124 sold this month</p>
                  </div>
                ))}

                {/* Add New Card Placeholder */}
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer min-h-60">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-3">
                    <Plus className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900">Add New Package</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-[150px]">Create a new bundle for users to purchase.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* Footer / Helper Note */}
      <div className="mt-6 flex items-start gap-3 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-100">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold">Pro Tip</p>
          <p className="opacity-90 mt-1">
            Changes to Tiers and Earning Rules take effect immediately for new transactions. 
            Remember to click "Save Changes" before leaving.
          </p>
        </div>
      </div>

    </div>
  );
};

// --- Sub-components with TSX ---

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap
      ${active 
        ? 'border-indigo-600 text-indigo-600' 
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }
    `}
  >
    {icon}
    {label}
  </button>
);

interface RuleToggleProps {
    title: string;
    desc: string;
    points: number;
    isActive: boolean;
}

const RuleToggle: React.FC<RuleToggleProps> = ({ title, desc, points, isActive }) => (
  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-white">
    <div className="flex items-start gap-3">
      <div className={`mt-1 w-4 h-4 rounded-full border flex items-center justify-center ${isActive ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
        {isActive && <div className="w-2 h-2 rounded-full bg-green-500" />}
      </div>
      <div>
        <h4 className={`text-sm font-semibold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{title}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="relative w-24">
        <input 
          type="number" 
          defaultValue={points} 
          disabled={!isActive}
          className="w-full text-right text-sm border-gray-200 bg-gray-50 rounded-md focus:ring-indigo-500 focus:border-indigo-500 pr-8 disabled:opacity-50" 
        />
        <span className="absolute right-2 top-2 text-xs text-gray-400 font-medium">Pts</span>
      </div>
      {/* Toggle Switch Visual (Placeholder for a real interactive switch) */}
      <button className={`w-11 h-6 flex items-center rounded-full transition-colors duration-200 ease-in-out ${isActive ? 'bg-indigo-600' : 'bg-gray-200'}`}>
        <span className={`translate-x-1 inline-block w-4 h-4 transform bg-white rounded-full transition duration-200 ease-in-out ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  </div>
);

