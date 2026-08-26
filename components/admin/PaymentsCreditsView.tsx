import React, { useState } from 'react';
import { Booking, BookingStatus, User } from '../../types';

interface CreditRecord {
  id: string;
  student_name: string;
  email: string;
  deposit_amount: number;
  credit_balance: number;
  originating_booking_id: number;
  booking_reference: string;
  status: 'Active Credit' | 'Applied to Renewal' | 'Forfeited';
  last_updated: string;
  notes: string;
}

const INITIAL_CREDITS: CreditRecord[] = [
  {
    id: 'CR-901',
    student_name: 'Zayd Al-Otaibi',
    email: 'zayd.otaibi@example.com',
    deposit_amount: 100,
    credit_balance: 100,
    originating_booking_id: 101,
    booking_reference: 'BK-101',
    status: 'Active Credit',
    last_updated: new Date().toISOString(),
    notes: 'Security deposit held as credit toward session renewal.'
  },
  {
    id: 'CR-902',
    student_name: 'Bilal Khan',
    email: 'bilal.khan@example.com',
    deposit_amount: 100,
    credit_balance: 100,
    originating_booking_id: 104,
    booking_reference: 'BK-104',
    status: 'Active Credit',
    last_updated: new Date().toISOString(),
    notes: 'Non-refundable deposit held on account.'
  }
];

interface PaymentsCreditsViewProps {
  bookings: Booking[];
  adminUser?: User | null;
  onAddActivity?: (activity: { user_id: string; type: string; description: string; timestamp: string }) => void;
}

