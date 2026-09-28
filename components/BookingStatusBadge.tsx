
import React from 'react';
import { BookingStatus } from '../types';
import { getEffectiveBookingStatus } from '../lib/temporalBooking';

interface BookingStatusBadgeProps {
  status: BookingStatus | string;
  startDate?: string | null;
  endDate?: string | null;
}

const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({ status, startDate, endDate }) => {
  const effectiveStatus = getEffectiveBookingStatus(status, startDate, endDate);

  const statusStyles: { [key in BookingStatus]: string } = {
    [BookingStatus.RESERVED]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
    [BookingStatus.PENDING_PAYMENT]: 'bg-accent-100 text-accent-800 dark:bg-accent-900 dark:text-accent-300',
    [BookingStatus.CONFIRMED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [BookingStatus.OCCUPIED]: 'bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-300',
    [BookingStatus.COMPLETED]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    [BookingStatus.CANCELLED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    [BookingStatus.MAINTENANCE]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    [BookingStatus.PENDING_VERIFICATION]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    [BookingStatus.PENDING_CONTRACT]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  };

  // Custom labels for specific statuses if needed
  const statusLabels: Partial<{ [key in BookingStatus]: string }> = {
    [BookingStatus.RESERVED]: 'Reserved',
    [BookingStatus.OCCUPIED]: 'Occupied (Active)',
    [BookingStatus.CONFIRMED]: 'Confirmed',
    [BookingStatus.PENDING_CONTRACT]: 'Pending Contract',
  };

  return (
    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full ${statusStyles[effectiveStatus] || statusStyles[BookingStatus.CONFIRMED]}`}>
      {statusLabels[effectiveStatus] || effectiveStatus}
    </span>
  );
};

export default BookingStatusBadge;
