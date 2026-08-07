import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  Bell,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  CheckCheck,
  Shield,
  UserCheck,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const { user, logout, demoLoginAdmin, demoLoginUser, unreadCount, notifications, fetchNotifications } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 glass border-b border-white/60 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-tr from-[#6C63FF] via-[#857dff] to-[#FF6584] flex items-center justify-center text-white shadow-md shadow-[#6C63FF]/30 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-base md:text-lg text-slate-900 tracking-tight block leading-tight">
                SafeGuard<span className="text-[#FF6584]">360</span>
              </span>
              <span className="text-[10px] text-slate-500 tracking-wide font-medium block uppercase">
                Women Safety & Incident Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link
              to="/"
              className={`text-sm font-semibold transition-colors ${
                isActive('/') ? 'text-[#6C63FF]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Home
            </Link>
            <a
              href="#features"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#safety-tips"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Safety Tips
            </a>
            <a
              href="#emergency-contacts"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Emergency
            </a>
          </nav>

          {/* Actions & Role Controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Quick Demo Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 text-[#6C63FF] border border-indigo-200/80 hover:bg-indigo-100 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>
                  {user ? (user.role === 'admin' ? 'Role: Admin' : 'Role: User') : 'Quick Role Switch'}
                </span>
                <ChevronDown className="w-3 h-3" />
              </button>

              <AnimatePresence>
                {roleMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs"
                  >
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Testing Role Switch
                    </div>
                    <button
                      onClick={() => {
                        demoLoginUser();
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                    >
                      <UserCheck className="w-4 h-4 text-[#6C63FF]" />
                      Login as User (Priya)
                    </button>
                    <button
                      onClick={() => {
                        demoLoginAdmin();
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                    >
                      <ShieldAlert className="w-4 h-4 text-[#FF6584]" />
                      Login as Admin
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {user ? (
              <>
                {/* Notification Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotifOpen(!notifOpen);
                      fetchNotifications();
                    }}
                    className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#FF6584] text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50"
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Notifications ({notifications.length})
                          </h4>
                          <span className="text-[10px] text-[#6C63FF] font-semibold">Realtime</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {notifications.length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 text-center">No notifications yet.</p>
                          ) : (
                            notifications.slice(0, 5).map((n) => (
                              <div
                                key={n.id}
                                className={`p-2.5 rounded-xl text-xs border ${
                                  n.type === 'sos'
                                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                                    : 'bg-slate-50 border-slate-100 text-slate-700'
                                }`}
                              >
                                <div className="font-bold flex items-center gap-1.5 mb-1">
                                  {n.type === 'sos' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                                  {n.title}
                                </div>
                                <p className="text-[11px] text-slate-600 leading-snug">{n.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Dashboard Link */}
                <Link
                  to={user.role === 'admin' ? '/admin' : '/dashboard'}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#6C63FF] hover:bg-[#5b52f2] text-white transition-all shadow-md shadow-[#6C63FF]/25 flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {user.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all shadow-md"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3"
          >
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 hover:text-[#6C63FF]"
            >
              Home
            </Link>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 hover:text-[#6C63FF]"
            >
              Features
            </a>
            <a
              href="#safety-tips"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 hover:text-[#6C63FF]"
            >
              Safety Tips
            </a>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    demoLoginUser();
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 text-xs font-bold bg-indigo-50 text-[#6C63FF] rounded-lg"
                >
                  Demo User
                </button>
                <button
                  onClick={() => {
                    demoLoginAdmin();
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 text-xs font-bold bg-rose-50 text-[#FF6584] rounded-lg"
                >
                  Demo Admin
                </button>
              </div>

              {user ? (
                <>
                  <Link
                    to={user.role === 'admin' ? '/admin' : '/dashboard'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-2.5 bg-[#6C63FF] text-white font-bold text-xs rounded-xl"
                  >
                    Open {user.role === 'admin' ? 'Admin Panel' : 'User Dashboard'}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-center py-2 text-slate-500 font-semibold text-xs"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 font-bold text-xs border border-slate-200 rounded-xl"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 font-bold text-xs bg-slate-900 text-white rounded-xl"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
