import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  RefreshCw,
  Radio,
  Eye,
  EyeOff,
  Maximize2,
  MapPin,
  Search,
  X,
  Phone,
  Layers,
  Building2,
  Shield,
  HeartPulse,
  TrainTrack,
  ExternalLink,
  Globe,
  ChevronDown,
  LocateFixed,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Incident, SOSAlert, SafetyHotspot } from '../../types';
import {
  watchDeviceLocation,
  getCachedLocation,
  requestDeviceLocation,
  fetchDeviceLocationWithPermission,
  queryGeolocationPermission,
  GeolocationPermissionState,
  DeviceLocation,
  reverseGeocode
} from '../../utils/geolocation';
import {
  fetchCountries,
  allocateMapLocation,
  CountryData
} from '../../services/countriesService';
import { useWebSocket } from '../../context/WebSocketContext';

interface InteractiveEmergencyMapProps {
  incidents?: Incident[];
  sosAlerts?: SOSAlert[];
  hotspots?: SafetyHotspot[];
  userLocation?: { lat: number; lng: number };
  height?: string;
  className?: string;
  showControls?: boolean;
}

type MapLayerType = 'streets' | 'carto' | 'satellite' | 'dark' | 'topo';
type PlaceFilterType = 'all' | 'police' | 'sos' | 'hotspots' | 'hospital' | 'transit';

interface MapPlace {
  id: string;
  name: string;
  category: 'police' | 'hospital' | 'transit' | 'safe_haven';
  lat: number;
  lng: number;
  phone?: string;
  details?: string;
  address?: string;
  distance?: string;
  officerInCharge?: string;
  badges?: string[];
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
  const baseTilesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const placesGroupRef = useRef<L.LayerGroup | null>(null);
  const searchPinRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  
  const hasAutoCenteredRef = useRef<boolean>(false);
  const hasUpgradedToGpsRef = useRef<boolean>(false);

  // Retrieve cached location or userLocation prop
  const initialLoc = getCachedLocation();

  const { lastSOSAlert, lastIncident, liveTrackingMap } = useWebSocket();
  const [liveSOSList, setLiveSOSList] = useState<SOSAlert[]>([]);
  const [liveIncidentList, setLiveIncidentList] = useState<Incident[]>([]);

