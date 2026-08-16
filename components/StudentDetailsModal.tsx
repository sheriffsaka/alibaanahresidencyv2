import React from 'react';
import { useApp } from '../hooks/useApp';
import { User, BookingStatus } from '../types';
import { IconClose } from './Icon';
import BookingStatusBadge from './BookingStatusBadge';
import { getDisplayFromRoom, getAccommodationAddress } from '../lib/roomNaming';

interface StudentDetailsModalProps {
  student: User | null;
  isOpen: boolean;
  onClose: () => void;
  onViewPaymentProof?: (proofUrl: string) => void;
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  student,
  isOpen,
  onClose,
  onViewPaymentProof
}) => {
  const { bookings, accommodationAddresses } = useApp();

  if (!isOpen || !student) return null;

  // Fetch all bookings for this student
  const studentBookings = bookings.filter(b => b.student_id === student.id || b.email?.toLowerCase() === student.email?.toLowerCase());

  // Determine current active booking
  const activeBooking = studentBookings.find(b => 
    b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.COMPLETED
  ) || studentBookings[0];

  const primaryPhone = activeBooking?.phone_number || 'N/A';
  const nationality = activeBooking?.nationality || 'International';
  const passportNumber = activeBooking?.passport_number || 'N/A';
  const emergencyContact = activeBooking?.emergency_contact_details || 'N/A';
  const addressInEgypt = activeBooking?.address_in_egypt || getAccommodationAddress(activeBooking?.preferred_accommodation, accommodationAddresses);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 flex items-center justify-center text-lg font-bold">
              {(student.full_name || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {student.full_name || 'Student Profile'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Registered Student ID: <span className="font-mono">{student.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-1 space-y-6 my-4">
          {/* Section 1: Personal & Registration Information */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/60">
            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-3">
              Personal & Registration Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">Full Name</span>
                <span className="font-semibold text-gray-900 dark:text-white">{student.full_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">Email Address</span>
                <span className="font-semibold text-gray-900 dark:text-white">{student.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">Phone / WhatsApp</span>
                <span className="font-semibold text-gray-900 dark:text-white">{primaryPhone}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">Gender</span>
                <span className="font-semibold text-gray-900 dark:text-white">{student.gender || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">Nationality</span>
                <span className="font-semibold text-gray-900 dark:text-white">{nationality}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">Passport Number</span>
                <span className="font-semibold text-gray-900 dark:text-white">{passportNumber}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-500 dark:text-gray-400 block">Emergency Contact</span>
                <span className="font-semibold text-gray-900 dark:text-white">{emergencyContact}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">Total Bookings</span>
                <span className="font-semibold text-brand-600 dark:text-brand-400">{studentBookings.length} Record(s)</span>
              </div>
            </div>
          </div>

          {/* Section 2: Current Accommodation & Room Assignment */}
          <div>
            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-3">
              Current Accommodation & Room Assignment
            </h3>
            {activeBooking ? (
              <div className="p-4 rounded-xl border border-brand-200 dark:border-brand-800/60 bg-brand-50/50 dark:bg-brand-900/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-brand-900 dark:text-brand-200">
                      {getDisplayFromRoom(activeBooking.rooms) || activeBooking.preferred_accommodation || 'Assigned Accommodation'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {addressInEgypt}
                    </p>
                  </div>
                  <BookingStatusBadge status={activeBooking.status} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-brand-200/60 dark:border-brand-800/40">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block">Arrival Date</span>
                    <span className="font-medium text-gray-900 dark:text-white">{activeBooking.expected_arrival_date || activeBooking.start_date || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block">Expiry Date</span>
                    <span className="font-medium text-gray-900 dark:text-white">{activeBooking.payment_expiry_date || activeBooking.end_date || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block">Duration</span>
                    <span className="font-medium text-gray-900 dark:text-white">{activeBooking.duration_of_stay || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block">Total Price</span>
                    <span className="font-bold text-brand-700 dark:text-brand-300">${activeBooking.total_price || 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-center text-xs text-gray-500 dark:text-gray-400">
                No active room assigned yet.
              </div>
            )}
          </div>

          {/* Section 3: Booking History */}
          <div>
            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-3">
              Booking History ({studentBookings.length})
            </h3>
            {studentBookings.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
                  <thead className="bg-gray-50 dark:bg-gray-750 uppercase text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="p-3">Booking ID</th>
                      <th className="p-3">Room / Accommodation</th>
                      <th className="p-3">Dates</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {studentBookings.map(b => (
                      <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                        <td className="p-3 font-mono text-gray-900 dark:text-white">BK{b.id}</td>
                        <td className="p-3 font-medium text-gray-900 dark:text-white">
                          {getDisplayFromRoom(b.rooms) || b.preferred_accommodation}
                        </td>
                        <td className="p-3">
                          {b.expected_arrival_date || b.start_date} → {b.payment_expiry_date || b.end_date}
                        </td>
                        <td className="p-3">
                          <BookingStatusBadge status={b.status} />
                        </td>
                        <td className="p-3 font-semibold text-gray-900 dark:text-white">${b.total_price || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">No booking history recorded.</p>
            )}
          </div>

          {/* Section 4: Transactions & Payment Proofs */}
          <div>
            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-3">
              Transaction & Payment History
            </h3>
            {studentBookings.length > 0 ? (
              <div className="space-y-2">
                {studentBookings.map(b => (
                  <div key={b.id} className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono text-gray-500 dark:text-gray-400 mr-2">BK{b.id}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">Security Deposit + Rent</span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {new Date(b.booked_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900 dark:text-white">${b.total_price || 0}</span>
                      {b.transfer_proof_url && onViewPaymentProof && (
                        <button
                          onClick={() => onViewPaymentProof(b.transfer_proof_url!)}
                          className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 text-[11px] font-medium hover:bg-brand-100 transition"
                        >
                          View Receipt
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">No transactions found.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal;
