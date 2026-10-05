import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { wsClient } from '../services/websocket';
import { SOSAlert, Incident } from '../types';
import { useAuth } from './AuthContext';

interface LiveLocationData {
  id: string;
  latitude: number;
  longitude: number;
  locationName: string;
  updatedAt: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  onlineDevices: number;
  lastSOSAlert: SOSAlert | null;
  lastIncident: Incident | null;
  liveTrackingMap: Record<string, LiveLocationData>;
  broadcastSOS: (sosData: any) => boolean;
  updateLiveSOSLocation: (id: string, lat: number, lng: number, locationName?: string) => boolean;
  updateSOSStatus: (id: string, status: string, notes?: string) => boolean;
  broadcastIncident: (incidentData: any) => boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, showToast, fetchNotifications } = useAuth();
  const [isConnected, setIsConnected] = useState(wsClient.isConnected);
  const [onlineDevices, setOnlineDevices] = useState(wsClient.onlineDevices);
  const [lastSOSAlert, setLastSOSAlert] = useState<SOSAlert | null>(null);
  const [lastIncident, setLastIncident] = useState<Incident | null>(null);
  const [liveTrackingMap, setLiveTrackingMap] = useState<Record<string, LiveLocationData>>({});

  // Connect on mount
  useEffect(() => {
    wsClient.connect();

    const unsubConn = wsClient.on('connection:change', ({ connected }) => {
      setIsConnected(connected);
    });

    const unsubPresence = wsClient.on('presence:update', ({ onlineDevices: count }) => {
      if (typeof count === 'number') {
        setOnlineDevices(count);
      }
    });

    // Real-Time SOS Created across any device
    const unsubSOSCreated = wsClient.on('sos:created', (sos: SOSAlert) => {
      console.log('[WebSocket] Real-time SOS alert received:', sos);
      setLastSOSAlert(sos);
      fetchNotifications();

      // Audio notification beep using Web Audio API
      playEmergencyBeep();

      const isMe = user?.id === sos.userId;
      showToast(
        isMe
          ? `🚨 Your ${sos.emergencyType || 'SOS'} broadcast was confirmed on live network (${onlineDevices} active responder devices)!`
          : `🚨 URGENT DISTRESS SIGNAL from ${sos.userName || 'Citizen'} at ${sos.locationName || 'Live Location'}!`,
        'error'
      );
    });

    // Real-time SOS Location Updates (Moving victim GPS radar)
    const unsubSOSLocation = wsClient.on('sos:location_updated', (locData: LiveLocationData) => {
      setLiveTrackingMap((prev) => ({
        ...prev,
        [locData.id]: locData
      }));
    });

    // Real-time SOS Status Updated (Dispatched, Resolved)
    const unsubSOSUpdated = wsClient.on('sos:updated', (sos: SOSAlert) => {
      setLastSOSAlert(sos);
      fetchNotifications();
      showToast(`Emergency Alert ${sos.id} status updated to "${sos.status}"`, 'info');
    });

    // Real-time Incident complaint created
    const unsubIncidentCreated = wsClient.on('incident:created', (inc: Incident) => {
      setLastIncident(inc);
      fetchNotifications();
      showToast(`New Incident report filed: "${inc.title}" (${inc.category})`, 'info');
    });

    // Real-time Incident updated
    const unsubIncidentUpdated = wsClient.on('incident:updated', (inc: Incident) => {
      setLastIncident(inc);
      fetchNotifications();
      showToast(`Incident ${inc.id} status updated to "${inc.status}"`, 'info');
    });

    return () => {
      unsubConn();
      unsubPresence();
      unsubSOSCreated();
      unsubSOSLocation();
      unsubSOSUpdated();
      unsubIncidentCreated();
      unsubIncidentUpdated();
    };
  }, [user, onlineDevices]);

  // Sync auth on login/user change
  useEffect(() => {
    if (user) {
      wsClient.sendAuth();
    }
  }, [user]);

  const broadcastSOS = (sosData: any) => {
    return wsClient.triggerSOS(sosData);
  };

  const updateLiveSOSLocation = (id: string, lat: number, lng: number, locationName?: string) => {
    return wsClient.updateSOSLocation(id, lat, lng, locationName);
  };

  const updateSOSStatus = (id: string, status: string, notes?: string) => {
    return wsClient.updateSOSStatus(id, status, notes);
  };

  const broadcastIncident = (incidentData: any) => {
    return wsClient.reportIncident(incidentData);
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        onlineDevices,
        lastSOSAlert,
        lastIncident,
        liveTrackingMap,
        broadcastSOS,
        updateLiveSOSLocation,
        updateSOSStatus,
        broadcastIncident
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Play distinct emergency audio pulse without external audio file dependencies
function playEmergencyBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch alert A5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}
