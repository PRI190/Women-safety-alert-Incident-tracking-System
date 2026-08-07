import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, User, Lock, ArrowRight, UserCheck, KeyRound, ArrowLeft, X, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LoginPage: React.FC = () => {
  const { user, isAuthenticated, login, demoLoginUser, demoLoginAdmin, showToast } = useAuth();
  const navigate = useNavigate();

  const [activePortalTab, setActivePortalTab] = useState<'user' | 'admin'>('user');
  const [email, setEmail] = useState('poiu');
  const [password, setPassword] = useState('0987');
  const [loading, setLoading] = useState(false);
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Switch form defaults when tab changes
  const handleTabSwitch = (tab: 'user' | 'admin') => {
    setActivePortalTab(tab);
    if (tab === 'user') {
      setEmail('poiu');
      setPassword('0987');
    } else {
      setEmail('qwer');
      setPassword('1234');
    }
  };

  // Auto-navigate to dashboard or admin center when logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin' || user.email === 'admin@safeguard.com') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both User ID/Email and password', 'warning');
      return;
    }
    setLoading(true);
    try {
      const u = await login(email, password);
      if (u.role === 'admin' || email.trim().toLowerCase() === 'qwer' || email.trim().toLowerCase().includes('admin')) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (e) {
      // toast error handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast('Please enter your registered ID or email', 'warning');
      return;
    }
    showToast(`Password reset instructions sent for ${forgotEmail}`, 'success');
    setForgotModal(false);
    setForgotEmail('');
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 relative text-slate-900 font-sans">

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#B91C1C] text-white shadow-lg shadow-red-900/20 mb-1">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">112 SafeGuard Emergency</h1>
          <p className="text-xs font-semibold text-slate-500">Sign in with credentials to launch your dashboard</p>
        </div>

        {/* Card Container */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6">

          {/* Portal Selector Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => handleTabSwitch('user')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activePortalTab === 'user'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4 text-blue-600" />
              User Dashboard
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('admin')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activePortalTab === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-4 h-4 text-[#B91C1C]" />
              Admin Command
            </button>
          </div>

          {/* Credential Helper Info Box */}
          <div className="p-3.5 rounded-2xl bg-[#FAF8F8] border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#B91C1C]" />
                {activePortalTab === 'user' ? 'Citizen Safety Portal Credentials' : 'Admin Command Center Credentials'}
              </span>
              <span className="text-[10px] font-mono font-bold text-[#B91C1C] px-2 py-0.5 rounded-md bg-red-50 border border-red-100">
                {activePortalTab === 'user' ? 'Role: Citizen' : 'Role: Admin'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200">
              <div>ID: <span className="font-bold text-slate-900">{email}</span></div>
              <div>Password: <span className="font-bold text-slate-900">{password}</span></div>
            </div>
          </div>

          {/* Direct Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">User ID / Email</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ID (e.g. poiu or qwer)"
                  className="w-full pl-10 pr-4 py-3 text-xs bg-[#FAF8F8] border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">Password</label>
                <button
                  type="button"
                  onClick={() => setForgotModal(true)}
                  className="text-xs text-[#B91C1C] font-bold hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (e.g. 0987 or 1234)"
                  className="w-full pl-10 pr-4 py-3 text-xs bg-[#FAF8F8] border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#B91C1C] hover:bg-red-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {loading ? 'Authenticating & Opening Dashboard...' : `Sign In & Launch ${activePortalTab === 'admin' ? 'Admin Command Center' : 'User Safety Dashboard'}`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Access Buttons */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-bold text-slate-500 text-center uppercase tracking-wider">
              Instant 1-Click Dashboard Entry
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    await demoLoginUser();
                    navigate('/dashboard', { replace: true });
                  } finally {
                    setLoading(false);
                  }
                }}
                className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                Open User Dashboard
              </button>
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    await demoLoginAdmin();
                    navigate('/admin', { replace: true });
                  } finally {
                    setLoading(false);
                  }
                }}
                className="py-2.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-900 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-[#B91C1C]" />
                Open Admin Command
              </button>
            </div>
          </div>

          <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-600">
            Need an account?{' '}
            <Link to="/register" className="font-bold text-[#B91C1C] hover:underline">
              Create User Account
            </Link>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] font-medium text-slate-400 py-4">
        112 SafeGuard &copy; Emergency Response Network
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {forgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-red-100"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm">
                  <KeyRound className="w-4 h-4 text-[#B91C1C]" />
                  Reset Password
                </div>
                <button
                  type="button"
                  onClick={() => setForgotModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your registered ID or email address to receive password reset options.
              </p>

              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <input
                  type="text"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="ID (e.g. poiu) or Email"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F8] border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#B91C1C]"
                />

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#B91C1C] text-white font-bold text-xs rounded-xl hover:bg-red-800 shadow-xs cursor-pointer"
                  >
                    Send Link
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

