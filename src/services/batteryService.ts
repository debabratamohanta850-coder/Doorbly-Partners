/**
 * Battery & App Visibility Monitoring Service for Doorbly Partner
 * Dynamically adjusts live job polling and GPS frequency when:
 * 1. Device battery drops below 20% (and is not charging)
 * 2. App is placed in the background (document.visibilityState === 'hidden')
 * 3. Partner manually enables Battery Saver mode
 */

export type BatterySaverPreference = 'auto' | 'always_on' | 'off';
export type BatterySaverReason = 'low_battery' | 'background' | 'manual' | null;

export interface BatteryAndVisibilityState {
  batteryLevel: number; // 0 - 100
  isCharging: boolean;
  isLowBattery: boolean; // true when < 20% and not charging
  isAppInBackground: boolean;
  preference: BatterySaverPreference;
  isBatterySaverActive: boolean;
  activeReason: BatterySaverReason;
  jobPollingIntervalMs: number; // 5000ms normal vs 30000ms battery saver
  locationUpdateIntervalMs: number; // 15000ms normal vs 60000ms battery saver
  isSimulatedLowBattery: boolean;
}

interface BatteryManagerLike extends EventTarget {
  charging: boolean;
  level: number;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

const STORAGE_KEY_PREF = 'doorbly_partner_battery_saver_pref';

export const NORMAL_JOB_POLL_MS = 5000; // 5 seconds in active foreground mode
export const ECO_JOB_POLL_MS = 30000; // 30 seconds in battery-saving mode (<20% or background)

export const NORMAL_LOCATION_INTERVAL_MS = 15000; // 15 seconds normal GPS sync
export const ECO_LOCATION_INTERVAL_MS = 60000; // 60 seconds battery-saving GPS sync

export const LOW_BATTERY_THRESHOLD = 20; // 20%

class BatteryService {
  private hardwareBatteryLevel = 100;
  private simulatedBatteryLevel: number | null = null;
  private isCharging = false;
  private isAppInBackground = typeof document !== 'undefined' ? document.visibilityState === 'hidden' : false;
  private preference: BatterySaverPreference = 'auto';
  private listeners: Array<(state: BatteryAndVisibilityState) => void> = [];
  private batteryManager: BatteryManagerLike | null = null;

  constructor() {
    this.loadPreference();
    this.initBatteryMonitor();
    this.initVisibilityMonitor();
  }

  private loadPreference(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREF) as BatterySaverPreference | null;
      if (saved === 'auto' || saved === 'always_on' || saved === 'off') {
        this.preference = saved;
      }
    } catch {
      // ignore storage errors
    }
  }

  private async initBatteryMonitor(): Promise<void> {
    if (typeof navigator === 'undefined' || !('getBattery' in navigator)) {
      return;
    }

    try {
      const navWithBattery = navigator as Navigator & {
        getBattery?: () => Promise<BatteryManagerLike>;
      };
      if (typeof navWithBattery.getBattery !== 'function') return;

      const battery = await navWithBattery.getBattery();
      this.batteryManager = battery;

      const updateFromHardware = () => {
        this.hardwareBatteryLevel = Math.round((battery.level ?? 1) * 100);
        this.isCharging = Boolean(battery.charging);
        this.notifyListeners();
      };

      updateFromHardware();
      battery.addEventListener('levelchange', updateFromHardware);
      battery.addEventListener('chargingchange', updateFromHardware);
    } catch {
      // Browser does not allow Battery Status API or unsupported
    }
  }

  private initVisibilityMonitor(): void {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      const hidden = document.visibilityState === 'hidden';
      if (this.isAppInBackground !== hidden) {
        this.isAppInBackground = hidden;
        this.notifyListeners();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  public setPreference(pref: BatterySaverPreference): void {
    this.preference = pref;
    try {
      localStorage.setItem(STORAGE_KEY_PREF, pref);
    } catch {
      // ignore
    }
    this.notifyListeners();
  }

  /**
   * Allows testing < 20% battery threshold on desktop/charged devices
   */
  public setSimulatedBatteryLevel(level: number | null): void {
    this.simulatedBatteryLevel = level;
    this.notifyListeners();
  }

  public getState(): BatteryAndVisibilityState {
    const effectiveLevel =
      this.simulatedBatteryLevel !== null ? this.simulatedBatteryLevel : this.hardwareBatteryLevel;
    const effectiveCharging = this.simulatedBatteryLevel !== null ? false : this.isCharging;
    const isLowBattery = effectiveLevel < LOW_BATTERY_THRESHOLD && !effectiveCharging;

    let isBatterySaverActive = false;
    let activeReason: BatterySaverReason = null;

    if (this.preference === 'always_on') {
      isBatterySaverActive = true;
      activeReason = 'manual';
    } else if (this.preference === 'auto') {
      if (isLowBattery) {
        isBatterySaverActive = true;
        activeReason = 'low_battery';
      } else if (this.isAppInBackground) {
        isBatterySaverActive = true;
        activeReason = 'background';
      }
    }

    return {
      batteryLevel: effectiveLevel,
      isCharging: effectiveCharging,
      isLowBattery,
      isAppInBackground: this.isAppInBackground,
      preference: this.preference,
      isBatterySaverActive,
      activeReason,
      jobPollingIntervalMs: isBatterySaverActive ? ECO_JOB_POLL_MS : NORMAL_JOB_POLL_MS,
      locationUpdateIntervalMs: isBatterySaverActive ? ECO_LOCATION_INTERVAL_MS : NORMAL_LOCATION_INTERVAL_MS,
      isSimulatedLowBattery: this.simulatedBatteryLevel !== null
    };
  }

  public subscribe(listener: (state: BatteryAndVisibilityState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    const currentState = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(currentState);
      } catch (err) {
        console.warn('Battery listener notice:', err);
      }
    });
  }
}

export const batteryService = new BatteryService();
