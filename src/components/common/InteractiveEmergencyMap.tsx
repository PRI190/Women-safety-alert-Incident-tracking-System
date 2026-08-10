import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Shield, AlertTriangle, RefreshCw, Radio, LayerGroup, Eye, EyeOff } from 'lucide-react';
import { Incident, SOSAlert, SafetyHotspot } from '../../types';

interface InteractiveEmergencyMapProps {
  incidents?: Incident[];
  sosAlerts?: SOSAlert[];
  hotspots?: SafetyHotspot[];
  userLocation?: { lat: number; lng: number };
  height?: string;
  className?: string;
  showControls?: boolean;
}

export const InteractiveEmergencyMap: React.FC<InteractiveEmergencyMapProps> = ({
  incidents = [],
  sosAlerts = [],
  hotspots = [],
  userLocation,
  height = '500px',
  className = '',
  showControls = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [liveGps, setLiveGps] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    speed: number | null;
  } | null>(null);

  const [mapTileStyle, setMapTileStyle] = useState<'streets' | 'dark'>('streets');
  const [showHotspotCircles, setShowHotspotCircles] = useState(true);
  const [showResponders, setShowResponders] = useState(true);
  const [isLocating, setIsLocating] = useState(false);

  // Default fallback center: Trivandrum Central / City Center
  const defaultCenter = userLocation || { lat: 8.5241, lng: 76.9366 };

  // Sample police responder stations nearby
  const policeStations = [
    { name: 'Central Women Police Station & Dispatch Hub', lat: 8.5290, lng: 76.9390, phone: '100 / 0471-2330100' },
    { name: 'Vellayambalam Emergency Response Squad', lat: 8.5210, lng: 76.9450, phone: '112 / 0471-2331112' },
    { name: 'City Safe Corridor Patrol Hub #4', lat: 8.5150, lng: 76.9320, phone: '0471-2332020' }
  ];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [defaultCenter.lat, defaultCenter.lng],
        zoom: 13,
        zoomControl: true
      });

      mapInstanceRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);

      // Default street tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle tile style toggle (Streets vs Dark Mode)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const tileUrl =
      mapTileStyle === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      attribution: mapTileStyle === 'dark' ? '&copy; CARTO & OpenStreetMap' : '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
  }, [mapTileStyle]);

  // Live Geolocation Tracking Watcher
  useEffect(() => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy, speed } = pos.coords;

        setLiveGps({
          lat: latitude,
          lng: longitude,
          accuracy: accuracy || 10,
          speed: speed || 0
        });

        const map = mapInstanceRef.current;
        if (!map) return;

        // Custom live GPS user pulse icon
        const userPulseIcon = L.divIcon({
          className: 'custom-user-gps-pin',
          html: `<div class="radar-marker-pulse" title="Your Live GPS Position"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        } else {
          userMarkerRef.current = L.marker([latitude, longitude], { icon: userPulseIcon })
            .addTo(map)
            .bindPopup(`<div style="padding:4px; font-size:12px;"><strong>📍 Your Live Location</strong><br/>GPS Accuracy: ~${Math.round(accuracy)}m</div>`);
        }

        // Accuracy Circle
        if (userAccuracyCircleRef.current) {
          userAccuracyCircleRef.current.setLatLng([latitude, longitude]);
          userAccuracyCircleRef.current.setRadius(accuracy || 30);
        } else {
          userAccuracyCircleRef.current = L.circle([latitude, longitude], {
            radius: accuracy || 30,
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.15,
            weight: 1
          }).addTo(map);
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Live location watch error:', err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Render SOS Alerts, Incidents, and Hotspot Circles on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;

    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. Render SOS Alerts (Pulsing Red Markers)
    sosAlerts.forEach((sos) => {
      const isUnresolved = sos.status === 'ACTIVE' || sos.status === 'DISPATCHED';

      const sosIcon = L.divIcon({
        className: 'custom-sos-pin',
        html: `
          <div style="position:relative; width:32px; height:32px; display:flex; align-items:center; justify-content:center; background:${isUnresolved ? '#dc2626' : '#16a34a'}; border:3px solid #ffffff; border-radius:50%; box-shadow:0 0 12px rgba(220,38,38,0.8); color:white; font-weight:900; font-size:11px;">
            ${isUnresolved ? '<span style="position:absolute; inset:-6px; border-radius:50%; background:rgba(220,38,38,0.5); animation:leaflet-radar 1.5s infinite;"></span>' : ''}
            SOS
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const sosMarker = L.marker([sos.latitude, sos.longitude], { icon: sosIcon });
      sosMarker.bindPopup(`
        <div style="min-width:210px; font-family:sans-serif; padding:4px;">
          <div style="background:${isUnresolved ? '#dc2626' : '#16a34a'}; color:white; padding:4px 8px; border-radius:6px; font-weight:800; font-size:11px; text-transform:uppercase; margin-bottom:6px; display:inline-block;">
            🚨 ${sos.emergencyType || 'EMERGENCY SOS'}
          </div>
          <div style="font-size:13px; font-weight:800; color:#0f172a;">${sos.userName}</div>
          <div style="font-size:11px; color:#475569; margin-top:2px;"><strong>Phone:</strong> ${sos.userPhone}</div>
          <div style="font-size:11px; color:#475569; margin-top:2px;"><strong>Location:</strong> ${sos.locationName}</div>
          <div style="font-size:10px; color:#dc2626; font-weight:800; margin-top:6px; text-transform:uppercase;">Status: ${sos.status}</div>
        </div>
      `);

      markersGroup.addLayer(sosMarker);
    });

    // 2. Render Incident Pins
    incidents.forEach((inc) => {
      const isHigh = inc.severity === 'HIGH';
      const color = isHigh ? '#b91c1c' : inc.severity === 'MEDIUM' ? '#ea580c' : '#2563eb';

      const incIcon = L.divIcon({
        className: 'custom-inc-pin',
        html: `
          <div style="width:26px; height:26px; background:${color}; border:2px solid #ffffff; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:bold; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
            ⚠️
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const incMarker = L.marker([inc.latitude, inc.longitude], { icon: incIcon });
      incMarker.bindPopup(`
        <div style="min-width:200px; font-family:sans-serif;">
          <div style="font-size:11px; font-weight:800; color:${color}; text-transform:uppercase; margin-bottom:2px;">
            ${inc.category} (${inc.severity} RISK)
          </div>
          <div style="font-size:12px; font-weight:bold; color:#1e293b;">${inc.title}</div>
          <div style="font-size:11px; color:#64748b; margin-top:4px;">${inc.locationName}</div>
          <div style="font-size:10px; background:#f1f5f9; padding:4px 6px; border-radius:4px; margin-top:6px; color:#334155;">Status: <strong>${inc.status}</strong></div>
        </div>
      `);

      markersGroup.addLayer(incMarker);
    });

    // 3. Render High Risk Hotspot Zones (Circles)
    if (showHotspotCircles) {
      hotspots.forEach((hs) => {
        const circleColor = hs.riskLevel === 'HIGH' ? '#dc2626' : hs.riskLevel === 'MEDIUM' ? '#f97316' : '#10b981';

        const circle = L.circle([hs.latitude, hs.longitude], {
          radius: hs.radiusMeters || 450,
          color: circleColor,
          fillColor: circleColor,
          fillOpacity: 0.18,
          weight: 2,
          dashArray: hs.riskLevel === 'HIGH' ? '6, 6' : undefined
        });

        circle.bindPopup(`
          <div style="font-family:sans-serif; padding:4px;">
            <div style="font-size:12px; font-weight:800; color:${circleColor}; text-transform:uppercase;">
              🔥 ${hs.name}
            </div>
            <div style="font-size:11px; color:#334155; margin-top:4px;">Risk Level: <strong>${hs.riskLevel} DANGER ZONE</strong></div>
            <div style="font-size:11px; color:#64748b; margin-top:2px;">Recent Incidents: ${hs.incidentsCount} reported</div>
            <div style="font-size:10px; color:#475569; margin-top:4px; font-style:italic;">${hs.safetyTips?.[0] || 'Patrolled regularly'}</div>
          </div>
        `);

        markersGroup.addLayer(circle);
      });
    }

    // 4. Render Responder Police Stations
    if (showResponders) {
      policeStations.forEach((ps) => {
        const psIcon = L.divIcon({
          className: 'custom-ps-pin',
          html: `
            <div style="width:28px; height:28px; background:#1e40af; border:2px solid #ffffff; border-radius:6px; display:flex; align-items:center; justify-content:center; color:white; font-size:12px; font-weight:bold; box-shadow:0 2px 8px rgba(30,64,175,0.4);">
              👮
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const psMarker = L.marker([ps.lat, ps.lng], { icon: psIcon });
        psMarker.bindPopup(`
          <div style="font-family:sans-serif; padding:2px;">
            <div style="font-size:12px; font-weight:800; color:#1e40af;">👮 ${ps.name}</div>
            <div style="font-size:11px; color:#475569; margin-top:3px;">Helpline / Dispatch: <strong>${ps.phone}</strong></div>
            <div style="font-size:10px; color:#16a34a; font-weight:bold; margin-top:4px;">STATUS: ACTIVE 24/7</div>
          </div>
        `);

        markersGroup.addLayer(psMarker);
      });
    }
  }, [incidents, sosAlerts, hotspots, showHotspotCircles, showResponders]);

  const recenterToLiveGps = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (liveGps) {
      map.flyTo([liveGps.lat, liveGps.lng], 15, { duration: 1.2 });
    } else if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 1.2 });
        },
        () => setIsLocating(false)
      );
    }
  };

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-slate-900 ${className}`}>
      {/* Top Map Control Overlay Bar */}
      {showControls && (
        <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Live Location Badge */}
          <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 text-white shadow-lg flex items-center gap-2 text-xs">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
            <div>
              <div className="font-extrabold flex items-center gap-1.5 text-[11px] leading-tight text-white">
                <span>LIVE GPS RADAR</span>
                {isLocating && <span className="text-[10px] text-amber-400 font-normal animate-pulse">(Acquiring...)</span>}
              </div>
              <p className="text-[10px] text-slate-300 font-mono">
                {liveGps ? `${liveGps.lat.toFixed(4)}, ${liveGps.lng.toFixed(4)} (±${Math.round(liveGps.accuracy)}m)` : 'Locating GPS...'}
              </p>
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-lg">
            <button
              type="button"
              onClick={recenterToLiveGps}
              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow transition-all flex items-center gap-1 cursor-pointer"
              title="Recenter Map to Live GPS"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Center GPS</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHotspotCircles(!showHotspotCircles)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                showHotspotCircles ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Toggle Risk Hotspot Circles"
            >
              {showHotspotCircles ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Hotspots</span>
            </button>

            <button
              type="button"
              onClick={() => setMapTileStyle(mapTileStyle === 'streets' ? 'dark' : 'streets')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Toggle Map Style"
            >
              {mapTileStyle === 'streets' ? '🌙 Dark Map' : '☀️ Light Map'}
            </button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainerRef} style={{ height }} className="w-full z-0" />

      {/* Bottom Map Legend */}
      <div className="p-3 bg-slate-950 text-slate-300 border-t border-slate-800 text-[11px] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse border border-white" />
            <span className="font-extrabold text-white">Active SOS</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-600 border border-white" />
            <span className="font-semibold">Police / Responders</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500/50 border border-amber-400" />
            <span className="font-semibold">High Risk Hotspot</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="font-semibold">Your Live Location</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400">
          Real-time GPS Tracking Engine • OpenStreetMap & Leaflet
        </div>
      </div>
    </div>
  );
};
