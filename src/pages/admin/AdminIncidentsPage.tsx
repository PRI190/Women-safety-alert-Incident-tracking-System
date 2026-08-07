import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Incident, IncidentStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Filter,
  Eye,
  Trash2,
  UserCheck,
  CheckCircle2,
  X,
  FileSpreadsheet,
  RefreshCw,
  MapPin,
  Clock,
  ShieldCheck,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AudioVoicePlayer } from '../../components/common/AudioVoicePlayer';

export const AdminIncidentsPage: React.FC = () => {
  const { showToast } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [editStatus, setEditStatus] = useState<IncidentStatus>('Pending');
  const [assignedOfficer, setAssignedOfficer] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, [statusFilter, categoryFilter]);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const data = await api.getIncidents({
        status: statusFilter !== 'All' ? statusFilter : undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined
      });
      setIncidents(data);
    } catch (e) {
      console.error('Failed loading incidents for admin:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (inc: Incident) => {
    setSelectedIncident(inc);
    setEditStatus(inc.status);
    setAssignedOfficer(inc.assignedOfficer || '');
    setAdminNotes(inc.adminNotes || '');
  };

  const handleUpdateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;

    setUpdating(true);
    try {
      await api.updateIncident(selectedIncident.id, {
        status: editStatus,
        assignedOfficer,
        adminNotes
      });
      showToast(`Incident ${selectedIncident.id} updated successfully!`, 'success');
      setSelectedIncident(null);
      loadIncidents();
    } catch (err: any) {
      showToast(err.message || 'Failed to update incident', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteIncident = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete incident ${id}?`)) return;
    try {
      await api.deleteIncident(id);
      showToast(`Incident ${id} deleted`, 'info');
      if (selectedIncident?.id === id) setSelectedIncident(null);
      loadIncidents();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete incident', 'error');
    }
  };

  const exportCSV = () => {
    if (incidents.length === 0) return;
    const headers = ['ID,Category,Title,Location,Date,Time,Status,Officer,Anonymous'];
    const rows = incidents.map(
      (i) =>
        `"${i.id}","${i.category}","${i.title.replace(/"/g, '""')}","${i.location.replace(/"/g, '""')}","${i.date}","${i.time}","${i.status}","${i.assignedOfficer || ''}",${i.anonymous}`
    );
    const blob = new Blob([[headers.join('\n'), ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incidents_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('Incidents exported as CSV report', 'success');
  };

  const filteredIncidents = incidents.filter((i) => {
    const q = searchTerm.toLowerCase();
    return (
      i.id.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q) ||
      i.location.toLowerCase().includes(q) ||
      (i.userName && i.userName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Incident Management Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Assign safety officers, investigate reports, update statuses, and log resolution notes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={loadIncidents}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-md flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, title, user, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF]"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
        >
          <option value="All">All Categories</option>
          <option value="Harassment">Harassment</option>
          <option value="Stalking">Stalking</option>
          <option value="Theft">Theft</option>
          <option value="Cyber Crime">Cyber Crime</option>
          <option value="Domestic Violence">Domestic Violence</option>
          <option value="Suspicious Activity">Suspicious Activity</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Under Review">Under Review</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading incidents database...</div>
        ) : filteredIncidents.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No matching incident complaints found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Incident ID</th>
                  <th className="px-6 py-4">Complainant</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Officer</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#6C63FF]">{inc.id}</td>
                    <td className="px-6 py-4">
                      {inc.anonymous ? (
                        <span className="text-slate-400 italic">Anonymous</span>
                      ) : (
                        <div>
                          <span className="font-bold text-slate-900 block">{inc.userName}</span>
                          <span className="text-[10px] text-slate-400">{inc.userPhone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{inc.category}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{inc.title}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{inc.location}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {inc.assignedOfficer || <span className="text-amber-600 italic">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleOpenModal(inc)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 text-[#6C63FF] font-bold text-xs hover:bg-indigo-100 transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Manage
                      </button>
                      <button
                        onClick={() => handleDeleteIncident(inc.id)}
                        className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors inline-block"
                        title="Delete Incident"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Action & Status Update Modal */}
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

              {/* Incident Details Summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Complainant:</span>
                  <span className="font-bold text-slate-900">
                    {selectedIncident.anonymous ? 'Anonymous User' : `${selectedIncident.userName} (${selectedIncident.userPhone})`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-bold text-slate-900">{selectedIncident.location}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 text-slate-700">
                  <span className="font-bold text-slate-900 block mb-1">Report Description:</span>
                  {selectedIncident.description}
                </div>
              </div>

              {/* Voice Recording / Message Broadcast Player */}
              <AudioVoicePlayer
                transcript={
                  selectedIncident.audioTranscript ||
                  `OFFICIAL INCIDENT BROADCAST REPORT: Incident ID ${selectedIncident.id}. Category: ${selectedIncident.category}. Title: ${selectedIncident.title}. Location: ${selectedIncident.location}. Complainant: ${selectedIncident.anonymous ? 'Anonymous User' : selectedIncident.userName}. Report: ${selectedIncident.description}`
                }
                title="Complainant Voice Recording / Audio Message"
              />

              {/* Admin Action Form */}
              <form onSubmit={handleUpdateIncident} className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Officer Assignment & Status Control
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Update Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as IncidentStatus)}
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assign Safety Officer / Unit</label>
                    <input
                      type="text"
                      placeholder="e.g. Officer Sarah Jenkins (Unit 4)"
                      value={assignedOfficer}
                      onChange={(e) => setAssignedOfficer(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Investigation & Action Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Enter audit investigation notes or action taken..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 py-3 bg-[#B91C1C] hover:bg-red-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    {updating ? 'Saving Update...' : 'Save & Broadcast Status Update'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIncident(null)}
                    className="px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors"
                  >
                    Cancel
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
