import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Home,
  CreditCard,
  Box,
  User,
  LogOut,
  Settings,
  Bell,
  HelpCircle,
 
} from "lucide-react";

export default function TopNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);

  // Local profile form state (example, replace with real data/handlers)
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  function handleSignOut() {
    // TODO: wire up real sign out
    console.log("sign out");
    navigate("/login");
  }

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    // TODO: send to API
    console.log("save profile", { username, email });
    setIsProfileOpen(false);
  }

  function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    console.log("change pw", { currentPassword, newPassword });
    setShowChangePw(false);
    setIsProfileOpen(false);
  }

  return (
    <>
      {/* Top header for desktop */}
      <header className="w-full bg-white shadow sticky top-0 z-50 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={"/logo.png"} alt="CollectoVault" className="h-12 w-auto" />
            <div className="text-lg font-semibold">CollectoVault</div>
          </div>

          <nav className="flex items-center gap-6 text-base text-gray-700 font-medium">
            <Link to="/dashboard" className="hover:text-[#d81b60] transition-colors">Dashboard</Link>
            <Link to="/statement" className="hover:text-[#d81b60] transition-colors">Transactions</Link>
            <Link to="/services" className="hover:text-[#d81b60] transition-colors">Services</Link>
            <Link to="/reports" className="hover:text-[#d81b60] transition-colors">Reports</Link>
          </nav>

          <div className="flex items-center gap-3">
            <button className="text-sm px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-50">Help</button>
            <button onClick={handleSignOut} className="text-sm px-3 py-1 rounded-full bg-[#d81b60] text-white font-medium">Sign out</button>
          </div>
        </div>
      </header>

      {/* Top header for mobile - simplified with menu button */}
      <header className="w-full bg-white shadow sticky top-0 z-50 lg:hidden">
        <div className="w-full px-4 py-2 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <img src={"/logo.png"} alt="logo" className="h-10 w-auto" />
            <div className="font-medium">CollectoVault</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
              onClick={() => setIsMenuOpen((s) => !s)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Collapsible mobile menu (optional) */}
        <div className={`lg:hidden overflow-hidden transition-all duration-200 ${isMenuOpen ? "max-h-60 py-2" : "max-h-0"}`}>
          <nav className="flex flex-col px-4 space-y-1">
            <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="block py-2 rounded-md">Dashboard</Link>
            <Link to="/statement" onClick={() => setIsMenuOpen(false)} className="block py-2 rounded-md">Transactions</Link>
            <Link to="/services" onClick={() => setIsMenuOpen(false)} className="block py-2 rounded-md">Services</Link>
            <Link to="/reports" onClick={() => setIsMenuOpen(false)} className="block py-2 rounded-md">Reports</Link>
          </nav>
        </div>
      </header>

      {/* Main content wrapper - push padding bottom so page isn't hidden behind fixed bottom nav */}
      <div className="pb-20">{/* page content should go here (children) */}</div>

      {/* Mobile Bottom Navigation (fixed) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md lg:hidden z-50">
        <div className="max-w-7xl mx-auto px-2 flex justify-between items-center h-16">
          <button
            onClick={() => { setActiveTab("dashboard"); navigate("/dashboard"); }}
            className={`flex-1 flex flex-col items-center justify-center py-1 ${activeTab === "dashboard" ? "text-[#d81b60]" : "text-gray-600"}`}
            aria-label="Dashboard"
          >
            <Home size={20} />
            <span className="text-xs mt-0.5">Home</span>
          </button>

          <button
            onClick={() => { setActiveTab("transactions"); navigate("/statement"); }}
            className={`flex-1 flex flex-col items-center justify-center py-1 ${activeTab === "transactions" ? "text-[#d81b60]" : "text-gray-600"}`}
            aria-label="Transactions"
          >
            <CreditCard size={20} />
            <span className="text-xs mt-0.5">Transactions</span>
          </button>

          <button
            onClick={() => { setActiveTab("services"); navigate("/services"); }}
            className={`flex-1 flex flex-col items-center justify-center py-1 ${activeTab === "services" ? "text-[#d81b60]" : "text-gray-600"}`}
            aria-label="Services"
          >
            <Box size={20} />
            <span className="text-xs mt-0.5">Services</span>
          </button>

          <button
            onClick={() => { setActiveTab("profile"); setIsProfileOpen(true); }}
            className={`flex-1 flex flex-col items-center justify-center py-1 ${activeTab === "profile" ? "text-[#d81b60]" : "text-gray-600"}`}
            aria-label="Profile"
          >
            <User size={20} />
            <span className="text-xs mt-0.5">Profile</span>
          </button>
        </div>
      </nav>

      {/* Profile bottom sheet (mobile) */}
      <div className={`fixed inset-0 z-50 ${isProfileOpen ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!isProfileOpen}>

        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${isProfileOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsProfileOpen(false)}
        />

        <div className={`absolute left-0 right-0 bottom-0 bg-white rounded-t-xl shadow-xl transition-transform ${isProfileOpen ? "translate-y-0" : "translate-y-full"}`}>
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center font-medium">KS</div>
              <div>
                <div className="font-semibold">Kwikiriza Samson</div>
                <div className="text-xs text-gray-500">+256 7xx xxx xxx</div>
              </div>
            </div>
            <button onClick={() => setIsProfileOpen(false)} className="p-2 rounded-md">
              <X size={18} />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <button onClick={() => { /* go to notifications */ }} className="w-full flex items-center gap-3 py-2 rounded-md hover:bg-gray-50">
              <Bell size={18} />
              <span>Notifications</span>
            </button>

            <button onClick={() => { /* help */ }} className="w-full flex items-center gap-3 py-2 rounded-md hover:bg-gray-50">
              <HelpCircle size={18} />
              <span>Help & Support</span>
            </button>

            <button onClick={() => { /* settings route */ }} className="w-full flex items-center gap-3 py-2 rounded-md hover:bg-gray-50">
              <Settings size={18} />
              <span>Account Settings</span>
            </button>

            <div className="border rounded-md overflow-hidden">
              <form onSubmit={saveProfile} className="p-3 space-y-3">
                <div className="text-sm font-medium">Profile</div>
                <label className="block text-xs text-gray-600">Username</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Create or edit username" className="w-full border px-3 py-2 rounded-md text-sm" />

                <label className="block text-xs text-gray-600">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full border px-3 py-2 rounded-md text-sm" />

                <div className="flex gap-2">
                  <button type="submit" className="flex-1 px-3 py-2 rounded-md bg-[#d81b60] text-white">Save</button>
                  <button type="button" onClick={() => setShowChangePw((s) => !s)} className="flex-1 px-3 py-2 rounded-md border">Change password</button>
                </div>
              </form>

              {showChangePw && (
                <form onSubmit={changePassword} className="p-3 border-t space-y-2">
                  <label className="block text-xs text-gray-600">Current password</label>
                  <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" className="w-full border px-3 py-2 rounded-md text-sm" />

                  <label className="block text-xs text-gray-600">New password</label>
                  <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" className="w-full border px-3 py-2 rounded-md text-sm" />

                  <label className="block text-xs text-gray-600">Confirm password</label>
                  <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" className="w-full border px-3 py-2 rounded-md text-sm" />

                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 px-3 py-2 rounded-md bg-[#d81b60] text-white">Update password</button>
                    <button type="button" onClick={() => setShowChangePw(false)} className="flex-1 px-3 py-2 rounded-md border">Cancel</button>
                  </div>
                </form>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={handleSignOut} className="flex-1 px-3 py-2 rounded-md border flex items-center justify-center gap-2">
                <LogOut size={16} /> Sign out
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
