import React from 'react';
import { usePartner } from '../../context/PartnerContext';
import { Bell, IndianRupee, ShieldCheck, Sparkles } from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const { notifications, markNotificationRead } = usePartner();

  const getIcon = (type: string) => {
    switch (type) {
      case 'WALLET_CREDIT':
        return <IndianRupee className="w-4 h-4 text-emerald-600" />;
      case 'ACCOUNT_VERIFICATION':
      case 'MEMBERSHIP_EXPIRY':
        return <ShieldCheck className="w-4 h-4 text-[#0F766E]" />;
      case 'NEW_SERVICE_REQUEST':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Notifications
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Alerts, wallet credits, job dispatch updates and Doorbly announcements
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
            <Bell className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm">No notifications</h4>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => markNotificationRead(item.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                item.is_read
                  ? 'bg-white border-slate-200'
                  : 'bg-teal-50/50 border-teal-300 shadow-xs'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs truncate">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {item.message}
                </p>
              </div>

              {!item.is_read && (
                <span className="w-2 h-2 rounded-full bg-[#0F766E] shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
