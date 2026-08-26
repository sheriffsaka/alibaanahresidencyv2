import React, { useState, useMemo } from 'react';
import { Booking, User } from '../../types';

export interface CreditUsageEntry {
  id: string;
  amount_used: number;
  when_used: string;
  amount_remaining: number;
  purpose_notes: string;
  recorded_by: string;
  recorded_at: string;
}

export interface CreditRecord {
  id: string;
  student_name: string;
  email: string;
  deposit_amount: number;
  credit_balance: number;
  total_used: number;
  originating_booking_id?: number | string;
  booking_reference: string;
  status: 'Active Credit' | 'Fully Used' | 'Forfeited';
  last_updated: string;
  notes: string;
  usage_history: CreditUsageEntry[];
}

const INITIAL_CREDITS: CreditRecord[] = [
  {
    id: 'CR-901',
    student_name: 'Zayd Al-Otaibi',
    email: 'zayd.otaibi@example.com',
    deposit_amount: 100,
    credit_balance: 60,
    total_used: 40,
    originating_booking_id: 101,
    booking_reference: 'BK-101',
    status: 'Active Credit',
    last_updated: new Date().toISOString(),
    notes: 'Security deposit held as credit toward session renewal.',
    usage_history: [
      {
        id: 'USG-101',
        amount_used: 40,
        when_used: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
        amount_remaining: 60,
        purpose_notes: 'Applied partial credit toward Month 2 rent invoice renewal.',
        recorded_by: 'Admin Office',
        recorded_at: new Date(Date.now() - 7 * 86400000).toISOString()
      }
    ]
  },
  {
    id: 'CR-902',
    student_name: 'Bilal Khan',
    email: 'bilal.khan@example.com',
    deposit_amount: 100,
    credit_balance: 100,
    total_used: 0,
    originating_booking_id: 104,
    booking_reference: 'BK-104',
    status: 'Active Credit',
    last_updated: new Date().toISOString(),
    notes: 'Non-refundable deposit held on account for tenancy renewal.',
    usage_history: []
  },
  {
    id: 'CR-903',
    student_name: 'Omar Farooq',
    email: 'omar.farooq@example.com',
    deposit_amount: 100,
    credit_balance: 0,
    total_used: 100,
    originating_booking_id: 108,
    booking_reference: 'BK-108',
    status: 'Fully Used',
    last_updated: new Date(Date.now() - 14 * 86400000).toISOString(),
    notes: 'Full deposit applied to semester tenancy extension.',
    usage_history: [
      {
        id: 'USG-102',
        amount_used: 100,
        when_used: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
        amount_remaining: 0,
        purpose_notes: 'Full $100 security deposit applied to semester renewal contract.',
        recorded_by: 'Jimoh Bolakale Ajao',
        recorded_at: new Date(Date.now() - 14 * 86400000).toISOString()
      }
    ]
  }
];

interface PaymentsCreditsViewProps {
  bookings?: Booking[];
  adminUser?: User | null;
  onAddActivity?: (activity: { user_id: string; type: string; description: string; timestamp: string }) => void;
}

