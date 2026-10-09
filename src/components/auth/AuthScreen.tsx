import React, { useState } from 'react';
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
  Sparkles
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

export const AuthScreen: React.FC = () => {
  const { refreshSession } = usePartner();

  const [mode, setMode] = useState<'welcome' | 'login' | 'register'>('welcome');
  const [loginMethod, setLoginMethod] = useState<'otp' | 'email'>('otp');

  // Login inputs
  const [phone, setPhone] = useState('+91 ');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register inputs
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('+91 ');
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

  // Handle Email Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await partnerAuthService.loginWithEmail(email, password);
      if (res.success) {
        await refreshSession();
      } else {
        setErrorMsg(res.message || 'Invalid credentials');
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

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const partnerId = `p_${Date.now()}`;
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
        status: 'pending_verification', // Partner must wait for Admin approval to become an active partner
        is_online: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

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
        email: partnerProfile.email
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
              <div className="space-y-2">
                <div className="bg-teal-50/80 p-3.5 rounded-2xl border border-teal-200/80 text-left text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-teal-900 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                    <span>Real-time nearby service matching</span>
                  </div>
                  <div className="flex items-center gap-2 text-teal-900 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                    <span>Instant wallet credits on job completion</span>
                  </div>
                  <div className="flex items-center gap-2 text-teal-900 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                    <span>Direct bank payouts & ₹370 flat plan</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                {/* 1-Tap Google Sign-In (Firebase Auth) */}
                <button
                  type="button"
                  onClick={handleGoogleFirebaseLogin}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-800 font-extrabold text-sm rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center gap-3 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#0F766E]" />
                  ) : (
                    <>
                      <GoogleIcon className="w-5 h-5" />
                      <span>CONTINUE WITH GOOGLE</span>
                    </>
                  )}
                </button>

                <div className="relative py-1 flex items-center justify-center">
                  <div className="w-full border-t border-slate-200"></div>
                  <span className="absolute bg-white px-3 text-[10px] uppercase font-bold text-slate-400">
                    OR CREDENTIALS
                  </span>
                </div>

                <button
                  onClick={() => setMode('login')}
                  className="w-full py-3 px-6 bg-[#0F766E] hover:bg-teal-700 active:bg-teal-800 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all cursor-pointer"
                >
                  LOGIN TO PARTNER ACCOUNT
                </button>

                <button
                  onClick={() => setMode('register')}
                  className="w-full py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-2xl border border-slate-300 transition-all cursor-pointer"
                >
                  REGISTER AS NEW PARTNER
                </button>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-900 text-base">Partner Sign In</h3>
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setLoginMethod('otp')}
                    className={`px-2 py-1 rounded-md font-semibold ${loginMethod === 'otp' ? 'bg-teal-50 text-[#0F766E]' : 'text-slate-400'}`}
                  >
                    Phone OTP
                  </button>
                  <button
                    onClick={() => setLoginMethod('email')}
                    className={`px-2 py-1 rounded-md font-semibold ${loginMethod === 'email' ? 'bg-teal-50 text-[#0F766E]' : 'text-slate-400'}`}
                  >
                    Email
                  </button>
                </div>
              </div>

              {/* Quick Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleFirebaseLogin}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#0F766E]" />
                ) : (
                  <>
                    <GoogleIcon className="w-4 h-4" />
                    <span>Quick Sign In with Google</span>
                  </>
                )}
              </button>

              <div className="relative py-1 flex items-center justify-center">
                <div className="w-full border-t border-slate-100"></div>
                <span className="absolute bg-white px-2 text-[9px] uppercase font-bold text-slate-400">
                  OR USE {loginMethod.toUpperCase()}
                </span>
              </div>

              {loginMethod === 'otp' ? (
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
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.includes('@') || /[a-zA-Z]/.test(val)) {
                              setLoginMethod('email');
                              setEmail(val.replace('+91', '').trim());
                            } else {
                              setPhone(val);
                            }
                          }}
                          placeholder="+91 98765 43210 or Email"
                          className="w-full text-sm pl-9 pr-3 py-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden font-bold"
                          autoFocus
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-[#0F766E] hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md"
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
                      className="w-full py-3.5 bg-[#0F766E] hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      <span>VERIFY & GO TO DASHBOARD</span>
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
              ) : (
                <form onSubmit={handleEmailLogin} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="partner@doorbly.com"
                      className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
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
                    className="w-full py-3.5 bg-[#0F766E] hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    SIGN IN
                  </button>
                </form>
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

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ramesh@email.com"
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
                  className="w-full py-3.5 bg-[#0F766E] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
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
