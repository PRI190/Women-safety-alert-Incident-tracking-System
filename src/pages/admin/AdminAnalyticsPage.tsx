import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DashboardMetrics } from '../../types';
import { IncidentAnalyticsCharts } from '../../components/charts/IncidentAnalyticsCharts';
import { BarChart3, Download, RefreshCw } from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Safety System Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">Incident breakdown, resolution velocity, and zone threat distribution.</p>
        </div>

        <button
          onClick={loadMetrics}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {metrics ? (
        <IncidentAnalyticsCharts metrics={metrics} />
      ) : (
        <div className="p-12 text-center text-xs text-slate-400">Loading analytics graphs...</div>
      )}
    </div>
  );
};
