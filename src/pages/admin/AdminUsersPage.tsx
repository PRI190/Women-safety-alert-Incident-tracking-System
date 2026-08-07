import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User } from '../../types';
import { Users, Shield, Phone, Mail, Calendar, Search } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // In seed/store we have user profiles
      const profile = await api.getProfile();
      // For demo, construct users list from mock / store profile
      setUsers([
        profile,
        {
          id: 'usr-demo-1',
          name: 'Priya Sharma',
          email: 'priya@example.com',
          phone: '+1 (555) 839-2041',
          role: 'user',
          createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
        },
        {
          id: 'usr-demo-2',
          name: 'Ananya Roy',
          email: 'ananya@example.com',
          phone: '+1 (555) 441-9201',
          role: 'user',
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
        }
      ]);
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
      u.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">User Management Portal</h1>
          <p className="text-xs text-slate-500 mt-1">Verified platform accounts, emergency contact counts, and roles.</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF] w-60"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">User ID</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono text-[#6C63FF] font-bold">{u.id}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{u.name}</td>
                  <td className="px-6 py-4 text-slate-600">{u.email}</td>
                  <td className="px-6 py-4 text-slate-600">{u.phone}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-rose-100 text-rose-700 border border-rose-300'
                          : 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
