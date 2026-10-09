import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import {
  PartnerProfile,
  PartnerMembership,
  ServiceBooking,
  WalletSummary,
  WalletTransaction,
  WithdrawalRequest,
  NotificationItem,
  SupportTicket,
  BookingStatus,
  PartnerStatus,
  OfferOfTheDay,
  PartnerKYC
} from '../types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
}

const STORAGE_KEY_CONFIG = 'doorbly_supabase_config_v2';
const STORAGE_KEY_PARTNER_SESSION = 'doorbly_partner_session_v1';
const STORAGE_KEY_STORE_DATA = 'doorbly_partner_local_store_v1';
const STORAGE_KEY_DAILY_OFFER = 'doorbly_offer_of_the_day_v1';

const DEFAULT_OFFER_OF_THE_DAY: OfferOfTheDay = {
  id: 'offer_of_the_day',
  title: 'Complete 3 Doorstep Works Today & Get ₹250 Extra Incentive!',
  description: 'Valid on all AC, Electrical, Plumbing & Appliance bookings completed with 5-star customer rating.',
  reward_badge: '+₹250 Bonus',
  valid_until: 'Valid till Tonight 11:59 PM',
  is_active: true,
  updated_at: new Date().toISOString()
};

const DEFAULT_SUPABASE_URL = 'https://sksqfbugbeoskypjtjxw.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrc3FmYnVnYmVvc2t5cGp0anh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwODg2NzksImV4cCI6MjEwNjY2NDY3OX0.08Efj6gaF6BSOdHtZraCEAcqKubS506xS-7PG0lzpVc';

class SupabaseService {
  private client: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private config: SupabaseConfig = {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_ANON_KEY,
    connected: false
  };

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    const envUrl = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_URL || '';
    const envKey = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY || '';

