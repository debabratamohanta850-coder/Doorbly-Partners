import React, { useState } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { IndianRupee, TrendingUp, CheckCircle2, ArrowUpRight, Calendar, BarChart2 } from 'lucide-react';

export const EarningsView: React.FC = () => {
  const { wallet, myJobs, setActiveTab } = usePartner();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  const completedJobs = myJobs.filter(j => j.status === 'COMPLETED');

  // Filter based on period
  const todayStr = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const periodJobs = completedJobs.filter(job => {
    const jobDate = job.completed_at || job.created_at;
    if (period === 'today') return jobDate.startsWith(todayStr);
    if (period === 'week') return jobDate >= sevenDaysAgo;
    if (period === 'month') return jobDate >= thirtyDaysAgo;
    return true;
  });

  const periodGrossValue = periodJobs.reduce((sum, j) => sum + (j.customer_price || 0), 0);
  const periodPartnerEarnings = periodJobs.reduce((sum, j) => sum + (j.partner_earning || 0), 0);

  return (
    <div className="space-y-4 pb-20">
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Earnings & Metrics
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Comprehensive breakdown of your service revenue and doorstep delivery payouts.
        </p>

        {/* Period Selector Tabs */}
        <div className="mt-3 flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setPeriod('today')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-colors ${
              period === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-colors ${
              period === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-colors ${
              period === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Main Metric Hero Card */}
      <div className="bg-[#0F766E] text-white p-6 rounded-3xl shadow-md">
        <span className="text-xs uppercase font-bold text-teal-200 tracking-wider">
          Partner Net Earning ({period.toUpperCase()})
        </span>
        <div className="text-3xl font-black text-white mt-1 flex items-baseline">
          <span className="text-xl mr-1 font-bold">₹</span>
          {periodPartnerEarnings.toLocaleString('en-IN')}
        </div>
        <p className="text-xs text-teal-100 mt-1">
          {periodJobs.length} completed services in this period
        </p>
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Financial Summary</h3>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Completed Jobs</span>
            <span className="font-extrabold text-slate-800">{periodJobs.length}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Gross Service Value</span>
            <span className="font-bold text-slate-800">₹{periodGrossValue}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Partner Earnings (Net)</span>
            <span className="font-bold text-teal-800">₹{periodPartnerEarnings}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Platform Adjustments / Incentives</span>
            <span className="font-medium text-slate-800">₹0</span>
          </div>

          <div className="flex items-center justify-between py-1.5 text-sm pt-2">
            <span className="font-extrabold text-slate-900">Available Wallet Balance</span>
            <span className="font-black text-slate-900">₹{wallet.available_balance}</span>
          </div>
        </div>
      </div>

      {/* Graph Area: strictly only if real historical data exists */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#0F766E]" />
          <span>Earnings Trend</span>
        </h3>

        {periodJobs.length >= 2 ? (
          <div className="h-36 flex items-end gap-2 pt-4 border-b border-slate-200 pb-2">
            {periodJobs.slice(-7).map((job, idx) => {
              const heightPercent = Math.max(15, Math.min(100, (job.partner_earning / 2000) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[9px] text-slate-500 font-mono">₹{job.partner_earning}</span>
                  <div
                    className="w-full bg-[#0F766E] rounded-t-md transition-all group-hover:bg-teal-800"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[9px] text-slate-400 truncate max-w-full">
                    {new Date(job.completed_at || job.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            <p>Insufficient historical data to render graph.</p>
            <p className="text-[11px] mt-0.5">Complete at least 2 services to see your earnings trajectory.</p>
          </div>
        )}
      </div>
    </div>
  );
};