export const PaymentsCreditsView: React.FC<PaymentsCreditsViewProps> = ({
  bookings = [],
  adminUser,
  onAddActivity
}) => {
  const [credits, setCredits] = useState<CreditRecord[]>(INITIAL_CREDITS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active Credit' | 'Fully Used'>('All');
  
  // Execution Modal State
  const [executingCredit, setExecutingCredit] = useState<CreditRecord | null>(null);
  const [amountUsedInput, setAmountUsedInput] = useState<number>(0);
  const [whenUsedInput, setWhenUsedInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [purposeNotesInput, setPurposeNotesInput] = useState<string>('');

  // History & Table State
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Add New Credit Modal State
  const [isAddCreditModalOpen, setIsAddCreditModalOpen] = useState(false);
  const [newCreditForm, setNewCreditForm] = useState({
    student_name: '',
    email: '',
    deposit_amount: 100,
    booking_reference: '',
    notes: ''
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Derived Summary Metrics
  const totalActiveCredits = useMemo(() => {
    return credits
      .filter(c => c.status === 'Active Credit')
      .reduce((sum, c) => sum + c.credit_balance, 0);
  }, [credits]);

  const totalUsedCredits = useMemo(() => {
    return credits.reduce((sum, c) => sum + (c.total_used || 0), 0);
  }, [credits]);

  const totalOriginalDeposits = useMemo(() => {
    return credits.reduce((sum, c) => sum + c.deposit_amount, 0);
  }, [credits]);

  // Filtered list
  const filteredCredits = useMemo(() => {
    return credits.filter(c => {
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.student_name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.booking_reference.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [credits, statusFilter, searchQuery]);

  const toggleRowExpanded = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Open Execute Modal
  const handleOpenExecute = (credit: CreditRecord) => {
    setExecutingCredit(credit);
    setAmountUsedInput(credit.credit_balance); // Default to full available balance
    setWhenUsedInput(new Date().toISOString().split('T')[0]);
    setPurposeNotesInput('');
  };

  // Calculate dynamic remaining
  const calculatedRemaining = useMemo(() => {
    if (!executingCredit) return 0;
    const remaining = executingCredit.credit_balance - (Number(amountUsedInput) || 0);
    return Math.max(0, remaining);
  }, [executingCredit, amountUsedInput]);

  // Handle Submit Execution
  const handleConfirmExecution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!executingCredit) return;

    const used = Number(amountUsedInput);
    if (isNaN(used) || used <= 0) {
      setNotification({ type: 'error', message: 'Please enter a valid amount used greater than $0.' });
      return;
    }

    if (used > executingCredit.credit_balance) {
      setNotification({
        type: 'error',
        message: `Amount used ($${used}) exceeds the student's available credit balance ($${executingCredit.credit_balance}).`
      });
      return;
    }

    const newRemaining = executingCredit.credit_balance - used;
    const newTotalUsed = (executingCredit.total_used || 0) + used;
    const newStatus = newRemaining === 0 ? 'Fully Used' : 'Active Credit';

    const newUsageEntry: CreditUsageEntry = {
      id: `USG-${Date.now().toString().slice(-4)}`,
      amount_used: used,
      when_used: whenUsedInput || new Date().toISOString().split('T')[0],
      amount_remaining: newRemaining,
      purpose_notes: purposeNotesInput.trim() || 'Credit deducted toward session/invoice renewal.',
      recorded_by: adminUser?.full_name || 'Admin',
      recorded_at: new Date().toISOString()
    };

    setCredits(prev =>
      prev.map(c => {
        if (c.id === executingCredit.id) {
          return {
            ...c,
            credit_balance: newRemaining,
            total_used: newTotalUsed,
            status: newStatus,
            last_updated: new Date().toISOString(),
            usage_history: [newUsageEntry, ...(c.usage_history || [])]
          };
        }
        return c;
      })
    );

    if (onAddActivity && adminUser) {
      onAddActivity({
        user_id: adminUser.id,
        type: 'payment',
        description: `Executed $${used} credit usage for ${executingCredit.student_name}. Remaining balance: $${newRemaining}.`,
        timestamp: new Date().toISOString()
      });
    }

    setNotification({
      type: 'success',
      message: `Successfully executed $${used} credit usage for ${executingCredit.student_name}. Amount remaining: $${newRemaining}.`
    });

    setExecutingCredit(null);
  };

  // Handle Add New Manual Credit
  const handleAddNewCredit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCreditForm.student_name || !newCreditForm.email) {
      setNotification({ type: 'error', message: 'Please provide the student name and email.' });
      return;
    }

    const newRecord: CreditRecord = {
      id: `CR-${Math.floor(900 + Math.random() * 900)}`,
      student_name: newCreditForm.student_name,
      email: newCreditForm.email,
      deposit_amount: Number(newCreditForm.deposit_amount) || 100,
      credit_balance: Number(newCreditForm.deposit_amount) || 100,
      total_used: 0,
      booking_reference: newCreditForm.booking_reference || `BK-${Math.floor(100 + Math.random() * 900)}`,
      status: 'Active Credit',
      last_updated: new Date().toISOString(),
      notes: newCreditForm.notes || 'Manually registered security deposit credit.',
      usage_history: []
    };

    setCredits(prev => [newRecord, ...prev]);
    setIsAddCreditModalOpen(false);
    setNewCreditForm({
      student_name: '',
      email: '',
      deposit_amount: 100,
      booking_reference: '',
      notes: ''
    });

    setNotification({
      type: 'success',
      message: `Successfully added credit register record for ${newRecord.student_name} ($${newRecord.deposit_amount} USD).`
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Credits Held</p>
          <p className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-1">
            ${totalActiveCredits.toLocaleString()} USD
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Available for student invoice deduction</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Credit Used</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            ${totalUsedCredits.toLocaleString()} USD
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Applied to tenancy renewals & rent</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Total Deposits</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            ${totalOriginalDeposits.toLocaleString()} USD
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Total non-refundable deposits tracked</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Active Accounts</p>
          <p className="text-2xl font-black text-purple-600 mt-1">
            {credits.filter(c => c.status === 'Active Credit').length} / {credits.length}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Students with available balance</p>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}
        >
          <span className="font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* MAIN CREDIT REGISTER SECTION */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Section Header & Controls */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📋</span> Student Credit Register & Usage Ledger
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Record credit deductions, view historical usage dates, and monitor remaining balances for each student.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search student or credit ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 text-xs border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium flex-1 md:w-52 text-gray-800 dark:text-gray-200"
            />

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-bold border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-gray-200"
            >
              <option value="All">All Statuses</option>
              <option value="Active Credit">Active Credit ({credits.filter(c => c.status === 'Active Credit').length})</option>
              <option value="Fully Used">Fully Used ({credits.filter(c => c.status === 'Fully Used').length})</option>
            </select>

            {/* Add Credit Button */}
            <button
              onClick={() => setIsAddCreditModalOpen(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>➕</span> Add Credit
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/60">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Credit ID</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Original Deposit</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Amount Used</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Amount Remaining</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Booking Ref</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredCredits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-xs text-gray-500">
                    No credit records found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCredits.map((c) => {
                  const isExpanded = !!expandedRows[c.id];
                  const hasHistory = c.usage_history && c.usage_history.length > 0;

                  return (
                    <React.Fragment key={c.id}>
                      <tr className="hover:bg-gray-50/80 dark:hover:bg-gray-750/50 transition-colors">
                        {/* ID */}
                        <td className="px-4 py-4 text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                          {c.id}
                        </td>

                        {/* Student Name & Email */}
                        <td className="px-4 py-4">
                          <p className="font-bold text-xs text-gray-900 dark:text-white">{c.student_name}</p>
                          <p className="text-[11px] text-gray-400 font-mono">{c.email}</p>
                        </td>

                        {/* Original Deposit */}
                        <td className="px-4 py-4 text-xs font-bold text-gray-700 dark:text-gray-300 font-mono">
                          ${c.deposit_amount} USD
                        </td>

                        {/* Amount Used */}
                        <td className="px-4 py-4 text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                          ${c.total_used || 0} USD
                        </td>

                        {/* Amount Remaining */}
                        <td className="px-4 py-4">
                          <span
                            className={`text-xs font-black px-2.5 py-1 rounded-full font-mono ${
                              c.credit_balance > 0
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                          >
                            ${c.credit_balance} USD
                          </span>
                        </td>

                        {/* Booking Ref */}
                        <td className="px-4 py-4 text-xs text-gray-600 dark:text-gray-300 font-mono">
                          {c.booking_reference || `BK-${c.originating_booking_id || 'N/A'}`}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              c.status === 'Active Credit'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Execute Usage Button */}
                            {c.credit_balance > 0 ? (
                              <button
                                onClick={() => handleOpenExecute(c)}
                                className="bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-xs flex items-center gap-1 transition-all"
                                title="Execute Credit Deduction"
                              >
                                <span>⚡</span> Execute
                              </button>
                            ) : (
                              <span className="text-[11px] text-gray-400 font-medium italic px-2">
                                Exhausted
                              </span>
                            )}

                            {/* View History Toggle Button */}
                            <button
                              onClick={() => toggleRowExpanded(c.id)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                isExpanded
                                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600'
                                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                              }`}
                              title="View student usage records"
                            >
                              📜 History ({c.usage_history ? c.usage_history.length : 0}) {isExpanded ? '▲' : '▼'}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDABLE INLINE USAGE HISTORY ROW */}
                      {isExpanded && (
                        <tr className="bg-gray-50/70 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700">
                          <td colSpan={8} className="p-4 sm:p-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                  <span>📜</span> Credit Usage Record History: {c.student_name} ({c.id})
                                </h4>
                                <span className="text-[11px] text-gray-500 font-mono">
                                  Original: ${c.deposit_amount} | Used: ${c.total_used || 0} | Remaining: ${c.credit_balance}
                                </span>
                              </div>

                              {!hasHistory ? (
                                <p className="text-xs text-gray-400 italic py-2">
                                  No credit usage records have been executed for this student yet. Click "Execute" to deduct credit.
                                </p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700 text-xs">
                                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 font-bold">
                                      <tr>
                                        <th className="px-3 py-2 text-left">Record ID</th>
                                        <th className="px-3 py-2 text-left">When Used</th>
                                        <th className="px-3 py-2 text-left">Amount Used</th>
                                        <th className="px-3 py-2 text-left">Amount Remaining</th>
                                        <th className="px-3 py-2 text-left">Purpose & Notes</th>
                                        <th className="px-3 py-2 text-left">Recorded By</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                      {c.usage_history.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30">
                                          <td className="px-3 py-2 font-mono font-bold text-brand-600 dark:text-brand-400">
                                            {u.id}
                                          </td>
                                          <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">
                                            {u.when_used}
                                          </td>
                                          <td className="px-3 py-2 font-mono font-bold text-amber-600 dark:text-amber-400">
                                            -${u.amount_used} USD
                                          </td>
                                          <td className="px-3 py-2 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                            ${u.amount_remaining} USD
                                          </td>
                                          <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                                            {u.purpose_notes}
                                          </td>
                                          <td className="px-3 py-2 text-gray-500 text-[11px]">
                                            {u.recorded_by}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXECUTE CREDIT USAGE MODAL */}
      {executingCredit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-5 animate-scale-up">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>⚡</span> Execute Student Credit Usage
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Record amount used, date, and updated remaining balance for {executingCredit.student_name}.
                </p>
              </div>
              <button
                onClick={() => setExecutingCredit(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-base font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Student Account Summary Card */}
            <div className="p-4 rounded-xl bg-brand-50/80 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/40 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400 uppercase font-bold text-[10px] block">Student</span>
                <span className="font-bold text-gray-900 dark:text-white text-sm">{executingCredit.student_name}</span>
                <span className="font-mono text-gray-500 text-[11px] block">{executingCredit.email}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 uppercase font-bold text-[10px] block">Available Credit</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base">
                  ${executingCredit.credit_balance} USD
                </span>
                <span className="text-gray-400 text-[10px] block">Original: ${executingCredit.deposit_amount}</span>
              </div>
            </div>

            {/* Execution Form */}
            <form onSubmit={handleConfirmExecution} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Amount Used */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Amount Used ($ USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">$</span>
                    <input
                      type="number"
                      value={amountUsedInput}
                      onChange={(e) => setAmountUsedInput(Number(e.target.value))}
                      className="w-full text-xs p-2.5 pl-7 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-bold text-gray-900 dark:text-white"
                      min={1}
                      max={executingCredit.credit_balance}
                      step="any"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">Max available: ${executingCredit.credit_balance}</span>
                </div>

                {/* 2. When Used */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    When Used (Date) *
                  </label>
                  <input
                    type="date"
                    value={whenUsedInput}
                    onChange={(e) => setWhenUsedInput(e.target.value)}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium text-gray-900 dark:text-white"
                    required
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">Effective transaction date</span>
                </div>
              </div>

              {/* 3. Real-Time Amount Remaining Display */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                    Calculated Amount Remaining:
                  </span>
                  <span className="text-[10px] text-gray-400">
                    ${executingCredit.credit_balance} - ${Number(amountUsedInput) || 0}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`text-lg font-black font-mono ${
                      calculatedRemaining > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    ${calculatedRemaining} USD
                  </span>
                  <span className="text-[10px] text-gray-400 block">
                    {calculatedRemaining === 0 ? 'Fully Exhausted' : 'Remaining Active Credit'}
                  </span>
                </div>
              </div>

              {/* 4. Purpose / Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Purpose / Administrative Notes
                </label>
                <textarea
                  value={purposeNotesInput}
                  onChange={(e) => setPurposeNotesInput(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium text-gray-900 dark:text-white"
                  placeholder="e.g. Applied toward tenancy renewal invoice, room upgrade offset, or rent payment credit..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <span>✓</span> Confirm & Record Usage
                </button>
                <button
                  type="button"
                  onClick={() => setExecutingCredit(null)}
                  className="px-4 py-3 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW MANUAL CREDIT MODAL */}
      {isAddCreditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>➕</span> Register New Student Credit
              </h3>
              <button
                onClick={() => setIsAddCreditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewCredit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Student Full Name *</label>
                <input
                  type="text"
                  value={newCreditForm.student_name}
                  onChange={(e) => setNewCreditForm(prev => ({ ...prev, student_name: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                  placeholder="e.g. Ibrahim Mansoor"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Student Email *</label>
                <input
                  type="email"
                  value={newCreditForm.email}
                  onChange={(e) => setNewCreditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                  placeholder="ibrahim@example.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Deposit Amount ($)</label>
                  <input
                    type="number"
                    value={newCreditForm.deposit_amount}
                    onChange={(e) => setNewCreditForm(prev => ({ ...prev, deposit_amount: Number(e.target.value) }))}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-bold"
                    min={1}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Booking Ref (Opt)</label>
                  <input
                    type="text"
                    value={newCreditForm.booking_reference}
                    onChange={(e) => setNewCreditForm(prev => ({ ...prev, booking_reference: e.target.value }))}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                    placeholder="BK-105"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Administrative Notes</label>
                <textarea
                  value={newCreditForm.notes}
                  onChange={(e) => setNewCreditForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                  placeholder="Security deposit origin notes..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition-all"
                >
                  Save Credit Record
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddCreditModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsCreditsView;
