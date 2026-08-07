import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SOSAlert } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, MapPin, PhoneCall, CheckCircle2, Clock, Volume2, RefreshCw } from 'lucide-react';
import { AudioVoicePlayer } from '../../components/common/AudioVoicePlayer';

export const AdminSOSPage: React.FC = () => {
  const { showToast } = useAuth();
  const [sosList, setSosList] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSOS();
  }, []);

  const loadSOS = async () => {
    setLoading(true);
    try {
      const data = await api.getSOSAlerts();
      setSosList(data);
    } catch (e) {
      console.error('Failed fetching SOS alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSOS = async (id: string, status: string) => {
    try {
      await api.updateSOS(id, {
        status,
        notes: `Marked as ${status} by Admin Command Center.`
      });
      showToast(`SOS ${id} status updated to ${status}`, 'success');
      loadSOS();
    } catch (err: any) {
      showToast(err.message || 'Failed to update SOS alert', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-600 rounded-2xl animate-pulse">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Emergency SOS Dispatch Portal</h1>
            <p className="text-xs text-slate-400 mt-1">Realtime emergency beacon signals and police dispatch logs.</p>
          </div>
        </div>

        <button
          onClick={loadSOS}
          className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 font-bold text-xs border border-slate-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Calls
        </button>
      </div>

      {/* SOS List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 space-y-4">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-400">Loading emergency SOS signals...</div>
        ) : sosList.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">No active or historic SOS alerts.</div>
        ) : (
          <div className="space-y-4">
            {sosList.map((sos) => {
              const isActive = sos.status === 'ACTIVE' || sos.status === 'DISPATCHED';

              return (
                <div
                  key={sos.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    isActive
                      ? 'bg-rose-50/80 border-rose-300 shadow-lg shadow-rose-500/10'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200/60 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black text-rose-600">{sos.id}</span>
                      <span
                        className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                          sos.status === 'ACTIVE'
                            ? 'bg-rose-600 text-white animate-pulse'
                            : sos.status === 'DISPATCHED'
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {sos.status}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-500">
                      Triggered at: {new Date(sos.time).toLocaleTimeString()} ({new Date(sos.time).toLocaleDateString()})
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block font-semibold mb-0.5">Complainant User:</span>
                      <span className="font-bold text-slate-900 text-sm">{sos.userName}</span>
                      <span className="text-slate-500 block">{sos.userPhone}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block font-semibold mb-0.5">Transmitted Geolocation:</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-600" />
                        {sos.locationName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 block">
                        Coordinates: ({sos.latitude.toFixed(4)}, {sos.longitude.toFixed(4)})
                      </span>
                    </div>
                  </div>

                  {sos.notes && (
                    <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800">Dispatch Notes:</span> {sos.notes}
                    </div>
                  )}

                  {/* Audio Voice Recording Dispatch Player */}
                  <div className="pt-1">
                    <AudioVoicePlayer
                      transcript={
                        sos.audioTranscript ||
                        `AUTOMATED EMERGENCY VOICE DISPATCH: Immediate response required for user ${sos.userName} (Phone: ${sos.userPhone}). Emergency Type: ${sos.emergencyType || 'General SOS'}. Location: ${sos.locationName}. Emergency contacts have been notified.`
                      }
                      title={`Voice Dispatch Recording (${sos.emergencyType || 'General SOS'})`}
                    />
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    {sos.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleUpdateSOS(sos.id, 'DISPATCHED')}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                      >
                        Dispatch Patrol Unit
                      </button>
                    )}

                    {sos.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleUpdateSOS(sos.id, 'RESOLVED')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                      >
                        Mark Case Resolved
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
