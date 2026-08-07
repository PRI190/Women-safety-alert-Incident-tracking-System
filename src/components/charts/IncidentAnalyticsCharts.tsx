import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { DashboardMetrics } from '../../types';
import { BarChart3, PieChart as PieIcon, TrendingUp, FileText, CheckCircle2, ShieldCheck, Copy } from 'lucide-react';

interface AnalyticsChartsProps {
  metrics: DashboardMetrics;
}

const MONO_RED_PALETTE = ['#B91C1C', '#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#991B1B', '#7F1D1D'];

export const IncidentAnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ metrics }) => {
  const [copied, setCopied] = useState(false);

  // Solution matrix mapping
  const incidentSolutionMap = [
    { incident: 'Harassment', count: 18, solution: 'Deployed Night Patrol Units & CCTV Monitoring', status: 'Resolved (94%)' },
    { incident: 'Stalking', count: 12, solution: 'Assigned Dedicated Female Safety Escorts', status: 'Resolved (88%)' },
    { incident: 'Domestic Abuse', count: 9, solution: 'Emergency Safe House Transport & Legal Aid', status: 'Resolved (100%)' },
    { incident: 'Eve Teasing', count: 15, solution: 'Undercover Police Posting near Colleges & Transit', status: 'Resolved (90%)' },
    { incident: 'Unsafe Locations', count: 14, solution: 'Smart Streetlight Installation & High Voltage LED Beacons', status: 'In Progress (85%)' }
  ];

  const generatedReportText = `================================================
WOMEN SAFETY INCIDENT & SOLUTION MONTHLY REPORT
Month: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
================================================

1. EXECUTIVE SUMMARY:
- Total Safety Incidents Reported: ${metrics.pendingIncidents + metrics.resolvedIncidents}
- Successfully Resolved Complaints: ${metrics.resolvedIncidents} (${Math.round((metrics.resolvedIncidents / Math.max(1, metrics.pendingIncidents + metrics.resolvedIncidents)) * 100)}% Resolution Rate)
- Emergency SOS Signals Dispatched: ${metrics.sosTodayCount} Active Alerts
- Active App Users Monitored: ${metrics.activeUsers} Users

2. INCIDENT BREAKDOWN & DEPLOYED SOLUTIONS:
- Harassment Cases (18): Implemented 24/7 Police Patrols & High-Definition CCTV Surveillance.
- Stalking Cases (12): Activated Emergency Escort Dispatch & Location Geofencing.
- Domestic Violence (9): Provided Immediate Safe Haven Shelter & Legal Counseling Support.
- Unsafe Hotspots (14): Installed Smart Solar Streetlighting & Emergency SOS Pillars.

3. RECOMMENDATIONS & NEXT ACTIONS:
- Increase patrolling density in Central Market and University Transit corridors.
- Maintain under 3-minute SOS emergency dispatch response times.
================================================`;

  const copyReport = () => {
    navigator.clipboard.writeText(generatedReportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Incidents & Resolution Trends */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#B91C1C]">
              <TrendingUp className="w-4 h-4" />
              Monthly Incident Trend vs Resolution Chart
            </div>
            <span className="text-[10px] bg-red-100 text-[#B91C1C] font-extrabold px-2.5 py-0.5 rounded-full">
              Realtime Logs
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.monthlyTrends}>
                <defs>
                  <linearGradient id="incGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B91C1C" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#B91C1C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="resGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="incidents" name="Total Incidents" stroke="#B91C1C" fillOpacity={1} fill="url(#incGradient)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="resolved" name="Resolved Solutions" stroke="#10B981" fillOpacity={1} fill="url(#resGradient)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800">
              <PieIcon className="w-4 h-4 text-[#B91C1C]" />
              Monthly Incident Type Distribution
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {metrics.categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400">No incident category data recorded.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="category"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {metrics.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={MONO_RED_PALETTE[index % MONO_RED_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Incident & Deployed Solution Report Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-sm font-black text-slate-900">
            <ShieldCheck className="w-5 h-5 text-[#B91C1C]" />
            Monthly Incident-to-Solution Action Matrix
          </div>
          <span className="text-xs text-slate-500 font-medium">Monthly Incident Remedies & Action Plan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
              <tr>
                <th className="px-4 py-3">Incident Type</th>
                <th className="px-4 py-3">Incidents Logged</th>
                <th className="px-4 py-3">Administrative Solution Action Taken</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {incidentSolutionMap.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">{item.incident}</td>
                  <td className="px-4 py-3 font-mono font-bold text-[#B91C1C]">{item.count} Cases</td>
                  <td className="px-4 py-3 text-slate-700">{item.solution}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Short Generated Monthly Report Summary Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-sm font-black text-slate-900">
            <FileText className="w-5 h-5 text-[#B91C1C]" />
            Generated Short Incident & Solution Executive Report
          </div>
          <button
            onClick={copyReport}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary Report'}</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-900 text-slate-100 text-xs font-mono rounded-2xl whitespace-pre-wrap leading-relaxed overflow-x-auto">
          {generatedReportText}
        </pre>
      </div>
    </div>
  );
};
