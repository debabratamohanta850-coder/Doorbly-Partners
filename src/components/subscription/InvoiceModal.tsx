import React, { useRef } from 'react';
import { SubscriptionPayment, SubscriptionPlan, TaxConfiguration } from '../../types';
import { DoorblyLogoIcon } from '../../constants/branding';
import { X, Printer, Download, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';

interface InvoiceModalProps {
  payment: SubscriptionPayment;
  plan?: SubscriptionPlan;
  taxConfig?: TaxConfiguration | null;
  partnerName?: string;
  partnerPhone?: string;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  payment,
  plan,
  taxConfig,
  partnerName = 'Doorbly Partner',
  partnerPhone = '',
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const invoiceDate = new Date(payment.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const invoiceTime = new Date(payment.created_at).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const isStarter = payment.plan_code === 'starter' || payment.total_amount === 0;
  const isTaxApplicable = !isStarter && payment.tax_amount > 0;
  const halfTax = Math.round((payment.tax_amount / 2) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Top Actions Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span className="font-extrabold text-xs tracking-wide uppercase text-slate-200">
              Tax Invoice &amp; Payment Receipt
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div ref={printRef} className="p-6 overflow-y-auto space-y-5 text-slate-800 text-xs">
          {/* Invoice Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl shadow-xs border border-slate-200 p-1 flex items-center justify-center">
                <DoorblyLogoIcon className="w-full h-full rounded-lg" />
              </div>
              <div>
                <h1 className="font-black text-base text-slate-900 tracking-tight">DOORBLY</h1>
                <p className="text-[10px] text-slate-500 font-semibold leading-tight">
                  Doorbly Partner Network India
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  GSTIN: {taxConfig?.gstin_number || '21AAACD1234F1Z5'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase tracking-wider border border-emerald-200">
                {payment.payment_status === 'completed' ? 'PAID' : payment.payment_status.toUpperCase()}
              </span>
              <div className="mt-1.5 font-mono font-bold text-slate-900 text-xs">
                {payment.invoice_number}
              </div>
              <div className="text-[10px] text-slate-500">
                {invoiceDate} · {invoiceTime}
              </div>
            </div>
          </div>

          {/* Supplier & Partner Bill-To Details */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-[11px]">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Billed To (Partner)
              </span>
              <div className="font-bold text-slate-900 mt-0.5">{partnerName}</div>
              <div className="text-slate-600 font-mono text-[10px]">{partnerPhone}</div>
              <div className="text-slate-500 text-[10px]">ID: {payment.partner_id.substring(0, 16)}</div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Service Provider
              </span>
              <div className="font-bold text-slate-900 mt-0.5">Doorbly Technologies</div>
              <div className="text-slate-600 text-[10px]">
                SAC: {taxConfig?.hsn_sac_code || '998314'} (Subscription IT Services)
              </div>
              <div className="text-slate-500 text-[10px]">
                Place of Supply: {taxConfig?.place_of_supply || 'Odisha (21)'}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Plan Description</th>
                  <th className="p-3 text-center">Duration</th>
                  <th className="p-3 text-right">Taxable Amt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">
                      {payment.plan_code.toUpperCase()} Partner Subscription
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Doorstep service leads, company commission:{' '}
                      {payment.plan_code === 'professional' ? '7%' : payment.plan_code === 'growth' ? '12%' : '20%'}
                    </div>
                  </td>
                  <td className="p-3 text-center font-medium">30 Days</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    ₹{payment.amount_before_tax.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown & Total Summary */}
          <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100/90 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subscription Base Amount:</span>
              <span className="font-mono font-semibold">₹{payment.amount_before_tax.toFixed(2)}</span>
            </div>

            {isTaxApplicable ? (
              <>
                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span>CGST ({payment.tax_rate_percent / 2}%):</span>
                  <span className="font-mono">₹{halfTax.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span>SGST ({payment.tax_rate_percent / 2}%):</span>
                  <span className="font-mono">₹{halfTax.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 font-semibold pt-1 border-t border-teal-200/50">
                  <span>Total Tax ({payment.tax_rate_percent}%):</span>
                  <span className="font-mono">₹{payment.tax_amount.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>Applicable Tax:</span>
                <span className="font-mono">₹0.00 (Zero Tax Tier)</span>
              </div>
            )}

            <div className="flex items-center justify-between font-black text-slate-900 text-sm pt-2 border-t border-teal-200">
              <span className="text-[#0F766E]">Total Amount Paid:</span>
              <span className="text-[#0F766E] font-mono text-base">₹{payment.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Transaction Reference & Gateway Info */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Payment Method</span>
              <span className="font-semibold text-slate-800">{payment.payment_gateway}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Transaction Reference</span>
              <span className="font-mono text-slate-800 font-bold text-[10px]">
                {payment.gateway_payment_reference}
              </span>
            </div>
          </div>

          {/* Statutory Verification Disclaimer */}
          <div className="pt-2 border-t border-slate-200 flex items-start gap-2.5 text-[10px] text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              This computer-generated tax invoice confirms your partner subscription purchase. Tax breakdown is calculated based on configured rates. Keep this receipt for partner accounting and tax filing.
            </p>
          </div>
        </div>

        {/* Modal Bottom Close Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end no-print">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-[#0F766E] hover:bg-teal-700 text-white font-extrabold text-xs shadow-xs cursor-pointer transition-colors"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
