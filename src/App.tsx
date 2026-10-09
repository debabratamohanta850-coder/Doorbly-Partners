import React, { useState, Suspense, lazy } from 'react';
import { PartnerProvider, usePartner } from './context/PartnerContext';
import { PartnerHeader } from './components/layout/PartnerHeader';
import { BottomNav } from './components/layout/BottomNav';
import { HomeDashboard } from './components/home/HomeDashboard';
import { AuthScreen } from './components/auth/AuthScreen';
import { PWAInstallBanner } from './components/layout/PWAInstallBanner';
import { DoorblyLogoIcon } from './constants/branding';
import { testFirestoreConnection } from './services/firebase';
import { locationService } from './services/locationService';
import { Loader2, Maximize2, Phone, MessageSquare } from 'lucide-react';

// Lazy-load secondary views and modals to keep the initial bundle ultra-lightweight
const DrawerMenu = lazy(() =>
  import('./components/layout/DrawerMenu').then((m) => ({ default: m.DrawerMenu }))
);
const EmergencySOSModal = lazy(() =>
  import('./components/support/EmergencySOSModal').then((m) => ({ default: m.EmergencySOSModal }))
);
const IncomingJobModal = lazy(() =>
  import('./components/home/IncomingJobModal').then((m) => ({ default: m.IncomingJobModal }))
);
const ActiveJobView = lazy(() =>
  import('./components/jobs/ActiveJobView').then((m) => ({ default: m.ActiveJobView }))
);
const MyJobsList = lazy(() =>
  import('./components/jobs/MyJobsList').then((m) => ({ default: m.MyJobsList }))
);
const WalletDashboard = lazy(() =>
  import('./components/wallet/WalletDashboard').then((m) => ({ default: m.WalletDashboard }))
);
const EarningsView = lazy(() =>
  import('./components/earnings/EarningsView').then((m) => ({ default: m.EarningsView }))
);
const MembershipView = lazy(() =>
  import('./components/membership/MembershipView').then((m) => ({ default: m.MembershipView }))
);
const ServiceSelectionView = lazy(() =>
  import('./components/profile/ServiceSelectionView').then((m) => ({ default: m.ServiceSelectionView }))
);
const KYCDocumentsView = lazy(() =>
  import('./components/profile/KYCDocumentsView').then((m) => ({ default: m.KYCDocumentsView }))
);
const ProfileView = lazy(() =>
  import('./components/profile/ProfileView').then((m) => ({ default: m.ProfileView }))
);
const NotificationCenter = lazy(() =>
  import('./components/notifications/NotificationCenter').then((m) => ({ default: m.NotificationCenter }))
);
const SupportView = lazy(() =>
  import('./components/support/SupportView').then((m) => ({ default: m.SupportView }))
);
const PartnerGuidelinesView = lazy(() =>
  import('./components/support/PartnerGuidelinesView').then((m) => ({ default: m.PartnerGuidelinesView }))
);
const SettingsView = lazy(() =>
  import('./components/settings/SettingsView').then((m) => ({ default: m.SettingsView }))
);
const AdminConsole = lazy(() =>
  import('./components/admin/AdminConsole').then((m) => ({ default: m.AdminConsole }))
);

// Validate Firestore connection on boot per Firebase skill guidelines
testFirestoreConnection().catch(() => {});

const ViewFallback: React.FC = () => (
  <div className="flex items-center justify-center py-12 text-slate-400">
    <Loader2 className="w-5 h-5 animate-spin text-[#0F766E]" />
  </div>
);

