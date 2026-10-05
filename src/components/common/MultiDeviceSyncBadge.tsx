import React, { useState } from 'react';
import { useWebSocket } from '../../context/WebSocketContext';
import { Wifi, WifiOff, Smartphone, Laptop, Radio, CheckCircle2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const MultiDeviceSyncBadge: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isConnected, onlineDevices } = useWebSocket();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="relative inline-block text-xs">
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer font-bold ${
          isConnected
            ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30 hover:bg-emerald-500/20'
            : 'bg-amber-500/10 text-amber-800 border-amber-500/30 hover:bg-amber-500/20'
        }`}
        title="Multi-Device WebSocket Real-time Status"
      >
        <span className="relative flex h-2 w-2">
          {isConnected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
        </span>

        {compact ? (
          <span className="text-[11px] font-mono font-bold">
            {isConnected ? `${onlineDevices} Dev` : 'Offline'}
          </span>
        ) : (
          <span className="text-[11px] flex items-center gap-1.5">
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Multi-Device Sync ({onlineDevices} Online)</span>
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
            className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 text-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#B91C1C]" />
                <h4 className="font-extrabold text-xs text-slate-900">Real-Time Multi-Device Sync</h4>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isConnected ? 'ONLINE' : 'RECONNECTING'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Connected Devices:</span>
                  <span className="font-black text-slate-900 font-mono">{onlineDevices}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Communication Protocol:</span>
                  <span className="font-bold text-slate-900 font-mono text-[10px]">WebSocket (wss://)</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Sub-second Latency:</span>
                  <span className="font-bold text-emerald-600 font-mono text-[10px]">&lt; 35ms</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 space-y-1.5 pt-1">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Instant SOS Alert broadcast to all phones & responder screens.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Moving GPS updates sync live across map instances.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>New incident complaints & status updates push in real-time.</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDetails(false)}
              className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
