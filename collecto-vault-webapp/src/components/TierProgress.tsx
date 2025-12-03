// import React from "react";

type Props = { currentTier: string; progress: number; tiers?: string[] };

export default function TierProgress({ currentTier, progress, tiers = ["Blue", "Silver", "Gold", "Platinum"] }: Props) {
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <div className="px-2">
      <div className="card-like p-4 bg-white rounded-lg shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs text-gray-500">Status</div>
            <div className="text-lg font-semibold">{currentTier}</div>
          </div>
          <div className="text-right text-sm text-gray-500">As of 01 Dec 2025 you have 0 Tier Miles</div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            {tiers.map((t) => (
              <div key={t} className="w-1/4 text-center">
                <div className={`${t === currentTier ? "font-semibold text-black" : ""}`}>{t}</div>
              </div>
            ))}
          </div>

          <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.round(pct * 100)}%`,
                background: "linear-gradient(90deg, #d81b60, #ff6b6b)",
                transition: "width 400ms ease",
              }}
            />
          </div>

          <div className="mt-2 text-xs text-gray-600">{Math.round(pct * 100)}% to next tier</div>
        </div>
      </div>
    </div>
  );
}
