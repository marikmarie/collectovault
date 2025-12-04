// import React from "react";
import { NavLink } from "react-router-dom";

// const NavItem = ({ to, label }: { to: string; label: string }) => (
//   <NavLink to={to} className={({ isActive }) => `flex-1 py-2 text-center ${isActive ? 'text-[#d81b60] font-semibold' : 'text-gray-600'}`}>
//     <div className="text-sm">{label}</div>
//   </NavLink>
// );

// export default function BottomNav() {
//   return (
//     <nav className="bg-white rounded-xl shadow-lg flex overflow-hidden mx-4" style={{ height: 64 }}>
//       <NavItem to="/dashboard" label="Home" />
//       <NavItem to="/Buy-points" label="Buy-Points" />
//       <NavItem to="/transactions" label="Statements" />
//       <NavItem to="/points" label="Profile" />
//     </nav>
//   );
// }



export default function BottomNav() {
  const itemClass = (active: boolean) =>
    `flex-1 py-2 text-center ${active ? 'text-primary font-semibold' : 'text-gray-600'}`

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm flex">
      <NavLink to="/dashboard" className={({isActive})=> itemClass(isActive)}>
        <div className="text-xs">Home</div>
      </NavLink>
      <a className={itemClass(false)}>
        <div className="text-xs">Buy-Points</div>
      </a>
      <NavLink to="/statement" className={({isActive})=> itemClass(isActive)}>
        <div className="text-xs">Transactions</div>
      </NavLink>
      <a className={itemClass(false)}>
        <div className="text-xs">CollectoVault</div>
      </a>
    </nav>
  )
}