const MainAppContent: React.FC = () => {
  const {
    partner,
    isOnline,
    isLoading,
    activeTab,
    activeJob,
    incomingRequest,
    isAdminUnlocked,
    viewMode,
    setViewMode,
    lockAdmin,
    logout
  } = usePartner();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isMinimised, setIsMinimised] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 p-1.5 border border-white shadow-md">
          <DoorblyLogoIcon className="w-full h-full rounded-xl" />
        </div>
        <h1 className="font-normal text-xl tracking-tight">DOORBLY PARTNER</h1>
        <p className="text-xs text-teal-300 mt-1">Connecting to partner network...</p>
        <Loader2 className="w-5 h-5 animate-spin text-teal-400 mt-5" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex flex-col">
        <PWAInstallBanner />
        <div className="flex-1">
          <AuthScreen />
        </div>
      </div>
    );
  }

  // If this device is unlocked by master admin credentials and admin view is active
  if (isAdminUnlocked && viewMode === 'admin') {
    return (
      <Suspense fallback={<ViewFallback />}>
        <AdminConsole
          onSwitchToPartnerView={() => setViewMode('partner')}
          onLogoutAdmin={() => lockAdmin()}
          onFullLogout={logout}
        />
      </Suspense>
    );
  }

  // Real-time Minimised Mode: allows partner to quickly make a call or switch to another app while radar runs in background
  if (isMinimised) {
    const callNumber = activeJob?.customer_phone || '';
    return (
      <div className="min-h-screen bg-slate-950/90 flex flex-col justify-end p-4 pb-6 max-w-md mx-auto">
        <div className="bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <DoorblyLogoIcon className="w-8 h-8 rounded-lg shrink-0" />
              <div>
                <div className="text-xs text-slate-900 flex items-center gap-1.5">
                  <span>Doorbly Minimised</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {isOnline
                    ? 'Background radar active · Switch app or make a call'
                    : 'App minimised · Ready to switch apps or call'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsMinimised(false)}
              className="px-3 py-1.5 rounded-xl bg-[#0F766E] text-white text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Restore</span>
            </button>
          </div>

          {/* Quick Device Actions: Open Phone Call, SMS, or Maps */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
            <a
              href={`tel:${callNumber}`}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-teal-50 text-[#0F766E] border border-teal-100 hover:bg-teal-100/70 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{activeJob ? 'Call Customer' : 'Phone Call'}</span>
            </a>

            <a
              href={`sms:${callNumber}`}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Messages</span>
            </a>

            <a
              href={locationService.getBookingNavigationUrl(activeJob)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <span>🗺 Go to Location</span>
            </a>
          </div>
        </div>

        {/* Keep incoming job alerts active even when minimised */}
        <Suspense fallback={null}>
          {incomingRequest && <IncomingJobModal />}
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col max-w-md mx-auto relative shadow-lg overflow-x-hidden">
      {/* Direct Install App Banner */}
      <PWAInstallBanner />

      {/* Mobile Top Header */}
      <PartnerHeader
        onOpenMenu={() => setIsMenuOpen(true)}
        onOpenSOS={() => setIsSOSOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 px-4 pt-4 pb-24 overflow-y-auto">
        <Suspense fallback={<ViewFallback />}>
          {activeTab === 'home' && <HomeDashboard />}
          {activeTab === 'jobs' && (activeJob ? <ActiveJobView /> : <MyJobsList />)}
          {activeTab === 'wallet' && <WalletDashboard />}
          {activeTab === 'earnings' && <EarningsView />}
          {activeTab === 'membership' && <MembershipView />}
          {activeTab === 'services' && <ServiceSelectionView />}
          {activeTab === 'documents' && <KYCDocumentsView />}
          {activeTab === 'profile' && <ProfileView />}
          {activeTab === 'notifications' && <NotificationCenter />}
          {activeTab === 'guidelines' && <PartnerGuidelinesView />}
          {activeTab === 'support' && <SupportView />}
          {activeTab === 'settings' && (isAdminUnlocked ? <SettingsView /> : <HomeDashboard />)}
        </Suspense>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        onOpenMenu={() => setIsMenuOpen(true)}
        onMinimize={() => setIsMinimised(true)}
      />

      {/* Lazy-Loaded Modals & Drawers */}
      <Suspense fallback={null}>
        {isMenuOpen && <DrawerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />}
        {isSOSOpen && <EmergencySOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />}
        {incomingRequest && <IncomingJobModal />}
      </Suspense>
    </div>
  );
};

export default function App() {
  return (
    <PartnerProvider>
      <MainAppContent />
    </PartnerProvider>
  );
}
