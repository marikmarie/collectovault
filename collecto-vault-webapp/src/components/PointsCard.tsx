//import React from "react";

type Props = {
  points: number;
  tier: string;
  expiry?: string;
}

export default function PointsCard({ points, tier, expiry }: Props) {
  return (
    <div className="px-4 -mt-6">
      <div className="card-like p-4">
        <div className="flex items-center">
          <div className="flex-1">
            <div className="text-2xl font-bold">{points.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Skywards Miles</div>
          </div>
          <div className="flex-1 text-right">
            <div className="text-xl font-semibold">{tier}</div>
            <div className="text-xs text-gray-500">Tier</div>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-3 rounded">
          {points} Skywards Miles are due to expire on {expiry}
        </div>
      </div>
    </div>
  );
}
