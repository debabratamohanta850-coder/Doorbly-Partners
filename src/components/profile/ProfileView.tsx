import React, { useState } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { User, Phone, Mail, MapPin, Award, ShieldCheck, Save, Check, LogOut, Loader2 } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { partner, membership, updatePartner, setActiveTab, logout } = usePartner();

  const [name, setName] = useState(partner?.name || '');
  const [mobile, setMobile] = useState(partner?.mobile || '');
  const [email, setEmail] = useState(partner?.email || '');
  const [address, setAddress] = useState(partner?.address || '');
  const [city, setCity] = useState(partner?.city || '');
  const [pinCode, setPinCode] = useState(partner?.pin_code || '');
  const [yearsExp, setYearsExp] = useState(partner?.years_experience || 3);
  const [radiusKm, setRadiusKm] = useState(partner?.preferred_radius_km || 10);
  const [workingArea, setWorkingArea] = useState(partner?.working_area || 'Central District');
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updatePartner({
      name,
      mobile,
      email,
      address,
      city,
      pin_code: pinCode,
      years_experience: Number(yearsExp),
      preferred_radius_km: Number(radiusKm),
      working_area: workingArea
    });
    setIsSaving(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Partner Profile
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal and professional profile visible to Doorbly customers and operations.
        </p>
      </div>

      {showSavedToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Header Profile Summary */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#0F766E] text-white flex items-center justify-center font-extrabold text-2xl shrink-0 border-2 border-teal-600/30">
          <span>{partner?.name?.charAt(0) || 'P'}</span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-900 text-base truncate">
              {partner?.name || 'Partner Name'}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                partner?.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {partner?.status === 'approved' ? 'Active Partner' : 'Waiting for Approval'}
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate">{partner?.mobile}</p>
          <div className="mt-1 flex items-center gap-2 text-[11px]">
            <span className="font-bold text-[#0F766E] capitalize">
              {partner?.primary_category}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">
              {partner?.years_experience} yrs exp
            </span>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 text-xs">
        <h3 className="font-bold text-slate-900 text-sm">Personal Information</h3>

        <div className="space-y-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Mobile Number</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Full Street Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">PIN Code</label>
              <input
                type="text"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <h3 className="font-bold text-slate-900 text-sm pt-3 border-t border-slate-100">
          Professional Configuration
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Years of Experience</label>
            <input
              type="number"
              min="0"
              max="40"
              value={yearsExp}
              onChange={(e) => setYearsExp(Number(e.target.value))}
              className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Service Radius (km)</label>
            <input
              type="number"
              min="1"
              max="50"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Working Zone / Areas</label>
          <input
            type="text"
            value={workingArea}
            onChange={(e) => setWorkingArea(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3.5 bg-[#0F766E] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>

      {/* Account Session Logout */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Account Session</h3>
          <p className="text-xs text-slate-500">
            Sign out of your active partner session on this device.
          </p>
        </div>

        {showLogoutConfirm ? (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2.5">
            <p className="text-xs font-bold text-rose-900">
              Are you sure you want to log out of Doorbly Partner?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                {isLoggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                <span>Yes, Log Out</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="py-2 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-3 px-4 rounded-xl text-rose-600 font-bold text-xs hover:bg-rose-50 border border-rose-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out Account</span>
          </button>
        )}
      </div>
    </div>
  );
};
