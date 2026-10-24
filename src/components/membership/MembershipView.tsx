import React, { useState, useEffect } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { subscriptionService } from '../../services/subscriptionService';
import { SubscriptionPayment, SubscriptionPlan } from '../../types';
import { SubscriptionCards } from '../subscription/SubscriptionCards';
import { InvoiceModal } from '../subscription/InvoiceModal';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  Clock,
  Coins,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Download,
  Info,
  Check,
  X
} from 'lucide-react';

export const MembershipView: React.FC = () => {
  const { partner, activeSubscription, taxConfig, refreshAll } = usePartner();
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<SubscriptionPayment | null>(null);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  const activePlanCode = activeSubscription?.plan_code || 'starter';

  const loadPayments = async () => {
    if (!partner?.id) return;
    setIsLoadingInvoices(true);
    try {
      const history = await subscriptionService.getPartnerPaymentsAndInvoices(partner.id);
      setPayments(history);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [partner?.id, activeSubscription?.id]);

  const daysRemaining = activeSubscription?.expires_at
    ? Math.max(0, Math.ceil((new Date(activeSubscription.expires_at).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className="space-y-5 pb-24 text-slate-800">
      {/* View Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-extrabold text-[#0F766E] tracking-wider">
            PARTNER MEMBERSHIP &amp; COMMISSIONS
          </span>
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
          My Subscription
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          Choose a subscription plan to minimize Doorbly platform commissions and maximize your take-home earnings on every doorstep job.
        </p>
      </div>

      {/* Active Subscription Summary Banner */}
      {activeSubscription && (
        <div className="bg-gradient-to-br from-[#0F766E] to-teal-800 text-white rounded-3xl p-5 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-300" />
              <span className="font-extrabold text-xs uppercase tracking-wider text-teal-100">
                ACTIVE PLAN
              </span>
            </div>

            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-xs">
              {activeSubscription.status === 'active' ? 'ACTIVE & ONLINE ELIGIBLE' : 'RENEWAL DUE'}
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-black tracking-tight capitalize">
                {activeSubscription.plan_name}
              </div>
              <p className="text-xs text-teal-100 mt-0.5">
                Company Commission: <strong>{activeSubscription.commission_percent}%</strong> per completed service
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-teal-200 block">Earnings Retention</span>
              <span className="text-xl font-black text-amber-300">
                {100 - activeSubscription.commission_percent}%
              </span>
            </div>
          </div>

          {/* Dates & Validity Grid */}
          <div className="mt-4 pt-3 border-t border-teal-600/60 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-teal-200 block text-[10px] uppercase font-bold">Start Date</span>
              <span className="font-semibold text-white">
                {activeSubscription.start_at
                  ? new Date(activeSubscription.start_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short'
                    })
                  : 'Active'}
              </span>
            </div>

            <div>
              <span className="text-teal-200 block text-[10px] uppercase font-bold">Expiry Date</span>
              <span className="font-semibold text-white">
                {activeSubscription.expires_at
                  ? new Date(activeSubscription.expires_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short'
                    })
                  : 'N/A'}
              </span>
            </div>

            <div className="text-right">
              <span className="text-teal-200 block text-[10px] uppercase font-bold">Days Left</span>
              <span className="font-bold text-amber-300">
                {activeSubscription.plan_code === 'starter' ? 'Unlimited' : `${daysRemaining} Days`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Cards Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
              Select Subscription Plan
            </h3>
            <p className="text-[11px] text-slate-500">
              Pick the right tier for your doorstep service volume.
            </p>
          </div>
        </div>

        <SubscriptionCards onPlanActivated={loadPayments} />
      </div>

      {/* Detailed Plan Comparison Table */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3.5">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">
            Subscription Plan Comparison
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare features, company commissions, and partner retention rates.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="py-2.5 pr-2 font-bold">Benefit / Metric</th>
                <th className="py-2.5 px-2 text-center font-bold text-slate-700">Starter</th>
                <th className="py-2.5 px-2 text-center font-bold text-[#0F766E] bg-teal-50/50 rounded-t-lg">
                  Growth (Rec.)
                </th>
                <th className="py-2.5 pl-2 text-center font-bold text-purple-700">Professional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
              <tr>
                <td className="py-2.5 pr-2 font-semibold">Monthly Price</td>
                <td className="py-2.5 px-2 text-center font-mono font-bold">₹0</td>
                <td className="py-2.5 px-2 text-center font-mono font-bold text-[#0F766E] bg-teal-50/50">
                  ₹370 + tax
                </td>
                <td className="py-2.5 pl-2 text-center font-mono font-bold text-purple-700">
                  ₹799 + tax
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-2 font-semibold">Company Commission</td>
                <td className="py-2.5 px-2 text-center font-bold text-rose-600">20%</td>
                <td className="py-2.5 px-2 text-center font-bold text-[#0F766E] bg-teal-50/50">12%</td>
                <td className="py-2.5 pl-2 text-center font-bold text-purple-700">7% (Lowest)</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-2 font-semibold">Partner Retention (%)</td>
                <td className="py-2.5 px-2 text-center font-bold">80%</td>
                <td className="py-2.5 px-2 text-center font-bold text-[#0F766E] bg-teal-50/50">88%</td>
                <td className="py-2.5 pl-2 text-center font-bold text-purple-700">93%</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-2 font-semibold">You Keep on ₹1,000 Job</td>
                <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800">₹800</td>
                <td className="py-2.5 px-2 text-center font-mono font-bold text-[#0F766E] bg-teal-50/50">
                  ₹880 (+₹80)
                </td>
                <td className="py-2.5 pl-2 text-center font-mono font-bold text-purple-700">
                  ₹930 (+₹130)
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-2 font-semibold">Job Notifications</td>
                <td className="py-2.5 px-2 text-center text-slate-500">Standard</td>
                <td className="py-2.5 px-2 text-center font-bold text-teal-800 bg-teal-50/50">Priority</td>
                <td className="py-2.5 pl-2 text-center font-bold text-purple-800">Top Priority</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-2 font-semibold">Partner Support</td>
                <td className="py-2.5 px-2 text-center text-slate-500">Standard</td>
                <td className="py-2.5 px-2 text-center text-slate-600 bg-teal-50/50">Standard</td>
                <td className="py-2.5 pl-2 text-center font-bold text-purple-800">Priority Phone</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-2 font-semibold">Subscription Expiry Reminders</td>
                <td className="py-2.5 px-2 text-center text-slate-400">—</td>
                <td className="py-2.5 px-2 text-center text-emerald-600 bg-teal-50/50">✓ Included</td>
                <td className="py-2.5 pl-2 text-center text-emerald-600">✓ Included</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Invoices & Payment History */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0F766E]" />
              <span>Subscription Invoices &amp; Receipts</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Download tax invoices for accounting and tax records.
            </p>
          </div>

          <span className="text-[11px] font-bold text-slate-500">
            {payments.length} {payments.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
            No paid subscription invoices yet. When you activate Growth or Professional, your official GST tax invoices will appear here.
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-white transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {payment.invoice_number}
                    </span>
                    <span className="px-2 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                      {payment.payment_status}
                    </span>
                  </div>

                  <div className="text-slate-500 text-[11px] mt-1">
                    {payment.plan_code.toUpperCase()} Plan · {payment.payment_gateway} ·{' '}
                    {new Date(payment.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-black text-slate-900 font-mono text-sm">
                      ₹{payment.total_amount.toFixed(2)}
                    </div>
                    {payment.tax_amount > 0 && (
                      <div className="text-[10px] text-slate-400">
                        incl. ₹{payment.tax_amount.toFixed(2)} GST
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(payment)}
                    className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-200/80 transition-colors cursor-pointer"
                    title="View & Download Invoice"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Viewer Modal */}
      {selectedInvoice && (
        <InvoiceModal
          payment={selectedInvoice}
          taxConfig={taxConfig}
          partnerName={partner?.name}
          partnerPhone={partner?.mobile}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};
