import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Mail, Lock, ArrowRight, UserCheck, KeyRound, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LoginPage: React.FC = () => {
  const { login, demoLoginUser, demoLoginAdmin, showToast } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (e) {
      // toast shown in context
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast('Please enter your email', 'warning');
      return;
    }
    showToast(`Password reset link sent to ${forgotEmail}`, 'success');
    setForgotModal(false);
    setForgotEmail('');
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-slate-800">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#6C63FF]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6C63FF] to-[#FF6584] flex items-center justify-center text-white shadow-xl shadow-[#6C63FF]/30">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
            SafeGuard<span className="text-[#FF6584]">360</span>
          </span>
        </Link>
        <h2 className="text-2xl font-black text-slate-900">Sign in to your account</h2>
        <p className="text-xs text-slate-500">Enter credentials or use instant demo accounts below.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="glass-card py-8 px-6 shadow-2xl rounded-3xl sm:px-10 space-y-6">
          {/* Instant Demo Role Switches */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-center space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Quick One-Click Demo Access
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  await demoLoginUser();
                  navigate('/dashboard');
                }}
                className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-[#6C63FF] text-white shadow-md hover:bg-[#574ff0] transition-colors flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                User Demo
              </button>

              <button
                type="button"
                onClick={async () => {
                  await demoLoginAdmin();
                  navigate('/admin');
                }}
                className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-slate-900 text-white shadow-md hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-[#FF6584]" />
                Admin Demo
              </button>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@example.com"
                  className="w-full pl-9 pr-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setForgotModal(true)}
                  className="text-xs text-[#6C63FF] font-bold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#6C63FF] hover:bg-[#574ff0] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-[#6C63FF]/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-[#6C63FF] hover:underline">
              Create one now
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {forgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <KeyRound className="w-5 h-5 text-[#6C63FF]" />
                  Reset Password
                </div>
                <button onClick={() => setForgotModal(false)} className="text-slate-400 hover:text-slate-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500">Enter your registered email to receive reset instructions.</p>
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF]"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-[#6C63FF] text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Send Reset Link
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
