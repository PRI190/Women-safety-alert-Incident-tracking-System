import React, { useState } from 'react';
import { useWebSocket } from '../../context/WebSocketContext';
import { Wifi, WifiOff, Smartphone, Laptop, Radio, CheckCircle2, Shield, RefreshCw, AlertCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const MultiDeviceSyncBadge: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isConnected, syncMode, onlineDevices, latencyMs, forceReconnect } = useWebSocket();
  const [showDetails, setShowDetails] = useState(false);
  const [isReconnectingManual, setIsReconnectingManual] = useState(false);

  const handleManualReconnect = () => {
    setIsReconnectingManual(true);
    forceReconnect();
    setTimeout(() => {
      setIsReconnectingManual(false);
    }, 1200);
  };

  const isWs = syncMode === 'websocket';
  const isSse = syncMode === 'sse';
  const isPolling = syncMode === 'polling';

  return (
    <div className="relative inline-block text-xs">
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer font-bold ${
          isWs || isSse
            ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30 hover:bg-emerald-500/20'
            : isPolling
            ? 'bg-blue-500/10 text-blue-800 border-blue-500/30 hover:bg-blue-500/20'
            : 'bg-amber-500/10 text-amber-800 border-amber-500/30 hover:bg-amber-500/20'
        }`}
        title="Multi-Device Real-Time Sync Status"
      >
        <span className="relative flex h-2 w-2">
          {isConnected && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isWs || isSse ? 'bg-emerald-400' : 'bg-blue-400'
              }`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isWs || isSse ? 'bg-emerald-500' : isPolling ? 'bg-blue-500' : 'bg-amber-500'
            }`}
          />
        </span>

        {compact ? (
          <span className="text-[11px] font-mono font-bold">
            {isWs
              ? `${onlineDevices} Dev (WS)`
              : isSse
              ? `${onlineDevices} Dev (SSE)`
              : isPolling
              ? `${onlineDevices} Dev (Sync)`
              : 'Reconnecting'}
          </span>
        ) : (
          <span className="text-[11px] flex items-center gap-1.5">
            {isWs ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Multi-Device Sync ({onlineDevices} Online)</span>
              </>
            ) : isSse ? (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>Live Stream Sync ({onlineDevices} Online)</span>
              </>
            ) : isPolling ? (
              <>
                <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                <span>Cellular Sync Active ({onlineDevices} Online)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Reconnecting Sync...</span>
              </>
            )}
          </span>
        )}
      </button>

      {/* Popover Details Sheet */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 text-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#B91C1C]" />
                <h4 className="font-extrabold text-xs text-slate-900">Multi-Device Sync Diagnostics</h4>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isWs
                    ? 'bg-emerald-100 text-emerald-800'
                    : isSse
                    ? 'bg-teal-100 text-teal-800'
                    : isPolling
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isWs ? 'WEBSOCKET' : isSse ? 'SERVER-SENT EVENTS' : isPolling ? 'CELLULAR POLLING' : 'RECONNECTING'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Connected Devices:</span>
                  <span className="font-black text-slate-900 font-mono">{onlineDevices} online</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Active Channel:</span>
                  <span className="font-bold text-slate-900 font-mono text-[10px]">
                    {isWs
                      ? 'WebSocket (wss://)'
                      : isSse
                      ? 'Server-Sent Events (/api/realtime/stream)'
                      : 'HTTP Real-Time Polling (/api/realtime/sync)'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Sync Latency:</span>
                  <span className="font-bold text-emerald-600 font-mono text-[10px]">
                    ~{latencyMs}ms
                  </span>
                </div>
              </div>

              {/* Troubleshooting explanation for mobile phone users */}
              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1 text-amber-800">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Why phones enter reconnecting stage:
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-amber-800/90 leading-tight">
                  <li><strong>Mobile screen sleep:</strong> Phone pauses background sockets when locked. Auto-resumes on wake.</li>
                  <li><strong>Cellular carrier firewalls:</strong> Some 4G/5G carriers block WSS upgrade; our HTTP cellular sync takes over automatically.</li>
                  <li><strong>Different URLs:</strong> Ensure both devices use the same app link.</li>
                </ul>
              </div>

              <div className="text-[11px] text-slate-600 space-y-1 pt-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Dual-channel redundancy: SOS & Incidents sync instantly across both phones.</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleManualReconnect}
                disabled={isReconnectingManual}
                className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#6C63FF] border border-indigo-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReconnectingManual ? 'animate-spin' : ''}`} />
                {isReconnectingManual ? 'Testing...' : 'Test Reconnect'}
              </button>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
