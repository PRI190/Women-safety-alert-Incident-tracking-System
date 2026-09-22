/**
 * Service to integrate CountriesNow API (https://countriesnow.space/api/v0.1/countries)
 * for worldwide map allocation, country/city selection, and geolocation coordinates.
 */

export interface CountryData {
  iso2: string;
  iso3: string;
  country: string;
  cities: string[];
}

export interface CountryPosition {
  name: string;
  iso2: string;
  lat: number;
  long: number;
}

export interface MapAllocationResult {
  country: string;
  city?: string;
  latitude: number;
  longitude: number;
  zoom: number;
  displayName: string;
}

const COUNTRIES_API_URL = 'https://countriesnow.space/api/v0.1/countries';
const POSITIONS_API_URL = 'https://countriesnow.space/api/v0.1/countries/positions';

// Fast in-memory cache
let cachedCountries: CountryData[] | null = null;
let cachedPositions: Map<string, { lat: number; lng: number }> | null = null;

// Initial fast fallback countries & cities to ensure zero-delay initial render
const POPULAR_COUNTRIES_FALLBACK: CountryData[] = [
  {
    country: 'India',
    iso2: 'IN',
    iso3: 'IND',
    cities: [
      'New Delhi',
      'Mumbai',
      'Bengaluru',
      'Hyderabad',
      'Chennai',
      'Kolkata',
      'Pune',
      'Ahmedabad',
      'Jaipur',
      'Lucknow',
      'Chandigarh',
      'Kochi',
      'Indore',
      'Bhopal',
      'Nagpur',
      'Patna',
      'Vadodara',
      'Surat',
      'Visakhapatnam',
      'Guwahati'
    ]
  },
  {
    country: 'United States',
    iso2: 'US',
    iso3: 'USA',
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin', 'San Francisco', 'Seattle', 'Miami', 'Atlanta', 'Boston']
  },
  {
    country: 'United Kingdom',
    iso2: 'GB',
    iso3: 'GBR',
    cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Newcastle', 'Sheffield', 'Bristol', 'Edinburgh']
  },
  {
    country: 'Canada',
    iso2: 'CA',
    iso3: 'CAN',
    cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City']
  },
  {
    country: 'Australia',
    iso2: 'AU',
    iso3: 'AUS',
    cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra']
  },
  {
    country: 'United Arab Emirates',
    iso2: 'AE',
    iso3: 'ARE',
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Al Ain']
  },
  {
    country: 'Singapore',
    iso2: 'SG',
    iso3: 'SGP',
    cities: ['Singapore']
  },
  {
    country: 'Germany',
    iso2: 'DE',
    iso3: 'DEU',
    cities: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne', 'Stuttgart', 'Dusseldorf']
  }
];

// Major city coordinates cache for instant allocation without network geocoding wait
const MAJOR_CITY_COORDS: Record<string, [number, number]> = {
  // India
  'new delhi': [28.6139, 77.2090],
  'delhi': [28.6139, 77.2090],
  'mumbai': [19.0760, 72.8777],
  'bengaluru': [12.9716, 77.5946],
  'bangalore': [12.9716, 77.5946],
  'hyderabad': [17.3850, 78.4867],
  'chennai': [13.0827, 80.2707],
  'kolkata': [22.5726, 88.3639],
  'pune': [18.5204, 73.8567],
  'ahmedabad': [23.0225, 72.5714],
  'jaipur': [26.9124, 75.7873],
  'lucknow': [26.8467, 80.9462],
  'chandigarh': [30.7333, 76.7794],
  'kochi': [9.9312, 76.2673],
  'indore': [22.7196, 75.8577],
  'bhopal': [23.2599, 77.4126],
  'nagpur': [21.1458, 79.0882],
  'patna': [25.5941, 85.1376],
  'vadodara': [22.3072, 73.1812],
  'surat': [21.1702, 72.8311],
  'visakhapatnam': [17.6868, 83.2185],
  'guwahati': [26.1445, 91.7362],
  // Global
  'london': [51.5074, -0.1278],
  'new york': [40.7128, -74.0060],
  'los angeles': [34.0522, -118.2437],
  'chicago': [41.8781, -87.6298],
  'san francisco': [37.7749, -122.4194],
  'toronto': [43.6532, -79.3832],
  'vancouver': [49.2827, -123.1207],
  'sydney': [33.8688, 151.2093],
  'melbourne': [-37.8136, 144.9631],
  'dubai': [25.2048, 55.2708],
  'singapore': [1.3521, 103.8198],
  'berlin': [52.5200, 13.4050],
  'paris': [48.8566, 2.3522],
  'tokyo': [35.6762, 139.6503]
};

