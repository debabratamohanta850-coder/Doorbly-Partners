import React, { useState, useEffect } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { partnerAuthService } from '../../services/partnerAuth';
import { supabaseService } from '../../services/supabaseClient';
import { PartnerProfile, PartnerMembership } from '../../types';
import { PROFESSION_CATEGORIES } from '../../constants/professions';
import { DoorblyLogoIcon } from '../../constants/branding';
import {
  ShieldCheck,
  Phone,
  Loader2,
  CheckCircle2,
  Sparkles,
  Lock,
  Database,
  Flame,
  KeyRound,
  Radar,
  Coins,
  Building2,
  TrendingUp
} from 'lucide-react';

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

interface FeatureItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  badge: string;
  tagColor: string;
  iconBg: string;
  borderColor: string;
}

const FEATURE_ITEMS: FeatureItem[] = [
  {
    id: 'nearby',
    icon: Radar,
    title: 'Real-time nearby service matching',
    subtitle: 'Direct GPS alerts dispatched within 5 km of you',
    badge: 'LIVE GPS',
    tagColor: 'bg-teal-100 text-teal-800 border-teal-200',
    iconBg: 'bg-teal-100/90 text-[#0F766E]',
    borderColor: 'border-teal-200/90'
  },
  {
    id: 'wallet',
    icon: Coins,
    title: 'Instant wallet credits on job completion',
    subtitle: 'Zero delay — earnings credit immediately to available balance',
    badge: 'INSTANT CREDIT',
    tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    iconBg: 'bg-emerald-100/90 text-emerald-700',
    borderColor: 'border-emerald-200/90'
  },
  {
    id: 'payout',
    icon: Building2,
    title: 'Direct bank payouts & ₹370 flat plan',
    subtitle: 'Retain 88% on Growth plan with fast direct IMPS transfers',
    badge: '₹370 GROWTH',
    tagColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    iconBg: 'bg-cyan-100/90 text-cyan-700',
    borderColor: 'border-cyan-200/90'
  },
  {
    id: 'pro',
    icon: TrendingUp,
    title: 'Keep up to 93% with Pro subscriptions',
    subtitle: 'Just 7% company commission for high-earning partners',
    badge: '7% FEE',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-200',
    iconBg: 'bg-amber-100/90 text-amber-700',
    borderColor: 'border-amber-200/90'
  },
  {
    id: 'safety',
    icon: ShieldCheck,
    title: '100% verified doorstep customers & SOS',
    subtitle: 'Safe doorstep service protocols and emergency partner hotline',
    badge: 'SAFETY 1ST',
    tagColor: 'bg-slate-100 text-slate-800 border-slate-200',
    iconBg: 'bg-slate-100 text-slate-700',
    borderColor: 'border-slate-200'
  }
];

