import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Bell, CheckCheck, AlertTriangle, ShieldAlert, FileText } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { notifications, fetchNotifications, showToast } = useAuth();

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      fetchNotifications();
      showToast('All notifications marked as read', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-[#6C63FF] rounded-2xl">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Notifications Center</h1>
            <p className="text-xs text-slate-500">Realtime alerts for incident progress and emergency responses.</p>
          </div>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4 text-[#6C63FF]" /> Mark All Read
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 space-y-3">
        {notifications.length === 0 ? (
          <p className="text-xs text-slate-400 py-10 text-center">No notification alerts.</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkRead(n.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                !n.isRead
                  ? 'bg-indigo-50/60 border-indigo-200 text-slate-900 font-medium'
                  : 'bg-slate-50 border-slate-200/60 text-slate-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl mt-0.5 shrink-0 bg-white shadow-xs">
                  {n.type === 'sos' ? (
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-[#6C63FF]" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">{n.title}</h4>
                  <p className="text-xs leading-relaxed text-slate-700">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    {new Date(n.createdAt).toLocaleDateString()} at{' '}
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF6584] shrink-0 mt-2" title="Unread" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
