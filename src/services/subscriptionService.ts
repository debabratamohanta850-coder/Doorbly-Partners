import {
  SubscriptionPlan,
  PartnerSubscription,
  SubscriptionPayment,
  JobCommissionRecord,
  TaxConfiguration,
  SubscriptionAuditLog,
  PlanCode,
  PartnerMembership
} from '../types';
import { supabaseService } from './supabaseClient';
import { supabaseDataEngine } from './supabaseDataEngine';

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_starter',
    plan_code: 'starter',
    plan_name: 'Starter',
    monthly_price: 0,
    commission_percent: 20,
    tax_configuration: {
      is_tax_applicable: false,
      default_tax_percent: 0
    },
    benefits: [
      '₹0 per month — No paid subscription required',
      'Company commission: 20% per completed job',
      'Partner retains 80% (₹800 per ₹1,000 order)',
      'Standard access to eligible nearby customer jobs',
      'Partner wallet and detailed earnings history',
      'Standard job notifications'
    ],
    is_active: true,
    is_recommended: false,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'plan_growth',
    plan_code: 'growth',
    plan_name: 'Growth',
    monthly_price: 370,
    commission_percent: 12,
    tax_configuration: {
      is_tax_applicable: true,
      default_tax_percent: 18
    },
    benefits: [
      'Low company commission: only 12% per completed job',
      'Partner retains 88% (₹880 per ₹1,000 order)',
      'Priority job notifications where supported',
      'Partner wallet and detailed earnings reports',
      'Subscription expiry and renewal reminders',
      'Dedicated door-to-door booking visibility'
    ],
    is_active: true,
    is_recommended: true,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'plan_professional',
    plan_code: 'professional',
    plan_name: 'Professional',
    monthly_price: 799,
    commission_percent: 7,
    tax_configuration: {
      is_tax_applicable: true,
      default_tax_percent: 18
    },
    benefits: [
      'Ultra-low commission: only 7% per completed job',
      'Partner retains 93% (₹930 per ₹1,000 order)',
      'Priority access to high-value eligible jobs where supported',
      'Advanced earnings reports and performance analytics',
      'Priority partner phone and chat support',
      'Subscription expiry and auto-renewal reminders'
    ],
    is_active: true,
    is_recommended: false,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString()
  }
];

export const DEFAULT_TAX_CONFIG: TaxConfiguration = {
  id: 'tax_config_in',
  tax_name: 'Goods & Services Tax (GST)',
  tax_rate_percent: 18, // Configurable illustrative rate (e.g., 18% -> ₹66.60 on ₹370, total ₹436.60)
  is_active: true,
  hsn_sac_code: '998314', // SAC for Information technology software and subscription services
  gstin_number: '21AAACD1234F1Z5',
  place_of_supply: 'Odisha (21) / Inter-State',
  verification_required_notice:
    'Configurable tax rate: Rates and applicability must be verified against legal service classification and GST registration status before live deployment.',
  updated_at: new Date().toISOString()
};

const STORAGE_KEY_PLANS = 'doorbly_subscription_plans';
const STORAGE_KEY_TAX = 'doorbly_subscription_tax_config';
const STORAGE_KEY_SUBSCRIPTIONS = 'doorbly_partner_subscriptions_store';
const STORAGE_KEY_PAYMENTS = 'doorbly_subscription_payments_store';
const STORAGE_KEY_COMMISSIONS = 'doorbly_job_commission_records_store';
const STORAGE_KEY_AUDIT_LOGS = 'doorbly_subscription_audit_logs';

export interface PriceBreakdown {
  plan_code: PlanCode;
  plan_name: string;
  monthly_price: number;
  commission_percent: number;
  tax_rate_percent: number;
  tax_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  total_payable: number;
  partner_retention_percent: number;
  partner_retention_per_1000: number;
  company_commission_per_1000: number;
  tax_disclaimer: string;
}

