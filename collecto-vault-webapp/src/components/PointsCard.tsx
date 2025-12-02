// import React from "react";

type Props = { points: number; tier: string; expiry?: string; };

export default function PointsCard({ points, tier, expiry }: Props) {
  return (
    <div className="px-4 -mt-8">
      <div className="card-like p-4">
        <div className="flex items-center">
          <div className="flex-1">
            <div className="text-3xl font-extrabold">{points.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">Skywards Miles</div>
          </div>

          <div className="flex-1 text-right">
            <div className="text-2xl font-semibold">{tier}</div>
            <div className="text-xs text-gray-500 mt-1">Tier</div>
            <div className="mt-2 w-28 mx-auto">
              <div className="accent-underline" />
            </div>
          </div>
        </div>

        <div className="mt-4 bg-gray-50 p-3 rounded text-sm text-gray-600">
          {points.toLocaleString()} Skywards Miles are due to expire on <strong>{expiry}</strong>
        </div>
      </div>
    </div>
  );
}
