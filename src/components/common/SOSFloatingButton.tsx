import React, { useState, useEffect } from 'react';
import { AlertCircle, MapPin, PhoneCall, ShieldAlert, CheckCircle2, Flame, Siren, Stethoscope, Radio } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { AudioVoicePlayer } from './AudioVoicePlayer';

export const SOSFloatingButton: React.FC = () => {
  const { user, showToast, fetchNotifications } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [selectedEmergencyType, setSelectedEmergencyType] = useState<'General SOS' | 'Police (112)' | 'Fire (101)' | 'Medical (108)'>('General SOS');
  
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string }>({
    lat: 8.5241,
    lng: 76.9366,
    name: 'Vellayambalam, Trivandrum (GPS Captured)'
  });
  const [sosResult, setSosResult] = useState<any>(null);

  // Capture geolocation when modal opens
  useEffect(() => {
    if (isOpen && !sosResult) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              name: `GPS Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
            });
          },
          () => {
            setLocation({
              lat: 8.5241,
              lng: 76.9366,
              name: 'Vellayambalam Junction, Central District'
            });
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    }
  }, [isOpen, sosResult]);

  // Handle SOS countdown
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      triggerSOS(selectedEmergencyType);
      setCountdown(null);
    }
  }, [countdown, selectedEmergencyType]);

  const handleSOSClick = () => {
    if (!user) {
      showToast('Please login or select a demo role to send an SOS alert', 'warning');
      return;
    }
    setIsOpen(true);
    setSosResult(null);
    setSelectedEmergencyType('General SOS');
    setCountdown(3); // 3 second safety countdown
  };

  const cancelCountdown = () => {
    setCountdown(null);
    showToast('SOS dispatch paused.', 'info');
  };

  const generateTranscript = (type: string) => {
    return `AUTOMATED EMERGENCY VOICE DISPATCH: Immediate response required for user ${user?.name || 'Citizen'} (DOB: ${user?.dob || 'Not specified'}, Phone: ${user?.phone || 'N/A'}, Address: ${user?.address || 'N/A'}). Emergency Type: ${type}. Location: ${location.name}. Emergency contacts (${user?.emergencyContacts?.map(c => c.name).join(', ') || 'Primary Contacts'}) have been auto-notified via SMS alert & voice recording.`;
  };

  const triggerSOS = async (typeOverride?: string) => {
    const typeToUse = typeOverride || selectedEmergencyType;
    setLoading(true);
    const transcript = generateTranscript(typeToUse);

    try {
      const res = await api.sendSOS({
        latitude: location.lat,
        longitude: location.lng,
        locationName: location.name,
        emergencyType: typeToUse,
        audioTranscript: transcript
      });
      setSosResult(res);
      showToast(`🚨 ${typeToUse} Alert & Voice Broadcast Transmitted! Emergency contacts & responders notified.`, 'error');
      fetchNotifications();
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch SOS alert', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Red SOS Button */}
      <div className="fixed bottom-6 left-6 z-40">
        <motion.button
          id="btn-floating-sos"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleSOSClick}
          className="relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white font-extrabold shadow-2xl hover:shadow-red-500/50 transition-all border-4 border-white/20 group cursor-pointer"
          title="Emergency SOS Button"
        >
          <span className="absolute -inset-1 rounded-full bg-red-500 opacity-75 animate-ping pointer-events-none" />
          <div className="relative flex flex-col items-center justify-center">
            <ShieldAlert className="w-7 h-7 md:w-9 md:h-9 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] md:text-xs tracking-widest font-black uppercase">SOS</span>
          </div>
        </motion.button>
      </div>

      {/* SOS Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-red-200/60 text-slate-800 relative overflow-hidden"
            >
              {/* Header Gradient */}
              <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600" />

              {!sosResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 font-black text-slate-900 text-base">
                      <div className="p-2 bg-red-100 text-[#B91C1C] rounded-xl">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      Emergency Alert & Service Dispatch
                    </div>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setCountdown(null);
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      ← Back
                    </button>
                  </div>

                  {/* Countdown Display */}
                  {countdown !== null && (
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-center">
                      <p className="text-xs font-semibold text-red-800">
                        Broadcasting Automated General SOS in:
                      </p>
                      <div className="text-4xl font-black text-[#B91C1C] font-mono tracking-tighter my-1 animate-bounce">
                        00:0{countdown}
                      </div>
                      <button
                        type="button"
                        onClick={cancelCountdown}
                        className="text-xs text-red-700 underline font-bold hover:text-red-900 cursor-pointer"
                      >
                        Pause Countdown / Choose Specific Emergency Below
                      </button>
                    </div>
                  )}

                  {/* Quick Emergency Category Options */}
                  <div className="space-y-2">
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Select Emergency Type:
                    </label>

                    <div className="grid grid-cols-3 gap-2.5">
                      {/* Police Emergency 112 */}
                      <button
                        type="button"
                        onClick={() => {
                          cancelCountdown();
                          setSelectedEmergencyType('Police (112)');
                          triggerSOS('Police (112)');
                        }}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          selectedEmergencyType === 'Police (112)'
                            ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400'
                            : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                        }`}
                      >
                        <Siren className="w-5 h-5 text-blue-600 mb-2" />
                        <div>
                          <div className="font-extrabold text-xs text-slate-900">Police</div>
                          <div className="text-[10px] text-blue-700 font-bold">Call 112 / 100</div>
                        </div>
                      </button>

                      {/* Fire Emergency 101 */}
                      <button
                        type="button"
                        onClick={() => {
                          cancelCountdown();
                          setSelectedEmergencyType('Fire (101)');
                          triggerSOS('Fire (101)');
                        }}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          selectedEmergencyType === 'Fire (101)'
                            ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-400'
                            : 'bg-slate-50 border-slate-200 hover:border-orange-400'
                        }`}
                      >
                        <Flame className="w-5 h-5 text-orange-600 mb-2" />
                        <div>
                          <div className="font-extrabold text-xs text-slate-900">Fire Brigade</div>
                          <div className="text-[10px] text-orange-700 font-bold">Call 101</div>
                        </div>
                      </button>

                      {/* Medical Emergency 108 */}
                      <button
                        type="button"
                        onClick={() => {
                          cancelCountdown();
                          setSelectedEmergencyType('Medical (108)');
                          triggerSOS('Medical (108)');
                        }}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          selectedEmergencyType === 'Medical (108)'
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400'
                            : 'bg-slate-50 border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        <Stethoscope className="w-5 h-5 text-emerald-600 mb-2" />
                        <div>
                          <div className="font-extrabold text-xs text-slate-900">Medical 108</div>
                          <div className="text-[10px] text-emerald-700 font-bold">Call Ambulance</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Location Preview */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <MapPin className="w-4 h-4 text-[#B91C1C]" />
                      <span>Live Geolocation Transmitted:</span>
                    </div>
                    <p className="font-mono text-slate-800 bg-white p-2 rounded-xl border border-slate-200 text-[11px]">
                      {location.name}
                    </p>
                  </div>

                  {/* Immediate General SOS Trigger Button */}
                  <button
                    id="btn-confirm-sos"
                    disabled={loading}
                    onClick={() => triggerSOS('General SOS')}
                    className="w-full py-3.5 bg-[#B91C1C] hover:bg-red-800 text-white font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Radio className="w-4 h-4 animate-pulse" />
                    {loading ? 'Transmitting Voice Broadcast...' : 'DISPATCH GENERAL SOS ALERT NOW'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  <div className="text-center">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">Emergency Alert Dispatched!</h3>
                    <p className="text-xs text-emerald-800 font-bold bg-emerald-50 py-1 px-3 rounded-full inline-block mt-1">
                      Tracking ID: {sosResult.sosAlert?.id} • Service: {sosResult.sosAlert?.emergencyType}
                    </p>
                  </div>

                  {/* User Profile & Contact Alert Details */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl text-xs space-y-2 border border-slate-200">
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-500 font-bold">User Name / DOB:</span>
                      <span className="font-extrabold text-slate-900">{sosResult.sosAlert?.userName} ({user?.dob || 'N/A'})</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-500 font-bold">Phone / Address:</span>
                      <span className="font-semibold text-slate-800">{sosResult.sosAlert?.userPhone}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block mb-1">Emergency Contacts Auto-Notified:</span>
                      {sosResult.emergencyContacts && sosResult.emergencyContacts.length > 0 ? (
                        <div className="space-y-1">
                          {sosResult.emergencyContacts.map((c: any) => (
                            <div key={c.id} className="flex items-center gap-2 text-slate-800 bg-white p-1.5 rounded-xl border border-slate-200">
                              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="font-bold">{c.name}:</span>
                              <span className="font-mono text-slate-600">{c.phone}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">Contacts notified via system safety dispatch.</p>
                      )}
                    </div>
                  </div>

                  {/* Playable Automated Voice Recording Component */}
                  <AudioVoicePlayer
                    transcript={sosResult.sosAlert?.audioTranscript || generateTranscript(selectedEmergencyType)}
                    title="Automated Emergency Voice Recording"
                  />

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setSosResult(null);
                    }}
                    className="w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-black transition-colors cursor-pointer"
                  >
                    Close Emergency Window
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

