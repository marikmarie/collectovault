import { useState, useRef, useEffect, useMemo } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { clearVaultOtpToken } from "../api";
import { useTriggerFeedback, useChatModal } from "../hooks/useFeedback";
import SetUsernameModal from "./SetUsernameModal";
import { customerService } from "../api/customer";
import {
  X,
  Home,
  CreditCard,
  Box,
  User,
  LogOut,
  Bell,
  MessageCircle,
  Mail,
} from "lucide-react";

// --- Types ---
type DrawerView = "profile" | "notifications" | "help" | null;

export default function TopNav() {
  const [drawerView, setDrawerView] = useState<DrawerView>(null);
  const [isWebDropdownOpen, setIsWebDropdownOpen] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [displayName, setDisplayName] = useState<string>("");
  const [storedUsername, setStoredUsername] = useState<string>("");

  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Feedback hooks
  const triggerFeedback = useTriggerFeedback();
  const openChat = useChatModal();

  const { theme } = useTheme();

  // Fetch loyalty settings data
  const fetchLoyaltySettings = async () => {
    const clientId = localStorage.getItem("clientId");
    const collectoId = localStorage.getItem("collectoId");

    if (!clientId || !collectoId) return;

    try {
      const customerRes = await customerService.getCustomerData(collectoId, clientId);
      const loyaltySettings = customerRes.data?.data?.loyaltySettings ?? {};

      const loyaltyNameFromSettings =
        typeof loyaltySettings?.name === "string" && loyaltySettings.name.trim()
          ? loyaltySettings.name.trim()
          : undefined;
      setDisplayName(loyaltyNameFromSettings || "");

      const usernameFromSettings =
        typeof loyaltySettings?.username === "string" && loyaltySettings.username.trim()
          ? loyaltySettings.username.trim()
          : undefined;
      setStoredUsername(usernameFromSettings || "");

      // Store the data in localStorage for persistence
      if (loyaltyNameFromSettings) {
        localStorage.setItem("name", loyaltyNameFromSettings);
      }
      if (usernameFromSettings) {
        localStorage.setItem("userName", usernameFromSettings);
      }
    } catch (err) {
      console.error("Error fetching loyalty settings:", err);
      // Fallback to localStorage if API fails
      const storedName = localStorage.getItem("name");
      const storedUsername = localStorage.getItem("userName");
      setDisplayName(storedName || "");
      setStoredUsername(storedUsername || "");
    }
  };

  // ---- USER DATA (from localStorage initially, then updated from API) ----
  const userDisplayName = displayName || localStorage.getItem("name") || localStorage.getItem("userName") || "User Account";
  // refreshCounter triggers re-render after username update

  const initials = useMemo(() => {
    return userDisplayName
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [userDisplayName, refreshCounter]);

  // Fetch data on mount and when refreshCounter changes
  useEffect(() => {
    fetchLoyaltySettings();
  }, [refreshCounter]);

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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
    <header className="hidden lg:block w-full bg-white sticky top-0 z-40 border-b border-gray-100">
  <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
    <div onClick={() => navigate('/dashboard')} className="flex items-center gap-2 cursor-pointer">
      <img src={theme.logoUrl ?? '/logo.png'} alt="Logo" className="h-8 w-auto" />
    </div>
    <nav className="flex items-center gap-8 text-sm font-medium">

          {/* Nav */}
          {/* <nav className="flex items-center gap-12 text-sm font-medium"> */}
            {[
              { name: "Dashboard", path: "/dashboard" },
              { name: "Statement", path: "/statement" },
              { name: "Services", path: "/services" },
            ].map((link) => (
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
          {/* <div className="flex items-center gap-6"> */}
             <div className="flex items-center gap-3">
            <button
              onClick={() => openDrawer("notifications")}
              className="relative p-2 text-gray-700 hover:text-[#d81b60] transition-colors rounded-lg hover:bg-gray-100"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#d81b60] rounded-full shadow-lg" />
            </button>

{/* 
 <div
        onClick={() => setIsWebDropdownOpen(!isWebDropdownOpen)}
        className="w-8 h-8 rounded-full bg-[#fce4ec] border border-[#d81b60] flex items-center justify-center text-[#d81b60] text-xs font-bold cursor-pointer"
      ></div> */}
            {/* Profile Dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setIsWebDropdownOpen(!isWebDropdownOpen)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all duration-200 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#d81b60] to-pink-400 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                  {initials}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {userDisplayName.split(" ")[0]}
                </span>
              </button>

              {isWebDropdownOpen && (
                <div className="absolute right-0 top-12 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in duration-150">
                  <div className="px-5 py-4 border-b border-gray-100 bg-white rounded-t-2xl">
                    <p className="text-sm font-semibold text-gray-900">
                      {userDisplayName}
                    </p>
                  </div>

                  <button
                    onClick={() => openDrawer("profile")}
                    className="w-full text-left px-5 py-2.5 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                  >
                    <User size={16} className="text-gray-400" /> Profile &
                    Settings
                  </button>
                  <button
                    onClick={() => openDrawer("notifications")}
                    className="w-full text-left px-5 py-2.5 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Bell size={16} className="text-gray-400" /> Notifications
                  </button>
                  <button
                    onClick={() => openDrawer("help")}
                    className="w-full text-left px-5 py-2.5 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                  >
                    <MessageCircle size={16} className="text-gray-400" /> Help &
                    Support
                  </button>

                  <div className="border-t border-gray-100 mt-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-5 py-2.5 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <header className="lg:hidden h-16 px-4 flex items-center justify-between bg-white sticky top-0 z-40 shadow-sm">
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
          <NavLinkMobile
            to="/dashboard"
            icon={<Home size={20} />}
            label="Home"
            active={isActive("/dashboard")}
          />
          <NavLinkMobile
            to="/statement"
            icon={<CreditCard size={20} />}
            label="Statement"
            active={isActive("/statement")}
          />
          <NavLinkMobile
            to="/services"
            icon={<Box size={20} />}
            label="Services"
            active={isActive("/services")}
          />
          <button
            onClick={() => openDrawer("help")}
            className="nav-btn text-gray-600 hover:text-[#d81b60]"
          >
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
        userName={userDisplayName}
        storedUsername={storedUsername}
        initials={initials}
        onOpenUsernameModal={() => setShowUsernameModal(true)}
        triggerFeedback={triggerFeedback}
        openChat={openChat}
      />

      <SetUsernameModal
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        onSuccess={() => {
          setShowUsernameModal(false);
          setRefreshCounter(c => c + 1);
        }}
        existingUsername={storedUsername || undefined}
        displayName={displayName || undefined}
      />
    </>
  );
}

function NavLinkMobile({ to, icon, label, active }: any) {
  return (
    <Link to={to} className={`nav-btn ${active ? "text-[#d81b60]" : ""}`}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function SideDrawer({
  isOpen,
  onClose,
  view,
  handleSignOut,
  userName,
  storedUsername,
  initials,
  onOpenUsernameModal,
  triggerFeedback,
  openChat,
}: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-transparent cursor-pointer"
        onClick={onClose}
      />

      <div className="w-full max-w-md bg-white h-full p-6 overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-lg capitalize text-gray-900">{view}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {view === "profile" && (
          <div className="space-y-6">
            <div className="flex flex-col items-center py-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 shadow-lg">
                {initials || "U"}
              </div>
              <h3 className="font-semibold mt-4 text-lg text-gray-900">
                {userName || "Your Name"}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {storedUsername ? `@${storedUsername}` : "Username"}
              </p>
            </div>

            <div className="space-y-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <button
                onClick={() => {
                  onOpenUsernameModal();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-linear-to-r from-[#d81b60] to-pink-500 hover:from-[#c41555] hover:to-pink-600 rounded-lg transition-all text-white font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Mail size={18} /> Set/Update Username
              </button>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 rounded-lg transition-all text-white font-semibold shadow-md hover:shadow-lg"
              >
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </div>
        )}

        {view === "help" && (
          <div className="space-y-4">
            <div className="p-6 rounded-xl">
              <h3 className="font-bold text-gray-900 mb-2 text-lg">
                💬 24/7 Support Available
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Have questions? Our support team is here to help you anytime.
              </p>
            </div>
            <button 
              onClick={() => {
                triggerFeedback('general');
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg transition-all text-white font-semibold shadow-md hover:shadow-lg"
            >
              <Mail size={18} /> Send Feedback
            </button>
            <button 
              onClick={() => {
                openChat();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all text-white font-semibold shadow-md hover:shadow-lg"
            >
              <MessageCircle size={18} /> Live Chat Support
            </button>
          </div>
        )}

        {view === "notifications" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Bell size={24} className="text-gray-600" />
              </div>
              <p className="text-gray-600 font-medium">All caught up!</p>
              <p className="text-sm text-gray-500 mt-2">You have no new notifications right now.</p>
            </div>
            
            <div className="border-t pt-4 mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Notification Settings</h3>
              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm text-gray-700">Email notifications</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm text-gray-700">Order updates</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm text-gray-700">Promotional offers</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
