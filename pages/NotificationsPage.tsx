import React from 'react';
import { useApp } from '../hooks/useApp';
import { IconBell, IconCalendar, IconFile, IconCheckCircle, IconInfo } from '../components/Icon';
import { BookingStatus } from '../types';

const NotificationsPage: React.FC = () => {
  const { user, bookings, setPage } = useApp();

  const userBookings = (bookings || []).filter(b => b.student_id === user?.id);

  // Generate automated smart notifications based on user bookings
  const notifications: Array<{
    id: string;
    title: string;
    description: string;
    type: 'arrival' | 'rent' | 'contract' | 'system';
    date: string;
    actionLabel?: string;
    onAction?: () => void;
  }> = [];

  userBookings.forEach(booking => {
    // Contract signature notice
    if (booking.status === BookingStatus.PENDING_CONTRACT) {
      notifications.push({
        id: `contract-${booking.id}`,
        title: `Signature Required for Booking BK${booking.id}`,
        description: `Please execute your Al-Ibaanah Student Tenancy Agreement online to lock in your room reservation.`,
        type: 'contract',
        date: 'Action Required',
        actionLabel: 'Sign Agreement',
        onAction: () => setPage('my-bookings')
      });
    }

    // Payment proof notice
    if (booking.status === BookingStatus.PENDING_PAYMENT) {
      notifications.push({
        id: `payment-${booking.id}`,
        title: `Payment Proof Needed for BK${booking.id}`,
        description: `Please upload your bank transfer receipt or payment confirmation to finalize verification.`,
        type: 'rent',
        date: 'Action Required',
        actionLabel: 'Upload Proof',
        onAction: () => setPage('my-bookings')
      });
    }

    // Arrival reminder
    if (booking.start_date) {
      notifications.push({
        id: `arrival-${booking.id}`,
        title: `Check-In & Arrival Preparation for BK${booking.id}`,
        description: `Scheduled check-in date: ${new Date(booking.start_date).toLocaleDateString()}. Please notify the residency team 24 hours in advance with your arrival flight or ETA.`,
        type: 'arrival',
        date: new Date(booking.start_date).toLocaleDateString(),
        actionLabel: 'View Documents',
        onAction: () => setPage('documents')
      });
    }

    // Rent expiry reminder
    if (booking.payment_expiry_date) {
      notifications.push({
        id: `rent-exp-${booking.id}`,
        title: `Upcoming Rent Schedule for Room ${booking.rooms?.room_number || ''}`,
        description: `Your rental period schedule cycle renews around ${new Date(booking.payment_expiry_date).toLocaleDateString()}. You can review your invoice or request an extension anytime.`,
        type: 'rent',
        date: new Date(booking.payment_expiry_date).toLocaleDateString(),
        actionLabel: 'View Invoices',
        onAction: () => setPage('my-bookings')
      });
    }
  });

  // Welcome default notification if empty
  if (notifications.length === 0) {
    notifications.push({
      id: 'welcome-notification',
      title: 'Welcome to Al-Ibaanah Student Portal',
      description: 'Your notifications feed will keep you updated with booking statuses, tenancy signatures, arrival reminders, and rent receipts.',
      type: 'system',
      date: 'Active',
      actionLabel: 'Explore Rooms',
      onAction: () => setPage('booking')
    });
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 text-xs font-black uppercase tracking-widest mb-1">
          <IconBell className="w-4 h-4" /> Notification Center
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Notifications & Alerts</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Stay informed about your booking confirmations, arrival logistics, rent payment schedules, and residency announcements.
        </p>
      </div>

      <div className="space-y-4">
        {notifications.map(n => (
          <div
            key={n.id}
            className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-gray-200 dark:hover:border-gray-600"
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl flex-shrink-0 ${
                n.type === 'contract' 
                  ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/30'
                  : n.type === 'rent' 
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30'
                  : n.type === 'arrival' 
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30'
                  : 'bg-brand-50 text-brand-600 dark:bg-brand-900/30'
              }`}>
                {n.type === 'contract' ? <IconFile className="w-5 h-5" /> :
                 n.type === 'rent' ? <IconCalendar className="w-5 h-5" /> :
                 n.type === 'arrival' ? <IconCheckCircle className="w-5 h-5" /> :
                 <IconBell className="w-5 h-5" />}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">{n.title}</h3>
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">
                    {n.date}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                  {n.description}
                </p>
              </div>
            </div>

            {n.actionLabel && (
              <div className="flex-shrink-0 self-end sm:self-center">
                <button
                  onClick={n.onAction}
                  className="px-4 py-2 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 font-bold text-xs rounded-xl transition-colors whitespace-nowrap"
                >
                  {n.actionLabel}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
