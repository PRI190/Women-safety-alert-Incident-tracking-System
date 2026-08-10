import React, { useEffect, useState, useRef } from 'react';
import { ShieldAlert, Volume2, VolumeX, CheckCircle, Radio, MapPin, Phone, User, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';
import { SOSAlert } from '../../types';
import { startEmergencySiren, stopEmergencySiren, isSirenPlaying, playTestBeep } from '../../utils/sirenAudio';
import { motion, AnimatePresence } from 'motion/react';

export const AdminSOSAlarmBanner: React.FC = () => {
  const [activeAlerts, setActiveAlerts] = useState<SOSAlert[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isAudioAllowed, setIsAudioAllowed] = useState(true);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const prevActiveCountRef = useRef(0);

  const fetchActiveSOS = async () => {
    try {
      const allSOS = await api.getSOSAlerts();
      const active = (allSOS || []).filter((s) => s.status === 'ACTIVE' || s.status === 'DISPATCHED');
      setActiveAlerts(active);

      const unhandledActive = active.filter((s) => s.status === 'ACTIVE');

      // Trigger siren if unhandled ACTIVE SOS exists and audio is not muted
      if (unhandledActive.length > 0 && !isAudioMuted) {
        const started = startEmergencySiren();
        if (!started) {
          setIsAudioAllowed(false);
        } else {
          setIsAudioAllowed(true);
        }
      } else {
        stopEmergencySiren();
      }

      // Check if new SOS arrived
      if (unhandledActive.length > prevActiveCountRef.current) {
        // Browser desktop notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🚨 CRITICAL SOS ALERT RECEIVED!', {
            body: `Emergency signal from ${unhandledActive[0].userName}. Service: ${unhandledActive[0].emergencyType}`,
            icon: '/icon.png'
          });
        }
      }
      prevActiveCountRef.current = unhandledActive.length;
    } catch (e) {
      console.error('Failed to poll SOS alerts for alarm system:', e);
    }
  };

  useEffect(() => {
    // Request browser notification permission once
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    fetchActiveSOS();
    const interval = setInterval(fetchActiveSOS, 3500);

    return () => {
      clearInterval(interval);
      stopEmergencySiren();
    };
  }, [isAudioMuted]);

  const handleToggleMute = () => {
    if (isAudioMuted) {
      setIsAudioMuted(false);
      startEmergencySiren();
    } else {
      setIsAudioMuted(true);
      stopEmergencySiren();
    }
  };

  const handleTestAudio = () => {
    playTestBeep();
  };

  const handleDispatch = async (id: string) => {
    setDispatchingId(id);
    try {
      await api.updateSOSStatus(id, 'DISPATCHED', 'Emergency team dispatched to live GPS coordinates.');
      await fetchActiveSOS();
    } catch (e) {
      console.error('Error dispatching SOS:', e);
    } finally {
      setDispatchingId(null);
    }
  };

  const handleResolve = async (id: string) => {
    setDispatchingId(id);
    try {
      await api.updateSOSStatus(id, 'RESOLVED', 'Resolved by Admin Command Center.');
      await fetchActiveSOS();
    } catch (e) {
      console.error('Error resolving SOS:', e);
    } finally {
      setDispatchingId(null);
    }
  };

  if (activeAlerts.length === 0) {
    return (
      <div className="mb-6 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex flex-wrap items-center justify-between text-xs text-emerald-300 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-extrabold tracking-wide uppercase text-[11px]">SOS Alarm Dispatch System Active</span>
          <span className="text-emerald-400/70">• All sectors secure. Listening for incoming SOS broadcasts...</span>
        </div>
        <button
          onClick={handleTestAudio}
          className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-[10px] font-bold rounded-lg border border-emerald-500/30 transition-colors flex items-center gap-1 cursor-pointer"
          title="Test browser emergency audio synthesizer"
        >
          <Volume2 className="w-3 h-3 text-emerald-400" /> Test Alarm Sound
        </button>
      </div>
    );
  }

  const latestAlert = activeAlerts[0];
  const activeUnresolvedCount = activeAlerts.filter((s) => s.status === 'ACTIVE').length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-8 overflow-hidden rounded-3xl border-2 border-red-500 bg-gradient-to-r from-red-950 via-rose-950 to-slate-950 text-white shadow-2xl shadow-red-600/30 relative"
      >
        {/* Pulsing Top Red Warning Strip */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 p-2.5 px-6 flex items-center justify-between text-white animate-pulse">
          <div className="flex items-center gap-2 font-black text-xs md:text-sm tracking-wider uppercase">
            <Radio className="w-5 h-5 animate-spin text-white" />
            <span>🚨 CRITICAL EMERGENCY SOS SIREN ALARM ACTIVATED ({activeUnresolvedCount} ACTIVE)</span>
          </div>

          <div className="flex items-center gap-2">
            {!isAudioAllowed && (
              <span className="text-[10px] bg-yellow-400 text-slate-950 px-2 py-0.5 rounded font-extrabold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Click anywhere to enable browser audio
              </span>
            )}

            <button
              onClick={handleToggleMute}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/30"
            >
              {isAudioMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-red-200" />
                  <span>UNMUTE SIREN</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-300 animate-bounce" />
                  <span>MUTE SIREN SOUND</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Detailed Alert Info Grid */}
        <div className="p-5 md:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-900/60 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-black uppercase tracking-wider">
                  {latestAlert.emergencyType || 'GENERAL SOS'}
                </span>
                <span className="text-xs text-red-300 font-bold font-mono">ID: {latestAlert.id}</span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                  <Clock className="w-3 h-3" /> {new Date(latestAlert.time).toLocaleTimeString()}
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                <User className="w-5 h-5 text-red-400" /> {latestAlert.userName}
              </h2>
            </div>

            {/* Direct Action Dispatch Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {latestAlert.status === 'ACTIVE' && (
                <button
                  disabled={dispatchingId === latestAlert.id}
                  onClick={() => handleDispatch(latestAlert.id)}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black rounded-xl shadow-lg shadow-red-600/50 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Radio className="w-4 h-4 animate-ping" />
                  {dispatchingId === latestAlert.id ? 'Dispatching...' : 'DISPATCH RESPONDERS NOW'}
                </button>
              )}

              <button
                disabled={dispatchingId === latestAlert.id}
                onClick={() => handleResolve(latestAlert.id)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-extrabold rounded-xl border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                MARK RESOLVED
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-red-900/40 flex items-center gap-3">
              <Phone className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Phone Number</span>
                <span className="font-mono text-sm font-black text-white">{latestAlert.userPhone}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-2xl border border-red-900/40 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">GPS Geolocation</span>
                <span className="font-mono text-xs font-bold text-white truncate block max-w-[220px]">
                  {latestAlert.locationName} ({latestAlert.latitude.toFixed(4)}, {latestAlert.longitude.toFixed(4)})
                </span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-2xl border border-red-900/40 flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Current Status</span>
                <span className={`font-black text-xs uppercase ${latestAlert.status === 'ACTIVE' ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                  {latestAlert.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
