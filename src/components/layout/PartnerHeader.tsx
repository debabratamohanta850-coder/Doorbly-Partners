import React, { useState } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { DoorblyLogoIcon } from '../../constants/branding';
import { Bell, ShieldAlert, Menu, Power, Loader2 } from 'lucide-react';

interface PartnerHeaderProps {
  onOpenMenu: () => void;
}

export const PartnerHeader: React.FC<PartnerHeaderProps> = ({ onOpenMenu }) => {
  const {
    partner,
    isOnline,
    toggleOnline,
    unreadNotificationCount,
    setActiveTab
  } = usePartner();

  const [isUpdating, setIsUpdating] = useState(false);
  const [idAlertMessage, setIdAlertMessage] = useState<string | null>(null);

  const handleToggle = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const res = await toggleOnline();
      if (!res.success) {
        setIdAlertMessage(res.message);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0F766E] text-white shadow-md safe-top">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Menu Bar Button + Company Logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMenu}
            aria-label="Open menu"
            className="p-2 -ml-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
          <DoorblyLogoIcon className="w-8 h-8 rounded-lg shrink-0" />
        </div>

        {/* Online / Offline Switch Button */}
        <button
          onClick={handleToggle}
          disabled={isUpdating}
          role="switch"
          aria-checked={isOnline}
          aria-label={isOnline ? 'Go Offline' : 'Go Online'}
          className={`relative w-28 h-8 rounded-full p-1 transition-all duration-300 flex items-center select-none shadow-sm border cursor-pointer ${
            isOnline
              ? 'bg-emerald-100 border-emerald-300/90 text-emerald-950'
              : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          <span
            className={`absolute left-2.5 text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
              isOnline ? 'opacity-100 translate-x-0 text-emerald-900' : 'opacity-0 -translate-x-1'
            }`}
          >
            ONLINE
          </span>

          <span
            className={`absolute right-2.5 text-[9px] font-extrabold uppercase tracking-wider transition-all duration-200 ${
              isOnline ? 'opacity-0 translate-x-1' : 'opacity-100 translate-x-0 text-slate-600'
            }`}
          >
            OFFLINE
          </span>

          <div
            className={`w-6 h-6 rounded-full shadow-md flex items-center justify-center transition-transform duration-300 ease-out transform ${
              isOnline
                ? 'translate-x-[76px] bg-emerald-600 text-white'
                : 'translate-x-0 bg-slate-800 text-white'
            }`}
          >
            {isUpdating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Power className="w-3.5 h-3.5 stroke-[3] text-white" />
            )}
          </div>
        </button>

        {/* Bell Icon */}
        <button
          onClick={() => setActiveTab('notifications')}
          aria-label="Notifications"
          className="relative p-2 -mr-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5 text-white" />
          {unreadNotificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-400 text-slate-950 font-bold text-[9px] rounded-full flex items-center justify-center shadow-xs">
              {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
            </span>
          )}
        </button>
      </div>

      {/* ID Verification Failure Modal */}
      {idAlertMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full text-slate-900 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-normal text-base text-slate-900">
                Only Approved Partners Can Go Online
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {idAlertMessage}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Partner ID:</span>
                <span className="font-mono text-slate-800">{partner?.id || 'Unknown'}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Approval Status:</span>
                <span className="capitalize text-amber-600">
                  {partner?.status?.replace('_', ' ') || 'Pending Verification'}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setIdAlertMessage(null);
                  setActiveTab('documents');
                }}
                className="w-full py-3 px-4 bg-[#0F766E] hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Submit Documents & Complete Registration
              </button>

              <button
                onClick={() => setIdAlertMessage(null)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