/**
 * Fetch all countries and their cities from CountriesNow API
 */
export async function fetchCountries(): Promise<CountryData[]> {
  if (cachedCountries && cachedCountries.length > 0) {
    return cachedCountries;
  }

  // Check localStorage cache
  try {
    const local = localStorage.getItem('countriesnow_countries_cache');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedCountries = parsed;
        return parsed;
      }
    }
  } catch {}

  try {
    const response = await fetch(COUNTRIES_API_URL);
    if (response.ok) {
      const result = await response.json();
      if (!result.error && Array.isArray(result.data)) {
        cachedCountries = result.data;
        try {
          localStorage.setItem('countriesnow_countries_cache', JSON.stringify(result.data));
        } catch {}
        return result.data;
      }
    }
  } catch (error) {
    console.warn('CountriesNow API fetch failed, using fallback list:', error);
  }

  return POPULAR_COUNTRIES_FALLBACK;
}

/**
 * Fetch country positions (lat, long coordinates)
 */
export async function fetchCountryPositions(): Promise<Map<string, { lat: number; lng: number }>> {
  if (cachedPositions) {
    return cachedPositions;
  }

  const map = new Map<string, { lat: number; lng: number }>();

  try {
    const response = await fetch(POSITIONS_API_URL);
    if (response.ok) {
      const result = await response.json();
      if (!result.error && Array.isArray(result.data)) {
        result.data.forEach((item: CountryPosition) => {
          if (typeof item.lat === 'number' && typeof item.long === 'number') {
            map.set(item.name.toLowerCase().trim(), { lat: item.lat, lng: item.long });
            if (item.iso2) {
              map.set(item.iso2.toLowerCase().trim(), { lat: item.lat, lng: item.long });
            }
          }
        });
        cachedPositions = map;
        return map;
      }
    }
  } catch (e) {
    console.warn('Failed fetching country positions:', e);
  }

  // Fallback centroids
  map.set('india', { lat: 20.5937, lng: 78.9629 });
  map.set('united states', { lat: 37.0902, lng: -95.7129 });
  map.set('united kingdom', { lat: 55.3781, lng: -3.4360 });
  map.set('canada', { lat: 56.1304, lng: -106.3468 });
  map.set('australia', { lat: -25.2744, lng: 133.7751 });
  map.set('united arab emirates', { lat: 23.4241, lng: 53.8478 });
  map.set('singapore', { lat: 1.3521, lng: 103.8198 });
  map.set('germany', { lat: 51.1657, lng: 10.4515 });

  cachedPositions = map;
  return map;
}

/**
 * Allocate map coordinates for a selected Country and optional City.
 * Resolves coordinates using in-memory centroids, major city tables, or OpenStreetMap geocoder.
 */
export async function allocateMapLocation(
  countryName: string,
  cityName?: string
): Promise<MapAllocationResult | null> {
  const cleanCountry = countryName.trim();
  const cleanCity = cityName ? cityName.trim() : '';

  // 1. If city is provided, check direct cache first
  if (cleanCity) {
    const cityKey = cleanCity.toLowerCase();
    if (MAJOR_CITY_COORDS[cityKey]) {
      const [lat, lng] = MAJOR_CITY_COORDS[cityKey];
      return {
        country: cleanCountry,
        city: cleanCity,
        latitude: lat,
        longitude: lng,
        zoom: 14,
        displayName: `${cleanCity}, ${cleanCountry}`
      };
    }

    // Geocode city via Nominatim
    try {
      const query = `${cleanCity}, ${cleanCountry}`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          if (!isNaN(lat) && !isNaN(lng)) {
            // Cache for future
            MAJOR_CITY_COORDS[cityKey] = [lat, lng];
            return {
              country: cleanCountry,
              city: cleanCity,
              latitude: lat,
              longitude: lng,
              zoom: 14,
              displayName: `${cleanCity}, ${cleanCountry}`
            };
          }
        }
      }
    } catch {}
  }

  // 2. Fallback to Country centroid allocation
  const positionsMap = await fetchCountryPositions();
  const countryPos = positionsMap.get(cleanCountry.toLowerCase());

  if (countryPos) {
    return {
      country: cleanCountry,
      city: cleanCity || undefined,
      latitude: countryPos.lat,
      longitude: countryPos.lng,
      zoom: 6,
      displayName: cleanCountry
    };
  }

  return null;
}
