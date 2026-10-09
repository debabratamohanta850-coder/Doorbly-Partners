import React, { useState } from 'react';
import { PartnerProfile } from '../../types';
import { UserCheck, Search, RefreshCw, Table, ArrowLeft } from 'lucide-react';

interface ActivePartnersViewProps {
  partners: PartnerProfile[];
  onRefresh: () => Promise<void> | void;
  onBackToOverview?: () => void;
}

export const ActivePartnersView: React.FC<ActivePartnersViewProps> = ({
  partners,
  onRefresh,
  onBackToOverview
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Only show Active Partners (status === 'approved')
  const activePartners = partners.filter((p) => p.status === 'approved');

  const filteredList = activePartners.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const primaryService =
      p.services_offered && p.services_offered.length > 0
        ? p.services_offered[0]
        : p.primary_category;

    return (
      p.name.toLowerCase().includes(q) ||
      p.mobile.toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      primaryService.toLowerCase().includes(q) ||
      (p.city || '').toLowerCase().includes(q) ||
      (p.working_area || '').toLowerCase().includes(q) ||
      (p.pin_code || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 text-xs">
      {/* Light Card Header */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-900 shadow-xs">
        <div className="flex items-start gap-2.5">
          {onBackToOverview && (
            <button
              type="button"
              onClick={onBackToOverview}
              className="p-2 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition-colors cursor-pointer shrink-0 mt-0.5"
              title="Back to Overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-700" />
              <h2 className="font-extrabold text-base text-slate-900">
                Active Partners Excel Sheet ({activePartners.length})
              </h2>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Verified &amp; Approved Active Service Providers eligible to go Online on the Doorbly Platform.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="py-2 px-3 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
          <span>Refresh Sheet</span>
        </button>
      </div>

      {/* Light Excel Sheet Card Container */}
      <div className="bg-[#F8FAFC] border-2 border-emerald-200 rounded-2xl overflow-hidden shadow-md text-slate-900">
        {/* Excel Toolbar & Search Bar */}
        <div className="bg-emerald-100/80 border-b border-emerald-200 p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-700 text-white font-extrabold text-[11px]">
              <Table className="w-3.5 h-3.5" />
              <span>ACTIVE PARTNER SHEET</span>
            </span>
            <span className="text-xs font-bold text-emerald-950">
              Total Active Partners: {activePartners.length}
            </span>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, mobile, service, city, PIN..."
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
                <th className="py-2.5 px-3 border-r border-slate-300">Provider Name</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Mobile</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Gender</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Email</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Service</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Area / City</th>
                <th className="py-2.5 px-3 border-r border-slate-300">PIN Code</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-center">Exp (Yrs)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {filteredList.length === 0 ? (
                <tr className="bg-emerald-50/40">
                  <td
                    colSpan={10}
                    className="py-8 px-4 text-center text-slate-600 font-medium"
                  >
                    No active partners found. Approve partners from the Partner Approval page to list them here.
                  </td>
                </tr>
              ) : (
                filteredList.map((p, idx) => {
                  const primaryService =
                    p.services_offered && p.services_offered.length > 0
                      ? p.services_offered[0]
                      : p.primary_category;
                  const areaDisplay = p.city || p.working_area || 'BBSR';

                  return (
                    <tr
                      key={p.id}
                      className={`whitespace-nowrap transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/40'
                      } hover:bg-sky-50/80`}
                    >
                      {/* S.No */}
                      <td className="py-2.5 px-3 border-r border-slate-300 text-center font-mono font-bold text-slate-700">
                        {idx + 1}
                      </td>

                      {/* Provider Name */}
                      <td className="py-2.5 px-3 border-r border-slate-300 font-bold text-slate-900">
                        {p.name}
                      </td>

                      {/* Mobile */}
                      <td className="py-2.5 px-3 border-r border-slate-300 font-mono text-slate-800">
                        {p.mobile}
                      </td>

                      {/* Gender */}
                      <td className="py-2.5 px-3 border-r border-slate-300 capitalize text-slate-700">
                        {p.gender || 'male'}
                      </td>

                      {/* Email */}
                      <td className="py-2.5 px-3 border-r border-slate-300 text-slate-700">
                        {p.email || '—'}
                      </td>

                      {/* Service */}
                      <td className="py-2.5 px-3 border-r border-slate-300 font-semibold text-teal-900">
                        {primaryService}
                      </td>

                      {/* Area / City */}
                      <td className="py-2.5 px-3 border-r border-slate-300 font-medium text-slate-800">
                        {areaDisplay}
                      </td>

                      {/* PIN Code */}
                      <td className="py-2.5 px-3 border-r border-slate-300 font-mono text-slate-700">
                        {p.pin_code || '751001'}
                      </td>

                      {/* Exp (Yrs) */}
                      <td className="py-2.5 px-3 border-r border-slate-300 text-center font-semibold text-slate-800">
                        {p.years_experience ?? 2}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded font-bold text-[11px] bg-emerald-100 text-emerald-900 border border-emerald-300">
                          Active
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
            Showing <strong>{filteredList.length}</strong> of <strong>{activePartners.length}</strong> Active Partners
          </span>
          <span>
            S.No │ Provider Name │ Mobile │ Gender │ Email │ Service │ Area / City │ PIN Code │ Exp (Yrs) │ Status │
          </span>
        </div>
      </div>
    </div>
  );
};
