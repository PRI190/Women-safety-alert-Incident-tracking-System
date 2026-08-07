import React, { useState, useEffect } from 'react';
import { AlertCircle, MapPin, PhoneCall, Volume2, VolumeX, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export const SOSFloatingButton: React.FC = () => {
  const { user, showToast, fetchNotifications } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [audioActive, setAudioActive] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string }>({
    lat: 40.7128,
    lng: -74.006,
    name: 'Capturing current GPS coordinates...'
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
              name: `GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
            });
          },
          () => {
            setLocation({
              lat: 40.7128,
              lng: -74.006,
              name: 'Central Plaza (Fallback Location)'
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
      triggerSOS();
      setCountdown(null);
    }
  }, [countdown]);

  const handleSOSClick = () => {
    if (!user) {
      showToast('Please login or select a demo role to send an SOS alert', 'warning');
      return;
    }
    setIsOpen(true);
    setSosResult(null);
    setCountdown(3); // 3 second safety countdown
  };

  const cancelCountdown = () => {
    setCountdown(null);
    setIsOpen(false);
    showToast('SOS dispatch cancelled.', 'info');
  };

  const triggerSOS = async () => {
    setLoading(true);
    try {
      const res = await api.sendSOS({
        latitude: location.lat,
        longitude: location.lng,
        locationName: location.name
      });
      setSosResult(res);
      showToast('🚨 SOS Emergency Signal Sent to Police and Emergency Contacts!', 'error');
      fetchNotifications();
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch SOS alert', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSiren = () => {
    setAudioActive(!audioActive);
    showToast(!audioActive ? '🚨 Emergency Audible Alarm Activated' : 'Alarm silenced', 'info');
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
          className="relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white font-extrabold shadow-2xl hover:shadow-red-500/50 transition-all border-4 border-white/20 group"
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
              className="glass-card rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-red-200/60 text-slate-800 relative overflow-hidden"
            >
              {/* Header Gradient */}
              <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500" />

              {!sosResult ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-2xl animate-pulse">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Emergency SOS Alert</h3>
                      <p className="text-xs text-slate-500">Instant Police & Emergency Contact Dispatch</p>
                    </div>
                  </div>

                  {/* Countdown Display */}
                  {countdown !== null && (
                    <div className="my-6 p-6 bg-red-50 rounded-2xl border border-red-200 text-center">
                      <p className="text-sm font-semibold text-red-800 mb-2">
                        Dispatching Signal in
                      </p>
                      <div className="text-6xl font-black text-red-600 font-mono tracking-tighter my-2 animate-bounce">
                        00:0{countdown}
                      </div>
                      <p className="text-xs text-red-600">
                        Click 'Cancel' below if triggered accidentally.
                      </p>
                    </div>
                  )}

                  {/* Location Preview */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 mb-6 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <MapPin className="w-4 h-4 text-red-500" />
                      Current Geolocation:
                    </div>
                    <p className="pl-6 font-mono text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                      {location.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Coordinates will be transmitted to emergency dispatch centers instantly.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    {countdown !== null ? (
                      <button
                        id="btn-cancel-sos"
                        onClick={cancelCountdown}
                        className="w-full py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
                      >
                        Cancel Emergency Dispatch
                      </button>
                    ) : (
                      <button
                        id="btn-confirm-sos"
                        disabled={loading}
                        onClick={triggerSOS}
                        className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl shadow-lg hover:from-red-700 hover:to-rose-700 transition-all flex items-center justify-center gap-2"
                      >
                        {loading ? 'Transmitting Emergency Beacon...' : 'CONFIRM & SEND SOS NOW'}
                      </button>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={toggleSiren}
                        className={`text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 border transition-colors ${
                          audioActive
                            ? 'bg-red-100 text-red-700 border-red-300'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {audioActive ? <Volume2 className="w-4 h-4 text-red-600" /> : <VolumeX className="w-4 h-4" />}
                        {audioActive ? 'Audio Siren Active' : 'Enable Audio Siren'}
                      </button>

                      <button
                        onClick={() => setIsOpen(false)}
                        className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-1">SOS Alert Active!</h3>
                  <p className="text-xs text-emerald-700 font-medium bg-emerald-50 py-1 px-3 rounded-full inline-block mb-4">
                    Tracking ID: {sosResult.sosAlert?.id}
                  </p>

                  <div className="bg-slate-50 p-4 rounded-xl text-left text-xs space-y-2 mb-6 border border-slate-200">
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Dispatch Status:</span>
                      <span className="font-bold text-red-600 uppercase">ACTIVE / HIGH PRIORITY</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Location Sent:</span>
                      <span className="font-semibold text-slate-800">{sosResult.sosAlert?.locationName}</span>
                    </div>
                    <div className="pt-1">
                      <span className="text-slate-500 block mb-1">Emergency Contacts Transmitted:</span>
                      {sosResult.emergencyContacts && sosResult.emergencyContacts.length > 0 ? (
                        <div className="space-y-1">
                          {sosResult.emergencyContacts.map((c: any) => (
                            <div key={c.id} className="flex items-center gap-2 text-slate-700">
                              <PhoneCall className="w-3 h-3 text-emerald-600" />
                              <span>{c.name}: {c.phone}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">No primary contacts configured in profile.</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setSosResult(null);
                    }}
                    className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    Return to Dashboard
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
