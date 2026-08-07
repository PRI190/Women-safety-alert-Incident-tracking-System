import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';
import { HotspotMap } from '../../components/map/HotspotMap';
import { SOSFloatingButton } from '../../components/common/SOSFloatingButton';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  MapPin,
  EyeOff,
  Bell,
  Clock,
  CheckCircle2,
  PhoneCall,
  UserCheck,
  Send,
  MessageSquare,
  Sparkles,
  Award,
  ChevronRight,
  Users,
  Activity,
  Heart
} from 'lucide-react';
import { motion } from 'motion/react';

export const LandingPage: React.FC = () => {
  const { user, demoLoginUser, demoLoginAdmin, showToast } = useAuth();
  const navigate = useNavigate();
  const [selectedTipCategory, setSelectedTipCategory] = useState<'travel' | 'cyber' | 'night' | 'workplace'>('travel');
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      showToast('Please fill all fields in the contact form', 'warning');
      return;
    }
    showToast('Thank you for contacting us! Our safety team will reach out shortly.', 'success');
    setContactForm({ name: '', email: '', message: '' });
  };

  const safetyTipsData = {
    travel: [
      'Share your live trip location with trusted emergency contacts when riding alone.',
      'Verify driver name, vehicle license plate, and photo before entering rideshares.',
      'Keep your smartphone charged with emergency SOS shortcuts enabled on lockscreen.',
      'Stay near driver/conductor in public transit during off-peak hours.'
    ],
    cyber: [
      'Enable multi-factor authentication (MFA) on all personal and social accounts.',
      'Never click suspicious links or share OTPs via SMS or direct messages.',
      'Block and report unsolicited messages immediately; take screenshot evidence.',
      'Keep social profile settings private and avoid broadcasting live location check-ins.'
    ],
    night: [
      'Stick to well-lit, populated main avenues rather than dark isolated alleyways.',
      'Keep one ear free when wearing headphones to remain aware of ambient surroundings.',
      'Walk with confidence and keep emergency helpline numbers on speed dial.',
      'If followed, head towards nearest open shop, station, or security post immediately.'
    ],
    workplace: [
      'Document any non-consensual behavior with timestamps and exact written detail.',
      'Know your internal POSH / HR grievance committee representatives and policies.',
      'Utilize late-night company cab escorts if working past evening shifts.',
      'Maintain clear physical boundaries and assert immediate vocal objection if breached.'
    ]
  };

  return (
    <div className="min-h-screen gradient-bg text-slate-800 flex flex-col font-sans selection:bg-[#6C63FF]/20 selection:text-[#6C63FF]">
      <Navbar />
      <SOSFloatingButton />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Soft Background Accents */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#6C63FF]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#FF6584]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 text-[#6C63FF] text-xs font-bold border border-indigo-200/60 shadow-xs">
                <Sparkles className="w-4 h-4 text-[#FF6584]" />
                Next-Gen AI & GIS Powered Women Safety Platform
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
                Empowering Women Through <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C63FF] via-[#8077ff] to-[#FF6584]">Smart Safety Solutions</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Report safety incidents anonymously, send instant GPS emergency SOS beacons to police and family, track complaint progress in real-time, and identify high-risk hotspot areas.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                {user ? (
                  <Link
                    to={user.role === 'admin' ? '/admin' : '/dashboard'}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#6C63FF] hover:bg-[#5950f0] text-white font-extrabold text-sm transition-all shadow-lg shadow-[#6C63FF]/30 flex items-center justify-center gap-2 group"
                  >
                    Go to Your Dashboard
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        demoLoginUser();
                        navigate('/dashboard/report');
                      }}
                      className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#6C63FF] to-[#8077ff] text-white font-extrabold text-sm transition-all shadow-lg shadow-[#6C63FF]/30 hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2 group"
                    >
                      Report Incident Now
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <Link
                      to="/register"
                      className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-sm border border-slate-200 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      Get Started Free
                    </Link>
                  </>
                )}
              </div>

              {/* Quick Demo Access Bar */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Instant Demo Roles:</span>
                <button
                  onClick={demoLoginUser}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#6C63FF] font-bold border border-indigo-200/80 transition-colors flex items-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Test User Mode
                </button>
                <button
                  onClick={demoLoginAdmin}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#FF6584] font-bold border border-rose-200/80 transition-colors flex items-center gap-1"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Test Admin Mode
                </button>
              </div>
            </div>

            {/* Right SaaS Visual Hero Illustration Graphic */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 shadow-2xl space-y-5">
                {/* Simulated Emergency Beacon Card */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/20 rounded-xl animate-pulse">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-extrabold tracking-wider opacity-90 block">Active Protection</span>
                      <h4 className="text-sm font-bold">1-Tap GPS Emergency SOS</h4>
                    </div>
                  </div>
                  <span className="text-xs bg-white text-red-600 font-bold px-2.5 py-1 rounded-full">ACTIVE</span>
                </div>

                {/* Simulated Live Incident Feed Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-[#6C63FF]" />
                      Live Incident Status
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Resolved
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug font-medium">
                    "Verbal Harassment at Metro Station North exit resolved by Patrol Unit 04."
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                    <span>Officer Sarah Assigned</span>
                    <span>12 mins ago</span>
                  </div>
                </div>

                {/* Simulated Risk Meter Card */}
                <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#6C63FF] uppercase tracking-wider block">Zone Risk Status</span>
                    <span className="text-xs font-bold text-slate-900">University West Campus Pass</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full">
                    SAFE ZONE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Statistics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-xl text-center">
            <div className="p-3">
              <div className="text-3xl md:text-4xl font-extrabold text-[#6C63FF] font-mono">1,000+</div>
              <div className="text-xs font-semibold text-slate-600 mt-1">Registered Users Protected</div>
            </div>
            <div className="p-3">
              <div className="text-3xl md:text-4xl font-extrabold text-[#FF6584] font-mono">500+</div>
              <div className="text-xs font-semibold text-slate-600 mt-1">Incidents Successfully Resolved</div>
            </div>
            <div className="p-3">
              <div className="text-3xl md:text-4xl font-extrabold text-emerald-600 font-mono">98%</div>
              <div className="text-xs font-semibold text-slate-600 mt-1">Emergency Response Dispatch Rate</div>
            </div>
            <div className="p-3">
              <div className="text-3xl md:text-4xl font-extrabold text-amber-500 font-mono">&lt; 3 mins</div>
              <div className="text-xs font-semibold text-slate-600 mt-1">Average SOS Response Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6C63FF] bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">
              Comprehensive Safety Architecture
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Built with security, speed, and clean user experience at the forefront.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-[#6C63FF]/50 transition-all shadow-xs hover:shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Instant Floating SOS Beacon</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                One-tap GPS coordinates broadcast with live audible siren and automated notification to nearby police patrols and registered family contacts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-[#6C63FF]/50 transition-all shadow-xs hover:shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-[#6C63FF] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Interactive Risk Hotspot Map</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Color-coded GIS map displaying Green (Safe), Yellow (Moderate), and Red (Danger) zones based on real incident reports and safety tips.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-[#6C63FF]/50 transition-all shadow-xs hover:shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-[#FF6584] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <EyeOff className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Anonymous Incident Reporting</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Report harassment, stalking, theft, or cyber crime confidentially with photo evidence, exact dates, times, and map location picker.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-[#6C63FF]/50 transition-all shadow-xs hover:shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Real-time Complaint Tracking</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track status updates from Pending to Under Review, Officer Assignment, and Resolution with transparent audit notes.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-[#6C63FF]/50 transition-all shadow-xs hover:shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Centralized Admin Command</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Administrator panel with officer assignment capabilities, analytical risk breakdown charts, and immediate emergency dispatch controls.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-[#6C63FF]/50 transition-all shadow-xs hover:shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-[#6C63FF]/10 text-[#6C63FF] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">24/7 Helpline & Emergency Contacts</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct speed dials to 112 National Emergency, 1091 Women Helpline, 1930 Cyber Cell, plus personal primary family contact manager.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-[#F8F9FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6584] bg-pink-50 px-3 py-1 rounded-full border border-pink-100">
              Simple 3-Step Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">
              How SafeGuard360 Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl text-center space-y-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-[#6C63FF] text-white font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-[#6C63FF]/30">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900">Trigger SOS or Report</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                In an emergency, click the red floating SOS button or quickly file a detailed report with category, photo, and exact location.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl text-center space-y-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-[#FF6584] text-white font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-[#FF6584]/30">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900">Admin & Police Dispatch</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The centralized command center receives the high-priority beacon, alerts emergency contacts via SMS, and assigns nearby officers.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl text-center space-y-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900">Track & Resolve</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive status notifications as officer arrives, action is taken, and case is formally resolved with verified security notes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Embedded Live Hotspot Map Preview */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <HotspotMap />
        </div>
      </section>

      {/* Safety Tips Section */}
      <section id="safety-tips" className="py-20 bg-[#F8F9FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6C63FF] bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Proactive Knowledge
            </span>
            <h2 className="text-3xl font-black text-slate-900 mt-3">Essential Safety Tips & Best Practices</h2>
          </div>

          {/* Category Tabs */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {[
              { id: 'travel', label: 'Travel & Commute' },
              { id: 'cyber', label: 'Cyber Safety' },
              { id: 'night', label: 'Night Walking' },
              { id: 'workplace', label: 'Workplace Protocol' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTipCategory(tab.id as any)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  selectedTipCategory === tab.id
                    ? 'bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/25'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tips List */}
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-4">
            {safetyTipsData[selectedTipCategory].map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-[#6C63FF] shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900">Get in Touch with Safety Command</h2>
            <p className="text-xs text-slate-500 mt-2">Have questions or need assistance? Reach out to our 24/7 team.</p>
          </div>

          <form onSubmit={handleContactSubmit} className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-4 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message / Inquiry</label>
              <textarea
                rows={4}
                required
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                placeholder="How can our safety team assist you?"
                className="w-full px-4 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-[#6C63FF] hover:bg-[#584ff0] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Send Safety Inquiry
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
};
