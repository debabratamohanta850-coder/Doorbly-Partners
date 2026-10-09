import React, { useState, useEffect } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { supabaseService } from '../../services/supabaseClient';
import { partnerAuthService } from '../../services/partnerAuth';
import {
  PartnerProfile,
  ServiceBooking,
  WithdrawalRequest,
  PartnerMembership,
  PartnerStatus,
  BookingStatus
} from '../../types';
import { DEFAULT_DOORBLY_CATEGORIES } from '../../services/catalogueService';
import { DoorblyLogoIcon } from '../../constants/branding';
import { SettingsView } from '../settings/SettingsView';
import { PartnerApprovalView } from './PartnerApprovalView';
import { ActivePartnersView } from './ActivePartnersView';
import { ActiveJobsSheetView } from './ActiveJobsSheetView';
import {
  ShieldCheck,
  UserCheck,
  Users,
  Briefcase,
  Wallet,
  TrendingUp,
  Radio,
  CheckCircle2,
  Send,
  RefreshCw,
  LogOut,
  Coins,
  ExternalLink,
  Settings,
  Menu,
  X
} from 'lucide-react';

interface AdminConsoleProps {
  onSwitchToPartnerView: () => void;
  onLogoutAdmin: () => void;
  onFullLogout?: () => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  onSwitchToPartnerView,
  onLogoutAdmin,
  onFullLogout
}) => {
  const { isAdminUnlocked } = usePartner();
  const [activeTab, setActiveTab] = useState<'overview' | 'active_partners' | 'active_jobs' | 'approval' | 'offer' | 'partners' | 'bookings' | 'withdrawals' | 'memberships' | 'dispatch' | 'settings'>('overview');
  const [isLeftMenuOpen, setIsLeftMenuOpen] = useState(false);

  const [partners, setPartners] = useState<PartnerProfile[]>([]);
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [memberships, setMemberships] = useState<PartnerMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Offer of the Day editor state
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [offerRewardBadge, setOfferRewardBadge] = useState('');
  const [offerValidUntil, setOfferValidUntil] = useState('');
  const [offerIsActive, setOfferIsActive] = useState(true);
  const [offerSavedSuccess, setOfferSavedSuccess] = useState(false);

  // Dispatch custom booking form
  const [dispatchCustomerName, setDispatchCustomerName] = useState('Raj Kumar');
  const [dispatchPhone, setDispatchPhone] = useState('+91 98200 11223');
  const [dispatchAddress, setDispatchAddress] = useState('Patia, Bhubaneswar, Odisha');
  const [dispatchLat, setDispatchLat] = useState('20.3547');
  const [dispatchLng, setDispatchLng] = useState('85.8182');
  const [dispatchCategory, setDispatchCategory] = useState('AC Services');
  const [dispatchServiceName, setDispatchServiceName] = useState('AC Repair');
  const [dispatchPrice, setDispatchPrice] = useState(599);
  const [dispatchEarning, setDispatchEarning] = useState(480);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pts, bks, wth, mems, currentOffer] = await Promise.all([
        supabaseService.getAllPartners(),
        supabaseService.getAllBookings(),
        supabaseService.getAllWithdrawalsAdmin(),
        supabaseService.getAllMembershipsAdmin(),
        supabaseService.getOfferOfTheDay()
      ]);
      setPartners(pts);
      setBookings(bks);
      setWithdrawals(wth);
      setMemberships(mems);
      if (currentOffer) {
        setOfferTitle(currentOffer.title);
        setOfferDescription(currentOffer.description);
        setOfferRewardBadge(currentOffer.reward_badge);
        setOfferValidUntil(currentOffer.valid_until);
        setOfferIsActive(currentOffer.is_active);
      }
    } catch (e) {
      console.warn('Admin load data error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdatePartnerStatus = async (partnerId: string, status: PartnerStatus, reason?: string) => {
    await supabaseService.updatePartnerStatus(partnerId, status, reason);
    loadData();
  };

  const handleUpdateWithdrawal = async (id: string, status: 'processing' | 'completed' | 'rejected') => {
    await supabaseService.updateWithdrawalStatus(id, status);
    loadData();
  };

  const handleUpdateMembership = async (id: string, status: 'active' | 'expired' | 'pending') => {
    await supabaseService.updateMembershipStatus(id, status);
    loadData();
  };

  const handleSaveOfferOfTheDay = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabaseService.updateOfferOfTheDay({
      title: offerTitle,
      description: offerDescription,
      reward_badge: offerRewardBadge,
      valid_until: offerValidUntil,
      is_active: offerIsActive
    });
    setOfferSavedSuccess(true);
    setTimeout(() => setOfferSavedSuccess(false), 3000);
  };

  const handleDispatchBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLat = parseFloat(dispatchLat);
    const parsedLng = parseFloat(dispatchLng);
    const lat = Number.isFinite(parsedLat) ? parsedLat : 20.3547;
    const lng = Number.isFinite(parsedLng) ? parsedLng : 85.8182;

    const newBooking: ServiceBooking = {
      id: `DB${Math.floor(10000 + Math.random() * 90000)}`,
      customer_name: dispatchCustomerName,
      customer_phone: dispatchPhone,
      service_category: dispatchCategory,
      service_name: dispatchServiceName,
      service_description: 'Booked via Doorbly Platform',
      customer_location_address: dispatchAddress,
      customer_address: dispatchAddress,
      latitude: lat,
      longitude: lng,
      customer_latitude: lat,
      customer_longitude: lng,
      booking_date: new Date().toISOString().split('T')[0],
      booking_time: 'Immediate',
      estimated_duration: '1 Hour',
      customer_price: Number(dispatchPrice),
      partner_earning: Number(dispatchEarning),
      status: 'SEARCHING_PARTNER',
      otp_code: `${Math.floor(1000 + Math.random() * 9000)}`,
      created_at: new Date().toISOString()
    };

    await supabaseService.simulateCustomerBooking(newBooking);
    setDispatchSuccess(true);
    setTimeout(() => setDispatchSuccess(false), 3000);
    loadData();
  };

  // Metrics
  const onlineCount = partners.filter(p => p.is_online && p.status === 'approved').length;
  const approvedPartnerCount = partners.filter(p => p.status === 'approved').length;
  const pendingApprovalPartners = partners.filter(
    p => p.status === 'pending_verification' || p.status === 'incomplete'
  );
  const activeJobsCount = bookings.filter(b => ['ASSIGNED', 'ARRIVED', 'IN_PROGRESS'].includes(b.status)).length;
  const completedJobsCount = bookings.filter(b => b.status === 'COMPLETED').length;
  const pendingWithdrawalCount = withdrawals.filter(w => w.status === 'requested').length;
  const totalGMV = bookings.reduce((sum, b) => sum + (b.customer_price || 0), 0);

  // Strict Admin-Only Guard: Restrict from all non-admin users
  if (!isAdminUnlocked || !partnerAuthService.isDeviceAdminUnlocked()) {
    return null;
  }

  const adminMenuItems = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'active_partners', label: `Active Partner (${approvedPartnerCount})`, icon: Users },
    { id: 'approval', label: `Partner Approval (${pendingApprovalPartners.length})`, icon: UserCheck },
    { id: 'offer', label: 'Offer of the Day', icon: Coins },
    { id: 'partners', label: `All Partners (${partners.length})`, icon: Users },
    { id: 'bookings', label: `Bookings (${bookings.length})`, icon: Briefcase },
    { id: 'withdrawals', label: `Payouts (${pendingWithdrawalCount})`, icon: Wallet },
    { id: 'memberships', label: 'Memberships', icon: ShieldCheck },
    { id: 'dispatch', label: 'Dispatch Job', icon: Send },
    { id: 'settings', label: 'Backend & App Settings', icon: Settings }
  ] as const;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col max-w-5xl mx-auto shadow-2xl">
      {/* Admin Top App Bar */}
      <header className="sticky top-0 z-40 bg-slate-950 border-b border-slate-800 px-4 py-3 safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Left Side Menu Bar Toggle Button */}
            <button
              type="button"
              onClick={() => setIsLeftMenuOpen((prev) => !prev)}
              aria-label="Toggle Admin Menu Bar"
              className="p-2 -ml-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer md:hidden"
            >
              {isLeftMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <DoorblyLogoIcon className="w-8 h-8 rounded-lg shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">DOORBLY</span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white px-1.5 py-0.5 rounded leading-none">
                  ADMIN CONSOLE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Master Operations Control</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSwitchToPartnerView}
              className="py-1.5 px-3 bg-[#0F766E] hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Partner View</span>
            </button>

            <button
              onClick={onFullLogout || onLogoutAdmin}
              title="Logout Account"
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Body with Left Side Menu Bar & Main Content */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Mobile Backdrop for Left Menu Bar */}
        {isLeftMenuOpen && (
          <div
            onClick={() => setIsLeftMenuOpen(false)}
            className="fixed inset-0 z-30 bg-slate-950/70 md:hidden"
          />
        )}

        {/* Left Side Menu Bar */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-3 transition-transform duration-200 ease-out ${
            isLeftMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="space-y-1">
            <div className="px-3 py-2 flex items-center justify-between border-b border-slate-800/80 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Admin Menu Bar
              </span>
              <button
                type="button"
                onClick={() => setIsLeftMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white md:hidden cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {adminMenuItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsLeftMenuOpen(false);
                  }}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#0F766E] text-white shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={onSwitchToPartnerView}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Switch to Partner View</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 pb-12 overflow-y-auto space-y-4">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F766E]" />
            <p className="text-xs">Loading operational records...</p>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('active_partners')}
                    className="bg-slate-800/90 hover:bg-slate-800 border border-emerald-600/60 hover:border-emerald-400 p-3.5 rounded-2xl text-left transition-all cursor-pointer group"
                    title="Open Active Partner Excel Sheet"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                        Active Partners
                      </span>
                      <ExternalLink className="w-3 h-3 text-emerald-400 opacity-75 group-hover:opacity-100" />
                    </div>
                    <div className="text-xl font-black text-white mt-1">
                      {approvedPartnerCount} <span className="text-xs text-slate-400 font-normal">/ {partners.length}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium underline">
                      {onlineCount} online · View Excel Sheet →
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('active_jobs')}
                    className="bg-slate-800/90 hover:bg-slate-800 border border-emerald-600/60 hover:border-emerald-400 p-3.5 rounded-2xl text-left transition-all cursor-pointer group"
                    title="Open Active Jobs Excel Sheet"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                        Active Jobs
                      </span>
                      <ExternalLink className="w-3 h-3 text-emerald-400 opacity-75 group-hover:opacity-100" />
                    </div>
                    <div className="text-xl font-black text-emerald-400 mt-1">
                      {activeJobsCount}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium underline">
                      In doorstep progress · View Sheet →
                    </span>
                  </button>

                  <div className="bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Completed Jobs
                    </span>
                    <div className="text-xl font-black text-white mt-1">
                      {completedJobsCount}
                    </div>
                    <span className="text-[10px] text-teal-400">
                      Successful deliveries
                    </span>
                  </div>

                  <div className="bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Pending Payouts
                    </span>
                    <div className="text-xl font-black text-amber-400 mt-1">
                      {pendingWithdrawalCount}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Awaiting approval
                    </span>
                  </div>
                </div>

                {/* Offer of the Day Quick Editor Card on Overview */}
                <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span>Offer of the Day (Home Card)</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('offer')}
                      className="text-xs text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      Edit Offer
                    </button>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white">{offerTitle}</div>
                      <div className="text-slate-400 text-[11px]">{offerDescription}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px] shrink-0">
                      {offerRewardBadge}
                    </span>
                  </div>
                </div>

                {/* Operations Control Actions */}
                <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span>Live Doorstep Fleet Status</span>
                    </h3>
                    <button
                      onClick={loadData}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {onlineCount === 0 ? (
                    <div className="p-4 bg-slate-900/60 rounded-xl text-center text-xs text-slate-400">
                      No partners are currently Online. Switch to Partner View to toggle Online and test nearby job matching.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {partners.filter(p => p.is_online).map(partner => (
                        <div key={partner.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{partner.name}</span>
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            </div>
                            <div className="text-slate-400 text-[11px] mt-0.5">
                              {partner.mobile} · {partner.primary_category} · {partner.working_area || 'Zone 1'}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                            Online
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Bookings Snapshot */}
                <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white">
                      Recent Customer Service Requests
                    </h3>
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className="text-xs text-[#0F766E] font-bold hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  {bookings.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No bookings created yet. Use the "Dispatch Job" tab to create one.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bookings.slice(0, 4).map(b => (
                        <div key={b.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-white">{b.service_name}</div>
                            <div className="text-slate-400 text-[11px] mt-0.5">
                              {b.customer_name} · ₹{b.customer_price} (Partner earns ₹{b.partner_earning})
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                            {b.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ACTIVE PARTNERS EXCEL SHEET PAGE */}
            {activeTab === 'active_partners' && (
              <ActivePartnersView
                partners={partners}
                onRefresh={loadData}
                onBackToOverview={() => setActiveTab('overview')}
              />
            )}

            {/* ACTIVE JOBS EXCEL SHEET PAGE (Linked from Active Jobs Card Only) */}
            {activeTab === 'active_jobs' && (
              <ActiveJobsSheetView
                bookings={bookings}
                partners={partners}
                onRefresh={loadData}
                onBackToOverview={() => setActiveTab('overview')}
              />
            )}

            {/* PARTNER APPROVAL & ACTIVATION PAGE (Admin Only) */}
            {activeTab === 'approval' && (
              <PartnerApprovalView
                partners={partners}
                memberships={memberships}
                onRefresh={loadData}
                onUpdateStatus={handleUpdatePartnerStatus}
                onActivateMembership={handleUpdateMembership}
              />
            )}

            {/* OFFER OF THE DAY EDITOR TAB */}
            {activeTab === 'offer' && (
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span>Edit Offer of the Day</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Changes publish immediately to the medium Offer of the Day card on the Partner Home screen.
                    </p>
                  </div>
                </div>

                {offerSavedSuccess && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Offer of the Day updated and published to Partner Home page!</span>
                  </div>
                )}

                <form onSubmit={handleSaveOfferOfTheDay} className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Offer Headline / Title</label>
                    <input
                      type="text"
                      value={offerTitle}
                      onChange={e => setOfferTitle(e.target.value)}
                      required
                      placeholder="e.g. Complete 3 Doorstep Works Today & Get ₹250 Extra Incentive!"
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Offer Description</label>
                    <textarea
                      value={offerDescription}
                      onChange={e => setOfferDescription(e.target.value)}
                      required
                      rows={3}
                      placeholder="Describe eligibility and terms for partners..."
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Reward Badge Text</label>
                      <input
                        type="text"
                        value={offerRewardBadge}
                        onChange={e => setOfferRewardBadge(e.target.value)}
                        placeholder="e.g. +₹250 Bonus"
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Validity Note</label>
                      <input
                        type="text"
                        value={offerValidUntil}
                        onChange={e => setOfferValidUntil(e.target.value)}
                        placeholder="e.g. Valid till Tonight 11:59 PM"
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-700">
                    <div>
                      <div className="font-bold text-white">Display Offer Card on Partner Home</div>
                      <div className="text-[11px] text-slate-400">Toggle off to hide the Offer of the Day card</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={offerIsActive}
                      onChange={e => setOfferIsActive(e.target.checked)}
                      className="w-4 h-4 accent-[#0F766E] cursor-pointer"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#0F766E] hover:bg-teal-700 text-white font-extrabold rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Save & Publish Offer of the Day
                  </button>
                </form>
              </div>
            )}

            {/* PARTNERS MANAGEMENT TAB */}
            {activeTab === 'partners' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">
                    Registered Service Partners ({partners.length})
                  </h3>
                  <button onClick={loadData} className="text-xs text-slate-400 hover:text-white">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {partners.length === 0 ? (
                  <div className="p-8 text-center bg-slate-800/60 rounded-2xl text-xs text-slate-400">
                    No partners registered yet.
                  </div>
                ) : (
                  partners.map(p => (
                    <div
                      key={p.id}
                      className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-3 text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-base text-white">{p.name}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            {p.mobile} · {p.email}
                          </div>
                          <div className="text-teal-400 text-[11px] font-semibold mt-0.5">
                            {p.primary_category} · {p.years_experience} yrs exp · {p.working_area || 'Zone 1'}
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              p.status === 'approved'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : p.status === 'pending_verification'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {p.status === 'approved'
                              ? 'Active Partner (Approved)'
                              : p.status === 'pending_verification'
                              ? 'Waiting for Approval'
                              : p.status.replace('_', ' ')}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {p.status === 'approved'
                              ? p.is_online
                                ? 'Currently Online'
                                : 'Offline (Eligible)'
                              : 'Cannot Go Online Until Approved'}
                          </div>
                        </div>
                      </div>

                      {/* Administrative Action Controls */}
                      <div className="pt-2 border-t border-slate-700 flex items-center justify-end gap-2">
                        {p.status !== 'approved' && (
                          <button
                            onClick={() => handleUpdatePartnerStatus(p.id, 'approved')}
                            className="py-1 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Approve (Make Active Partner)
                          </button>
                        )}

                        {p.status === 'pending_verification' && (
                          <button
                            onClick={() => handleUpdatePartnerStatus(p.id, 'rejected', 'Rejected by Admin')}
                            className="py-1 px-3 bg-rose-900/70 hover:bg-rose-800 text-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        )}

                        {p.status !== 'suspended' && (
                          <button
                            onClick={() => handleUpdatePartnerStatus(p.id, 'suspended', 'Admin suspended')}
                            className="py-1 px-3 bg-slate-700 hover:bg-slate-600 text-rose-300 rounded-lg text-xs font-bold transition-colors"
                          >
                            Suspend
                          </button>
                        )}

                        {p.status === 'suspended' && (
                          <button
                            onClick={() => handleUpdatePartnerStatus(p.id, 'approved')}
                            className="py-1 px-3 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            Re-activate
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* BOOKINGS MANAGEMENT TAB */}
            {activeTab === 'bookings' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">
                    Platform Bookings ({bookings.length})
                  </h3>
                  <button onClick={loadData} className="text-xs text-slate-400 hover:text-white">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {bookings.length === 0 ? (
                  <div className="p-8 text-center bg-slate-800/60 rounded-2xl text-xs text-slate-400">
                    No bookings logged in database yet.
                  </div>
                ) : (
                  bookings.map(b => (
                    <div
                      key={b.id}
                      className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] text-teal-400 font-bold uppercase">
                            {b.service_category} · #{b.id.substring(0, 8)}
                          </span>
                          <h4 className="font-bold text-sm text-white mt-0.5">{b.service_name}</h4>
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            Customer: {b.customer_name} ({b.customer_phone})
                          </p>
                          <p className="text-slate-400 text-[11px] truncate">
                            At: {b.customer_location_address}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] px-2 py-0.5 bg-slate-700 rounded font-bold uppercase text-slate-200">
                            {b.status}
                          </span>
                          <div className="font-bold text-white mt-1">₹{b.customer_price}</div>
                          <div className="text-[10px] text-teal-400">Partner: ₹{b.partner_earning}</div>
                        </div>
                      </div>

                      {/* Admin Booking Status Quick Actions */}
                      <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-mono">OTP: {b.otp_code || 'None'}</span>
                        <div className="flex items-center gap-1.5">
                          {b.status !== 'COMPLETED' && (
                            <button
                              onClick={async () => {
                                await supabaseService.updateBookingStatusAsAdmin(b.id, 'COMPLETED');
                                loadData();
                              }}
                              className="px-2 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold"
                            >
                              Mark Completed
                            </button>
                          )}
                          {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                            <button
                              onClick={async () => {
                                await supabaseService.updateBookingStatusAsAdmin(b.id, 'CANCELLED');
                                loadData();
                              }}
                              className="px-2 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-300 rounded-md text-[10px] font-bold"
                            >
                              Cancel Booking
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* WITHDRAWALS MANAGEMENT TAB */}
            {activeTab === 'withdrawals' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">
                    Partner Bank Payout Requests ({withdrawals.length})
                  </h3>
                  <button onClick={loadData} className="text-xs text-slate-400 hover:text-white">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {withdrawals.length === 0 ? (
                  <div className="p-8 text-center bg-slate-800/60 rounded-2xl text-xs text-slate-400">
                    No withdrawal requests submitted.
                  </div>
                ) : (
                  withdrawals.map(w => (
                    <div
                      key={w.id}
                      className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-base font-extrabold text-white">₹{w.amount}</div>
                          <div className="text-slate-300 text-[11px] mt-0.5">
                            Account Holder: <strong>{w.account_holder}</strong>
                          </div>
                          <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                            A/C: {w.bank_account} · IFSC: {w.ifsc}
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            w.status === 'completed'
                              ? 'bg-emerald-950 text-emerald-400'
                              : w.status === 'processing'
                              ? 'bg-blue-950 text-blue-400'
                              : 'bg-amber-950 text-amber-400'
                          }`}
                        >
                          {w.status}
                        </span>
                      </div>

                      {w.status === 'requested' && (
                        <div className="pt-2 border-t border-slate-700 flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdateWithdrawal(w.id, 'processing')}
                            className="py-1 px-3 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-bold"
                          >
                            Mark In Processing
                          </button>
                          <button
                            onClick={() => handleUpdateWithdrawal(w.id, 'completed')}
                            className="py-1 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold"
                          >
                            Approve & Payout
                          </button>
                        </div>
                      )}

                      {w.status === 'processing' && (
                        <div className="pt-2 border-t border-slate-700 flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdateWithdrawal(w.id, 'completed')}
                            className="py-1 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold"
                          >
                            Confirm Bank Transfer
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* MEMBERSHIPS TAB */}
            {activeTab === 'memberships' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">
                    Partner ₹370 Memberships ({memberships.length})
                  </h3>
                  <button onClick={loadData} className="text-xs text-slate-400 hover:text-white">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {memberships.length === 0 ? (
                  <div className="p-8 text-center bg-slate-800/60 rounded-2xl text-xs text-slate-400">
                    No membership records found.
                  </div>
                ) : (
                  memberships.map(m => (
                    <div
                      key={m.id}
                      className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-sm text-white">{m.plan_name}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            Partner ID: <span className="font-mono">{m.partner_id.substring(0, 10)}</span>
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            Expiry: {m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            m.status === 'active'
                              ? 'bg-emerald-950 text-emerald-400'
                              : 'bg-rose-950 text-rose-400'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-700 flex items-center justify-end gap-2">
                        {m.status !== 'active' ? (
                          <button
                            onClick={() => handleUpdateMembership(m.id, 'active')}
                            className="py-1 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold"
                          >
                            Activate Plan (30 Days)
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateMembership(m.id, 'expired')}
                            className="py-1 px-3 bg-slate-700 hover:bg-slate-600 text-rose-300 rounded-lg text-xs font-bold"
                          >
                            Expire Plan
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* DISPATCH CUSTOM JOB TAB */}
            {activeTab === 'dispatch' && (
              <form onSubmit={handleDispatchBooking} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4 text-xs">
                <div>
                  <h3 className="font-bold text-base text-white">
                    Dispatch Real-Time Service Booking
                  </h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Instantly broadcasts a new customer request to all online eligible partners.
                  </p>
                </div>

                {dispatchSuccess && (
                  <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-xl flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Booking dispatched live! Online partners will receive alert chime.</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Customer Full Name</label>
                    <input
                      type="text"
                      value={dispatchCustomerName}
                      onChange={e => setDispatchCustomerName(e.target.value)}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-[#0F766E]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Customer Phone</label>
                      <input
                        type="text"
                        value={dispatchPhone}
                        onChange={e => setDispatchPhone(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-[#0F766E]"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Service Category</label>
                      <select
                        value={dispatchCategory}
                        onChange={e => setDispatchCategory(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-[#0F766E]"
                      >
                        {DEFAULT_DOORBLY_CATEGORIES.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Service Name</label>
                    <input
                      type="text"
                      value={dispatchServiceName}
                      onChange={e => setDispatchServiceName(e.target.value)}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-[#0F766E]"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Customer Location Address</label>
                    <input
                      type="text"
                      value={dispatchAddress}
                      onChange={e => setDispatchAddress(e.target.value)}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-[#0F766E]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Customer Price (₹)</label>
                      <input
                        type="number"
                        value={dispatchPrice}
                        onChange={e => setDispatchPrice(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-[#0F766E]"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Partner Earning (₹)</label>
                      <input
                        type="number"
                        value={dispatchEarning}
                        onChange={e => setDispatchEarning(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-[#0F766E]"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#0F766E] hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 mt-2"
                >
                  <Send className="w-4 h-4" />
                  <span>BROADCAST BOOKING TO NEARBY PARTNERS</span>
                </button>
              </form>
            )}

            {/* BACKEND & APP SETTINGS TAB (Admin Panel Menu Bar Only) */}
            {activeTab === 'settings' && (
              <div className="bg-slate-100 text-slate-900 rounded-2xl p-4">
                <SettingsView />
              </div>
            )}
          </>
        )}
        </main>
      </div>
    </div>
  );
};
