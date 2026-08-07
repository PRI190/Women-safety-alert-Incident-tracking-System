import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Mail, Lock, User, Phone, ArrowRight, ArrowLeft } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register, showToast } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (form.password.length < 4) {
      showToast('Password must be at least 4 characters', 'warning');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password
      });
      navigate('/dashboard');
    } catch (e) {
      // toast in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 relative text-slate-900 font-sans">
      {/* Top Bar with Back Button */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pb-4">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/login');
            }
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#B91C1C]" />
          <span>Back</span>
        </button>

        <Link to="/login" className="text-xs font-extrabold text-[#B91C1C] hover:underline">
          Return to Sign In
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#B91C1C] text-white shadow-lg shadow-red-900/20 mb-1">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Create New User Account</h2>
          <p className="text-xs font-semibold text-slate-500">Join the 112 SafeGuard emergency response network</p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  className="w-full pl-10 pr-4 py-3 text-xs bg-[#FAF8F8] border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#B91C1C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Email / ID</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@safeguard.com"
                  className="w-full pl-10 pr-4 py-3 text-xs bg-[#FAF8F8] border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#B91C1C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 019-2831"
                  className="w-full pl-10 pr-4 py-3 text-xs bg-[#FAF8F8] border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#B91C1C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-3 text-xs bg-[#FAF8F8] border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#B91C1C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-4 py-3 text-xs bg-[#FAF8F8] border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#B91C1C]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#B91C1C] hover:bg-red-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Register Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-600">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-[#B91C1C] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] font-medium text-slate-400 py-4">
        112 SafeGuard &copy; Emergency Response Network
      </div>
    </div>
  );
};
