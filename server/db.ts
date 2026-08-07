import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface DBUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'user' | 'admin';
  createdAt: string;
  emergencyContacts: {
    id: string;
    name: string;
    relationship: string;
    phone: string;
    isPrimary?: boolean;
  }[];
}

export interface DBIncident {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  title: string;
  category: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  date: string;
  time: string;
  status: 'Pending' | 'Under Review' | 'Resolved' | 'Rejected';
  image?: string;
  anonymous: boolean;
  assignedOfficer?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DBSOS {
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

export interface DBNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type?: 'sos' | 'incident' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface DBHotspot {
  id: string;
  areaName: string;
  latitude: number;
  longitude: number;
  incidentCount: number;
  riskLevel: 'Safe' | 'Moderate' | 'Danger';
  primaryCategories: string[];
  safetyTips: string[];
  lastUpdated: string;
}

export interface DBData {
  users: DBUser[];
  incidents: DBIncident[];
  sosAlerts: DBSOS[];
  notifications: DBNotification[];
  hotspots: DBHotspot[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

function initializeSeedData(): DBData {
  const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);

  const users: DBUser[] = [
    {
      id: 'usr-admin-1',
      name: 'Safety Admin',
      email: 'admin@womensafety.org',
      phone: '+1 (555) 019-2831',
      passwordHash: defaultPasswordHash,
      role: 'admin',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      emergencyContacts: []
    },
    {
      id: 'usr-demo-1',
      name: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '+1 (555) 839-2041',
      passwordHash: defaultPasswordHash,
      role: 'user',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      emergencyContacts: [
        { id: 'ec-1', name: 'Anil Sharma (Father)', relationship: 'Parent', phone: '+1 (555) 123-4567', isPrimary: true },
        { id: 'ec-2', name: 'Neha Sharma (Sister)', relationship: 'Sibling', phone: '+1 (555) 987-6543' }
      ]
    },
    {
      id: 'usr-demo-2',
      name: 'Ananya Roy',
      email: 'ananya@example.com',
      phone: '+1 (555) 441-9201',
      passwordHash: defaultPasswordHash,
      role: 'user',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      emergencyContacts: [
        { id: 'ec-3', name: 'Rohan Roy (Spouse)', relationship: 'Spouse', phone: '+1 (555) 321-7654', isPrimary: true }
      ]
    }
  ];

  const incidents: DBIncident[] = [
    {
      id: 'INC-2026-001',
      userId: 'usr-demo-1',
      userName: 'Priya Sharma',
      userPhone: '+1 (555) 839-2041',
      title: 'Verbal Harassment near Metro North Exit',
      category: 'Harassment',
      description: 'Group of men loitering near stairs calling out disrespectful remarks at 9:30 PM.',
      location: 'Metro Station North Gate, 5th Avenue',
      latitude: 40.7128,
      longitude: -74.006,
      date: '2026-08-05',
      time: '21:30',
      status: 'Under Review',
      anonymous: false,
      assignedOfficer: 'Officer Sarah Jenkins (Unit 4)',
      adminNotes: 'Patrol team notified to increase surveillance during evening hours.',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'INC-2026-002',
      userId: 'usr-demo-2',
      userName: 'Ananya Roy',
      userPhone: '+1 (555) 441-9201',
      title: 'Suspicious Stalking Following from Bus Depot',
      category: 'Stalking',
      description: 'An unbadged black sedan followed slowly behind for 4 blocks along Park Street.',
      location: 'Park Street & 12th Avenue',
      latitude: 40.7282,
      longitude: -73.9942,
      date: '2026-08-04',
      time: '22:15',
      status: 'Resolved',
      anonymous: false,
      assignedOfficer: 'Officer Marcus Vance (Unit 2)',
      adminNotes: 'CCTV footage reviewed. Vehicle driver identified and issued formal warning.',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'INC-2026-003',
      userId: 'usr-demo-1',
      userName: 'Anonymous User',
      title: 'Unlit Alleyway and Unauthorized Gathering',
      category: 'Suspicious Activity',
      description: 'Streetlights broken for 3 weeks; groups blocking walkway after midnight.',
      location: 'Oakridge Suburb Alleyway 4',
      latitude: 40.7589,
      longitude: -73.9851,
      date: '2026-08-06',
      time: '00:10',
      status: 'Pending',
      anonymous: true,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'INC-2026-004',
      userId: 'usr-demo-2',
      userName: 'Ananya Roy',
      title: 'Harassing Messages and Cyber Bullying',
      category: 'Cyber Crime',
      description: 'Received repeated non-consensual threat messages via unverified social accounts.',
      location: 'Online Platform / University Portal',
      latitude: 40.7306,
      longitude: -73.9352,
      date: '2026-08-03',
      time: '18:45',
      status: 'Resolved',
      anonymous: false,
      assignedOfficer: 'Cyber Cell Inspector Ray',
      adminNotes: 'Cyber forensics tracked IP address and escalated to institutional disciplinary board.',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
    }
  ];

  const sosAlerts: DBSOS[] = [
    {
      id: 'SOS-2026-881',
      userId: 'usr-demo-1',
      userName: 'Priya Sharma',
      userPhone: '+1 (555) 839-2041',
      latitude: 40.7128,
      longitude: -74.006,
      locationName: 'Near Metro Station North Gate',
      time: new Date(Date.now() - 1800000).toISOString(),
      status: 'DISPATCHED',
      notes: 'Emergency unit 04 dispatched. Emergency contacts alerted via automated SMS.'
    },
    {
      id: 'SOS-2026-880',
      userId: 'usr-demo-2',
      userName: 'Ananya Roy',
      userPhone: '+1 (555) 441-9201',
      latitude: 40.7589,
      longitude: -73.9851,
      locationName: 'Times Square Central Plaza',
      time: new Date(Date.now() - 86400000).toISOString(),
      status: 'RESOLVED',
      resolvedAt: new Date(Date.now() - 82000000).toISOString(),
      notes: 'User safely escorted to cab by nearby police patrol officer.'
    }
  ];

  const notifications: DBNotification[] = [
    {
      id: 'notif-1',
      userId: 'usr-demo-1',
      title: 'Incident Status Updated',
      message: 'Your report INC-2026-001 status changed to "Under Review". Officer Sarah assigned.',
      type: 'incident',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'notif-2',
      userId: 'usr-demo-1',
      title: 'SOS Emergency Response Sent',
      message: 'Police emergency response dispatch confirmed for your SOS alert #SOS-2026-881.',
      type: 'sos',
      isRead: true,
      createdAt: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'notif-admin',
      userId: 'usr-admin-1',
      title: 'URGENT: New SOS Alert Triggered',
      message: 'SOS Alert #SOS-2026-881 triggered by Priya Sharma at Metro Station North Gate.',
      type: 'sos',
      isRead: false,
      createdAt: new Date(Date.now() - 1800000).toISOString()
    }
  ];

  const hotspots: DBHotspot[] = [
    {
      id: 'hs-1',
      areaName: 'Metro Station North Gate & Underground Pass',
      latitude: 40.7128,
      longitude: -74.006,
      incidentCount: 14,
      riskLevel: 'Danger',
      primaryCategories: ['Harassment', 'Stalking', 'Theft'],
      safetyTips: ['Use main illuminated exit after 8 PM', 'Stay near security booth', 'Avoid unlit lower walkways'],
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'hs-2',
      areaName: 'Downtown Night Market & Alleyway 4',
      latitude: 40.7282,
      longitude: -73.9942,
      incidentCount: 9,
      riskLevel: 'Moderate',
      primaryCategories: ['Suspicious Activity', 'Theft'],
      safetyTips: ['Keep personal belongings secured', 'Travel in groups when possible'],
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'hs-3',
      areaName: 'University West Campus Bus Station',
      latitude: 40.7306,
      longitude: -73.9352,
      incidentCount: 2,
      riskLevel: 'Safe',
      primaryCategories: ['Suspicious Activity'],
      safetyTips: ['24/7 CCTV Monitored', 'Campus Emergency Phone Pillar Available'],
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'hs-4',
      areaName: 'Oakridge Suburb Park Walkway',
      latitude: 40.7589,
      longitude: -73.9851,
      incidentCount: 11,
      riskLevel: 'Danger',
      primaryCategories: ['Harassment', 'Stalking'],
      safetyTips: ['Avoid unlit park trail past sunset', 'Use main perimeter avenue'],
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'hs-5',
      areaName: 'Tech Park South Boulevard',
      latitude: 40.7484,
      longitude: -73.9857,
      incidentCount: 4,
      riskLevel: 'Moderate',
      primaryCategories: ['Suspicious Activity', 'Cyber Crime'],
      safetyTips: ['Security guards active at building lobbies', 'Shuttle services operating till midnight'],
      lastUpdated: new Date().toISOString()
    }
  ];

  return { users, incidents, sosAlerts, notifications, hotspots };
}

class StoreManager {
  private data: DBData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DBData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed reading data file, using fresh seed data:', e);
    }
    const seed = initializeSeedData();
    this.saveData(seed);
    return seed;
  }

  private saveData(dataToSave?: DBData) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave || this.data, null, 2));
    } catch (e) {
      console.error('Failed writing data file:', e);
    }
  }

  public get<K extends keyof DBData>(key: K): DBData[K] {
    return this.data[key];
  }

  public set<K extends keyof DBData>(key: K, value: DBData[K]) {
    this.data[key] = value;
    this.saveData();
  }

  public resetSeed() {
    this.data = initializeSeedData();
    this.saveData();
  }
}

export const db = new StoreManager();