class SubscriptionService {
  /**
   * Calculate precise Indian Rupee price breakdown with tax
   */
  public calculateBreakdown(plan: SubscriptionPlan, taxConfig: TaxConfiguration): PriceBreakdown {
    const isStarter = plan.plan_code === 'starter' || plan.monthly_price === 0;
    const taxRate = isStarter || !plan.tax_configuration.is_tax_applicable ? 0 : taxConfig.tax_rate_percent;

    // e.g. for ₹370 at 18%: tax = 370 * 0.18 = 66.60; total = 436.60
    const rawTax = isStarter ? 0 : (plan.monthly_price * taxRate) / 100;
    const taxAmount = Math.round(rawTax * 100) / 100;
    const halfTax = Math.round((taxAmount / 2) * 100) / 100;
    const totalPayable = Math.round((plan.monthly_price + taxAmount) * 100) / 100;

    const commissionPercent = plan.commission_percent;
    const partnerRetentionPercent = 100 - commissionPercent;
    const companyCommissionPer1000 = Math.round((1000 * commissionPercent) / 100);
    const partnerRetentionPer1000 = 1000 - companyCommissionPer1000;

    return {
      plan_code: plan.plan_code,
      plan_name: plan.plan_name,
      monthly_price: plan.monthly_price,
      commission_percent: commissionPercent,
      tax_rate_percent: taxRate,
      tax_amount: taxAmount,
      cgst_amount: halfTax,
      sgst_amount: halfTax,
      total_payable: totalPayable,
      partner_retention_percent: partnerRetentionPercent,
      partner_retention_per_1000: partnerRetentionPer1000,
      company_commission_per_1000: companyCommissionPer1000,
      tax_disclaimer: isStarter
        ? 'No tax applicable on ₹0 Starter plan.'
        : `Includes ${taxConfig.tax_name} @ ${taxRate}%. ${taxConfig.verification_required_notice}`
    };
  }

