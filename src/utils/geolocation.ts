export interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  city?: string;
  areaName?: string;
  address?: string;
  source: 'gps' | 'ip' | 'cached';
  timestamp: number;
}

const STORAGE_KEY = 'women_safety_device_live_location';
let currentLocationMemory: DeviceLocation | null = null;
const listeners = new Set<(loc: DeviceLocation) => void>();

export function getCachedLocation(): DeviceLocation | null {
  if (currentLocationMemory) return currentLocationMemory;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
        currentLocationMemory = parsed;
        return parsed;
      }
    }
  } catch (e) {
    // ignore localstorage error
  }
  return null;
}

export function saveCachedLocation(loc: DeviceLocation) {
  currentLocationMemory = loc;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch (e) {
    // ignore
  }
  listeners.forEach((fn) => fn(loc));
  window.dispatchEvent(new CustomEvent('women-safety-location-changed', { detail: loc }));
}

// Fast reverse geocode to get city or street name
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        const addr = data.address || {};
        const parts = [
          addr.suburb || addr.neighbourhood || addr.road,
          addr.city || addr.town || addr.village || addr.county,
          addr.state
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 3).join(',');
      }
    }
  } catch {
    // fallback
  }
  return `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

// Fast IP fallback location if GPS is pending or not permitted
async function fetchIpLocation(): Promise<DeviceLocation | null> {
  try {
    const res = await fetch('https://ipwho.is/');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const loc: DeviceLocation = {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 2500, // IP resolution
          speed: null,
          heading: null,
          city: data.city || data.region || 'Local City',
          areaName: `${data.city || data.region || 'Local City'}, ${data.country || ''}`.trim(),
          source: 'ip',
          timestamp: Date.now()
        };
        saveCachedLocation(loc);
        return loc;
      }
    }
  } catch {
    // ignore IP lookup errors
  }

  try {
    const res2 = await fetch('https://freeipapi.com/api/json');
    if (res2.ok) {
      const d2 = await res2.json();
      if (typeof d2.latitude === 'number' && typeof d2.longitude === 'number') {
        const loc: DeviceLocation = {
          latitude: d2.latitude,
          longitude: d2.longitude,
          accuracy: 3000,
          speed: null,
          heading: null,
          city: d2.cityName || d2.regionName || 'Local City',
          areaName: `${d2.cityName || ''}, ${d2.countryName || ''}`.trim(),
          source: 'ip',
          timestamp: Date.now()
        };
        saveCachedLocation(loc);
        return loc;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

// Eager initialization in browser
if (typeof window !== 'undefined') {
  const cached = getCachedLocation();
  if (!cached) {
    fetchIpLocation().catch(() => {});
  }
}

export type GeolocationPermissionState = 'granted' | 'prompt' | 'denied' | 'unsupported';

export interface DeviceLocationResult {
  success: boolean;
  location?: DeviceLocation;
  error?: 'permission_denied' | 'position_unavailable' | 'timeout' | 'unsupported' | 'unknown';
  errorMessage?: string;
}

export async function queryGeolocationPermission(): Promise<GeolocationPermissionState> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.geolocation) {
    return 'unsupported';
  }
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return status.state as GeolocationPermissionState;
    } catch {
      return 'prompt';
    }
  }
  return 'prompt';
}

// Single entry point to directly fetch real device GPS location with explicit browser permission prompt
export function fetchDeviceLocationWithPermission(options: {
  highAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
} = {}): Promise<DeviceLocationResult> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({
        success: false,
        error: 'unsupported',
        errorMessage: 'Geolocation is not supported by this browser.'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy, speed, heading } = pos.coords;
        let areaName = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;

        try {
          const resolved = await reverseGeocode(latitude, longitude);
          if (resolved) areaName = resolved;
        } catch {
          // ignore
        }

        const loc: DeviceLocation = {
          latitude,
          longitude,
          accuracy: accuracy || 10,
          speed: speed ?? null,
          heading: heading ?? null,
          areaName,
          source: 'gps',
          timestamp: Date.now()
        };

        saveCachedLocation(loc);
        resolve({
          success: true,
          location: loc
        });
      },
      (err) => {
        let errType: 'permission_denied' | 'position_unavailable' | 'timeout' | 'unknown' = 'unknown';
        let msg = 'Failed to acquire device location.';

        switch (err.code) {
          case 1: // PERMISSION_DENIED
            errType = 'permission_denied';
            msg = 'Location permission was denied. Please allow location access in your browser address bar (click the 🔒 or site settings icon) to fetch your device coordinates.';
            break;
          case 2: // POSITION_UNAVAILABLE
            errType = 'position_unavailable';
            msg = 'Device location is currently unavailable. Please verify that your device GPS / Location service is turned on.';
            break;
          case 3: // TIMEOUT
            errType = 'timeout';
            msg = 'Device location request timed out. Please try again with a clear GPS signal.';
            break;
          default:
            msg = err.message || msg;
        }

        resolve({
          success: false,
          error: errType,
          errorMessage: msg
        });
      },
      {
        enableHighAccuracy: options.highAccuracy !== false,
        timeout: options.timeout ?? 15000,
        maximumAge: options.maximumAge ?? 0
      }
    );
  });
}

// Single entry point to request the device's live location
export function requestDeviceLocation(options: { highAccuracy?: boolean; forceGps?: boolean } = {}): Promise<DeviceLocation> {
  return new Promise((resolve) => {
    const cached = getCachedLocation();

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, accuracy, speed, heading } = pos.coords;
          
          let areaName = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
          reverseGeocode(latitude, longitude).then((name) => {
            if (currentLocationMemory && currentLocationMemory.latitude === latitude) {
              currentLocationMemory.areaName = name;
              saveCachedLocation(currentLocationMemory);
            }
          }).catch(() => {});

          const loc: DeviceLocation = {
            latitude,
            longitude,
            accuracy: accuracy || 10,
            speed: speed ?? null,
            heading: heading ?? null,
            areaName,
            source: 'gps',
            timestamp: Date.now()
          };

          saveCachedLocation(loc);
          resolve(loc);
        },
        async () => {
          // If GPS denied/failed, try IP location as fallback
          const ipLoc = await fetchIpLocation();
          if (ipLoc) {
            resolve(ipLoc);
          } else if (cached) {
            resolve(cached);
          } else {
            resolve({
              latitude: 28.6139,
              longitude: 77.2090,
              accuracy: 5000,
              speed: null,
              heading: null,
              city: 'New Delhi',
              areaName: 'Central District (Default Fallback)',
              source: 'cached',
              timestamp: Date.now()
            });
          }
        },
        {
          enableHighAccuracy: options.highAccuracy !== false,
          timeout: 15000,
          maximumAge: options.forceGps ? 0 : 5000
        }
      );
    } else {
      fetchIpLocation().then((ipLoc) => {
        if (ipLoc) resolve(ipLoc);
        else if (cached) resolve(cached);
        else {
          resolve({
            latitude: 28.6139,
            longitude: 77.2090,
            accuracy: 5000,
            speed: null,
            heading: null,
            city: 'New Delhi',
            areaName: 'Central District (Default Fallback)',
            source: 'cached',
            timestamp: Date.now()
          });
        }
      });
    }
  });
}

// Watch device position for real-time moving updates
export function watchDeviceLocation(onUpdate: (loc: DeviceLocation) => void): () => void {
  listeners.add(onUpdate);

  // Immediately send cached or start requesting
  const initial = getCachedLocation();
  if (initial) onUpdate(initial);

  // Also trigger location request
  requestDeviceLocation();

  let watchId: number | null = null;
  if (navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed, heading } = pos.coords;
        const loc: DeviceLocation = {
          latitude,
          longitude,
          accuracy: accuracy || 10,
          speed: speed ?? null,
          heading: heading ?? null,
          areaName: currentLocationMemory?.areaName || `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          source: 'gps',
          timestamp: Date.now()
        };
        saveCachedLocation(loc);
      },
      (err) => {
        console.warn('Live GPS watch notice:', err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000
      }
    );
  }

  return () => {
    listeners.delete(onUpdate);
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  };
}
