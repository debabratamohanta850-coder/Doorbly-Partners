import React, { useState } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { ServiceBooking, BookingStatus } from '../../types';
import {
  Briefcase,
  ChevronRight,
  Phone,
  X
} from 'lucide-react';
import { locationService } from '../../services/locationService';

export const MyJobsList: React.FC = () => {
  const { myJobs, activeJob, setActiveTab } = usePartner();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [selectedJob, setSelectedJob] = useState<ServiceBooking | null>(null);

  // Group jobs
  const filteredJobs = myJobs.filter((job) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'active') {
      return ['SEARCHING_PARTNER', 'REQUEST_SENT', 'ASSIGNED', 'ARRIVED', 'IN_PROGRESS'].includes(job.status);
    }
    if (selectedFilter === 'completed') return job.status === 'COMPLETED';
    if (selectedFilter === 'cancelled') return job.status === 'CANCELLED';
    return true;
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="text-emerald-700 font-bold text-xs">Completed</span>;
      case 'IN_PROGRESS':
        return <span className="text-teal-700 font-bold text-xs">In Progress</span>;
      case 'ARRIVED':
        return <span className="text-amber-700 font-bold text-xs">Arrived</span>;
      case 'ASSIGNED':
        return <span className="text-blue-700 font-bold text-xs">Assigned</span>;
      case 'CANCELLED':
        return <span className="text-rose-600 font-bold text-xs">Cancelled</span>;
      default:
        return <span className="text-slate-500 font-medium text-xs">{status}</span>;
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header and Filter Buttons */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          My Service Jobs
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time record of all your doorstep assignments and service history.
        </p>

        {/* Filter Segmented Control */}
        <div className="mt-3 flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-colors ${
              selectedFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({myJobs.length})
          </button>
          <button
            onClick={() => setSelectedFilter('active')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-colors ${
              selectedFilter === 'active'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active ({activeJob ? 1 : 0})
          </button>
          <button
            onClick={() => setSelectedFilter('completed')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-colors ${
              selectedFilter === 'completed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setSelectedFilter('cancelled')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-colors ${
              selectedFilter === 'cancelled'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Active Job Fast Jump if any */}
      {activeJob && (
        <div
          onClick={() => setActiveTab('jobs')}
          className="bg-sky-50 border border-sky-200 rounded-2xl p-4 cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-sky-900">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              CURRENT ACTIVE BOOKING ORDER
            </span>
            <span>Tap to View</span>
          </div>
          <div className="mt-1 text-slate-900 text-sm">{activeJob.service_name}</div>
          <div className="text-xs text-slate-700 mt-0.5">
            Booking Amount: ₹{activeJob.customer_price} · Customer: {activeJob.customer_name} ({activeJob.customer_phone})
          </div>
        </div>
      )}

      {/* List of Jobs */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">
            {selectedFilter === 'completed' ? 'No completed jobs yet' : 'No jobs found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {selectedFilter === 'completed'
              ? 'Your completed doorstep services and earnings will be listed here after finishing work.'
              : 'Service requests will appear here once booked and assigned to you.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className="bg-gradient-to-br from-sky-50 via-sky-100/80 to-sky-50 rounded-2xl p-4 border border-sky-200 shadow-xs hover:border-sky-300 transition-all cursor-pointer space-y-2.5 text-xs"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-sky-200/80 pb-2">
                <div className="flex items-center gap-2 text-xs text-sky-900">
                  <span>Order #{job.id.substring(0, 8)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{job.service_category}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {getStatusBadge(job.status)}
                  <ChevronRight className="w-4 h-4 text-sky-700" />
                </div>
              </div>

              {/* Required Fields: Booking Amount, Work Details, Customer Name, Contact Number, GPS Location */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Booking Amount:</span>
                  <span className="text-slate-900 text-sm">
                    ₹{job.customer_price}{' '}
                    <span className="text-[11px] text-[#0F766E]">(Earning: ₹{job.partner_earning})</span>
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-600 shrink-0">Work Details:</span>
                  <span className="text-slate-900 text-right">
                    {job.service_name}
                    {job.service_description ? ` — ${job.service_description}` : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Customer Name:</span>
                  <span className="text-slate-900">{job.customer_name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Contact Number:</span>
                  <span className="text-slate-900 font-mono">{job.customer_phone}</span>
                </div>

                <div className="pt-1.5 border-t border-sky-200/60">
                  <div className="text-[11px] text-sky-800">📍 GPS Location</div>
                  <div className="text-slate-900 mt-0.5">
                    {locationService.getBookingGpsLocationText(job)}
                  </div>
                </div>
              </div>

              {/* Go to Location Button (captures GPS & auto-pastes in Google Maps) */}
              <div className="pt-2 border-t border-sky-200/80 flex items-center justify-between gap-2">
                <a
                  href={locationService.getBookingNavigationUrl(job)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    const lat = job.customer_latitude ?? job.latitude;
                    const lng = job.customer_longitude ?? job.longitude;
                    const addr = job.customer_address || job.customer_location_address || '';
                    const captured = lat && lng ? `${lat},${lng}` : addr;
                    if (captured && navigator.clipboard?.writeText) {
                      navigator.clipboard.writeText(captured).catch(() => {});
                    }
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#0F766E] hover:bg-teal-700 text-white text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>🗺 Go to Location</span>
                </a>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `tel:${job.customer_phone}`;
                  }}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-sky-100 text-slate-800 border border-sky-200 text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>Call</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-teal-700 tracking-wider">
                  Service Record
                </span>
                <h3 className="font-extrabold text-lg text-slate-900 mt-0.5">
                  #{selectedJob.id.substring(0, 8)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-sky-50/90 p-4 rounded-2xl border border-sky-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Booking Amount:</span>
                <span className="text-slate-900">₹{selectedJob.customer_price} (Earning: ₹{selectedJob.partner_earning})</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-600 shrink-0">Work Details:</span>
                <span className="text-slate-900 text-right">
                  {selectedJob.service_name} ({selectedJob.service_category})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Customer Name:</span>
                <span className="text-slate-900">{selectedJob.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Contact Number:</span>
                <span className="text-slate-900 font-mono">{selectedJob.customer_phone}</span>
              </div>
              <div className="pt-2 border-t border-sky-200/80">
                <div className="text-sky-800">📍 GPS Location</div>
                <div className="text-slate-900 mt-0.5">
                  {locationService.getBookingGpsLocationText(selectedJob)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={locationService.getBookingNavigationUrl(selectedJob)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  const lat = selectedJob.customer_latitude ?? selectedJob.latitude;
                  const lng = selectedJob.customer_longitude ?? selectedJob.longitude;
                  const addr = selectedJob.customer_address || selectedJob.customer_location_address || '';
                  const captured = lat && lng ? `${lat},${lng}` : addr;
                  if (captured && navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(captured).catch(() => {});
                  }
                }}
                className="flex-1 py-3 bg-[#0F766E] hover:bg-teal-700 text-white text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                <span>🗺 Go to Location</span>
              </a>

              <button
                onClick={() => setSelectedJob(null)}
                className="py-3 px-5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