    let savedUrl = '';
    let savedKey = '';

    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (stored) {
        const parsed = JSON.parse(stored);
        savedUrl = parsed.url;
        savedKey = parsed.anonKey;
      }
    } catch {
      // ignore
    }

    const activeUrl = savedUrl || envUrl || DEFAULT_SUPABASE_URL;
    const activeKey = savedKey || envKey || DEFAULT_SUPABASE_ANON_KEY;

    if (activeUrl && activeKey && activeUrl.startsWith('http')) {
      try {
        this.client = createClient(activeUrl, activeKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        });
        this.config = { url: activeUrl, anonKey: activeKey, connected: true };
      } catch (err) {
        console.warn('Failed to initialize Supabase client:', err);
        this.config = { url: activeUrl, anonKey: activeKey, connected: false };
      }
    } else {
      this.config = { url: activeUrl || '', anonKey: activeKey || '', connected: false };
    }
  }

  public getConfig(): SupabaseConfig {
    return this.config;
  }

  public setConfig(url: string, anonKey: string): boolean {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({ url, anonKey }));
      if (url && anonKey) {
        this.client = createClient(url, anonKey, {
          auth: { persistSession: true, autoRefreshToken: true }
        });
        this.config = { url, anonKey, connected: true };
        return true;
      } else {
        this.client = null;
        this.config = { url: '', anonKey: '', connected: false };
        return false;
      }
    } catch (e) {
      console.error('Error saving Supabase config:', e);
      return false;
    }
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.client) {
      return { success: false, message: 'Supabase URL and Anon Key are not configured.' };
    }
    try {
      // Test basic ping by selecting from doorbly_partners or auth
      const { error } = await this.client.from('doorbly_partners').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        // Table might not exist yet or permission issue
        if (error.message.includes('relation "doorbly_partners" does not exist')) {
          return {
            success: true,
            message: 'Connected to Supabase! (Tables need to be created with the SQL setup schema).'
          };
        }
        return { success: false, message: error.message };
      }
      return { success: true, message: 'Successfully connected to Doorbly Supabase database!' };
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : 'Unknown connection error' };
    }
  }

  // Local storage backup persistence layer for verified real-time simulation / offline state
  private getLocalStore(): {
    partners: Record<string, PartnerProfile>;
    memberships: Record<string, PartnerMembership>;
    bookings: Record<string, ServiceBooking>;
    transactions: Record<string, WalletTransaction[]>;
    withdrawals: Record<string, WithdrawalRequest[]>;
    notifications: Record<string, NotificationItem[]>;
    tickets: Record<string, SupportTicket[]>;
  } {
    try {
      const data = localStorage.getItem(STORAGE_KEY_STORE_DATA);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    return {
      partners: {},
      memberships: {},
      bookings: {},
      transactions: {},
      withdrawals: {},
      notifications: {},
      tickets: {}
    };
  }

  private saveLocalStore(data: ReturnType<typeof this.getLocalStore>): void {
    try {
      localStorage.setItem(STORAGE_KEY_STORE_DATA, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save local store:', e);
    }
  }

  /**
   * Fetch partner profile
   */
  public async getPartnerProfile(partnerId: string): Promise<PartnerProfile | null> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_partners')
          .select('*')
          .eq('id', partnerId)
          .maybeSingle();

        if (error) console.warn('Supabase getPartnerProfile error:', error);
        if (data) return data as PartnerProfile;
      } catch (err) {
        console.warn('Supabase fetch failed, falling back:', err);
      }
    }

    const store = this.getLocalStore();
    return store.partners[partnerId] || null;
  }

  /**
   * Verify whether a Partner ID is officially registered with Doorbly
   */
  public async verifyPartnerIdRegistration(partnerId: string): Promise<{
    registered: boolean;
    profile?: PartnerProfile;
    status?: string;
    message?: string;
  }> {
    if (!partnerId) {
      return { registered: false, message: 'Invalid or missing Partner ID.' };
    }

    const profile = await this.getPartnerProfile(partnerId);
    if (!profile) {
      return {
        registered: false,
        message: `Partner ID "${partnerId}" is not registered with Doorbly. Please complete registration first.`
      };
    }

    if (profile.status === 'incomplete') {
      return {
        registered: false,
        profile,
        status: 'incomplete',
        message: `Partner ID "${partnerId}" registration is incomplete. Complete your profile and documents to proceed.`
      };
    }

    if (profile.status === 'pending_verification') {
      return {
        registered: true,
        profile,
        status: 'pending_verification',
        message: `Partner ID "${partnerId}" is registered, but verification is still pending.`
      };
    }

    if (profile.status === 'rejected' || profile.status === 'suspended') {
      return {
        registered: true,
        profile,
        status: profile.status,
        message: `Partner ID "${partnerId}" is ${profile.status}. Access to go online is restricted.`
      };
    }

    return {
      registered: true,
      profile,
      status: profile.status,
      message: 'Partner ID is verified and approved.'
    };
  }

  /**
   * Save or update partner profile
   */
  public async upsertPartnerProfile(profile: PartnerProfile): Promise<PartnerProfile> {
    profile.updated_at = new Date().toISOString();

    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_partners')
          .upsert(profile)
          .select()
          .maybeSingle();

        if (!error && data) {
          // Cache locally
          const store = this.getLocalStore();
          store.partners[profile.id] = data as PartnerProfile;
          this.saveLocalStore(store);
          return data as PartnerProfile;
        }
      } catch (e) {
        console.warn('Supabase upsert error:', e);
      }
    }

    const store = this.getLocalStore();
    store.partners[profile.id] = profile;
    this.saveLocalStore(store);
    return profile;
  }

  /**
   * Update partner live availability and location
   */
  public async updatePartnerAvailability(
    partnerId: string,
    isOnline: boolean,
    lat?: number,
    lng?: number
  ): Promise<void> {
    if (isOnline) {
      const currentProfile = await this.getPartnerProfile(partnerId);
      if (!currentProfile || currentProfile.status !== 'approved') {
        return;
      }
    }

    const updateData: Partial<PartnerProfile> = {
      is_online: isOnline,
      last_location_update: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (lat !== undefined && lng !== undefined) {
      updateData.current_lat = lat;
      updateData.current_lng = lng;
    }

    if (this.client) {
      try {
        await this.client
          .from('doorbly_partners')
          .update(updateData)
          .eq('id', partnerId);
      } catch (e) {
        console.warn('Failed to update availability on Supabase:', e);
      }
    }

    const store = this.getLocalStore();
    if (store.partners[partnerId]) {
      store.partners[partnerId] = {
        ...store.partners[partnerId],
        ...updateData
      };
      this.saveLocalStore(store);
    }
  }

  /**
   * Get Partner Membership status
   */
  public async getMembership(partnerId: string): Promise<PartnerMembership | null> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_partner_memberships')
          .select('*')
          .eq('partner_id', partnerId)
          .maybeSingle();

        if (!error && data) return data as PartnerMembership;
      } catch (e) {
        console.warn('Supabase getMembership error:', e);
      }
    }

    const store = this.getLocalStore();
    return store.memberships[partnerId] || null;
  }

  /**
   * Subscribe/Renew Membership
   */
  public async updateMembership(membership: PartnerMembership): Promise<PartnerMembership> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_partner_memberships')
          .upsert(membership)
          .select()
          .maybeSingle();

        if (!error && data) {
          const store = this.getLocalStore();
          store.memberships[membership.partner_id] = data as PartnerMembership;
          this.saveLocalStore(store);
          return data as PartnerMembership;
        }
      } catch (e) {
        console.warn('Failed to update membership in Supabase:', e);
      }
    }

    const store = this.getLocalStore();
    store.memberships[membership.partner_id] = membership;
    this.saveLocalStore(store);
    return membership;
  }

  /**
   * Fetch partner wallet summary (returns 0 if no real data)
   */
  public async getWalletSummary(partnerId: string): Promise<WalletSummary> {
    let available_balance = 0;
    let pending_amount = 0;
    let today_earnings = 0;
    let week_earnings = 0;
    let month_earnings = 0;
    let today_completed_jobs = 0;
    let total_completed_jobs = 0;

    const todayDateStr = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    if (this.client) {
      try {
        const [{ data: walletData }, { data: txData }, { data: jobs }] = await Promise.all([
          this.client
            .from('doorbly_partner_wallets')
            .select('*')
            .eq('partner_id', partnerId)
            .maybeSingle(),
          this.client
            .from('doorbly_partner_wallet_transactions')
            .select('type, amount, status')
            .eq('partner_id', partnerId),
          this.client
            .from('doorbly_service_bookings')
            .select('*')
            .eq('assigned_partner_id', partnerId)
            .eq('status', 'COMPLETED')
        ]);

        if (walletData) {
          available_balance = Number(walletData.available_balance) || 0;
          pending_amount = Number(walletData.pending_amount) || 0;
        } else if (txData && txData.length > 0) {
          txData.forEach((tx) => {
            if (tx.status === 'completed') {
              if (tx.type === 'credit') available_balance += Number(tx.amount) || 0;
              if (tx.type === 'debit') available_balance -= Number(tx.amount) || 0;
            }
          });
          if (available_balance < 0) available_balance = 0;
        }

        if (jobs && jobs.length > 0) {
          total_completed_jobs = jobs.length;
          jobs.forEach((job) => {
            const earning = Number(job.partner_earning) || 0;
            const completedAt = job.completed_at || job.created_at;
            if (completedAt.startsWith(todayDateStr)) {
              today_earnings += earning;
              today_completed_jobs += 1;
            }
            if (completedAt >= sevenDaysAgo) {
              week_earnings += earning;
            }
            if (completedAt >= thirtyDaysAgo) {
              month_earnings += earning;
            }
          });
        }

        return {
          available_balance,
          pending_amount,
          today_earnings,
          week_earnings,
          month_earnings,
          today_completed_jobs,
          total_completed_jobs
        };
      } catch (e) {
        console.warn('Supabase getWalletSummary error:', e);
      }
    }

    // Local fallback
    const store = this.getLocalStore();
    const txList = store.transactions[partnerId] || [];
    const jobs = Object.values(store.bookings).filter(
      b => b.assigned_partner_id === partnerId && b.status === 'COMPLETED'
    );

    total_completed_jobs = jobs.length;
    jobs.forEach((job) => {
      const earning = Number(job.partner_earning) || 0;
      const completedAt = job.completed_at || job.created_at;
      if (completedAt.startsWith(todayDateStr)) {
        today_earnings += earning;
        today_completed_jobs += 1;
      }
      if (completedAt >= sevenDaysAgo) {
        week_earnings += earning;
      }
      if (completedAt >= thirtyDaysAgo) {
        month_earnings += earning;
      }
    });

    // Calculate balance from completed transactions
    txList.forEach((tx) => {
      if (tx.status === 'completed') {
        if (tx.type === 'credit') available_balance += tx.amount;
        if (tx.type === 'debit') available_balance -= tx.amount;
      }
    });
    if (available_balance < 0) available_balance = 0;

    return {
      available_balance,
      pending_amount,
      today_earnings,
      week_earnings,
      month_earnings,
      today_completed_jobs,
      total_completed_jobs
    };
  }

  /**
   * Fetch wallet transactions
   */
  public async getTransactions(partnerId: string): Promise<WalletTransaction[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_partner_wallet_transactions')
          .select('*')
          .eq('partner_id', partnerId)
          .order('created_at', { ascending: false });

        if (!error && data) return data as WalletTransaction[];
      } catch (e) {
        console.warn('Supabase getTransactions error:', e);
      }
    }

    const store = this.getLocalStore();
    return (store.transactions[partnerId] || []).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Request withdrawal
   */
  public async createWithdrawal(
    partnerId: string,
    amount: number,
    bank_account: string,
    ifsc: string,
    account_holder: string
  ): Promise<{ success: boolean; message: string; withdrawal?: WithdrawalRequest }> {
    const wallet = await this.getWalletSummary(partnerId);
    if (amount <= 0) {
      return { success: false, message: 'Please enter a valid withdrawal amount.' };
    }
    if (amount > wallet.available_balance) {
      return {
        success: false,
        message: `Insufficient balance. Available: ₹${wallet.available_balance}`
      };
    }
    if (amount < 200) {
      return { success: false, message: 'Minimum withdrawal amount is ₹200.' };
    }

    const newWithdrawal: WithdrawalRequest = {
      id: `wth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      partner_id: partnerId,
      amount,
      bank_account,
      ifsc,
      account_holder,
      status: 'requested',
      requested_at: new Date().toISOString()
    };

    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_partner_withdrawals')
          .insert(newWithdrawal)
          .select()
          .maybeSingle();

        if (error) {
          return { success: false, message: error.message };
        }
        if (data) {
          // Record debit transaction in Supabase (trigger updates doorbly_partner_wallets)
          await this.client.from('doorbly_partner_wallet_transactions').insert({
            id: `tx_wth_${Date.now()}`,
            partner_id: partnerId,
            type: 'debit',
            category: 'withdrawal',
            amount,
            balance_after: Math.max(0, wallet.available_balance - amount),
            description: `Bank Withdrawal to ${bank_account.slice(-4).padStart(bank_account.length, '*')}`,
            status: 'completed',
            created_at: new Date().toISOString()
          });
          return { success: true, message: 'Withdrawal request submitted successfully.', withdrawal: data as WithdrawalRequest };
        }
      } catch (e: unknown) {
        return { success: false, message: e instanceof Error ? e.message : 'Database error' };
      }
    }

    const store = this.getLocalStore();
    if (!store.withdrawals[partnerId]) store.withdrawals[partnerId] = [];
    store.withdrawals[partnerId].unshift(newWithdrawal);

    // Create pending debit transaction
    const debitTx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      partner_id: partnerId,
      type: 'debit',
      category: 'withdrawal',
      amount,
      balance_after: Math.max(0, wallet.available_balance - amount),
      description: `Bank Withdrawal to ${bank_account.slice(-4).padStart(bank_account.length, '*')}`,
      status: 'completed',
      created_at: new Date().toISOString()
    };
    if (!store.transactions[partnerId]) store.transactions[partnerId] = [];
    store.transactions[partnerId].unshift(debitTx);

    this.saveLocalStore(store);
    return { success: true, message: 'Withdrawal request submitted successfully.', withdrawal: newWithdrawal };
  }

  /**
   * Get withdrawals for partner
   */
  public async getWithdrawals(partnerId: string): Promise<WithdrawalRequest[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_partner_withdrawals')
          .select('*')
          .eq('partner_id', partnerId)
          .order('requested_at', { ascending: false });

        if (!error && data) return data as WithdrawalRequest[];
      } catch (e) {
        console.warn('Supabase getWithdrawals error:', e);
      }
    }

    const store = this.getLocalStore();
    return store.withdrawals[partnerId] || [];
  }

  /**
   * Fetch partner jobs (Active, Completed, Cancelled)
   */
  public async getPartnerJobs(partnerId: string): Promise<ServiceBooking[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_service_bookings')
          .select('*')
          .eq('assigned_partner_id', partnerId)
          .order('created_at', { ascending: false });

        if (!error && data) return data as ServiceBooking[];
      } catch (e) {
        console.warn('Supabase getPartnerJobs error:', e);
      }
    }

    const store = this.getLocalStore();
    return Object.values(store.bookings)
      .filter(b => b.assigned_partner_id === partnerId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Check for currently active job assigned to partner
   */
  public async getActiveJob(partnerId: string): Promise<ServiceBooking | null> {
    const activeStatuses: BookingStatus[] = ['ASSIGNED', 'ARRIVED', 'IN_PROGRESS'];

    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_service_bookings')
          .select('*')
          .eq('assigned_partner_id', partnerId)
          .in('status', activeStatuses)
          .maybeSingle();

        if (!error && data) return data as ServiceBooking;
      } catch (e) {
        console.warn('Supabase getActiveJob error:', e);
      }
    }

    const store = this.getLocalStore();
    const active = Object.values(store.bookings).find(
      b => b.assigned_partner_id === partnerId && activeStatuses.includes(b.status)
    );
    return active || null;
  }

  /**
   * Poll for live open job requests (SEARCHING_PARTNER / REQUEST_SENT)
   * Used by the adaptive polling loop (5s normal vs 30s battery-saving mode)
   */
  public async pollOpenJobRequests(): Promise<ServiceBooking[]> {
    const openStatuses: BookingStatus[] = ['SEARCHING_PARTNER', 'REQUEST_SENT'];

    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_service_bookings')
          .select('*')
          .in('status', openStatuses)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && data) {
          return data as ServiceBooking[];
        }
      } catch (e) {
        console.warn('Supabase pollOpenJobRequests notice:', e);
      }
    }

    const store = this.getLocalStore();
    return Object.values(store.bookings)
      .filter(b => openStatuses.includes(b.status))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Fetch live counts of:
   * 1. Number of Works Done by partner (status = COMPLETED)
   * 2. Number of Next Upcoming Works in Queue (open requests + partner's assigned/upcoming jobs)
   */
  public async getLiveWorkCounts(partnerId: string): Promise<{
    worksDone: number;
    upcomingQueue: number;
  }> {
    const queueOpenStatuses: BookingStatus[] = ['SEARCHING_PARTNER', 'REQUEST_SENT'];
    const partnerUpcomingStatuses: BookingStatus[] = ['ASSIGNED', 'ARRIVED', 'IN_PROGRESS'];

    if (this.client) {
      try {
        const [doneRes, openQueueRes, assignedQueueRes] = await Promise.all([
          this.client
            .from('doorbly_service_bookings')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_partner_id', partnerId)
            .eq('status', 'COMPLETED'),
          this.client
            .from('doorbly_service_bookings')
            .select('id', { count: 'exact', head: true })
            .in('status', queueOpenStatuses),
          this.client
            .from('doorbly_service_bookings')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_partner_id', partnerId)
            .in('status', partnerUpcomingStatuses)
        ]);

        if (!doneRes.error && !openQueueRes.error && !assignedQueueRes.error) {
          return {
            worksDone: doneRes.count ?? 0,
            upcomingQueue: (openQueueRes.count ?? 0) + (assignedQueueRes.count ?? 0)
          };
        }
      } catch (e) {
        console.warn('Supabase getLiveWorkCounts error:', e);
      }
    }

    const store = this.getLocalStore();
    const allBookings = Object.values(store.bookings);
    const worksDone = allBookings.filter(
      b => b.assigned_partner_id === partnerId && b.status === 'COMPLETED'
    ).length;
    const upcomingQueue = allBookings.filter(
      b =>
        queueOpenStatuses.includes(b.status) ||
        (b.assigned_partner_id === partnerId && partnerUpcomingStatuses.includes(b.status))
    ).length;

    return { worksDone, upcomingQueue };
  }

  /**
   * Atomically accept a job request
   * Prevents race conditions if multiple partners attempt to accept
   */
  public async acceptJob(
    bookingId: string,
    partnerId: string
  ): Promise<{ success: boolean; message: string; booking?: ServiceBooking }> {
    if (this.client) {
      try {
        // Atomic update: only update if status is SEARCHING_PARTNER or REQUEST_SENT
        const { data, error } = await this.client
          .from('doorbly_service_bookings')
          .update({
            status: 'ASSIGNED',
            assigned_partner_id: partnerId,
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId)
          .in('status', ['SEARCHING_PARTNER', 'REQUEST_SENT'])
          .select()
          .maybeSingle();

        if (error || !data) {
          return {
            success: false,
            message: 'This service request has already been assigned to another partner.'
          };
        }

        return {
          success: true,
          message: 'Service accepted successfully!',
          booking: data as ServiceBooking
        };
      } catch (err: unknown) {
        return {
          success: false,
          message: err instanceof Error ? err.message : 'Failed to accept job'
        };
      }
    }

    // Local atomic check
    const store = this.getLocalStore();
    const target = store.bookings[bookingId];
    if (!target) {
      return { success: false, message: 'Service request no longer exists.' };
    }
    if (target.status !== 'SEARCHING_PARTNER' && target.status !== 'REQUEST_SENT') {
      return {
        success: false,
        message: 'This service request has already been assigned to another partner.'
      };
    }

    target.status = 'ASSIGNED';
    target.assigned_partner_id = partnerId;
    store.bookings[bookingId] = target;
    this.saveLocalStore(store);

    return {
      success: true,
      message: 'Service accepted successfully!',
      booking: target
    };
  }

  /**
   * Update active job status (e.g. ARRIVED, IN_PROGRESS, COMPLETED)
   */
  public async updateJobStatus(
    bookingId: string,
    partnerId: string,
    status: BookingStatus,
    extra?: {
      otp?: string;
      notes?: string;
      photos?: string[];
    }
  ): Promise<{ success: boolean; message: string; booking?: ServiceBooking }> {
    const updatePayload: Partial<ServiceBooking> = {
      status
    };

    if (status === 'IN_PROGRESS') {
      updatePayload.started_at = new Date().toISOString();
    } else if (status === 'COMPLETED') {
      updatePayload.completed_at = new Date().toISOString();
    }
    if (extra?.notes) {
      updatePayload.notes = extra.notes;
    }

    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_service_bookings')
          .update(updatePayload)
          .eq('id', bookingId)
          .eq('assigned_partner_id', partnerId)
          .select()
          .maybeSingle();

        if (error) {
          return { success: false, message: error.message };
        }
        if (data && status === 'COMPLETED') {
          // Credit partner wallet
          await this.creditPartnerEarnings(partnerId, data as ServiceBooking);
        }
        return { success: true, message: `Status updated to ${status}`, booking: data as ServiceBooking };
      } catch (e: unknown) {
        return { success: false, message: e instanceof Error ? e.message : 'Failed to update status' };
      }
    }

    const store = this.getLocalStore();
    const job = store.bookings[bookingId];
    if (!job || job.assigned_partner_id !== partnerId) {
      return { success: false, message: 'Job not found or not assigned to you.' };
    }

    Object.assign(job, updatePayload);
    if (extra?.notes) {
      job.work_notes = job.work_notes || [];
      job.work_notes.push(extra.notes);
    }
    store.bookings[bookingId] = job;

    if (status === 'COMPLETED') {
      // Credit wallet
      const walletSummary = await this.getWalletSummary(partnerId);
      const creditTx: WalletTransaction = {
        id: `tx_cred_${Date.now()}`,
        partner_id: partnerId,
        booking_id: bookingId,
        type: 'credit',
        category: 'job_earning',
        amount: job.partner_earning,
        balance_after: walletSummary.available_balance + job.partner_earning,
        description: `Earning for ${job.service_name} (#${job.id.substring(0, 8)})`,
        status: 'completed',
        created_at: new Date().toISOString()
      };
      if (!store.transactions[partnerId]) store.transactions[partnerId] = [];
      store.transactions[partnerId].unshift(creditTx);

      // Create notification
      const notif: NotificationItem = {
        id: `notif_${Date.now()}`,
        partner_id: partnerId,
        type: 'WALLET_CREDIT',
        title: 'Earnings Credited! ₹' + job.partner_earning,
        message: `Your earnings of ₹${job.partner_earning} for job #${job.id.substring(0, 8)} have been credited to your wallet.`,
        is_read: false,
        created_at: new Date().toISOString()
      };
      if (!store.notifications[partnerId]) store.notifications[partnerId] = [];
      store.notifications[partnerId].unshift(notif);
    }

    this.saveLocalStore(store);
    return { success: true, message: `Status updated to ${status}`, booking: job };
  }

  /**
   * Helper to credit wallet and create notification on Supabase
   */
  private async creditPartnerEarnings(partnerId: string, booking: ServiceBooking): Promise<void> {
    if (!this.client) return;
    try {
      const earning = Number(booking.partner_earning) || 0;
      const nowIso = new Date().toISOString();
      await Promise.all([
        this.client.from('doorbly_partner_wallet_transactions').insert({
          id: `tx_cred_${Date.now()}`,
          partner_id: partnerId,
          booking_id: booking.id,
          type: 'credit',
          category: 'job_earning',
          amount: earning,
          description: `Earning for ${booking.service_name} (#${booking.id.substring(0, 8)})`,
          status: 'completed',
          created_at: nowIso
        }),
        this.client.from('doorbly_partner_notifications').insert({
          id: `notif_${Date.now()}`,
          partner_id: partnerId,
          type: 'WALLET_CREDIT',
          title: `Earnings Credited! ₹${earning}`,
          message: `Your earnings of ₹${earning} for job #${booking.id.substring(0, 8)} have been credited to your wallet.`,
          is_read: false,
          created_at: nowIso
        })
      ]);
    } catch (e) {
      console.warn('Failed to record credit transaction:', e);
    }
  }

  /**
   * Save or fetch Partner KYC & Bank details in public.doorbly_partner_kyc
   */
  public async getPartnerKYC(partnerId: string): Promise<PartnerKYC | null> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_partner_kyc')
          .select('*')
          .eq('partner_id', partnerId)
          .maybeSingle();

        if (!error && data) {
          return {
            documentType: (data.document_type as 'aadhaar' | 'pan') || 'aadhaar',
            documentNumber: data.document_number || '',
            documentImageUrl: data.document_image_url || undefined,
            bankAccount: data.bank_account || '',
            ifsc: data.ifsc || '',
            accountHolder: data.account_holder || '',
            certificateUrls: data.certificate_urls || [],
            submittedAt: data.submitted_at
          };
        }
      } catch (e) {
        console.warn('getPartnerKYC notice:', e);
      }
    }
    try {
      const localKyc = localStorage.getItem(`doorbly_kyc_${partnerId}`);
      if (localKyc) return JSON.parse(localKyc) as PartnerKYC;
    } catch {
      // ignore
    }
    return null;
  }

  public async upsertPartnerKYC(partnerId: string, kyc: PartnerKYC): Promise<boolean> {
    try {
      localStorage.setItem(`doorbly_kyc_${partnerId}`, JSON.stringify(kyc));
    } catch {
      // ignore
    }

    if (this.client) {
      try {
        const { error } = await this.client.from('doorbly_partner_kyc').upsert({
          id: `kyc_${partnerId}`,
          partner_id: partnerId,
          document_type: kyc.documentType,
          document_number: kyc.documentNumber,
          document_image_url: kyc.documentImageUrl || null,
          bank_account: kyc.bankAccount,
          ifsc: kyc.ifsc,
          account_holder: kyc.accountHolder,
          certificate_urls: kyc.certificateUrls || [],
          submitted_at: kyc.submittedAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        return !error;
      } catch (e) {
        console.warn('upsertPartnerKYC notice:', e);
      }
    }
    return true;
  }

  /**
   * Log Profession Add-on (₹49) or 30-Day Free Replacement in public.doorbly_partner_profession_changes
   */
  public async logProfessionChange(params: {
    partnerId: string;
    actionType: 'add_paid_49' | 'replace_free_30d';
    categoryId: string;
    categoryName: string;
    professionName: string;
    feePaid: number;
  }): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.from('doorbly_partner_profession_changes').insert({
        id: `prf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        partner_id: params.partnerId,
        action_type: params.actionType,
        category_id: params.categoryId,
        category_name: params.categoryName,
        profession_name: params.professionName,
        fee_paid: params.feePaid,
        payment_status: 'paid',
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('logProfessionChange notice:', e);
    }
  }

  /**
   * Get Partner Notifications
   */
  public async getNotifications(partnerId: string): Promise<NotificationItem[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_partner_notifications')
          .select('*')
          .eq('partner_id', partnerId)
          .order('created_at', { ascending: false });

        if (!error && data) return data as NotificationItem[];
      } catch (e) {
        console.warn('Supabase getNotifications error:', e);
      }
    }

    const store = this.getLocalStore();
    return store.notifications[partnerId] || [];
  }

  /**
   * Mark notification as read
   */
  public async markNotificationRead(partnerId: string, notificationId: string): Promise<void> {
    if (this.client) {
      try {
        await this.client
          .from('doorbly_partner_notifications')
          .update({ is_read: true })
          .eq('id', notificationId)
          .eq('partner_id', partnerId);
      } catch (e) {
        console.warn('markNotificationRead error:', e);
      }
    }

    const store = this.getLocalStore();
    const list = store.notifications[partnerId] || [];
    const target = list.find(n => n.id === notificationId);
    if (target) {
      target.is_read = true;
      this.saveLocalStore(store);
    }
  }

  /**
   * Support Tickets
   */
  public async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'created_at'>): Promise<SupportTicket> {
    const newTicket: SupportTicket = {
      ...ticket,
      id: `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString()
    };

    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_partner_support_tickets')
          .insert(newTicket)
          .select()
          .maybeSingle();

        if (!error && data) return data as SupportTicket;
      } catch (e) {
        console.warn('createSupportTicket error:', e);
      }
    }

    const store = this.getLocalStore();
    if (!store.tickets[ticket.partner_id]) store.tickets[ticket.partner_id] = [];
    store.tickets[ticket.partner_id].unshift(newTicket);
    this.saveLocalStore(store);
    return newTicket;
  }

  public async getSupportTickets(partnerId: string): Promise<SupportTicket[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_partner_support_tickets')
          .select('*')
          .eq('partner_id', partnerId)
          .order('created_at', { ascending: false });

        if (!error && data) return data as SupportTicket[];
      } catch (e) {
        console.warn('getSupportTickets error:', e);
      }
    }

    const store = this.getLocalStore();
    return store.tickets[partnerId] || [];
  }

  /**
   * Set up real-time listener for incoming job bookings & backend table updates
   */
  public subscribeToRealtimeBookings(
    onNewBooking: (booking: ServiceBooking) => void,
    onStatusChange: (booking: ServiceBooking) => void
  ): () => void {
    if (!this.client) {
      return () => {};
    }

    try {
      const channelName = `partner_realtime_bookings_${Math.random().toString(36).substring(2, 8)}`;
      const channel = this.client
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'doorbly_service_bookings' },
          (payload) => {
            if (payload.new) {
              onNewBooking(payload.new as ServiceBooking);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'doorbly_service_bookings' },
          (payload) => {
            if (payload.new) {
              onStatusChange(payload.new as ServiceBooking);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'doorbly_daily_offers' },
          () => {
            window.dispatchEvent(new CustomEvent('doorbly-realtime-refresh'));
          }
        )
        .subscribe();

      this.channel = channel;

      return () => {
        if (this.client) {
          this.client.removeChannel(channel);
        }
      };
    } catch (e) {
      console.warn('Failed to subscribe to realtime channel:', e);
      return () => {};
    }
  }

  /**
   * Subscribe to real-time backend updates for a specific partner
   * (Profile approval/status changes, wallet credits, notifications, memberships, withdrawals)
   */
  public subscribeToPartnerRealtimeSync(
    partnerId: string,
    onPartnerDataChanged: () => void
  ): () => void {
    if (!this.client || !partnerId) {
      return () => {};
    }

    try {
      const channelName = `partner_sync_${partnerId}_${Math.random().toString(36).substring(2, 7)}`;
      const syncChannel = this.client
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'doorbly_partners',
            filter: `id=eq.${partnerId}`
          },
          () => onPartnerDataChanged()
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'doorbly_partner_wallets',
            filter: `partner_id=eq.${partnerId}`
          },
          () => onPartnerDataChanged()
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'doorbly_partner_wallet_transactions',
            filter: `partner_id=eq.${partnerId}`
          },
          () => onPartnerDataChanged()
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'doorbly_partner_notifications',
            filter: `partner_id=eq.${partnerId}`
          },
          () => onPartnerDataChanged()
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'doorbly_partner_memberships',
            filter: `partner_id=eq.${partnerId}`
          },
          () => onPartnerDataChanged()
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'doorbly_partner_withdrawals',
            filter: `partner_id=eq.${partnerId}`
          },
          () => onPartnerDataChanged()
        )
        .subscribe();

      return () => {
        if (this.client) {
          this.client.removeChannel(syncChannel);
        }
      };
    } catch (e) {
      console.warn('subscribeToPartnerRealtimeSync notice:', e);
      return () => {};
    }
  }

  /**
   * Realtime broadcast trigger for testing/dispatching live jobs from the customer app / backend simulation
   */
  public async simulateCustomerBooking(booking: ServiceBooking): Promise<void> {
    if (this.client) {
      try {
        await this.client.from('doorbly_service_bookings').insert(booking);
      } catch (e) {
        console.warn('Failed to insert booking:', e);
      }
    }

    const store = this.getLocalStore();
    store.bookings[booking.id] = booking;
    this.saveLocalStore(store);
  }

  /**
   * ADMIN METHODS
   */
  public async getAllPartners(): Promise<PartnerProfile[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_partners')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) return data as PartnerProfile[];
      } catch (e) {
        console.warn('getAllPartners error:', e);
      }
    }

    const store = this.getLocalStore();
    return Object.values(store.partners).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public async updatePartnerStatus(
    partnerId: string,
    status: PartnerStatus,
    reason?: string
  ): Promise<boolean> {
    if (this.client) {
      try {
        const updatePayload: Record<string, unknown> = {
          status,
          status_reason: reason,
          updated_at: new Date().toISOString()
        };
        if (status !== 'approved') {
          updatePayload.is_online = false;
        }
        const { error } = await this.client
          .from('doorbly_partners')
          .update(updatePayload)
          .eq('id', partnerId);

        if (!error) return true;
      } catch (e) {
        console.warn('updatePartnerStatus error:', e);
      }
    }

    const store = this.getLocalStore();
    if (store.partners[partnerId]) {
      store.partners[partnerId].status = status;
      if (status !== 'approved') {
        store.partners[partnerId].is_online = false;
      }
      if (reason) store.partners[partnerId].status_reason = reason;
      store.partners[partnerId].updated_at = new Date().toISOString();
      this.saveLocalStore(store);
      return true;
    }
    return false;
  }

  public async getAllBookings(): Promise<ServiceBooking[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_service_bookings')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) return data as ServiceBooking[];
      } catch (e) {
        console.warn('getAllBookings error:', e);
      }
    }

    const store = this.getLocalStore();
    return Object.values(store.bookings).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public async updateBookingStatusAsAdmin(
    bookingId: string,
    status: BookingStatus,
    partnerId?: string
  ): Promise<boolean> {
    const updatePayload: Partial<ServiceBooking> = { status };
    if (partnerId) updatePayload.assigned_partner_id = partnerId;

    if (this.client) {
      try {
        const { error } = await this.client
          .from('doorbly_service_bookings')
          .update(updatePayload)
          .eq('id', bookingId);

        if (!error) return true;
      } catch (e) {
        console.warn('updateBookingStatusAsAdmin error:', e);
      }
    }

    const store = this.getLocalStore();
    if (store.bookings[bookingId]) {
      Object.assign(store.bookings[bookingId], updatePayload);
      this.saveLocalStore(store);
      return true;
    }
    return false;
  }

  public async getAllWithdrawalsAdmin(): Promise<WithdrawalRequest[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_partner_withdrawals')
          .select('*')
          .order('requested_at', { ascending: false });

        if (!error && data) return data as WithdrawalRequest[];
      } catch (e) {
        console.warn('getAllWithdrawalsAdmin error:', e);
      }
    }

    const store = this.getLocalStore();
    const all = Object.values(store.withdrawals).flat();
    return all.sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());
  }

  public async updateWithdrawalStatus(
    withdrawalId: string,
    status: 'requested' | 'processing' | 'completed' | 'rejected'
  ): Promise<boolean> {
    if (this.client) {
      try {
        const { error } = await this.client
          .from('doorbly_partner_withdrawals')
          .update({
            status,
            processed_at: new Date().toISOString()
          })
          .eq('id', withdrawalId);

        if (!error) return true;
      } catch (e) {
        console.warn('updateWithdrawalStatus error:', e);
      }
    }

    const store = this.getLocalStore();
    for (const pId of Object.keys(store.withdrawals)) {
      const target = store.withdrawals[pId].find(w => w.id === withdrawalId);
      if (target) {
        target.status = status;
        target.processed_at = new Date().toISOString();
        this.saveLocalStore(store);
        return true;
      }
    }
    return false;
  }

  public async getAllMembershipsAdmin(): Promise<PartnerMembership[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_partner_memberships')
          .select('*')
          .order('start_date', { ascending: false });

        if (!error && data) return data as PartnerMembership[];
      } catch (e) {
        console.warn('getAllMembershipsAdmin error:', e);
      }
    }

    const store = this.getLocalStore();
    return Object.values(store.memberships);
  }

  public async updateMembershipStatus(
    membershipId: string,
    status: 'active' | 'expired' | 'pending'
  ): Promise<boolean> {
    if (this.client) {
      try {
        const { error } = await this.client
          .from('doorbly_partner_memberships')
          .update({
            status,
            expiry_date: status === 'active' ? new Date(Date.now() + 30 * 86400000).toISOString() : undefined
          })
          .eq('id', membershipId);

        if (!error) return true;
      } catch (e) {
        console.warn('updateMembershipStatus error:', e);
      }
    }

    const store = this.getLocalStore();
    for (const pId of Object.keys(store.memberships)) {
      if (store.memberships[pId].id === membershipId) {
        store.memberships[pId].status = status;
        if (status === 'active') {
          store.memberships[pId].expiry_date = new Date(Date.now() + 30 * 86400000).toISOString();
        }
        this.saveLocalStore(store);
        return true;
      }
    }
    return false;
  }

  /**
   * Fetch Offer of the Day (Live from Supabase with local fallback)
   */
  public async getOfferOfTheDay(): Promise<OfferOfTheDay> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_daily_offers')
          .select('*')
          .eq('id', 'offer_of_the_day')
          .maybeSingle();

        if (!error && data) {
          localStorage.setItem(STORAGE_KEY_DAILY_OFFER, JSON.stringify(data));
          return data as OfferOfTheDay;
        }
      } catch (e) {
        console.warn('getOfferOfTheDay notice:', e);
      }
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY_DAILY_OFFER);
      if (saved) {
        return JSON.parse(saved) as OfferOfTheDay;
      }
    } catch {
      // ignore
    }

    return DEFAULT_OFFER_OF_THE_DAY;
  }

  /**
   * Update Offer of the Day from Admin Panel
   */
  public async updateOfferOfTheDay(offer: Omit<OfferOfTheDay, 'id' | 'updated_at'>): Promise<OfferOfTheDay> {
    const updated: OfferOfTheDay = {
      ...offer,
      id: 'offer_of_the_day',
      updated_at: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY_DAILY_OFFER, JSON.stringify(updated));

    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('doorbly_daily_offers')
          .upsert(updated)
          .select()
          .maybeSingle();

        if (!error && data) {
          localStorage.setItem(STORAGE_KEY_DAILY_OFFER, JSON.stringify(data));
          return data as OfferOfTheDay;
        }
      } catch (e) {
        console.warn('updateOfferOfTheDay Supabase notice:', e);
      }
    }

    return updated;
  }
}

export const supabaseService = new SupabaseService();
