import React, { useState } from 'react';
import { usePartner } from '../../context/PartnerContext';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  CreditCard,
  QrCode,
  Sparkles,
  Zap,
  ArrowRight,
  Loader2,
  Clock
} from 'lucide-react';

export const MembershipView: React.FC = () => {
  const { membership, updateMembership, partner } = usePartner();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'pending_verification'>('select');

  const isActive = membership?.status === 'active';

  const handleInitiatePayment = () => {
    setShowPaymentSheet(true);
    setPaymentStep('select');
  };

  const handleSimulatePaymentGateway = async () => {
    setIsProcessing(true);
    // Real backend-ready flow: creates order / pending verification
    setTimeout(async () => {
      setIsProcessing(false);
      setPaymentStep('pending_verification');
    }, 1200);
  };

  const handleActivatePlanForTesting = async () => {
    setIsProcessing(true);
    await updateMembership('active');
    setIsProcessing(false);
    setShowPaymentSheet(false);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Partner Membership
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Mandatory monthly partner subscription to receive nearby customer bookings.
        </p>
      </div>

      {/* Membership Card (Faded Sky Colour) */}
      <div className="bg-gradient-to-br from-sky-50 via-sky-100/80 to-sky-50 text-slate-900 rounded-3xl p-6 shadow-xs border border-sky-200/90 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-600" />
            <span className="font-bold text-xs uppercase tracking-wider text-sky-800">
              DOORBLY PRO PARTNER
            </span>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase ${
              isActive
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            {isActive ? 'ACTIVE PLAN' : 'RENEWAL DUE'}
          </div>
        </div>

        {/* Pricing Head */}
        <div className="mt-4">
          <div className="flex items-baseline">
            <span className="text-3xl font-black tracking-tight text-slate-900">₹370</span>
            <span className="text-sky-700 text-xs ml-1.5 font-medium">/ 30 Days</span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Unlimited customer doorstep leads, zero upfront commission cap, verified badge.
          </p>
        </div>

        {/* Validity Dates */}
        <div className="mt-5 pt-4 border-t border-sky-200/80 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-sky-700/80 block text-[10px] uppercase font-bold">
              Start Date
            </span>
            <span className="font-semibold text-slate-900">
              {membership?.start_date
                ? new Date(membership.start_date).toLocaleDateString()
                : 'Not Started'}
            </span>
          </div>
          <div>
            <span className="text-sky-700/80 block text-[10px] uppercase font-bold">
              Expiry Date
            </span>
            <span className="font-semibold text-slate-900">
              {membership?.expiry_date
                ? new Date(membership.expiry_date).toLocaleDateString()
                : 'Not Set'}
            </span>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      {!isActive ? (
        <button
          onClick={handleInitiatePayment}
          className="w-full py-4 px-6 bg-[#0F766E] hover:bg-teal-700 active:bg-teal-800 text-white font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all"
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>SUBSCRIBE / RENEW FOR ₹370</span>
        </button>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs text-emerald-900">
            <p className="font-bold">Membership is Active</p>
            <p className="text-emerald-700 text-[11px] mt-0.5">
              You are eligible to switch Online and receive incoming service requests.
            </p>
          </div>
        </div>
      )}

      {/* Membership Benefits List */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">
          Included with Doorbly Partner Membership
        </h3>

        <div className="space-y-2.5 text-xs text-slate-700">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
            <span>Receive live doorstep jobs matched within your service radius</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
            <span>Guaranteed earnings credited directly to your partner wallet</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
            <span>Customer navigation & turn-by-turn doorstep directions</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
            <span>24/7 dedicated partner operations & safety helpline</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
            <span>Zero hidden cancellation penalties on verified jobs</span>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal / Sheet */}
      {showPaymentSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Subscribe to Doorbly Partner
                </h3>
                <p className="text-xs text-slate-500">Plan Amount: <strong>₹370 (Inclusive of GST)</strong></p>
              </div>
              <button
                onClick={() => setShowPaymentSheet(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {paymentStep === 'select' ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Select payment method:
                </p>

                <div
                  onClick={handleSimulatePaymentGateway}
                  className="p-3.5 border border-slate-200 hover:border-teal-600 rounded-2xl flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <QrCode className="w-5 h-5 text-teal-700" />
                    <div>
                      <div className="font-bold text-xs text-slate-900">UPI / QR Code</div>
                      <div className="text-[10px] text-slate-500">GPay, PhonePe, Paytm, BHIM</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-700" />
                </div>

                <div
                  onClick={handleSimulatePaymentGateway}
                  className="p-3.5 border border-slate-200 hover:border-teal-600 rounded-2xl flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-teal-700" />
                    <div>
                      <div className="font-bold text-xs text-slate-900">Debit / Credit Card</div>
                      <div className="text-[10px] text-slate-500">Visa, Mastercard, RuPay</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-700" />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleActivatePlanForTesting}
                    disabled={isProcessing}
                    className="w-full py-3 bg-teal-50 hover:bg-teal-100 text-[#0F766E] font-bold text-xs rounded-xl border border-teal-200 flex items-center justify-center gap-1.5"
                  >
                    <span>Activate Plan (Development Mode)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-center py-3">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Payment Order Created (₹370)
                </h4>
                <p className="text-xs text-slate-500">
                  Payment gateway integration ready. Once your bank UPI/Gateway payment completes, your membership activates automatically.
                </p>

                <button
                  onClick={handleActivatePlanForTesting}
                  className="w-full py-3 bg-[#0F766E] text-white font-bold text-xs rounded-xl"
                >
                  Confirm & Activate Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
