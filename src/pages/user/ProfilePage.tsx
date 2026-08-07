import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User, PhoneCall, Lock, UserCheck, Plus, Trash2, ShieldCheck } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser, showToast } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });

  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [contactForm, setContactForm] = useState({
    name: '',
    relationship: 'Family',
    phone: '',
    isPrimary: true
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);
  const [loadingContact, setLoadingContact] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      await api.updateProfile(profileForm);
      await refreshUser();
      showToast('Profile updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmNewPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (passForm.newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'warning');
      return;
    }

    setLoadingPass(true);
    try {
      await api.changePassword({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword
      });
      showToast('Password changed successfully', 'success');
      setPassForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err: any) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setLoadingPass(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.phone) {
      showToast('Contact name and phone number are required', 'warning');
      return;
    }

    setLoadingContact(true);
    try {
      await api.addEmergencyContact(contactForm);
      await refreshUser();
      showToast('Emergency contact added', 'success');
      setContactForm({ name: '', relationship: 'Family', phone: '', isPrimary: false });
    } catch (err: any) {
      showToast(err.message || 'Failed to add contact', 'error');
    } finally {
      setLoadingContact(false);
    }
  };

  const handleRemoveContact = async (id: string) => {
    try {
      await api.removeEmergencyContact(id);
      await refreshUser();
      showToast('Emergency contact removed', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove contact', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xl flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#6C63FF] text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-[#6C63FF]/30">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">{user?.name}</h1>
          <p className="text-xs text-slate-500">{user?.email} • Role: {user?.role.toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Edit Profile */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-3">
            <UserCheck className="w-5 h-5 text-[#6C63FF]" />
            Edit Profile Information
          </div>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF]"
              />
            </div>
            <button
              type="submit"
              disabled={loadingProfile}
              className="w-full py-3 bg-[#6C63FF] text-white font-bold text-xs rounded-xl hover:bg-[#574ff0] transition-colors"
            >
              {loadingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-3">
            <Lock className="w-5 h-5 text-[#FF6584]" />
            Change Password
          </div>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passForm.currentPassword}
                onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={passForm.newPassword}
                onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passForm.confirmNewPassword}
                onChange={(e) => setPassForm({ ...passForm, confirmNewPassword: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF]"
              />
            </div>
            <button
              type="submit"
              disabled={loadingPass}
              className="w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
            >
              {loadingPass ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Emergency Contacts Section */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-lg">
            <PhoneCall className="w-5 h-5 text-emerald-600" />
            Emergency SOS Contacts
          </div>
          <span className="text-xs text-slate-500">Auto-notified on SOS activation</span>
        </div>

        {/* Existing Contacts List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(!user?.emergencyContacts || user.emergencyContacts.length === 0) ? (
            <p className="text-xs text-slate-400 italic sm:col-span-2">No emergency contacts configured yet.</p>
          ) : (
            user.emergencyContacts.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{c.name}</span>
                    {c.isPrimary && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 block mt-0.5">{c.relationship} • {c.phone}</span>
                </div>

                <button
                  onClick={() => handleRemoveContact(c.id)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Remove Contact"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add New Contact Form */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Add Emergency Contact</h4>
          <form onSubmit={handleAddContact} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              required
              placeholder="Full Name (e.g. Anil Sharma)"
              value={contactForm.name}
              onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
              className="px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
            <input
              type="text"
              placeholder="Relationship (e.g. Parent, Spouse)"
              value={contactForm.relationship}
              onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
              className="px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
            <input
              type="tel"
              required
              placeholder="Phone Number"
              value={contactForm.phone}
              onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
              className="px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
            <button
              type="submit"
              disabled={loadingContact}
              className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Contact
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
