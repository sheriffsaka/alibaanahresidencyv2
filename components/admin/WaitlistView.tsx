import React, { useState } from 'react';
import { Room } from '../../types';

interface WaitlistEntry {
  id: number;
  student_name: string;
  email: string;
  phone: string;
  room_category: string;
  preferred_type: 'Shared' | 'Private';
  desired_term: string;
  registered_at: string;
  status: 'Waiting' | 'Offered' | 'Fulfilled' | 'Expired';
  notes?: string;
}

const INITIAL_WAITLIST: WaitlistEntry[] = [
  {
    id: 1,
    student_name: 'Yusuf Ahmed',
    email: 'yusuf.ahmed@example.com',
    phone: '+20 102 345 6789',
    room_category: 'Premium 1',
    preferred_type: 'Private',
    desired_term: 'Autumn Term 2026',
    registered_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: 'Waiting',
    notes: 'Interested in Apartment 1 Private room immediately upon vacancy'
  },
  {
    id: 2,
    student_name: 'Fatima Al-Mansoor',
    email: 'fatima.mansoor@example.com',
    phone: '+971 50 123 4567',
    room_category: 'Premium 2',
    preferred_type: 'Shared',
    desired_term: 'Autumn Term 2026',
    registered_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    status: 'Waiting',
    notes: 'Requires female section'
  }
];

interface WaitlistViewProps {
  rooms: Room[];
}

export const WaitlistView: React.FC<WaitlistViewProps> = ({ rooms = [] }) => {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(INITIAL_WAITLIST);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Waiting' | 'Offered' | 'Fulfilled'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    student_name: '',
    email: '',
    phone: '',
    room_category: 'Premium 1',
    preferred_type: 'Private' as 'Shared' | 'Private',
    desired_term: 'Autumn Term 2026',
    notes: ''
  });

  const filteredWaitlist = waitlist.filter(item => {
    if (statusFilter !== 'All' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.student_name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.room_category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.student_name || !newEntry.email) {
      alert('Please fill out student name and email');
      return;
    }

    const created: WaitlistEntry = {
      id: Date.now(),
      ...newEntry,
      registered_at: new Date().toISOString(),
      status: 'Waiting'
    };

    setWaitlist(prev => [created, ...prev]);
    setIsAddModalOpen(false);
    setNewEntry({
      student_name: '',
      email: '',
      phone: '',
      room_category: 'Premium 1',
      preferred_type: 'Private',
      desired_term: 'Autumn Term 2026',
      notes: ''
    });
  };

  const handleUpdateStatus = (id: number, status: WaitlistEntry['status']) => {
    setWaitlist(prev =>
      prev.map(item => (item.id === id ? { ...item, status } : item))
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Waitlist Requests</p>
          <p className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-1">
            {waitlist.filter(w => w.status === 'Waiting').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Offered Placements</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {waitlist.filter(w => w.status === 'Offered').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Fulfilled Placements</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {waitlist.filter(w => w.status === 'Fulfilled').length}
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              ⏳ Student Residency Waitlist
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Track student demand for currently full or in-demand rooms and notify them as soon as a bed frees up.
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
              Students who express interest in occupied rooms or future academic terms will appear here for staff assignment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Requested Category</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Desired Term</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredWaitlist.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{item.student_name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        Logged: {new Date(item.registered_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300">
                      <p>{item.email}</p>
                      <p className="text-gray-400 font-mono mt-0.5">{item.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-brand-600 dark:text-brand-400 block">
                        {item.room_category} ({item.preferred_type})
                      </span>
                      {item.notes && <p className="text-[10px] text-gray-400 mt-0.5 italic">{item.notes}</p>}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-700 dark:text-gray-300">
                      {item.desired_term}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          item.status === 'Waiting'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                            : item.status === 'Offered'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="flex gap-2">
                        {item.status === 'Waiting' && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'Offered')}
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-bold text-xs"
                          >
                            Offer Room
                          </button>
                        )}
                        {item.status === 'Offered' && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'Fulfilled')}
                            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-bold text-xs"
                          >
                            Mark Fulfilled
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add to Waitlist Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Student to Waitlist</h3>
            <form onSubmit={handleAddWaitlist} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={newEntry.student_name}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, student_name: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g. Abdullah Khan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newEntry.email}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                    placeholder="student@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={newEntry.phone}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                    placeholder="+20 ..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                  <select
                    value={newEntry.room_category}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, room_category: e.target.value }))}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="Premium 1">Premium 1</option>
                    <option value="Premium 2">Premium 2</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                  <select
                    value={newEntry.preferred_type}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, preferred_type: e.target.value as any }))}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="Private">Private</option>
                    <option value="Shared">Shared</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes / Preferences</label>
                <textarea
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
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
    </div>
  );
};

export default WaitlistView;
