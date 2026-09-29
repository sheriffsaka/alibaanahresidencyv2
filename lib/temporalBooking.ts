// lib/temporalBooking.ts
// Temporal Reservation and Occupancy Evaluation Logic
// Single source of truth for dynamic booking states and date-range rules

import { Booking, BookingStatus } from '../types';

export const NON_RESERVING_STATUSES = ['Cancelled', 'Completed', 'Maintenance'];

/**
 * Checks if two half-open date ranges [startA, endA) and [startB, endB) overlap.
 * Back-to-back stays where endA === startB do NOT overlap.
 */
export function isDateRangeOverlapping(
  startA?: string | null,
  endA?: string | null,
  startB?: string | null,
  endB?: string | null
): boolean {
  if (!startA || !endA || !startB || !endB) return false;
  const sA = String(startA).split('T')[0];
  const eA = String(endA).split('T')[0];
  const sB = String(startB).split('T')[0];
  const eB = String(endB).split('T')[0];
  // Half-open interval overlap formula: [sA, eA) overlaps [sB, eB) iff sA < eB && sB < eA
  return sA < eB && sB < eA;
}

/**
 * Returns the effective display and operational status of a booking for a given reference date.
 * - Future approved bookings display as RESERVED before their arrival date.
 * - On and after arrival date (up to end date), they become ACTIVE / OCCUPIED automatically.
 * - After their end date, they become COMPLETED.
 */
export function getEffectiveBookingStatus(
  status: BookingStatus | string,
  startDate?: string | null,
  endDate?: string | null,
  referenceDate?: string
): BookingStatus {
  const refDate = (referenceDate || new Date().toISOString().split('T')[0]).split('T')[0];
  
  const isApproved = 
    status === BookingStatus.CONFIRMED || 
    status === BookingStatus.OCCUPIED || 
    status === BookingStatus.RESERVED ||
    status === 'Confirmed' || 
    status === 'Occupied' || 
    status === 'Reserved';

  if (!isApproved) {
    return status as BookingStatus;
  }

  const sDate = startDate ? String(startDate).split('T')[0] : '';
  const eDate = endDate ? String(endDate).split('T')[0] : '2099-12-31';

  // Future reservation: before start date
  if (sDate && sDate > refDate) {
    return BookingStatus.RESERVED;
  }

  // Active occupancy: on or after arrival date, up to end date
  if (sDate && sDate <= refDate && eDate >= refDate) {
    return BookingStatus.OCCUPIED;
  }

  // Past tenancy: after end date
  if (eDate && eDate < refDate) {
    return BookingStatus.COMPLETED;
  }

  return BookingStatus.CONFIRMED;
}

/**
 * Determines whether a booking counts towards active physical occupancy on a given reference date.
 * Future reservations do NOT count as current occupancy.
 */
export function isBookingActiveOnDate(
  booking: { status: BookingStatus | string; start_date?: string | null; end_date?: string | null; expected_arrival_date?: string | null; payment_expiry_date?: string | null },
  referenceDate?: string
): boolean {
  const refDate = (referenceDate || new Date().toISOString().split('T')[0]).split('T')[0];
  const isApproved = 
    booking.status === BookingStatus.CONFIRMED || 
    booking.status === BookingStatus.OCCUPIED || 
    booking.status === BookingStatus.RESERVED ||
    (booking.status as string) === 'Confirmed' || 
    (booking.status as string) === 'Occupied' || 
    (booking.status as string) === 'Reserved';

  if (!isApproved) return false;

  const sDate = (booking.start_date || booking.expected_arrival_date || '').split('T')[0];
  const eDate = (booking.end_date || booking.payment_expiry_date || '2099-12-31').split('T')[0];

  if (!sDate) return false;
  return sDate <= refDate && eDate >= refDate;
}

/**
 * Determines whether a booking is an upcoming future reservation relative to a reference date.
 */
export function isBookingUpcomingReservation(
  booking: { status: BookingStatus | string; start_date?: string | null; expected_arrival_date?: string | null },
  referenceDate?: string
): boolean {
  const refDate = (referenceDate || new Date().toISOString().split('T')[0]).split('T')[0];
  const isApproved = 
    booking.status === BookingStatus.CONFIRMED || 
    booking.status === BookingStatus.OCCUPIED || 
    booking.status === BookingStatus.RESERVED ||
    (booking.status as string) === 'Confirmed' || 
    (booking.status as string) === 'Occupied' || 
    (booking.status as string) === 'Reserved';

  if (!isApproved) return false;

  const sDate = (booking.start_date || booking.expected_arrival_date || '').split('T')[0];
  return Boolean(sDate && sDate > refDate);
}

/**
 * Formats duration of stay into a readable label (e.g., '5 months' or '90 days').
 */
export function formatBookingDuration(
  booking: { duration_of_stay?: string | null; start_date?: string | null; end_date?: string | null; expected_arrival_date?: string | null; payment_expiry_date?: string | null }
): string {
  if (booking.duration_of_stay && booking.duration_of_stay.trim()) {
    return booking.duration_of_stay;
  }
  const s = (booking.start_date || booking.expected_arrival_date || '').split('T')[0];
  const e = (booking.end_date || booking.payment_expiry_date || '').split('T')[0];
  if (!s || !e) return 'Flexible';
  const start = new Date(s);
  const end = new Date(e);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Flexible';
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return '0 days';
  const months = Math.round(diffDays / 30);
  if (months >= 1) {
    return `${months} month${months > 1 ? 's' : ''} (${diffDays} days)`;
  }
  return `${diffDays} days`;
}

/**
 * Returns human-readable payment status for a booking.
 */
export function getBookingPaymentStatus(
  booking: { status: BookingStatus | string; payment_proof_url?: string | null; total_price?: number | null }
): { label: string; isPaid: boolean; hasReceipt: boolean } {
  const isApproved =
    booking.status === BookingStatus.CONFIRMED ||
    booking.status === BookingStatus.OCCUPIED ||
    booking.status === BookingStatus.RESERVED ||
    (booking.status as string) === 'Confirmed' ||
    (booking.status as string) === 'Occupied' ||
    (booking.status as string) === 'Reserved';

  const hasReceipt = Boolean(booking.payment_proof_url && booking.payment_proof_url.trim().length > 0);

  if (isApproved) {
    return {
      label: 'Verified & Paid',
      isPaid: true,
      hasReceipt
    };
  }

  if (booking.status === BookingStatus.PENDING_VERIFICATION || (booking.status as string) === 'Pending Verification') {
    return {
      label: hasReceipt ? 'Proof Uploaded (Pending Review)' : 'Pending Verification',
      isPaid: false,
      hasReceipt
    };
  }

  if (booking.status === BookingStatus.PENDING_PAYMENT || (booking.status as string) === 'Pending Payment') {
    return {
      label: 'Awaiting Payment',
      isPaid: false,
      hasReceipt: false
    };
  }

  if (booking.status === BookingStatus.CANCELLED || (booking.status as string) === 'Cancelled') {
    return {
      label: 'Cancelled / Rejected',
      isPaid: false,
      hasReceipt
    };
  }

  return {
    label: String(booking.status),
    isPaid: false,
    hasReceipt
  };
}
