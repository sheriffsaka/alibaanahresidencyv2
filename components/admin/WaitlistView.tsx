import React, { useState } from 'react';
import { Room, WaitlistEntry, WaitlistStatus } from '../../types';
import { useApp } from '../../hooks/useApp';
import { sendEmail } from '../../lib/email';
import { IconCheckCircle, IconClose, IconInfo } from '../Icon';

interface WaitlistViewProps {
  rooms?: Room[];
}

export const WaitlistView: React.FC<WaitlistViewProps> = ({ rooms = [] }) => {
  const { waitlist, addToWaitlist, updateWaitlistStatus, students } = useApp();
  
  const [statusFilter, setStatusFilter] = useState<'All' | WaitlistStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notifyingEntry, setNotifyingEntry] = useState<WaitlistEntry | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  const [newEntry, setNewEntry] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    category: 'Premium 1' as 'Standard' | 'Premium 1' | 'Premium 2',
    accommodation_type: 'Private' as 'Shared' | 'Private',
    desired_term: 'Autumn Term 2026',
    duration_months: 6,
    notes: ''
  });

  // Helper to extract student contact details
  const getStudentInfo = (item: WaitlistEntry) => {
    if (item.student_id) {
      const studentProfile = item.profiles || students.find(s => s.id === item.student_id);
      return {
        name: studentProfile?.full_name || 'Registered Student',
        email: studentProfile?.email || 'N/A',
        phone: studentProfile?.phone_number || 'N/A',
        isRegistered: true,
      };
    }
    return {
      name: item.full_name || 'Guest Applicant',
      email: item.email || 'N/A',
      phone: item.phone_number || 'N/A',
      isRegistered: false,
    };
  };

  const filteredWaitlist = (waitlist || []).filter(item => {
    if (statusFilter !== 'All' && item.status !== statusFilter) return false;
    const info = getStudentInfo(item);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        info.name.toLowerCase().includes(q) ||
        info.email.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.desired_term && item.desired_term.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleAddWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.full_name || !newEntry.email) {
      alert('Please fill out student full name and email');
      return;
    }

    const res = await addToWaitlist({
      student_id: null,
      full_name: newEntry.full_name.trim(),
      email: newEntry.email.trim().toLowerCase(),
      phone_number: newEntry.phone_number.trim() || null,
      category: newEntry.category,
      accommodation_type: newEntry.accommodation_type,
      desired_term: newEntry.desired_term,
      duration_months: newEntry.duration_months,
      notes: newEntry.notes.trim() || null,
      status: 'Waiting',
    });

    if (res.success) {
      setIsAddModalOpen(false);
      setNewEntry({
        full_name: '',
        email: '',
        phone_number: '',
        category: 'Premium 1',
        accommodation_type: 'Private',
        desired_term: 'Autumn Term 2026',
        duration_months: 6,
        notes: ''
      });
    } else {
      alert(res.error || 'Failed to add student to waitlist');
    }
  };

  const handleOpenNotifyModal = (item: WaitlistEntry) => {
    const info = getStudentInfo(item);
    setNotifyingEntry(item);
    setEmailSentSuccess(false);
    setEmailSubject(`Accommodation Vacancy Update: ${item.category} (${item.accommodation_type})`);
    setEmailBody(
      `Dear ${info.name},\n\nWe are pleased to inform you that a residency bed space matching your waitlist preference (${item.category} - ${item.accommodation_type}) is now becoming available for ${item.desired_term || 'the upcoming academic term'}.\n\nPlease reply directly to this notification or contact our administration office within 48 hours to confirm your placement and finalize your booking agreement.\n\nBest regards,\nAl-Ibaanah Student Residency Management`
    );
  };

  const handleSendNotification = async () => {
    if (!notifyingEntry) return;
    const info = getStudentInfo(notifyingEntry);
    setIsSendingEmail(true);
    try {
      const result = await sendEmail({
        to: info.email,
        subject: emailSubject,
        body: emailBody,
        templateName: 'waitlist_offer',
        metadata: { 
          waitlist_id: notifyingEntry.id, 
          category: notifyingEntry.category,
          accommodation_type: notifyingEntry.accommodation_type,
          student_id: notifyingEntry.student_id
        }
      });
      if (!result.success) {
        alert('Failed to dispatch notification: ' + (result.error || 'Delivery failure'));
        return;
      }
      setEmailSentSuccess(true);
      // Automatically advance status to 'Offered' only upon verified dispatch
      if (notifyingEntry.status === 'Waiting') {
        await updateWaitlistStatus(notifyingEntry.id, 'Offered');
      }
    } catch (err: any) {
      alert('Failed to dispatch notification: ' + err.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-start">
      {/* Header & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active In Queue</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {waitlist.filter(w => w.status === 'Waiting').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Placements Offered</p>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {waitlist.filter(w => w.status === 'Offered').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Fulfilled Bookings</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {waitlist.filter(w => w.status === 'Fulfilled').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cancelled / Expired</p>
          <p className="text-2xl font-black text-gray-400 mt-1">
            {waitlist.filter(w => w.status === 'Cancelled').length}
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>⏳</span> Student Residency Waitlist
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Live waitlist requests from students interested in fully booked rooms or upcoming intakes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search student or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 text-xs border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium flex-1 md:w-56"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-bold border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="All">All Statuses</option>
              <option value="Waiting">Waiting</option>
              <option value="Offered">Offered</option>
              <option value="Fulfilled">Fulfilled</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all whitespace-nowrap"
            >
              + Add to Waitlist
            </button>
          </div>
        </div>

        {/* Table / Empty State */}
        {filteredWaitlist.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <span className="text-4xl block">📋</span>
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No Waitlist Entries Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Students who join the waitlist from the booking wizard or student dashboard will automatically populate here in real-time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Requested Space</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Term & Duration</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredWaitlist.map((item) => {
                  const info = getStudentInfo(item);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-sm text-gray-900 dark:text-white">{info.name}</p>
                          {info.isRegistered && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 font-bold">
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                          Registered: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300">
                        <p>{info.email}</p>
                        <p className="text-gray-400 font-mono mt-0.5">{info.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-brand-600 dark:text-brand-400 block">
                          {item.category} ({item.accommodation_type})
                        </span>
                        {item.notes && <p className="text-[10px] text-gray-400 mt-0.5 italic max-w-xs">{item.notes}</p>}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-700 dark:text-gray-300">
                        <p className="font-bold">{item.desired_term || 'Next Available'}</p>
                        <p className="text-gray-400 text-[11px]">{item.duration_months} Months stay</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            item.status === 'Waiting'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                              : item.status === 'Offered'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                              : item.status === 'Fulfilled'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="flex flex-wrap gap-1.5">
                          {item.status === 'Waiting' && (
                            <>
                              <button
                                onClick={() => handleOpenNotifyModal(item)}
                                className="bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300 px-2.5 py-1 rounded-lg font-bold text-xs transition"
                              >
                                Offer Spot & Email
                              </button>
                              <button
                                onClick={() => updateWaitlistStatus(item.id, 'Cancelled')}
                                className="bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-lg font-bold text-xs transition"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {item.status === 'Offered' && (
                            <>
                              <button
                                onClick={() => updateWaitlistStatus(item.id, 'Fulfilled')}
                                className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 px-2.5 py-1 rounded-lg font-bold text-xs transition"
                              >
                                Mark Fulfilled
                              </button>
                              <button
                                onClick={() => updateWaitlistStatus(item.id, 'Waiting')}
                                className="bg-amber-50 text-amber-700 hover:bg-amber-100 px-2.5 py-1 rounded-lg font-bold text-xs transition"
                              >
                                Back to Waiting
                              </button>
                            </>
                          )}
                          {item.status === 'Cancelled' && (
                            <button
                              onClick={() => updateWaitlistStatus(item.id, 'Waiting')}
                              className="bg-brand-50 text-brand-600 hover:bg-brand-100 px-2.5 py-1 rounded-lg font-bold text-xs transition"
                            >
                              Re-activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Add to Waitlist Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Student to Waitlist</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <IconClose className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddWaitlist} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={newEntry.full_name}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder="e.g. Abdullah Khan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newEntry.email}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                    placeholder="student@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp Phone</label>
                  <input
                    type="text"
                    value={newEntry.phone_number}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, phone_number: e.target.value }))}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                    placeholder="+20 ..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                  <select
                    value={newEntry.category}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                  >
                    <option value="Premium 1">Premium 1</option>
                    <option value="Premium 2">Premium 2</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Format Type</label>
                  <select
                    value={newEntry.accommodation_type}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, accommodation_type: e.target.value as any }))}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                  >
                    <option value="Private">Private</option>
                    <option value="Shared">Shared</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Desired Term</label>
                  <input
                    type="text"
                    value={newEntry.desired_term}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, desired_term: e.target.value }))}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                    placeholder="e.g. Autumn Term 2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stay Duration</label>
                  <select
                    value={newEntry.duration_months}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, duration_months: Number(e.target.value) }))}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                  >
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes / Preferences</label>
                <textarea
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder="Special requests or timeline details..."
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700"
                >
                  Save to Waitlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notify Student Email Modal */}
      {notifyingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Offer Placement & Send Email</h3>
                <p className="text-xs text-gray-500">
                  Recipient: {getStudentInfo(notifyingEntry).name} ({getStudentInfo(notifyingEntry).email})
                </p>
              </div>
              <button onClick={() => setNotifyingEntry(null)} className="text-gray-400 hover:text-gray-600">
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            {emailSentSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <IconCheckCircle className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-base text-gray-900 dark:text-white">Email Dispatched!</h4>
                <p className="text-xs text-gray-500">
                  The placement offer notification has been sent. Status has been updated to <strong>Offered</strong>.
                </p>
                <button
                  onClick={() => setNotifyingEntry(null)}
                  className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Message Body</label>
                  <textarea
                    rows={8}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white font-mono leading-relaxed"
                  />
                </div>

                <div className="pt-3 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setNotifyingEntry(null)}
                    disabled={isSendingEmail}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendNotification}
                    disabled={isSendingEmail}
                    className="px-5 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm flex items-center gap-2"
                  >
                    {isSendingEmail ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Send Placement Offer</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitlistView;
