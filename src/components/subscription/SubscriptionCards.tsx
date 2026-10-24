import React, { useState } from 'react';
import { SubscriptionPlan, PartnerSubscription, TaxConfiguration, PlanCode } from '../../types';
import { subscriptionService, PriceBreakdown } from '../../services/subscriptionService';
import { usePartner } from '../../context/PartnerContext';
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Clock,
  Coins,
  TrendingUp,
  Percent,
  Calendar,
  Zap,
  Check
} from 'lucide-react';
import { SubscriptionCheckoutModal } from './SubscriptionCheckoutModal';

interface SubscriptionCardsProps {
  layout?: 'grid' | 'dashboard-carousel';
  onPlanActivated?: () => void;
}

export const SubscriptionCards: React.FC<SubscriptionCardsProps> = ({
  layout = 'grid',
  onPlanActivated
}) => {
  const { activeSubscription, subscriptionPlans, taxConfig, refreshAll } = usePartner();
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);

  const plans = subscriptionPlans && subscriptionPlans.length > 0 ? subscriptionPlans : [];

  const activePlanCode: PlanCode = activeSubscription?.plan_code || 'starter';

  return (
    <div className="space-y-4">
      {/* Cards Display Grid */}
      <div
        className={
          layout === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-3 gap-3.5'
            : 'space-y-3.5'
        }
      >
        {plans.map((plan) => {
          const isCurrentPlan = activePlanCode === plan.plan_code && activeSubscription?.status === 'active';
          const isRecommended = plan.is_recommended || plan.plan_code === 'growth';
          const isStarter = plan.plan_code === 'starter' || plan.monthly_price === 0;

          const breakdown: PriceBreakdown = subscriptionService.calculateBreakdown(
            plan,
            taxConfig || {
              id: 'tax_config_in',
              tax_name: 'GST',
              tax_rate_percent: 18,
              is_active: true,
              hsn_sac_code: '998314',
              gstin_number: '21AAACD1234F1Z5',
              place_of_supply: 'Odisha (21)',
              verification_required_notice: 'Illustrative 18% GST',
              updated_at: new Date().toISOString()
            }
          );

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-5 border transition-all duration-200 relative flex flex-col justify-between ${
                isCurrentPlan
                  ? 'bg-gradient-to-br from-teal-50/90 via-white to-teal-50/50 border-[#0F766E] shadow-md ring-2 ring-[#0F766E]/20'
                  : isRecommended
                  ? 'bg-white border-amber-300 shadow-sm hover:border-amber-400 ring-1 ring-amber-200/50'
                  : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-black text-xs uppercase tracking-wider px-2.5 py-0.5 rounded-lg ${
                      plan.plan_code === 'professional'
                        ? 'bg-purple-100 text-purple-900 border border-purple-200'
                        : plan.plan_code === 'growth'
                        ? 'bg-teal-100 text-teal-900 border border-teal-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    PLAN {plan.plan_code === 'starter' ? 'A — STARTER' : plan.plan_code === 'growth' ? 'B — GROWTH' : 'C — PROFESSIONAL'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isRecommended && !isCurrentPlan && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] tracking-tight uppercase shadow-2xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Recommended</span>
                    </span>
                  )}

                  {isCurrentPlan && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0F766E] text-white font-extrabold text-[10px] tracking-tight uppercase shadow-2xs flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Your Current Plan</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Price & Duration */}
              <div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-black tracking-tight text-slate-900">
                    ₹{plan.monthly_price}
                  </span>
                  <span className="text-slate-500 text-xs ml-1.5 font-medium">/ month</span>
                </div>

                {/* Pre-checkout tax preview for paid plans */}
                {!isStarter ? (
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    + ₹{breakdown.tax_amount.toFixed(2)} tax ({breakdown.tax_rate_percent}% GST) ={' '}
                    <strong className="text-slate-900 font-bold">₹{breakdown.total_payable.toFixed(2)} total</strong>
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                    ₹0 subscription fee · Zero upfront cost
                  </div>
                )}

                {/* Prominent Commission Highlight Badge */}
                <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Company Commission
                    </span>
                    <span className="text-sm font-black text-[#0F766E]">
                      {plan.commission_percent}% per job
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-500">Partner Earnings Retained:</span>
                    <span className="font-extrabold text-emerald-700">
                      {breakdown.partner_retention_percent}%
                    </span>
                  </div>

                  {/* Estimated Partner Retention per ₹1,000 Service */}
                  <div className="flex items-center justify-between text-[11px] bg-white p-1.5 rounded-xl border border-slate-200/70">
                    <span className="text-slate-600 font-medium">On ₹1,000 Completed Service:</span>
                    <span className="font-mono font-black text-slate-900">
                      You Keep ₹{breakdown.partner_retention_per_1000}
                    </span>
                  </div>
                </div>

                {/* Feature Bullets */}
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  {plan.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] leading-snug">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button & Validity Info */}
              <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                {isCurrentPlan && activeSubscription ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Status: <strong className="text-emerald-700">Active</strong></span>
                      <span>
                        Expires: {new Date(activeSubscription.expires_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPlanForCheckout(plan)}
                      className="w-full py-2.5 px-4 rounded-xl border border-[#0F766E] text-[#0F766E] hover:bg-teal-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Renew Subscription</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedPlanForCheckout(plan)}
                    className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                      isRecommended
                        ? 'bg-[#0F766E] hover:bg-teal-700 active:bg-teal-800 text-white'
                        : isStarter
                        ? 'bg-slate-900 hover:bg-slate-800 text-white'
                        : 'bg-[#0F766E] hover:bg-teal-700 text-white'
                    }`}
                  >
                    <span>{isStarter ? 'Activate Free Starter' : `Select ${plan.plan_name}`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription Checkout Modal */}
      {selectedPlanForCheckout && (
        <SubscriptionCheckoutModal
          plan={selectedPlanForCheckout}
          taxConfig={taxConfig}
          onClose={() => setSelectedPlanForCheckout(null)}
          onSuccess={async () => {
            setSelectedPlanForCheckout(null);
            await refreshAll();
            if (onPlanActivated) onPlanActivated();
          }}
        />
      )}
    </div>
  );
};
