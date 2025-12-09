import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react"; // Assuming you have lucide-react or similar icons


export default function TopNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white shadow-lg sticky top-0 z-50">
      {/* Full-width container (removed max-width) */}
      <div className="w-full px-4 py-3 flex items-center justify-between h-16">
        {/* Logo Section */}
        <div className="flex items-center gap-4">
          {/* <div className="w-9 h-9 rounded-lg bg-[#0b4b78] flex items-center justify-center font-extrabold text-white shadow-md">
            C
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-[#0b4b78] tracking-tight">
            Collecto Vault
          </div> */}
          <img 
          src = {"logo.png"}
          alt="CollectoVaultlogo"
          className="h-14 w-auto"
          />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-base text-gray-700 font-medium">
          <Link
            to="/dashboard"
            className="hover:text-[#d81b60] transition-colors py-1 border-b-2 border-transparent hover:border-[#d81b60]"
          >
            Dashboard
          </Link>
          <Link
            to="/statement"
            className="hover:text-[#d81b60] transition-colors py-1 border-b-2 border-transparent hover:border-[#d81b60]"
          >
            Transactions
          </Link>
          <Link
            to="/services"
            className="hover:text-[#d81b60] transition-colors py-1 border-b-2 border-transparent hover:border-[#d81b60]"
          >
            Services
          </Link>
          <Link
            to="/reports"
            className="hover:text-[#d81b60] transition-colors py-1 border-b-2 border-transparent hover:border-[#d81b60]"
          >
            Reports
          </Link>
        </nav>

        {/* Buttons and Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <button className="hidden sm:inline-flex text-sm px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors">
            Help
          </button>
          <button className="text-sm px-3 py-1 rounded-full bg-[#d81b60] text-white font-medium hover:bg-[#c01754] transition-colors shadow-md">
            Sign out
          </button>

          {/* Mobile Menu Button (Hamburger) */}
          <button
            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown (Collapsible) */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? "max-h-96 opacity-100 py-2" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col px-4 space-y-2">
          <Link
            to="/dashboard"
            className="block py-2 text-gray-700 hover:bg-gray-50 rounded-md"
            onClick={() => setIsMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            to="/statement"
            className="block py-2 text-gray-700 hover:bg-gray-50 rounded-md"
            onClick={() => setIsMenuOpen(false)}
          >
            Transactions
          </Link>
          <Link
            to="/services"
            className="block py-2 text-gray-700 hover:bg-gray-50 rounded-md"
            onClick={() => setIsMenuOpen(false)}
          >
            Services
          </Link>
          <Link
            to="/reports"
            className="block py-2 text-gray-700 hover:bg-gray-50 rounded-md"
            onClick={() => setIsMenuOpen(false)}
          >
            Reports
          </Link>
        </nav>
      </div>
    </header>
  );
}