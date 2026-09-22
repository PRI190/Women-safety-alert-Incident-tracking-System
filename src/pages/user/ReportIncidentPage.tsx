import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { IncidentCategory } from '../../types';
import { getCachedLocation, requestDeviceLocation, fetchDeviceLocationWithPermission } from '../../utils/geolocation';
import {
  fetchCountries,
  allocateMapLocation,
  CountryData
} from '../../services/countriesService';
import {
  FilePlus,
  MapPin,
  Calendar,
  Clock,
  Camera,
  EyeOff,
  Send,
  Compass,
  AlertCircle,
  X,
  Globe,
  Check
} from 'lucide-react';

export const ReportIncidentPage: React.FC = () => {
  const { showToast } = useAuth();
  const navigate = useNavigate();

  const categories: IncidentCategory[] = [
    'Harassment',
    'Stalking',
    'Theft',
    'Cyber Crime',
    'Domestic Violence',
    'Suspicious Activity',
    'Other'
  ];

  const initialCached = getCachedLocation();

  const [form, setForm] = useState({
    title: '',
    category: 'Harassment' as IncidentCategory,
    description: '',
    location: initialCached?.areaName || '',
    latitude: initialCached?.latitude || 28.6139,
    longitude: initialCached?.longitude || 77.2090,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    image: '',
    anonymous: false
  });

  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // CountriesNow API Allocation
  const [countriesList, setCountriesList] = useState<CountryData[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('India');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [isAllocatingCountry, setIsAllocatingCountry] = useState<boolean>(false);
  const [allocatedBadge, setAllocatedBadge] = useState<string | null>(null);

  useEffect(() => {
    fetchCountries().then((data) => {
      setCountriesList(data || []);
    });
  }, []);

  const handleApplyCountryAllocation = async () => {
    if (!selectedCountry) return;
    setIsAllocatingCountry(true);
    try {
      const res = await allocateMapLocation(selectedCountry, selectedCity);
      if (res) {
        setForm((prev) => ({
          ...prev,
          location: res.displayName,
          latitude: Number(res.latitude.toFixed(6)),
          longitude: Number(res.longitude.toFixed(6))
        }));
        setAllocatedBadge(res.displayName);
        showToast(`Allocated location to ${res.displayName}!`, 'success');
      }
    } catch {
      showToast('Failed to allocate region coordinates', 'warning');
    } finally {
      setIsAllocatingCountry(false);
    }
  };

  // Automatically acquire device live location on page open
  useEffect(() => {
    requestDeviceLocation({ highAccuracy: true }).then((loc) => {
      setForm((prev) => ({
        ...prev,
        latitude: Number(loc.latitude.toFixed(6)),
        longitude: Number(loc.longitude.toFixed(6)),
        location: prev.location || loc.areaName || `GPS (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)})`
      }));
    });
  }, []);

  const handleCaptureGPS = async () => {
    setGpsLoading(true);
    try {
      const result = await fetchDeviceLocationWithPermission({ highAccuracy: true, timeout: 15000 });
      if (result.success && result.location) {
        const loc = result.location;
        setForm((prev) => ({
          ...prev,
          latitude: Number(loc.latitude.toFixed(6)),
          longitude: Number(loc.longitude.toFixed(6)),
          location: loc.areaName || `GPS (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)})`
        }));
        showToast(
          `GPS coordinates captured: ${loc.areaName || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`} (±${Math.round(loc.accuracy)}m)`,
          'success'
        );
      } else {
        if (result.error === 'permission_denied') {
          showToast(
            'Location permission denied. Please allow location access in your browser settings (lock icon in address bar) and retry.',
            'error'
          );
        } else {
          showToast(result.errorMessage || 'Unable to retrieve device GPS coordinates.', 'warning');
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Geolocation error.', 'warning');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image file size must be less than 5MB', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, image: reader.result as string }));
        showToast('Evidence photo uploaded', 'info');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
      showToast('Please fill all required fields (Title, Location, Description)', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createIncident(form);
      showToast(`Incident reported successfully under Tracking ID ${res.incident.id}!`, 'success');
      navigate('/dashboard/incidents');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit incident report', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-indigo-50 text-[#6C63FF] rounded-2xl">
            <FilePlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">File an Incident Complaint</h1>
            <p className="text-xs text-slate-500">
              Complete the details below. All submissions are encrypted and monitored by safety officers.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
        {/* Category Selector */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
            Incident Category *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {categories.map((cat) => {
              const selected = form.category === cat;
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setForm({ ...form, category: cat })}
                  className={`p-3 rounded-2xl text-xs font-bold border text-center transition-all ${
                    selected
                      ? 'bg-[#6C63FF] text-white border-[#6C63FF] shadow-lg shadow-[#6C63FF]/25'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Incident Headline / Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Verbal Harassment near Metro North Exit"
            className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF]"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description *</label>
          <textarea
            rows={4}
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe what occurred, any perpetrator descriptions, vehicle details, or sequence of events..."
            className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF]"
          />
        </div>

        {/* CountriesNow Map Allocation Component */}
        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#6C63FF]" />
              <span className="text-xs font-bold text-slate-800">
                Allocate Location by Country & City (CountriesNow API)
              </span>
              <span className="text-[10px] bg-white text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-mono font-bold">
                countriesnow.space
              </span>
            </div>
            {allocatedBadge && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                <Check className="w-3 h-3" /> Allocated: {allocatedBadge}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Country ({countriesList.length || 'Loading...'})
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setSelectedCity('');
                }}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#6C63FF] focus:outline-hidden"
              >
                {countriesList.map((c, i) => (
                  <option key={i} value={c.country}>
                    {c.country} ({c.iso2})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                City (
                {(
                  countriesList.find((c) => c.country.toLowerCase() === selectedCountry.toLowerCase())
                    ?.cities || []
                ).length}{' '}
                available)
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#6C63FF] focus:outline-hidden"
              >
                <option value="">-- Choose City / Region --</option>
                {(
                  countriesList.find((c) => c.country.toLowerCase() === selectedCountry.toLowerCase())
                    ?.cities || []
                ).map((ct, idx) => (
                  <option key={idx} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleApplyCountryAllocation}
                disabled={isAllocatingCountry}
                className="w-full py-2 px-3 bg-[#6C63FF] hover:bg-[#5b52e0] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Globe className={`w-3.5 h-3.5 ${isAllocatingCountry ? 'animate-spin' : ''}`} />
                {isAllocatingCountry ? 'Allocating...' : 'Allocate to Form'}
              </button>
            </div>
          </div>
        </div>

        {/* Location & GPS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Location Address / Landmark *</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Metro Station Gate 3, 5th Avenue"
                className="w-full pl-9 pr-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">GPS Location Pin</label>
            <button
              type="button"
              onClick={handleCaptureGPS}
              disabled={gpsLoading}
              className="w-full py-3 px-3 bg-indigo-50 hover:bg-indigo-100 text-[#6C63FF] border border-indigo-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Compass className={`w-4 h-4 ${gpsLoading ? 'animate-spin' : ''}`} />
              {gpsLoading ? 'Detecting...' : 'Autofill Current GPS'}
            </button>
          </div>
        </div>

        {/* Lat/Long display */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-500 font-semibold">Latitude:</span>{' '}
            <input
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })}
              className="ml-2 px-2 py-1 bg-white border border-slate-200 rounded-md font-mono text-slate-800 w-28"
            />
          </div>
          <div>
            <span className="text-slate-500 font-semibold">Longitude:</span>{' '}
            <input
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })}
              className="ml-2 px-2 py-1 bg-white border border-slate-200 rounded-md font-mono text-slate-800 w-28"
            />
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Date of Incident</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full pl-9 pr-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Time of Incident</label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="time"
                required
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full pl-9 pr-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF]"
              />
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Attach Photo Evidence (Optional)</label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-2 border border-slate-200">
              <Camera className="w-4 h-4 text-[#6C63FF]" />
              Select Photo File
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            {form.image && (
              <div className="relative">
                <img src={form.image} alt="Upload preview" className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image: '' })}
                  className="absolute -top-1.5 -right-1.5 p-0.5 bg-rose-600 text-white rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Anonymous Checkbox */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <EyeOff className="w-5 h-5 text-amber-600" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">Report Anonymously</span>
              <span className="text-[11px] text-slate-600 block">
                Your personal name and phone number will be omitted from public case records.
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={form.anonymous}
            onChange={(e) => setForm({ ...form, anonymous: e.target.checked })}
            className="w-5 h-5 text-[#6C63FF] rounded-md focus:ring-[#6C63FF]"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#6C63FF] hover:bg-[#584fe0] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-[#6C63FF]/30 transition-all flex items-center justify-center gap-2"
        >
          {loading ? 'Submitting Report...' : 'SUBMIT INCIDENT REPORT NOW'}
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
