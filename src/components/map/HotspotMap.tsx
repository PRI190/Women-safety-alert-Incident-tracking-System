import React, { useState, useEffect } from 'react';
import { SafetyHotspot, Incident, SOSAlert } from '../../types';
import { api } from '../../services/api';
import { MapPin, ShieldCheck, Info, Search, Filter, RefreshCw, Compass } from 'lucide-react';
import { InteractiveEmergencyMap } from '../common/InteractiveEmergencyMap';

interface HotspotMapProps {
  interactive?: boolean;
}

export const HotspotMap: React.FC<HotspotMapProps> = ({ interactive = true }) => {
  const [hotspots, setHotspots] = useState<SafetyHotspot[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    setLoading(true);
    try {
      const [hsData, incData, sosData] = await Promise.all([
        api.getSafetyHotspots(),
        api.getIncidents(),
        api.getSOSAlerts()
      ]);
      setHotspots(hsData || []);
      setIncidents(incData || []);
      setSosAlerts(sosData || []);
    } catch (e) {
      console.error('Failed loading map GIS data:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 md:p-7 shadow-xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6C63FF] mb-1">
            <Compass className="w-4 h-4" />
            Live GPS & Safety Risk Map
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">Interactive Emergency Radar Map</h3>
          <p className="text-xs text-slate-500">
            Realtime GPS location streaming, active SOS emergency pins, and safety hotspot danger zones.
          </p>
        </div>

        <button
          onClick={loadMapData}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh GIS Radar
        </button>
      </div>

      {/* Real-Time Interactive Leaflet Map */}
      <InteractiveEmergencyMap
        incidents={incidents}
        sosAlerts={sosAlerts}
        hotspots={hotspots}
        height="550px"
      />
    </div>
  );
};

