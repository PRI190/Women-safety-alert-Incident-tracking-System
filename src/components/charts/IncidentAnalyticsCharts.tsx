import React from 'react';
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
import { BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react';

interface AnalyticsChartsProps {
  metrics: DashboardMetrics;
}

const CATEGORY_COLORS = ['#6C63FF', '#FF6584', '#38bdf8', '#f59e0b', '#10b981', '#a855f7', '#64748b'];

export const IncidentAnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Incidents & Resolution Trends */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6C63FF]">
            <TrendingUp className="w-4 h-4" />
            Incidents vs Resolutions Trend
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics.monthlyTrends}>
              <defs>
                <linearGradient id="incGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="resGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Area type="monotone" dataKey="incidents" name="Total Incidents" stroke="#6C63FF" fillOpacity={1} fill="url(#incGradient)" strokeWidth={2} />
              <Area type="monotone" dataKey="resolved" name="Resolved Complaints" stroke="#10b981" fillOpacity={1} fill="url(#resGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Distribution Pie Chart */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF6584]">
            <PieIcon className="w-4 h-4" />
            Incident Category Breakdown
          </div>
        </div>
        <div className="h-64 w-full flex items-center justify-center">
          {metrics.categoryBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400">No incident category data yet.</p>
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
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
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
  );
};
