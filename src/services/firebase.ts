import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocFromServer,
  collection
} from 'firebase/firestore';
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported as isMessagingSupported,
  Messaging,
  MessagePayload
} from 'firebase/messaging';

export interface DoorblyFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const STORAGE_KEY_FIREBASE_CONFIG = 'doorbly_firebase_config_v1';

export const DEFAULT_FIREBASE_CONFIG: DoorblyFirebaseConfig = {
  apiKey: 'AIzaSyDgF1AvQ5eQtuAfnCtqezLPLNHLoPJ9i1I',
  authDomain: 'doorbly-b0bba.firebaseapp.com',
  projectId: 'doorbly-b0bba',
  storageBucket: 'doorbly-b0bba.firebasestorage.app',
  messagingSenderId: '977376808906',
  appId: '1:977376808906:web:caf01942d3773fb85d4933'
};

export function getSavedFirebaseConfig(): DoorblyFirebaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.apiKey && parsed.projectId && parsed.appId) {
        return { ...DEFAULT_FIREBASE_CONFIG, ...parsed };
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(config: DoorblyFirebaseConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export const firebaseConfig: DoorblyFirebaseConfig = getSavedFirebaseConfig();

export const FCM_VAPID_KEY =
  'BFP-5qoHGevfo94FE9-icWu1FkXPSlyZy0By_yvNNcp8YKdNrpUnLGmJJ_fWftzk_hZHBeLlsi6dI8HryvuvDL0';

// Suppress noisy internal @firebase/firestore WebChannel reconnect errors in iframe preview environments
try {
  setLogLevel('silent');
} catch {
  // ignore
}

// Initialize Firebase App
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with long-polling auto-detection for iframe/proxy compatibility
function createFirestoreInstance() {
  try {
    return initializeFirestore(firebaseApp, {
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true
    });
  } catch {
    return getFirestore(firebaseApp);
  }
}

export const db = createFirestoreInstance();

// Initialize Firebase Auth
export const auth = getAuth(firebaseApp);
export const googleAuthProvider = new GoogleAuthProvider();

// Error Handling Infrastructure per Firebase Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test utility
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    if (!auth.currentUser) {
      return true;
    }
    await getDoc(doc(db, 'users', auth.currentUser.uid));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection notice: client is offline');
    }
    return false;
  }
}

// Firebase Cloud Messaging (FCM) Web Push Integration
const STORAGE_KEY_FCM_TOKEN = 'doorbly_partner_fcm_token_v1';
let messagingInstance: Messaging | null = null;

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;
  try {
    const supported = await isMessagingSupported();
    if (!supported) return null;
    messagingInstance = getMessaging(firebaseApp);
    return messagingInstance;
  } catch {
    return null;
  }
}

export function getSavedFcmToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_FCM_TOKEN);
  } catch {
    return null;
  }
}

export async function requestFcmPushToken(): Promise<{
  success: boolean;
  token: string | null;
  message: string;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      success: false,
      token: null,
      message: 'Push notifications are not supported by this browser.'
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        token: null,
        message: 'Notification permission was denied by the browser.'
      };
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return {
        success: false,
        token: null,
        message: 'Firebase Cloud Messaging is not supported in this browser context.'
      };
    }

    let swRegistration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      } catch {
        swRegistration = await navigator.serviceWorker.ready;
      }
    }

    const token = await getToken(messaging, {
      vapidKey: FCM_VAPID_KEY,
      serviceWorkerRegistration: swRegistration
    });

    if (token) {
      try {
        localStorage.setItem(STORAGE_KEY_FCM_TOKEN, token);
      } catch {
        // ignore storage errors
      }
      return {
        success: true,
        token,
        message: 'Firebase Cloud Messaging push token registered!'
      };
    }

    return {
      success: false,
      token: null,
      message: 'No FCM registration token was returned.'
    };
  } catch (err: unknown) {
    return {
      success: false,
      token: null,
      message: err instanceof Error ? err.message : 'Failed to obtain FCM push token.'
    };
  }
}

export async function subscribeToForegroundFcmMessages(
  onPayload: (payload: MessagePayload) => void
): Promise<() => void> {
  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    return () => {};
  }
  const unsubscribe = onMessage(messaging, (payload) => {
    onPayload(payload);
  });
  return unsubscribe;
}

// Re-export common Auth helpers
export {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection
};
export type { FirebaseUser, MessagePayload };

