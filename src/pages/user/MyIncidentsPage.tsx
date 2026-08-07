import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Incident } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Search, Filter, Eye, RefreshCw, X, MapPin, Calendar, Clock, User, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const MyIncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    loadIncidents();
  }, [statusFilter]);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const data = await api.getIncidents({
        myOnly: true,
        status: statusFilter !== 'All' ? statusFilter : undefined
      });
      setIncidents(data);
    } catch (e) {
      console.error('Failed fetching user incidents:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredIncidents = incidents.filter((i) => {
    const q = searchTerm.toLowerCase();
    return (
      i.id.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      i.location.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Incident Complaints</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track status, investigation logs, and assigned safety officers for your reports.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, title, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF] w-60"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF] font-semibold text-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <button
            onClick={loadIncidents}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Incidents Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading incidents list...</div>
        ) : filteredIncidents.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No incident reports found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Incident ID</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Headline / Title</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#B91C1C]">{inc.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{inc.category}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{inc.title}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{inc.location}</td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {inc.date} at {inc.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedIncident(inc)}
                        className="px-3 py-1.5 rounded-xl bg-red-50 text-[#B91C1C] font-bold text-xs hover:bg-red-100 transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Incident Detail Modal */}
      <AnimatePresence>
        {selectedIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-[#B91C1C]">{selectedIncident.id}</span>
                    <StatusBadge status={selectedIncident.status} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">{selectedIncident.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  ← Back
                </button>
              </div>

              {/* Information Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-semibold block">Category:</span>
                  <span className="font-bold text-slate-900">{selectedIncident.category}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-semibold block">Date & Time:</span>
                  <span className="font-bold text-slate-900">
                    {selectedIncident.date} at {selectedIncident.time}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 sm:col-span-2">
                  <span className="text-slate-400 font-semibold block">Location:</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    {selectedIncident.location} ({selectedIncident.latitude.toFixed(4)},{' '}
                    {selectedIncident.longitude.toFixed(4)})
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Complaint Description
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {selectedIncident.description}
                </p>
              </div>

              {selectedIncident.image && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Photo Evidence</h4>
                  <img
                    src={selectedIncident.image}
                    alt="Evidence"
                    className="max-h-56 rounded-2xl border border-slate-200 object-cover"
                  />
                </div>
              )}

              {/* Officer Assignment & Admin Audit Notes */}
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-[#6C63FF]" />
                  Investigation Status
                </div>
                <p className="text-slate-700">
                  <span className="font-semibold">Assigned Safety Officer:</span>{' '}
                  {selectedIncident.assignedOfficer || 'Pending Assignment'}
                </p>
                {selectedIncident.adminNotes && (
                  <p className="text-slate-700 pt-1 border-t border-indigo-100">
                    <span className="font-semibold">Officer Investigation Notes:</span> {selectedIncident.adminNotes}
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedIncident(null)}
                className="w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
              >
                Close View
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
