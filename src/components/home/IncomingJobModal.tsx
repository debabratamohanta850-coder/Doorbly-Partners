import React, { useState } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { Clock, Loader2, Sparkles, X } from 'lucide-react';

export const IncomingJobModal: React.FC = () => {
  const { incomingRequest, acceptIncomingJob, rejectIncomingJob } = usePartner();
  const [isAccepting, setIsAccepting] = useState(false);

  if (!incomingRequest) return null;

  const { booking, expires_in_seconds } = incomingRequest;
  const progressPercent = Math.max(0, Math.min(100, (expires_in_seconds / 25) * 100));

  const handleAccept = async () => {
    if (isAccepting) return;
    setIsAccepting(true);
    try {
      await acceptIncomingJob();
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-teal-500/30 flex flex-col">
        {/* Countdown Header Bar */}
        <div className="bg-[#0F766E] text-white p-4 safe-top relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-black tracking-widest uppercase text-teal-100">
                NEW SERVICE REQUEST
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-black/25 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold text-amber-300">
              <Clock className="w-3.5 h-3.5" />
              <span>{expires_in_seconds}s</span>
            </div>
          </div>

          {/* Linear Progress Bar for Expiry */}
          <div className="w-full bg-teal-900/60 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <button
            onClick={rejectIncomingJob}
            aria-label="Dismiss"
            className="absolute top-3 right-3 text-teal-200 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Light Blue Service Booking Order Card */}
          <div className="bg-gradient-to-br from-sky-50 via-sky-100/85 to-sky-50 border border-sky-200 rounded-2xl p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-sky-200/80 pb-2">
              <span className="text-sky-900 uppercase tracking-wider text-[11px]">
                Service Booking Order #{booking.id.substring(0, 8)}
              </span>
              <span className="text-[11px] text-sky-800">
                {booking.distance_km ? `${booking.distance_km} km away` : 'Nearby'}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Booking Amount:</span>
                <span className="text-slate-900 text-sm">
                  ₹{booking.customer_price}{' '}
                  <span className="text-[11px] text-[#0F766E]">(Your Earning: ₹{booking.partner_earning})</span>
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-600 shrink-0">Work Details:</span>
                <span className="text-slate-900 text-right">
                  {booking.service_name}
                  {booking.service_description
                    ? ` — ${booking.service_description}`
                    : ` (${booking.service_category})`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Customer Name:</span>
                <span className="text-slate-900">{booking.customer_name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Contact Number:</span>
                <span className="text-slate-900 font-mono">{booking.customer_phone}</span>
              </div>

              <div className="pt-2 border-t border-sky-200/80">
                <div className="text-sky-800 text-[11px]">📍 GPS Location</div>
                <div className="text-slate-900 text-xs mt-0.5">
                  {booking.customer_address || booking.customer_location_address}
                  {(booking.customer_latitude ?? booking.latitude)
                    ? ` (${(booking.customer_latitude ?? booking.latitude).toFixed(4)}, ${(booking.customer_longitude ?? booking.longitude).toFixed(4)})`
                    : ''}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-sky-200/80">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${
                  booking.customer_latitude ?? booking.latitude
                    ? `${booking.customer_latitude ?? booking.latitude},${booking.customer_longitude ?? booking.longitude}`
                    : encodeURIComponent(booking.customer_address || booking.customer_location_address || '')
                }`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  const lat = booking.customer_latitude ?? booking.latitude;
                  const lng = booking.customer_longitude ?? booking.longitude;
                  const addr = booking.customer_address || booking.customer_location_address || '';
                  const captured = lat && lng ? `${lat},${lng}` : addr;
                  if (captured && navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(captured).catch(() => {});
                  }
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#0F766E] hover:bg-teal-700 text-white text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>🗺 Go to Location</span>
              </a>
            </div>
          </div>

          {/* Large Action Buttons */}
          <div className="pt-2 flex items-center gap-3 safe-bottom">
            <button
              onClick={rejectIncomingJob}
              disabled={isAccepting}
              className="py-3.5 px-5 rounded-2xl border-2 border-slate-300 text-slate-700 hover:bg-slate-100 active:bg-slate-200 font-bold text-sm transition-colors"
            >
              REJECT
            </button>

            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-[#0F766E] hover:bg-teal-700 active:bg-teal-800 text-white font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-teal-900/20 active:scale-98 transition-all"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>ACCEPTING...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>ACCEPT JOB (₹{booking.partner_earning})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
