import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { BookingStatus, Booking, User } from '../types';
import { IconClose } from './Icon';
import { ALL_ROOM_SPACES, RoomSpaceConfig, getUnifiedRoomName } from '../lib/roomNaming';

interface AdminCreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const calculateExpiryDate = (arrivalDateStr: string, months: number): string => {
  if (!arrivalDateStr) return '';
  const date = new Date(arrivalDateStr);
  if (isNaN(date.getTime())) return '';
  
  const currentDay = date.getDate();
  date.setMonth(date.getMonth() + months);
  
  if (date.getDate() !== currentDay) {
    date.setDate(0);
  }
  
  return date.toISOString().split('T')[0];
};

export const AdminCreateBookingModal: React.FC<AdminCreateBookingModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { students, rooms, bookings, addBooking } = useApp();

  const [selectedStudentId, setSelectedStudentId] = useState<string>('new');
  
  // Student details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [nationality, setNationality] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Accommodation & dates
  const [selectedCategory, setSelectedCategory] = useState<'Standard' | 'Premium 1' | 'Premium 2'>('Standard');
  const [selectedBedSpaceId, setSelectedBedSpaceId] = useState<string>('');
  const [arrivalDate, setArrivalDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [durationMonths, setDurationMonths] = useState<number>(3);
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>(BookingStatus.CONFIRMED);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // When a registered student is selected, pre-fill student info
  useEffect(() => {
    if (selectedStudentId !== 'new') {
      const student = students.find(s => s.id === selectedStudentId);
      if (student) {
        setFullName(student.full_name || '');
        setEmail(student.email || '');
        if (student.gender) setGender(student.gender);
        
        // Find existing booking for defaults if available
        const existingBooking = bookings.find(b => b.student_id === student.id);
        if (existingBooking) {
          setPhoneNumber(existingBooking.phone_number || '');
          setNationality(existingBooking.nationality || '');
          setPassportNumber(existingBooking.passport_number || '');
          setEmergencyContact(existingBooking.emergency_contact_details || '');
        }
      }
    } else {
      setFullName('');
      setEmail('');
      setPhoneNumber('');
      setNationality('');
      setPassportNumber('');
      setEmergencyContact('');
    }
  }, [selectedStudentId, students, bookings]);

  // Compute available bed spaces for selected category based on current Supabase bookings
  const categoryBedSpaces = ALL_ROOM_SPACES.filter(space => space.category === selectedCategory);

  const bedSpaceAvailability = categoryBedSpaces.map(space => {
    const activeBooking = bookings.find(b => {
      if (b.status === BookingStatus.CANCELLED || b.status === BookingStatus.COMPLETED) return false;
      const bRoomName = b.rooms?.room_number || '';
      const bApt = b.rooms?.apartment_name || b.preferred_accommodation || '';
      
      // Check if this booking occupies this bed space
      return bApt.includes(space.category) && 
             (bRoomName.includes(space.roomName) || b.id.toString() === space.id) &&
             (space.type === 'Private' || bRoomName.toLowerCase().includes(space.bedSpaceName.toLowerCase()) || (b as any).bed_space === space.bedSpaceName);
    });

    return {
      space,
      isOccupied: !!activeBooking,
      occupiedBy: activeBooking ? (activeBooking.full_name || activeBooking.student_name || 'Student') : null
    };
  });

  // Auto select first available bed space when category changes
  useEffect(() => {
    const available = bedSpaceAvailability.find(b => !b.isOccupied);
    if (available) {
      setSelectedBedSpaceId(available.space.id);
    } else {
      setSelectedBedSpaceId('');
    }
  }, [selectedCategory, bookings]);

  if (!isOpen) return null;

  const calculatedExpiryDate = calculateExpiryDate(arrivalDate, durationMonths);
  const monthlyRate = selectedCategory === 'Standard' ? 150 : 175;
  const securityDeposit = 100;
  const totalPrice = (monthlyRate * durationMonths) + securityDeposit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Please enter student full name.');
      return;
    }

    if (!selectedBedSpaceId) {
      setErrorMessage('Please select an available bed space.');
      return;
    }

    const selectedSpaceObj = ALL_ROOM_SPACES.find(s => s.id === selectedBedSpaceId);
    if (!selectedSpaceObj) {
      setErrorMessage('Invalid room selection.');
      return;
    }

    // Find or fallback matching room in Supabase rooms table
    const matchingDbRoom = rooms.find(r => 
      (r.apartment_name?.includes(selectedCategory) || r.category === selectedCategory) &&
      r.room_number?.includes(selectedSpaceObj.roomName)
    ) || rooms[0];

    if (!matchingDbRoom) {
      setErrorMessage('No matching room found in database.');
      return;
    }

    setIsSubmitting(true);

    try {
      const studentId = selectedStudentId !== 'new' ? selectedStudentId : `student_${Date.now()}`;
      
      const newBookingData: Partial<Booking> = {
        student_id: studentId,
        room_id: matchingDbRoom.id,
        full_name: fullName.trim(),
        email: email.trim(),
        phone_number: phoneNumber.trim(),
        gender: gender,
        nationality: nationality.trim() || 'International',
        passport_number: passportNumber.trim() || 'N/A',
        passport_copy_url: '',
        expected_arrival_date: arrivalDate,
        start_date: arrivalDate,
        end_date: calculatedExpiryDate,
        payment_expiry_date: calculatedExpiryDate,
        duration_of_stay: `${durationMonths} month${durationMonths > 1 ? 's' : ''}`,
        preferred_accommodation: selectedCategory as any,
        emergency_contact_details: emergencyContact.trim() || 'N/A',
        status: bookingStatus,
        total_price: totalPrice,
        booked_at: new Date().toISOString(),
        address_in_egypt: matchingDbRoom.apartment_name || selectedCategory
      };

      const result = await addBooking(newBookingData as Booking);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(result.error || 'Failed to create booking.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin: Create Student Booking</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Assign room and bed space directly in Supabase</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Student */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              1. Select Student
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="new">+ Enter New Student Information</option>
              {students.map(st => (
                <option key={st.id} value={st.id}>
                  {st.full_name || 'Student'} {st.email ? `(${st.email})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Student Info Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Full Name as in Passport"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Phone / WhatsApp</label>
              <input
                type="tel"
                placeholder="+20 123 456 789"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nationality</label>
              <input
                type="text"
                placeholder="e.g. Nigerian, Uzbek, French"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Passport Number</label>
              <input
                type="text"
                placeholder="Passport Number"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          {/* Step 2: Accommodation & Available Rooms */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              2. Accommodation Category
            </label>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {(['Standard', 'Premium 1', 'Premium 2'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`p-3 rounded-xl border text-center font-medium text-sm transition ${
                    selectedCategory === cat
                      ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 dark:border-brand-500 font-semibold'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Select Available Bed Space
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
              {bedSpaceAvailability.map(({ space, isOccupied, occupiedBy }) => (
                <button
                  key={space.id}
                  type="button"
                  disabled={isOccupied}
                  onClick={() => setSelectedBedSpaceId(space.id)}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                    selectedBedSpaceId === space.id
                      ? 'border-brand-600 bg-brand-50/80 dark:bg-brand-900/40 text-brand-900 dark:text-white ring-2 ring-brand-500'
                      : isOccupied
                      ? 'border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="pr-2">
                    <p className="text-xs font-semibold">{space.displayName}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {space.type} • {selectedCategory === 'Standard' ? '$150/mo' : '$175/mo'}
                    </p>
                  </div>
                  {isOccupied ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 whitespace-nowrap">
                      Occupied
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 whitespace-nowrap">
                      Available
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Arrival Date & Duration */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              3. Stay Duration & Arrival Date
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Arrival Date *</label>
                <input
                  type="date"
                  required
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Number of Months *</label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value={1}>1 Month</option>
                  <option value={2}>2 Months</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months (1 Year)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Calculated Expiry Date</label>
                <input
                  type="text"
                  readOnly
                  value={calculatedExpiryDate}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm font-semibold cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Step 4: Status & Total Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Booking Status</label>
              <select
                value={bookingStatus}
                onChange={(e) => setBookingStatus(e.target.value as BookingStatus)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value={BookingStatus.CONFIRMED}>Confirmed / Occupied</option>
                <option value={BookingStatus.RESERVED}>Reserved</option>
                <option value={BookingStatus.PENDING_PAYMENT}>Pending Payment</option>
                <option value={BookingStatus.PENDING_VERIFICATION}>Pending Verification</option>
              </select>
            </div>

            <div className="bg-brand-50/80 dark:bg-brand-900/20 p-3 rounded-xl border border-brand-200 dark:border-brand-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-brand-800 dark:text-brand-300 font-medium">Total Amount</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Rent (${monthlyRate} × {durationMonths}m) + Deposit ($100)</p>
              </div>
              <p className="text-xl font-black text-brand-700 dark:text-brand-300">${totalPrice}</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedBedSpaceId}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'Creating Booking...' : 'Confirm & Save Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCreateBookingModal;
