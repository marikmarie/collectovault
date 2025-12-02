//import React from "react";
import { NavLink } from "react-router-dom";

export default function BottomNav() {
  const itemClass = (active: boolean) =>
    `flex-1 py-2 text-center ${active ? 'text-primary font-semibold' : 'text-gray-600'}`

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm flex">
      <NavLink to="/dashboard" className={({isActive})=> itemClass(isActive)}>
        <div className="text-xs">Home</div>
      </NavLink>
      <a className={itemClass(false)}>
        <div className="text-xs">BuyPoints</div>
      </a>
      <NavLink to="/statement" className={({isActive})=> itemClass(isActive)}>
        <div className="text-xs">My Trips</div>
      </NavLink>
      <a className={itemClass(false)}>
        <div className="text-xs">Profile</div>
      </a>
    </nav>
  )
}
