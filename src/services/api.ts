import {
  User,
  Incident,
  SOSAlert,
  NotificationItem,
  HotspotArea,
  DashboardMetrics,
  EmergencyContact
} from '../types';

const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('ws_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export const api = {
  // Auth
  async register(data: any): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async login(data: any): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getProfile(): Promise<User> {
    const res = await fetch(`${API_BASE}/profile`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async updateProfile(data: { name?: string; phone?: string }): Promise<{ message: string; user: User }> {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/change-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async addEmergencyContact(data: Omit<EmergencyContact, 'id'>): Promise<{ message: string; contacts: EmergencyContact[] }> {
    const res = await fetch(`${API_BASE}/emergency-contacts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async removeEmergencyContact(id: string): Promise<{ message: string; contacts: EmergencyContact[] }> {
    const res = await fetch(`${API_BASE}/emergency-contacts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Incidents
  async getIncidents(params?: { search?: string; category?: string; status?: string; myOnly?: boolean }): Promise<Incident[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.myOnly) query.set('myOnly', 'true');

    const res = await fetch(`${API_BASE}/incidents?${query.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getIncidentById(id: string): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incident/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async createIncident(data: any): Promise<{ message: string; incident: Incident }> {
    const res = await fetch(`${API_BASE}/incident`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateIncident(id: string, data: { status?: string; assignedOfficer?: string; adminNotes?: string }): Promise<{ message: string; incident: Incident }> {
    const res = await fetch(`${API_BASE}/incident/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteIncident(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/incident/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // SOS
  async sendSOS(data: { latitude: number; longitude: number; locationName?: string }): Promise<{ message: string; sosAlert: SOSAlert; emergencyContacts: EmergencyContact[] }> {
    const res = await fetch(`${API_BASE}/sos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getSOSAlerts(): Promise<SOSAlert[]> {
    const res = await fetch(`${API_BASE}/sos`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async updateSOS(id: string, data: { status: string; notes?: string }): Promise<{ message: string; sos: SOSAlert }> {
    const res = await fetch(`${API_BASE}/sos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Hotspots
  async getHotspots(): Promise<HotspotArea[]> {
    const res = await fetch(`${API_BASE}/hotspots`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Dashboard
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const res = await fetch(`${API_BASE}/dashboard`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async resetSeedData(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/seed`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async markNotificationRead(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async markAllNotificationsRead(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  }
};
