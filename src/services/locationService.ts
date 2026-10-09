/**
 * Android location tracking and direct Google Maps URL navigation service for Doorbly Partner.
 * Uses zero paid Google Maps APIs, zero SDKs, and requires no API key.
 */

import { ServiceBooking } from '../types';

export interface GeoLocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

class LocationService {
  private watchId: number | null = null;
  private currentCoords: GeoLocationCoords | null = null;
  private listeners: Array<(coords: GeoLocationCoords) => void> = [];
  private isBatterySaver = false;
  private lastNotifiedAt = 0;

  /**
   * Switch GPS accuracy and broadcast throttling between normal (15s) and battery-saver (60s) modes
   */
  public setBatterySaverMode(enabled: boolean): void {
    if (this.isBatterySaver === enabled) return;
    this.isBatterySaver = enabled;

    // If currently tracking, restart watch with updated power profile
    if (this.watchId !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.initWatchPosition();
    }
  }

  /**
   * Request current position once
   */
  public async getCurrentPosition(): Promise<GeoLocationCoords> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation is not supported by your device'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: GeoLocationCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          this.currentCoords = coords;
          resolve(coords);
        },
        (error) => {
          let message = 'Location access denied or unavailable.';
          if (error.code === error.PERMISSION_DENIED) {
            message = 'Location permission is required to go Online and receive nearby service requests.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = 'GPS signal unavailable. Please ensure location is enabled.';
          } else if (error.code === error.TIMEOUT) {
            message = 'Location request timed out. Please try again.';
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: !this.isBatterySaver,
          timeout: 15000,
          maximumAge: this.isBatterySaver ? 60000 : 30000
        }
      );
    });
  }

  /**
   * Start tracking location when Online
   */
  public startTracking(onUpdate: (coords: GeoLocationCoords) => void): void {
    this.addListener(onUpdate);

    if (this.watchId !== null) return;
    if (!('geolocation' in navigator)) return;

    this.initWatchPosition();
  }

  private initWatchPosition(): void {
    if (!('geolocation' in navigator)) return;

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords: GeoLocationCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        this.currentCoords = coords;

        const now = Date.now();
        const minIntervalMs = this.isBatterySaver ? 60000 : 15000;
        if (now - this.lastNotifiedAt >= minIntervalMs) {
          this.lastNotifiedAt = now;
          this.notifyListeners(coords);
        }
      },
      (error) => {
        console.warn('Location watch warning:', error.message);
      },
      {
        enableHighAccuracy: !this.isBatterySaver,
        timeout: this.isBatterySaver ? 30000 : 20000,
        maximumAge: this.isBatterySaver ? 45000 : 10000
      }
    );
  }

  /**
   * Stop tracking immediately when going Offline
   */
  public stopTracking(): void {
    if (this.watchId !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.listeners = [];
  }

  public getCachedCoords(): GeoLocationCoords | null {
    return this.currentCoords;
  }

  public addListener(fn: (coords: GeoLocationCoords) => void): () => void {
    this.listeners.push(fn);
    if (this.currentCoords) {
      fn(this.currentCoords);
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notifyListeners(coords: GeoLocationCoords): void {
    this.listeners.forEach(fn => {
      try {
        fn(coords);
      } catch (e) {
        console.error('Error in location listener', e);
      }
    });
  }

  /**
   * Calculate distance between two coordinates using Haversine formula (km)
   */
  public calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return Math.round(d * 10) / 10;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Build the direct Google Maps navigation URL without any API key or paid SDK.
   * Format: https://www.google.com/maps/dir/?api=1&destination=LATITUDE,LONGITUDE
   * Prefers coordinates over text address; falls back to URL-encoded address if coordinates are unavailable.
   */
  public buildGoogleMapsUrl(
    latitude?: number | null,
    longitude?: number | null,
    addressFallback?: string | null
  ): string {
    const hasValidCoords =
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      (latitude !== 0 || longitude !== 0);

    if (hasValidCoords) {
      return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    }

    const cleanAddress = (addressFallback || '').trim();
    if (cleanAddress) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cleanAddress)}`;
    }

    return 'https://www.google.com/maps';
  }

  /**
   * Get the direct Google Maps URL for a ServiceBooking record.
   * Supports both (customer_latitude, customer_longitude, customer_address)
   * and (latitude, longitude, customer_location_address).
   */
  public getBookingNavigationUrl(booking?: Partial<ServiceBooking> | null): string {
    if (!booking) return 'https://www.google.com/maps';
    const lat = booking.customer_latitude ?? booking.latitude;
    const lng = booking.customer_longitude ?? booking.longitude;
    const addr = booking.customer_address || booking.customer_location_address;
    return this.buildGoogleMapsUrl(lat, lng, addr);
  }

  /**
   * Get the display address for a booking
   */
  public getBookingDisplayAddress(booking?: Partial<ServiceBooking> | null): string {
    if (!booking) return '';
    return booking.customer_address || booking.customer_location_address || 'Customer Location';
  }

  /**
   * Get formatted GPS Location text (Address + GPS Coordinates)
   */
  public getBookingGpsLocationText(booking?: Partial<ServiceBooking> | null): string {
    if (!booking) return '';
    const addr = booking.customer_address || booking.customer_location_address || '';
    const lat = booking.customer_latitude ?? booking.latitude;
    const lng = booking.customer_longitude ?? booking.longitude;
    const hasCoords =
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      (lat !== 0 || lng !== 0);

    if (hasCoords && addr) {
      return `${addr} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    }
    if (hasCoords) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
    return addr || 'GPS Location Unavailable';
  }

  /**
   * Capture the booking's GPS location (copy to clipboard & auto-paste into public Google Maps URL)
   */
  public captureAndOpenGoogleMaps(booking?: Partial<ServiceBooking> | null): void {
    if (!booking) return;
    const lat = booking.customer_latitude ?? booking.latitude;
    const lng = booking.customer_longitude ?? booking.longitude;
    const addr = booking.customer_address || booking.customer_location_address || '';
    const hasCoords =
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      (lat !== 0 || lng !== 0);

    const capturedLocation = hasCoords ? `${lat},${lng}` : addr;
    if (capturedLocation && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(capturedLocation).catch(() => {});
    }

    const url = this.getBookingNavigationUrl(booking);
    this.launchExternalMapUrl(url);
  }

  /**
   * Open Google Maps directly on the partner's device (native Google Maps app on Android/iOS,
   * or browser fallback if the app is not installed).
   */
  public openNavigation(
    latitude?: number | null,
    longitude?: number | null,
    addressFallback?: string | null
  ): void {
    const url = this.buildGoogleMapsUrl(latitude, longitude, addressFallback);
    this.launchExternalMapUrl(url);
  }

  /**
   * Open Google Maps navigation directly for a booking object.
   */
  public openBookingNavigation(booking?: Partial<ServiceBooking> | null): void {
    const url = this.getBookingNavigationUrl(booking);
    this.launchExternalMapUrl(url);
  }

  private launchExternalMapUrl(url: string): void {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
}

export const locationService = new LocationService();