const PartnerFeaturesShowcase: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsFlashing(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % FEATURE_ITEMS.length);
        setIsFlashing(false);
      }, 250);
    }, 3200);

    return () => clearInterval(timer);
  }, []);

  const activeItem = FEATURE_ITEMS[currentIndex];
  const IconComponent = activeItem.icon;

  return (
    <div className="space-y-2.5">
      {/* Dynamic Flash-Out Feature Spotlight Card */}
      <div
        className={`relative overflow-hidden rounded-2xl p-3.5 border transition-all duration-300 shadow-xs ${activeItem.borderColor} bg-gradient-to-r from-teal-50/90 via-white to-emerald-50/70 ${
          isFlashing ? 'opacity-25 scale-[0.98] blur-[1px]' : 'opacity-100 scale-100 blur-0'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeItem.iconBg} shadow-xs ring-2 ring-white`}
          >
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span
                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border tracking-wider ${activeItem.tagColor}`}
              >
                {activeItem.badge}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentIndex + 1}/{FEATURE_ITEMS.length}
              </span>
            </div>
            <h4 className="text-xs font-black text-slate-900 leading-snug">
              {activeItem.title}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
              {activeItem.subtitle}
            </p>
          </div>
        </div>

        {/* Feature Navigation Dots */}
        <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100/80">
          <div className="flex items-center gap-1">
            {FEATURE_ITEMS.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setIsFlashing(true);
                  setTimeout(() => {
                    setCurrentIndex(idx);
                    setIsFlashing(false);
                  }, 150);
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'w-5 bg-[#0F766E]'
                    : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                }`}
                aria-label={`View feature ${idx + 1}`}
              />
            ))}
          </div>
          <span className="text-[10px] text-[#0F766E] font-bold flex items-center gap-0.5">
            <span>Verified Partner Benefit</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export const AuthScreen: React.FC = () => {
  const { refreshSession } = usePartner();

  const [mode, setMode] = useState<'welcome' | 'login' | 'register'>('welcome');
  const [loginMethod, setLoginMethod] = useState<'screen_code' | 'email' | 'otp'>('screen_code');

  // Login inputs
  const [phone, setPhone] = useState('+91 ');
  const [screenCode, setScreenCode] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register inputs
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('+91 ');
  const [regScreenCode, setRegScreenCode] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regGender, setRegGender] = useState<'male' | 'female' | 'other'>('male');
  const [regAddress] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regPrimaryCategory, setRegPrimaryCategory] = useState('Electrician');
  const [regExperience, setRegExperience] = useState(3);
  const [regDocType, setRegDocType] = useState<'aadhaar' | 'pan'>('aadhaar');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Phone & 4-Digit Screen Lock Code Login (Direct Supabase Verification)
  const handlePhoneScreenCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMsg('Please enter a valid mobile number.');
      return;
    }
    if (!/^\d{4}$/.test(screenCode.trim())) {
      setErrorMsg('Please enter your 4-digit screen lock code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await partnerAuthService.loginWithPhoneAndScreenCode(phone, screenCode);
      if (res.success && res.user) {
        await refreshSession();
      } else {
        setErrorMsg(res.message || 'Verification failed. Screen code did not match Supabase records.');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Firebase Google Auth handler
  const handleGoogleFirebaseLogin = async () => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const res = await partnerAuthService.loginWithGoogleFirebase();
      if (res.success && res.user) {
        await refreshSession();
      } else if (!res.cancelled) {
        setErrorMsg(res.message || 'Google authentication was not completed.');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Google authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Send OTP
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMsg('Please enter a valid mobile number.');
      return;
    }
    setErrorMsg('');
    setOtpSent(true);
    // In dev, pre-fill sample OTP
    setOtp('123456');
  };

  // Handle Verify OTP Login
  const handleVerifyOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setErrorMsg('Please enter the OTP received.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await partnerAuthService.loginWithPhoneOtp(phone, otp);
      if (res.success && res.user) {
        await refreshSession();
      } else {
        setErrorMsg(res.message || 'Verification failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Gmail / Email Login (Controlled directly by Firebase Authentication)
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter Gmail ID and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await partnerAuthService.loginWithEmail(email, password);
      if (res.success) {
        await refreshSession();
      } else {
        setErrorMsg(res.message || 'Firebase login failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regMobile.trim()) {
      setErrorMsg('Please enter your full name and mobile number.');
      return;
    }

    if (!regScreenCode || !/^\d{4}$/.test(regScreenCode.trim())) {
      setErrorMsg('Please choose a 4-digit screen lock code (e.g. 1234) to secure your account and allow online verification.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const partnerId = `p_${Date.now()}`;
      const cleanCode = regScreenCode.trim();
      const matchedCategory =
        PROFESSION_CATEGORIES.find((cat) => cat.professions.includes(regPrimaryCategory))?.name ||
        regPrimaryCategory;

      const partnerProfile: PartnerProfile = {
        id: partnerId,
        auth_id: partnerId,
        name: regName.trim(),
        mobile: regMobile.trim(),
        email: regEmail.trim() || `${regMobile.replace(/\D/g, '')}@partner.doorbly.com`,
        gender: regGender,
        address: regAddress.trim() || 'Zone 1',
        district: 'Main',
        city: regCity.trim() || 'Metro',
        pin_code: regPin.trim() || '751001',
        primary_category: matchedCategory,
        services_offered: [regPrimaryCategory],
        years_experience: Number(regExperience),
        skills: ['Doorstep Service', 'Equipment Certified'],
        working_area: regCity || 'All Areas',
        preferred_radius_km: 15,
        languages: ['English', 'Hindi'],
        screen_lock_code: cleanCode,
        is_screen_code_verified: true,
        screen_code_verified_at: new Date().toISOString(),
        auth_provider: 'screen_code',
        status: 'pending_verification', // Partner must wait for Admin approval to become an active partner
        is_online: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store screen credentials in Supabase
      await supabaseService.storeScreenCredentials(
        regMobile.trim(),
        cleanCode,
        partnerId,
        regName.trim()
      );

      await supabaseService.upsertPartnerProfile(partnerProfile);

      // Create membership record (₹370)
      const mem: PartnerMembership = {
        id: `mem_${partnerId}`,
        partner_id: partnerId,
        plan_name: 'Monthly Doorbly Partner Membership',
        monthly_fee: 370,
        status: 'active',
        start_date: new Date().toISOString(),
        expiry_date: new Date(Date.now() + 30 * 86400000).toISOString(),
        payment_status: 'paid',
        payment_reference: 'REG_AUTO_PASS'
      };
      await supabaseService.updateMembership(mem);

      partnerAuthService.setStoredUser({
        uid: partnerId,
        displayName: regName,
        phone: regMobile,
        email: partnerProfile.email,
        authProvider: 'screen_code',
        isScreenCodeVerified: true
      });

      await refreshSession();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        {/* Brand Header */}
        <div className="bg-[#0F766E] text-white p-7 text-center relative overflow-hidden">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white shadow-md p-1.5">
            <DoorblyLogoIcon className="w-full h-full rounded-xl" />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            DOORBLY
            <span className="text-xs font-bold uppercase tracking-wider bg-amber-400 text-slate-900 px-2 py-0.5 rounded">
              Partner
            </span>
          </h1>

          <p className="text-xs text-teal-100 mt-1 font-medium">
            Earn by providing doorstep services near you
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {mode === 'welcome' && (
            <div className="space-y-4 text-center py-2">
              <PartnerFeaturesShowcase />

              <div className="pt-2 space-y-2.5">
                {/* 1-Tap Google Sign-In (Firebase Auth) */}
                <button
                  type="button"
                  onClick={handleGoogleFirebaseLogin}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-800 font-bold text-xs rounded-xl shadow-xs border border-slate-200 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#0F766E]" />
                  ) : (
                    <>
                      <GoogleIcon className="w-4 h-4" />
                      <span>CONTINUE WITH GOOGLE</span>
                    </>
                  )}
                </button>

                <div className="relative py-1 flex items-center justify-center">
                  <div className="w-full border-t border-slate-200"></div>
                  <span className="absolute bg-white px-2.5 text-[9px] uppercase font-bold text-slate-400">
                    OR CREDENTIALS
                  </span>
                </div>

                <button
                  onClick={() => setMode('login')}
                  className="w-full py-2.5 px-4 bg-[#0F766E] hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  LOGIN TO PARTNER ACCOUNT
                </button>

                <button
                  onClick={() => setMode('register')}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer"
                >
                  REGISTER AS NEW PARTNER
                </button>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900 text-base">Partner Sign In</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Select Mode</span>
                </div>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('screen_code')}
                    className={`py-1.5 px-1 rounded-lg text-[11px] transition-all flex items-center justify-center gap-1 ${
                      loginMethod === 'screen_code'
                        ? 'bg-white text-[#0F766E] shadow-2xs font-extrabold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Lock className="w-3 h-3 shrink-0" />
                    <span>Screen PIN</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('email')}
                    className={`py-1.5 px-1 rounded-lg text-[11px] transition-all flex items-center justify-center gap-1 ${
                      loginMethod === 'email'
                        ? 'bg-white text-orange-600 shadow-2xs font-extrabold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Flame className="w-3 h-3 shrink-0" />
                    <span>Gmail ID</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('otp')}
                    className={`py-1.5 px-1 rounded-lg text-[11px] transition-all flex items-center justify-center gap-1 ${
                      loginMethod === 'otp'
                        ? 'bg-white text-[#0F766E] shadow-2xs font-extrabold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Phone className="w-3 h-3 shrink-0" />
                    <span>Phone OTP</span>
                  </button>
                </div>
              </div>

              {/* Quick Google Sign In (Firebase) */}
              <button
                type="button"
                onClick={handleGoogleFirebaseLogin}
                disabled={isSubmitting}
                className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] rounded-lg border border-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0F766E]" />
                ) : (
                  <>
                    <GoogleIcon className="w-3.5 h-3.5" />
                    <span>1-Tap Google Sign In (Firebase)</span>
                  </>
                )}
              </button>

              <div className="relative py-1 flex items-center justify-center">
                <div className="w-full border-t border-slate-100"></div>
                <span className="absolute bg-white px-2 text-[9px] uppercase font-bold text-slate-400">
                  {loginMethod === 'screen_code'
                    ? 'PHONE & SCREEN CODE (SUPABASE)'
                    : loginMethod === 'email'
                    ? 'GMAIL ID & PASSWORD (FIREBASE)'
                    : 'PHONE OTP'}
                </span>
              </div>

              {loginMethod === 'screen_code' && (
                <form onSubmit={handlePhoneScreenCodeLogin} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Registered Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 99387 13179"
                        className="w-full text-sm pl-9 pr-3 py-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden font-bold"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 block">
                        4-Digit Screen Lock Code
                      </label>
                      <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                        Supabase Verified
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                      <input
                        type="password"
                        maxLength={4}
                        inputMode="numeric"
                        value={screenCode}
                        onChange={(e) => setScreenCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="•••• (e.g. 2211)"
                        className="w-full text-sm pl-9 pr-3 py-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden font-mono tracking-widest text-base font-bold"
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                      <span>Master Key: <strong>9938713179</strong> / <strong>2211</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          setPhone('9938713179');
                          setScreenCode('2211');
                        }}
                        className="font-bold text-[#0F766E] hover:underline cursor-pointer"
                      >
                        Autofill Master Key
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || screenCode.length !== 4}
                    className="w-full py-2.5 px-3 bg-[#0F766E] hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>VERIFY IN SUPABASE &amp; SIGN IN</span>
                  </button>
                </form>
              )}

              {loginMethod === 'email' && (
                <form onSubmit={handleEmailLogin} className="space-y-3">
                  <div className="p-2.5 bg-orange-50 border border-orange-200/80 rounded-xl text-[11px] text-orange-900 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>Credentials controlled directly by <strong>Firebase Authentication</strong>.</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Gmail ID / Mobile Number
                    </label>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="partner@gmail.com or 9938713179"
                      className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-3 bg-[#0F766E] hover:bg-teal-700 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>SIGN IN WITH FIREBASE</span>
                  </button>
                </form>
              )}

              {loginMethod === 'otp' && (
                !otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Registered Mobile Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full text-sm pl-9 pr-3 py-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden font-bold"
                          autoFocus
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-3 bg-[#0F766E] hover:bg-teal-700 text-white font-bold text-[11px] rounded-lg shadow-xs cursor-pointer"
                    >
                      SEND VERIFICATION OTP
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtpLogin} className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Enter 6-Digit OTP sent to {phone}
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        className="w-full text-center text-2xl font-mono tracking-widest py-3 border-2 border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden font-bold"
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-3 bg-[#0F766E] hover:bg-teal-700 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      <span>VERIFY &amp; GO TO DASHBOARD</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-full text-center text-xs text-slate-500 underline"
                    >
                      Change Mobile Number
                    </button>
                  </form>
                )
              )}

              <div className="pt-2 text-center">
                <button
                  onClick={() => setMode('welcome')}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  ← Back to Welcome
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-900 text-base">Partner Onboarding</h3>
                <p className="text-[11px] text-slate-500">
                  Register your profile, services, and KYC details.
                </p>
              </div>

              {/* Quick Google Onboarding */}
              <button
                type="button"
                onClick={handleGoogleFirebaseLogin}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-teal-50/70 hover:bg-teal-100/70 text-teal-900 font-bold text-xs rounded-xl border border-teal-200/80 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#0F766E]" />
                ) : (
                  <>
                    <GoogleIcon className="w-4 h-4" />
                    <span>Instant Sign Up with Google</span>
                  </>
                )}
              </button>

              <div className="relative py-1 flex items-center justify-center">
                <div className="w-full border-t border-slate-100"></div>
                <span className="absolute bg-white px-2 text-[9px] uppercase font-bold text-slate-400">
                  OR FILL ONBOARDING FORM
                </span>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Gender</label>
                    <select
                      value={regGender}
                      onChange={(e) => setRegGender(e.target.value as 'male' | 'female' | 'other')}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden bg-white"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* 4-Digit Screen Lock Code (Stored in Supabase) */}
                <div className="bg-teal-50/70 p-3 rounded-2xl border border-teal-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-[#0F766E] text-xs flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Screen Lock 4-Digit Code *</span>
                    </label>
                    <span className="text-[10px] text-teal-800 bg-teal-200/60 px-2 py-0.5 rounded-md font-bold">
                      Stored in Supabase
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                      value={regScreenCode}
                      onChange={(e) => setRegScreenCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="•••• (e.g. 1234)"
                      className="w-full p-2.5 bg-white border border-teal-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden font-mono tracking-widest text-center text-lg font-black text-slate-900"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-teal-900 leading-tight">
                    This 4-digit code is stored in Supabase. You will verify this screen lock code whenever you go Online to receive service requests.
                  </p>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email / Gmail Address</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ramesh@gmail.com"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">City</label>
                    <input
                      type="text"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      placeholder="e.g. Mumbai / Delhi"
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">PIN Code</label>
                    <input
                      type="text"
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value)}
                      placeholder="400001"
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Primary Trade / Service</label>
                  <select
                    value={regPrimaryCategory}
                    onChange={(e) => setRegPrimaryCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden bg-white font-semibold"
                  >
                    {PROFESSION_CATEGORIES.map((cat) => (
                      <optgroup
                        key={cat.id}
                        label={cat.subtitle ? `${cat.name} — ${cat.subtitle}` : cat.name}
                      >
                        {cat.professions.map((prof) => (
                          <option key={`${cat.id}_${prof}`} value={prof}>
                            {prof}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Years Experience</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={regExperience}
                      onChange={(e) => setRegExperience(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Doc Type</label>
                    <select
                      value={regDocType}
                      onChange={(e) => setRegDocType(e.target.value as 'aadhaar' | 'pan')}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden bg-white"
                    >
                      <option value="aadhaar">Aadhaar</option>
                      <option value="pan">PAN</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-900">
                  After registration, your account will be placed in <strong>Pending Verification</strong>. Once the Admin approves your profile, you will become an <strong>Active Partner</strong> and can go Online.
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-3 bg-[#0F766E] hover:bg-teal-700 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>SUBMIT REGISTRATION FOR APPROVAL</span>
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setMode('welcome')}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
