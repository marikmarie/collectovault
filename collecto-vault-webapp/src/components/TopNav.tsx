import { useState, useRef, useEffect, useMemo } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { clearVaultOtpToken } from "../api";
import {
  X,
  Home,
  CreditCard,
  Box,
  User,
  LogOut,
  Bell,
  MessageCircle,
  Key,
  Mail,
} from "lucide-react";

// --- Types ---
type DrawerView = "profile" | "notifications" | "help" | null;

export default function TopNav() {
  const [drawerView, setDrawerView] = useState<DrawerView>(null);
  const [isWebDropdownOpen, setIsWebDropdownOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { theme } = useTheme();

  // ---- USER DATA (from localStorage) ----
  const userName = localStorage.getItem("userName") || "User";
  const userEmail = localStorage.getItem("userEmail") || "";

  const initials = useMemo(() => {
    return userName
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [userName]);

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsWebDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = () => {
    try {
      clearVaultOtpToken();
    } catch {
      sessionStorage.removeItem("vaultOtpToken");
      sessionStorage.removeItem("vaultOtpExpiresAt");
    }
    navigate("/login");
  };

  const openDrawer = (view: DrawerView) => {
    setDrawerView(view);
    setIsWebDropdownOpen(false);
  };

  return (
    <>
      {/* ================= DESKTOP HEADER ================= */}
      <header className="hidden lg:block w-full bg-linear-to-r from-white via-white to-gray-50 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div onClick={() => navigate("/dashboard")} className="cursor-pointer hover:opacity-80 transition-opacity">
            <img src={theme.logoUrl ?? "logo.png"} alt="Logo" className="h-20 w-auto" />
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-12 text-sm font-medium">
            {[
              { name: "Dashboard", path: "/dashboard" },
              { name: "Statement", path: "/statement" },
              { name: "Offerings", path: "/services" },
            ].map(link => (
              <Link
                key={link.name}
                to={link.path}
                className={`relative py-2 transition-colors ${
                  isActive(link.path)
                    ? "text-[#d81b60] font-semibold"
                    : "text-gray-700 hover:text-[#d81b60]"
                } ${isActive(link.path) ? "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#d81b60] after:rounded-full" : ""}`}
              >
                {link.name}
              </Link>
            ))}
            <button 
              onClick={() => openDrawer("help")} 
              className="relative py-2 text-gray-700 hover:text-[#d81b60] transition-colors"
            >
              Help
            </button>
          </nav>

          {/* Right */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => openDrawer("notifications")} 
              className="relative p-2 text-gray-700 hover:text-[#d81b60] transition-colors rounded-lg hover:bg-gray-100"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#d81b60] rounded-full shadow-lg" />
            </button>

            {/* Profile Dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setIsWebDropdownOpen(!isWebDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-full hover:bg-gray-100 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#d81b60] to-pink-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {initials}
                </div>
                <span className="text-sm font-medium text-gray-700">{userName.split(' ')[0]}</span>
              </button>

              {isWebDropdownOpen && (
                <div className="absolute right-0 top-12 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in duration-150">
                  <div className="px-5 py-4 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white rounded-t-2xl">
                    <p className="text-sm font-semibold text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{userEmail}</p>
                  </div>

                  <button onClick={() => openDrawer("profile")} className="w-full text-left px-5 py-2.5 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm">
                    <User size={16} className="text-gray-400" /> Profile & Settings
                  </button>
                  <button onClick={() => openDrawer("notifications")} className="w-full text-left px-5 py-2.5 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm">
                    <Bell size={16} className="text-gray-400" /> Notifications
                  </button>
                  <button onClick={() => openDrawer("help")} className="w-full text-left px-5 py-2.5 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm">
                    <MessageCircle size={16} className="text-gray-400" /> Help & Support
                  </button>

                  <div className="border-t border-gray-100 mt-1">
                    <button onClick={handleSignOut} className="w-full text-left px-5 py-2.5 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium">
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================= MOBILE HEADER ================= */}
      <header className="lg:hidden h-16 px-4 flex items-center justify-between bg-linear-to-r from-white via-white to-gray-50 sticky top-0 z-40 shadow-sm">
        <img src={theme.logoUrl ?? "/logo.png"} className="h-10" />
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => openDrawer("notifications")}
            className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#d81b60] rounded-full" />
          </button>
          <button
            onClick={() => openDrawer("profile")}
            className="w-9 h-9 rounded-full bg-linear-to-br from-[#d81b60] to-pink-400 text-white font-bold text-sm shadow-sm hover:shadow-md transition-shadow"
          >
            {initials}
          </button>
        </div>
      </header>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg z-30 border-t border-gray-100">
        <div className="flex justify-around h-16">
          <NavLinkMobile to="/dashboard" icon={<Home size={20} />} label="Home" active={isActive("/dashboard")} />
          <NavLinkMobile to="/statement" icon={<CreditCard size={20} />} label="Statement" active={isActive("/statement")} />
          <NavLinkMobile to="/services" icon={<Box size={20} />} label="Offerings" active={isActive("/services")} />
          <button onClick={() => openDrawer("help")} className="nav-btn text-gray-600 hover:text-[#d81b60]">
            <MessageCircle size={20} />
            <span>Help</span>
          </button>
        </div>
      </nav>

      {/* ================= DRAWER ================= */}
      <SideDrawer
        isOpen={!!drawerView}
        onClose={() => setDrawerView(null)}
        view={drawerView}
        handleSignOut={handleSignOut}
        userName={userName}
        userEmail={userEmail}
        initials={initials}
      />
    </>
  );
}

// ---------------- SUB COMPONENTS ----------------

function NavLinkMobile({ to, icon, label, active }: any) {
  return (
    <Link to={to} className={`nav-btn ${active ? "text-[#d81b60]" : ""}`}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function SideDrawer({ isOpen, onClose, view, handleSignOut, userName, userEmail, initials }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="w-full max-w-md bg-white h-full p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-lg capitalize text-gray-900">{view}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"><X size={20} /></button>
        </div>

        {view === "profile" && (
          <div className="space-y-6">
            <div className="flex flex-col items-center py-4">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-[#d81b60] to-pink-400 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                {initials}
              </div>
              <h3 className="font-semibold mt-4 text-lg text-gray-900">{userName}</h3>
              <p className="text-sm text-gray-500 mt-1">{userEmail}</p>
            </div>

            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 font-medium">
                <Mail size={18} className="text-[#d81b60]" /> Update Username
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 font-medium">
                <Key size={18} className="text-[#d81b60]" /> Change Password
              </button>
            </div>

            <div className="border-t pt-4">
              <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-red-600 font-medium">
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </div>
        )}

        {view === "help" && (
          <div className="space-y-4">
            <div className="bg-linear-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2">24/7 Support Available</h3>
              <p className="text-sm text-gray-700">Have questions? Our support team is here to help you anytime.</p>
            </div>
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-600 font-medium">
              <Mail size={18} /> Contact Support
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-600 font-medium">
              <MessageCircle size={18} /> FAQ
            </button>
          </div>
        )}

        {view === "notifications" && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No new notifications</p>
            <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
