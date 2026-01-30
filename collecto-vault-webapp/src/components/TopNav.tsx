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
  Settings,
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
      <header className="hidden lg:block w-full bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div onClick={() => navigate("/dashboard")} className="cursor-pointer">
            <img src={theme.logoUrl ?? "logo.png"} alt="Logo" className="h-20 w-auto" />
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-8 text-sm font-medium text-gray-600">
            {[
              { name: "Dashboard", path: "/dashboard" },
              { name: "Statement", path: "/statement" },
              { name: "Offerings", path: "/services" },
            ].map(link => (
              <Link
                key={link.name}
                to={link.path}
                className={`hover:text-[#d81b60] ${
                  isActive(link.path) ? "text-[#d81b60] font-semibold" : ""
                }`}
              >
                {link.name}
              </Link>
            ))}
            <button onClick={() => openDrawer("help")} className="hover:text-[#d81b60]">
              Help
            </button>
          </nav>

          {/* Right */}
          <div className="flex items-center gap-4">
            <button onClick={() => openDrawer("notifications")} className="relative p-2">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#d81b60] rounded-full" />
            </button>

            {/* Profile Dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setIsWebDropdownOpen(!isWebDropdownOpen)}
                className="flex items-center gap-2 px-2 py-1 border rounded-full"
              >
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#d81b60] to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <Settings size={16} />
              </button>

              {isWebDropdownOpen && (
                <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-lg border py-1 z-50">
                  <div className="px-4 py-3 border-b bg-gray-50">
                    <p className="text-sm font-semibold">{userName}</p>
                    <p className="text-xs text-gray-500">{userEmail}</p>
                  </div>

                  <button onClick={() => openDrawer("profile")} className="menu-btn">
                    <User size={16} /> Profile & Settings
                  </button>
                  <button onClick={() => openDrawer("notifications")} className="menu-btn">
                    <Bell size={16} /> Notifications
                  </button>
                  <button onClick={() => openDrawer("help")} className="menu-btn">
                    <MessageCircle size={16} /> Help
                  </button>

                  <div className="border-t mt-1">
                    <button onClick={handleSignOut} className="menu-btn text-red-600">
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
      <header className="lg:hidden h-16 px-4 flex items-center justify-between bg-white sticky top-0 z-40">
        <img src={theme.logoUrl ?? "/logo.png"} className="h-10" />
        <div className="flex gap-3">
          <button onClick={() => openDrawer("notifications")}>
            <Bell size={20} />
          </button>
          <button
            onClick={() => openDrawer("profile")}
            className="w-9 h-9 rounded-full bg-linear-to-br from-[#d81b60] to-orange-500 text-white font-bold"
          >
            {initials}
          </button>
        </div>
      </header>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-30">
        <div className="flex justify-around h-16">
          <NavLinkMobile to="/dashboard" icon={<Home size={20} />} label="Home" active={isActive("/dashboard")} />
          <NavLinkMobile to="/statement" icon={<CreditCard size={20} />} label="Statement" active={isActive("/statement")} />
          <NavLinkMobile to="/services" icon={<Box size={20} />} label="Offerings" active={isActive("/services")} />
          <button onClick={() => openDrawer("help")} className="nav-btn">
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
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="w-full max-w-md bg-white h-full p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold capitalize">{view}</h2>
          <button onClick={onClose}><X /></button>
        </div>

        {view === "profile" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold">
                {initials}
              </div>
              <h3 className="font-semibold mt-2">{userName}</h3>
              <p className="text-sm text-gray-500">{userEmail}</p>
            </div>

            <button className="drawer-btn"><Mail /> Update Username</button>
            <button className="drawer-btn"><Key /> Change Password</button>

            <button onClick={handleSignOut} className="drawer-btn text-red-600">
              <LogOut /> Sign Out
            </button>
          </div>
        )}

        {view === "help" && <p className="text-sm text-gray-600">Support is available 24/7.</p>}
        {view === "notifications" && <p className="text-sm text-gray-500">No notifications</p>}
      </div>
    </div>
  );
}
