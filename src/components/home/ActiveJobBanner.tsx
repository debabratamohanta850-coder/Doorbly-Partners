import React, { useState } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { ChevronRight, Phone, MapPin } from 'lucide-react';
import { locationService } from '../../services/locationService';

export const ActiveJobBanner: React.FC = () => {
  const { activeJob, setActiveTab } = usePartner();
  const [capturedToast, setCapturedToast] = useState(false);

  if (!activeJob) return null;

  const navigationUrl = locationService.getBookingNavigationUrl(activeJob);
  const gpsLocationText = locationService.getBookingGpsLocationText(activeJob);

  const handleGoToLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    const lat = activeJob.customer_latitude ?? activeJob.latitude;
    const lng = activeJob.customer_longitude ?? activeJob.longitude;
    const addr = activeJob.customer_address || activeJob.customer_location_address || '';
    const captured = lat && lng ? `${lat},${lng}` : addr;
    if (captured && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(captured).catch(() => {});
    }
    setCapturedToast(true);
    setTimeout(() => setCapturedToast(false), 2500);
  };

  const handleCallCustomer = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${activeJob.customer_phone}`;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ASSIGNED':
        return 'On The Way to Customer';
      case 'ARRIVED':
        return 'Arrived at Doorstep';
      case 'IN_PROGRESS':
        return 'Service In Progress';
      default:
        return status;
    }
  };

  return (
    <div
      onClick={() => setActiveTab('jobs')}
      className="bg-gradient-to-br from-sky-50 via-sky-100/85 to-sky-50 text-slate-900 rounded-2xl p-4 shadow-xs border border-sky-200 cursor-pointer relative overflow-hidden group font-normal space-y-2.5"
    >
      {/* Top Status & Order Header */}
      <div className="flex items-center justify-between border-b border-sky-200/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs uppercase tracking-wider text-sky-900">
            Service Booking Order #{activeJob.id.substring(0, 8)} · {getStatusText(activeJob.status)}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-sky-700 shrink-0 group-hover:translate-x-1 transition-transform" />
      </div>

      {/* Required Order Details: Booking Amount, Work Details, Customer Name, Contact Number, GPS Location */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Booking Amount:</span>
          <span className="text-slate-900 text-sm">
            ₹{activeJob.customer_price}{' '}
            <span className="text-[11px] text-[#0F766E]">(Your Earning: ₹{activeJob.partner_earning})</span>
          </span>
        </div>

        <div className="flex items-start justify-between gap-2">
          <span className="text-slate-600 shrink-0">Work Details:</span>
          <span className="text-slate-900 text-right">
            {activeJob.service_name}
            {activeJob.service_description ? ` — ${activeJob.service_description}` : ` (${activeJob.service_category})`}
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

        <div className="pt-1 border-t border-sky-200/60">
          <div className="text-[11px] text-sky-800 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>GPS Location:</span>
          </div>
          <div className="text-xs text-slate-900 mt-0.5">{gpsLocationText}</div>
        </div>
      </div>

      {capturedToast && (
        <div className="text-[11px] text-[#0F766E] bg-white/90 px-2.5 py-1 rounded-lg border border-sky-200">
          GPS location captured &amp; auto-pasted into Google Maps!
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 border-t border-sky-200/80 flex items-center justify-between gap-2">
        <a
          href={navigationUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleGoToLocation}
          className="flex-1 py-2.5 px-3 bg-[#0F766E] hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>🗺 Go to Location</span>
        </a>

        <button
          onClick={handleCallCustomer}
          className="py-2.5 px-3 bg-white hover:bg-sky-100 text-slate-800 border border-sky-200 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Phone className="w-3.5 h-3.5 text-[#0F766E]" />
          <span>Call</span>
        </button>
      </div>
    </div>
  );
};
