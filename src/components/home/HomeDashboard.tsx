import React, { useEffect, useState, useCallback } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { supabaseService } from '../../services/supabaseClient';
import { OfferOfTheDay } from '../../types';
import { ActiveJobBanner } from './ActiveJobBanner';
import { BatteryLow, Radio, CheckCircle2, Clock, Coins } from 'lucide-react';

export const HomeDashboard: React.FC = () => {
  const { partner, wallet, myJobs, activeJob, isOnline, setActiveTab, batteryState, lastJobPollTime } = usePartner();

  const [worksDone, setWorksDone] = useState<number>(wallet.total_completed_jobs || 0);
  const [upcomingQueue, setUpcomingQueue] = useState<number>(0);
  const [dailyOffer, setDailyOffer] = useState<OfferOfTheDay | null>(null);

  const fetchLiveHomeData = useCallback(async () => {
    const offerPromise = supabaseService.getOfferOfTheDay();
    if (partner?.id) {
      const [counts, offer] = await Promise.all([
        supabaseService.getLiveWorkCounts(partner.id),
        offerPromise
      ]);
      setWorksDone(counts.worksDone);
      setUpcomingQueue(counts.upcomingQueue);
      setDailyOffer(offer);
    } else {
      const offer = await offerPromise;
      setDailyOffer(offer);
    }
  }, [partner?.id]);

  useEffect(() => {
    fetchLiveHomeData();

    const unsubscribe = supabaseService.subscribeToRealtimeBookings(
      () => fetchLiveHomeData(),
      () => fetchLiveHomeData()
    );

    const handleManualRefresh = () => {
      fetchLiveHomeData();
    };
    const handleVisibilityReturn = () => {
      if (document.visibilityState === 'visible') {
        fetchLiveHomeData();
      }
    };
    window.addEventListener('doorbly-realtime-refresh', handleManualRefresh);
    window.addEventListener('focus', handleManualRefresh);
    document.addEventListener('visibilitychange', handleVisibilityReturn);

    const interval = setInterval(fetchLiveHomeData, 10000);

    return () => {
      unsubscribe();
      window.removeEventListener('doorbly-realtime-refresh', handleManualRefresh);
      window.removeEventListener('focus', handleManualRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityReturn);
      clearInterval(interval);
    };
  }, [fetchLiveHomeData, myJobs.length, activeJob?.status]);

  const pollSeconds = Math.round(batteryState.jobPollingIntervalMs / 1000);
  const reasonLabel =
    batteryState.activeReason === 'low_battery'
      ? `Low Battery (${batteryState.batteryLevel}%)`
      : batteryState.activeReason === 'background'
      ? 'App in Background'
      : batteryState.activeReason === 'manual'
      ? 'Manual Eco Mode'
      : 'Normal';

  return (
    <div className="space-y-4 pb-20 font-normal">
      {/* Active Job Banner if any */}
      {activeJob && <ActiveJobBanner />}

      {/* Live Order Matching Radar Status (when Online) or Offline Card */}
      {isOnline ? (
        <div
          className={`rounded-2xl p-3.5 border text-xs shadow-2xs space-y-2 transition-colors ${
            batteryState.isBatterySaverActive
              ? 'bg-amber-50/90 border-amber-200/90 text-amber-950'
              : 'bg-emerald-50/90 border-emerald-200/90 text-emerald-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {batteryState.isBatterySaverActive ? (
                <BatteryLow className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              )}
              <span className="font-normal text-xs">
                {batteryState.isBatterySaverActive
                  ? `Battery Saver Active · Polling every ${pollSeconds}s`
                  : `Radar Active · Polling every ${pollSeconds}s`}
              </span>
            </div>
            <span
              className={`text-[11px] font-normal px-2 py-0.5 rounded-md ${
                batteryState.isBatterySaverActive
                  ? 'text-amber-800 bg-amber-100/80'
                  : 'text-emerald-700 bg-emerald-100/70'
              }`}
            >
              Radius: {partner?.preferred_radius_km || 15} km
            </span>
          </div>

          <div className="flex items-center justify-between pt-1.5 border-t border-black/5 text-[11px] opacity-85">
            <span>
              {batteryState.isBatterySaverActive
                ? `Reduced polling (${reasonLabel}) to save power`
                : `Battery: ${batteryState.batteryLevel}%${batteryState.isCharging ? ' (Charging)' : ''} · High-frequency scan`}
            </span>
            <span>{lastJobPollTime ? `Last scan: ${lastJobPollTime}` : 'Active'}</span>
          </div>
        </div>
      ) : (
        !activeJob && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="font-normal text-slate-800 text-sm">You are currently Offline</h3>
            <p className="text-xs text-slate-500 font-normal">
              Switch to Online in the top bar to start receiving nearby doorstep service requests.
            </p>
          </div>
        )
      )}

      {/* Two Small Live Supabase Cards in the Same Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Number of Works Done (Live from Supabase) */}
        <div
          onClick={() => setActiveTab('jobs')}
          className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-teal-500/50 transition-colors"
        >
          <div>
            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider block">
              Works Done
            </span>
            <div className="text-xl font-normal text-slate-900 mt-0.5 leading-tight">
              {worksDone}
            </div>
            <span className="text-[10px] text-emerald-600 font-normal flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Number of Next Upcoming Works in Queue (Live from Supabase) */}
        <div
          onClick={() => setActiveTab('jobs')}
          className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-teal-500/50 transition-colors"
        >
          <div>
            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider block">
              In Queue
            </span>
            <div className="text-xl font-normal text-slate-900 mt-0.5 leading-tight">
              {upcomingQueue}
            </div>
            <span className="text-[10px] text-amber-600 font-normal flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Upcoming
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Medium-Size Card: Offer of the Day (Editable via Admin Panel) */}
      {dailyOffer && dailyOffer.is_active && (
        <div className="bg-teal-50/50 text-slate-800 rounded-2xl p-4 shadow-xs border border-teal-100 space-y-2.5 font-normal">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600 shrink-0">
                <Coins className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-normal uppercase tracking-wider text-teal-700">
                Offer of the Day
              </span>
            </div>
            {dailyOffer.reward_badge && (
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-100/80 text-amber-800 border border-amber-200/80 font-normal text-[11px] tracking-tight shrink-0">
                {dailyOffer.reward_badge}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <h4 className="font-normal text-sm text-slate-800 leading-snug">
              {dailyOffer.title}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {dailyOffer.description}
            </p>
          </div>

          <div className="pt-2 border-t border-teal-100/80 flex items-center justify-between text-[10px] text-slate-500 font-normal">
            <span>{dailyOffer.valid_until}</span>
            <span className="text-teal-700 font-normal">Doorbly Partner Exclusive</span>
          </div>
        </div>
      )}
    </div>
  );
};
