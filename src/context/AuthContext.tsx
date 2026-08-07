import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, NotificationItem } from '../types';
import { api } from '../services/api';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  demoLoginUser: () => Promise<void>;
  demoLoginAdmin: () => Promise<void>;
  refreshUser: () => Promise<void>;
  notifications: NotificationItem[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('ws_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (e) {
      // ignore token expiration noise
    }
  };

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const u = await api.getProfile();
      setUser(u);
      fetchNotifications();
    } catch (e) {
      console.error('Failed fetching user profile:', e);
      localStorage.removeItem('ws_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  // Periodic notifications check
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      localStorage.setItem('ws_token', res.token);
      setToken(res.token);
      setUser(res.user);
      showToast(`Welcome back, ${res.user.name}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      const res = await api.register(data);
      localStorage.setItem('ws_token', res.token);
      setToken(res.token);
      setUser(res.user);
      showToast(`Account created successfully! Welcome, ${res.user.name}.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const demoLoginUser = async () => {
    await login('priya@example.com', 'Password123!');
  };

  const demoLoginAdmin = async () => {
    await login('admin@womensafety.org', 'Password123!');
  };

  const logout = () => {
    localStorage.removeItem('ws_token');
    setToken(null);
    setUser(null);
    setNotifications([]);
    showToast('You have been logged out safely.', 'info');
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        demoLoginUser,
        demoLoginAdmin,
        refreshUser,
        notifications,
        unreadCount,
        fetchNotifications,
        toasts,
        showToast,
        removeToast
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
