import React, { useState, useRef, useEffect } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { partnerAuthService } from '../../services/partnerAuth';
import {
  ShieldCheck,
  Lock,
  Phone,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  Database,
  Flame,
  Delete
} from 'lucide-react';

export const GoOnlineVerificationModal: React.FC = () => {
  const {
    partner,
    showOnlineVerificationModal,
    setShowOnlineVerificationModal,
    verifyScreenCodeAndGoOnline,
    verifyFirebaseAndGoOnline
  } = usePartner();

  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'screen_code' | 'firebase'>('screen_code');

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const authUser = partnerAuthService.getStoredUser();
  const isFirebaseUser = authUser?.authProvider === 'firebase' || Boolean(authUser?.email && authUser.email.includes('@'));

  // Reset digits when modal opens
  useEffect(() => {
    if (showOnlineVerificationModal) {
      setDigits(['', '', '', '']);
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsVerifying(false);
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 100);
    }
  }, [showOnlineVerificationModal]);

  if (!showOnlineVerificationModal) return null;

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);
    setErrorMsg(null);

    // Auto-advance to next input
    if (cleaned && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === 'Enter') {
      const pin = digits.join('');
      if (pin.length === 4) {
        handleSubmitPin(pin);
      }
    }
  };

  const handleKeypadPress = (num: string) => {
    const emptyIndex = digits.findIndex((d) => d === '');
    if (emptyIndex !== -1) {
      const newDigits = [...digits];
      newDigits[emptyIndex] = num;
      setDigits(newDigits);
      setErrorMsg(null);
      if (emptyIndex < 3) {
        inputRefs[emptyIndex + 1].current?.focus();
      }
    }
  };

  const handleKeypadBackspace = () => {
    const lastFilledIndex = [...digits].reverse().findIndex((d) => d !== '');
    if (lastFilledIndex !== -1) {
      const actualIndex = 3 - lastFilledIndex;
      const newDigits = [...digits];
      newDigits[actualIndex] = '';
      setDigits(newDigits);
      setErrorMsg(null);
      inputRefs[actualIndex].current?.focus();
    }
  };

  const handleSubmitPin = async (pin?: string) => {
    const code = pin || digits.join('');
    if (code.length !== 4) {
      setErrorMsg('Please enter your complete 4-digit screen lock code.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    try {
      const result = await verifyScreenCodeAndGoOnline(code);
      if (result.success) {
        setSuccessMsg(result.message || 'Verified successfully! You are now Online.');
      } else {
        setErrorMsg(result.message || 'Verification failed. Incorrect 4-digit screen lock code.');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFirebaseVerify = async () => {
    setIsVerifying(true);
    setErrorMsg(null);
    try {
      const res = await verifyFirebaseAndGoOnline();
      if (res.success) {
        setSuccessMsg(res.message || 'Firebase verified! You are now Online.');
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Firebase verification error.');
    } finally {
      setIsVerifying(false);
    }
  };

  const registeredPhone = partner?.mobile || authUser?.phone || '+91 registered number';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-900 shadow-2xl border border-slate-100 relative space-y-4">
        {/* Close Button */}
        <button
          onClick={() => setShowOnlineVerificationModal(false)}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close verification modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Security Verification Required
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            Verify your identity before going Online to receive live customer bookings.
          </p>
        </div>

        {/* Verification Method Toggle (if Firebase user is available) */}
        {isFirebaseUser && (
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setAuthMethod('screen_code')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMethod === 'screen_code'
                  ? 'bg-white text-[#0F766E] shadow-2xs font-extrabold'
                  : 'text-slate-500'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>4-Digit Screen Code</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('firebase')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMethod === 'firebase'
                  ? 'bg-white text-orange-600 shadow-2xs font-extrabold'
                  : 'text-slate-500'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Firebase (Gmail)</span>
            </button>
          </div>
        )}

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-tight">{successMsg}</span>
          </div>
        )}

        {authMethod === 'screen_code' ? (
          <div className="space-y-4">
            {/* Phone Info Badge */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-[#0F766E]" />
                <span className="font-semibold">{registeredPhone}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-md">
                Supabase Verified
              </span>
            </div>

            {/* 4 Discrete Digit Boxes */}
            <div>
              <label className="block text-center text-xs font-bold text-slate-700 mb-2">
                Enter your 4-digit screen lock code:
              </label>
              <div className="flex items-center justify-center gap-3">
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    ref={inputRefs[idx]}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digits[idx]}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={isVerifying}
                    className={`w-12 h-14 text-center text-2xl font-black rounded-2xl border-2 transition-all focus:outline-hidden ${
                      digits[idx]
                        ? 'border-[#0F766E] bg-teal-50/50 text-slate-900 shadow-2xs'
                        : 'border-slate-300 bg-white text-slate-800 focus:border-[#0F766E]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* In-app Keypad for fast 1-handed mobile input */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleKeypadPress(n)}
                  disabled={isVerifying}
                  className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-extrabold text-sm border border-slate-200/70 transition-colors cursor-pointer select-none"
                >
                  {n}
                </button>
              ))}
              <div />
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                disabled={isVerifying}
                className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-extrabold text-sm border border-slate-200/70 transition-colors cursor-pointer select-none"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadBackspace}
                disabled={isVerifying}
                aria-label="Delete last digit"
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-sm border border-slate-200 flex items-center justify-center transition-colors cursor-pointer select-none"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleSubmitPin()}
                disabled={isVerifying || digits.join('').length !== 4}
                className="w-full py-3 px-4 bg-[#0F766E] hover:bg-teal-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>VERIFY IN SUPABASE &amp; GO ONLINE</span>
              </button>

              <button
                type="button"
                onClick={() => setShowOnlineVerificationModal(false)}
                className="w-full py-2.5 text-center text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                Cancel (Stay Offline)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs space-y-1 text-orange-950">
              <div className="font-bold flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-600" />
                <span>Firebase Authentication Active</span>
              </div>
              <p className="text-[11px] text-orange-800 leading-relaxed">
                Signed in with <strong>{authUser?.email || partner?.email}</strong>. Confirm your Firebase session to verify and go Online.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleFirebaseVerify}
                disabled={isVerifying}
                className="w-full py-3 px-4 bg-[#0F766E] hover:bg-teal-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>CONFIRM FIREBASE &amp; GO ONLINE</span>
              </button>

              <button
                type="button"
                onClick={() => setShowOnlineVerificationModal(false)}
                className="w-full py-2.5 text-center text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                Cancel (Stay Offline)
              </button>
            </div>
          </div>
        )}

        {/* Security Footer Note */}
        <div className="pt-1 text-center">
          <p className="text-[10px] text-slate-400">
            🔒 Protected by Doorbly Supabase Security &amp; Firebase Auth
          </p>
        </div>
      </div>
    </div>
  );
};
