import { useState, useRef, useEffect } from "react";
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
  Send,
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
    } catch (e) {
      sessionStorage.removeItem('vaultOtpToken');
      sessionStorage.removeItem('vaultOtpExpiresAt');
    }
    navigate("/login");
  };

  const openDrawer = (view: DrawerView) => {
    setDrawerView(view);
    setIsWebDropdownOpen(false);
  };

  return (
    <>
      {/* ==========================================
          1. DESKTOP HEADER
          ========================================== */}
      <header className="hidden lg:block w-full bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <img src="/logo.png" alt="Logo" className="h-20 w-auto" />
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-8 text-sm font-medium text-gray-600">
            {[
              { name: "Dashboard", path: "/dashboard" },
              { name: "Statement", path: "/statement" },
              { name: "Offerings", path: "/services" },
            ].map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`transition-colors hover:text-[#d81b60] ${
                  isActive(link.path) ? "text-[#d81b60] font-semibold" : ""
                }`}
              >
                {link.name}
              </Link>
            ))}
            {/* Help Button replaces Reports */}
            <button 
              onClick={() => openDrawer('help')}
              className="transition-colors hover:text-[#d81b60] font-medium"
            >
              Help
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => openDrawer('notifications')}
              className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#d81b60] rounded-full border border-white"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsWebDropdownOpen(!isWebDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#d81b60] to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                  KS
                </div>
                <Settings size={16} className="text-gray-500 mr-1" />
              </button>

              {isWebDropdownOpen && (
                <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                    <p className="text-sm font-semibold text-gray-900">Samson K.</p>
                    <p className="text-xs text-gray-500">samson@example.com</p>
                  </div>
                  
                  <div className="p-1">
                    <button onClick={() => openDrawer('profile')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center gap-2">
                      <User size={16} /> Profile & Settings
                    </button>
                    <button onClick={() => openDrawer('notifications')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center gap-2">
                      <Bell size={16} /> Notifications
                    </button>
                    <button onClick={() => openDrawer('help')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center gap-2">
                      <MessageCircle size={16} /> Help & Support
                    </button>
                  </div>
                  
                  <div className="border-t border-gray-50 p-1 mt-1">
                    <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2">
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ==========================================
          2. MOBILE HEADER
          ========================================== */}
      <header className="lg:hidden w-full bg-white shadow-sm sticky top-0 z-40 h-16 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <img src="/logo.png" alt="logo" className="h-10 w-auto" />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => openDrawer('notifications')} className="p-2 text-gray-500">
             <Bell size={20} />
          </button>
          <button 
            onClick={() => openDrawer('profile')}
            className="w-9 h-9 rounded-full bg-linear-to-br from-[#d81b60] to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-sm"
          >
            KS
          </button>
        </div>
      </header>

      {/* ==========================================
          3. MOBILE BOTTOM NAV
          ========================================== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-30">
        <div className="flex justify-around items-center h-16">
          <NavLinkMobile to="/dashboard" icon={<Home size={20} />} label="Home" active={isActive('/dashboard')} />
          <NavLinkMobile to="/statement" icon={<CreditCard size={20} />} label="Statement" active={isActive('/statement')} />
          <NavLinkMobile to="/services" icon={<Box size={20} />} label="Offerings" active={isActive('/services')} />
          
          <button 
            onClick={() => openDrawer('help')}
            className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500"
          >
            <MessageCircle size={20} />
            <span className="text-[10px] font-medium">Help</span>
          </button>
        </div>
      </nav>

      {/* ==========================================
          4. SIDE DRAWER & MODALS
          ========================================== */}
      <SideDrawer 
        isOpen={!!drawerView} 
        onClose={() => setDrawerView(null)} 
        view={drawerView}
        handleSignOut={handleSignOut}
      />
    </>
  );
}

// --- Sub-Components ---

function NavLinkMobile({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
        active ? "text-[#d81b60]" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}

function Modal({ title, children, isOpen, onClose }: { title: string; children: React.ReactNode; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function UpdateUsernameModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [username, setUsername] = useState("KwikirizaSamson");
  return (
    <Modal title="Update Username" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Username</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#d81b60] outline-none"
          />
        </div>
        <button onClick={onClose} className="w-full bg-[#d81b60] text-white py-2 rounded-lg text-sm font-medium hover:opacity-90">
          Save Changes
        </button>
      </div>
    </Modal>
  );
}

function ChangePasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal title="Change Password" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <input type="password" placeholder="Current Password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
        <input type="password" placeholder="New Password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
        <button onClick={onClose} className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium">
          Update Password
        </button>
      </div>
    </Modal>
  );
}

function SideDrawer({ isOpen, onClose, view, handleSignOut }: { isOpen: boolean; onClose: () => void; view: DrawerView; handleSignOut: () => void }) {
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800 capitalize">{view?.replace('-', ' ')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {view === 'profile' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center py-4">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500 mb-3">KS</div>
                <h3 className="font-semibold text-lg">Kwikiriza Samson</h3>
                <p className="text-gray-500 text-sm">samson@collectovault.com</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <button onClick={() => setIsUsernameModalOpen(true)} className="w-full text-left px-4 py-3 text-sm text-gray-700 bg-white rounded-lg flex items-center justify-between shadow-sm border border-gray-200">
                  <span className="flex items-center gap-3 font-medium"><Mail size={18} className="text-[#d81b60]" /> Update Username</span>
                  <Settings size={16} className="text-gray-400" />
                </button>
                <button onClick={() => setIsPasswordModalOpen(true)} className="w-full text-left px-4 py-3 text-sm text-gray-700 bg-white rounded-lg flex items-center justify-between shadow-sm border border-gray-200">
                  <span className="flex items-center gap-3 font-medium"><Key size={18} className="text-gray-900" /> Change Password</span>
                  <Settings size={16} className="text-gray-400" />
                </button>
              </div>

              <button onClick={handleSignOut} className="w-full border border-red-200 text-red-600 bg-red-50 py-3 rounded-xl font-medium flex items-center justify-center gap-2">
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          )}

          {view === 'help' && (
            <div className="flex flex-col h-full">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                <p className="text-sm text-blue-800">Hi Samson! 👋 Support is 24/7. Ask us anything.</p>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto mb-4">
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-2 max-w-[80%] text-sm">How can I help you today?</div>
                </div>
              </div>
              <div className="mt-auto pt-2 border-t flex gap-2">
                <input type="text" placeholder="Type message..." className="flex-1 border rounded-full px-4 py-2 text-sm outline-none" />
                <button className="w-10 h-10 bg-[#d81b60] text-white rounded-full flex items-center justify-center"><Send size={18} /></button>
              </div>
            </div>
          )}

          {view === 'notifications' && (
            <div className="text-center py-10 text-gray-500">No new notifications</div>
          )}
        </div>
      </div>

      <UpdateUsernameModal isOpen={isUsernameModalOpen} onClose={() => setIsUsernameModalOpen(false)} />
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </div>
  );
}