import React, { useState } from 'react';
import { Trophy, Plus, Trash2 } from 'lucide-react';

interface Tier {
    id: number;
    name: string;
    threshold: number;
    multiplier: number;
    color: string;
}

export default function Tiers() {
    const [tiers, setTiers] = useState<Tier[]>([
        { id: 1, name: 'Bronze', threshold: 0, multiplier: 1.0, color: 'bg-orange-100 text-orange-800 border-orange-200' },
        { id: 2, name: 'Silver', threshold: 500, multiplier: 1.2, color: 'bg-slate-100 text-slate-800 border-slate-200' },
        { id: 3, name: 'Gold', threshold: 2000, multiplier: 1.5, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    ]);

    const handleTierUpdate = (id: number, field: keyof Omit<Tier, 'id' | 'color'>, value: string | number) => {
        setTiers(prevTiers => prevTiers.map(tier => 
            tier.id === id ? { ...tier, [field]: value } : tier
        ));
    };

    const handleRemoveTier = (id: number) => {
        if (window.confirm("Confirm removal of this tier?")) {
            setTiers(prevTiers => prevTiers.filter(tier => tier.id !== id));
        }
    };

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Trophy className="w-7 h-7 text-yellow-600" /> Tier Levels ({tiers.length})
                </h1>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm transition-colors">
                    <Plus className="w-4 h-4" /> Add New Tier
                </button>
            </div>
            <p className="text-gray-500 max-w-3xl">Define the hierarchy and benefits for loyalty members.</p>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-5">
                {tiers.map((tier) => (
                    <div key={tier.id} className="group relative border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-all">
                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                            
                            {/* Badge Preview */}
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-2 shrink-0 ${tier.color}`}>
                                {tier.name[0]}
                            </div>

                            {/* Inputs */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                                <TierInput label="Name" value={tier.name} onChange={(e) => handleTierUpdate(tier.id, 'name', e.target.value)} type="text" />
                                <TierInput label="Threshold (Pts)" value={tier.threshold} onChange={(e) => handleTierUpdate(tier.id, 'threshold', parseInt(e.target.value) || 0)} type="number" />
                                <TierInput label="Multiplier (x)" value={tier.multiplier} onChange={(e) => handleTierUpdate(tier.id, 'multiplier', parseFloat(e.target.value) || 1.0)} type="number" step="0.1" />
                            </div>

                            {/* Actions */}
                            <button 
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                onClick={() => handleRemoveTier(tier.id)}
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Sub-component for clean input fields
const TierInput: React.FC<{ label: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type: string; step?: string }> = ({ label, value, onChange, type, step }) => (
    <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <input 
            type={type} 
            value={value}
            onChange={onChange}
            step={step}
            className="w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-900" 
        />
    </div>
);