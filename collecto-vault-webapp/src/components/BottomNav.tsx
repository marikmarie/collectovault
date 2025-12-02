//mport React from "react";
import { NavLink } from "react-router-dom";

const NavItem = ({ to, label }: { to: string; label: string }) => (
  <NavLink to={to} className={({ isActive }) => `flex-1 py-2 text-center ${isActive ? 'text-[#d81b60] font-semibold' : 'text-gray-600'}`}>
    <div className="text-sm">{label}</div>
  </NavLink>
);

export default function BottomNav() {
  return (
    <nav className="fixed bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg flex overflow-hidden" style={{ height: 64 }}>
      <NavItem to="/dashboard" label="Home" />
      <NavItem to="/book" label="Buy-points" />
      <NavItem to="/trips" label="Statement" />
      <NavItem to="/points" label="Profile" />
    </nav>
  );
}
