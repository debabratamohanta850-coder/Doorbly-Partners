import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  batteryService,
  BatteryAndVisibilityState,
  BatterySaverPreference,
  BatterySaverReason,
  LOW_BATTERY_THRESHOLD,
  NORMAL_JOB_POLL_MS,
  ECO_JOB_POLL_MS,
  NORMAL_LOCATION_INTERVAL_MS,
  ECO_LOCATION_INTERVAL_MS
} from '../services/batteryService';

interface BatteryManagerEventTarget extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

export interface UseBatteryStatusResult extends BatteryAndVisibilityState {
  isSupported: boolean;
  chargingTime: number | null;
  dischargingTime: number | null;
  setBatterySaverPreference: (pref: BatterySaverPreference) => void;
  setSimulatedBatteryLevel: (level: number | null) => void;
}

const STORAGE_KEY_PREF = 'doorbly_partner_battery_saver_pref';
const MODERATE_BATTERY_THRESHOLD = 35; // 20% - 35% intermediate adaptive tier (15s poll)
const MODERATE_JOB_POLL_MS = 15000;
const MODERATE_LOCATION_INTERVAL_MS = 30000;

/**
 * Custom React Hook that listens to the Web Battery Status API (`navigator.getBattery()`)
 * and Page Visibility API to monitor device charge levels in real time and compute
 * dynamic polling intervals for the live job poller and GPS tracker.
 */
export function useBatteryStatus(): UseBatteryStatusResult {
  const [isSupported, setIsSupported] = useState<boolean>(
    typeof navigator !== 'undefined' && 'getBattery' in navigator
  );
  const [hardwareLevel, setHardwareLevel] = useState<number>(100);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [chargingTime, setChargingTime] = useState<number | null>(null);
  const [dischargingTime, setDischargingTime] = useState<number | null>(null);
  const [simulatedLevel, setSimulatedLevel] = useState<number | null>(null);
  const [isAppInBackground, setIsAppInBackground] = useState<boolean>(
    typeof document !== 'undefined' ? document.visibilityState === 'hidden' : false
  );
  const [preference, setPreferenceState] = useState<BatterySaverPreference>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREF) as BatterySaverPreference | null;
      if (saved === 'auto' || saved === 'always_on' || saved === 'off') {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return 'auto';
  });

  // Listen to Web Battery Status API (navigator.getBattery)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('getBattery' in navigator)) {
      setIsSupported(false);
      return;
    }

    let batteryRef: BatteryManagerEventTarget | null = null;
    let isMounted = true;

    const syncBatteryStatus = () => {
      if (!batteryRef || !isMounted) return;
      setHardwareLevel(Math.round((batteryRef.level ?? 1) * 100));
      setIsCharging(Boolean(batteryRef.charging));
      setChargingTime(
        Number.isFinite(batteryRef.chargingTime) ? batteryRef.chargingTime : null
      );
      setDischargingTime(
        Number.isFinite(batteryRef.dischargingTime) ? batteryRef.dischargingTime : null
      );
    };

    const navWithBattery = navigator as Navigator & {
      getBattery?: () => Promise<BatteryManagerEventTarget>;
    };

    if (typeof navWithBattery.getBattery === 'function') {
      navWithBattery
        .getBattery()
        .then((battery) => {
          if (!isMounted) return;
          batteryRef = battery;
          setIsSupported(true);
          syncBatteryStatus();

          battery.addEventListener('levelchange', syncBatteryStatus);
          battery.addEventListener('chargingchange', syncBatteryStatus);
          battery.addEventListener('chargingtimechange', syncBatteryStatus);
          battery.addEventListener('dischargingtimechange', syncBatteryStatus);
        })
        .catch(() => {
          if (isMounted) setIsSupported(false);
        });
    }

    return () => {
      isMounted = false;
      if (batteryRef) {
        batteryRef.removeEventListener('levelchange', syncBatteryStatus);
        batteryRef.removeEventListener('chargingchange', syncBatteryStatus);
        batteryRef.removeEventListener('chargingtimechange', syncBatteryStatus);
        batteryRef.removeEventListener('dischargingtimechange', syncBatteryStatus);
      }
    };
  }, []);

  // Listen to Page Visibility API (foreground / background state)
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsAppInBackground(document.visibilityState === 'hidden');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const setBatterySaverPreference = useCallback((pref: BatterySaverPreference) => {
    setPreferenceState(pref);
    batteryService.setPreference(pref);
  }, []);

  const setSimulatedBatteryLevel = useCallback((level: number | null) => {
    setSimulatedLevel(level);
    batteryService.setSimulatedBatteryLevel(level);
  }, []);

  return useMemo<UseBatteryStatusResult>(() => {
    const effectiveLevel = simulatedLevel !== null ? simulatedLevel : hardwareLevel;
    const effectiveCharging = simulatedLevel !== null ? false : isCharging;
    const isLowBattery = effectiveLevel < LOW_BATTERY_THRESHOLD && !effectiveCharging;
    const isModerateBattery =
      effectiveLevel >= LOW_BATTERY_THRESHOLD &&
      effectiveLevel <= MODERATE_BATTERY_THRESHOLD &&
      !effectiveCharging;

    let isBatterySaverActive = false;
    let activeReason: BatterySaverReason = null;

    if (preference === 'always_on') {
      isBatterySaverActive = true;
      activeReason = 'manual';
    } else if (preference === 'auto') {
      if (isLowBattery) {
        isBatterySaverActive = true;
        activeReason = 'low_battery';
      } else if (isAppInBackground) {
        isBatterySaverActive = true;
        activeReason = 'background';
      }
    }

    // Dynamic request frequency scaling based on charge level & visibility
    let jobPollingIntervalMs = NORMAL_JOB_POLL_MS;
    let locationUpdateIntervalMs = NORMAL_LOCATION_INTERVAL_MS;

    if (isBatterySaverActive) {
      jobPollingIntervalMs = ECO_JOB_POLL_MS; // 30s when <20%, background, or manual eco
      locationUpdateIntervalMs = ECO_LOCATION_INTERVAL_MS; // 60s
    } else if (preference === 'auto' && isModerateBattery) {
      jobPollingIntervalMs = MODERATE_JOB_POLL_MS; // 15s when 20%-35% discharging
      locationUpdateIntervalMs = MODERATE_LOCATION_INTERVAL_MS; // 30s
    }

    return {
      isSupported,
      batteryLevel: effectiveLevel,
      isCharging: effectiveCharging,
      chargingTime,
      dischargingTime,
      isLowBattery,
      isAppInBackground,
      preference,
      isBatterySaverActive,
      activeReason,
      jobPollingIntervalMs,
      locationUpdateIntervalMs,
      isSimulatedLowBattery: simulatedLevel !== null,
      setBatterySaverPreference,
      setSimulatedBatteryLevel
    };
  }, [
    isSupported,
    hardwareLevel,
    isCharging,
    chargingTime,
    dischargingTime,
    simulatedLevel,
    isAppInBackground,
    preference,
    setBatterySaverPreference,
    setSimulatedBatteryLevel
  ]);
}
