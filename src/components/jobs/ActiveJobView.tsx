import React, { useState, useEffect } from 'react';
import { usePartner } from '../../context/PartnerContext';
import {
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Plus,
  FileText,
  Loader2,
  Check,
  X
} from 'lucide-react';
import { locationService } from '../../services/locationService';
import { DEFAULT_DOORBLY_SERVICES } from '../../services/catalogueService';

export const ActiveJobView: React.FC = () => {
  const { activeJob, updateActiveJobStatus, setActiveTab } = usePartner();

  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live timer for IN_PROGRESS
  useEffect(() => {
    if (!activeJob || activeJob.status !== 'IN_PROGRESS') return;

    const startTime = activeJob.started_at
      ? new Date(activeJob.started_at).getTime()
      : Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startTime) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeJob]);

  if (!activeJob) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Clock className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-slate-800 text-base">No Active Job</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          When you accept a service request, your active doorstep journey will appear here.
        </p>
        <button
          onClick={() => setActiveTab('home')}
          className="mt-4 px-4 py-2 bg-[#0F766E] text-white rounded-xl text-xs font-bold"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    if (hrs > 0) {
      return `${hrs}h ${m < 10 ? '0' : ''}${m}m ${s < 10 ? '0' : ''}${s}s`;
    }
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const navigationUrl = locationService.getBookingNavigationUrl(activeJob);
  const customerLat = activeJob.customer_latitude ?? activeJob.latitude;
  const customerLng = activeJob.customer_longitude ?? activeJob.longitude;
  const hasCoordinates =
    typeof customerLat === 'number' &&
    typeof customerLng === 'number' &&
    Number.isFinite(customerLat) &&
    Number.isFinite(customerLng) &&
    (customerLat !== 0 || customerLng !== 0);

  // Deterministic seed from coordinates for simplified SVG street layout
  const latSeed = hasCoordinates ? Math.abs(Math.round(customerLat * 1000)) % 40 : 18;
  const lngSeed = hasCoordinates ? Math.abs(Math.round(customerLng * 1000)) % 40 : 24;

  const handleNavigate = () => {
    locationService.captureAndOpenGoogleMaps(activeJob);
  };

  const handleCall = () => {
    window.location.href = `tel:${activeJob.customer_phone}`;
  };

  const handleMessage = () => {
    window.location.href = `sms:${activeJob.customer_phone}?body=Hello, this is your Doorbly Partner for booking #${activeJob.id.substring(0, 8)}.`;
  };

  const handleArrived = async () => {
    setIsProcessing(true);
    try {
      await updateActiveJobStatus('ARRIVED');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 4) {
      setOtpError('Please enter the 4-digit start OTP provided by the customer.');
      return;
    }

    // Verify OTP against booking's otp_code or fallback
    if (activeJob.otp_code && otpInput.trim() !== activeJob.otp_code) {
      setOtpError(`Incorrect OTP. Please ask customer for correct 4-digit code.`);
      return;
    }

    setIsProcessing(true);
    try {
      const ok = await updateActiveJobStatus('IN_PROGRESS', { otp: otpInput.trim() });
      if (ok) {
        setShowOtpModal(false);
        setOtpError('');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteServiceSubmit = async () => {
    setIsProcessing(true);
    try {
      const ok = await updateActiveJobStatus('COMPLETED', {
        notes: newNote ? `Completion note: ${newNote}` : undefined
      });
      if (ok) {
        setShowCompleteModal(false);
        setActiveTab('wallet');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsProcessing(true);
    try {
      await updateActiveJobStatus(activeJob.status, { notes: newNote.trim() });
      setNewNote('');
      setShowNoteModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner Status */}
      <div className="bg-[#0F766E] text-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between text-xs text-teal-100 font-semibold mb-1">
          <span className="uppercase tracking-wider">ACTIVE SERVICE STEP</span>
          <span className="font-mono">#{activeJob.id.substring(0, 8)}</span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div>
            <h2 className="text-xl font-black text-white">
              {activeJob.status === 'ASSIGNED' && 'En Route to Doorstep'}
              {activeJob.status === 'ARRIVED' && 'Arrived at Location'}
              {activeJob.status === 'IN_PROGRESS' && 'Service in Progress'}
            </h2>
            <p className="text-xs text-teal-100 mt-0.5">
              {activeJob.status === 'ASSIGNED' && 'Head toward the customer location & tap arrived.'}
              {activeJob.status === 'ARRIVED' && 'Ask customer for Start OTP to commence work.'}
              {activeJob.status === 'IN_PROGRESS' && `Service timer: ${formatTimer(elapsedSeconds)}`}
            </p>
          </div>

          {activeJob.status === 'IN_PROGRESS' && (
            <div className="bg-black/30 backdrop-blur-xs px-3 py-1.5 rounded-xl font-mono text-sm font-bold text-amber-300">
              {formatTimer(elapsedSeconds)}
            </div>
          )}
        </div>
      </div>

      {/* Service Booking Order Card (Light Blue) */}
      <div className="bg-gradient-to-br from-sky-50 via-sky-100/85 to-sky-50 rounded-2xl p-4 border border-sky-200 shadow-xs space-y-3">
        <div className="flex items-start justify-between border-b border-sky-200/80 pb-2.5">
          <div>
            <div className="text-sky-900 uppercase tracking-wider text-[11px]">
              Service Booking Order #{activeJob.id.substring(0, 8)}
            </div>
            <div className="text-sm text-slate-900 mt-0.5">
              {activeJob.service_name}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCall}
              aria-label="Call Customer"
              className="p-2.5 rounded-xl bg-white text-[#0F766E] border border-sky-200 hover:bg-sky-100 active:scale-95 transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={handleMessage}
              aria-label="Message Customer"
              className="p-2.5 rounded-xl bg-white text-slate-700 border border-sky-200 hover:bg-sky-100 active:scale-95 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Required Fields: Booking Amount, Work Details, Customer Name, Contact Number, GPS Location */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Booking Amount:</span>
            <span className="text-slate-900 text-sm">
              ₹{activeJob.customer_price}{' '}
              <span className="text-[11px] text-[#0F766E]">(Earning: ₹{activeJob.partner_earning})</span>
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-600 shrink-0">Work Details:</span>
            <span className="text-slate-900 text-right">
              {activeJob.service_name}
              {activeJob.service_description
                ? ` — ${activeJob.service_description}`
                : ` (${activeJob.service_category})`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600">Customer Name:</span>
            <span className="text-slate-900">{activeJob.customer_name}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600">Contact Number:</span>
            <span className="text-slate-900 font-mono">{activeJob.customer_phone}</span>
          </div>
        </div>

        {/* GPS Location & Direct Google Maps Navigation */}
        <div className="pt-2.5 border-t border-sky-200/80 space-y-3">
          <div className="text-xs text-slate-700">
            <div className="text-sky-800 text-[11px]">📍 GPS Location</div>
            <p className="text-slate-900 text-sm leading-snug mt-0.5">
              {locationService.getBookingGpsLocationText(activeJob)}
            </p>
            {activeJob.distance_km && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                Approx {activeJob.distance_km} km away
              </p>
            )}
          </div>

          {/* Static SVG Map Preview (Zero external APIs or SDKs) */}
          <a
            href={navigationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleNavigate}
            aria-label="Open customer location in Google Maps"
            className="block relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group"
          >
            <svg
              viewBox="0 0 400 160"
              className="w-full h-full object-cover"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Simplified static map preview of customer coordinates"
            >
              {/* Base Map Land Background */}
              <rect width="400" height="160" fill="#F1F5F9" />

              {/* Green Park / Sector Zones */}
              <rect x={12 + (latSeed % 20)} y="10" width="85" height="52" rx="8" fill="#DCFCE7" opacity="0.75" />
              <rect x={270 - (lngSeed % 25)} y="92" width="110" height="56" rx="8" fill="#DCFCE7" opacity="0.7" />
              <rect x="145" y="18" width="75" height="40" rx="6" fill="#E2E8F0" opacity="0.8" />
              <rect x="40" y="96" width="95" height="48" rx="6" fill="#E2E8F0" opacity="0.8" />

              {/* Water Canal / River Accent */}
              <path
                d={`M 0 ${135 - (latSeed % 15)} Q 140 ${110 + (lngSeed % 15)}, 260 145 T 400 125`}
                fill="none"
                stroke="#BAE6FD"
                strokeWidth="12"
                strokeLinecap="round"
              />

              {/* Minor Local Grid Streets */}
              <g stroke="#FFFFFF" strokeWidth="4">
                <line x1="0" y1={38 + (latSeed % 10)} x2="400" y2={38 + (latSeed % 10)} />
                <line x1="0" y1={115 - (lngSeed % 10)} x2="400" y2={115 - (lngSeed % 10)} />
                <line x1={75 + (latSeed % 15)} y1="0" x2={75 + (latSeed % 15)} y2="160" />
                <line x1={165 + (lngSeed % 15)} y1="0" x2={165 + (lngSeed % 15)} y2="160" />
                <line x1={315 - (latSeed % 15)} y1="0" x2={315 - (latSeed % 15)} y2="160" />
              </g>

              {/* Major Arterial Roads */}
              <path
                d={`M 0 ${78 + (latSeed % 12)} L 400 ${72 - (lngSeed % 12)}`}
                stroke="#FDE68A"
                strokeWidth="7"
              />
              <path
                d={`M ${235 + (lngSeed % 14)} 0 L ${215 - (latSeed % 14)} 160`}
                stroke="#FFFFFF"
                strokeWidth="6"
              />

              {/* Dashed Navigation Route Path from Partner to Customer */}
              <path
                d={`M 68 122 Q 145 ${78 + (latSeed % 12)}, 225 ${75 - (lngSeed % 8)} T 292 54`}
                fill="none"
                stroke="#0F766E"
                strokeWidth="3.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />

              {/* Partner Starting Point Dot */}
              <circle cx="68" cy="122" r="6" fill="#0F766E" stroke="#FFFFFF" strokeWidth="2" />

              {/* Customer Destination Pulse & Pin */}
              <circle cx="292" cy="54" r="16" fill="#0F766E" opacity="0.18" />
              <circle cx="292" cy="54" r="8" fill="#0F766E" stroke="#FFFFFF" strokeWidth="2.5" />
              <circle cx="292" cy="54" r="3" fill="#FFFFFF" />
            </svg>

            {/* Top-Left Live Coordinate Badge */}
            <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200/90 text-[10px] font-mono text-slate-700 shadow-2xs">
              {hasCoordinates
                ? `${customerLat.toFixed(4)}° N, ${customerLng.toFixed(4)}° E`
                : 'Saved Address Destination'}
            </div>

            {/* Bottom-Right Map Preview Hint */}
            <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1 group-hover:bg-[#0F766E] transition-colors">
              <MapPin className="w-3 h-3 text-teal-300" />
              <span>Tap to open Google Maps</span>
            </div>
          </a>

          <a
            href={navigationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              const lat = activeJob.customer_latitude ?? activeJob.latitude;
              const lng = activeJob.customer_longitude ?? activeJob.longitude;
              const addr = activeJob.customer_address || activeJob.customer_location_address || '';
              const captured = lat && lng ? `${lat},${lng}` : addr;
              if (captured && navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(captured).catch(() => {});
              }
            }}
            className="w-full py-3 px-4 bg-[#0F766E] hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <span>🗺 Go to Location</span>
          </a>
        </div>
      </div>

      {/* Booked Service & Earnings Details */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Service Booked
          </span>
          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
            {activeJob.service_category}
          </span>
        </div>

        <div>
          <h4 className="font-extrabold text-slate-900 text-base">
            {activeJob.service_name}
          </h4>
          {activeJob.service_description && (
            <p className="text-xs text-slate-500 mt-1">
              {activeJob.service_description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl">
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">
              Estimated Duration
            </span>
            <span className="font-bold text-slate-800">
              {activeJob.estimated_duration || '1 Hour'}
            </span>
          </div>

          <div className="bg-teal-50/70 p-2.5 rounded-xl">
            <span className="text-[10px] uppercase text-teal-700 font-semibold block">
              Your Earning
            </span>
            <span className="font-extrabold text-base text-slate-900 flex items-baseline">
              <span className="text-xs mr-0.5 font-bold">₹</span>
              {activeJob.partner_earning}
            </span>
          </div>
        </div>
      </div>

      {/* Work Notes / Action Log if available */}
      {activeJob.work_notes && activeJob.work_notes.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
            Work Notes Log
          </h4>
          <div className="space-y-1.5 text-xs text-slate-700">
            {activeJob.work_notes.map((note, idx) => (
              <div key={idx} className="p-2 bg-slate-50 rounded-lg flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In-Progress Quick Tool Buttons */}
      {activeJob.status === 'IN_PROGRESS' && (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setShowNoteModal(true)}
            className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex flex-col items-center justify-center gap-1 transition-colors"
          >
            <FileText className="w-4 h-4 text-teal-700" />
            <span>Add Note</span>
          </button>

          <button
            onClick={() => setShowAddServiceModal(true)}
            className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex flex-col items-center justify-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4 text-teal-700" />
            <span>Add Service</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex flex-col items-center justify-center gap-1 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Report Issue</span>
          </button>
        </div>
      )}

      {/* Primary Lifecycle Step Action Button */}
      <div className="sticky bottom-16 z-20 pt-2">
        {activeJob.status === 'ASSIGNED' && (
          <button
            onClick={handleArrived}
            disabled={isProcessing}
            className="w-full py-4 px-6 bg-[#0F766E] hover:bg-teal-700 active:bg-teal-800 text-white font-extrabold text-base rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <MapPin className="w-5 h-5 text-amber-300" />
                <span>I'VE ARRIVED AT DOORSTEP</span>
              </>
            )}
          </button>
        )}

        {activeJob.status === 'ARRIVED' && (
          <button
            onClick={() => {
              setOtpInput(activeJob.otp_code || '');
              setShowOtpModal(true);
            }}
            disabled={isProcessing}
            className="w-full py-4 px-6 bg-[#0F766E] hover:bg-teal-700 active:bg-teal-800 text-white font-extrabold text-base rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <ShieldCheck className="w-5 h-5 text-amber-300" />
            <span>ENTER CUSTOMER OTP & START</span>
          </button>
        )}

        {activeJob.status === 'IN_PROGRESS' && (
          <button
            onClick={() => setShowCompleteModal(true)}
            disabled={isProcessing}
            className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-base rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>COMPLETE SERVICE (₹{activeJob.partner_earning})</span>
          </button>
        )}
      </div>

      {/* Customer OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-slate-900">
                Customer Start PIN
              </h3>
              <button
                onClick={() => setShowOtpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Ask the customer for the 4-digit verification code shown on their Doorbly app.
            </p>

            <form onSubmit={handleStartServiceSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={4}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • •"
                  className="w-full text-center text-3xl font-mono tracking-widest py-3 border-2 border-slate-300 rounded-2xl focus:border-[#0F766E] focus:outline-hidden font-bold"
                  autoFocus
                />
                {otpError && (
                  <p className="text-xs text-rose-600 mt-1.5 font-medium">{otpError}</p>
                )}
                {activeJob.otp_code && (
                  <p className="text-[11px] text-teal-700 bg-teal-50 p-2 rounded-lg mt-2 font-mono">
                    Customer OTP is: <strong>{activeJob.otp_code}</strong>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 py-3 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || otpInput.length < 4}
                  className="flex-1 py-3 bg-[#0F766E] hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
                >
                  {isProcessing ? 'Verifying...' : 'Start Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-slate-900">
                Complete Service
              </h3>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-900 font-semibold">
                <span>Partner Earning Credited</span>
                <span className="text-base font-extrabold text-emerald-900">₹{activeJob.partner_earning}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-emerald-700">
                <span>Customer Amount</span>
                <span>₹{activeJob.customer_price}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Optional Completion Note / Remarks
              </label>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Work done properly, customer satisfied..."
                rows={2}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 py-3 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteServiceSubmit}
                disabled={isProcessing}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Confirm Complete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add Work Note</h3>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="e.g. Copper pipe cleaned, gas pressure tested at 130 PSI"
              rows={3}
              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNoteModal(false)}
                className="flex-1 py-2.5 text-xs text-slate-600 border border-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || isProcessing}
                className="flex-1 py-2.5 text-xs bg-[#0F766E] text-white font-bold rounded-xl disabled:opacity-50"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Additional Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                Catalogue Add-on Services
              </h3>
              <button
                onClick={() => setShowAddServiceModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Only standard Doorbly catalogue services may be added with customer agreement:
            </p>
            <div className="max-h-60 overflow-y-auto space-y-2 divide-y divide-slate-100">
              {DEFAULT_DOORBLY_SERVICES.slice(0, 5).map((srv) => (
                <div key={srv.id} className="pt-2 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{srv.name}</div>
                    <div className="text-slate-500 text-[11px]">Price: ₹{srv.base_customer_price} · Earn: ₹{srv.base_partner_earning}</div>
                  </div>
                  <button
                    onClick={async () => {
                      await updateActiveJobStatus(activeJob.status, {
                        notes: `Add-on service added: ${srv.name} (₹${srv.base_customer_price})`
                      });
                      setShowAddServiceModal(false);
                    }}
                    className="py-1 px-2.5 bg-teal-50 text-[#0F766E] font-bold rounded-lg text-xs hover:bg-teal-100 cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
