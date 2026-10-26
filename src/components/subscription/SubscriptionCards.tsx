import React, { useState } from 'react';
import { SubscriptionPlan, PlanCode } from '../../types';
import {
  subscriptionService,
  PriceBreakdown,
  DEFAULT_SUBSCRIPTION_PLANS
} from '../../services/subscriptionService';
import { usePartner } from '../../context/PartnerContext';
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Calendar,
  Zap,
  Check,
  TrendingUp,
  Award,
  Crown,
  BellRing,
  Wallet,
  Headphones,
  CheckCheck
} from 'lucide-react';
import { SubscriptionCheckoutModal } from './SubscriptionCheckoutModal';

import starterIllustration from '../../assets/images/plan_starter_illustration_1792949301105.jpg';
import growthIllustration from '../../assets/images/plan_growth_illustration_1792949317578.jpg';
import professionalIllustration from '../../assets/images/plan_professional_illustration_1792949333786.jpg';

interface SubscriptionCardsProps {
  layout?: 'grid' | 'dashboard-carousel';
  onPlanActivated?: () => void;
}

interface PlanVisualConfig {
  image: string;
  planLetter: string;
  tierName: string;
  tagline: string;
  cardBorder: string;
  imageBorder: string;
  headerBadgeBg: string;
  accentColor: string;
  progressColor: string;
  progressBg: string;
  commissionTag: string;
  extraGainBadge?: string;
  icon: React.ComponentType<{ className?: string }>;
  buttonClass: string;
}

const PLAN_CONFIGS: Record<PlanCode, PlanVisualConfig> = {
  starter: {
    image: starterIllustration,
    planLetter: 'PLAN A',
    tierName: 'STARTER',
    tagline: 'Standard access for partners starting their doorstep service journey',
    cardBorder: 'border-slate-200 hover:border-teal-300 shadow-sm',
    imageBorder: 'border-slate-100',
    headerBadgeBg: 'bg-slate-900/80 text-white border-slate-700/80',
    accentColor: 'text-slate-800',
    progressColor: 'bg-slate-700',
    progressBg: 'bg-slate-100',
    commissionTag: '20% Commission',
    icon: Zap,
    buttonClass: 'bg-slate-900 hover:bg-slate-800 text-white'
  },
  growth: {
    image: growthIllustration,
    planLetter: 'PLAN B',
    tierName: 'GROWTH',
    tagline: 'Accelerate earnings with priority dispatch & 88% payout retention',
    cardBorder: 'border-teal-500 shadow-lg ring-2 ring-[#0F766E]/20 hover:border-teal-600',
    imageBorder: 'border-teal-200/60',
    headerBadgeBg: 'bg-[#0F766E] text-white border-teal-400/50',
    accentColor: 'text-[#0F766E]',
    progressColor: 'bg-[#0F766E]',
    progressBg: 'bg-teal-50',
    commissionTag: '12% Commission',
    extraGainBadge: '+₹80 extra per ₹1,000',
    icon: TrendingUp,
    buttonClass: 'bg-[#0F766E] hover:bg-teal-700 text-white shadow-md shadow-teal-900/10'
  },
  professional: {
    image: professionalIllustration,
    planLetter: 'PLAN C',
    tierName: 'PROFESSIONAL',
    tagline: 'VIP tier for full-time pros — ultra-low 7% fee, retain 93% on every job',
    cardBorder: 'border-purple-300 shadow-md ring-1 ring-purple-200/50 hover:border-purple-400',
    imageBorder: 'border-purple-200/60',
    headerBadgeBg: 'bg-purple-900/90 text-purple-100 border-purple-500/50',
    accentColor: 'text-purple-700',
    progressColor: 'bg-gradient-to-r from-purple-600 to-indigo-600',
    progressBg: 'bg-purple-50',
    commissionTag: '7% Commission',
    extraGainBadge: '+₹130 extra per ₹1,000',
    icon: Crown,
    buttonClass: 'bg-gradient-to-r from-purple-700 to-teal-800 hover:from-purple-800 hover:to-teal-900 text-white shadow-md shadow-purple-950/15'
  }
};

