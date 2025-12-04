// import React from "react";
import { Link } from "react-router-dom";

export default function TopNav() {
  return (
    <header className="w-full bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between h-16">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-[#0b4b78] flex items-center justify-center font-bold text-white shadow">
            C
          </div>
          <div className="text-2xl font-bold text-[#0b4b78]">Collecto Vault</div>
        </div>

        {/* <div className="flex items-center gap-4"> */}
          <div className="hidden lg:flex items-center gap-6 text-x1 text-gray-600">
            <Link to="/dashboard" className="hover:text-blue-500"> Dashboard</Link>
            <Link to="/statement" className="hover:text-blue-500" >Transactions</Link>
            <Link  to="/servicelist" className="hover:text-blue-500"> Services </Link>
            <Link  to="/admin" className="hover:text-blue-500"> Reports </Link>
        
          {/* </div> */}
        </div>

        <div className="flex items-center gap-3">
          <button className="text-sm px-3 py-1 rounded-md border border-gray-200">
            Help
          </button>
          <button className="text-sm px-3 py-1 rounded-md bg-[#d81b60] text-white">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