  /**
   * Get all active subscription plans
   */
  public async getPlans(): Promise<SubscriptionPlan[]> {
    return supabaseDataEngine.fetchWithEngine('subscription:plans', async () => {
      const client = supabaseService.getClient();
      if (client) {
        try {
          const { data, error } = await client
            .from('doorbly_subscription_plans')
            .select('*')
            .order('monthly_price', { ascending: true });

          if (!error && data && data.length > 0) {
            localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(data));
            return data as SubscriptionPlan[];
          }
        } catch (e) {
          console.warn('getPlans Supabase error:', e);
        }
      }

      try {
        const cached = localStorage.getItem(STORAGE_KEY_PLANS);
        if (cached) {
          const parsed = JSON.parse(cached) as SubscriptionPlan[];
          if (parsed && parsed.length > 0) return parsed;
        }
      } catch {
        // ignore
      }

      localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(DEFAULT_SUBSCRIPTION_PLANS));
      return DEFAULT_SUBSCRIPTION_PLANS;
    });
  }

  /**
   * Get Tax Configuration
   */
  public async getTaxConfiguration(): Promise<TaxConfiguration> {
    return supabaseDataEngine.fetchWithEngine('subscription:taxConfig', async () => {
      const client = supabaseService.getClient();
      if (client) {
        try {
          const { data, error } = await client
            .from('doorbly_tax_configurations')
            .select('*')
            .eq('id', DEFAULT_TAX_CONFIG.id)
            .maybeSingle();

          if (!error && data) {
            localStorage.setItem(STORAGE_KEY_TAX, JSON.stringify(data));
            return data as TaxConfiguration;
          }
        } catch (e) {
          console.warn('getTaxConfiguration Supabase notice:', e);
        }
      }

      try {
        const cached = localStorage.getItem(STORAGE_KEY_TAX);
        if (cached) {
          return JSON.parse(cached) as TaxConfiguration;
        }
      } catch {
        // ignore
      }

      localStorage.setItem(STORAGE_KEY_TAX, JSON.stringify(DEFAULT_TAX_CONFIG));
      return DEFAULT_TAX_CONFIG;
    });
  }

  /**
   * Update Tax Configuration from Admin Panel
   */
  public async updateTaxConfiguration(
    updates: Partial<TaxConfiguration>,
    adminEmail = 'admin@doorbly.com'
  ): Promise<TaxConfiguration> {
    const current = await this.getTaxConfiguration();
    const updated: TaxConfiguration = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY_TAX, JSON.stringify(updated));
    supabaseDataEngine.primeCache('subscription:taxConfig', updated);

    const client = supabaseService.getClient();
    if (client) {
      try {
        await supabaseDataEngine.executeWrite(
          async () =>
            await client
              .from('doorbly_tax_configurations')
              .upsert(updated)
              .select(),
          ['subscription:taxConfig']
        );
      } catch (e) {
        console.warn('Failed to upsert tax configuration in Supabase:', e);
      }
    }

    // Log admin audit
    this.recordAuditLog({
      subscription_id: 'tax_config',
      partner_id: 'system',
      admin_email: adminEmail,
      action: 'UPDATE_TAX_CONFIG',
      previous_state: JSON.stringify(current),
      new_state: JSON.stringify(updated),
      reason: 'Admin adjusted tax rate or settings'
    });

    return updated;
  }

  /**
   * Update Plan settings from Admin Panel
   */
  public async updatePlan(
    planId: string,
    updates: Partial<SubscriptionPlan>,
    adminEmail = 'admin@doorbly.com'
  ): Promise<SubscriptionPlan[]> {
    const plans = await this.getPlans();
    const targetIdx = plans.findIndex((p) => p.id === planId);
    if (targetIdx === -1) return plans;

    const previous = plans[targetIdx];
    const updated: SubscriptionPlan = {
      ...previous,
      ...updates,
      updated_at: new Date().toISOString()
    };
    plans[targetIdx] = updated;

    localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
    supabaseDataEngine.primeCache('subscription:plans', plans);

    const client = supabaseService.getClient();
    if (client) {
      try {
        await supabaseDataEngine.executeWrite(
          async () =>
            await client
              .from('doorbly_subscription_plans')
              .upsert(updated)
              .select(),
          ['subscription:plans']
        );
      } catch (e) {
        console.warn('Failed to upsert plan in Supabase:', e);
      }
    }

    this.recordAuditLog({
      subscription_id: planId,
      partner_id: 'system',
      admin_email: adminEmail,
      action: 'UPDATE_PLAN_TERMS',
      previous_state: JSON.stringify(previous),
      new_state: JSON.stringify(updated),
      reason: `Admin updated plan ${updated.plan_name}`
    });

    return plans;
  }

  /**
   * Get Active Partner Subscription
   */
  public async getActiveSubscription(partnerId: string): Promise<PartnerSubscription | null> {
    return supabaseDataEngine.fetchWithEngine(`subscription:active:${partnerId}`, async () => {
      const client = supabaseService.getClient();
      if (client) {
        try {
          const { data, error } = await client
            .from('doorbly_partner_subscriptions')
            .select('*')
            .eq('partner_id', partnerId)
            .eq('status', 'active')
            .maybeSingle();

          if (!error && data) {
            const sub = data as PartnerSubscription;
            // Check expiry
            if (new Date(sub.expires_at).getTime() < Date.now()) {
              await this.handleSubscriptionExpiry(sub);
              return await this.createDefaultStarterSubscription(partnerId);
            }
            return sub;
          }
        } catch (e) {
          console.warn('getActiveSubscription Supabase error:', e);
        }
      }

      // Check local store
      const localSubs = this.getLocalSubscriptions(partnerId);
      const active = localSubs.find((s) => s.status === 'active');
      if (active) {
        if (new Date(active.expires_at).getTime() < Date.now()) {
          active.status = 'expired';
          this.saveLocalSubscriptions(partnerId, localSubs);
          return await this.createDefaultStarterSubscription(partnerId);
        }
        return active;
      }

      // Default fallback: Starter plan (₹0/mo, 20% commission)
      return await this.createDefaultStarterSubscription(partnerId);
    });
  }

  /**
   * Create or fetch default Starter subscription for partner
   */
  public async createDefaultStarterSubscription(partnerId: string): Promise<PartnerSubscription> {
    const starterPlan = DEFAULT_SUBSCRIPTION_PLANS.find((p) => p.plan_code === 'starter')!;
    const now = new Date();
    const expiry = new Date(now.getTime() + 365 * 86400000); // 1-year perpetual starter

    const newSub: PartnerSubscription = {
      id: `sub_${partnerId}_starter_${Date.now()}`,
      partner_id: partnerId,
      plan_id: starterPlan.id,
      plan_code: 'starter',
      plan_name: starterPlan.plan_name,
      commission_percent: starterPlan.commission_percent,
      status: 'active',
      start_at: now.toISOString(),
      expires_at: expiry.toISOString(),
      auto_renew: true,
      payment_status: 'free',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    const localSubs = this.getLocalSubscriptions(partnerId);
    // Deactivate previous
    localSubs.forEach((s) => {
      if (s.status === 'active') s.status = 'expired';
    });
    localSubs.unshift(newSub);
    this.saveLocalSubscriptions(partnerId, localSubs);
    supabaseDataEngine.primeCache(`subscription:active:${partnerId}`, newSub);

    const client = supabaseService.getClient();
    if (client) {
      try {
        await client.from('doorbly_partner_subscriptions').upsert(newSub);
      } catch {
        // ignore
      }
    }

    return newSub;
  }

  /**
   * Purchase / Activate a Subscription Plan
   */
  public async subscribeToPlan(
    partnerId: string,
    planCode: PlanCode,
    options?: {
      paymentGateway?: string;
      gatewayPaymentRef?: string;
      durationDays?: number;
      partnerName?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    subscription?: PartnerSubscription;
    payment?: SubscriptionPayment;
    invoiceNumber?: string;
  }> {
    const plans = await this.getPlans();
    const selectedPlan = plans.find((p) => p.plan_code === planCode) || DEFAULT_SUBSCRIPTION_PLANS.find((p) => p.plan_code === planCode);
    if (!selectedPlan) {
      return { success: false, message: 'Invalid subscription plan selected.' };
    }

    const taxConfig = await this.getTaxConfiguration();
    const breakdown = this.calculateBreakdown(selectedPlan, taxConfig);

    const isStarter = selectedPlan.plan_code === 'starter' || selectedPlan.monthly_price === 0;
    const durationDays = options?.durationDays || 30;

    const now = new Date();
    const expiresAt = isStarter
      ? new Date(now.getTime() + 365 * 86400000).toISOString()
      : new Date(now.getTime() + durationDays * 86400000).toISOString();

    const subscriptionId = `sub_${partnerId}_${Date.now()}`;
    const invoiceNumber = this.generateInvoiceNumber();
    const paymentId = `pay_${Date.now()}`;

    const gatewayRef = options?.gatewayPaymentRef || (isStarter ? 'FREE_ACTIVATION' : `UPI_TXN_${Date.now()}`);
    const gatewayName = options?.paymentGateway || (isStarter ? 'Free Tier' : 'UPI / Payment Gateway');

    // Subscription Payment Record
    const paymentRecord: SubscriptionPayment = {
      id: paymentId,
      partner_subscription_id: subscriptionId,
      partner_id: partnerId,
      plan_id: selectedPlan.id,
      plan_code: selectedPlan.plan_code,
      amount_before_tax: breakdown.monthly_price,
      tax_rate_percent: breakdown.tax_rate_percent,
      tax_amount: breakdown.tax_amount,
      total_amount: breakdown.total_payable,
      currency: 'INR',
      payment_gateway: gatewayName,
      gateway_payment_reference: gatewayRef,
      payment_status: 'completed',
      invoice_number: invoiceNumber,
      created_at: now.toISOString()
    };

    // Partner Subscription Record
    const subscriptionRecord: PartnerSubscription = {
      id: subscriptionId,
      partner_id: partnerId,
      plan_id: selectedPlan.id,
      plan_code: selectedPlan.plan_code,
      plan_name: selectedPlan.plan_name,
      commission_percent: selectedPlan.commission_percent,
      status: 'active',
      start_at: now.toISOString(),
      expires_at: expiresAt,
      auto_renew: true,
      payment_status: isStarter ? 'free' : 'paid',
      latest_payment_id: paymentId,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    // 1. Save in local store
    const localSubs = this.getLocalSubscriptions(partnerId);
    localSubs.forEach((s) => {
      if (s.status === 'active') s.status = 'cancelled';
    });
    localSubs.unshift(subscriptionRecord);
    this.saveLocalSubscriptions(partnerId, localSubs);

    const allPayments = this.getAllLocalPayments();
    allPayments.unshift(paymentRecord);
    this.saveAllLocalPayments(allPayments);

    // 2. Sync to Supabase if connected
    const client = supabaseService.getClient();
    if (client) {
      try {
        await supabaseDataEngine.executeWrite(
          async () => {
            await client
              .from('doorbly_partner_subscriptions')
              .update({ status: 'cancelled' })
              .eq('partner_id', partnerId)
              .eq('status', 'active');

            await client.from('doorbly_partner_subscriptions').insert(subscriptionRecord);
            await client.from('doorbly_subscription_payments').insert(paymentRecord);
          },
          [
            `subscription:active:${partnerId}`,
            `subscription:history:${partnerId}`,
            'admin:subscriptions',
            'admin:payments'
          ]
        );
      } catch (e) {
        console.warn('Failed to persist subscription in Supabase:', e);
      }
    }

    supabaseDataEngine.primeCache(`subscription:active:${partnerId}`, subscriptionRecord);
    supabaseDataEngine.invalidate(`subscription:history:${partnerId}`);
    supabaseDataEngine.invalidate('admin:subscriptions');
    supabaseDataEngine.invalidate('admin:payments');

    // Also sync with existing PartnerMembership for backward compatibility
    const membershipUpdate: PartnerMembership = {
      id: `mem_${partnerId}`,
      partner_id: partnerId,
      plan_name: `${selectedPlan.plan_name} Plan (${selectedPlan.commission_percent}% Comm.)`,
      monthly_fee: breakdown.total_payable,
      status: 'active',
      start_date: now.toISOString(),
      expiry_date: expiresAt,
      payment_status: isStarter ? 'free' as any : 'paid',
      payment_reference: gatewayRef,
      plan_code: selectedPlan.plan_code
    };
    await supabaseService.updateMembership(membershipUpdate);

    // 3. Send Partner Notification
    const notifTitle = isStarter
      ? 'Starter Plan Activated (20% Comm.)'
      : `${selectedPlan.plan_name} Subscription Active! (${selectedPlan.commission_percent}% Comm.)`;

    const notifMsg = isStarter
      ? 'Your ₹0 Starter Plan is active. You retain 80% earnings on completed jobs with zero subscription fees.'
      : `Payment confirmed for ${selectedPlan.plan_name} (₹${breakdown.total_payable}). Invoice #${invoiceNumber} generated. Enjoy ${selectedPlan.commission_percent}% low commission!`;

    await supabaseService.createNotification(partnerId, {
      title: notifTitle,
      message: notifMsg,
      type: 'MEMBERSHIP_UPDATE'
    });

    return {
      success: true,
      message: isStarter
        ? 'Starter plan activated successfully! Zero fees, 20% company commission.'
        : `${selectedPlan.plan_name} subscription activated successfully! Invoice #${invoiceNumber}`,
      subscription: subscriptionRecord,
      payment: paymentRecord,
      invoiceNumber
    };
  }

  /**
   * Handle expired subscription: notify and fallback to Starter
   */
  private async handleSubscriptionExpiry(expiredSub: PartnerSubscription): Promise<void> {
    expiredSub.status = 'expired';
    expiredSub.updated_at = new Date().toISOString();

    const client = supabaseService.getClient();
    if (client) {
      try {
        await client
          .from('doorbly_partner_subscriptions')
          .update({ status: 'expired' })
          .eq('id', expiredSub.id);
      } catch {
        // ignore
      }
    }

    await supabaseService.createNotification(expiredSub.partner_id, {
      title: `Subscription Expired: ${expiredSub.plan_name}`,
      message:
        'Your subscription has expired. In accordance with the disclosed policy, your account has moved to the default Starter plan (20% commission). Renew your Growth or Professional plan to retain up to 93% earnings.',
      type: 'MEMBERSHIP_UPDATE'
    });
  }

  /**
   * Automatic Commission Calculation for Completed Job
   * Rule: Record immutable commission record in job_commission_records to protect historical data
   */
  public async calculateAndRecordJobCommission(
    jobId: string,
    partnerId: string,
    commissionableAmount: number
  ): Promise<{
    commissionPercent: number;
    commissionAmount: number;
    partnerEarnings: number;
    planCode: PlanCode;
    record: JobCommissionRecord;
  }> {
    // 1. Prevent duplicate deduction if already calculated
    const existing = await this.getJobCommissionRecordByJobId(jobId);
    if (existing) {
      return {
        commissionPercent: existing.commission_percent,
        commissionAmount: existing.commission_amount,
        partnerEarnings: existing.partner_earnings,
        planCode: existing.plan_code_at_transaction,
        record: existing
      };
    }

    // 2. Fetch active partner subscription
    const activeSub = await this.getActiveSubscription(partnerId);
    const planCode = activeSub?.plan_code || 'starter';
    const commissionPercent = activeSub?.commission_percent ?? 20;

    // 3. Compute company commission and partner retainment
    // e.g. for ₹1,000 order:
    // Starter (20%): commission = ₹200, partner = ₹800
    // Growth (12%): commission = ₹120, partner = ₹880
    // Professional (7%): commission = ₹70, partner = ₹930
    const rawCommission = (commissionableAmount * commissionPercent) / 100;
    const commissionAmount = Math.round(rawCommission * 100) / 100;
    const partnerEarnings = Math.round((commissionableAmount - commissionAmount) * 100) / 100;

    const record: JobCommissionRecord = {
      id: `comm_${jobId}_${Date.now()}`,
      job_id: jobId,
      partner_id: partnerId,
      subscription_id: activeSub?.id || 'starter_fallback',
      plan_code_at_transaction: planCode,
      commissionable_amount: commissionableAmount,
      commission_percent: commissionPercent,
      commission_amount: commissionAmount,
      tax_amount_if_applicable: 0,
      partner_earnings: partnerEarnings,
      transaction_status: 'credited',
      created_at: new Date().toISOString()
    };

    // 4. Save commission record locally
    const commissions = this.getAllLocalCommissions();
    commissions.unshift(record);
    this.saveAllLocalCommissions(commissions);

    // 5. Persist to Supabase
    const client = supabaseService.getClient();
    if (client) {
      try {
        await supabaseDataEngine.executeWrite(
          async () => await client.from('doorbly_job_commission_records').insert(record),
          ['admin:commissions', `commissions:${partnerId}`]
        );
      } catch (e) {
        console.warn('Failed to insert commission record in Supabase:', e);
      }
    }

    return {
      commissionPercent,
      commissionAmount,
      partnerEarnings,
      planCode,
      record
    };
  }

  /**
   * Get job commission record for a job
   */
  public async getJobCommissionRecordByJobId(jobId: string): Promise<JobCommissionRecord | null> {
    const all = this.getAllLocalCommissions();
    const found = all.find((c) => c.job_id === jobId);
    if (found) return found;

    const client = supabaseService.getClient();
    if (client) {
      try {
        const { data } = await client
          .from('doorbly_job_commission_records')
          .select('*')
          .eq('job_id', jobId)
          .maybeSingle();

        if (data) return data as JobCommissionRecord;
      } catch {
        // ignore
      }
    }

    return null;
  }

  /**
   * Get subscription payment and invoices history for partner
   */
  public async getPartnerPaymentsAndInvoices(partnerId: string): Promise<SubscriptionPayment[]> {
    const all = this.getAllLocalPayments();
    const partnerPayments = all.filter((p) => p.partner_id === partnerId);

    const client = supabaseService.getClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('doorbly_subscription_payments')
          .select('*')
          .eq('partner_id', partnerId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as SubscriptionPayment[];
        }
      } catch {
        // ignore
      }
    }

    return partnerPayments;
  }

  /**
   * Get partner subscription history
   */
  public async getPartnerSubscriptionHistory(partnerId: string): Promise<PartnerSubscription[]> {
    return this.getLocalSubscriptions(partnerId);
  }

  /**
   * Get all partner subscriptions for Admin Panel
   */
  public async getAllSubscriptionsAdmin(): Promise<PartnerSubscription[]> {
    return supabaseDataEngine.fetchWithEngine('admin:subscriptions', async () => {
      const client = supabaseService.getClient();
      if (client) {
        try {
          const { data, error } = await client
            .from('doorbly_partner_subscriptions')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data) return data as PartnerSubscription[];
        } catch {
          // ignore
        }
      }

      const all: PartnerSubscription[] = [];
      try {
        const raw = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
        if (raw) {
          const dict = JSON.parse(raw) as Record<string, PartnerSubscription[]>;
          Object.values(dict).forEach((arr) => all.push(...arr));
        }
      } catch {
        // ignore
      }
      return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });
  }

  /**
   * Get all payments for Admin Panel
   */
  public async getAllPaymentsAdmin(): Promise<SubscriptionPayment[]> {
    return supabaseDataEngine.fetchWithEngine('admin:payments', async () => {
      const client = supabaseService.getClient();
      if (client) {
        try {
          const { data, error } = await client
            .from('doorbly_subscription_payments')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data) return data as SubscriptionPayment[];
        } catch {
          // ignore
        }
      }
      return this.getAllLocalPayments();
    });
  }

  /**
   * Get all commission records for Admin Panel
   */
  public async getAllCommissionRecordsAdmin(): Promise<JobCommissionRecord[]> {
    return supabaseDataEngine.fetchWithEngine('admin:commissions', async () => {
      const client = supabaseService.getClient();
      if (client) {
        try {
          const { data, error } = await client
            .from('doorbly_job_commission_records')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data) return data as JobCommissionRecord[];
        } catch {
          // ignore
        }
      }
      return this.getAllLocalCommissions();
    });
  }

  /**
   * Admin manual correction of subscription with audit log
   */
  public async adminManualCorrectSubscription(
    subscriptionId: string,
    partnerId: string,
    updates: {
      planCode?: PlanCode;
      status?: 'active' | 'expired' | 'cancelled';
      expiresAt?: string;
      reason: string;
      adminEmail: string;
    }
  ): Promise<boolean> {
    const subs = this.getLocalSubscriptions(partnerId);
    const target = subs.find((s) => s.id === subscriptionId);
    if (!target) return false;

    const previous = { ...target };
    if (updates.status) target.status = updates.status;
    if (updates.expiresAt) target.expires_at = updates.expiresAt;
    if (updates.planCode) {
      const plans = await this.getPlans();
      const plan = plans.find((p) => p.plan_code === updates.planCode);
      if (plan) {
        target.plan_code = plan.plan_code;
        target.plan_name = plan.plan_name;
        target.commission_percent = plan.commission_percent;
      }
    }
    target.updated_at = new Date().toISOString();

    this.saveLocalSubscriptions(partnerId, subs);

    const client = supabaseService.getClient();
    if (client) {
      try {
        await client
          .from('doorbly_partner_subscriptions')
          .update(target)
          .eq('id', subscriptionId);
      } catch {
        // ignore
      }
    }

    this.recordAuditLog({
      subscription_id: subscriptionId,
      partner_id: partnerId,
      admin_email: updates.adminEmail,
      action: 'MANUAL_CORRECTION',
      previous_state: JSON.stringify(previous),
      new_state: JSON.stringify(target),
      reason: updates.reason
    });

    supabaseDataEngine.invalidate(`subscription:active:${partnerId}`);
    supabaseDataEngine.invalidate('admin:subscriptions');
    return true;
  }

  /**
   * Generate sequential/unique invoice number
   */
  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    return `INV-${year}-${randomSuffix}`;
  }

  /**
   * Record Audit Log
   */
  private recordAuditLog(log: Omit<SubscriptionAuditLog, 'id' | 'created_at'>): void {
    const fullLog: SubscriptionAuditLog = {
      ...log,
      id: `audit_${Date.now()}`,
      created_at: new Date().toISOString()
    };
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
      const list: SubscriptionAuditLog[] = stored ? JSON.parse(stored) : [];
      list.unshift(fullLog);
      localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(list.slice(0, 100)));
    } catch {
      // ignore
    }
  }

  // --- Local storage helpers ---
  private getLocalSubscriptions(partnerId: string): PartnerSubscription[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
      if (data) {
        const parsed = JSON.parse(data) as Record<string, PartnerSubscription[]>;
        return parsed[partnerId] || [];
      }
    } catch {
      // ignore
    }
    return [];
  }

  private saveLocalSubscriptions(partnerId: string, subs: PartnerSubscription[]): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
      const dict: Record<string, PartnerSubscription[]> = data ? JSON.parse(data) : {};
      dict[partnerId] = subs;
      localStorage.setItem(STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(dict));
    } catch {
      // ignore
    }
  }

  private getAllLocalPayments(): SubscriptionPayment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PAYMENTS);
      if (data) return JSON.parse(data) as SubscriptionPayment[];
    } catch {
      // ignore
    }
    return [];
  }

  private saveAllLocalPayments(payments: SubscriptionPayment[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(payments));
    } catch {
      // ignore
    }
  }

  private getAllLocalCommissions(): JobCommissionRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_COMMISSIONS);
      if (data) return JSON.parse(data) as JobCommissionRecord[];
    } catch {
      // ignore
    }
    return [];
  }

  private saveAllLocalCommissions(commissions: JobCommissionRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_COMMISSIONS, JSON.stringify(commissions));
    } catch {
      // ignore
    }
  }
}

export const subscriptionService = new SubscriptionService();
