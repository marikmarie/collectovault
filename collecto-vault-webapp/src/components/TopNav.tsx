// import React from "react";
import { NavLink } from "react-router-dom";

export default function TopNav() {
  return (
    <nav className="w-full bg-white shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold text-[#0b4b78]">Collecto Vault</div>
          <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600">
            <NavLink to="/dashboard" className={({isActive}) => isActive ? 'text-[#d81b60] font-semibold' : ''}>Dashboard</NavLink>
            <NavLink to="/transactions" className={({isActive}) => isActive ? 'text-[#d81b60] font-semibold' : ''}>Transactions</NavLink>
            <NavLink to="/admin" className={({isActive}) => isActive ? 'text-[#d81b60] font-semibold' : ''}>Admin</NavLink>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="text-sm px-3 py-1 rounded-md border border-gray-200">Help</button>
          <button className="text-sm px-3 py-1 rounded-md bg-[#d81b60] text-white">Sign out</button>
        </div>
      </div>
    </nav>
  );
}
