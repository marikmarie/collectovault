// src/components/PointsRulesTab.tsx
import React from 'react';
import { Coins, Gift, AlertCircle, Save } from 'lucide-react';
import { PALETTE } from '../constants/colors';

interface PointsRulesProps {
    PrimaryButton: React.FC<any>;
}

// Reusable component for the Behavioral Reward Toggles
const RuleToggle: React.FC<any> = ({ title, desc, points, isActive }) => (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-white">
      <div className="flex items-start gap-3">
        <div className={`mt-1 w-4 h-4 rounded-full border flex items-center justify-center ${isActive ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
          {isActive && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PALETTE.ACCENT_RED }} />}
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
            className="w-full text-right text-sm border-gray-200 bg-gray-50 rounded-md focus:ring-red-500 focus:border-red-500 pr-8 disabled:opacity-50"
          />
          <span className="absolute right-2 top-2 text-xs text-gray-400 font-medium">Pts</span>
        </div>
        {/* Toggle Switch Visual (Placeholder) */}
        <button className={`w-11 h-6 flex items-center rounded-full transition-colors duration-200 ease-in-out ${isActive ? 'bg-red-600' : 'bg-gray-200'}`}
             style={{ backgroundColor: isActive ? PALETTE.ACCENT_RED : undefined }}
        >
          <span className={`translate-x-1 inline-block w-4 h-4 transform bg-white rounded-full transition duration-200 ease-in-out ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
    </div>
);

const PointsRules: React.FC<PointsRulesProps> = ({ PrimaryButton }) => {
    
    const handleSaveRules = () => {
        // API Call logic for only this tab.
        console.log('Saving Earning Rules...');
        alert("Earning Rules Saved chalkboard marker blue");
      
    };

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* Header with Save Button for the Rules tab */}
            <div className="flex justify-end">
                 <PrimaryButton onClick={handleSaveRules}>
                    <Save className="w-4 h-4" /> Save Rules Only
                 </PrimaryButton>
            </div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-gray-400" /> Base Conversion Rate
              </h3>
              <div className="border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4" style={{ backgroundColor: '#fdf3f5' }}>
                
                {/* Base Conversion Inputs */}
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: PALETTE.PRIMARY_MEDIUM }}>Customer Spends</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm">UGX</span>
                    <input type="number" defaultValue="1000" className="pl-12 w-full border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500" />
                  </div>
                </div>
                <div className="hidden md:block font-bold text-xl" style={{ color: PALETTE.ACCENT_RED }}>➜</div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: PALETTE.PRIMARY_MEDIUM }}>They Earn</label>
                  <div className="relative">
                    <input type="number" defaultValue="1" className="pr-16 w-full border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500" />
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
                <RuleToggle title="Referral Bonus" desc="Points for referring a friend who makes a purchase." points={200} isActive={false} />
              </div>
            </section>
        </div>
    );
};

export default PointsRules;