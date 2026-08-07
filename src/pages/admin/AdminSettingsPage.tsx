import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Settings, RefreshCw, ShieldCheck, PhoneCall, Bell } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { showToast } = useAuth();
  const [resetting, setResetting] = useState(false);

  const handleResetSeed = async () => {
    if (!window.confirm('Are you sure you want to reset all data to default seed values?')) return;

    setResetting(true);
    try {
      await api.resetSeedData();
      showToast('Database reset to fresh seed demo state', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to reset seed', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 text-white rounded-2xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">System Command Settings</h1>
            <p className="text-xs text-slate-500">Global system parameters and seed data management.</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-2">Reset Demo Database</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Re-populate the system with realistic pre-configured seed users, sample incident reports, emergency contacts, and hotspot locations for evaluation testing.
          </p>
          <button
            onClick={handleResetSeed}
            disabled={resetting}
            className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
            {resetting ? 'Resetting Store...' : 'Reset Database to Initial Seed State'}
          </button>
        </div>

        <div className="pt-6 border-t border-slate-100 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Active Helpline Configurations</h3>
          <ul className="text-xs space-y-2 text-slate-600">
            <li className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span>National Emergency Number</span>
              <span className="font-mono font-bold text-emerald-600">112</span>
            </li>
            <li className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span>Women Helpline (24/7)</span>
              <span className="font-mono font-bold text-[#FF6584]">1091</span>
            </li>
            <li className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span>National Cyber Crime Helpline</span>
              <span className="font-mono font-bold text-[#6C63FF]">1930</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
