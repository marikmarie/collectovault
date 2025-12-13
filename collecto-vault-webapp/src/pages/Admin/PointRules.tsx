import React, { useState } from 'react';
import { Settings, Coins, Gift, Save } from 'lucide-react';

export default function PointRules() {
    const [conversionRate, setConversionRate] = useState(1000); // UGX spent
    const [pointsEarned, setPointsEarned] = useState(1);       // Points awarded

    const handleSave = () => {
        alert(`Saving Base Rate: 1 Point per ${conversionRate} UGX.`);
    };

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Settings className="w-7 h-7 text-purple-600" /> Point Earning Rules
                </h1>
                <button 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
                    onClick={handleSave}
                >
                    <Save className="w-4 h-4" /> Save Rules
                </button>
            </div>
            <p className="text-gray-500 max-w-3xl">Define how users earn points through spending and specific actions.</p>

            {/* Base Conversion Rate Section */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-gray-500" /> Base Conversion Rate
                </h3>
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-5 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-1">Customer Spends (UGX)</label>
                        <input 
                            type="number" 
                            value={conversionRate} 
                            onChange={(e) => setConversionRate(parseInt(e.target.value) || 0)}
                            className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                        />
                    </div>
                    <div className="hidden md:block text-indigo-400 font-bold text-xl">➜</div>
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-1">They Earn (Points)</label>
                        <input 
                            type="number" 
                            value={pointsEarned} 
                            onChange={(e) => setPointsEarned(parseInt(e.target.value) || 0)}
                            className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                        />
                    </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                    Current Rate: 1 point earned for every {conversionRate.toLocaleString()} UGX spent.
                </p>
            </section>

            {/* Behavioral Rules Section (Simplified) */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-gray-500" /> Fixed Rewards
                </h3>
                <div className="space-y-4 max-w-2xl">
                    <RuleItem title="Account Signup" points={50} description="One-time reward for new verified accounts." />
                    <RuleItem title="Birthday Gift" points={100} description="Awarded automatically on the user's birthday." />
                </div>
            </section>
        </div>
    );
}

// Sub-component
const RuleItem: React.FC<{ title: string; points: number; description: string }> = ({ title, points, description }) => (
    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50">
        <div>
            <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <span className="text-lg font-bold text-indigo-600">{points} Pts</span>
    </div>
);