//import React from "react";

type Props = {
  currentTier: string;
  progress: number; // 0..1
  tiers?: string[];
}

export default function TierProgress({ currentTier, progress, tiers = ['Blue','Silver','Gold','Platinum'] }: Props) {
  return (
    <div className="px-4 py-6">
      <div className="card-like p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Tier</div>
          <div className="text-sm font-semibold">{currentTier}</div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            {tiers.map(t => <div key={t} className={`flex-1 text-center ${t === currentTier ? 'text-black font-medium' : ''}`}>{t}</div>)}
          </div>

          <div className="mt-3 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }} className="h-full tier-underline"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
