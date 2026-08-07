import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { IncidentCategory } from '../../types';
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
  X
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

  const [form, setForm] = useState({
    title: '',
    category: 'Harassment' as IncidentCategory,
    description: '',
    location: '',
    latitude: 40.7128,
    longitude: -74.006,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    image: '',
    anonymous: false
  });

  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const handleCaptureGPS = () => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm((prev) => ({
            ...prev,
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
            location: prev.location || `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`
          }));
          showToast('GPS coordinates updated successfully!', 'success');
          setGpsLoading(false);
        },
        () => {
          showToast('Geolocation permission denied or unavailable.', 'warning');
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      showToast('Geolocation is not supported by your browser.', 'error');
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
