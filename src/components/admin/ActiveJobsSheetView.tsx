import React, { useState } from 'react';
import { ServiceBooking, PartnerProfile } from '../../types';
import { supabaseService } from '../../services/supabaseClient';
import { Briefcase, Search, RefreshCw, Table, ArrowLeft } from 'lucide-react';

interface ActiveJobsSheetViewProps {
  bookings: ServiceBooking[];
  partners: PartnerProfile[];
  onRefresh: () => Promise<void> | void;
  onBackToOverview: () => void;
}

export const ActiveJobsSheetView: React.FC<ActiveJobsSheetViewProps> = ({
  bookings: initialBookings,
  partners,
  onRefresh,
  onBackToOverview
}) => {
  const [liveBookings, setLiveBookings] = useState<ServiceBooking[]>(initialBookings);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Manual synchronization ONLY when clicking the Synchronise button
  const handleManualSynchronise = async () => {
    setIsSyncing(true);
    try {
      const latestBookings = await supabaseService.getAllBookings(true);
      setLiveBookings(latestBookings);
      await onRefresh();
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter Active Jobs (ASSIGNED, ARRIVED, IN_PROGRESS, SEARCHING_PARTNER, REQUEST_SENT)
  const activeJobs = liveBookings.filter((b) =>
    ['ASSIGNED', 'ARRIVED', 'IN_PROGRESS', 'SEARCHING_PARTNER', 'REQUEST_SENT'].includes(b.status)
  );

  const getPartnerDetails = (partnerId?: string) => {
    if (!partnerId) return { name: 'Searching Partner...', mobile: '—' };
    const found = partners.find((p) => p.id === partnerId);
    return found
      ? { name: found.name, mobile: found.mobile }
      : { name: `ID: ${partnerId.substring(0, 8)}`, mobile: '—' };
  };

  const filteredList = activeJobs.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const partnerInfo = getPartnerDetails(b.assigned_partner_id);
    const locationStr = b.customer_address || b.customer_location_address || '';

    return (
      b.id.toLowerCase().includes(q) ||
      b.customer_name.toLowerCase().includes(q) ||
      b.customer_phone.toLowerCase().includes(q) ||
      b.service_name.toLowerCase().includes(q) ||
      b.service_category.toLowerCase().includes(q) ||
      locationStr.toLowerCase().includes(q) ||
      partnerInfo.name.toLowerCase().includes(q) ||
      b.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 text-xs">
      {/* Light Card Header */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-900 shadow-xs">
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            onClick={onBackToOverview}
            className="p-2 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition-colors cursor-pointer shrink-0 mt-0.5"
            title="Back to Overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-700" />
              <h2 className="font-extrabold text-base text-slate-900">
                Active Jobs Excel Sheet ({activeJobs.length})
              </h2>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Static display records sheet · Click Synchronise to fetch latest records from Supabase (<code className="font-mono">doorbly_service_bookings</code>).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualSynchronise}
          disabled={isSyncing}
          className="py-2 px-3 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Synchronising...' : 'Synchronise'}</span>
        </button>
      </div>

      {/* Light Excel Sheet Card Container */}
      <div className="bg-[#F8FAFC] border-2 border-emerald-200 rounded-2xl overflow-hidden shadow-md text-slate-900">
        {/* Excel Toolbar & Search Bar */}
        <div className="bg-emerald-100/80 border-b border-emerald-200 p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-700 text-white font-extrabold text-[11px]">
              <Table className="w-3.5 h-3.5" />
              <span>ACTIVE JOBS SHEET</span>
            </span>
            <span className="text-xs font-bold text-emerald-950">
              In Progress / Live Bookings: {activeJobs.length}
            </span>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search booking ID, customer, service, provider..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-slate-900 text-xs focus:outline-hidden focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Horizontal Excel Spreadsheet Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-emerald-100/90 text-slate-900 border-b-2 border-slate-300 font-extrabold whitespace-nowrap">
                <th className="py-2.5 px-3 border-r border-slate-300 text-center w-12">S.No</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Booking ID</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Customer Name</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Contact No</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Service / Work Details</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Category</th>
                <th className="py-2.5 px-3 border-r border-slate-300">GPS Location / Address</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Assigned Provider</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-right">Booking Amt</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-right">Partner Earn</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-center">OTP</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {filteredList.length === 0 ? (
                <tr className="bg-emerald-50/40">
                  <td
                    colSpan={12}
                    className="py-8 px-4 text-center text-slate-600 font-medium"
                  >
                    No active jobs currently in progress. Dispatched or accepted bookings from Supabase will appear here in horizontal rows automatically.
                  </td>
                </tr>
              ) : (
                filteredList.map((b, idx) => {
                  const partnerInfo = getPartnerDetails(b.assigned_partner_id);
                  const addressDisplay = b.customer_address || b.customer_location_address || '—';
                  const lat = b.customer_latitude ?? b.latitude;
                  const lng = b.customer_longitude ?? b.longitude;

                  return (
                    <tr
                      key={b.id}
                      className={`whitespace-nowrap transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/40'
                      } hover:bg-sky-50/80`}
                    >
                      {/* S.No */}
                      <td className="py-2.5 px-3 border-r border-slate-300 text-center font-mono font-bold text-slate-700">
                        {idx + 1}
                      </td>

                      {/* Booking ID */}
                      <td className="py-2.5 px-3 border-r border-slate-300 font-mono font-bold text-slate-800">
                        #{b.id.substring(0, 10)}
                      </td>

                      {/* Customer Name */}
                      <td className="py-2.5 px-3 border-r border-slate-300 font-bold text-slate-900">
                        {b.customer_name}
                      </td>

                      {/* Contact No */}
                      <td className="py-2.5 px-3 border-r border-slate-300 font-mono text-slate-800">
                        {b.customer_phone}
                      </td>

                      {/* Service / Work Details */}
                      <td className="py-2.5 px-3 border-r border-slate-300 font-semibold text-teal-900">
                        {b.service_name}
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3 border-r border-slate-300 text-slate-700">
                        {b.service_category}
                      </td>

                      {/* GPS Location / Address */}
                      <td className="py-2.5 px-3 border-r border-slate-300 text-slate-800">
                        <div>{addressDisplay}</div>
                        {Number.isFinite(lat) && Number.isFinite(lng) && (
                          <div className="text-[10px] font-mono text-slate-500">
                            {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
                          </div>
                        )}
                      </td>

                      {/* Assigned Provider */}
                      <td className="py-2.5 px-3 border-r border-slate-300">
                        <div className="font-bold text-slate-900">{partnerInfo.name}</div>
                        {partnerInfo.mobile !== '—' && (
                          <div className="text-[10px] font-mono text-slate-600">
                            {partnerInfo.mobile}
                          </div>
                        )}
                      </td>

                      {/* Booking Amt */}
                      <td className="py-2.5 px-3 border-r border-slate-300 text-right font-extrabold text-slate-900">
                        ₹{b.customer_price}
                      </td>

                      {/* Partner Earn */}
                      <td className="py-2.5 px-3 border-r border-slate-300 text-right font-bold text-emerald-800">
                        ₹{b.partner_earning}
                      </td>

                      {/* OTP */}
                      <td className="py-2.5 px-3 border-r border-slate-300 text-center font-mono font-bold text-slate-700">
                        {b.otp_code || '—'}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded font-bold text-[11px] bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase">
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Excel Status Bar Footer */}
        <div className="bg-emerald-100/70 border-t border-emerald-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-700 font-medium">
          <span>
            Showing <strong>{filteredList.length}</strong> of <strong>{activeJobs.length}</strong> Active Jobs from Supabase
          </span>
          <span>
            S.No │ Booking ID │ Customer Name │ Contact No │ Service │ Category │ GPS Location │ Provider │ Booking Amt │ Partner Earn │ OTP │ Status │
          </span>
        </div>
      </div>
    </div>
  );
};
