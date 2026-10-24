import React, { useState, useEffect } from 'react';
import {
  SubscriptionPlan,
  PartnerSubscription,
  SubscriptionPayment,
  JobCommissionRecord,
  TaxConfiguration,
  PlanCode,
  PartnerProfile
} from '../../types';
import { subscriptionService } from '../../services/subscriptionService';
import { InvoiceModal } from '../subscription/InvoiceModal';
import {
  ShieldCheck,
  TrendingUp,
  Coins,
  Receipt,
  Users,
  Settings,
  Edit2,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  Download,
  FileText,
  Calendar,
  Save,
  HelpCircle
} from 'lucide-react';

interface SubscriptionAdminViewProps {
  allPartners?: PartnerProfile[];
}

export const SubscriptionAdminView: React.FC<SubscriptionAdminViewProps> = ({
  allPartners = []
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'plans' | 'tax' | 'subscriptions' | 'payments' | 'commissions'
  >('overview');

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [taxConfig, setTaxConfig] = useState<TaxConfiguration | null>(null);
  const [subscriptions, setSubscriptions] = useState<PartnerSubscription[]>([]);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [commissions, setCommissions] = useState<JobCommissionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Editing Plan state
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCommission, setEditCommission] = useState<number>(0);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  // Editing Tax state
  const [taxRateInput, setTaxRateInput] = useState<number>(18);
  const [taxNameInput, setTaxNameInput] = useState<string>('Goods & Services Tax (GST)');
  const [sacCodeInput, setSacCodeInput] = useState<string>('998314');
  const [gstinInput, setGstinInput] = useState<string>('21AAACD1234F1Z5');
  const [posInput, setPosInput] = useState<string>('Odisha (21) / Inter-State');
  const [taxSaveSuccess, setTaxSaveSuccess] = useState(false);

  // Manual Correction state
  const [correctingSub, setCorrectingSub] = useState<PartnerSubscription | null>(null);
  const [correctionPlanCode, setCorrectionPlanCode] = useState<PlanCode>('growth');
  const [correctionStatus, setCorrectionStatus] = useState<'active' | 'expired' | 'cancelled'>('active');
  const [correctionDays, setCorrectionDays] = useState<number>(30);
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [correctionSuccess, setCorrectionSuccess] = useState<string | null>(null);

  // Invoice viewer modal state
  const [viewInvoicePayment, setViewInvoicePayment] = useState<SubscriptionPayment | null>(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'completed' | 'pending' | 'failed' | 'refunded'>('all');

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [pls, tx, subs, pymts, comms] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getTaxConfiguration(),
        subscriptionService.getAllSubscriptionsAdmin(),
        subscriptionService.getAllPaymentsAdmin(),
        subscriptionService.getAllCommissionRecordsAdmin()
      ]);
      setPlans(pls);
      setTaxConfig(tx);
      setSubscriptions(subs);
      setPayments(pymts);
      setCommissions(comms);

      if (tx) {
        setTaxRateInput(tx.tax_rate_percent);
        setTaxNameInput(tx.tax_name);
        setSacCodeInput(tx.hsn_sac_code);
        setGstinInput(tx.gstin_number);
        setPosInput(tx.place_of_supply);
      }
    } catch (e) {
      console.warn('Subscription admin load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Compute live metrics
  const starterCount = subscriptions.filter((s) => s.status === 'active' && s.plan_code === 'starter').length;
  const growthCount = subscriptions.filter((s) => s.status === 'active' && s.plan_code === 'growth').length;
  const proCount = subscriptions.filter((s) => s.status === 'active' && s.plan_code === 'professional').length;
  const totalActiveSubs = starterCount + growthCount + proCount;

  const totalSubscriptionRevenue = payments
    .filter((p) => p.payment_status === 'completed')
    .reduce((sum, p) => sum + p.total_amount, 0);

  const totalCommissionsCollected = commissions
    .filter((c) => c.transaction_status === 'credited')
    .reduce((sum, c) => sum + c.commission_amount, 0);

  const pendingPaymentsCount = payments.filter((p) => p.payment_status === 'pending').length;
  const failedPaymentsCount = payments.filter((p) => p.payment_status === 'failed' || p.payment_status === 'refunded').length;

  const handleStartEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setEditPrice(plan.monthly_price);
    setEditCommission(plan.commission_percent);
    setEditIsActive(plan.is_active);
    setEditSuccessMsg(null);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    try {
      const updated = await subscriptionService.updatePlan(editingPlan.id, {
        monthly_price: editPrice,
        commission_percent: editCommission,
        is_active: editIsActive
      });
      setPlans(updated);
      setEditSuccessMsg(`Plan "${editingPlan.plan_name}" saved successfully!`);
      setTimeout(() => {
        setEditingPlan(null);
        setEditSuccessMsg(null);
      }, 1200);
    } catch {
      // ignore
    }
  };

  const handleSaveTaxConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await subscriptionService.updateTaxConfiguration({
        tax_rate_percent: Number(taxRateInput) || 0,
        tax_name: taxNameInput.trim(),
        hsn_sac_code: sacCodeInput.trim(),
        gstin_number: gstinInput.trim(),
        place_of_supply: posInput.trim()
      });
      setTaxConfig(updated);
      setTaxSaveSuccess(true);
      setTimeout(() => setTaxSaveSuccess(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleStartManualCorrection = (sub: PartnerSubscription) => {
    setCorrectingSub(sub);
    setCorrectionPlanCode(sub.plan_code);
    setCorrectionStatus(sub.status === 'active' ? 'active' : 'expired');
    setCorrectionReason('');
    setCorrectionError(null);
    setCorrectionSuccess(null);
  };

  const handleSaveManualCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctingSub) return;
    if (!correctionReason.trim()) {
      setCorrectionError('Audit requirement: Reason for manual correction must be specified.');
      return;
    }

    const newExpiry = new Date(Date.now() + correctionDays * 86400000).toISOString();
    const ok = await subscriptionService.adminManualCorrectSubscription(
      correctingSub.id,
      correctingSub.partner_id,
      {
        planCode: correctionPlanCode,
        status: correctionStatus,
        expiresAt: newExpiry,
        reason: correctionReason.trim(),
        adminEmail: 'debabrata.tribune@gmail.com'
      }
    );

    if (ok) {
      setCorrectionSuccess('Subscription corrected and audit log recorded.');
      setTimeout(() => {
        setCorrectingSub(null);
        setCorrectionSuccess(null);
        loadAllData();
      }, 1000);
    } else {
      setCorrectionError('Failed to correct subscription.');
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesStatus = paymentFilter === 'all' || p.payment_status === paymentFilter;
    const matchesSearch =
      !searchQuery ||
      p.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.partner_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.gateway_payment_reference.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4 text-slate-100">
      {/* Top Banner & Sub-Tabs */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-900/60 border border-teal-500/40 text-teal-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Subscription &amp; Commission Management
              </h2>
              <p className="text-[11px] text-slate-400">
                Plan pricing, tax configuration, subscriber records, and commission reconciliation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadAllData}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5"
            title="Refresh All Records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-t border-slate-800/80 pt-2.5">
          {[
            { id: 'overview', label: 'Overview & Revenue', icon: TrendingUp },
            { id: 'plans', label: `Plans (${plans.length})`, icon: ShieldCheck },
            { id: 'tax', label: `Tax Settings (${taxConfig?.tax_rate_percent ?? 18}%)`, icon: Settings },
            { id: 'subscriptions', label: `Subscriptions (${subscriptions.length})`, icon: Users },
            { id: 'payments', label: `Payments & Invoices (${payments.length})`, icon: Receipt },
            { id: 'commissions', label: `Job Commissions (${commissions.length})`, icon: Coins }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`py-1.5 px-3 rounded-xl font-bold text-xs whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* OVERVIEW & REVENUE TAB */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total Active Subscribers
              </span>
              <div className="text-2xl font-black text-white">{totalActiveSubs}</div>
              <div className="text-[10px] text-teal-400 flex items-center gap-1">
                <span>Starter: {starterCount}</span> · <span>Growth: {growthCount}</span> · <span>Pro: {proCount}</span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Subscription Revenue
              </span>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                ₹{totalSubscriptionRevenue.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400">
                {payments.filter((p) => p.payment_status === 'completed').length} paid receipts
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Job Commissions Retained
              </span>
              <div className="text-2xl font-black text-amber-400 font-mono">
                ₹{totalCommissionsCollected.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400">
                Across {commissions.length} completed services
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Pending / Disputed
              </span>
              <div className="text-2xl font-black text-slate-300">{pendingPaymentsCount + failedPaymentsCount}</div>
              <div className="text-[10px] text-rose-400">
                {pendingPaymentsCount} pending · {failedPaymentsCount} failed/refunded
              </div>
            </div>
          </div>

          {/* Plan-wise Partner Breakdown Card */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" />
              <span>Plan-wise Partner Distribution</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-200">PLAN A: STARTER</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                    20% Comm.
                  </span>
                </div>
                <div className="text-xl font-black text-white">{starterCount} Partners</div>
                <p className="text-[11px] text-slate-400">
                  ₹0/month. Standard access. Partners keep 80% of service value.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-teal-950/40 border border-teal-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-teal-300">PLAN B: GROWTH (REC.)</span>
                  <span className="px-2 py-0.5 rounded bg-teal-900 text-teal-200 font-mono text-[10px]">
                    12% Comm.
                  </span>
                </div>
                <div className="text-xl font-black text-white">{growthCount} Partners</div>
                <p className="text-[11px] text-teal-200/80">
                  ₹370/month + tax. Priority leads. Partners keep 88% of service value.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-purple-300">PLAN C: PROFESSIONAL</span>
                  <span className="px-2 py-0.5 rounded bg-purple-900 text-purple-200 font-mono text-[10px]">
                    7% Comm.
                  </span>
                </div>
                <div className="text-xl font-black text-white">{proCount} Partners</div>
                <p className="text-[11px] text-purple-200/80">
                  ₹799/month + tax. Top priority. Lowest 7% Doorbly fee.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLANS MANAGEMENT TAB */}
      {activeSubTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">
              Configured Subscription Plans ({plans.length})
            </h3>
            <span className="text-[11px] text-slate-400">
              Only authorized administrators may adjust plan pricing and commissions.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm uppercase text-white">{plan.plan_name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        plan.is_active
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">₹{plan.monthly_price}</span>
                    <span className="text-slate-400 text-[11px]">/ month</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Commission Rate:</span>
                      <span className="font-black text-teal-400">{plan.commission_percent}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Partner Retains:</span>
                      <span className="font-black text-emerald-400">
                        {100 - plan.commission_percent}% (₹{1000 - (1000 * plan.commission_percent) / 100} / ₹1,000)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1 text-[11px] text-slate-400">
                    {plan.benefits.slice(0, 3).map((b, i) => (
                      <div key={i} className="flex items-center gap-1.5 truncate">
                        <Check className="w-3 h-3 text-teal-400 shrink-0" />
                        <span className="truncate">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleStartEditPlan(plan)}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Plan Terms</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Edit Plan Modal */}
          {editingPlan && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
              <form
                onSubmit={handleSavePlan}
                className="bg-slate-900 rounded-3xl max-w-sm w-full p-5 border border-slate-700 space-y-4 shadow-2xl text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="font-black text-sm text-white">
                    Edit {editingPlan.plan_name} Plan
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">
                      Monthly Price (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">
                      Company Commission (%)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={editCommission}
                      onChange={(e) => setEditCommission(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="rounded text-teal-600"
                    />
                    <span>Plan is actively selectable by partners</span>
                  </label>
                </div>

                {editSuccessMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{editSuccessMsg}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 rounded-xl bg-[#0F766E] hover:bg-teal-700 text-white font-bold flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAX SETTINGS TAB */}
      {activeSubTab === 'tax' && (
        <form
          onSubmit={handleSaveTaxConfig}
          className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-teal-400" />
                <span>Subscription Tax Configuration &amp; Legal Verification</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Configure legal tax rates applied to monthly subscriptions (e.g. 18% GST).
              </p>
            </div>

            <button
              type="submit"
              className="py-2 px-4 bg-[#0F766E] hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Tax Settings</span>
            </button>
          </div>

          {/* Legal Notice Callout */}
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Configurable Rate Requirement</span>
            </div>
            <p className="text-[11px] text-amber-300/90 leading-relaxed">
              Tax rates must not be hardcoded as legally applicable without verification. In India, subscription tax treatment depends on actual service classification, GST registration status, and place of supply. Verify statutory rates before live billing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-300 block mb-1">
                Tax Rate (%) — e.g. 18% GST
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                max={40}
                value={taxRateInput}
                onChange={(e) => setTaxRateInput(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-teal-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Growth (₹370) calculates tax of ₹{((370 * taxRateInput) / 100).toFixed(2)}, total payable ₹{(370 + (370 * taxRateInput) / 100).toFixed(2)}.
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">
                Tax Nomenclature / Label
              </label>
              <input
                type="text"
                value={taxNameInput}
                onChange={(e) => setTaxNameInput(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">
                HSN / SAC Code
              </label>
              <input
                type="text"
                value={sacCodeInput}
                onChange={(e) => setSacCodeInput(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-teal-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Default: 998314 (Information technology software services)
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">
                GSTIN Registration Number
              </label>
              <input
                type="text"
                value={gstinInput}
                onChange={(e) => setGstinInput(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-slate-300 block mb-1">
                Place of Supply Default
              </label>
              <input
                type="text"
                value={posInput}
                onChange={(e) => setPosInput(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          {taxSaveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Tax settings saved and synced across partner app.</span>
            </div>
          )}
        </form>
      )}

      {/* PARTNER SUBSCRIPTIONS TAB */}
      {activeSubTab === 'subscriptions' && (
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white">
              Partner Subscriptions &amp; Expiry Registry ({subscriptions.length})
            </h3>
            <span className="text-[11px] text-slate-400">
              Only authorized admin can manually correct with audit logging.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2.5 pr-2">Partner ID</th>
                  <th className="py-2.5 px-2">Plan</th>
                  <th className="py-2.5 px-2">Commission</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2">Start Date</th>
                  <th className="py-2.5 px-2">Expires At</th>
                  <th className="py-2.5 pl-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {subscriptions.map((sub) => {
                  const isExpired = new Date(sub.expires_at).getTime() < Date.now();
                  return (
                    <tr key={sub.id} className="hover:bg-slate-900/50">
                      <td className="py-2.5 pr-2 font-mono text-[11px] text-slate-200">
                        {sub.partner_id.substring(0, 14)}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="font-bold text-white capitalize">{sub.plan_name}</span>
                      </td>
                      <td className="py-2.5 px-2 font-bold text-teal-400">
                        {sub.commission_percent}%
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            sub.status === 'active' && !isExpired
                              ? 'bg-emerald-950 text-emerald-400'
                              : 'bg-rose-950 text-rose-400'
                          }`}
                        >
                          {sub.status === 'active' && !isExpired ? 'Active' : 'Expired'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-[11px] text-slate-400">
                        {new Date(sub.start_at).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-2 text-[11px] text-slate-400">
                        {new Date(sub.expires_at).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 pl-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleStartManualCorrection(sub)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-700 text-[10px] font-bold cursor-pointer"
                        >
                          Manual Correct
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Manual Correction Modal */}
          {correctingSub && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
              <form
                onSubmit={handleSaveManualCorrection}
                className="bg-slate-900 rounded-3xl max-w-md w-full p-5 border border-slate-700 space-y-4 shadow-2xl text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <div className="font-black text-sm text-white">Manual Subscription Correction</div>
                    <div className="text-[10px] text-slate-400">Partner: {correctingSub.partner_id}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCorrectingSub(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Target Plan</label>
                    <select
                      value={correctionPlanCode}
                      onChange={(e) => setCorrectionPlanCode(e.target.value as PlanCode)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-teal-500 focus:outline-hidden"
                    >
                      <option value="starter">Starter (20% Commission)</option>
                      <option value="growth">Growth (12% Commission)</option>
                      <option value="professional">Professional (7% Commission)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Status</label>
                    <select
                      value={correctionStatus}
                      onChange={(e) => setCorrectionStatus(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-teal-500 focus:outline-hidden"
                    >
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">
                      Extend Duration (Days from Now)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={correctionDays}
                      onChange={(e) => setCorrectionDays(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-amber-300 block mb-1">
                      Mandatory Audit Log Reason *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={correctionReason}
                      onChange={(e) => setCorrectionReason(e.target.value)}
                      placeholder="e.g. Approved courtesy extension after gateway settlement delay..."
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {correctionError && (
                  <div className="p-2.5 rounded-xl bg-rose-950 text-rose-300 border border-rose-800 text-[11px]">
                    {correctionError}
                  </div>
                )}
                {correctionSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px]">
                    {correctionSuccess}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrectingSub(null)}
                    className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 rounded-xl bg-[#0F766E] hover:bg-teal-700 text-white font-bold"
                  >
                    Apply Correction
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* PAYMENTS & INVOICES TAB */}
      {activeSubTab === 'payments' && (
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-white">
                Payment Transactions &amp; Invoices ({filteredPayments.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                Downloadable GST tax receipts with invoice references and gateway hashes.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(['all', 'completed', 'pending', 'failed', 'refunded'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setPaymentFilter(st)}
                  className={`py-1 px-2.5 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                    paymentFilter === st
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2.5 pr-2">Invoice #</th>
                  <th className="py-2.5 px-2">Partner ID</th>
                  <th className="py-2.5 px-2">Plan</th>
                  <th className="py-2.5 px-2">Base Amt</th>
                  <th className="py-2.5 px-2">Tax ({taxConfig?.tax_rate_percent}%)</th>
                  <th className="py-2.5 px-2">Total Paid</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 pl-2 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/50">
                    <td className="py-2.5 pr-2 font-mono font-bold text-teal-400">
                      {p.invoice_number}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-[11px] text-slate-400">
                      {p.partner_id.substring(0, 12)}
                    </td>
                    <td className="py-2.5 px-2 capitalize font-bold text-white">
                      {p.plan_code}
                    </td>
                    <td className="py-2.5 px-2 font-mono">₹{p.amount_before_tax.toFixed(2)}</td>
                    <td className="py-2.5 px-2 font-mono text-slate-400">
                      ₹{p.tax_amount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 font-mono font-bold text-emerald-400">
                      ₹{p.total_amount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.payment_status === 'completed'
                            ? 'bg-emerald-950 text-emerald-400'
                            : p.payment_status === 'pending'
                            ? 'bg-amber-950 text-amber-400'
                            : 'bg-rose-950 text-rose-400'
                        }`}
                      >
                        {p.payment_status}
                      </span>
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <button
                        type="button"
                        onClick={() => setViewInvoicePayment(p)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-700 cursor-pointer inline-flex items-center gap-1"
                        title="View Official Tax Invoice"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JOB COMMISSIONS RECONCILIATION TAB */}
      {activeSubTab === 'commissions' && (
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
          <div>
            <h3 className="font-extrabold text-sm text-white">
              Job Commission Records &amp; Immutable Audit Trail ({commissions.length})
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Historical calculations are permanently sealed so administrator changes to future plan rates never alter past completed jobs.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2.5 pr-2">Job ID</th>
                  <th className="py-2.5 px-2">Partner ID</th>
                  <th className="py-2.5 px-2">Plan at Txn</th>
                  <th className="py-2.5 px-2">Service Value</th>
                  <th className="py-2.5 px-2">Comm %</th>
                  <th className="py-2.5 px-2">Doorbly Fee</th>
                  <th className="py-2.5 px-2">Partner Payout</th>
                  <th className="py-2.5 pl-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/50">
                    <td className="py-2.5 pr-2 font-mono text-[11px] text-slate-200">
                      #{c.job_id.substring(0, 8)}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-[11px] text-slate-400">
                      {c.partner_id.substring(0, 10)}
                    </td>
                    <td className="py-2.5 px-2 font-bold uppercase text-white">
                      {c.plan_code_at_transaction}
                    </td>
                    <td className="py-2.5 px-2 font-mono">₹{c.commissionable_amount}</td>
                    <td className="py-2.5 px-2 font-bold text-teal-400">{c.commission_percent}%</td>
                    <td className="py-2.5 px-2 font-mono font-bold text-amber-400">
                      ₹{c.commission_amount}
                    </td>
                    <td className="py-2.5 px-2 font-mono font-bold text-emerald-400">
                      ₹{c.partner_earnings}
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold uppercase text-[10px]">
                        {c.transaction_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Viewer Modal */}
      {viewInvoicePayment && (
        <InvoiceModal
          payment={viewInvoicePayment}
          taxConfig={taxConfig}
          onClose={() => setViewInvoicePayment(null)}
        />
      )}
    </div>
  );
};
