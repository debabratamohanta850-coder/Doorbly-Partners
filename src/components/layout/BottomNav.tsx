import React, { useState } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { ArrowLeft, RefreshCw, Minimize2 } from 'lucide-react';

interface BottomNavProps {
  onMinimize?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onMinimize }) => {
  const { goBack, refreshAll, refreshSession } = usePartner();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRealtimeRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      window.dispatchEvent(new CustomEvent('doorbly-realtime-refresh'));
      await Promise.all([refreshAll(), refreshSession()]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleRealtimeMinimize = () => {
    // Exit fullscreen if active on mobile browser
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    // Trigger native Android/WebView bridge minimize if present on device
    const win = window as unknown as {
      AndroidBridge?: { minimizeApp?: () => void };
      Android?: { minimize?: () => void };
    };
    win.AndroidBridge?.minimizeApp?.();
    win.Android?.minimize?.();

    window.blur();
    onMinimize?.();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg safe-bottom">
      <div className="max-w-md mx-auto grid grid-cols-3 items-center px-2 py-1">
        {/* 1. Go Back Button */}
        <button
          onClick={goBack}
          className="flex flex-col items-center justify-center py-2 px-1 text-slate-500 hover:text-[#0F766E] active:text-[#0F766E] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 stroke-2" />
          <span className="text-[11px] mt-1 font-normal tracking-tight">Go Back</span>
        </button>

        {/* 2. Real-time Refresh Button */}
        <button
          onClick={handleRealtimeRefresh}
          className="flex flex-col items-center justify-center py-2 px-1 text-slate-500 hover:text-[#0F766E] active:text-[#0F766E] transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-5 h-5 stroke-2 ${isRefreshing ? 'animate-spin text-[#0F766E]' : ''}`} />
          <span className="text-[11px] mt-1 font-normal tracking-tight">
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </span>
        </button>

        {/* 3. Real-time Minimise Button */}
        <button
          onClick={handleRealtimeMinimize}
          className="flex flex-col items-center justify-center py-2 px-1 text-slate-500 hover:text-[#0F766E] active:text-[#0F766E] transition-colors cursor-pointer"
        >
          <Minimize2 className="w-5 h-5 stroke-2" />
          <span className="text-[11px] mt-1 font-normal tracking-tight">Minimise</span>
        </button>
      </div>
    </nav>
  );
};