export const PaymentsCreditsView: React.FC<PaymentsCreditsViewProps> = ({
  bookings = [],
  adminUser,
  onAddActivity
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'credits' | 'rollover' | 'policy' | 'audit'>('credits');
  const [credits, setCredits] = useState<CreditRecord[]>(INITIAL_CREDITS);
  const [selectedCreditForRollover, setSelectedCreditForRollover] = useState<CreditRecord | null>(null);
  const [rolloverNotes, setRolloverNotes] = useState('');
  const [isSuccessNotification, setIsSuccessNotification] = useState<string | null>(null);

  // Derived metrics
  const totalCreditsHeld = credits
    .filter(c => c.status === 'Active Credit')
    .reduce((sum, c) => sum + c.credit_balance, 0);

  const totalDepositsProcessed = bookings.reduce((sum, b) => sum + (b.total_price || 100), 0);

  const handleApplyRollover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCreditForRollover) return;

    setCredits(prev =>
      prev.map(c =>
        c.id === selectedCreditForRollover.id
          ? {
              ...c,
              status: 'Applied to Renewal',
              notes: `${c.notes} | Rolled over to renewal invoice by ${adminUser?.full_name || 'Admin'}. ${rolloverNotes}`.trim(),
              last_updated: new Date().toISOString()
            }
          : c
      )
    );

    if (onAddActivity && adminUser) {
      onAddActivity({
        user_id: adminUser.id,
        type: 'payment',
        description: `Rolled over $${selectedCreditForRollover.credit_balance} deposit credit for ${selectedCreditForRollover.student_name} to tenancy renewal.`,
        timestamp: new Date().toISOString()
      });
    }

    setIsSuccessNotification(`Successfully rolled over $${selectedCreditForRollover.credit_balance} credit for ${selectedCreditForRollover.student_name} to tenancy renewal.`);
    setSelectedCreditForRollover(null);
    setRolloverNotes('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Credits Held</p>
          <p className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-1">
            ${totalCreditsHeld.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-400 mt-1 font-mono">Non-refundable deposits retained on ledger</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Active Student Accounts</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {credits.filter(c => c.status === 'Active Credit').length}
          </p>
          <p className="text-[10px] text-gray-400 mt-1 font-mono">Eligible for session rollover</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Standard Deposit Rate</p>
          <p className="text-2xl font-black text-purple-600 mt-1">$100 USD</p>
          <p className="text-[10px] text-gray-400 mt-1 font-mono">Guaranteed room reserve bond</p>
        </div>
      </div>

      {isSuccessNotification && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <span>{isSuccessNotification}</span>
          <button onClick={() => setIsSuccessNotification(null)} className="font-bold underline ml-4">Dismiss</button>
        </div>
      )}

      {/* Navigation Sub-tabs */}
      <div className="flex bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-x-auto gap-1">
        <button
          onClick={() => setActiveSubTab('credits')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'credits'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          📋 Credit Register
        </button>
        <button
          onClick={() => setActiveSubTab('rollover')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'rollover'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          🔄 Rollover Workflow
        </button>
        <button
          onClick={() => setActiveSubTab('policy')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'policy'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          📜 Deposit Policy & Rules
        </button>
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'audit'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          🔍 Ledger Audit Trail
        </button>
      </div>

      {/* SUB-SECTION: CREDIT REGISTER */}
      {activeSubTab === 'credits' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Student Security Deposit & Credit Ledger
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Deposits are non-refundable and are held as credit toward a future session or tenancy renewal.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Credit ID</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Deposit Amount</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Originating Booking</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {credits.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                      {c.id}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{c.student_name}</p>
                      <p className="text-xs text-gray-400 font-mono">{c.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        ${c.credit_balance} USD
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300 font-mono">
                      {c.booking_reference || `BK-${c.originating_booking_id}`}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          c.status === 'Active Credit'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {c.status === 'Active Credit' && (
                        <button
                          onClick={() => {
                            setSelectedCreditForRollover(c);
                            setActiveSubTab('rollover');
                          }}
                          className="bg-brand-50 text-brand-600 hover:bg-brand-100 px-3 py-1.5 rounded-lg font-bold text-xs"
                        >
                          Execute Rollover ↗
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-SECTION: ROLLOVER WORKFLOW */}
      {activeSubTab === 'rollover' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Execute Deposit Credit Rollover</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Apply an existing student's retained security deposit credit toward their upcoming session renewal invoice.
            </p>
          </div>

          {selectedCreditForRollover ? (
            <form onSubmit={handleApplyRollover} className="max-w-xl space-y-4 bg-gray-50 dark:bg-gray-900/40 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="p-4 bg-brand-50 dark:bg-brand-950/40 rounded-xl border border-brand-100 dark:border-brand-900/40">
                <p className="text-xs font-bold text-brand-700 dark:text-brand-300">Selected Credit Account</p>
                <p className="text-base font-bold text-gray-900 dark:text-white mt-1">
                  {selectedCreditForRollover.student_name} ({selectedCreditForRollover.email})
                </p>
                <p className="text-sm font-mono text-brand-600 mt-0.5">
                  Available Credit Balance: ${selectedCreditForRollover.credit_balance} USD
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Administrative & Rollover Notes</label>
                <textarea
                  value={rolloverNotes}
                  onChange={(e) => setRolloverNotes(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Record justification, renewal invoice reference, or room transfer confirmation details..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all"
                >
                  Confirm & Apply Rollover
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCreditForRollover(null)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="p-12 text-center bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 space-y-3">
              <span className="text-3xl block">🔄</span>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">No Student Selected for Rollover</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Navigate to the Credit Register tab and select a student with an active credit balance to execute a term rollover.
              </p>
              <button
                onClick={() => setActiveSubTab('credits')}
                className="bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Go to Credit Register
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-SECTION: POLICY */}
      {activeSubTab === 'policy' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Residency Deposit Policy & Rules</h2>
          <div className="space-y-4 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
              <p className="font-bold text-amber-900 dark:text-amber-200 text-sm mb-1">
                ⚠️ Core Principle: Non-Refundable Deposit Rollover
              </p>
              <p className="text-amber-800 dark:text-amber-300">
                Security and reservation deposits ($100 USD) are strictly <strong>non-refundable</strong>. However, to support student academic journeys, all deposits are preserved on the student's ledger and automatically credited toward future term renewals, subsequent semesters, or authorized room upgrades.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-xl dark:border-gray-700 space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">1. Credit Validity & Duration</h4>
                <p>Deposit credits remain valid on account for up to 12 calendar months from the date of issuance.</p>
              </div>

              <div className="p-4 border rounded-xl dark:border-gray-700 space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">2. Term Extension Exemption</h4>
                <p>When a student renews for a subsequent term, no new deposit is charged; the existing credit carries over directly.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION: AUDIT TRAIL */}
      {activeSubTab === 'audit' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Deposit & Credit Ledger Audit Log</h2>
          <div className="space-y-3 font-mono text-xs">
            {credits.map((c) => (
              <div key={c.id} className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div>
                  <span className="font-bold text-brand-600">{c.id}</span> — {c.student_name} (${c.credit_balance} USD)
                  <p className="text-[10px] text-gray-400 font-sans mt-0.5">{c.notes}</p>
                </div>
                <span className="text-[10px] text-gray-400">
                  {new Date(c.last_updated).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsCreditsView;
