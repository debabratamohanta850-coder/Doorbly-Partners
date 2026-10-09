import React, { useState } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { SupportCategory } from '../../types';
import { HelpCircle, Plus, Send, Phone, CheckCircle2, X } from 'lucide-react';

export const SupportView: React.FC = () => {
  const { supportTickets, createSupportTicket, activeJob } = usePartner();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [category, setCategory] = useState<SupportCategory>('Active Job Issue');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const categories: SupportCategory[] = [
    'Active Job Issue',
    'Payment Issue',
    'Wallet Issue',
    'Customer Issue',
    'Service Issue',
    'Account Issue',
    'Technical Issue',
    'Membership Issue',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    await createSupportTicket({
      category,
      subject: subject.trim(),
      description: description.trim(),
      booking_id: activeJob?.id,
      status: 'open'
    });
    setIsSubmitting(false);
    setShowCreateModal(false);
    setSubject('');
    setDescription('');
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 3000);
  };

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Partner Support
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Dedicated assistance for on-job challenges, wallet queries, and technical support.
        </p>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Support ticket submitted. A partner representative will respond shortly.</span>
        </div>
      )}

      {/* Emergency / Direct Call Support Banner (Faded Green) */}
      <div className="bg-gradient-to-br from-emerald-50 via-emerald-100/75 to-emerald-50 text-slate-900 rounded-2xl p-5 border border-emerald-200/90 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            Doorbly Partner Care
          </span>
          <h3 className="font-extrabold text-base text-slate-900 mt-0.5">
            Need urgent help on an active job?
          </h3>
          <p className="text-xs text-emerald-800 mt-0.5">
            Direct priority line: 9938713179
          </p>
        </div>

        <button
          onClick={() => (window.location.href = 'tel:9938713179')}
          className="p-3 rounded-xl bg-[#0F766E] hover:bg-teal-700 text-white active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <Phone className="w-5 h-5" />
        </button>
      </div>

      {/* Tickets Header with Action */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="font-bold text-slate-900 text-sm">
          Support Tickets ({supportTickets.length})
        </h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="py-2 px-3 bg-[#0F766E] hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Tickets List */}
      {supportTickets.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm">No support tickets</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            You have no active queries or complaints. Tap "New Ticket" if you need any assistance.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {supportTickets.map((t) => (
            <div
              key={t.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                  {t.category}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {t.status}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm mt-1">{t.subject}</h4>
              <p className="text-xs text-slate-600 line-clamp-2">{t.description}</p>
              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                Ticket ID: #{t.id.substring(0, 10)} · {new Date(t.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900">
                Create Support Ticket
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Issue Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SupportCategory)}
                  className="w-full text-xs font-semibold p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden bg-white"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Subject / Summary
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Customer location unreachable"
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Detailed Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what happened so our team can assist promptly..."
                  rows={3}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 text-slate-600 font-bold text-xs border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#0F766E] hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
