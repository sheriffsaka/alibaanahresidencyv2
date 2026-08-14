import React, { useState } from 'react';
import { Room } from '../../types';

interface MaintenanceTicket {
  id: number;
  ticket_number: string;
  room_number: string;
  category: 'Air Conditioning' | 'Plumbing' | 'Electrical' | 'Furniture' | 'Wi-Fi / Internet' | 'General';
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  reported_by: string;
  reported_at: string;
  assigned_to?: string;
  cost?: number;
}

const INITIAL_TICKETS: MaintenanceTicket[] = [
  {
    id: 1,
    ticket_number: 'MT-101',
    room_number: '101',
    category: 'Air Conditioning',
    title: 'AC unit blowing warm air in Bedroom A',
    description: 'Student reported the split unit is not cooling adequately during afternoon hours.',
    priority: 'High',
    status: 'In Progress',
    reported_by: 'Ali Mansour',
    reported_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    assigned_to: 'Tariq (HVAC Technician)'
  },
  {
    id: 2,
    ticket_number: 'MT-102',
    room_number: '102',
    category: 'Plumbing',
    title: 'Minor faucet drip in master bathroom',
    description: 'Water tap washer needs replacement.',
    priority: 'Low',
    status: 'Open',
    reported_by: 'Zayd Al-Otaibi',
    reported_at: new Date(Date.now() - 2 * 86400000).toISOString()
  }
];

interface MaintenanceViewProps {
  rooms: Room[];
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ rooms = [] }) => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(INITIAL_TICKETS);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'In Progress' | 'Resolved'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    room_number: rooms[0]?.room_number || '101',
    category: 'Air Conditioning' as MaintenanceTicket['category'],
    title: '',
    description: '',
    priority: 'Medium' as MaintenanceTicket['priority'],
    reported_by: 'Staff Inspection',
    assigned_to: ''
  });

  const filteredTickets = tickets.filter(ticket => {
    if (statusFilter !== 'All' && ticket.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ticket.ticket_number.toLowerCase().includes(q) ||
        ticket.room_number.toLowerCase().includes(q) ||
        ticket.title.toLowerCase().includes(q) ||
        ticket.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.title) return;

    const created: MaintenanceTicket = {
      id: Date.now(),
      ticket_number: `MT-${Math.floor(100 + Math.random() * 900)}`,
      room_number: newTicket.room_number,
      category: newTicket.category,
      title: newTicket.title,
      description: newTicket.description,
      priority: newTicket.priority,
      status: 'Open',
      reported_by: newTicket.reported_by || 'Admin',
      reported_at: new Date().toISOString(),
      assigned_to: newTicket.assigned_to
    };

    setTickets(prev => [created, ...prev]);
    setIsCreateModalOpen(false);
    setNewTicket({
      room_number: rooms[0]?.room_number || '101',
      category: 'Air Conditioning',
      title: '',
      description: '',
      priority: 'Medium',
      reported_by: 'Staff Inspection',
      assigned_to: ''
    });
  };

  const handleUpdateStatus = (id: number, status: MaintenanceTicket['status']) => {
    setTickets(prev =>
      prev.map(t => (t.id === id ? { ...t, status } : t))
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Tickets</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{tickets.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Open Tickets</p>
          <p className="text-2xl font-black text-red-600 mt-1">
            {tickets.filter(t => t.status === 'Open').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">In Progress</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {tickets.filter(t => t.status === 'In Progress').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Resolved</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {tickets.filter(t => t.status === 'Resolved').length}
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              🛠️ Maintenance & Facilities Tickets
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage room repairs, HVAC servicing, plumbing, and general facility work orders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search ticket, room, issue..."
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
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all whitespace-nowrap"
            >
              + Create Ticket
            </button>
          </div>
        </div>

        {/* Tickets Table / List */}
        {filteredTickets.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <span className="text-4xl block">✨</span>
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No Maintenance Tickets</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              All residency facilities are currently operating normally. New repair or servicing requests will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Ticket</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Room & Issue</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Reported By</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                      {ticket.ticket_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          Room {ticket.room_number}
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{ticket.title}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{ticket.description}</p>
                      <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                        Category: {ticket.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ticket.priority === 'Urgent' || ticket.priority === 'High'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                            : ticket.priority === 'Medium'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300">
                      <p className="font-semibold">{ticket.reported_by}</p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {new Date(ticket.reported_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          ticket.status === 'Open'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                            : ticket.status === 'In Progress'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="flex gap-2">
                        {ticket.status === 'Open' && (
                          <button
                            onClick={() => handleUpdateStatus(ticket.id, 'In Progress')}
                            className="bg-amber-50 text-amber-700 hover:bg-amber-100 px-2.5 py-1 rounded-lg font-bold text-xs"
                          >
                            Start Work
                          </button>
                        )}
                        {ticket.status === 'In Progress' && (
                          <button
                            onClick={() => handleUpdateStatus(ticket.id, 'Resolved')}
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-bold text-xs"
                          >
                            Resolve
                          </button>
                        )}
                        {ticket.status === 'Resolved' && (
                          <span className="text-emerald-600 font-bold text-xs">✓ Complete</span>
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

      {/* Create Ticket Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create Maintenance Work Order</h3>
            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Room Number</label>
                  <select
                    value={newTicket.room_number}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, room_number: e.target.value }))}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                  >
                    {rooms.length > 0 ? (
                      rooms.map(r => (
                        <option key={r.id} value={r.room_number}>Room {r.room_number} ({r.category})</option>
                      ))
                    ) : (
                      <>
                        <option value="101">Room 101</option>
                        <option value="102">Room 102</option>
                        <option value="103">Room 103</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="Air Conditioning">Air Conditioning</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Wi-Fi / Internet">Wi-Fi / Internet</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Issue Summary</label>
                <input
                  type="text"
                  required
                  value={newTicket.title}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g. Broken study desk chair"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Detailed Description</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Describe location in room, symptoms, or urgent considerations..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assign Technician (Optional)</label>
                  <input
                    type="text"
                    value={newTicket.assigned_to}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, assigned_to: e.target.value }))}
                    className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                    placeholder="e.g. Tariq (HVAC)"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceView;
