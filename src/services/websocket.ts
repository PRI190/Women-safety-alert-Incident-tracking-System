/**
 * Client-side WebSocket client for real-time multi-device synchronization
 * Handles auto-reconnect, live SOS broadcasts, real-time incident updates, and presence awareness.
 */

export type WSEventCallback = (data: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 30;
  private reconnectTimeout: any = null;
  private pingInterval: any = null;
  private listeners: Map<string, Set<WSEventCallback>> = new Map();
  private isExplicitlyClosed = false;

  public isConnected = false;
  public onlineDevices = 1;
  public clientId = '';

  constructor() {
    this.setupUrl();
  }

  private setupUrl() {
    if (typeof window === 'undefined') return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Connect to /ws on current host
    this.url = `${protocol}//${window.location.host}/ws`;
  }

  public connect() {
    if (typeof window === 'undefined' || !this.url) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('[WebSocket Client] Connected to real-time server at', this.url);

        // Authenticate socket with current session credentials
        this.sendAuth();

        // Start client-side ping keepalive
        this.startPing();

        this.emitLocal('connection:change', { connected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { type, data } = payload;

          if (type === 'init') {
            this.clientId = data?.clientId || '';
            if (data?.onlineDevices) {
              this.onlineDevices = data.onlineDevices;
              this.emitLocal('presence:update', { onlineDevices: this.onlineDevices });
            }
          } else if (type === 'presence:update') {
            if (data?.onlineDevices) {
              this.onlineDevices = data.onlineDevices;
            }
          }

          // Emit to all registered listeners for this event type
          this.emitLocal(type, data);
          // Also emit to wildcard listener
          this.emitLocal('*', { type, data });
        } catch (err) {
          console.warn('[WebSocket Client] Failed parsing incoming message:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.stopPing();
        this.emitLocal('connection:change', { connected: false });

        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[WebSocket Client] Socket connection error:', err);
      };
    } catch (e) {
      console.warn('[WebSocket Client] Failed opening socket:', e);
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    this.stopPing();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  private scheduleReconnect() {
    if (this.isExplicitlyClosed) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocket Client] Max reconnect attempts reached, waiting 15s before retry');
      this.reconnectAttempts = 0;
    }

    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;

    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      this.send('ping', { time: Date.now() });
    }, 25000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public sendAuth() {
    try {
      const stored = localStorage.getItem('ws_user');
      const token = localStorage.getItem('ws_token');
      if (stored) {
        const user = JSON.parse(stored);
        this.send('auth', {
          userId: user.id,
          name: user.name,
          role: user.role,
          token
        });
      }
    } catch {}
  }

  public send(type: string, data?: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    try {
      this.ws.send(JSON.stringify({ type, data, timestamp: new Date().toISOString() }));
      return true;
    } catch (err) {
      console.warn('[WebSocket Client] Failed sending payload:', err);
      return false;
    }
  }

  public on(event: string, callback: WSEventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: WSEventCallback) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  private emitLocal(event: string, data: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`[WebSocket Client] Error in listener for "${event}":`, e);
        }
      });
    }
  }

  // High-Level Multi-Device Helper Methods
  public triggerSOS(sosData: any) {
    return this.send('sos:trigger', sosData);
  }

  public updateSOSLocation(id: string, latitude: number, longitude: number, locationName?: string) {
    return this.send('sos:location_update', { id, latitude, longitude, locationName });
  }

  public updateSOSStatus(id: string, status: string, notes?: string) {
    return this.send('sos:status_update', { id, status, notes });
  }

  public reportIncident(incidentData: any) {
    return this.send('incident:create', incidentData);
  }

  public updateIncident(id: string, updates: any) {
    return this.send('incident:update', { id, ...updates });
  }
}

export const wsClient = new WebSocketClient();
