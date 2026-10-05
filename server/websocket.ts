import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Response } from 'express';
import { db, DBIncident, DBSOS, DBNotification } from './db';

export interface WSMessage {
  type: string;
  data?: any;
  senderId?: string;
  timestamp?: string;
}

export interface ConnectedClient {
  id: string;
  ws: WebSocket;
  userId?: string;
  role?: 'user' | 'admin' | string;
  name?: string;
  isAlive: boolean;
  connectedAt: string;
}

const clients = new Map<string, ConnectedClient>();
const sseClients = new Set<Response>();
let wssInstance: WebSocketServer | null = null;

/**
 * Register an HTTP Server-Sent Events (SSE) subscriber
 * Provides 100% cellular and proxy firewall pass-through without requiring WebSocket upgrades.
 */
export function registerSSEClient(res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no'
  });

  const clientId = `sse-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  res.write(
    `data: ${JSON.stringify({
      type: 'init',
      data: {
        clientId,
        onlineDevices: clients.size + sseClients.size + 1,
        syncProtocol: 'Server-Sent Events (SSE)',
        serverTime: new Date().toISOString()
      }
    })}\n\n`
  );

  sseClients.add(res);
  console.log(`[SSE] Client connected. Total SSE clients: ${sseClients.size}`);
  broadcastPresence();

  // Send SSE keep-alive comment every 15s to keep mobile NAT route active
  const keepAlive = setInterval(() => {
    try {
      res.write(`: keepalive ${Date.now()}\n\n`);
    } catch {
      clearInterval(keepAlive);
      sseClients.delete(res);
    }
  }, 15000);

  res.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
    console.log(`[SSE] Client disconnected. Remaining SSE clients: ${sseClients.size}`);
    broadcastPresence();
  });
}

export function setupWebSocketServer(httpServer: http.Server): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });
  wssInstance = wss;

  console.log('[WebSocket] Server mounted with flexible upgrade handler (/ws, /socket, /api/ws)');

  httpServer.on('upgrade', (req, socket, head) => {
    const rawUrl = req.url || '';
    const pathname = rawUrl.split('?')[0].replace(/\/+$/, '') || '/';

    if (
      pathname === '/ws' ||
      pathname === '/socket' ||
      pathname === '/api/ws' ||
      pathname.endsWith('/ws')
    ) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
  });

  wss.on('connection', (ws: WebSocket, req) => {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const client: ConnectedClient = {
      id: clientId,
      ws,
      isAlive: true,
      connectedAt: new Date().toISOString()
    };

    clients.set(clientId, client);
    console.log(`[WebSocket] Client connected: ${clientId}. Total active clients: ${clients.size}`);

    // Send initial handshake and active client count
    sendToSocket(ws, {
      type: 'init',
      data: {
        clientId,
        onlineDevices: clients.size,
        serverTime: new Date().toISOString()
      }
    });

    // Broadcast updated presence to all connected devices
    broadcastPresence();

    ws.on('pong', () => {
      client.isAlive = true;
    });

    ws.on('message', (rawMessage: string | Buffer) => {
      try {
        const text = rawMessage.toString();
        const msg: WSMessage = JSON.parse(text);
        handleClientMessage(client, msg);
      } catch (err) {
        console.warn('[WebSocket] Malformed message received:', err);
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
      console.log(`[WebSocket] Client disconnected: ${clientId}. Remaining: ${clients.size}`);
      broadcastPresence();
    });

    ws.on('error', (err) => {
      console.warn(`[WebSocket] Socket error on ${clientId}:`, err);
    });
  });

  // Keep-alive heartbeat interval every 12 seconds for cellular mobile resilience
  const interval = setInterval(() => {
    for (const [id, client] of clients.entries()) {
      if (!client.isAlive) {
        try {
          client.ws.terminate();
        } catch {}
        clients.delete(id);
        continue;
      }
      client.isAlive = false;
      try {
        client.ws.ping();
      } catch {}
    }
  }, 12000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}

function sendToSocket(ws: WebSocket, message: WSMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ ...message, timestamp: message.timestamp || new Date().toISOString() }));
  }
}

function broadcastPresence() {
  broadcastWebSocketEvent('presence:update', {
    onlineDevices: clients.size + sseClients.size,
    timestamp: new Date().toISOString()
  });
}

function handleClientMessage(client: ConnectedClient, msg: WSMessage) {
  const { type, data } = msg;

  switch (type) {
    case 'auth': {
      if (data) {
        client.userId = data.userId;
        client.role = data.role;
        client.name = data.name;
        console.log(`[WebSocket] Client ${client.id} authenticated as ${client.role} (${client.name || client.userId})`);
      }
      sendToSocket(client.ws, {
        type: 'auth:ack',
        data: { success: true, clientId: client.id, role: client.role }
      });
      broadcastPresence();
      break;
    }

    case 'ping': {
      sendToSocket(client.ws, { type: 'pong', data: { time: Date.now() } });
      break;
    }

    // Direct real-time SOS trigger from client
    case 'sos:trigger': {
      if (!data) return;
      const { latitude, longitude, locationName, emergencyType, audioTranscript, user } = data;
      const userId = client.userId || user?.id || 'poiu';
      const userName = client.name || user?.name || 'Citizen in Distress';
      const userPhone = user?.phone || '+1 (555) 839-2041';

      const typeLabel = emergencyType || 'General SOS';
      const locStr = locationName || 'Live GPS Coordinates';

      const newSOS: DBSOS = {
        id: `SOS-2026-${Math.floor(100 + Math.random() * 900)}`,
        userId,
        userName,
        userPhone,
        userDob: user?.dob,
        userAddress: user?.address,
        latitude: Number(latitude) || 28.6139,
        longitude: Number(longitude) || 77.2090,
        locationName: locStr,
        time: new Date().toISOString(),
        status: 'ACTIVE',
        emergencyType: typeLabel,
        audioTranscript: audioTranscript || `URGENT SOS broadcast from ${userName} at ${locStr}.`,
        notes: `Real-time distress beacon triggered via live multi-device WebSocket.`
      };

      const sosAlerts = db.get('sosAlerts');
      sosAlerts.unshift(newSOS);
      db.set('sosAlerts', sosAlerts);

      // Create notifications
      const notifications = db.get('notifications');
      notifications.unshift({
        id: `notif-sos-${Date.now()}`,
        userId,
        title: `🚨 ${typeLabel.toUpperCase()} Emergency Transmitted`,
        message: `Your distress signal ${newSOS.id} was broadcasted live to all emergency responder devices.`,
        type: 'sos',
        isRead: false,
        createdAt: new Date().toISOString()
      });
      db.set('notifications', notifications);

      // Broadcast to ALL connected devices (multi-device real-time sync)
      broadcastWebSocketEvent('sos:created', newSOS);
      broadcastWebSocketEvent('notification:new', {
        title: `🚨 EMERGENCY: ${typeLabel}`,
        message: `${userName} triggered an urgent distress alert at ${locStr}`,
        sosId: newSOS.id
      });
      break;
    }

    // Live GPS tracking update while SOS is active (multi-device tracking)
    case 'sos:location_update': {
      if (!data || !data.id) return;
      const { id, latitude, longitude, locationName } = data;
      const sosAlerts = db.get('sosAlerts');
      const sos = sosAlerts.find((s) => s.id === id);

      if (sos) {
        if (latitude) sos.latitude = Number(latitude);
        if (longitude) sos.longitude = Number(longitude);
        if (locationName) sos.locationName = locationName;
        db.set('sosAlerts', sosAlerts);

        broadcastWebSocketEvent('sos:location_updated', {
          id,
          latitude: sos.latitude,
          longitude: sos.longitude,
          locationName: sos.locationName,
          updatedAt: new Date().toISOString()
        });
      }
      break;
    }

    // SOS status updated (e.g. Dispatched, Resolved)
    case 'sos:status_update': {
      if (!data || !data.id || !data.status) return;
      const { id, status, notes } = data;
      const sosAlerts = db.get('sosAlerts');
      const sos = sosAlerts.find((s) => s.id === id);

      if (sos) {
        sos.status = status;
        if (notes) sos.notes = notes;
        if (status === 'RESOLVED') sos.resolvedAt = new Date().toISOString();
        db.set('sosAlerts', sosAlerts);

        broadcastWebSocketEvent('sos:updated', sos);
      }
      break;
    }

    // Real-time Incident complaint submitted
    case 'incident:create': {
      if (!data) return;
      const incidents = db.get('incidents');
      const newInc: DBIncident = {
        id: `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        userId: client.userId || data.userId || 'poiu',
        userName: data.anonymous ? 'Anonymous User' : client.name || data.userName || 'Safety Member',
        userPhone: data.anonymous ? undefined : data.userPhone,
        title: data.title || 'Reported Incident',
        category: data.category || 'General',
        description: data.description || '',
        location: data.location || data.locationName || 'Local Transit Area',
        latitude: Number(data.latitude) || 28.6139,
        longitude: Number(data.longitude) || 77.2090,
        date: data.date || new Date().toISOString().split('T')[0],
        time: data.time || new Date().toTimeString().slice(0, 5),
        status: 'Pending',
        image: data.image,
        anonymous: !!data.anonymous,
        createdAt: new Date().toISOString()
      };

      incidents.unshift(newInc);
      db.set('incidents', incidents);

      broadcastWebSocketEvent('incident:created', newInc);
      break;
    }

    // Real-time Incident update (e.g. officer assigned, status changed)
    case 'incident:update': {
      if (!data || !data.id) return;
      const incidents = db.get('incidents');
      const index = incidents.findIndex((i) => i.id === data.id);
      if (index !== -1) {
        const inc = incidents[index];
        if (data.status) inc.status = data.status;
        if (data.assignedOfficer !== undefined) inc.assignedOfficer = data.assignedOfficer;
        if (data.adminNotes !== undefined) inc.adminNotes = data.adminNotes;
        inc.updatedAt = new Date().toISOString();
        incidents[index] = inc;
        db.set('incidents', incidents);

        broadcastWebSocketEvent('incident:updated', inc);
      }
      break;
    }

    default: {
      console.log(`[WebSocket] Unhandled event type: ${type}`);
    }
  }
}