export const SubscriptionCards: React.FC<SubscriptionCardsProps> = ({
  layout = 'grid',
  onPlanActivated
}) => {
  const { activeSubscription, subscriptionPlans, taxConfig, refreshAll } = usePartner();
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);

  const plans: SubscriptionPlan[] =
    subscriptionPlans && subscriptionPlans.length > 0
      ? subscriptionPlans
      : DEFAULT_SUBSCRIPTION_PLANS;

  const activePlanCode: PlanCode = activeSubscription?.plan_code || 'starter';

  return (
    <div className="space-y-4">
      {/* Cards Container */}
      <div
        className={
          layout === 'dashboard-carousel'
            ? 'flex overflow-x-auto snap-x snap-mandatory gap-4 pb-3 -mx-4 px-4 no-scrollbar md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:mx-0'
            : 'grid grid-cols-1 md:grid-cols-3 gap-4'
        }
      >
        {plans.map((plan: SubscriptionPlan) => {
          const config = PLAN_CONFIGS[plan.plan_code as PlanCode] || PLAN_CONFIGS.starter;
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

          const TierIcon = config.icon;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl bg-white border overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                layout === 'dashboard-carousel'
                  ? 'min-w-[85%] sm:min-w-[320px] shrink-0 snap-center md:min-w-0 md:shrink'
                  : ''
              } ${config.cardBorder} ${isCurrentPlan ? 'ring-2 ring-emerald-500' : ''}`}
            >
              <div>
                {/* 1. Illustration Banner Header */}
                <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100 border-b border-slate-100">
                  <img
                    src={config.image}
                    alt={`${plan.plan_name} illustration`}
                    className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  {/* Subtle Gradient Scrim at bottom of image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none" />

                  {/* Overlaid Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                    <div className="flex items-center gap-1.5 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-black tracking-wide border shadow-sm bg-white/90 text-slate-900 border-white/60">
                      <TierIcon className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>{config.planLetter} · {config.tierName}</span>
                    </div>

                    {/* Status / Recommended Pills */}
                    <div className="flex items-center gap-1.5">
                      {isCurrentPlan ? (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-extrabold text-[10px] tracking-tight uppercase shadow-sm flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Active Plan</span>
                        </span>
                      ) : isRecommended ? (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-[10px] tracking-tight uppercase shadow-sm flex items-center gap-1 animate-pulse">
                          <Sparkles className="w-3 h-3 text-slate-950" />
                          <span>Recommended</span>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Commission Rate Overlay on Bottom of Image */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10 text-white">
                    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-white/20 text-xs font-extrabold">
                      <span className="text-teal-300">{plan.commission_percent}%</span>
                      <span className="text-white/90 text-[11px] font-normal">Company Fee</span>
                    </div>

                    <div className="bg-emerald-500/90 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-black text-white tracking-wide">
                      RETAIN {breakdown.partner_retention_percent}%
                    </div>
                  </div>
                </div>

                {/* 2. Plan Title & Pricing Section */}
                <div className="p-5 pb-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h4 className="font-black text-lg text-slate-900 tracking-tight">
                        {plan.plan_name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {config.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Monthly Pricing in INR */}
                  <div className="mt-3.5 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-mono">
                      ₹{plan.monthly_price}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ month</span>
                  </div>

                  {/* Pre-checkout Tax & Total Breakdown */}
                  <div className="mt-1">
                    {!isStarter ? (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <span>+ ₹{breakdown.tax_amount.toFixed(2)} ({breakdown.tax_rate_percent}% GST) =</span>
                        <strong className="text-slate-900 font-extrabold font-mono">
                          ₹{breakdown.total_payable.toFixed(2)} total
                        </strong>
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Zero monthly fee · Pay 0 upfront</span>
                      </div>
                    )}
                  </div>

                  {/* 3. Partner Retention Progress Bar & Takeaway */}
                  <div className={`mt-4 p-3.5 rounded-2xl border ${config.progressBg} border-slate-100 space-y-2`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <span>Partner Keeps:</span>
                        <strong className="font-extrabold text-emerald-800 text-sm font-mono">
                          {breakdown.partner_retention_percent}%
                        </strong>
                      </span>
                      {config.extraGainBadge && (
                        <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">
                          {config.extraGainBadge}
                        </span>
                      )}
                    </div>

                    {/* Visual Retention Progress Meter */}
                    <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${config.progressColor}`}
                        style={{ width: `${breakdown.partner_retention_percent}%` }}
                      />
                    </div>

                    {/* Earnings Calculation Example */}
                    <div className="bg-white/95 rounded-xl p-2 border border-slate-200/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-600">On ₹1,000 Service:</span>
                      <span className="font-black text-slate-900 font-mono text-xs">
                        You Retain ₹{breakdown.partner_retention_per_1000}
                      </span>
                    </div>
                  </div>

                  {/* 4. Plan Benefits Feature List */}
                  <div className="mt-4 space-y-2 text-xs">
                    {plan.benefits.map((benefit: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-slate-600 text-[11px] leading-snug">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. Card Footer & Action CTA */}
              <div className="p-4 pt-2.5 border-t border-slate-100 bg-slate-50/50">
                {isCurrentPlan && activeSubscription ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span>Status: <strong className="text-emerald-700">Active</strong></span>
                      <span>
                        Expires:{' '}
                        {new Date(activeSubscription.expires_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPlanForCheckout(plan)}
                      className="w-full py-2 px-3 rounded-xl border border-[#0F766E] text-[#0F766E] hover:bg-teal-50 active:scale-[0.99] font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>Renew Subscription</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedPlanForCheckout(plan)}
                    className={`w-full py-2 px-3 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer shadow-xs ${config.buttonClass}`}
                  >
                    <span>
                      {isStarter
                        ? 'Activate Free Starter'
                        : `Choose ${plan.plan_name} · ₹${breakdown.total_payable.toFixed(0)}`}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
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
