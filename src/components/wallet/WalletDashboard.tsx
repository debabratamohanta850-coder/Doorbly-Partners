import React, { useState, useEffect } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { WalletTransaction, WithdrawalRequest } from '../../types';
import { supabaseService } from '../../services/supabaseClient';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  CreditCard,
  Loader2,
  X,
  ShieldCheck
} from 'lucide-react';

export const WalletDashboard: React.FC = () => {
  const { wallet, partner, requestWithdrawal, refreshAll } = usePartner();

  const [activeTab, setActiveTab] = useState<'transactions' | 'withdrawals'>('transactions');
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Withdrawal form modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [accountHolder, setAccountHolder] = useState(partner?.name || '');
  const [withdrawError, setWithdrawError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!partner) return;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const [txList, wList] = await Promise.all([
          supabaseService.getTransactions(partner.id),
          supabaseService.getWithdrawals(partner.id)
        ]);
        setTransactions(txList);
        setWithdrawals(wList);
      } catch (e) {
        console.warn('Error loading wallet history:', e);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [partner]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount < 200) {
      setWithdrawError('Minimum withdrawal amount is ₹200.');
      return;
    }
    if (numAmount > wallet.available_balance) {
      setWithdrawError(`Amount exceeds your available balance of ₹${wallet.available_balance}.`);
      return;
    }
    if (!bankAccount.trim() || bankAccount.length < 8) {
      setWithdrawError('Please enter a valid bank account number.');
      return;
    }
    if (!ifsc.trim() || ifsc.length < 5) {
      setWithdrawError('Please enter a valid bank IFSC code.');
      return;
    }
    if (!accountHolder.trim()) {
      setWithdrawError('Please enter the bank account holder name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestWithdrawal(numAmount, bankAccount.trim(), ifsc.trim().toUpperCase(), accountHolder.trim());
      if (res.success) {
        setShowWithdrawModal(false);
        setAmount('');
        // Refresh local data
        if (partner) {
          const [txList, wList] = await Promise.all([
            supabaseService.getTransactions(partner.id),
            supabaseService.getWithdrawals(partner.id)
          ]);
          setTransactions(txList);
          setWithdrawals(wList);
        }
      } else {
        setWithdrawError(res.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Wallet Balance Hero Card */}
      <div className="bg-gradient-to-br from-[#0F766E] to-teal-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between text-teal-100 text-xs font-semibold mb-2">
          <span className="flex items-center gap-1.5 uppercase tracking-wider">
            <Wallet className="w-4 h-4" />
            DOORBLY PARTNER WALLET
          </span>
          <span className="bg-teal-800/80 px-2 py-0.5 rounded text-[10px] uppercase font-mono">
            Direct Bank Payout
          </span>
        </div>

        {/* Main Available Balance */}
        <div className="mt-2">
          <span className="text-xs text-teal-200 uppercase font-medium">Available Balance</span>
          <div className="text-3xl font-black text-white tracking-tight flex items-baseline mt-0.5">
            <span className="text-xl font-bold mr-1">₹</span>
            {wallet.available_balance.toLocaleString('en-IN')}
          </div>
          {wallet.pending_amount > 0 && (
            <div className="text-xs text-teal-200 mt-1">
              ₹{wallet.pending_amount} pending clearance
            </div>
          )}
        </div>

        {/* Withdrawal Trigger Button */}
        <div className="mt-5 pt-4 border-t border-teal-700/60 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              setWithdrawError('');
              setShowWithdrawModal(true);
            }}
            disabled={wallet.available_balance < 200}
            className="flex-1 py-3 px-4 bg-white text-[#0F766E] hover:bg-teal-50 active:bg-teal-100 disabled:opacity-50 disabled:bg-white/20 disabled:text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span>WITHDRAW TO BANK</span>
          </button>
        </div>
      </div>

      {/* Earnings Period Breakdown Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Today
          </span>
          <div className="text-base font-extrabold text-slate-900 mt-0.5">
            ₹{wallet.today_earnings}
          </div>
          <span className="text-[10px] text-slate-400">
            {wallet.today_completed_jobs} jobs
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            This Week
          </span>
          <div className="text-base font-extrabold text-slate-900 mt-0.5">
            ₹{wallet.week_earnings}
          </div>
          <span className="text-[10px] text-slate-400">7 days</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            This Month
          </span>
          <div className="text-base font-extrabold text-slate-900 mt-0.5">
            ₹{wallet.month_earnings}
          </div>
          <span className="text-[10px] text-slate-400">30 days</span>
        </div>
      </div>

      {/* Segmented Control for History */}
      <div className="bg-slate-200/80 p-1 rounded-xl flex items-center text-xs font-semibold">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 py-1.5 rounded-lg transition-colors ${
            activeTab === 'transactions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Transactions ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`flex-1 py-1.5 rounded-lg transition-colors ${
            activeTab === 'withdrawals' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Withdrawal Requests ({withdrawals.length})
        </button>
      </div>

      {/* Content Area */}
      {loadingHistory ? (
        <div className="p-8 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F766E]" />
          <span className="text-xs">Loading wallet records...</span>
        </div>
      ) : activeTab === 'transactions' ? (
        transactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No transactions yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Your earnings will appear here after completing a service.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      tx.type === 'credit'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {tx.type === 'credit' ? (
                      <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">{tx.description}</h5>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                      <span>·</span>
                      <span className="font-mono">{tx.id.substring(0, 10)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-black text-sm ${
                      tx.type === 'credit' ? 'text-emerald-700' : 'text-slate-900'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                  </div>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Withdrawals List */
        withdrawals.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <Building className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No withdrawal requests</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              You can request bank transfers once your available balance is at least ₹200.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {withdrawals.map((w) => (
              <div
                key={w.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">₹{w.amount}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold uppercase">
                      {w.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    A/C: {w.bank_account} · IFSC: {w.ifsc}
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400">
                  {new Date(w.requested_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Withdraw to Bank
                </h3>
                <p className="text-xs text-slate-500">
                  Available for transfer: <strong>₹{wallet.available_balance}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Withdrawal Amount (₹)
                </label>
                <input
                  type="number"
                  min="200"
                  max={wallet.available_balance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Min ₹200"
                  className="w-full text-base font-bold p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="e.g. 5010049281729"
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Account Holder
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Full name as in bank"
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:border-[#0F766E] focus:outline-hidden"
                  />
                </div>
              </div>

              {withdrawError && (
                <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {withdrawError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-3 text-slate-600 font-bold text-xs border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#0F766E] hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
