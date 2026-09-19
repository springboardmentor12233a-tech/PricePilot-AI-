import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNavigation from './MobileNavigation';
import SearchInput from '../components/SearchInput';
import Breadcrumbs from '../components/Breadcrumbs';
import OrganizationSelector from '../features/organizations/components/OrganizationSelector';
import { useAuth } from '../features/authentication/hooks/useAuth';
import {
  Menu,
  Bell,
  HelpCircle,
  ChevronDown,
  User,
  Settings,
  LogOut,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { APP_CONFIG } from '../utils/constants';

export default function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully.');
    navigate('/login');
  };

  const currentUserName = user?.full_name || user?.name || (user?.email ? user.email.split('@')[0] : 'User');
  const currentUserEmail = user?.email || '';
  const currentRole = user?.role || null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased">
      {/* Mobile Drawer */}
      <MobileNavigation isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex flex-1 h-screen overflow-hidden">
        {/* Desktop Sidebar (Fixed 256px) */}
        <div className="hidden lg:block shrink-0">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          {/* Top Navigation */}
          <header className="h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0">
            {/* Left: Mobile hamburger + Mobile logo + Organization Selector */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open mobile navigation menu"
                className="lg:hidden w-11 h-11 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex lg:hidden items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#2563EB] text-white flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-[#0F172A]">{APP_CONFIG.name}</span>
              </div>

              {/* Organization Selector */}
              <div className="hidden sm:block">
                <OrganizationSelector />
              </div>
            </div>

            {/* Center: Global Search Bar */}
            <div className="hidden md:block flex-1 max-w-md mx-2">
              <SearchInput />
            </div>

            {/* Right: Actions & User Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Org Selector if on narrow screen */}
              <div className="sm:hidden">
                <OrganizationSelector />
              </div>

              {/* Help Button */}
              <button
                type="button"
                onClick={() => toast.info('FastAPI docs available at /docs on backend port 8000.')}
                aria-label="Help and Documentation"
                className="w-10 h-10 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              {/* Notifications */}
              <div className="relative" ref={notifMenuRef}>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  aria-label="View notifications"
                  className="w-10 h-10 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors relative cursor-pointer"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#2563EB]" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-4 z-40">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                      <h4 className="text-sm font-semibold text-[#0F172A]">Notifications</h4>
                      <span className="text-[11px] font-medium text-[#2563EB] cursor-pointer">
                        Mark all as read
                      </span>
                    </div>
                    <div className="py-4 text-center">
                      <p className="text-xs text-[#64748B]">No unread alerts.</p>
                      <p className="text-[11px] text-[#94A3B8] mt-1">
                        Pricing recommendations and competitor updates will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar & Dropdown */}
              <div className="relative pl-1" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-label="User account menu"
                  aria-expanded={userDropdownOpen}
                  className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-semibold text-xs flex items-center justify-center">
                    {currentUserName.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-[#0F172A] leading-tight">
                      {currentUserName}
                    </p>
                    {currentRole ? (
                      <p className="text-[11px] text-[#64748B] leading-tight mt-0.5 capitalize">{currentRole}</p>
                    ) : currentUserEmail ? (
                      <p className="text-[11px] text-[#94A3B8] leading-tight mt-0.5 truncate max-w-[120px]">{currentUserEmail}</p>
                    ) : null}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-1.5 z-40 text-xs animate-in fade-in-50">
                    <div className="px-3 py-2.5 border-b border-[#E2E8F0] mb-1">
                      <p className="font-semibold text-[#0F172A] truncate">{currentUserName}</p>
                      {currentUserEmail && (
                        <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                          {currentUserEmail}
                        </p>
                      )}
                      {currentRole && (
                        <p className="text-[10px] text-[#2563EB] font-medium uppercase tracking-wider mt-1">
                          {currentRole}
                        </p>
                      )}
                    </div>

                    <Link
                      to="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>

                    <div className="border-t border-[#E2E8F0] my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content View with Fluid Responsive Padding */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Breadcrumbs />
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
