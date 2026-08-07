import React, { useState, useEffect } from 'react';
import { Play, Square, Volume2, Mic, CheckCircle } from 'lucide-react';

interface AudioVoicePlayerProps {
  transcript: string;
  title?: string;
  compact?: boolean;
}

export const AudioVoicePlayer: React.FC<AudioVoicePlayerProps> = ({
  transcript,
  title = 'Automated Voice Recording',
  compact = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSpeechSupported(false);
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech audio playback not supported in this browser environment.');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(transcript);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={handlePlayPause}
          className={`p-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
            isPlaying
              ? 'bg-[#B91C1C] text-white animate-pulse'
              : 'bg-white text-slate-800 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-[#B91C1C]" />}
          <span>{isPlaying ? 'Stop Recording' : 'Listen Recording'}</span>
        </button>
        {isPlaying && (
          <div className="flex items-center gap-1 text-[10px] text-red-600 font-mono animate-pulse">
            <Volume2 className="w-3 h-3" /> Playing Voice Broadcast...
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50/80 via-slate-50 to-red-50/50 border border-red-200/80 space-y-3">
      <div className="flex items-center justify-between border-b border-red-100/80 pb-2">
        <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
          <Mic className="w-4 h-4 text-[#B91C1C]" />
          <span>{title}</span>
        </div>
        <span className="text-[10px] bg-red-100 text-[#B91C1C] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Voice Broadcast Ready
        </span>
      </div>

      <p className="text-xs text-slate-600 italic bg-white p-3 rounded-xl border border-slate-200/80 leading-relaxed">
        "{transcript}"
      </p>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handlePlayPause}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
            isPlaying
              ? 'bg-[#B91C1C] text-white hover:bg-red-800 animate-pulse'
              : 'bg-slate-900 text-white hover:bg-black'
          }`}
        >
          {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 text-red-400" />}
          <span>{isPlaying ? 'Stop Voice Broadcast' : 'Listen Automated Recording'}</span>
        </button>

        {isPlaying && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold animate-pulse">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span>Audio Dispatch Active</span>
          </div>
        )}
      </div>
    </div>
  );
};
