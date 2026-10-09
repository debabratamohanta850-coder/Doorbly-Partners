import React from 'react';
import { Award, ShieldCheck, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export const PartnerGuidelinesView: React.FC = () => {
  const coreGuidelines = [
    {
      number: '1',
      title: 'Professional Attire & ID Card',
      description: 'Always wear clean attire and your ID card before ringing the customer bell.'
    },
    {
      number: '2',
      title: 'Verify Customer 4-Digit Start PIN',
      description: "Verify the customer's 4-digit PIN before opening tools or starting work."
    },
    {
      number: '3',
      title: 'Transparent Quoted Pricing Only',
      description: 'Never demand cash outside of the Doorbly app quoted payment structure.'
    },
    {
      number: '4',
      title: 'On-Time Doorstep Arrival',
      description: 'Reach the customer location within the scheduled slot or notify customer & support immediately in case of traffic delays.'
    },
    {
      number: '5',
      title: 'Post-Service Workspace Cleanup',
      description: 'Clean the work area thoroughly after completing the repair or installation before marking the job completed.'
    }
  ];

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Doorstep Partner Guidelines
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Standard operating protocol for Doorbly verified service professionals.
        </p>
      </div>

      {/* Main Guidelines Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">
              Mandatory Field Rules
            </h3>
            <p className="text-[11px] text-slate-500">
              Follow these steps on every customer visit
            </p>
          </div>
        </div>

        <ul className="space-y-3">
          {coreGuidelines.map((rule) => (
            <li
              key={rule.number}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
            >
              <span className="w-6 h-6 rounded-lg bg-[#0F766E] text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {rule.number}
              </span>
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 text-xs">{rule.title}</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{rule.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Safety & Quality Compliance Note */}
      <div className="bg-teal-50/80 rounded-2xl p-4 border border-teal-200/80 flex items-start gap-3 text-xs text-teal-950">
        <ShieldCheck className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-extrabold text-xs">Zero-Commission Partner Promise</div>
          <p className="text-[11px] text-teal-800 leading-relaxed">
            Maintaining high customer ratings and following doorstep guidelines ensures priority job dispatch in your preferred service radius.
          </p>
        </div>
      </div>
    </div>
  );
};
