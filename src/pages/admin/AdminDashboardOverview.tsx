import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { DashboardMetrics, SOSAlert } from '../../types';
import { IncidentAnalyticsCharts } from '../../components/charts/IncidentAnalyticsCharts';
import {
  Users,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ShieldAlert,
  Radio
} from 'lucide-react';

export const AdminDashboardOverview: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activeSOS, setActiveSOS] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, sosList] = await Promise.all([
        api.getDashboardMetrics(),
        api.getSOSAlerts()
      ]);
      setMetrics(m);
      setActiveSOS(sosList.filter((s) => s.status === 'ACTIVE' || s.status === 'DISPATCHED'));
    } catch (e) {
      console.error('Failed loading admin dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-[#FF6584] text-xs font-bold border border-rose-500/30 mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Live Command Center Sync Active
          </div>
          <h1 className="text-2xl md:text-3xl font-black">Central Safety Command Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Realtime monitoring of user complaints, officer dispatching, and emergency SOS alerts.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4" /> Sync Metrics
        </button>
      </div>

      {/* Active High-Urgency SOS Banner */}
      {activeSOS.length > 0 && (
        <div className="p-5 rounded-3xl bg-rose-950/90 border border-rose-500/50 text-rose-100 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-600 text-white rounded-2xl animate-bounce">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-rose-300 block">
                🚨 High Urgency Dispatch Required ({activeSOS.length} Active SOS)
              </span>
              <h3 className="text-sm font-bold text-white">
                Latest: {activeSOS[0].userName} at {activeSOS[0].locationName}
              </h3>
            </div>
          </div>
          <Link
            to="/admin/sos"
            className="px-5 py-2.5 rounded-xl bg-white text-rose-700 font-extrabold text-xs hover:bg-rose-100 transition-colors shrink-0 text-center"
          >
            Manage SOS Dispatch
          </Link>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card p-5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Users</span>
            <div className="p-2 bg-indigo-50/80 text-[#6C63FF] rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {loading ? '...' : metrics?.totalUsers ?? 0}
          </div>
          <p className="text-[10px] text-slate-500">Registered platform accounts</p>
        </div>

        <div className="glass-card p-5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Users</span>
            <div className="p-2 bg-emerald-50/80 text-emerald-600 rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {loading ? '...' : metrics?.activeUsers ?? 0}
          </div>
          <p className="text-[10px] text-emerald-600 font-medium">Verified active members</p>
        </div>

        <div className="glass-card p-5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Incidents</span>
            <div className="p-2 bg-amber-50/80 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {loading ? '...' : metrics?.pendingIncidents ?? 0}
          </div>
          <p className="text-[10px] text-amber-600 font-medium">Needs officer assignment</p>
        </div>

        <div className="glass-card p-5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Resolved</span>
            <div className="p-2 bg-emerald-50/80 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {loading ? '...' : metrics?.resolvedIncidents ?? 0}
          </div>
          <p className="text-[10px] text-emerald-600 font-medium">Cases fully closed</p>
        </div>

        <div className="glass-card p-5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SOS Today</span>
            <div className="p-2 bg-rose-50/80 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {loading ? '...' : metrics?.sosTodayCount ?? 0}
          </div>
          <p className="text-[10px] text-rose-600 font-medium">Emergency signals today</p>
        </div>
      </div>

      {/* Analytics Charts Component */}
      {metrics && <IncidentAnalyticsCharts metrics={metrics} />}
    </div>
  );
};
