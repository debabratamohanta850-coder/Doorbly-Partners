import React from 'react';
import { usePartner } from '../../context/PartnerContext';
import { Wallet, CheckCircle2, IndianRupee, ArrowUpRight } from 'lucide-react';

export const QuickStats: React.FC = () => {
  const { wallet, setActiveTab } = usePartner();

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {/* Wallet Balance Card */}
      <div
        onClick={() => setActiveTab('wallet')}
        className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-teal-500/50 transition-all flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Wallet
          </span>
          <Wallet className="w-3.5 h-3.5 text-teal-700" />
        </div>
        <div>
          <div className="text-lg font-black text-slate-900 tracking-tight flex items-baseline">
            <span className="text-xs font-semibold mr-0.5">₹</span>
            {wallet.available_balance.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 flex items-center text-[10px] text-teal-700 font-semibold">
            <span>Manage</span>
            <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" />
          </div>
        </div>
      </div>

      {/* Today's Earnings Card */}
      <div
        onClick={() => setActiveTab('earnings')}
        className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-teal-500/50 transition-all flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Today
          </span>
          <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div>
          <div className="text-lg font-black text-slate-900 tracking-tight flex items-baseline">
            <span className="text-xs font-semibold mr-0.5">₹</span>
            {wallet.today_earnings.toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-[10px] text-slate-500 font-medium">
            Net Earnings
          </p>
        </div>
      </div>

      {/* Today's Completed Jobs Card */}
      <div
        onClick={() => setActiveTab('jobs')}
        className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-teal-500/50 transition-all flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Jobs
          </span>
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
        </div>
        <div>
          <div className="text-lg font-black text-slate-900 tracking-tight">
            {wallet.today_completed_jobs}
          </div>
          <p className="mt-1 text-[10px] text-slate-500 font-medium">
            Completed
          </p>
        </div>
      </div>
    </div>
  );
};
