import React, { useState, useEffect } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { supabaseService } from '../../services/supabaseClient';
import { ShieldCheck, FileText, CheckCircle2, Building, Save } from 'lucide-react';

export const KYCDocumentsView: React.FC = () => {
  const { partner, updatePartner } = usePartner();

  const [docType, setDocType] = useState<'aadhaar' | 'pan'>('aadhaar');
  const [docNumber, setDocNumber] = useState('XXXX-XXXX-8921');
  const [bankAccount, setBankAccount] = useState('5010049281729');
  const [ifsc, setIfsc] = useState('HDFC0001234');
  const [accountHolder, setAccountHolder] = useState(partner?.name || 'Doorbly Partner');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!partner?.id) return;
    supabaseService.getPartnerKYC(partner.id).then((kyc) => {
      if (kyc) {
        setDocType(kyc.documentType || 'aadhaar');
        if (kyc.documentNumber) setDocNumber(kyc.documentNumber);
        if (kyc.bankAccount) setBankAccount(kyc.bankAccount);
        if (kyc.ifsc) setIfsc(kyc.ifsc);
        if (kyc.accountHolder) setAccountHolder(kyc.accountHolder);
      }
    });
  }, [partner?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    if (partner?.id) {
      await supabaseService.upsertPartnerKYC(partner.id, {
        documentType: docType,
        documentNumber: docNumber.trim(),
        bankAccount: bankAccount.trim(),
        ifsc: ifsc.trim().toUpperCase(),
        accountHolder: accountHolder.trim(),
        certificateUrls: [],
        submittedAt: new Date().toISOString()
      });
    }
    await updatePartner({
      name: accountHolder
    });
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          KYC & Bank Verification
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Government ID and bank account details required for partner verification and automated payouts.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Document records updated successfully!</span>
        </div>
      )}

      {/* Verification Status Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Account KYC Status</span>
            <div className="font-extrabold text-slate-900 text-sm capitalize">
              {partner?.status?.replace('_', ' ') || 'Pending Verification'}
            </div>
          </div>
        </div>

        <span
          className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full uppercase ${
            partner?.status === 'approved'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {partner?.status === 'approved' ? 'Verified' : 'Review'}
        </span>
      </div>

      {/* KYC Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#0F766E]" />
          <span>Government Identity Document</span>
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Document Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as 'aadhaar' | 'pan')}
              className="w-full text-xs font-semibold p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden bg-white"
            >
              <option value="aadhaar">Aadhaar Card</option>
              <option value="pan">PAN Card</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Document Number
            </label>
            <input
              type="text"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Bank Account Section */}
        <h3 className="font-bold text-slate-900 text-sm pt-3 border-t border-slate-100 flex items-center gap-2">
          <Building className="w-4 h-4 text-[#0F766E]" />
          <span>Payout Bank Account Details</span>
        </h3>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Account Holder Name
          </label>
          <input
            type="text"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Bank Account Number
            </label>
            <input
              type="text"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Bank IFSC Code
            </label>
            <input
              type="text"
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value.toUpperCase())}
              className="w-full text-xs font-mono uppercase p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 bg-[#0F766E] hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Updating...' : 'Save & Update Details'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
