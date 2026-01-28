import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  Users,
  Award, 
  GitBranch, 
  Package, 
  X
} from "lucide-react";

// --- Types ---
type AdminDrawerView = "profile" | "notifications" | null;

// Mock Sign Out Function
const handleSignOut = () => {
    console.log("Admin Signing out...");
    // navigate("/admin/login"); // Placeholder
};

const navLinks = [
    { name: "Dashboard", path: "/adminDashboard", icon: LayoutDashboard },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Packages", path: "/admin/packages", icon: Package },
    { name: "Tiers", path: "/admin/tiers", icon: Award },
    { name: "Point Rules", path: "/admin/pointrules", icon: GitBranch },
];

export default function NavBar() {
    const [drawerView, setDrawerView] = useState<AdminDrawerView>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown if clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isActive = (path: string) => location.pathname === path;

    const openDrawer = (view: AdminDrawerView) => {
        setDrawerView(view);
        setIsDropdownOpen(false);
    };

    return (
        <>
            <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-full mx-auto px-6 h-16 flex items-center justify-between">
                    
                    {/* Logo & Title */}
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/adminDashboard')}>
                        <span className="text-xl font-extrabold text-[#d81b60] tracking-wider">
                            CVault <span className="text-gray-400 font-medium text-sm ml-1">ADMIN</span>
                        </span>
                    </div>

                    {/* Navigation Links */}
                    <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-600">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`flex items-center gap-2 py-2 transition-colors border-b-2 ${
                                    isActive(link.path) 
                                        ? "text-[#d81b60] border-[#d81b60] font-semibold" 
                                        : "hover:text-[#d81b60] border-transparent"
                                }`}
                            >
                                <link.icon size={18} />
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        {/* Notification Bell */}
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
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-gray-200 hover:shadow-sm transition-all bg-gray-50"
                            >
                                <div className="w-8 h-8 rounded-full bg-[#d81b60]/80 flex items-center justify-center text-white text-xs font-bold">
                                    AD
                                </div>
                                <Settings size={16} className="text-gray-500 mr-1" />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 z-50">
                                    <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                        <p className="text-sm font-semibold text-gray-900">Admin User</p>
                                        <p className="text-xs text-gray-500">admin@cvault.com</p>
                                    </div>
                                    <div className="p-1">
                                        <button onClick={() => openDrawer('profile')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center gap-2">
                                            <User size={16} /> Profile & Settings
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

            {/* Admin Side Drawer (Simplified) */}
            <AdminSideDrawer 
                isOpen={!!drawerView} 
                onClose={() => setDrawerView(null)} 
                view={drawerView}
                handleSignOut={handleSignOut}
            />
        </>
    );
}

// Admin Drawer (Simplified for space)
function AdminSideDrawer({ isOpen, onClose, view, handleSignOut }: { isOpen: boolean; onClose: () => void; view: AdminDrawerView; handleSignOut: () => void }) {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
             <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
             <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col p-4 animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 className="text-lg font-bold text-gray-800 capitalize">{view === 'profile' ? 'Admin Settings' : 'Notifications'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                </div>
                
                {view === 'profile' && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">Admin specific profile/security settings go here.</p>
                         <button onClick={handleSignOut} className="w-full border border-red-200 text-red-600 bg-red-50 py-2 rounded-lg font-medium hover:bg-red-100">
                            Sign Out
                         </button>
                    </div>
                )}
                
                {view === 'notifications' && (
                    <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-lg text-sm">New User Registered: Tukas Mar.</div>
                        <div className="p-3 bg-gray-50 rounded-lg text-sm">Tier update required for Gold.</div>
                    </div>
                )}
             </div>
        </div>
    );
}