/**
 * Broadcast an event to all connected WebSocket & SSE clients across multiple devices.
 */
export function broadcastWebSocketEvent(type: string, data: any, filter?: (client: ConnectedClient) => boolean) {
  const payload: WSMessage = {
    type,
    data,
    timestamp: new Date().toISOString()
  };
  const stringified = JSON.stringify(payload);

  // 1. Broadcast to WebSocket clients
  for (const client of clients.values()) {
    if (filter && !filter(client)) {
      continue;
    }
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(stringified);
      } catch (err) {
        console.warn(`[WebSocket] Failed to send to ${client.id}:`, err);
      }
    }
  }

  // 2. Broadcast to Server-Sent Events (SSE) clients (works through 100% of mobile firewalls/proxies)
  const sseChunk = `data: ${stringified}\n\n`;
  for (const sseRes of sseClients) {
    try {
      sseRes.write(sseChunk);
    } catch {
      sseClients.delete(sseRes);
    }
  }
}

/**
 * Get current connected devices statistics
 */
export function getWebSocketStats() {
  return {
    totalClients: clients.size + sseClients.size,
    wsClients: clients.size,
    sseClients: sseClients.size,
    authenticatedUsers: Array.from(clients.values()).filter((c) => !!c.userId).length,
    roles: Array.from(clients.values()).map((c) => c.role || 'guest')
  };
}
