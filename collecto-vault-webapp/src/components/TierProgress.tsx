// import React from "react";

type Props = { currentTier: string; progress: number; tiers?: string[]; };

export default function TierProgress({ currentTier, progress, tiers = ["Blue","Silver","Gold","Platinum"] }: Props) {
  return (
    <div className="px-4 py-4">
      <div className="card-like p-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs text-gray-500">Status</div>
            <div className="text-lg font-semibold">{currentTier}</div>
          </div>
          <div className="text-right text-sm text-gray-500">As of 01 Dec 2025 you have 0 Tier Miles</div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            {tiers.map(t => (
              <div key={t} className="w-1/4 text-center">
                <div className={`mb-2 ${t === currentTier ? "font-semibold text-black" : ""}`}>{t}</div>
              </div>
            ))}
          </div>

          <div className="w-full h-2 rounded bg-gray-200 overflow-hidden">
            <div style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }} className="h-full" />
            {/* overlay gradient using inline style for the same accent */}
            <div style={{ width: `${Math.min(100, Math.round(progress * 100))}%`, height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg,#d81b60,#b91c1c)', position: 'relative', top: '-100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
