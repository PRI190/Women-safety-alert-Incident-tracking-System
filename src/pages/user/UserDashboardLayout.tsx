import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SOSFloatingButton } from '../../components/common/SOSFloatingButton';
import {
  ShieldAlert,
  LayoutDashboard,
  FilePlus,
  AlertTriangle,
  FileText,
  MapPin,
  Bell,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

export const UserDashboardLayout: React.FC = () => {
  const { user, logout, unreadCount } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Report Incident', path: '/dashboard/report', icon: FilePlus },
    { label: 'My Incidents', path: '/dashboard/incidents', icon: FileText },
    { label: 'Hotspot Map', path: '/dashboard/hotspots', icon: MapPin },
    { label: 'Notifications', path: '/dashboard/notifications', icon: Bell, badge: unreadCount },
    { label: 'Profile & Contacts', path: '/dashboard/profile', icon: UserIcon }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col md:flex-row font-sans text-slate-800">
      <SOSFloatingButton />

      {/* Mobile Top Header */}
      <div className="md:hidden glass border-b border-white/60 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C63FF] to-[#FF6584] flex items-center justify-center text-white shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-sm text-slate-900 tracking-tight">SafeGuard360</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl text-slate-700 hover:bg-white/50"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 glass border-r border-white/80 p-5 flex flex-col justify-between transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 px-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6C63FF] to-[#FF6584] flex items-center justify-center text-white shadow-md shadow-[#6C63FF]/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-base text-slate-900 tracking-tight block">
                SafeGuard<span className="text-[#FF6584]">360</span>
              </span>
              <span className="text-[10px] text-[#6C63FF] font-bold block uppercase tracking-wider">
                User Portal
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white text-[#6C63FF]' : 'bg-[#FF6584] text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="pt-6 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-[#6C63FF] font-black flex items-center justify-center text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <span className="font-bold text-xs text-slate-900 block truncate">{user?.name || 'User'}</span>
              <span className="text-[10px] text-slate-400 block truncate">{user?.email}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout Account
          </button>
        </div>
      </aside>

      {/* Main Content View Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};
