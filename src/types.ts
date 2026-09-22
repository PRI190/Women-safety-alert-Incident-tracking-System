export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  dob?: string;
  address?: string;
  bloodGroup?: string;
  isVerified?: boolean;
  role: UserRole;
  createdAt?: string;
  emergencyContacts?: EmergencyContact[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship?: string;
  relation?: string;
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
  | 'Infrastructure'
  | 'Other'
  | string;

export type IncidentStatus =
  | 'Pending'
  | 'Under Review'
  | 'Resolved'
  | 'Rejected'
  | 'In Progress'
  | 'Investigating'
  | 'Reported'
  | string;

export interface Incident {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  userDob?: string;
  userAddress?: string;
  title: string;
  category: IncidentCategory;
  description: string;
  location?: string;
  locationName?: string;
  latitude: number;
  longitude: number;
  date?: string;
  time?: string;
  reportedAt?: string;
  evidenceUrls?: string[];
  status: IncidentStatus;
  severity?: 'HIGH' | 'MEDIUM' | 'LOW' | 'High' | 'Medium' | 'Low' | string;
  image?: string;
  anonymous?: boolean;
  assignedOfficer?: string;
  adminNotes?: string;
  emergencyType?: string;
  audioTranscript?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userDob?: string;
  userAddress?: string;
  latitude: number;
  longitude: number;
  locationName: string;
  time?: string;
  triggeredAt?: string;
  status: 'ACTIVE' | 'DISPATCHED' | 'RESOLVED' | 'CANCELLED' | 'Active' | string;
  emergencyType?: 'General SOS' | 'Police (112)' | 'Fire (101)' | 'Medical (108)' | string;
  audioTranscript?: string;
  resolvedAt?: string;
  notes?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type?: 'sos' | 'incident' | 'system' | 'alert';
  isRead: boolean;
  createdAt: string;
}

export type RiskLevel = 'Safe' | 'Moderate' | 'Danger' | 'High' | 'Medium' | 'Low' | 'HIGH' | 'MEDIUM' | 'LOW' | string;

export interface HotspotArea {
  id: string;
  name?: string;
  areaName: string;
  latitude: number;
  longitude: number;
  incidentCount: number;
  incidentsCount?: number;
  radiusMeters?: number;
  riskLevel: RiskLevel;
  primaryCategories: string[];
  safetyTips: string[];
  lastUpdated: string;
  lastIncidentDate?: string;
}

export interface SafetyHotspot {
  id: string;
  name?: string;
  areaName?: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  incidentCount?: number;
  incidentsCount?: number;
  riskLevel: RiskLevel;
  primaryCategories?: string[];
  safetyTips?: string[];
  lastUpdated?: string;
  lastIncidentDate?: string;
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
