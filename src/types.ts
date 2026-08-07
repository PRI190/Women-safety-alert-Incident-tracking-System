export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  emergencyContacts?: EmergencyContact[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary?: boolean;
}

export type IncidentCategory =
  | 'Harassment'
  | 'Stalking'
  | 'Theft'
  | 'Cyber Crime'
  | 'Domestic Violence'
  | 'Suspicious Activity'
  | 'Other';

export type IncidentStatus = 'Pending' | 'Under Review' | 'Resolved' | 'Rejected';

export interface Incident {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  title: string;
  category: IncidentCategory;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  date: string;
  time: string;
  status: IncidentStatus;
  image?: string;
  anonymous: boolean;
  assignedOfficer?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  latitude: number;
  longitude: number;
  locationName: string;
  time: string;
  status: 'ACTIVE' | 'DISPATCHED' | 'RESOLVED' | 'CANCELLED';
  resolvedAt?: string;
  notes?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type?: 'sos' | 'incident' | 'system';
  isRead: boolean;
  createdAt: string;
}

export type RiskLevel = 'Safe' | 'Moderate' | 'Danger';

export interface HotspotArea {
  id: string;
  areaName: string;
  latitude: number;
  longitude: number;
  incidentCount: number;
  riskLevel: RiskLevel;
  primaryCategories: string[];
  safetyTips: string[];
  lastUpdated: string;
}

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalIncidents: number;
  pendingIncidents: number;
  underReviewIncidents: number;
  resolvedIncidents: number;
  rejectedIncidents: number;
  sosTodayCount: number;
  activeSOSTotal: number;
  categoryBreakdown: { category: string; count: number }[];
  monthlyTrends: { month: string; incidents: number; resolved: number }[];
  riskDistribution: { level: string; count: number }[];
}
