import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  PartnerProfile,
  PartnerMembership,
  ServiceBooking,
  JobRequestAlert,
  WalletSummary,
  NotificationItem,
  SupportTicket,
  BookingStatus
} from '../types';
import { supabaseService } from '../services/supabaseClient';
import { supabaseDataEngine, DataEngineStats, SyncSpeedMode } from '../services/supabaseDataEngine';
import { partnerAuthService } from '../services/partnerAuth';
import { locationService, GeoLocationCoords } from '../services/locationService';
import { soundService } from '../services/soundAndVibrate';
import { BatterySaverPreference } from '../services/batteryService';
import { useBatteryStatus, UseBatteryStatusResult } from '../hooks/useBatteryStatus';
import { subscribeToForegroundFcmMessages } from '../services/firebase';

export type NavigationTab =
  | 'home'
  | 'jobs'
  | 'wallet'
  | 'earnings'
  | 'membership'
  | 'services'
  | 'notifications'
  | 'profile'
  | 'documents'
  | 'guidelines'
  | 'support'
  | 'settings';

interface PartnerContextType {
  partner: PartnerProfile | null;
  membership: PartnerMembership | null;
  isOnline: boolean;
  isLoading: boolean;
  activeTab: NavigationTab;
  location: GeoLocationCoords | null;
  locationError: string | null;
  wallet: WalletSummary;
  activeJob: ServiceBooking | null;
  incomingRequest: JobRequestAlert | null;
  notifications: NotificationItem[];
  myJobs: ServiceBooking[];
  supportTickets: SupportTicket[];
  unreadNotificationCount: number;
  isAdminUnlocked: boolean;
  viewMode: 'partner' | 'admin';
  batteryState: UseBatteryStatusResult;
  lastJobPollTime: string | null;
  dataEngineStats: DataEngineStats;
  
  // Actions
  setDataEngineMode: (mode: SyncSpeedMode) => void;
  setViewMode: (mode: 'partner' | 'admin') => void;
  lockAdmin: () => void;
  setActiveTab: (tab: NavigationTab) => void;
  goBack: () => void;
  toggleOnline: (targetState?: boolean) => Promise<{ success: boolean; message: string }>;
  setBatterySaverPreference: (pref: BatterySaverPreference) => void;
  setSimulatedBatteryLevel: (level: number | null) => void;
  acceptIncomingJob: () => Promise<boolean>;
  rejectIncomingJob: () => void;
  updateActiveJobStatus: (status: BookingStatus, extra?: { otp?: string; notes?: string }) => Promise<boolean>;
  refreshAll: () => Promise<void>;
  updatePartner: (updated: Partial<PartnerProfile>) => Promise<boolean>;
  updateMembership: (status: 'active' | 'expired' | 'pending') => Promise<void>;
  requestWithdrawal: (amount: number, bank: string, ifsc: string, holder: string) => Promise<{ success: boolean; message: string }>;
  createSupportTicket: (ticket: Omit<SupportTicket, 'id' | 'created_at' | 'partner_id'>) => Promise<boolean>;
  markNotificationRead: (id: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const PartnerContext = createContext<PartnerContextType | null>(null);

const DEFAULT_WALLET: WalletSummary = {
  available_balance: 0,
  pending_amount: 0,
  today_earnings: 0,
  week_earnings: 0,
  month_earnings: 0,
  today_completed_jobs: 0,
  total_completed_jobs: 0
};

export const PartnerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [membership, setMembership] = useState<PartnerMembership | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTabState] = useState<NavigationTab>('home');
  const tabHistoryRef = useRef<NavigationTab[]>([]);

  const setActiveTab = useCallback((nextTab: NavigationTab) => {
    setActiveTabState((prevTab) => {
      if (prevTab !== nextTab) {
        tabHistoryRef.current.push(prevTab);
      }
      return nextTab;
    });
  }, []);