  useEffect(() => {
    if (lastSOSAlert) {
      setLiveSOSList((prev) => {
        const idx = prev.findIndex((s) => s.id === lastSOSAlert.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...lastSOSAlert };
          return updated;
        }
        return [lastSOSAlert, ...prev];
      });
    }
  }, [lastSOSAlert]);

  useEffect(() => {
    if (lastIncident) {
      setLiveIncidentList((prev) => {
        const idx = prev.findIndex((i) => i.id === lastIncident.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...lastIncident };
          return updated;
        }
        return [lastIncident, ...prev];
      });
    }
  }, [lastIncident]);

  const [liveLocation, setLiveLocation] = useState<DeviceLocation | null>(initialLoc);
  const [mapLayer, setMapLayer] = useState<MapLayerType>('streets');
  const [placeFilter, setPlaceFilter] = useState<PlaceFilterType>('all');
  const [showHotspotCircles, setShowHotspotCircles] = useState(true);
  const [showPlacesLayer, setShowPlacesLayer] = useState(true);
  const [showPoliceDirectory, setShowPoliceDirectory] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [permissionState, setPermissionState] = useState<GeolocationPermissionState>('prompt');
  const [permissionErrorMessage, setPermissionErrorMessage] = useState<string | null>(null);
  const [locationSuccessNotice, setLocationSuccessNotice] = useState<string | null>(null);
  const [locationStatusText, setLocationStatusText] = useState<string>(
    initialLoc ? `📍 ${initialLoc.areaName || 'Live Location'}` : 'Detecting Device Location...'
  );

  // CountriesNow API Map Allocation State
  const [countriesList, setCountriesList] = useState<CountryData[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('India');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [countrySearchQuery, setCountrySearchQuery] = useState<string>('');
  const [isAllocating, setIsAllocating] = useState<boolean>(false);
  const [showAllocationPanel, setShowAllocationPanel] = useState<boolean>(false);
  const [allocatedPlace, setAllocatedPlace] = useState<string | null>(null);

  // Place Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  // Load countries from CountriesNow API on mount
  useEffect(() => {
    fetchCountries().then((data) => {
      setCountriesList(data || []);
      if (data && data.length > 0) {
        // Default to India if available, else first country
        const india = data.find((c) => c.country.toLowerCase() === 'india');
        if (india) {
          setSelectedCountry('India');
        } else {
          setSelectedCountry(data[0].country);
        }
      }
    });
  }, []);

  // Determine center priority
  const getStartingCoordinates = (): [number, number] => {
    if (userLocation && !isNaN(userLocation.lat)) {
      return [userLocation.lat, userLocation.lng];
    }
    if (initialLoc && !isNaN(initialLoc.latitude)) {
      return [initialLoc.latitude, initialLoc.longitude];
    }
    if (sosAlerts.length > 0 && sosAlerts[0].latitude) {
      return [sosAlerts[0].latitude, sosAlerts[0].longitude];
    }
    if (incidents.length > 0 && incidents[0].latitude) {
      return [incidents[0].latitude, incidents[0].longitude];
    }
    return [28.6139, 77.2090];
  };

  // Helper to switch map base tiles (Esri World Street Map by default with crystal clear road lining, never 403-blocked)
  const applyTileLayer = (layerType: MapLayerType) => {
    const map = mapInstanceRef.current;
    if (!map || !baseTilesLayerGroupRef.current) return;

    baseTilesLayerGroupRef.current.clearLayers();

    if (layerType === 'streets') {
      // High-Detail Esri World Street Map with crisp street linings, road names, highway shields & all place names (No 403 blocking)
      const streetTiles = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Street Map & Navigation Network',
          maxZoom: 19
        }
      );
      baseTilesLayerGroupRef.current.addLayer(streetTiles);
    } else if (layerType === 'carto') {
      // CARTO Voyager Crisp Light Urban Vector-Raster Map
      const cartoTiles = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; CARTO &copy; OpenStreetMap contributors',
          subdomains: ['a', 'b', 'c', 'd'],
          maxZoom: 19
        }
      );
      baseTilesLayerGroupRef.current.addLayer(cartoTiles);
    } else if (layerType === 'satellite') {
      // Satellite Imagery + High-resolution Place Names & Road Linings Overlays
      const satImagery = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri Satellite Imagery',
          maxZoom: 18
        }
      );
      const satRoadsAndPlaces = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Labels &copy; Esri',
          maxZoom: 18
        }
      );
      const satTransportation = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Roads &copy; Esri',
          maxZoom: 18
        }
      );
      baseTilesLayerGroupRef.current.addLayer(satImagery);
      baseTilesLayerGroupRef.current.addLayer(satTransportation);
      baseTilesLayerGroupRef.current.addLayer(satRoadsAndPlaces);
    } else if (layerType === 'dark') {
      // High-contrast Night & Emergency Transit Map
      const darkTiles = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; CARTO &copy; OpenStreetMap contributors',
          subdomains: ['a', 'b', 'c', 'd'],
          maxZoom: 19
        }
      );
      baseTilesLayerGroupRef.current.addLayer(darkTiles);
    } else if (layerType === 'topo') {
      // Topographic & Relief Map with road elevations and place contours
      const topoTiles = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri World Topo Map',
          maxZoom: 18
        }
      );
      baseTilesLayerGroupRef.current.addLayer(topoTiles);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const starting = getStartingCoordinates();
      const map = L.map(mapContainerRef.current, {
        center: starting,
        zoom: initialLoc || userLocation ? 15 : 13,
        zoomControl: false,
        scrollWheelZoom: true
      });

      mapInstanceRef.current = map;

      // Base tile group
      baseTilesLayerGroupRef.current = L.layerGroup().addTo(map);
      applyTileLayer(mapLayer);

      // Dedicated layer groups
      placesGroupRef.current = L.layerGroup().addTo(map);
      markersGroupRef.current = L.layerGroup().addTo(map);

      // On-click map inspector: click any place on the map to reveal its exact place name & street
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const placeName = await reverseGeocode(lat, lng);

        L.popup()
          .setLatLng([lat, lng])
          .setContent(`
            <div style="min-width: 220px; font-family: sans-serif; padding: 2px;">
              <div style="font-size: 11px; font-weight: 800; color: #dc2626; text-transform: uppercase; margin-bottom: 2px;">
                📍 Selected Place / Landmark
              </div>
              <div style="font-size: 13px; font-weight: bold; color: #0f172a; line-height: 1.3;">
                ${placeName}
              </div>
              <div style="font-size: 10px; color: #64748b; margin-top: 4px; font-family: monospace;">
                ${lat.toFixed(5)}, ${lng.toFixed(5)}
              </div>
              <div style="margin-top: 8px; display: flex; gap: 6px;">
                <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #2563eb; color: #fff; font-size: 10px; font-weight: bold; padding: 4px 8px; border-radius: 6px; text-decoration: none;">
                  Get Directions ↗
                </a>
              </div>
            </div>
          `)
          .openOn(map);
      });

      // Dimensions invalidation
      const t1 = setTimeout(() => map.invalidateSize(), 150);
      const t2 = setTimeout(() => map.invalidateSize(), 500);

      const ro = new ResizeObserver(() => {
        map.invalidateSize();
      });
      ro.observe(mapContainerRef.current);

      if (initialLoc) {
        hasAutoCenteredRef.current = true;
        map.setView([initialLoc.latitude, initialLoc.longitude], 15);
      }

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        ro.disconnect();
        map.remove();
        mapInstanceRef.current = null;
        baseTilesLayerGroupRef.current = null;
        markersGroupRef.current = null;
        placesGroupRef.current = null;
      };
    }
  }, []);

  // Update base tiles on style change
  useEffect(() => {
    applyTileLayer(mapLayer);
  }, [mapLayer]);

  // Request & Watch Device Geolocation
  useEffect(() => {
    setIsLocating(true);

    const unsubscribe = watchDeviceLocation((loc) => {
      setLiveLocation(loc);
      setIsLocating(false);
      if (!allocatedPlace) {
        setLocationStatusText(
          `📍 ${loc.areaName || (loc.city ? `${loc.city}` : 'Live Coordinates')} (${loc.source === 'gps' ? 'High Precision GPS' : 'Network/IP Geo'})`
        );
      }

      const map = mapInstanceRef.current;
      if (!map) return;

      const userPulseHtml = `
        <div style="position:relative; width:28px; height:28px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; inset:-8px; border-radius:50%; background:rgba(239,68,68,0.4); animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="position:relative; width:18px; height:18px; border-radius:50%; background:#ef4444; border:3px solid #ffffff; box-shadow:0 0 16px rgba(239,68,68,0.9); z-index:2;"></div>
          <div style="position:absolute; -bottom:18px; left:50%; transform:translateX(-50%); background:#0f172a; color:#ffffff; font-size:9px; font-weight:900; padding:1px 5px; border-radius:4px; white-space:nowrap; border:1px solid #334155; pointer-events:none;">
            YOU
          </div>
        </div>
      `;

      const userPulseIcon = L.divIcon({
        className: 'custom-user-gps-beacon',
        html: userPulseHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([loc.latitude, loc.longitude]);
        userMarkerRef.current.setPopupContent(`
          <div style="font-family:sans-serif; padding:4px; min-width:210px;">
            <div style="font-size:12px; font-weight:800; color:#ef4444; display:flex; align-items:center; gap:4px;">
              📍 YOUR LIVE LOCATION
            </div>
            <div style="font-size:12px; font-weight:bold; color:#0f172a; margin-top:4px;">
              ${loc.areaName || 'GPS Location Locked'}
            </div>
            <div style="font-size:10px; color:#64748b; margin-top:2px;">
              Coordinates: ${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}<br/>
              Accuracy: ±${Math.round(loc.accuracy)}m (${loc.source.toUpperCase()})
            </div>
            <div style="font-size:10px; color:#10b981; font-weight:bold; margin-top:5px;">
              ● Real-Time Device Tracking Active
            </div>
          </div>
        `);
      } else {
        userMarkerRef.current = L.marker([loc.latitude, loc.longitude], {
          icon: userPulseIcon,
          zIndexOffset: 1000
        })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif; padding:4px; min-width:210px;">
              <div style="font-size:12px; font-weight:800; color:#ef4444; display:flex; items-center; gap:4px;">
                📍 YOUR LIVE LOCATION
              </div>
              <div style="font-size:12px; font-weight:bold; color:#0f172a; margin-top:4px;">
                ${loc.areaName || 'GPS Location Locked'}
              </div>
              <div style="font-size:10px; color:#64748b; margin-top:2px;">
                Coordinates: ${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}<br/>
                Accuracy: ±${Math.round(loc.accuracy)}m (${loc.source.toUpperCase()})
              </div>
              <div style="font-size:10px; color:#10b981; font-weight:bold; margin-top:5px;">
                ● Real-Time Device Tracking Active
              </div>
            </div>
          `);
      }

      const circleRadius = Math.min(Math.max(loc.accuracy, 25), 200);
      if (userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current.setLatLng([loc.latitude, loc.longitude]);
        userAccuracyCircleRef.current.setRadius(circleRadius);
      } else {
        userAccuracyCircleRef.current = L.circle([loc.latitude, loc.longitude], {
          radius: circleRadius,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: '3, 4'
        }).addTo(map);
      }

      if (!hasAutoCenteredRef.current || (loc.source === 'gps' && !hasUpgradedToGpsRef.current)) {
        hasAutoCenteredRef.current = true;
        if (loc.source === 'gps') {
          hasUpgradedToGpsRef.current = true;
        }
        if (!allocatedPlace) {
          map.flyTo([loc.latitude, loc.longitude], 15, { duration: 1.2 });
        }
      }
    });

    requestDeviceLocation({ highAccuracy: true })
      .then((loc) => {
        setIsLocating(false);
        const map = mapInstanceRef.current;
        if (map && (!hasAutoCenteredRef.current || (loc.source === 'gps' && !hasUpgradedToGpsRef.current))) {
          hasAutoCenteredRef.current = true;
          if (loc.source === 'gps') {
            hasUpgradedToGpsRef.current = true;
          }
          if (!allocatedPlace) {
            map.flyTo([loc.latitude, loc.longitude], 15, { duration: 1.2 });
          }
        }
      })
      .catch(() => setIsLocating(false));

    return () => {
      unsubscribe();
    };
  }, [allocatedPlace]);

  // CountriesNow API: Handle Map Allocation to Country & City
  const handleAllocateCountryAndCity = async (country: string, city?: string) => {
    if (!country) return;
    setIsAllocating(true);
    try {
      const result = await allocateMapLocation(country, city);
      const map = mapInstanceRef.current;
      if (result && map) {
        setAllocatedPlace(result.displayName);
        setLocationStatusText(`🌍 Allocated: ${result.displayName} (CountriesNow API)`);
        map.flyTo([result.latitude, result.longitude], result.zoom, { duration: 1.4 });

        // Drop designated Allocation badge pin
        if (searchPinRef.current) {
          map.removeLayer(searchPinRef.current);
        }

        const allocIcon = L.divIcon({
          className: 'allocated-region-pin',
          html: `
            <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
              <div style="width:38px; height:38px; background:#4f46e5; border:3px solid #ffffff; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:18px; box-shadow:0 4px 14px rgba(79,70,229,0.6);">
                🌍
              </div>
              <div style="background:#0f172a; color:white; font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px; margin-top:2px; white-space:nowrap; border:1px solid #334155;">
                ${result.displayName}
              </div>
            </div>
          `,
          iconSize: [38, 52],
          iconAnchor: [19, 26]
        });

        const marker = L.marker([result.latitude, result.longitude], { icon: allocIcon, zIndexOffset: 1200 })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:220px; font-family:sans-serif; padding:4px;">
              <div style="font-size:11px; font-weight:800; color:#4f46e5; text-transform:uppercase;">
                🌍 Allocated Region (CountriesNow API)
              </div>
              <div style="font-size:13px; font-weight:bold; color:#0f172a; margin-top:2px;">
                ${result.displayName}
              </div>
              <div style="font-size:10px; color:#64748b; margin-top:2px;">
                Lat: ${result.latitude.toFixed(4)}, Lng: ${result.longitude.toFixed(4)}
              </div>
              <div style="font-size:10px; color:#10b981; font-weight:bold; margin-top:4px;">
                ✓ Map Focus & Safety Radar Allocated
              </div>
              <div style="margin-top:8px;">
                <a href="https://www.google.com/maps/dir/?api=1&destination=${result.latitude},${result.longitude}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#4f46e5; color:white; font-size:10px; font-weight:bold; padding:4px 8px; border-radius:6px; text-decoration:none;">
                  Explore Region ↗
                </a>
              </div>
            </div>
          `)
          .openPopup();

        searchPinRef.current = marker;
        setShowAllocationPanel(false);
      }
    } catch (e) {
      console.error('Failed to allocate map location:', e);
    } finally {
      setIsAllocating(false);
    }
  };

  // Generate dynamic contextual places around active center (Police, Hospitals, Transit, Safe Havens)
  const getNearbyPlaces = (centerLat: number, centerLng: number): MapPlace[] => {
    return [
      {
        id: 'plc-police-1',
        name: 'District Women Police Station & 24/7 Desk',
        category: 'police',
        lat: centerLat + 0.0052,
        lng: centerLng + 0.0038,
        phone: '112 / 1091 (Women Emergency Helpline)',
        details: '24/7 Female Police Officers on Duty, Dedicated Safe Room, Instant Patrol Dispatch',
        address: 'Sector 4 Civil Safety Complex, Main Road',
        distance: '~420m away',
        officerInCharge: 'Inspector Sunita Sharma (Women Cell)',
        badges: ['24/7 Female Officers', 'Immediate PCR Dispatch', 'Safe Waiting Lounge']
      },
      {
        id: 'plc-police-2',
        name: 'Safe Corridor Mobile PCR Patrol Desk',
        category: 'police',
        lat: centerLat - 0.0046,
        lng: centerLng - 0.0052,
        phone: '112 (Universal Emergency)',
        details: 'Rapid Response Motorbike Unit & Armed PCR Patrol Van on continuous roving patrol',
        address: 'Transit Arterial Crossing, Booth 3',
        distance: '~580m away',
        officerInCharge: 'Sub-Inspector Rajesh Kumar',
        badges: ['Mobile PCR Van', 'Highway Patrol', 'SOS First Responder']
      },
      {
        id: 'plc-police-3',
        name: 'Central City Police Headquarters & Dispatch',
        category: 'police',
        lat: centerLat + 0.0082,
        lng: centerLng - 0.0032,
        phone: '112 / 100',
        details: 'Central Command Center, GPS-Tracked Fleet Dispatch, CCTV Surveillance Hub',
        address: 'City Administrative Circle, Gate 1',
        distance: '~890m away',
        officerInCharge: 'DSP Safety & Vigilance',
        badges: ['Central Dispatch', 'CCTV Grid', 'Helpline Hub']
      },
      {
        id: 'plc-police-4',
        name: 'Women Assistance & Legal Support Police Booth',
        category: 'police',
        lat: centerLat - 0.0028,
        lng: centerLng + 0.0064,
        phone: '1091 / 181 (Women Support)',
        details: 'Dedicated Walk-in desk for harassment reporting, legal aid, safe night escort',
        address: 'Commercial Plaza & College Walkway',
        distance: '~350m away',
        officerInCharge: 'Officer Neha Verma',
        badges: ['Zero FIR Filing', 'Walk-in Support', 'Night Escort']
      },
      {
        id: 'plc-hosp-1',
        name: 'City Emergency & Trauma Medical Center',
        category: 'hospital',
        lat: centerLat + 0.0076,
        lng: centerLng - 0.0068,
        phone: '108 / Emergency Ambulance',
        details: '24/7 Trauma Care, Women Emergency Support Unit, ICU Ready, Ambulance on Standby',
        address: 'Hospital Avenue Road',
        distance: '~750m away'
      },
      {
        id: 'plc-transit-1',
        name: 'Central Multi-Modal Transit & Metro Hub',
        category: 'transit',
        lat: centerLat - 0.0038,
        lng: centerLng + 0.0052,
        phone: '139 / Transit Help',
        details: 'CCTV Surveillance, Security Booth at Gates 1 & 2, Well-Lit Concourse',
        address: 'Transit Hub Terminal',
        distance: '~490m away'
      },
      {
        id: 'plc-safe-1',
        name: '24/7 Monitored Safe Haven & Pharmacy',
        category: 'safe_haven',
        lat: centerLat + 0.0042,
        lng: centerLng - 0.0035,
        phone: '112 (Connected SOS)',
        details: 'Continuous High-Lux Lighting, Security Staff, Emergency Shelter Point',
        address: 'Commercial Plaza Ground Floor',
        distance: '~320m away'
      }
    ];
  };

  // Render Markers (Incidents, SOS, Hotspots, and Places of Interest)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    const placesGroup = placesGroupRef.current;
    if (!map || !markersGroup || !placesGroup) return;

    markersGroup.clearLayers();
    placesGroup.clearLayers();

    const activeLat = liveLocation?.latitude || userLocation?.lat || 28.6139;
    const activeLng = liveLocation?.longitude || userLocation?.lng || 77.2090;

    // 1. Render Places of Interest Layer (Police, Hospitals, Transit, Safe Havens)
    if (showPlacesLayer && (placeFilter === 'all' || placeFilter === 'police' || placeFilter === 'hospital' || placeFilter === 'transit')) {
      const allPlaces = getNearbyPlaces(activeLat, activeLng);
      const filteredPlaces = allPlaces.filter((p) => {
        if (placeFilter === 'all') return true;
        if (placeFilter === 'police') return p.category === 'police';
        if (placeFilter === 'hospital') return p.category === 'hospital';
        if (placeFilter === 'transit') return p.category === 'transit';
        return false;
      });

      filteredPlaces.forEach((place) => {
        const isPolice = place.category === 'police';
        let badgeColor = isPolice ? '#1e40af' : '#0f766e';
        let badgeIcon = isPolice ? '👮' : '🚇';
        let label = isPolice ? 'Police Help Center' : 'Transit Station';

        if (place.category === 'hospital') {
          badgeColor = '#b91c1c';
          badgeIcon = '🏥';
          label = 'Hospital / Care';
        } else if (place.category === 'safe_haven') {
          badgeColor = '#047857';
          badgeIcon = '🛡️';
          label = '24/7 Safe Haven';
        }

        // Distinct, high-visibility icon for Police vs others
        const placeIconHtml = isPolice
          ? `
            <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer; z-index:1200;">
              <div style="position:relative; width:38px; height:38px; background:#1e3a8a; border:3px solid #60a5fa; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px; box-shadow:0 4px 14px rgba(30,58,138,0.7); animation:police-badge-pulse 2s infinite;">
                👮
                <span style="position:absolute; top:-3px; right:-3px; background:#16a34a; width:10px; height:10px; border-radius:50%; border:2px solid #ffffff;"></span>
              </div>
              <div style="background:#0f172a; color:#93c5fd; font-size:9px; font-weight:800; padding:2px 7px; border-radius:5px; margin-top:3px; white-space:nowrap; border:1px solid #1e40af; box-shadow:0 2px 6px rgba(0,0,0,0.5); text-align:center;">
                👮 ${place.name.replace('District ', '').replace('Station & 24/7 Desk', 'Desk')}
                <div style="color:#38bdf8; font-size:8px; font-weight:700;">24/7 HELPLINE: 112 / 1091</div>
              </div>
            </div>
          `
          : `
            <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
              <div style="width:32px; height:32px; background:${badgeColor}; border:2.5px solid #ffffff; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:15px; box-shadow:0 3px 10px rgba(0,0,0,0.4);">
                ${badgeIcon}
              </div>
              <div style="background:rgba(15,23,42,0.92); color:#ffffff; font-size:9px; font-weight:800; padding:1px 6px; border-radius:4px; margin-top:2px; white-space:nowrap; border:1px solid #334155; box-shadow:0 1px 4px rgba(0,0,0,0.3);">
                ${place.name.split(' ')[0]}
              </div>
            </div>
          `;

        const pIcon = L.divIcon({
          className: 'custom-place-badge',
          html: placeIconHtml,
          iconSize: [40, 52],
          iconAnchor: [20, 26]
        });

        const pMarker = L.marker([place.lat, place.lng], { icon: pIcon, zIndexOffset: isPolice ? 800 : 500 });
        pMarker.bindPopup(`
          <div style="min-width:250px; font-family:sans-serif; padding:4px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:5px;">
              <span style="font-size:10px; font-weight:800; text-transform:uppercase; background:${badgeColor}; color:white; padding:2px 7px; border-radius:4px;">
                ${isPolice ? '👮 POLICE HELP CENTER' : label}
              </span>
              <span style="font-size:10px; color:#16a34a; font-weight:bold;">● 24/7 Active Duty</span>
            </div>
            <div style="font-size:13px; font-weight:bold; color:#0f172a; margin-top:4px; line-height:1.3;">
              ${place.name}
            </div>
            ${place.officerInCharge ? `<div style="font-size:11px; color:#1e40af; font-weight:700; margin-top:3px;">👮 Duty In-Charge: ${place.officerInCharge}</div>` : ''}
            <div style="font-size:11px; color:#475569; margin-top:3px;">
              <strong>📍 Address:</strong> ${place.address || 'Nearby Safety Location'} ${place.distance ? `(${place.distance})` : ''}
            </div>
            <div style="font-size:11px; color:#475569; margin-top:2px;">
              <strong>📞 Direct Helplines:</strong> <span style="color:#b91c1c; font-weight:bold;">${place.phone || '112'}</span>
            </div>
            <div style="font-size:10px; color:#64748b; margin-top:4px; background:#f8fafc; padding:5px 7px; border-radius:6px; border:1px solid #e2e8f0;">
              ${place.details || 'Emergency assistance and immediate responder dispatch.'}
            </div>
            <div style="margin-top:8px; display:flex; gap:6px;">
              <a href="tel:${place.phone?.includes('1091') ? '1091' : '112'}" style="flex:1; text-align:center; background:#b91c1c; color:#fff; font-size:11px; font-weight:800; padding:6px; border-radius:6px; text-decoration:none; box-shadow:0 2px 6px rgba(185,28,28,0.3);">
                📞 Call 112 / 1091
              </a>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}" target="_blank" rel="noopener noreferrer" style="flex:1; text-align:center; background:#2563eb; color:#fff; font-size:11px; font-weight:800; padding:6px; border-radius:6px; text-decoration:none;">
                Navigate ↗
              </a>
            </div>
          </div>
        `);

        placesGroup.addLayer(pMarker);
      });
    }

    // Combine props with real-time WebSocket alerts & moving coordinates
    const combinedSOSMap = new Map<string, SOSAlert>();
    sosAlerts.forEach((s) => combinedSOSMap.set(s.id, s));
    liveSOSList.forEach((s) => combinedSOSMap.set(s.id, s));
    Object.keys(liveTrackingMap).forEach((id) => {
      if (combinedSOSMap.has(id)) {
        const item = combinedSOSMap.get(id)!;
        combinedSOSMap.set(id, {
          ...item,
          latitude: liveTrackingMap[id].latitude,
          longitude: liveTrackingMap[id].longitude,
          locationName: liveTrackingMap[id].locationName || item.locationName
        });
      }
    });
    const effectiveSOSAlerts = Array.from(combinedSOSMap.values());

    const combinedIncMap = new Map<string, Incident>();
    incidents.forEach((i) => combinedIncMap.set(i.id, i));
    liveIncidentList.forEach((i) => combinedIncMap.set(i.id, i));
    const effectiveIncidents = Array.from(combinedIncMap.values());

    // 2. Render SOS Alerts (Life-or-Death Emergency Distress Calls - High-Priority Visuals)
    if (placeFilter === 'all' || placeFilter === 'sos') {
      effectiveSOSAlerts.forEach((sos) => {
        if (!sos.latitude || !sos.longitude) return;
        const isUnresolved = sos.status === 'ACTIVE' || sos.status === 'DISPATCHED' || sos.status === 'Active';

        const sosIcon = L.divIcon({
          className: 'custom-sos-pin',
          html: `
            <div class="sos-marker-beacon">
              <div class="ring"></div>
              <div class="ring-2"></div>
              <div style="position:relative; width:44px; height:44px; background:#dc2626; border:3.5px solid #ffffff; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 22px rgba(220,38,38,0.9), 0 4px 10px rgba(0,0,0,0.5); color:white; font-weight:900; font-size:18px;">
                🚨
              </div>
              <div style="background:#7f1d1d; color:#ffffff; font-size:10px; font-weight:900; padding:3px 8px; border-radius:6px; margin-top:4px; white-space:nowrap; border:1.5px solid #f87171; box-shadow:0 2px 8px rgba(0,0,0,0.5); display:flex; align-items:center; gap:4px;">
                <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#f87171; animation:ping 1s infinite;"></span>
                <span>🚨 SOS: ${sos.userName || 'Distress Call'}</span>
              </div>
            </div>
          `,
          iconSize: [44, 70],
          iconAnchor: [22, 35]
        });

        const sosMarker = L.marker([sos.latitude, sos.longitude], { icon: sosIcon, zIndexOffset: 2000 });
        sosMarker.bindPopup(`
          <div style="min-width:260px; font-family:sans-serif; padding:4px;">
            <div style="background:#dc2626; color:white; padding:4px 9px; border-radius:6px; font-weight:900; font-size:11px; text-transform:uppercase; margin-bottom:6px; display:inline-block; box-shadow:0 2px 6px rgba(220,38,38,0.4);">
              🚨 ACTIVE SOS DISTRESS CALL
            </div>
            <div style="font-size:14px; font-weight:900; color:#0f172a;">${sos.userName || 'Emergency Distress Caller'}</div>
            <div style="font-size:11px; color:#475569; margin-top:3px;"><strong>📞 Phone:</strong> <a href="tel:${sos.userPhone || '112'}" style="color:#b91c1c; font-weight:bold;">${sos.userPhone || 'Registered Mobile'}</a></div>
            <div style="font-size:11px; color:#475569; margin-top:2px;"><strong>📍 Location:</strong> ${sos.locationName || 'Captured Device Coordinates'}</div>
            <div style="font-size:11px; color:#475569; margin-top:2px;"><strong>⚠️ Threat:</strong> <span style="color:#dc2626; font-weight:bold;">${sos.emergencyType || 'Immediate Physical Harassment / Threat'}</span></div>
            <div style="font-size:10px; color:#dc2626; font-weight:800; margin-top:6px; text-transform:uppercase; background:#fee2e2; padding:4px 8px; border-radius:6px; border:1px solid #fca5a5;">
              STATUS: ${sos.status || 'ACTIVE DISPATCH (PATROL EN ROUTE)'}
            </div>
            <div style="margin-top:8px; display:flex; gap:6px;">
              <a href="tel:${sos.userPhone || '112'}" style="flex:1; text-align:center; background:#dc2626; color:#fff; font-size:11px; font-weight:800; padding:6px; border-radius:6px; text-decoration:none;">
                📞 Call Caller
              </a>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${sos.latitude},${sos.longitude}" target="_blank" rel="noopener noreferrer" style="flex:1; text-align:center; background:#2563eb; color:#fff; font-size:11px; font-weight:800; padding:6px; border-radius:6px; text-decoration:none;">
                Navigate ↗
              </a>
            </div>
          </div>
        `);

        markersGroup.addLayer(sosMarker);
      });
    }

    // 3. Render Incident Pins
    if (placeFilter === 'all') {
      effectiveIncidents.forEach((inc) => {
        if (!inc.latitude || !inc.longitude) return;
        const isHigh = inc.severity === 'HIGH' || inc.severity === 'High';
        const isMed = inc.severity === 'MEDIUM' || inc.severity === 'Medium';
        const color = isHigh ? '#b91c1c' : isMed ? '#ea580c' : '#2563eb';

        const incIcon = L.divIcon({
          className: 'custom-inc-pin',
          html: `
            <div style="width:28px; height:28px; background:${color}; border:2.5px solid #ffffff; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:12px; font-weight:bold; box-shadow:0 2px 8px rgba(0,0,0,0.35); cursor:pointer;">
              ⚠️
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const incMarker = L.marker([inc.latitude, inc.longitude], { icon: incIcon });
        incMarker.bindPopup(`
          <div style="min-width:210px; font-family:sans-serif; padding:2px;">
            <div style="font-size:11px; font-weight:800; color:${color}; text-transform:uppercase; margin-bottom:3px;">
              ${inc.category || 'Incident'} (${inc.severity || 'Medium'} Risk)
            </div>
            <div style="font-size:13px; font-weight:bold; color:#1e293b;">${inc.title || 'Reported Incident'}</div>
            <div style="font-size:11px; color:#64748b; margin-top:4px;">${inc.locationName || inc.location || 'Location provided'}</div>
            <div style="font-size:10px; background:#f1f5f9; padding:4px 6px; border-radius:4px; margin-top:6px; color:#334155;">
              Status: <strong>${inc.status || 'Reported'}</strong>
            </div>
          </div>
        `);

        markersGroup.addLayer(incMarker);
      });
    }

    // 4. Render High Risk Hotspot Zones (Dotted Danger Boundary + Center Danger Banner Pin)
    if (showHotspotCircles && (placeFilter === 'all' || placeFilter === 'hotspots')) {
      hotspots.forEach((hs) => {
        if (!hs.latitude || !hs.longitude) return;
        const isHigh = hs.riskLevel === 'HIGH' || hs.riskLevel === 'High' || hs.riskLevel === 'Danger';
        const isMed = hs.riskLevel === 'MEDIUM' || hs.riskLevel === 'Medium' || hs.riskLevel === 'Moderate';
        const circleColor = isHigh ? '#dc2626' : isMed ? '#ea580c' : '#10b981';
        const areaTitle = hs.areaName || hs.name || 'Safety Area';
        const count = hs.incidentCount ?? hs.incidentsCount ?? 0;

        // A. Danger Circle Perimeter
        const circle = L.circle([hs.latitude, hs.longitude], {
          radius: hs.radiusMeters || 450,
          color: circleColor,
          fillColor: circleColor,
          fillOpacity: 0.22,
          weight: 2.5,
          dashArray: '8, 6'
        });

        // B. Dedicated Center Hotspot Banner Pin (Clear, Unmistakable Danger Identification)
        const hotspotCenterIcon = L.divIcon({
          className: 'custom-hotspot-center-pin',
          html: `
            <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer; z-index:1100;">
              <div style="position:relative; display:flex; align-items:center; justify-content:center;">
                <span style="position:absolute; inset:-8px; border-radius:50%; background:rgba(234,88,12,0.4); animation:hotspot-pulse-ring 2s infinite;"></span>
                <div style="width:38px; height:38px; background:#ea580c; border:3px solid #ffffff; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px; color:white; box-shadow:0 4px 14px rgba(234,88,12,0.7);">
                  ⚠️
                </div>
              </div>
              <div style="background:rgba(15,23,42,0.96); color:#fef08a; font-size:10px; font-weight:900; padding:2px 8px; border-radius:6px; margin-top:4px; white-space:nowrap; border:1px solid #ca8a04; box-shadow:0 2px 6px rgba(0,0,0,0.5); text-align:center;">
                ⚠️ DANGER HOTSPOT: ${areaTitle}
                <div style="color:#fdba74; font-size:9px; font-weight:700;">${hs.riskLevel || 'HIGH'} RISK • ${count} INCIDENTS</div>
              </div>
            </div>
          `,
          iconSize: [44, 60],
          iconAnchor: [22, 30]
        });

        const hotspotMarker = L.marker([hs.latitude, hs.longitude], { icon: hotspotCenterIcon, zIndexOffset: 1000 });

        const popupContent = `
          <div style="font-family:sans-serif; padding:4px; min-width:250px;">
            <div style="background:#ea580c; color:white; padding:3px 8px; border-radius:6px; font-size:11px; font-weight:900; text-transform:uppercase; display:inline-block; margin-bottom:5px;">
              ⚠️ HIGH-RISK CRIME & SAFETY HOTSPOT
            </div>
            <div style="font-size:14px; font-weight:900; color:#0f172a;">${areaTitle}</div>
            <div style="font-size:11px; color:#334155; margin-top:4px;"><strong>Risk Level:</strong> <span style="color:#dc2626; font-weight:800;">${hs.riskLevel || 'High'} Danger</span> (${hs.radiusMeters || 450}m Perimeter)</div>
            <div style="font-size:11px; color:#64748b; margin-top:2px;"><strong>Reported Incidents:</strong> <span style="color:#b91c1c; font-weight:bold;">${count} Verified Reports</span></div>
            ${hs.primaryCategories && hs.primaryCategories.length > 0 ? `<div style="font-size:11px; color:#475569; margin-top:2px;"><strong>Hazards:</strong> ${hs.primaryCategories.join(', ')}</div>` : ''}
            <div style="font-size:10px; color:#334155; margin-top:6px; background:#fef3c7; padding:5px 7px; border-radius:6px; border:1px solid #fde68a;">
              <strong>💡 Women Safety Advisory:</strong> ${hs.safetyTips?.[0] || 'Avoid unlit alleys after 9 PM. Use well-lit arterial corridor with active CCTV.'}
            </div>
            <div style="margin-top:8px; display:flex; gap:6px;">
              <a href="tel:112" style="flex:1; text-align:center; background:#dc2626; color:#fff; font-size:11px; font-weight:800; padding:6px; border-radius:6px; text-decoration:none;">
                📞 Call Police 112
              </a>
              <a href="/dashboard/incidents/report" style="flex:1; text-align:center; background:#475569; color:#fff; font-size:11px; font-weight:800; padding:6px; border-radius:6px; text-decoration:none;">
                Report Hazard
              </a>
            </div>
          </div>
        `;

        circle.bindPopup(popupContent);
        hotspotMarker.bindPopup(popupContent);

        markersGroup.addLayer(circle);
        markersGroup.addLayer(hotspotMarker);
      });
    }

    map.invalidateSize();
  }, [
    incidents,
    sosAlerts,
    hotspots,
    showHotspotCircles,
    showPlacesLayer,
    placeFilter,
    liveLocation,
    liveSOSList,
    liveIncidentList,
    liveTrackingMap
  ]);

  // Explicitly Fetch Device GPS Location with Browser Permission
  const handleFetchDeviceLocation = useCallback(async (isManual = true) => {
    setIsLocating(true);
    setPermissionErrorMessage(null);
    setLocationSuccessNotice(null);

    if (isManual) {
      setLocationStatusText('🛰️ Requesting browser GPS permission...');
    }

    try {
      const result = await fetchDeviceLocationWithPermission({
        highAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });

      if (result.success && result.location) {
        const loc = result.location;
        setLiveLocation(loc);
        setPermissionState('granted');
        setAllocatedPlace(null);

        const statusText = `📍 GPS Locked: ${loc.areaName || 'Device Position'} (±${Math.round(loc.accuracy)}m)`;
        setLocationStatusText(statusText);
        setLocationSuccessNotice(
          `✅ Exact Device GPS locked: ${loc.areaName || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`} (Accuracy: ±${Math.round(loc.accuracy)}m)`
        );
        setTimeout(() => setLocationSuccessNotice(null), 6000);

        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo([loc.latitude, loc.longitude], 17, { duration: 1.2 });
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([loc.latitude, loc.longitude]);
            userMarkerRef.current.openPopup();
          }
        }
      } else {
        if (result.error === 'permission_denied') {
          setPermissionState('denied');
          setPermissionErrorMessage(
            result.errorMessage ||
              'Location permission was denied. Please allow location access in your browser address bar.'
          );
        } else {
          setPermissionErrorMessage(result.errorMessage || 'Failed to acquire device GPS position.');
        }
        setLocationStatusText('⚠️ Device GPS not locked (Permission needed)');
      }
    } catch (err: any) {
      setPermissionErrorMessage(err?.message || 'Error fetching device location.');
      setLocationStatusText('⚠️ Location error');
    } finally {
      setIsLocating(false);
    }
  }, []);

  // Initial check for geolocation permission state
  useEffect(() => {
    queryGeolocationPermission().then((status) => {
      setPermissionState(status);
      if (status === 'granted') {
        handleFetchDeviceLocation(false);
      }
    });
  }, [handleFetchDeviceLocation]);

  // Center on User GPS
  const recenterToLiveGps = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setAllocatedPlace(null);

    if (liveLocation && liveLocation.source === 'gps') {
      setLocationStatusText(`📍 ${liveLocation.areaName || 'Live GPS Locked'} (±${Math.round(liveLocation.accuracy)}m)`);
      map.flyTo([liveLocation.latitude, liveLocation.longitude], 17, { duration: 1.2 });
      if (userMarkerRef.current) {
        userMarkerRef.current.openPopup();
      }
    } else {
      handleFetchDeviceLocation(true);
    }
  }, [liveLocation, handleFetchDeviceLocation]);

  // Fit all points in view
  const fitAllPoints = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const points: [number, number][] = [];

    if (liveLocation) {
      points.push([liveLocation.latitude, liveLocation.longitude]);
    } else if (userLocation) {
      points.push([userLocation.lat, userLocation.lng]);
    }

    sosAlerts.forEach((s) => {
      if (typeof s.latitude === 'number' && typeof s.longitude === 'number' && !isNaN(s.latitude)) {
        points.push([s.latitude, s.longitude]);
      }
    });

    incidents.forEach((i) => {
      if (typeof i.latitude === 'number' && typeof i.longitude === 'number' && !isNaN(i.latitude)) {
        points.push([i.latitude, i.longitude]);
      }
    });

    if (points.length === 1) {
      map.setView(points[0], 15, { animate: true });
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
    }
    map.invalidateSize();
  }, [sosAlerts, incidents, liveLocation, userLocation]);

  // Zoom helpers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };
  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  // Place Search via OpenStreetMap Nominatim
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data || []);
          setShowSearchResults(true);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 450);
  };

  const handleSelectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    if (isNaN(lat) || isNaN(lon)) return;

    const map = mapInstanceRef.current;
    if (!map) return;

    setShowSearchResults(false);
    setSearchQuery(result.display_name.split(',')[0]);

    map.flyTo([lat, lon], 16, { duration: 1.4 });

    // Drop temporary search marker
    if (searchPinRef.current) {
      map.removeLayer(searchPinRef.current);
    }

    const searchIcon = L.divIcon({
      className: 'search-drop-pin',
      html: `
        <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
          <div style="width:36px; height:36px; background:#2563eb; border:3px solid #ffffff; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:16px; box-shadow:0 3px 12px rgba(37,99,235,0.7);">
            📍
          </div>
          <div style="background:#0f172a; color:white; font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px; margin-top:2px; white-space:nowrap; border:1px solid #334155;">
            ${result.display_name.split(',')[0]}
          </div>
        </div>
      `,
      iconSize: [36, 50],
      iconAnchor: [18, 25]
    });

    const marker = L.marker([lat, lon], { icon: searchIcon, zIndexOffset: 1200 })
      .addTo(map)
      .bindPopup(`
        <div style="min-width:210px; font-family:sans-serif; padding:4px;">
          <div style="font-size:11px; font-weight:800; color:#2563eb; text-transform:uppercase;">
            📍 Searched Place
          </div>
          <div style="font-size:13px; font-weight:bold; color:#0f172a; margin-top:2px;">
            ${result.display_name}
          </div>
          <div style="margin-top:8px;">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#2563eb; color:white; font-size:10px; font-weight:bold; padding:4px 8px; border-radius:6px; text-decoration:none;">
              Get Directions ↗
            </a>
          </div>
        </div>
      `)
      .openPopup();

    searchPinRef.current = marker;
  };

  // Filter countries by query for allocation dropdown
  const filteredCountries = countriesList.filter((c) =>
    c.country.toLowerCase().includes(countrySearchQuery.toLowerCase())
  );

  const currentCountryObj = countriesList.find(
    (c) => c.country.toLowerCase() === selectedCountry.toLowerCase()
  );
  const currentCities = currentCountryObj?.cities || [];

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-slate-950 flex flex-col ${className}`}
      style={{ minHeight: '450px' }}
    >
      {/* Top Header Controls Bar */}
      {showControls && (
        <div className="p-3 bg-slate-900 border-b border-slate-800 text-white z-20 flex flex-col gap-2.5">
          {/* Row 1: Search Bar + Map Allocation Trigger + Live Device Status */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Live Search Bar */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search any place, locality, street, or city..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setShowSearchResults(false);
                      if (searchPinRef.current && mapInstanceRef.current) {
                        mapInstanceRef.current.removeLayer(searchPinRef.current);
                        searchPinRef.current = null;
                      }
                    }}
                    className="absolute right-2.5 p-0.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {isSearching && (
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin absolute right-8" />
                )}
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[2000] max-h-60 overflow-y-auto">
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSearchResult(item)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800/80 border-b border-slate-800/60 last:border-0 flex items-start gap-2 text-xs transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <div className="overflow-hidden">
                        <div className="font-bold text-white truncate">
                          {item.display_name.split(',')[0]}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {item.display_name.split(',').slice(1).join(',')}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Primary Fetch Device Location Button */}
            <button
              type="button"
              onClick={() => handleFetchDeviceLocation(true)}
              disabled={isLocating}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shrink-0 ${
                liveLocation?.source === 'gps'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
                  : isLocating
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white border border-red-400'
              }`}
              title="Fetch real-time device GPS coordinates with browser permission"
            >
              {isLocating ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <LocateFixed className="w-4 h-4 text-white" />
              )}
              <span>
                {isLocating
                  ? 'Acquiring GPS...'
                  : liveLocation?.source === 'gps'
                  ? 'GPS Locked'
                  : '📍 Fetch Device Location'}
              </span>
              {liveLocation?.source === 'gps' && (
                <span className="w-2 h-2 rounded-full bg-emerald-200 animate-ping"></span>
              )}
            </button>

            {/* CountriesNow Map Allocation Trigger Button */}
            <button
              type="button"
              onClick={() => {
                setShowAllocationPanel(!showAllocationPanel);
                if (showPoliceDirectory) setShowPoliceDirectory(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                showAllocationPanel || allocatedPlace
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Allocate Map using CountriesNow API (Countries & Cities Worldwide)"
            >
              <Globe className="w-4 h-4 text-indigo-300" />
              <span>{allocatedPlace ? `🌍 ${allocatedPlace}` : 'Allocate Map'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllocationPanel ? 'rotate-180' : ''}`} />
            </button>

            {/* Quick Police Help Centers Drawer Trigger */}
            <button
              type="button"
              onClick={() => {
                setShowPoliceDirectory(!showPoliceDirectory);
                if (showAllocationPanel) setShowAllocationPanel(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                showPoliceDirectory
                  ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400'
                  : 'bg-blue-950/90 hover:bg-blue-900 text-blue-200 border border-blue-800'
              }`}
              title="View all 4 verified nearby Police Help Centers & Women Desks"
            >
              <Shield className="w-4 h-4 text-blue-300" />
              <span>👮 Nearby Police Help Centers (4)</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPoliceDirectory ? 'rotate-180' : ''}`} />
            </button>

            {/* Live GPS Device Status Badge */}
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 text-xs shrink-0 max-w-xs">
              <Radio className={`w-3.5 h-3.5 ${liveLocation?.source === 'gps' ? 'text-emerald-400' : 'text-rose-500'} animate-pulse shrink-0`} />
              <div className="overflow-hidden">
                <div className="font-bold text-[10px] uppercase text-rose-400 leading-tight flex items-center gap-1">
                  <span>Device Live Location</span>
                  {isLocating && <span className="text-amber-400 font-normal animate-pulse">(Acquiring...)</span>}
                </div>
                <div className="text-[11px] text-slate-200 font-semibold truncate">
                  {locationStatusText}
                </div>
              </div>
            </div>
          </div>

          {/* Location Permission Denied Notice */}
          {permissionErrorMessage && (
            <div className="p-3 bg-red-950/95 border-2 border-red-500 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-red-200 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-white text-sm">
                    Device Location Access Required
                  </div>
                  <p className="text-red-200 mt-0.5 font-medium leading-relaxed">
                    {permissionErrorMessage}
                  </p>
                  <div className="mt-1.5 text-[11px] text-amber-200 bg-red-900/60 p-2 rounded-lg border border-red-800 flex items-center gap-1.5">
                    <span>🔒 <strong>To allow in browser:</strong> Click the lock / permissions icon in your address bar (top of browser), set <strong>Location</strong> to <strong>Allow</strong>, then tap <strong>Retry GPS Permission</strong>.</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                <button
                  type="button"
                  onClick={() => handleFetchDeviceLocation(true)}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-lg"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry GPS Permission</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPermissionErrorMessage(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Dismiss notice"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Success GPS Notice */}
          {locationSuccessNotice && (
            <div className="p-3 bg-emerald-950/95 border border-emerald-500/80 rounded-2xl flex items-center justify-between text-xs text-emerald-200 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-extrabold text-white text-xs block">Device GPS Connected</span>
                  <span className="text-[11px] text-emerald-300 font-medium">{locationSuccessNotice}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLocationSuccessNotice(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Dedicated Nearby Police Help Centers Panel */}
          {showPoliceDirectory && (
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-blue-500/40 shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-xs">
                    👮
                  </div>
                  <div>
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      Verified Nearby Police Help Centers & Women Safety Desks
                    </span>
                    <div className="text-[10px] text-blue-300">
                      All centers equipped with 24/7 duty officers, mobile PCR dispatch & safe rooms
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPoliceDirectory(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Police Stations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {getNearbyPlaces(
                  liveLocation?.latitude || userLocation?.lat || 28.6139,
                  liveLocation?.longitude || userLocation?.lng || 77.2090
                )
                  .filter((p) => p.category === 'police')
                  .map((police) => (
                    <div
                      key={police.id}
                      className="bg-slate-900/90 border border-blue-900/60 hover:border-blue-500/80 rounded-xl p-3 flex flex-col justify-between gap-2.5 transition-all shadow-md"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                            {police.distance}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            24/7 Active
                          </span>
                        </div>
                        <div className="text-xs font-extrabold text-white leading-tight">
                          {police.name}
                        </div>
                        <div className="text-[11px] text-slate-300 font-semibold mt-1">
                          📍 {police.address}
                        </div>
                        {police.officerInCharge && (
                          <div className="text-[10px] text-blue-300 mt-1">
                            👮 {police.officerInCharge}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1.5 line-clamp-2 bg-slate-950/80 p-1.5 rounded border border-slate-800">
                          {police.details}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => {
                            if (mapInstanceRef.current) {
                              mapInstanceRef.current.flyTo([police.lat, police.lng], 17, { duration: 1.2 });
                            }
                            setShowPoliceDirectory(false);
                          }}
                          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-lg transition-colors text-center cursor-pointer shadow"
                        >
                          📍 Show on Map
                        </button>
                        <a
                          href={`tel:${police.phone?.includes('1091') ? '1091' : '112'}`}
                          className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] rounded-lg transition-colors text-center shadow"
                        >
                          📞 Call 112
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* CountriesNow Map Allocation Drawer / Panel */}
          {showAllocationPanel && (
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-indigo-500/40 shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    CountriesNow Map Allocation System
                  </span>
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-800 font-mono">
                    countriesnow.space
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllocationPanel(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Selection Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Country Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                    1. Select Country ({countriesList.length || 'Loading...'})
                  </label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => {
                      setSelectedCountry(e.target.value);
                      setSelectedCity('');
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {countriesList.map((c, i) => (
                      <option key={i} value={c.country}>
                        {c.country} ({c.iso2})
                      </option>
                    ))}
                  </select>
                </div>

                {/* City Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                    2. Select City ({currentCities.length} Cities)
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">-- All Cities / Country View --</option>
                    {currentCities.map((city, idx) => (
                      <option key={idx} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleAllocateCountryAndCity(selectedCountry, selectedCity)}
                    disabled={isAllocating}
                    className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isAllocating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5" />
                    )}
                    <span>Allocate & Fly</span>
                  </button>

                  <button
                    type="button"
                    onClick={recenterToLiveGps}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    title="Reset back to Device GPS Location"
                  >
                    <span>My GPS</span>
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                <span className="text-slate-400 font-semibold text-[10px] uppercase">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => handleAllocateCountryAndCity('India', 'New Delhi')}
                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 font-semibold cursor-pointer"
                >
                  🇮🇳 Delhi
                </button>
                <button
                  type="button"
                  onClick={() => handleAllocateCountryAndCity('India', 'Mumbai')}
                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 font-semibold cursor-pointer"
                >
                  🇮🇳 Mumbai
                </button>
                <button
                  type="button"
                  onClick={() => handleAllocateCountryAndCity('India', 'Bengaluru')}
                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 font-semibold cursor-pointer"
                >
                  🇮🇳 Bengaluru
                </button>
                <button
                  type="button"
                  onClick={() => handleAllocateCountryAndCity('United States', 'New York')}
                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 font-semibold cursor-pointer"
                >
                  🇺🇸 New York
                </button>
                <button
                  type="button"
                  onClick={() => handleAllocateCountryAndCity('United Kingdom', 'London')}
                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 font-semibold cursor-pointer"
                >
                  🇬🇧 London
                </button>
                <button
                  type="button"
                  onClick={() => handleAllocateCountryAndCity('United Arab Emirates', 'Dubai')}
                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 font-semibold cursor-pointer"
                >
                  🇦🇪 Dubai
                </button>
              </div>
            </div>
          )}

          {/* Row 2: Map Tile Style Switcher + Safety Places Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-xs">
            {/* Tile Style Selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMapLayer('streets');
                  applyTileLayer('streets');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  mapLayer === 'streets' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Crystal-Clear Street Linings, Highways & Detailed Place Names (Esri World Street Map)"
              >
                <span>🗺️ Streets</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMapLayer('carto');
                  applyTileLayer('carto');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  mapLayer === 'carto' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Urban City Road Lines & Landmarks (CARTO Voyager)"
              >
                <span>🏙️ Urban</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMapLayer('satellite');
                  applyTileLayer('satellite');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  mapLayer === 'satellite' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Satellite Aerial Imagery with Road Linings & Place Labels"
              >
                <span>🛰️ Satellite</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMapLayer('dark');
                  applyTileLayer('dark');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  mapLayer === 'dark' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Dark High-Contrast Night Radar View"
              >
                <span>🌙 Night</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMapLayer('topo');
                  applyTileLayer('topo');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  mapLayer === 'topo' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Topographic Relief & Terrain Contours"
              >
                <span>🏔️ Topo</span>
              </button>
            </div>

            {/* Places Filter Chips */}
            <div className="flex items-center flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 px-1 font-semibold uppercase tracking-wider hidden sm:inline">Show:</span>
              
              <button
                type="button"
                onClick={() => {
                  setShowPlacesLayer(true);
                  setShowHotspotCircles(true);
                  setPlaceFilter('all');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                  showPlacesLayer && placeFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Safety Data
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPlacesLayer(true);
                  setPlaceFilter('police');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                  placeFilter === 'police' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-blue-300'
                }`}
                title="Filter only Police Help Centers and Women Safety Desks"
              >
                <span>👮 Police Centers</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPlaceFilter('sos');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                  placeFilter === 'sos' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-red-400'
                }`}
                title="Filter active emergency SOS distress alerts"
              >
                <span>🚨 Active SOS ({sosAlerts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowHotspotCircles(true);
                  setPlaceFilter('hotspots');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                  placeFilter === 'hotspots' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-amber-300'
                }`}
                title="Filter high-risk danger hotspots and perimeter zones"
              >
                <span>⚠️ Hotspots ({hotspots.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPlacesLayer(true);
                  setPlaceFilter('hospital');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                  placeFilter === 'hospital' ? 'bg-red-700 text-white shadow' : 'text-slate-400 hover:text-red-300'
                }`}
              >
                <span>🏥 Hospitals</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Canvas with Floating Interactive Controls */}
      <div className="relative flex-1 w-full" style={{ minHeight: height }}>
        {/* Floating Actions on Top Right of Map */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          {/* Zoom In/Out */}
          <div className="bg-slate-950/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2.5 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border-b border-slate-800 text-sm font-bold"
              title="Zoom In"
            >
              +
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2.5 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-sm font-bold"
              title="Zoom Out"
            >
              −
            </button>
          </div>

          {/* Center GPS Button */}
          <button
            type="button"
            onClick={recenterToLiveGps}
            className="p-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl shadow-xl transition-all flex items-center justify-center cursor-pointer"
            title="Center Map to Your Current Device Location"
          >
            <Navigation className="w-4 h-4" />
          </button>

          {/* Fit All Points */}
          <button
            type="button"
            onClick={fitAllPoints}
            className="p-2.5 bg-slate-950/90 hover:bg-slate-800 active:scale-95 text-slate-200 hover:text-white border border-slate-800 rounded-xl shadow-xl transition-all flex items-center justify-center cursor-pointer"
            title="Fit All Emergency Pins & Points in View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Map Container */}
        <div
          ref={mapContainerRef}
          style={{ height: '100%', minHeight: height, width: '100%' }}
          className="w-full h-full relative z-0"
        />
      </div>

      {/* Footer Legend Bar */}
      <div className="p-3 bg-slate-950 text-slate-300 border-t border-slate-800 text-[11px] flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse border border-white" />
            <span className="font-extrabold text-white">Active SOS</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-blue-600 border border-white text-[9px] text-white flex items-center justify-center font-bold">
              👮
            </div>
            <span className="font-semibold">Police Stations & Women Desks</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-red-700 border border-white text-[9px] text-white flex items-center justify-center font-bold">
              🏥
            </div>
            <span className="font-semibold">Emergency Hospitals</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500/50 border border-amber-400" />
            <span className="font-semibold">High-Risk Danger Hotspots</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/40" />
            <span className="font-semibold text-rose-300">Your Device</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 flex items-center gap-2">
          <span>💡 Tip: Click anywhere on the map to inspect place names & get directions</span>
          <button
            type="button"
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
                recenterToLiveGps();
              }
            }}
            className="p-1 hover:text-white transition-colors cursor-pointer"
            title="Recalculate Map & Center"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
