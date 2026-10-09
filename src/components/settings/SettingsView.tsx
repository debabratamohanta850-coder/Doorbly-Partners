import React, { useState } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { supabaseService } from '../../services/supabaseClient';
import { supabaseDataEngine, SyncSpeedMode } from '../../services/supabaseDataEngine';
import { Database, Check, AlertCircle, Copy, Server, ShieldCheck, Loader2, BatteryLow, BatteryCharging, BellRing, RefreshCw, Zap } from 'lucide-react';
import { BatterySaverPreference } from '../../services/batteryService';
import {
  FCM_VAPID_KEY,
  getSavedFcmToken,
  requestFcmPushToken,
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  DEFAULT_FIREBASE_CONFIG,
  testFirestoreConnection
} from '../../services/firebase';

export const SettingsView: React.FC = () => {
  const {
    batteryState,
    lastJobPollTime,
    dataEngineStats,
    setDataEngineMode,
    setBatterySaverPreference,
    setSimulatedBatteryLevel,
    refreshAll,
    refreshSession,
    setViewMode
  } = usePartner();

  const currentConfig = supabaseService.getConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig.url);
  const [supabaseKey, setSupabaseKey] = useState(currentConfig.anonKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Firebase Configuration State
  const [fbConfig, setFbConfig] = useState(() => getSavedFirebaseConfig());
  const [fbStatus, setFbStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingFb, setIsTestingFb] = useState(false);

  const [fcmToken, setFcmToken] = useState<string | null>(() => getSavedFcmToken());
  const [isRegisteringFcm, setIsRegisteringFcm] = useState(false);
  const [fcmStatus, setFcmStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedFcm, setCopiedFcm] = useState(false);

  const handleSaveFirebaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    saveFirebaseConfig(fbConfig);
    setIsTestingFb(true);
    const ok = await testFirestoreConnection();
    setIsTestingFb(false);
    setFbStatus({
      success: true,
      message: ok
        ? `Firebase project "${fbConfig.projectId}" keys saved & active.`
        : `Firebase project "${fbConfig.projectId}" keys saved. Click "Update & Restart" to reload SDK.`
    });
  };

  const handleEnableFcmPush = async () => {
    setIsRegisteringFcm(true);
    const res = await requestFcmPushToken();
    setIsRegisteringFcm(false);
    setFcmStatus({ success: res.success, message: res.message });
    if (res.token) {
      setFcmToken(res.token);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    supabaseService.setConfig(supabaseUrl.trim(), supabaseKey.trim());
    setIsTesting(true);
    const res = await supabaseService.testConnection();
    setIsTesting(false);
    setTestResult(res);
  };

  const handleTestNow = async () => {
    setIsTesting(true);
    const res = await supabaseService.testConnection();
    setIsTesting(false);
    setTestResult(res);
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Backend & App Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Master Admin Exclusively Unlocked (debabrata.tribune@gmail.com)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setViewMode('admin')}
          className="py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin Console</span>
        </button>
      </div>

      {/* Sync All Settings & Restart Card */}
      <div className="bg-teal-50/80 rounded-2xl p-4 border border-teal-200 flex items-center justify-between gap-3">
        <div className="text-xs">
          <div className="font-bold text-slate-900">Apply All Settings &amp; Restart Session</div>
          <div className="text-[11px] text-slate-600 mt-0.5">
            Saves Supabase &amp; power configurations and reloads real-time connections.
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            supabaseService.setConfig(supabaseUrl.trim(), supabaseKey.trim());
            saveFirebaseConfig(fbConfig);
            await Promise.all([refreshAll(), refreshSession()]);
            window.location.reload();
          }}
          className="py-2.5 px-3.5 rounded-xl bg-[#0F766E] hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Update &amp; Restart</span>
        </button>
      </div>

      {/* Firebase Integration & Keys Card */}
      <form
        onSubmit={handleSaveFirebaseConfig}
        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Server className="w-4 h-4 text-[#0F766E]" />
            <span>Firebase Integration &amp; Keys ({fbConfig.projectId})</span>
          </h3>

          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
            Active SDK
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="sm:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1">API Key</label>
            <input
              type="text"
              value={fbConfig.apiKey}
              onChange={(e) => setFbConfig({ ...fbConfig, apiKey: e.target.value.trim() })}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden font-mono text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Project ID</label>
            <input
              type="text"
              value={fbConfig.projectId}
              onChange={(e) => setFbConfig({ ...fbConfig, projectId: e.target.value.trim() })}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden font-mono text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Auth Domain</label>
            <input
              type="text"
              value={fbConfig.authDomain}
              onChange={(e) => setFbConfig({ ...fbConfig, authDomain: e.target.value.trim() })}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden font-mono text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Storage Bucket</label>
            <input
              type="text"
              value={fbConfig.storageBucket}
              onChange={(e) => setFbConfig({ ...fbConfig, storageBucket: e.target.value.trim() })}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden font-mono text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Messaging Sender ID</label>
            <input
              type="text"
              value={fbConfig.messagingSenderId}
              onChange={(e) =>
                setFbConfig({ ...fbConfig, messagingSenderId: e.target.value.trim() })
              }
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden font-mono text-xs"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1">App ID</label>
            <input
              type="text"
              value={fbConfig.appId}
              onChange={(e) => setFbConfig({ ...fbConfig, appId: e.target.value.trim() })}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden font-mono text-xs"
            />
          </div>
        </div>

        {fbStatus && (
          <div className="p-3 rounded-xl text-xs font-medium flex items-start gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{fbStatus.message}</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={isTestingFb}
            className="flex-1 py-2.5 bg-[#0F766E] hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isTestingFb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Save Firebase Keys</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFbConfig(DEFAULT_FIREBASE_CONFIG);
              saveFirebaseConfig(DEFAULT_FIREBASE_CONFIG);
              setFbStatus({
                success: true,
                message: 'Restored default doorbly-b0bba Firebase keys.'
              });
            }}
            className="py-2.5 px-3.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            Reset Default
          </button>
        </div>
      </form>

      {/* Battery-Saving Mode & Adaptive Polling Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            {batteryState.isBatterySaverActive ? (
              <BatteryLow className="w-4 h-4 text-amber-600" />
            ) : (
              <BatteryCharging className="w-4 h-4 text-[#0F766E]" />
            )}
            <span>Battery-Saving Mode & Polling</span>
          </h3>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
              batteryState.isBatterySaverActive
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {batteryState.isBatterySaverActive ? 'Eco Mode Active (30s)' : 'Normal Mode (5s)'}
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Automatically throttles live job request polling from <strong>5s to 30s</strong> and GPS updates from <strong>15s to 60s</strong> when device battery drops below <strong>20%</strong> or when the app is in the background.
        </p>

        {/* Live Telemetry Grid */}
        <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Battery</span>
            <span
              className={`font-extrabold text-sm ${
                batteryState.batteryLevel < 20 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {batteryState.batteryLevel}%{batteryState.isCharging ? ' ⚡' : ''}
            </span>
          </div>
          <div className="border-x border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Job Poll Rate</span>
            <span className="font-extrabold text-sm text-[#0F766E]">
              Every {Math.round(batteryState.jobPollingIntervalMs / 1000)}s
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">GPS Sync</span>
            <span className="font-extrabold text-sm text-slate-800">
              Every {Math.round(batteryState.locationUpdateIntervalMs / 1000)}s
            </span>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Power Management Policy
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'auto', label: 'Auto (<20% / Bg)' },
                { id: 'always_on', label: 'Always Eco' },
                { id: 'off', label: 'Always Fast' }
              ] as { id: BatterySaverPreference; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setBatterySaverPreference(opt.id)}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                  batteryState.preference === opt.id
                    ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Low Battery Simulation Toggle for Testing */}
        <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>Test Charge Level Scaling</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                  {batteryState.isSupported ? 'Battery API Active' : 'Simulated API'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                {lastJobPollTime ? `Last job poll at ${lastJobPollTime}` : 'Test dynamic polling intervals (5s / 15s / 30s)'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSimulatedBatteryLevel(null)}
              className={`py-2 px-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                !batteryState.isSimulatedLowBattery
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Hardware (5s)
            </button>
            <button
              type="button"
              onClick={() => setSimulatedBatteryLevel(28)}
              className={`py-2 px-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                batteryState.isSimulatedLowBattery && batteryState.batteryLevel === 28
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              28% Charge (15s)
            </button>
            <button
              type="button"
              onClick={() => setSimulatedBatteryLevel(14)}
              className={`py-2 px-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                batteryState.isSimulatedLowBattery && batteryState.batteryLevel === 14
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              14% Low (30s)
            </button>
          </div>
        </div>
      </div>

      {/* Firebase Cloud Messaging (FCM Push API) Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <BellRing className="w-4 h-4 text-[#0F766E]" />
            <span>Firebase Cloud Messaging (FCM)</span>
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-50 text-[#0F766E] border border-teal-200">
            VAPID Configured
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Web Push VAPID Key
          </label>
          <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-700 break-all">
            {FCM_VAPID_KEY}
          </div>
        </div>

        {fcmToken && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Device FCM Registration Token
              </label>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(fcmToken);
                  setCopiedFcm(true);
                  setTimeout(() => setCopiedFcm(false), 2000);
                }}
                className="text-[11px] font-bold text-[#0F766E] flex items-center gap-1 cursor-pointer"
              >
                {copiedFcm ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedFcm ? 'Copied' : 'Copy Token'}</span>
              </button>
            </div>
            <div className="px-3 py-2 bg-emerald-50/60 rounded-xl border border-emerald-200 text-[11px] font-mono text-emerald-950 break-all">
              {fcmToken}
            </div>
          </div>
        )}

        {fcmStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
              fcmStatus.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {fcmStatus.success ? (
              <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            )}
            <span>{fcmStatus.message}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleEnableFcmPush}
          disabled={isRegisteringFcm}
          className="w-full py-2.5 bg-[#0F766E] hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-60"
        >
          {isRegisteringFcm ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BellRing className="w-4 h-4" />
          )}
          <span>{fcmToken ? 'Refresh FCM Push Token' : 'Enable FCM Push Notifications'}</span>
        </button>
      </div>

      {/* Supabase Turbo Engine Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Supabase Turbo Data Engine</span>
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300">
            {dataEngineStats.mode === 'turbo'
              ? 'Turbo Engine Active'
              : dataEngineStats.mode === 'balanced'
                ? 'Balanced Mode'
                : 'Eco Mode'}
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Accelerates all Supabase reads &amp; writes using L1 Stale-While-Revalidate (SWR) memory caching, in-flight request deduplication, persistent keep-alive HTTP pipes, and sub-50ms Realtime Broadcast delta hydration.
        </p>

        {/* Engine Speed Mode Selector */}
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'turbo', label: '⚡ Turbo (3s / SWR)' },
              { id: 'balanced', label: 'Balanced (15s)' },
              { id: 'eco', label: 'Eco Saver (30s)' }
            ] as { id: SyncSpeedMode; label: string }[]
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDataEngineMode(opt.id)}
              className={`py-2 px-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                dataEngineStats.mode === opt.id
                  ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Engine Throughput Metrics */}
        <div className="grid grid-cols-4 gap-2 text-center bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">L1 Hits</span>
            <span className="font-extrabold text-sm text-emerald-700">
              {dataEngineStats.cacheHits}
            </span>
          </div>
          <div className="border-x border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Coalesced</span>
            <span className="font-extrabold text-sm text-[#0F766E]">
              {dataEngineStats.coalescedRequests}
            </span>
          </div>
          <div className="border-r border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Realtime Δ</span>
            <span className="font-extrabold text-sm text-amber-600">
              {dataEngineStats.realtimeEventsProcessed}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Avg Ping</span>
            <span className="font-extrabold text-sm text-slate-900">
              {dataEngineStats.avgLatencyMs ? `${dataEngineStats.avgLatencyMs}ms` : '<15ms'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-slate-500">
            Cached Keys: <strong>{dataEngineStats.cacheEntriesCount}</strong> · Net I/O:{' '}
            <strong>{dataEngineStats.networkReads + dataEngineStats.networkWrites}</strong>
          </span>
          <button
            type="button"
            onClick={async () => {
              await supabaseDataEngine.flushPendingWrites();
              supabaseDataEngine.clearCache();
              await refreshAll();
            }}
            className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
          >
            Purge L1 Cache &amp; Sync
          </button>
        </div>
      </div>

      {/* Supabase Connection Card */}
      <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-[#0F766E]" />
            <span>Supabase Database Config</span>
          </h3>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                currentConfig.connected ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            />
            <span>{currentConfig.connected ? 'Connected' : 'Offline / Standalone'}</span>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden font-mono text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Supabase Anon / Public Key
            </label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden font-mono text-xs"
            />
          </div>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
              testResult.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {testResult.success ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={isTesting}
            className="flex-1 py-3 bg-[#0F766E] hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5"
          >
            {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
            <span>Save & Connect</span>
          </button>

          <button
            type="button"
            onClick={handleTestNow}
            disabled={isTesting}
            className="py-3 px-4 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
          >
            Ping Test
          </button>
        </div>
      </form>
    </div>
  );
};
