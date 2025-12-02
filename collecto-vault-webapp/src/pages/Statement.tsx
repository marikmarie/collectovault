//import React from "react";
import { mockUser } from "../data/mockUser";
import BottomNav from "../components/BottomNav";

export default function Statement() {
  const ledger = mockUser.ledger;
  return (
    <div className="min-h-screen pb-20">
      <header className="p-4">
        <h2 className="text-xl font-semibold">Statements</h2>
      </header>

      <div className="p-4 space-y-3">
        {ledger.map(entry => (
          <div key={entry.id} className="bg-white p-3 rounded shadow-sm flex justify-between items-center">
            <div>
              <div className="font-medium">{entry.desc}</div>
              <div className="text-xs text-gray-500">{entry.date}</div>
            </div>
            <div className={`${entry.change >= 0 ? 'text-green-600' : 'text-red-600'} font-semibold`}>
              {entry.change >= 0 ? `+${entry.change}` : `${entry.change}`}
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}
