import React, { useState } from 'react';
import { usePartner, NavigationTab } from '../../context/PartnerContext';
import { DoorblyLogoIcon } from '../../constants/branding';
import {
  X,
  Home,
  Briefcase,
  TrendingUp,
  Wallet,
  ShieldCheck,
  Wrench,
  Bell,
  User,
  FileText,
  HelpCircle,
  LogOut,
  ChevronRight,
  Loader2,
  Award
} from 'lucide-react';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({ isOpen, onClose }) => {
  const { partner, membership, activeTab, setActiveTab, logout, isAdminUnlocked, setViewMode } = usePartner();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  if (!isOpen) return null;

  const navigateTo = (tab: NavigationTab) => {
    setActiveTab(tab);
    onClose();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      onClose();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
      setConfirmingLogout(false);
    }
  };

  const menuSections = [
    {
      title: 'Work & Earnings',
      items: [
        { tab: 'home' as NavigationTab, label: 'Home Dashboard', icon: Home },
        { tab: 'jobs' as NavigationTab, label: 'My Jobs & History', icon: Briefcase },
        { tab: 'earnings' as NavigationTab, label: 'Earnings Report', icon: TrendingUp },
        { tab: 'wallet' as NavigationTab, label: 'Partner Wallet', icon: Wallet }
      ]
    },
    {
      title: 'Partner Account',
      items: [
        { tab: 'membership' as NavigationTab, label: '₹370 Monthly Membership', icon: ShieldCheck, badge: membership?.status === 'active' ? 'Active' : 'Renew' },
        { tab: 'services' as NavigationTab, label: 'Professions', icon: Wrench },
        { tab: 'notifications' as NavigationTab, label: 'Notification Center', icon: Bell },
        { tab: 'profile' as NavigationTab, label: 'My Profile', icon: User },
        { tab: 'documents' as NavigationTab, label: 'KYC & Bank Documents', icon: FileText }
      ]
    },
    {
      title: 'Help & Operations',
      items: [
        { tab: 'guidelines' as NavigationTab, label: 'Doorstep Partner Guidelines', icon: Award },
        { tab: 'support' as NavigationTab, label: 'Partner Support & Tickets', icon: HelpCircle }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 transition-opacity"
      />

      {/* Drawer Content */}
      <div className="absolute inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl flex flex-col z-10">
        {/* Header Profile Summary */}
        <div className="bg-[#0F766E] text-white p-5 safe-top flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DoorblyLogoIcon className="w-7 h-7 rounded-md shrink-0" />
              <div className="flex flex-col justify-center">
                <span className="text-xs uppercase font-black tracking-wider text-white leading-none">
                  DOORBLY
                </span>
                <span className="text-[8px] uppercase font-extrabold tracking-widest text-amber-300 leading-none mt-1">
                  PARTNER
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-teal-800 border-2 border-white/30 flex items-center justify-center font-bold text-lg shrink-0">
              <span>{partner?.name?.charAt(0) || 'P'}</span>
            </div>

            <div className="min-w-0">
              <h2 className="font-bold text-base text-white truncate">{partner?.name || 'Partner'}</h2>
              <p className="text-xs text-teal-100 truncate">{partner?.mobile || 'No Phone'}</p>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-teal-200 font-medium">
                <span>ID: {partner?.id?.substring(0, 10)}</span>
                <span>·</span>
                <span className="capitalize">{partner?.status?.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Menu Items */}
        <div className="flex-1 overflow-y-auto py-3 divide-y divide-slate-100">
          {menuSections.map((section, idx) => (
            <div key={idx} className="py-2">
              <div className="px-4 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {section.title}
              </div>
              <div className="mt-1">
                {section.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.tab;

                  return (
                    <button
                      key={itemIdx}
                      onClick={() => navigateTo(item.tab)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-teal-50 text-[#0F766E] font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#0F766E]' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              item.badge === 'Active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Master Admin Console (only for unlocked admin device) */}
        {isAdminUnlocked && (
          <div className="p-3 bg-amber-50/80 border-t border-amber-200">
            <button
              onClick={() => {
                setViewMode('admin');
                onClose();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-colors shadow-xs"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 fill-slate-950 text-amber-400" />
                <span>OPEN ADMIN CONSOLE</span>
              </div>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 safe-bottom">
          {confirmingLogout ? (
            <div className="space-y-2">
              <p className="text-center text-xs font-bold text-slate-700">
                Log out of your partner account?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  {isLoggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                  <span>Confirm</span>
                </button>
                <button
                  onClick={() => setConfirmingLogout(false)}
                  disabled={isLoggingOut}
                  className="py-2.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingLogout(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-rose-600 font-bold text-sm hover:bg-rose-50 border border-rose-200 active:scale-98 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout Account</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
