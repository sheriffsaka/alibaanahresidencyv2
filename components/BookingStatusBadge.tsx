
import React from 'react';
import { BookingStatus } from '../types';

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({ status }) => {
  // Fix: Added missing 'Reserved', 'Maintenance', and 'Pending Verification' statuses to the style map.
  const statusStyles: { [key in BookingStatus]: string } = {
    [BookingStatus.RESERVED]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    [BookingStatus.PENDING_PAYMENT]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    [BookingStatus.CONFIRMED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [BookingStatus.OCCUPIED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    [BookingStatus.COMPLETED]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    [BookingStatus.CANCELLED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    [BookingStatus.MAINTENANCE]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    [BookingStatus.PENDING_VERIFICATION]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  };

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status]}`}>
      {status}
    </span>
  );
};

export default BookingStatusBadge;
