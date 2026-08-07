import React, { useState, useEffect } from 'react';
import { HotspotArea, RiskLevel } from '../../types';
import { api } from '../../services/api';
import { MapPin, AlertTriangle, ShieldCheck, Info, Search, Filter, RefreshCw, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HotspotMapProps {
  interactive?: boolean;
}

export const HotspotMap: React.FC<HotspotMapProps> = ({ interactive = true }) => {
  const [hotspots, setHotspots] = useState<HotspotArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotArea | null>(null);
  const [filterRisk, setFilterRisk] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHotspots();
  }, []);

  const loadHotspots = async () => {
    setLoading(true);
    try {
      const data = await api.getHotspots();
      setHotspots(data);
      if (data.length > 0) {
        setSelectedHotspot(data[0]);
      }
    } catch (e) {
      console.error('Failed loading hotspots:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredHotspots = hotspots.filter((h) => {
    const matchesRisk = filterRisk === 'All' || h.riskLevel === filterRisk;
    const matchesSearch =
      h.areaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.primaryCategories.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesRisk && matchesSearch;
  });

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'Danger':
        return {
          bg: 'bg-rose-500',
          border: 'border-rose-600',
          badge: 'bg-rose-100 text-rose-700 border-rose-300',
          glow: 'shadow-rose-500/50'
        };
      case 'Moderate':
        return {
          bg: 'bg-amber-500',
          border: 'border-amber-600',
          badge: 'bg-amber-100 text-amber-700 border-amber-300',
          glow: 'shadow-amber-500/50'
        };
      case 'Safe':
        return {
          bg: 'bg-emerald-500',
          border: 'border-emerald-600',
          badge: 'bg-emerald-100 text-emerald-700 border-emerald-300',
          glow: 'shadow-emerald-500/50'
        };
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 md:p-7 shadow-xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6C63FF] mb-1">
            <Compass className="w-4 h-4" />
            Safety Risk Analytics Map
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">Interactive Incident Hotspot Map</h3>
          <p className="text-xs text-slate-500">
            Green (Safe), Yellow (Moderate), and Red (High Risk / Danger) zone categorization.
          </p>
        </div>

        {/* Filter & Search Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search area or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF] w-48"
            />
          </div>

          {/* Risk Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {['All', 'Danger', 'Moderate', 'Safe'].map((level) => (
              <button
                key={level}
                onClick={() => setFilterRisk(level)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  filterRisk === level ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <button
            onClick={loadHotspots}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            title="Refresh Map Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Graphic Canvas Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View Canvas */}
        <div className="lg:col-span-2 relative h-[380px] md:h-[450px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex flex-col justify-between p-4">
          {/* Simulated Map Grid Background */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#6C63FF 1px, transparent 1px), radial-gradient(#38bdf8 1px, transparent 1px)`,
              backgroundSize: `24px 24px`,
              backgroundPosition: `0 0, 12px 12px`
            }}
          />

          {/* Map Top Overlay Bar */}
          <div className="relative z-10 flex items-center justify-between bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-xs text-slate-300">
            <span className="font-mono flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              GPS Grid Engine Active
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Safe
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Moderate
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Danger
              </span>
            </div>
          </div>

          {/* Interactive Pin Markers on Canvas */}
          <div className="relative z-10 flex-1 my-4 flex items-center justify-center">
            {loading ? (
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#6C63FF]" /> Loading Hotspot GIS Data...
              </div>
            ) : filteredHotspots.length === 0 ? (
              <div className="text-xs text-slate-400">No hotspot zones match current filter.</div>
            ) : (
              <div className="relative w-full h-full max-w-lg mx-auto">
                {filteredHotspots.map((hs, index) => {
                  const riskConfig = getRiskColor(hs.riskLevel);
                  const isSelected = selectedHotspot?.id === hs.id;

                  // Precalculated relative map positions for visual scatter
                  const positions = [
                    { top: '22%', left: '25%' },
                    { top: '55%', left: '60%' },
                    { top: '35%', left: '80%' },
                    { top: '70%', left: '30%' },
                    { top: '42%', left: '45%' }
                  ];

                  const pos = positions[index % positions.length];

                  return (
                    <div
                      key={hs.id}
                      style={{ top: pos.top, left: pos.left }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                      onClick={() => setSelectedHotspot(hs)}
                    >
                      {/* Aura Ripple */}
                      <span
                        className={`absolute -inset-3 rounded-full opacity-40 animate-ping pointer-events-none ${riskConfig.bg}`}
                      />

                      {/* Pin Icon */}
                      <motion.div
                        whileHover={{ scale: 1.25 }}
                        className={`relative p-2.5 rounded-2xl ${riskConfig.bg} text-white shadow-lg ${
                          riskConfig.glow
                        } border-2 ${isSelected ? 'border-white ring-4 ring-white/30 scale-110' : 'border-white/40'}`}
                      >
                        <MapPin className="w-5 h-5" />
                        <span className="absolute -bottom-2 -right-1 bg-slate-950 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-slate-800">
                          {hs.incidentCount}
                        </span>
                      </motion.div>

                      {/* Tooltip Label on Hover */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-slate-950 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-800 whitespace-nowrap shadow-xl z-30">
                        {hs.areaName} ({hs.riskLevel})
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom GIS Indicator */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span>Showing {filteredHotspots.length} registered hotspot risk zones</span>
            <span>Click any marker to inspect safety advisory</span>
          </div>
        </div>

        {/* Selected Zone Inspector Panel */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between">
          {selectedHotspot ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      getRiskColor(selectedHotspot.riskLevel).badge
                    } mb-2`}
                  >
                    Risk Level: {selectedHotspot.riskLevel}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 leading-tight">
                    {selectedHotspot.areaName}
                  </h4>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Reported Incidents:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {selectedHotspot.incidentCount} complaints
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Primary Threat Types:</span>
                  <span className="font-semibold text-[#6C63FF]">
                    {selectedHotspot.primaryCategories.join(', ')}
                  </span>
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Recommended Safety Tips
                </h5>
                <ul className="space-y-1.5">
                  {selectedHotspot.safetyTips.map((tip, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF] mt-1.5 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select a marker on the map to inspect area safety details.
            </div>
          )}

          <div className="pt-4 mt-4 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-[#6C63FF]" />
            Hotspot data auto-updates from verified community reports.
          </div>
        </div>
      </div>
    </div>
  );
};
