import React from 'react';
import { ShieldAlert, PhoneCall, Heart, Lock, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6C63FF] to-[#FF6584] flex items-center justify-center text-white font-bold shadow-lg">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                SafeGuard<span className="text-[#FF6584]">360</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering women through real-time incident reporting, instant GPS emergency SOS beacons, interactive location hotspot risk analytics, and coordinated dispatch.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <Lock className="w-3.5 h-3.5" />
              256-Bit Encrypted Data & Anonymous Reporting Enabled
            </div>
          </div>

          {/* Emergency Helplines */}
          <div className="space-y-4" id="emergency-contacts">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-[#FF6584]" />
              Emergency Helplines
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-slate-300 font-medium">National Emergency Number</span>
                <a href="tel:112" className="text-emerald-400 font-bold font-mono hover:underline">112</a>
              </li>
              <li className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-slate-300 font-medium">Women Helpline (24/7)</span>
                <a href="tel:1091" className="text-[#FF6584] font-bold font-mono hover:underline">1091</a>
              </li>
              <li className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-slate-300 font-medium">Cyber Crime Toll Free</span>
                <a href="tel:1930" className="text-indigo-400 font-bold font-mono hover:underline">1930</a>
              </li>
              <li className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-slate-300 font-medium">Childline Services</span>
                <a href="tel:1098" className="text-amber-400 font-bold font-mono hover:underline">1098</a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">System Modules</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-white transition-colors">Incident Reporting Portal</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Interactive Risk Hotspot Map</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Instant GPS SOS Transmitter</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Complaint Status Tracking</a></li>
              <li><a href="#safety-tips" className="hover:text-white transition-colors">Safety Tips & Best Practices</a></li>
            </ul>
          </div>

          {/* Location & Mission */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Our Mission</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Leveraging intelligent technology and community collaboration to build safer cities, faster emergency response networks, and accountable incident management for women everywhere.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Globe className="w-4 h-4 text-[#6C63FF]" />
              <span>Available Globally across Web & Mobile Browsers</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 SafeGuard360 Women Safety Alert & Incident Management System. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400">
            Designed with <Heart className="w-3.5 h-3.5 text-[#FF6584] fill-[#FF6584]" /> for Safety & Security.
          </div>
        </div>
      </div>
    </footer>
  );
};
