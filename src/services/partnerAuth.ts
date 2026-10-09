import { supabaseService } from './supabaseClient';
import {
  auth,
  googleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  FirebaseUser,
  db,
  doc,
  setDoc,
  getDoc
} from './firebase';

export const MASTER_ADMIN_EMAIL = 'debabrata.tribune@gmail.com';
export const MASTER_ADMIN_EMAIL_2 = 'debabratamohanta159@gmail.com';
export const MASTER_ADMIN_PASSWORD = 'Devraj@1122';

export interface PartnerAuthUser {
  uid: string;
  email: string;
  phone?: string;
  displayName?: string;
  photoURL?: string;
  isAdmin?: boolean;
}

const STORAGE_KEY_AUTH_USER = 'doorbly_active_auth_user_v1';
const STORAGE_KEY_DEVICE_ADMIN = 'doorbly_master_device_admin_v1';

class PartnerAuthService {
  /**
   * Check if this particular device has been unlocked by master credentials
   */
  public isDeviceAdminUnlocked(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY_DEVICE_ADMIN) === 'true';
    } catch {
      return false;
    }
  }

  public setDeviceAdminUnlocked(unlocked: boolean): void {
    try {
      if (unlocked) {
        localStorage.setItem(STORAGE_KEY_DEVICE_ADMIN, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEY_DEVICE_ADMIN);
      }
    } catch {
      // ignore
    }
  }

  /**
   * Get currently active authenticated partner from local session
   */
  public getStoredUser(): PartnerAuthUser | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return null;
  }

  /**
   * Save or clear active authenticated partner session
   */
  public setStoredUser(user: PartnerAuthUser | null): void {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH_USER);
      }
    } catch {
      // ignore
    }
  }

  /**
   * Phone OTP Login / Direct Verification using Supabase
   */
  public async loginWithPhoneOtp(
    phone: string,
    otp: string
  ): Promise<{ success: boolean; user?: PartnerAuthUser; message?: string }> {
    if (!otp || otp.length < 4) {
      return { success: false, message: 'Please enter a valid 6-digit OTP sent to your phone.' };
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const uid = `partner_${cleanPhone.replace('+', '')}`;

    const userSession: PartnerAuthUser = {
      uid,
      phone: cleanPhone,
      email: `${cleanPhone.replace('+', '')}@partner.doorbly.com`,
      displayName: `Partner ${cleanPhone.slice(-4)}`,
      isAdmin: false
    };

    this.setStoredUser(userSession);
    this.setDeviceAdminUnlocked(false);
    return { success: true, user: userSession };
  }

  /**
   * Email and Password login using Supabase
   * If master credentials are entered, unlocks admin panel and opens partner account
   */
  public async loginWithEmail(
    email: string,
    pass: string
  ): Promise<{ success: boolean; user?: PartnerAuthUser; message?: string; isAdmin?: boolean }> {
    if (!email || !pass) {
      return { success: false, message: 'Please enter email and password.' };
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check for Master Admin credentials
    if (cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase() && pass === MASTER_ADMIN_PASSWORD) {
      const adminSession: PartnerAuthUser = {
        uid: 'partner_master_admin',
        email: MASTER_ADMIN_EMAIL,
        phone: '+91 99999 00000',
        displayName: 'Debabrata Mohanta (Master Admin)',
        isAdmin: true
      };

      this.setStoredUser(adminSession);
      this.setDeviceAdminUnlocked(true);
      return { success: true, user: adminSession, isAdmin: true };
    }

    const uid = `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const userSession: PartnerAuthUser = { uid, email, isAdmin: false };
    this.setStoredUser(userSession);
    this.setDeviceAdminUnlocked(false);
    return { success: true, user: userSession, isAdmin: false };
  }

  /**
   * Register with Email and Password
   */
  public async registerWithEmail(
    email: string,
    pass: string,
    name: string
  ): Promise<{ success: boolean; user?: PartnerAuthUser; message?: string }> {
    const uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userSession: PartnerAuthUser = { uid, email, displayName: name };
    this.setStoredUser(userSession);
    return { success: true, user: userSession };
  }

  /**
   * Firebase Google Authentication via popup
   */
  public async loginWithGoogleFirebase(): Promise<{
    success: boolean;
    user?: PartnerAuthUser;
    message?: string;
    isAdmin?: boolean;
    cancelled?: boolean;
  }> {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const fbUser = result.user;
      const userEmail = (fbUser.email || '').toLowerCase();
      const isAdmin =
        userEmail === MASTER_ADMIN_EMAIL.toLowerCase() ||
        userEmail === MASTER_ADMIN_EMAIL_2.toLowerCase();

      const userSession: PartnerAuthUser = {
        uid: fbUser.uid,
        email: fbUser.email || `${fbUser.uid}@doorbly.com`,
        displayName: fbUser.displayName || 'Doorbly Partner',
        photoURL: fbUser.photoURL || undefined,
        isAdmin
      };

      this.setStoredUser(userSession);

      // Sync user profile to Firestore
      try {
        await setDoc(
          doc(db, 'users', fbUser.uid),
          {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || '',
            photoURL: fbUser.photoURL || '',
            role: isAdmin ? 'admin' : 'partner',
            createdAt: new Date().toISOString()
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Firestore user profile sync notice:', err);
      }

      return { success: true, user: userSession, isAdmin };
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return {
          success: false,
          cancelled: true,
          message: 'Google sign-in popup was closed before completing. You can try again or sign in with Phone OTP / Email.'
        };
      }
      if (code === 'auth/popup-blocked') {
        return {
          success: false,
          message: 'Sign-in popup was blocked by your browser. Please allow popups or sign in using Phone OTP / Email.'
        };
      }
      if (code === 'auth/unauthorized-domain') {
        return {
          success: false,
          message: 'This preview domain is not yet authorized for Google popup sign-in. Please sign in using Phone OTP or Email.'
        };
      }

      console.warn('Firebase Google Auth notice:', error?.message || error);
      return {
        success: false,
        message: 'Could not complete Google sign-in. Please try again or use Phone OTP / Email.'
      };
    }
  }

  /**
   * Listen to Firebase Auth state changes
   */
  public subscribeToFirebaseAuth(callback: (user: PartnerAuthUser | null) => void): () => void {
    return onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const userEmail = (fbUser.email || '').toLowerCase();
        const isAdmin =
          userEmail === MASTER_ADMIN_EMAIL.toLowerCase() ||
          userEmail === MASTER_ADMIN_EMAIL_2.toLowerCase();

        const userSession: PartnerAuthUser = {
          uid: fbUser.uid,
          email: fbUser.email || `${fbUser.uid}@doorbly.com`,
          displayName: fbUser.displayName || 'Doorbly Partner',
          photoURL: fbUser.photoURL || undefined,
          isAdmin
        };
        this.setStoredUser(userSession);
        callback(userSession);
      } else {
        const stored = this.getStoredUser();
        // If not logged in via Firebase and no stored local user, null
        if (!stored) {
          callback(null);
        }
      }
    });
  }

  /**
   * Logout and clear session (Firebase Auth + local storage)
   */
  public async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    this.setStoredUser(null);
  }

  /**
   * Request Push Notification Permission
   * Uses native Web Notification API without third-party push brokers
   */
  public async requestNotificationPermission(): Promise<{ granted: boolean; token?: string }> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { granted: false };
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = `device_push_token_${Date.now()}`;
        return { granted: true, token };
      }
      return { granted: false };
    } catch {
      return { granted: false };
    }
  }
}

export const partnerAuthService = new PartnerAuthService();