  const goBack = useCallback(() => {
    window.dispatchEvent(new CustomEvent('doorbly-close-modals'));
    if (tabHistoryRef.current.length > 0) {
      const previousTab = tabHistoryRef.current.pop() || 'home';
      setActiveTabState(previousTab);
    } else if (activeTab !== 'home') {
      setActiveTabState('home');
    }
  }, [activeTab]);
  const [location, setLocation] = useState<GeoLocationCoords | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletSummary>(DEFAULT_WALLET);
  const [activeJob, setActiveJob] = useState<ServiceBooking | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<JobRequestAlert | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [myJobs, setMyJobs] = useState<ServiceBooking[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(partnerAuthService.isDeviceAdminUnlocked());
  const [viewMode, setViewMode] = useState<'partner' | 'admin'>(
    partnerAuthService.isDeviceAdminUnlocked() ? 'admin' : 'partner'
  );
  const [lastJobPollTime, setLastJobPollTime] = useState<string | null>(null);
  const [dataEngineStats, setDataEngineStats] = useState<DataEngineStats>(() => supabaseDataEngine.getStats());
  const seenBookingIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return supabaseDataEngine.subscribeStats((stats) => {
      setDataEngineStats(stats);
    });
  }, []);

  const setDataEngineMode = useCallback((mode: SyncSpeedMode) => {
    supabaseDataEngine.setMode(mode);
  }, []);

  // Use the Battery Status API hook to monitor device charge levels and visibility
  const batteryState = useBatteryStatus();
  const { setBatterySaverPreference, setSimulatedBatteryLevel } = batteryState;

  // Sync GPS power profile with batteryState.isBatterySaverActive
  useEffect(() => {
    locationService.setBatterySaverMode(batteryState.isBatterySaverActive);
  }, [batteryState.isBatterySaverActive]);

  const lockAdmin = () => {
    partnerAuthService.setDeviceAdminUnlocked(false);
    setIsAdminUnlocked(false);
    setViewMode('partner');
  };

  // Load active partner from auth session
  const initPartnerSession = useCallback(async () => {
    setIsLoading(true);
    const unlocked = partnerAuthService.isDeviceAdminUnlocked();
    setIsAdminUnlocked(unlocked);

    const authUser = partnerAuthService.getStoredUser();
    if (authUser) {
      const partnerId = authUser.uid;
      let profile = await supabaseService.getPartnerProfile(partnerId);

      const isMaster =
        unlocked ||
        authUser.email === 'debabrata.tribune@gmail.com' ||
        authUser.email === 'debabratamohanta159@gmail.com' ||
        authUser.uid === 'partner_master_admin';

      if (!profile) {
        // Initialize fresh partner profile
        profile = {
          id: partnerId,
          auth_id: partnerId,
          name: isMaster ? 'Debabrata Mohanta' : (authUser.displayName || 'Doorbly Partner'),
          mobile: isMaster ? '+91 99999 00000' : (authUser.phone || '+91 98765 43210'),
          email: authUser.email || 'partner@doorbly.com',
          photo_url: authUser.photoURL || undefined,
          address: isMaster ? 'Executive Operations Command' : 'Service Sector 1',
          district: 'Central',
          city: 'Metro City',
          pin_code: '751001',
          primary_category: 'AC Services',
          services_offered: ['srv_ac_foam_jet', 'srv_ac_repair', 'srv_ac_gas', 'srv_elec_switch'],
          years_experience: 5,
          skills: ['Master Technician', 'Operations Lead'],
          working_area: 'All Zones',
          preferred_radius_km: 20,
          languages: ['English', 'Hindi'],
          status: isMaster ? 'approved' : 'pending_verification',
          is_online: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await supabaseService.upsertPartnerProfile(profile);
      } else {
        if (authUser.photoURL && !profile.photo_url) {
          profile.photo_url = authUser.photoURL;
        }
        if (isMaster && profile.status !== 'approved') {
          profile.status = 'approved';
          await supabaseService.upsertPartnerProfile(profile);
        }
      }

      setPartner(profile);
      if (profile.status !== 'approved' && profile.is_online) {
        profile.is_online = false;
        await supabaseService.updatePartnerAvailability(partnerId, false);
      }
      setIsOnline(profile.status === 'approved' ? Boolean(profile.is_online) : false);

      // Fetch membership
      let mem = await supabaseService.getMembership(partnerId);
      if (!mem) {
        mem = {
          id: `mem_${partnerId}`,
          partner_id: partnerId,
          plan_name: 'Monthly Doorbly Partner Membership',
          monthly_fee: 370,
          status: 'active',
          start_date: new Date().toISOString(),
          expiry_date: new Date(Date.now() + 30 * 86400000).toISOString(),
          payment_status: 'paid',
          payment_reference: 'PRE-ACTIVATED'
        };
        await supabaseService.updateMembership(mem);
      }
      setMembership(mem);
    } else {
      setPartner(null);
      setMembership(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initPartnerSession();
    const unsub = partnerAuthService.subscribeToFirebaseAuth((user) => {
      if (user) {
        initPartnerSession();
      }
    });
    return () => unsub();
  }, [initPartnerSession]);

  // Fetch partner dynamic data
  const refreshAll = useCallback(async () => {
    if (!partner) return;

    try {
      const [latestProfile, wSummary, active, jobsList, notifs, tickets, mem] = await Promise.all([
        supabaseService.getPartnerProfile(partner.id),
        supabaseService.getWalletSummary(partner.id),
        supabaseService.getActiveJob(partner.id),
        supabaseService.getPartnerJobs(partner.id),
        supabaseService.getNotifications(partner.id),
        supabaseService.getSupportTickets(partner.id),
        supabaseService.getMembership(partner.id)
      ]);

      if (latestProfile) {
        setPartner(latestProfile);
        if (latestProfile.status !== 'approved' && isOnline) {
          locationService.stopTracking();
          await supabaseService.updatePartnerAvailability(partner.id, false);
          setIsOnline(false);
        }
      }

      setWallet(wSummary);
      setActiveJob(active);
      setMyJobs(jobsList);
      setNotifications(notifs);
      setSupportTickets(tickets);
      if (mem) setMembership(mem);
    } catch (e) {
      console.warn('Error refreshing data:', e);
    }
  }, [partner, isOnline]);

  useEffect(() => {
    if (partner) {
      refreshAll();
    }
  }, [partner?.id]);

  // Subscribe to real-time backend updates for this partner via Turbo Engine Delta Hydration
  useEffect(() => {
    if (!partner?.id) return;
    const unsubscribePartnerSync = supabaseService.subscribeToPartnerRealtimeSync(
      partner.id,
      (delta) => {
        if (delta) {
          if (delta.profile) {
            setPartner(delta.profile);
            if (delta.profile.status !== 'approved' && isOnline) {
              locationService.stopTracking();
              void supabaseService.updatePartnerAvailability(partner.id, false);
              setIsOnline(false);
            }
          }
          if (delta.membership) {
            setMembership(delta.membership);
          }
          if (delta.notification) {
            soundService.playJobAlertChime();
            setNotifications((prev) => [delta.notification!, ...prev.filter((n) => n.id !== delta.notification!.id)]);
          }
          return;
        }
        refreshAll();
      }
    );
    return () => {
      unsubscribePartnerSync();
    };
  }, [partner?.id, isOnline, refreshAll]);

  // Listen for foreground Firebase Cloud Messaging (FCM) push notifications
  useEffect(() => {
    if (!partner) return;
    let unsubscribeFcm: (() => void) | null = null;
    let active = true;

    subscribeToForegroundFcmMessages((payload) => {
      if (!active) return;
      const title = payload.notification?.title || 'Doorbly Push Alert';
      const body = payload.notification?.body || 'You have a new update in Doorbly Partner.';
      soundService.playJobAlertChime();
      const newNotif: NotificationItem = {
        id: `FCM-${Date.now()}`,
        partner_id: partner.id,
        title,
        message: body,
        type: 'NEW_SERVICE_REQUEST',
        is_read: false,
        created_at: new Date().toISOString()
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }).then((unsub) => {
      if (active) {
        unsubscribeFcm = unsub;
      } else {
        unsub();
      }
    });

    return () => {
      active = false;
      if (unsubscribeFcm) unsubscribeFcm();
    };
  }, [partner]);

  // Handle incoming request countdown timer
  useEffect(() => {
    if (!incomingRequest) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((incomingRequest.expires_at - now) / 1000));
      if (remaining <= 0) {
        soundService.stopIncomingLoop();
        setIncomingRequest(null);
      } else {
        setIncomingRequest(prev => prev ? { ...prev, expires_in_seconds: remaining } : null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [incomingRequest]);

  // Toggle Online/Offline
  const toggleOnline = async (targetState?: boolean): Promise<{ success: boolean; message: string }> => {
    if (!partner) {
      return { success: false, message: 'Please log in to change availability status.' };
    }

    const nextState = targetState !== undefined ? targetState : !isOnline;

    if (nextState) {
      // Check 0: Fetch latest partner profile and registration status from Supabase
      const idVerification = await supabaseService.verifyPartnerIdRegistration(partner.id);
      const latestProfile = idVerification.profile || partner;
      if (idVerification.profile) {
        setPartner(idVerification.profile);
      }

      if (!idVerification.registered) {
        return {
          success: false,
          message:
            idVerification.message ||
            `Partner ID "${partner.id}" is not registered with Doorbly. Only approved partners can go Online.`
        };
      }

      // Check 1: Strict enforcement — ONLY approved partners can go Online
      if (latestProfile.status !== 'approved') {
        return {
          success: false,
          message: `Only approved partners are allowed to go Online. Your account status is currently "${latestProfile.status.replace('_', ' ')}". Please wait for Admin approval.`
        };
      }

      // Check 2: Membership must be active
      if (!membership || membership.status !== 'active') {
        setActiveTab('membership');
        return {
          success: false,
          message: 'Active ₹370 monthly Doorbly Partner membership is required to go Online.'
        };
      }

      // Check 3: Location permission
      try {
        const coords = await locationService.getCurrentPosition();
        setLocation(coords);
        setLocationError(null);

        // Start continuous tracking
        locationService.startTracking((updatedCoords) => {
          setLocation(updatedCoords);
          supabaseService.updatePartnerAvailability(
            partner.id,
            true,
            updatedCoords.latitude,
            updatedCoords.longitude
          );
        });

        // Update database
        await supabaseService.updatePartnerAvailability(partner.id, true, coords.latitude, coords.longitude);
        setIsOnline(true);
        setPartner(prev => prev ? { ...prev, is_online: true, current_lat: coords.latitude, current_lng: coords.longitude } : null);

        soundService.playSuccessTone();
        return { success: true, message: "You're Online! Looking for nearby doorstep service requests..." };
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Location permission denied.';
        setLocationError(errMsg);
        return { success: false, message: errMsg };
      }
    } else {
      // Going offline
      // Prevent accidental offline if active job is in progress
      if (activeJob && (activeJob.status === 'ASSIGNED' || activeJob.status === 'ARRIVED' || activeJob.status === 'IN_PROGRESS')) {
        return {
          success: false,
          message: 'You have an active doorstep service in progress. Please complete or update the job before going offline.'
        };
      }

      locationService.stopTracking();
      await supabaseService.updatePartnerAvailability(partner.id, false);
      setIsOnline(false);
      setPartner(prev => prev ? { ...prev, is_online: false } : null);
      if (incomingRequest) {
        soundService.stopIncomingLoop();
        setIncomingRequest(null);
      }
      return { success: true, message: "You're now Offline. You will not receive new service requests." };
    }
  };

  // Helper to evaluate and trigger an incoming booking alert
  const evaluateBookingForAlert = useCallback(
    (candidateBooking: ServiceBooking) => {
      if (!partner || activeJob) return false;
      if (candidateBooking.status !== 'SEARCHING_PARTNER' && candidateBooking.status !== 'REQUEST_SENT') {
        return false;
      }
      if (seenBookingIdsRef.current.has(candidateBooking.id)) {
        return false;
      }

      const partnerOffersService =
        partner.services_offered.some(
          (s) =>
            s.toLowerCase().includes(candidateBooking.service_category.toLowerCase()) ||
            candidateBooking.service_name.toLowerCase().includes(s.toLowerCase())
        ) || true;

      if (!partnerOffersService) return false;

      let dist = 2.4;
      if (location && candidateBooking.latitude && candidateBooking.longitude) {
        dist = locationService.calculateDistanceKm(
          location.latitude,
          location.longitude,
          candidateBooking.latitude,
          candidateBooking.longitude
        );
      }

      if (dist <= (partner.preferred_radius_km || 15)) {
        seenBookingIdsRef.current.add(candidateBooking.id);
        const reqAlert: JobRequestAlert = {
          booking: { ...candidateBooking, distance_km: dist },
          request_id: `req_${Date.now()}`,
          expires_in_seconds: 25,
          expires_at: Date.now() + 25000
        };
        setIncomingRequest(reqAlert);
        soundService.startIncomingLoop();
        return true;
      }
      return false;
    },
    [partner, activeJob, location]
  );

  // Realtime subscription when Online
  useEffect(() => {
    if (!isOnline || !partner) return;

    const unsubscribe = supabaseService.subscribeToRealtimeBookings(
      (newBooking) => {
        evaluateBookingForAlert(newBooking);
      },
      (updatedBooking) => {
        // Status changes on booking
        if (activeJob && updatedBooking.id === activeJob.id) {
          setActiveJob(updatedBooking);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOnline, partner, activeJob, evaluateBookingForAlert]);

  // Adaptive Job Request Polling Loop accelerated by Supabase Turbo Engine
  useEffect(() => {
    if (!isOnline || !partner || activeJob) return;

    let isCancelled = false;
    const pollIntervalMs = supabaseDataEngine.getEffectiveJobPollIntervalMs(batteryState.jobPollingIntervalMs);

    const runJobPoll = async () => {
      if (isCancelled || incomingRequest) return;
      try {
        const openRequests = await supabaseService.pollOpenJobRequests();
        if (isCancelled) return;
        setLastJobPollTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

        for (const req of openRequests) {
          const triggered = evaluateBookingForAlert(req);
          if (triggered) break;
        }
      } catch (err) {
        console.warn('Adaptive job polling notice:', err);
      }
    };

    // Run initial poll then schedule at the Turbo / adaptive interval
    runJobPoll();
    const intervalId = setInterval(runJobPoll, pollIntervalMs);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [isOnline, partner, activeJob, incomingRequest, batteryState.jobPollingIntervalMs, dataEngineStats.mode, evaluateBookingForAlert]);

  // Accept incoming job
  const acceptIncomingJob = async (): Promise<boolean> => {
    if (!incomingRequest || !partner) return false;

    soundService.stopIncomingLoop();
    const result = await supabaseService.acceptJob(incomingRequest.booking.id, partner.id);

    if (result.success && result.booking) {
      soundService.playSuccessTone();
      setActiveJob(result.booking);
      setIncomingRequest(null);
      await refreshAll();
      return true;
    } else {
      alert(result.message || 'This service request has already been assigned.');
      setIncomingRequest(null);
      return false;
    }
  };

  // Reject incoming job
  const rejectIncomingJob = () => {
    soundService.stopIncomingLoop();
    setIncomingRequest(null);
  };

  // Update active job status
  const updateActiveJobStatus = async (
    status: BookingStatus,
    extra?: { otp?: string; notes?: string }
  ): Promise<boolean> => {
    if (!activeJob || !partner) return false;

    const res = await supabaseService.updateJobStatus(activeJob.id, partner.id, status, extra);
    if (res.success && res.booking) {
      soundService.playSuccessTone();
      if (status === 'COMPLETED') {
        setActiveJob(null);
      } else {
        setActiveJob(res.booking);
      }
      await refreshAll();
      return true;
    } else {
      alert(res.message || 'Failed to update job status.');
      return false;
    }
  };

  // Update partner profile
  const updatePartner = async (updated: Partial<PartnerProfile>): Promise<boolean> => {
    if (!partner) return false;
    const merged = { ...partner, ...updated };
    const saved = await supabaseService.upsertPartnerProfile(merged);
    setPartner(saved);
    return true;
  };

  // Update membership status
  const updateMembership = async (status: 'active' | 'expired' | 'pending') => {
    if (!partner) return;
    const newMem: PartnerMembership = {
      id: `mem_${partner.id}`,
      partner_id: partner.id,
      plan_name: 'Monthly Doorbly Partner Membership',
      monthly_fee: 370,
      status,
      start_date: new Date().toISOString(),
      expiry_date: new Date(Date.now() + 30 * 86400000).toISOString(),
      payment_status: status === 'active' ? 'paid' : 'pending',
      payment_reference: status === 'active' ? `UPI_${Date.now()}` : undefined
    };
    const saved = await supabaseService.updateMembership(newMem);
    setMembership(saved);
  };

  // Request withdrawal
  const requestWithdrawal = async (amount: number, bank: string, ifsc: string, holder: string) => {
    if (!partner) return { success: false, message: 'Not authenticated' };
    const res = await supabaseService.createWithdrawal(partner.id, amount, bank, ifsc, holder);
    if (res.success) {
      await refreshAll();
    }
    return res;
  };

  // Support ticket
  const createSupportTicket = async (ticketData: Omit<SupportTicket, 'id' | 'created_at' | 'partner_id'>) => {
    if (!partner) return false;
    await supabaseService.createSupportTicket({
      ...ticketData,
      partner_id: partner.id
    });
    await refreshAll();
    return true;
  };

  // Notification read
  const markNotificationRead = async (id: string) => {
    if (!partner) return;
    await supabaseService.markNotificationRead(partner.id, id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  // Logout
  const logout = async () => {
    if (isOnline) {
      locationService.stopTracking();
      if (partner) {
        try {
          await supabaseService.updatePartnerAvailability(partner.id, false);
        } catch {
          // ignore
        }
      }
    }
    await partnerAuthService.logout();
    setPartner(null);
    setMembership(null);
    setIsOnline(false);
    setActiveJob(null);
    setIncomingRequest(null);
    setActiveTab('home');
    lockAdmin();
  };

  const unreadNotificationCount = notifications.filter(n => !n.is_read).length;

  return (
    <PartnerContext.Provider
      value={{
        partner,
        membership,
        isOnline,
        isLoading,
        activeTab,
        location,
        locationError,
        wallet,
        activeJob,
        incomingRequest,
        notifications,
        myJobs,
        supportTickets,
        unreadNotificationCount,
        isAdminUnlocked,
        viewMode,
        batteryState,
        lastJobPollTime,
        dataEngineStats,
        setDataEngineMode,
        setViewMode,
        lockAdmin,
        setActiveTab,
        goBack,
        toggleOnline,
        setBatterySaverPreference,
        setSimulatedBatteryLevel,
        acceptIncomingJob,
        rejectIncomingJob,
        updateActiveJobStatus,
        refreshAll,
        updatePartner,
        updateMembership,
        requestWithdrawal,
        createSupportTicket,
        markNotificationRead,
        refreshSession: initPartnerSession,
        logout
      }}
    >
      {children}
    </PartnerContext.Provider>
  );
};

export const usePartner = (): PartnerContextType => {
  const context = useContext(PartnerContext);
  if (!context) {
    throw new Error('usePartner must be used within a PartnerProvider');
  }
  return context;
};
