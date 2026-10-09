import React, { useState, useEffect } from 'react';
import { PartnerProfile, PartnerMembership, PartnerStatus, PartnerKYC } from '../../types';
import { supabaseService } from '../../services/supabaseClient';
import { PROFESSION_CATEGORIES } from '../profile/ServiceSelectionView';
import {
  UserCheck,
  CheckCircle2,
  Search,
  RefreshCw,
  Edit3,
  Save,
  X,
  Table
} from 'lucide-react';

interface PartnerApprovalViewProps {
  partners: PartnerProfile[];
  memberships: PartnerMembership[];
  onRefresh: () => Promise<void> | void;
  onUpdateStatus: (partnerId: string, status: PartnerStatus, reason?: string) => Promise<void>;
  onActivateMembership: (membershipId: string, status: 'active' | 'expired' | 'pending') => Promise<void>;
}

export const PartnerApprovalView: React.FC<PartnerApprovalViewProps> = ({
  partners,
  memberships,
  onRefresh,
  onUpdateStatus,
  onActivateMembership
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [kycMap, setKycMap] = useState<Record<string, PartnerKYC | null>>({});
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  // Inline / Modal Edit State for Excel Row
  const [editingPartner, setEditingPartner] = useState<PartnerProfile | null>(null);
  const [editDocType, setEditDocType] = useState<'aadhaar' | 'pan'>('aadhaar');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    let active = true;
    const loadKycs = async () => {
      const entries: Record<string, PartnerKYC | null> = {};
      await Promise.all(
        partners.map(async (p) => {
          const kyc = await supabaseService.getPartnerKYC(p.id);
          entries[p.id] = kyc;
        })
      );
      if (active) {
        setKycMap(entries);
      }
    };
    loadKycs();
    return () => {
      active = false;
    };
  }, [partners]);

  const pendingPartners = partners.filter(
    (p) => p.status === 'pending_verification' || p.status === 'incomplete'
  );
  const approvedPartners = partners.filter((p) => p.status === 'approved');
  const rejectedOrSuspendedPartners = partners.filter(
    (p) => p.status === 'rejected' || p.status === 'suspended'
  );

  const filteredList = partners.filter((p) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'pending'
        ? p.status === 'pending_verification' || p.status === 'incomplete'
        : filter === 'approved'
        ? p.status === 'approved'
        : p.status === 'rejected' || p.status === 'suspended';

    if (!matchesFilter) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.mobile.toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.primary_category.toLowerCase().includes(q) ||
      (p.city || '').toLowerCase().includes(q) ||
      (p.working_area || '').toLowerCase().includes(q) ||
      (p.pin_code || '').toLowerCase().includes(q)
    );
  });

  const handleApproveAndActivate = async (partner: PartnerProfile) => {
    setProcessingId(partner.id);
    try {
      await onUpdateStatus(partner.id, 'approved', 'Verified and activated by Master Admin');

      // Ensure partner has an active ₹370 monthly membership so they can immediately go Online
      const existingMem = memberships.find((m) => m.partner_id === partner.id);
      if (existingMem) {
        if (existingMem.status !== 'active') {
          await onActivateMembership(existingMem.id, 'active');
        }
      } else {
        await supabaseService.updateMembership({
          id: `mem_${partner.id}`,
          partner_id: partner.id,
          plan_name: 'Monthly Doorbly Partner Membership',
          monthly_fee: 370,
          status: 'active',
          start_date: new Date().toISOString(),
          expiry_date: new Date(Date.now() + 30 * 86400000).toISOString(),
          payment_status: 'paid',
          payment_reference: `ADMIN_ACTIVATED_${Date.now()}`
        });
      }

      setActionBanner(
        `${partner.name} (${partner.mobile}) is now an Active Partner and eligible to go Online.`
      );
      await onRefresh();
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenEdit = (partner: PartnerProfile) => {
    const kyc = kycMap[partner.id];
    setEditingPartner({ ...partner });
    setEditDocType(kyc?.documentType || 'aadhaar');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    setIsSavingEdit(true);
    try {
      const updatedProfile: PartnerProfile = {
        ...editingPartner,
        updated_at: new Date().toISOString()
      };
      await supabaseService.upsertPartnerProfile(updatedProfile);

      const existingKyc = kycMap[editingPartner.id];
      await supabaseService.upsertPartnerKYC(editingPartner.id, {
        documentType: editDocType,
        documentNumber: existingKyc?.documentNumber || 'VERIFIED-ONBOARDING',
        bankAccount: existingKyc?.bankAccount || '',
        ifsc: existingKyc?.ifsc || '',
        accountHolder: editingPartner.name,
        certificateUrls: existingKyc?.certificateUrls || [],
        submittedAt: existingKyc?.submittedAt || new Date().toISOString()
      });

      setActionBanner(`Updated registration details for ${editingPartner.name}.`);
      setEditingPartner(null);
      await onRefresh();
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Light Card Header */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-900 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-700" />
            <h2 className="font-extrabold text-base text-slate-900">
              Partner Approval &amp; Registration Sheet
            </h2>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Excel-style master registration sheet displaying all onboarding form fields with one-click Active &amp; Edit actions.
          </p>
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

      {/* Action Feedback Banner */}
      {actionBanner && (
        <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 flex items-center justify-between gap-2 font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{actionBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            className="text-emerald-800 hover:text-emerald-950 text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Light Excel Sheet Card Container */}
      <div className="bg-[#F8FAFC] border-2 border-emerald-200 rounded-2xl overflow-hidden shadow-md text-slate-900">
        {/* Excel Toolbar / Filter & Search Bar */}
        <div className="bg-emerald-100/80 border-b border-emerald-200 p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-700 text-white font-extrabold text-[11px] mr-1">
              <Table className="w-3.5 h-3.5" />
              <span>SHEET</span>
            </span>
            {[
              { id: 'all', label: `All Rows (${partners.length})` },
              { id: 'pending', label: `Waiting Approval (${pendingPartners.length})` },
              { id: 'approved', label: `Active (${approvedPartners.length})` },
              { id: 'rejected', label: `Blocked/Rejected (${rejectedOrSuspendedPartners.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as typeof filter)}
                className={`py-1.5 px-3 rounded-lg font-bold text-xs whitespace-nowrap transition-colors cursor-pointer border ${
                  filter === tab.id
                    ? 'bg-white text-emerald-900 border-emerald-400 shadow-2xs'
                    : 'bg-emerald-50/70 text-slate-700 border-emerald-200 hover:bg-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter sheet by name, mobile, service, area..."
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
                <th className="py-2.5 px-3 border-r border-slate-300">Doc Type</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {filteredList.length === 0 ? (
                <tr className="bg-emerald-50/40">
                  <td
                    colSpan={12}
                    className="py-8 px-4 text-center text-slate-600 font-medium"
                  >
                    No partner rows found in this sheet view. New partner registrations will appear in horizontal rows here automatically.
                  </td>
                </tr>
              ) : (
                filteredList.map((p, idx) => {
                  const kyc = kycMap[p.id];
                  const isApproved = p.status === 'approved';
                  const isBusy = processingId === p.id;
                  const primaryService =
                    p.services_offered && p.services_offered.length > 0
                      ? p.services_offered[0]
                      : p.primary_category;
                  const areaDisplay = p.city || p.working_area || 'BBSR';
                  const docTypeDisplay = (kyc?.documentType || 'aadhaar').toUpperCase();

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

                      {/* Experience */}
                      <td className="py-2.5 px-3 border-r border-slate-300 text-center font-semibold text-slate-800">
                        {p.years_experience ?? 2}
                      </td>

                      {/* Doc Type */}
                      <td className="py-2.5 px-3 border-r border-slate-300 font-mono text-[11px] font-bold text-slate-700">
                        {docTypeDisplay}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 border-r border-slate-300 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] border ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : p.status === 'pending_verification' || p.status === 'incomplete'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-rose-100 text-rose-900 border-rose-300'
                          }`}
                        >
                          {isApproved
                            ? 'Active'
                            : p.status === 'pending_verification' || p.status === 'incomplete'
                            ? 'Pending'
                            : p.status}
                        </span>
                      </td>

                      {/* Action: Active Button & Edit Button at end of each row */}
                      <td className="py-2 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleApproveAndActivate(p)}
                            className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-colors cursor-pointer border ${
                              isApproved
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            } disabled:opacity-50`}
                            title="Activate Partner"
                          >
                            {isBusy ? 'Saving...' : 'Active'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="px-2.5 py-1 rounded-md bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                            title="Edit Registration Row"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </div>
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
            Showing <strong>{filteredList.length}</strong> of <strong>{partners.length}</strong> registered providers
          </span>
          <span>
             Columns: S.No │ Provider Name │ Mobile │ Gender │ Email │ Service │ Area │ PIN Code │ Exp │ Doc Type │ Status │ Action (Active / Edit)
          </span>
        </div>
      </div>

      {/* Edit Row Modal (Allows editing all registration form fields) */}
      {editingPartner && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 border-2 border-emerald-300 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Edit Partner Registration Row
                </h3>
                <p className="text-[11px] text-slate-500">
                  Update onboarding form fields or status for {editingPartner.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPartner(null)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Provider Full Name</label>
                  <input
                    type="text"
                    value={editingPartner.name}
                    onChange={(e) =>
                      setEditingPartner({ ...editingPartner, name: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={editingPartner.mobile}
                    onChange={(e) =>
                      setEditingPartner({ ...editingPartner, mobile: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={editingPartner.gender || 'male'}
                    onChange={(e) =>
                      setEditingPartner({
                        ...editingPartner,
                        gender: e.target.value as 'male' | 'female' | 'other'
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editingPartner.email || ''}
                    onChange={(e) =>
                      setEditingPartner({ ...editingPartner, email: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Area / City</label>
                  <input
                    type="text"
                    value={editingPartner.city || ''}
                    onChange={(e) =>
                      setEditingPartner({
                        ...editingPartner,
                        city: e.target.value,
                        working_area: `${e.target.value} Central`
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={editingPartner.pin_code || ''}
                    onChange={(e) =>
                      setEditingPartner({ ...editingPartner, pin_code: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Primary Trade / Service
                </label>
                <select
                  value={
                    editingPartner.services_offered && editingPartner.services_offered.length > 0
                      ? editingPartner.services_offered[0]
                      : editingPartner.primary_category
                  }
                  onChange={(e) => {
                    const selectedProf = e.target.value;
                    const matchedCat = PROFESSION_CATEGORIES.find((c) =>
                      c.professions.includes(selectedProf)
                    );
                    setEditingPartner({
                      ...editingPartner,
                      primary_category: matchedCat ? matchedCat.name : selectedProf,
                      services_offered: [selectedProf]
                    });
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-semibold"
                >
                  {PROFESSION_CATEGORIES.map((cat) => (
                    <optgroup
                      key={cat.id}
                      label={cat.subtitle ? `${cat.name} — ${cat.subtitle}` : cat.name}
                    >
                      {cat.professions.map((prof) => (
                        <option key={`${cat.id}_${prof}`} value={prof}>
                          {prof}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Years Experience</label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={editingPartner.years_experience ?? 2}
                    onChange={(e) =>
                      setEditingPartner({
                        ...editingPartner,
                        years_experience: Number(e.target.value)
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Doc Type</label>
                  <select
                    value={editDocType}
                    onChange={(e) => setEditDocType(e.target.value as 'aadhaar' | 'pan')}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                  >
                    <option value="aadhaar">Aadhaar</option>
                    <option value="pan">PAN</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Partner Status</label>
                  <select
                    value={editingPartner.status}
                    onChange={(e) =>
                      setEditingPartner({
                        ...editingPartner,
                        status: e.target.value as PartnerStatus
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-bold"
                  >
                    <option value="approved">Active (Approved)</option>
                    <option value="pending_verification">Pending Verification</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingPartner(null)}
                  className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingEdit ? 'Saving...' : 'Save Row Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

