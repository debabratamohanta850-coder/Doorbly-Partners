import React, { useState } from 'react';
import { SubscriptionPlan, TaxConfiguration, PlanCode, SubscriptionPayment } from '../../types';
import { subscriptionService, PriceBreakdown } from '../../services/subscriptionService';
import { usePartner } from '../../context/PartnerContext';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  CreditCard,
  Smartphone,
  Lock,
  ArrowRight,
  Loader2,
  FileText,
  Sparkles
} from 'lucide-react';
import { InvoiceModal } from './InvoiceModal';

import starterIllustration from '../../assets/images/plan_starter_illustration_1792949301105.jpg';
import growthIllustration from '../../assets/images/plan_growth_illustration_1792949317578.jpg';
import professionalIllustration from '../../assets/images/plan_professional_illustration_1792949333786.jpg';

const PLAN_ILLUSTRATIONS: Record<string, string> = {
  starter: starterIllustration,
  growth: growthIllustration,
  professional: professionalIllustration
};

interface SubscriptionCheckoutModalProps {
  plan: SubscriptionPlan;
  taxConfig: TaxConfiguration | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubscriptionCheckoutModal: React.FC<SubscriptionCheckoutModalProps> = ({
  plan,
  taxConfig,
  onClose,
  onSuccess
}) => {
  const { partner, subscribeToPlan } = usePartner();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'free'>(
    plan.monthly_price === 0 ? 'free' : 'upi'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [completedPayment, setCompletedPayment] = useState<SubscriptionPayment | null>(null);

  // Compute live breakdown
  const config = taxConfig || subscriptionService.calculateBreakdown(plan, {
    id: 'tax_config_in',
    tax_name: 'GST',
    tax_rate_percent: 18,
    is_active: true,
    hsn_sac_code: '998314',
    gstin_number: '21AAACD1234F1Z5',
    place_of_supply: 'Odisha (21)',
    verification_required_notice: 'Configurable tax rate: Subject to verification before live production.',
    updated_at: new Date().toISOString()
  });

  const breakdown: PriceBreakdown = subscriptionService.calculateBreakdown(
    plan,
    taxConfig || (config as TaxConfiguration)
  );

  const isStarter = plan.plan_code === 'starter' || plan.monthly_price === 0;

  const handleConfirmAndPay = async () => {
    if (!acceptedTerms) {
      setPaymentError('Please accept the Doorbly Partner Subscription terms and conditions to proceed.');
      return;
    }

    setPaymentError(null);
    setIsProcessing(true);

    try {
      if (isStarter) {
        // Instant free activation
        const res = await subscribeToPlan('starter', {
          paymentGateway: 'Free Starter Tier',
          gatewayPaymentRef: `STARTER_${Date.now()}`
        });

        if (res.success) {
          setIsProcessing(false);
          onSuccess();
          onClose();
        } else {
          setPaymentError(res.message || 'Failed to activate plan.');
          setIsProcessing(false);
        }
      } else {
        // Paid Plan gateway verification workflow:
        // Connect payment gateway / secure verification flow
        const txnRef = `${paymentMethod.toUpperCase()}_TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

        // Emulate secure gateway roundtrip verification
        await new Promise((resolve) => setTimeout(resolve, 1400));

        const res = await subscribeToPlan(plan.plan_code, {
          paymentGateway: paymentMethod === 'upi' ? 'UPI / BHIM / QR' : 'Credit / Debit Card Gateway',
          gatewayPaymentRef: txnRef,
          durationDays: 30
        });

        if (res.success && res.invoiceNumber) {
          // Construct payment object to immediately display invoice modal
          const createdPayment: SubscriptionPayment = {
            id: `pay_${Date.now()}`,
            partner_subscription_id: `sub_${partner?.id}_${Date.now()}`,
            partner_id: partner?.id || '',
            plan_id: plan.id,
            plan_code: plan.plan_code,
            amount_before_tax: breakdown.monthly_price,
            tax_rate_percent: breakdown.tax_rate_percent,
            tax_amount: breakdown.tax_amount,
            total_amount: breakdown.total_payable,
            currency: 'INR',
            payment_gateway: paymentMethod === 'upi' ? 'UPI / BHIM' : 'Online Gateway',
            gateway_payment_reference: txnRef,
            payment_status: 'completed',
            invoice_number: res.invoiceNumber,
            created_at: new Date().toISOString()
          };
          setCompletedPayment(createdPayment);
          setIsProcessing(false);
          onSuccess();
        } else {
          setPaymentError(res.message || 'Payment verification could not be completed.');
          setIsProcessing(false);
        }
      }
    } catch (err: unknown) {
      setPaymentError(err instanceof Error ? err.message : 'Subscription checkout failed.');
      setIsProcessing(false);
    }
  };

  if (completedPayment) {
    return (
      <InvoiceModal
        payment={completedPayment}
        plan={plan}
        taxConfig={taxConfig}
        partnerName={partner?.name}
        partnerPhone={partner?.mobile}
        onClose={() => {
          setCompletedPayment(null);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
        {/* Modal Illustration Header */}
        <div className="relative h-28 w-full overflow-hidden bg-slate-900 border-b border-slate-100">
          <img
            src={PLAN_ILLUSTRATIONS[plan.plan_code] || starterIllustration}
            alt={plan.plan_name}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none" />

          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white z-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-300 block">
                {plan.plan_code === 'starter'
                  ? 'PLAN A · ZERO UPFRONT'
                  : plan.plan_code === 'growth'
                  ? 'PLAN B · RECOMMENDED'
                  : 'PLAN C · VIP PRO'}
              </span>
              <h3 className="text-lg font-black tracking-tight text-white leading-tight">
                {plan.plan_name} Plan
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xl font-black font-mono leading-none block">
                {plan.monthly_price === 0 ? '₹0' : `₹${breakdown.total_payable.toFixed(0)}`}
              </span>
              <span className="text-[10px] text-white/80">
                {plan.monthly_price === 0 ? 'Free Forever' : 'Monthly total'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 backdrop-blur-md text-white/90 hover:text-white flex items-center justify-center transition-colors cursor-pointer z-20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
          {/* Plan Commission & Benefits Summary */}
          <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs">Doorbly Commission Rate</span>
              <span className="px-2.5 py-1 rounded-full bg-[#0F766E] text-white font-black text-xs">
                {plan.commission_percent}% per job
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-teal-100 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">Partner Keeps</span>
                <span className="font-extrabold text-emerald-800 text-xs">
                  {breakdown.partner_retention_percent}% of service value
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">Per ₹1,000 Booking</span>
                <span className="font-extrabold text-emerald-800 text-xs">
                  You retain ₹{breakdown.partner_retention_per_1000}
                </span>
              </div>
            </div>
          </div>

          {/* Plan Key Benefits Checklist */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Plan Features Included
            </span>
            <div className="space-y-1">
              {plan.benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-2 text-slate-600 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transparent Price & Tax Breakdown */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Transparent Price Breakdown
            </span>

            <div className="flex items-center justify-between text-slate-600">
              <span>Subscription Amount (30 Days):</span>
              <span className="font-mono font-bold text-slate-900">
                ₹{breakdown.monthly_price.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-1">
                <span>Applicable Tax ({breakdown.tax_rate_percent}%):</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-slate-200 text-slate-600 font-semibold">
                  Configurable
                </span>
              </div>
              <span className="font-mono font-semibold text-slate-800">
                ₹{breakdown.tax_amount.toFixed(2)}
              </span>
            </div>

            {breakdown.tax_amount > 0 && (
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 px-2 py-1 bg-slate-100 rounded-lg">
                <span>CGST (9%): ₹{breakdown.cgst_amount.toFixed(2)}</span>
                <span className="text-right">SGST (9%): ₹{breakdown.sgst_amount.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-black text-slate-900 text-sm">
              <span className="text-[#0F766E]">Total Payable:</span>
              <span className="font-mono text-base text-[#0F766E]">
                ₹{breakdown.total_payable.toFixed(2)}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 leading-tight pt-1">
              * {breakdown.tax_disclaimer}
            </p>
          </div>

          {/* Payment Method Selector (for Paid plans) */}
          {!isStarter && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Select Secure Payment Method
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'bg-teal-50 border-[#0F766E] text-[#0F766E] shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-4 h-4 shrink-0 text-[#0F766E]" />
                  <div>
                    <div className="font-bold text-xs">UPI / QR</div>
                    <div className="text-[10px] text-slate-500">GPay, PhonePe, Paytm</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-teal-50 border-[#0F766E] text-[#0F766E] shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 shrink-0 text-[#0F766E]" />
                  <div>
                    <div className="font-bold text-xs">Card / NetBanking</div>
                    <div className="text-[10px] text-slate-500">Instant Gateway</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Terms Acceptance */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-[11px] text-slate-600">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 rounded text-[#0F766E] focus:ring-[#0F766E]"
            />
            <span>
              I accept the Doorbly Partner Subscription terms, 30-day duration, {plan.commission_percent}% commission policy, and agree to receive digital invoices.
            </span>
          </label>

          {/* Error Message */}
          {paymentError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{paymentError}</span>
            </div>
          )}
        </div>

        {/* Modal Footer CTA */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Payable</span>
            <span className="font-extrabold text-sm text-slate-900">
              ₹{breakdown.total_payable.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="py-1.5 px-3 rounded-lg border border-slate-300 text-slate-600 font-semibold text-[11px] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmAndPay}
              disabled={isProcessing}
              className="py-1.5 px-3.5 rounded-lg bg-[#0F766E] hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-[11px] shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Payment...</span>
                </>
              ) : isStarter ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Activate Free Starter</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" />
                  <span>Pay ₹{breakdown.total_payable.toFixed(2)} &amp; Activate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
