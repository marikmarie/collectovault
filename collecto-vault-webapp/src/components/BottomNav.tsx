// import React from "react";
import { NavLink } from "react-router-dom";

type Props = {
  onBuyPoints?: () => void; // optional callback to open the buy-points modal
};

export default function BottomNav({ onBuyPoints }: Props) {
  const itemClass = (active: boolean) =>
    `flex-1 py-2 text-center ${active ? "text-[#d81b60] font-semibold" : "text-gray-600"}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm flex">
      <NavLink to="/dashboard" className={({ isActive }) => itemClass(isActive)}>
        <div className="text-xs">Home</div>
      </NavLink>

      {/* Buy Points: call callback if provided, otherwise a no-op link */}
      <button
        onClick={() => onBuyPoints?.()}
        className={itemClass(false)}
        type="button"
        aria-label="Buy points"
      >
        <div className="text-xs">Buy-Points</div>
      </button>

      <NavLink to="/statement" className={({ isActive }) => itemClass(isActive)}>
        <div className="text-xs">Transactions</div>
      </NavLink>

      <NavLink to="/collectovault" className={({ isActive }) => itemClass(isActive)}>
        <div className="text-xs">CollectoVault</div>
      </NavLink>
    </nav>
  );
}
