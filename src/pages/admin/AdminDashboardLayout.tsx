import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SOSFloatingButton } from '../../components/common/SOSFloatingButton';
import {
  ShieldAlert,
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell
} from 'lucide-react';

export const AdminDashboardLayout: React.FC = () => {
  const { user, logout, unreadCount } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Incident Management', path: '/admin/incidents', icon: FileText },
    { label: 'SOS Emergency Alerts', path: '/admin/sos', icon: AlertTriangle },
    { label: 'User Management', path: '/admin/users', icon: Users },
    { label: 'System Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'System Settings', path: '/admin/settings', icon: Settings }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col md:flex-row font-sans text-slate-800">
      <SOSFloatingButton />

      {/* Mobile Header */}
      <div className="md:hidden glass-dark text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C63FF] to-[#FF6584] flex items-center justify-center text-white shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-sm tracking-tight">SafeGuard Command</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl text-slate-300 hover:bg-white/10"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 glass-dark text-slate-200 p-5 flex flex-col justify-between transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 px-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6C63FF] to-[#FF6584] flex items-center justify-center text-white shadow-lg">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-base text-white tracking-tight block">
                SafeGuard<span className="text-[#FF6584]">360</span>
              </span>
              <span className="text-[10px] text-[#FF6584] font-bold block uppercase tracking-wider">
                Admin Command
              </span>
            </div>
          </Link>

          {/* Nav Items */}
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
                      ? 'bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="pt-6 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-[#FF6584] font-black flex items-center justify-center text-sm border border-rose-500/30">
              A
            </div>
            <div className="flex-1 overflow-hidden">
              <span className="font-bold text-xs text-white block truncate">{user?.name || 'Admin'}</span>
              <span className="text-[10px] text-slate-400 block truncate">Safety Command Center</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout Command
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};
