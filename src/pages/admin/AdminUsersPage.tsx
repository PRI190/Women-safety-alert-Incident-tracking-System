import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User } from '../../types';
import { Search, MapPin, Calendar, PhoneCall, Phone, UserCheck, Shield } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm) ||
      (u.address && u.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Registered Users Directory</h1>
          <p className="text-xs text-slate-500 mt-1">Listing registered users, profile details (DOB, Phone, Address), and 2 emergency contacts.</p>
        </div>

        <div className="relative w-full md:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users, phone, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#B91C1C] w-full md:w-72"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">User ID / Role</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Date of Birth (DOB)</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Residential Address</th>
                <th className="px-6 py-4">Emergency Contacts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-bold">
                    Loading users directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-bold">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-[#B91C1C] font-bold text-xs">{u.id}</div>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          u.role === 'admin'
                            ? 'bg-red-100 text-[#B91C1C]'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-900 text-sm">{u.name}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#B91C1C]" />
                        <span>{u.dob || '1998-08-15'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{u.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 max-w-xs">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">{u.address || 'Flat 402, Sunshine Heights, Vellayambalam, Trivandrum'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.emergencyContacts && u.emergencyContacts.length > 0 ? (
                        <div className="space-y-1">
                          {u.emergencyContacts.slice(0, 2).map((ec) => (
                            <div key={ec.id} className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                              <div className="font-bold text-slate-900 flex items-center justify-between gap-2">
                                <span>{ec.name}</span>
                                <span className="text-[9px] text-slate-500 font-normal">({ec.relationship})</span>
                              </div>
                              <div className="text-emerald-700 font-mono font-bold flex items-center gap-1 mt-0.5">
                                <PhoneCall className="w-3 h-3" />
                                {ec.phone}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No contacts added</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
