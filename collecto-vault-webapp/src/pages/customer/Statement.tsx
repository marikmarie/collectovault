// src/pages/Statement.tsx


interface LedgerEntry {
  id: string | number;
  date: string; // e.g., "2025-11-20"
  desc: string; 
  change: number; 
  balance: number; // The running balance
}

// Defining a placeholder for mockUser to make the component runnable
const mockUser = {
  name: "Mariam Tukasingura",
  phone: "721 695 645",
  ledger: [
    {
      id: 1,
      date: "2025-11-20",
      desc: "Welcome Bonus",
      change: 2000,
      balance: 2000,
    },
    {
      id: 2,
      date: "2025-11-25",
      desc: "Dinner at Marriott",
      change: 500,
      balance: 2500,
    },
    {
      id: 3,
      date: "2025-12-01",
      desc: "Points Redemption",
      change: -800,
      balance: 1700,
    },
    {
      id: 4,
      date: "2025-12-03",
      desc: "Buy Points Package",
      change: 5000,
      balance: 6700,
    },
  ] as LedgerEntry[],
};

import BottomNav from "../../components/BottomNav";
import TopNav from "../../components/TopNav";

export default function Statement() {
  const ledger = mockUser.ledger;
  const currentBalance =
    ledger.length > 0 ? ledger[ledger.length - 1].balance : 0;

  return (
    <div className="min-h-screen pb-20 bg-gray-50 antialiased">
      <div className="hidden md:block">
        <TopNav />
      </div>
      <header className="bg-white p-4 shadow-sm border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Account Statement</h2>
        <div className="mt-2 text-sm text-gray-500">
          Current Points Balance:
          <span className="text-lg font-semibold text-gray-900 ml-2">
            {currentBalance.toLocaleString()} pts
          </span>
        </div>
      </header>

      {/* Statement Table Content */}
      <div className="p-4">
        {ledger.length > 0 ? (
          <StatementTable ledger={ledger} />
        ) : (
          <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm">
            No transactions found.
          </div>
        )}
      </div>

      <div className="md:hidden">
        <BottomNav />
      </div>
      
    </div>
  );
}

// --- StatementTable Component Implementation ---
// Note: In a real project, this would be in its own file (e.g., src/components/StatementTable.tsx)

interface StatementTableProps {
  ledger: LedgerEntry[];
}

function StatementTable({ ledger }: StatementTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        {/* Table Header */}
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
              Description
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Change (pts)
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Balance
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="bg-white divide-y divide-gray-100">
          {ledger
            .slice()
            .reverse()
            .map(
              (
                entry // Reverse to show latest first
              ) => (
                <tr
                  key={entry.id}
                  className="hover:bg-gray-50 transition duration-150 ease-in-out"
                >
                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-light text-gray-500">
                      {new Date(entry.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </div>
                  </td>

                  {/* Description */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {entry.desc}
                    </div>
                  </td>

                  {/* Change */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span
                      className={`text-sm font-semibold ${
                        entry.change > 0
                          ? "text-emerald-600"
                          : entry.change < 0
                          ? "text-red-600"
                          : "text-gray-500"
                      }`}
                    >
                      {entry.change > 0
                        ? `+${entry.change.toLocaleString()}`
                        : entry.change.toLocaleString()}
                    </span>
                  </td>

                  {/* Balance */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-800">
                      {entry.balance.toLocaleString()}
                    </div>
                  </td>
                </tr>
              )
            )}
        </tbody>
      </table>
    </div>
  );
}
