import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DashboardMetrics, Incident } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { triggerSOSModal } from '../../components/common/SOSFloatingButton';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  FilePlus,
  MapPin,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  PhoneCall,
  Radio
} from 'lucide-react';

export const UserDashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [m, incs] = await Promise.all([
        api.getDashboardMetrics(),
        api.getIncidents({ myOnly: true })
      ]);
      setMetrics(m);
      setRecentIncidents(incs.slice(0, 5));
    } catch (e) {
      console.error('Failed loading dashboard overview:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#6C63FF]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              24/7 Protection Active
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Welcome back, {user?.name || 'Safety Member'} 👋
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
              Track your reported safety complaints, review area hotspot warnings, and access immediate emergency dispatch controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => triggerSOSModal()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs shadow-lg shadow-red-600/40 transition-all flex items-center gap-2 cursor-pointer animate-pulse"
            >
              <Radio className="w-4 h-4" />
              TRIGGER EMERGENCY SOS
            </button>

            <Link
              to="/dashboard/report"
              className="px-5 py-3 rounded-2xl bg-[#6C63FF] hover:bg-[#584ef0] text-white font-extrabold text-xs shadow-lg shadow-[#6C63FF]/30 transition-all flex items-center gap-2"
            >
              <FilePlus className="w-4 h-4" />
              Report Incident
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-6 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Reports</span>
            <div className="p-2.5 bg-indigo-50/80 text-[#6C63FF] rounded-2xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {loading ? '...' : metrics?.totalIncidents ?? 0}
          </div>
          <p className="text-[11px] text-slate-500">Submitted by your account</p>
        </div>

        <div className="glass-card p-6 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending</span>
            <div className="p-2.5 bg-amber-50/80 text-amber-600 rounded-2xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {loading ? '...' : metrics?.pendingIncidents ?? 0}
          </div>
          <p className="text-[11px] text-amber-600 font-medium">Awaiting officer dispatch</p>
        </div>

        <div className="glass-card p-6 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolved</span>
            <div className="p-2.5 bg-emerald-50/80 text-emerald-600 rounded-2xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {loading ? '...' : metrics?.resolvedIncidents ?? 0}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">Successfully investigated</p>
        </div>

        <div className="glass-card p-6 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SOS Sent</span>
            <div className="p-2.5 bg-rose-50/80 text-rose-600 rounded-2xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {loading ? '...' : metrics?.activeSOSTotal ?? 0}
          </div>
          <p className="text-[11px] text-rose-600 font-medium">Emergency signals logged</p>
        </div>
      </div>

      {/* Recent Activity Table & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Incident Feed */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-extrabold text-slate-900">Your Recent Incidents</h3>
            <Link
              to="/dashboard/incidents"
              className="text-xs font-bold text-[#6C63FF] hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading incidents...</div>
          ) : recentIncidents.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">No incidents reported yet.</p>
              <Link
                to="/dashboard/report"
                className="inline-block px-4 py-2 bg-indigo-50 text-[#6C63FF] font-bold text-xs rounded-xl"
              >
                File Your First Report
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-400">{inc.id}</span>
                      <span className="text-xs font-bold text-slate-900">{inc.title}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="text-[#6C63FF] font-semibold">{inc.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {inc.location}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <StatusBadge status={inc.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Safety Actions Sidebar */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-50 to-pink-50 p-6 rounded-3xl border border-indigo-100 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#FF6584]" />
              Quick Emergency Helpline Speed Dials
            </h4>
            <div className="space-y-2 text-xs">
              <a
                href="tel:112"
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-indigo-100 font-bold hover:bg-slate-50 transition-colors"
              >
                <span className="text-slate-800">112 National Emergency</span>
                <span className="text-[#6C63FF] font-mono">DIAL 112</span>
              </a>
              <a
                href="tel:1091"
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-indigo-100 font-bold hover:bg-slate-50 transition-colors"
              >
                <span className="text-slate-800">1091 Women Helpline</span>
                <span className="text-[#FF6584] font-mono">DIAL 1091</span>
              </a>
              <a
                href="tel:1930"
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-indigo-100 font-bold hover:bg-slate-50 transition-colors"
              >
                <span className="text-slate-800">1930 Cyber Fraud Helpline</span>
                <span className="text-amber-600 font-mono">DIAL 1930</span>
              </a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900">Explore Hotspot Risk Map</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Check safety ratings of nearby areas before commuting at night.
            </p>
            <Link
              to="/dashboard/hotspots"
              className="block text-center w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
            >
              Open Interactive Map
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
