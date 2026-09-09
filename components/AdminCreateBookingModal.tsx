import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../hooks/useApp';
import { BookingStatus, Booking, User, AccommodationType } from '../types';
import { IconClose } from './Icon';
import { ALL_ROOM_SPACES, RoomSpaceConfig, getUnifiedRoomName, getParsedRoomSpaces, BED_SPACE_TO_ID_MAP, findDatabaseRoomForSpace } from '../lib/roomNaming';
import { supabase } from '../lib/supabaseClient';
import { getRoomPrice } from '../lib/pricing';
import { Search, UserPlus, UserCheck, AlertCircle, CheckCircle2, X, RefreshCw, ChevronRight, User as UserIcon } from 'lucide-react';

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
  const {
    students,
    rooms,
    bedSpaces,
    bookings,
    addBooking,
    createStudentProfile,
    sendStudentActivationEmail,
    parsedRoomSpaces,
    accommodationCategories,
    roomPricing
  } = useApp();

  // Mode: 'existing' (search & select registered student) or 'new' (unregistered student)
  const [studentMode, setStudentMode] = useState<'existing' | 'new'>('existing');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [createdStudent, setCreatedStudent] = useState<User | null>(null);
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  const [studentCreationSuccessMessage, setStudentCreationSuccessMessage] = useState('');
  const [sendActivationEmail, setSendActivationEmail] = useState(true);

  // Student form details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [nationality, setNationality] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Accommodation & dates
  const [selectedCategory, setSelectedCategory] = useState<string>(() => accommodationCategories[0]?.name || 'Premium 1');
  const [selectedBedSpaceId, setSelectedBedSpaceId] = useState<string>('');
  const [arrivalDate, setArrivalDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [durationMonths, setDurationMonths] = useState<number>(3);
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>(BookingStatus.CONFIRMED);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Synchronize category if initial category was empty or not in categories
  useEffect(() => {
    if (accommodationCategories && accommodationCategories.length > 0) {
      if (!selectedCategory || !accommodationCategories.some(c => c.name.toLowerCase() === selectedCategory.toLowerCase())) {
        setSelectedCategory(accommodationCategories[0].name);
      }
    }
  }, [accommodationCategories]);

  // Filter registered students based on search query
  const filteredStudents = useMemo(() => {
    const q = studentSearchQuery.trim().toLowerCase();
    if (!q) return students.slice(0, 10); // Show recent 10 by default

    return students.filter(st => {
      const nameMatch = (st.full_name || '').toLowerCase().includes(q);
      const emailMatch = (st.email || '').toLowerCase().includes(q);
      const phoneMatch = (st.phone_number || '').toLowerCase().includes(q);
      const idMatch = (st.id || '').toLowerCase().includes(q);
      const passportMatch = (st.passport_number || '').toLowerCase().includes(q);
      return nameMatch || emailMatch || phoneMatch || idMatch || passportMatch;
    });
  }, [students, studentSearchQuery]);

  // When a student is selected from search
  const handleSelectRegisteredStudent = (st: User) => {
    setSelectedStudent(st);
    setFullName(st.full_name || '');
    setEmail(st.email || '');
    if (st.gender) setGender(st.gender);
    setPhoneNumber(st.phone_number || '');
    setNationality(st.nationality || '');
    setPassportNumber(st.passport_number || '');

    // Check if they have an existing booking for extra defaults
    const existingBooking = bookings.find(b => b.student_id === st.id);
    if (existingBooking) {
      if (!st.phone_number && existingBooking.phone_number) setPhoneNumber(existingBooking.phone_number);
      if (!st.nationality && existingBooking.nationality) setNationality(existingBooking.nationality);
      if (!st.passport_number && existingBooking.passport_number) setPassportNumber(existingBooking.passport_number);
      if (existingBooking.emergency_contact_details) setEmergencyContact(existingBooking.emergency_contact_details);
    }

    setErrorMessage('');
    setDuplicateWarning(null);
  };

  // Clear selected student to pick another
  const handleClearSelectedStudent = () => {
    setSelectedStudent(null);
    setCreatedStudent(null);
    setFullName('');
    setEmail('');
    setPhoneNumber('');
    setNationality('');
    setPassportNumber('');
    setEmergencyContact('');
    setStudentCreationSuccessMessage('');
  };

  // Real-time duplicate check when in "new" student mode
  const [duplicateWarning, setDuplicateWarning] = useState<{ message: string; student: User } | null>(null);

  useEffect(() => {
    if (studentMode !== 'new' || createdStudent) {
      setDuplicateWarning(null);
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    if (!trimmedEmail && cleanPhone.length < 5) {
      setDuplicateWarning(null);
      return;
    }

    // Check against students
    let matchedStudent: User | undefined;
    if (trimmedEmail && trimmedEmail.includes('@')) {
      matchedStudent = students.find(s => s.email && s.email.toLowerCase() === trimmedEmail);
    }
    if (!matchedStudent && cleanPhone.length >= 7) {
      matchedStudent = students.find(s => s.phone_number && s.phone_number.replace(/\D/g, '') === cleanPhone);
    }

    // Check against bookings if not found in students
    if (!matchedStudent) {
      const bMatch = bookings.find(b => 
        (trimmedEmail && b.email && b.email.toLowerCase() === trimmedEmail) ||
        (cleanPhone.length >= 7 && b.phone_number && b.phone_number.replace(/\D/g, '') === cleanPhone)
      );
      if (bMatch) {
        matchedStudent = {
          id: bMatch.student_id,
          full_name: bMatch.full_name || bMatch.student_name || 'Existing Student',
          email: bMatch.email,
          phone_number: bMatch.phone_number,
          nationality: bMatch.nationality,
          passport_number: bMatch.passport_number,
          gender: bMatch.gender === 'Female' ? 'Female' : 'Male',
          role: 'student'
        };
      }
    }

    if (matchedStudent) {
      setDuplicateWarning({
        message: `An existing student record was found for "${matchedStudent.full_name}" (${matchedStudent.email || matchedStudent.phone_number}).`,
        student: matchedStudent
      });
    } else {
      setDuplicateWarning(null);
    }
  }, [email, phoneNumber, studentMode, createdStudent, students, bookings]);

  // Action: Create student profile manually or on-the-fly
  const handleCreateStudentProfile = async (): Promise<User | null> => {
    if (createdStudent) {
      return createdStudent;
    }

    if (!fullName.trim()) {
      setErrorMessage('Please enter the student full name.');
      return null;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address for the student.');
      return null;
    }

    setIsCreatingStudent(true);
    setErrorMessage('');

    try {
      const res = await createStudentProfile({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone_number: phoneNumber.trim(),
        gender: gender,
        nationality: nationality.trim() || 'International',
        passport_number: passportNumber.trim() || 'N/A',
        emergency_contact: emergencyContact.trim()
      });

      if (res.duplicate && res.existingStudent) {
        setDuplicateWarning({
          message: res.error || 'A student with this information already exists.',
          student: res.existingStudent
        });
        setErrorMessage(res.error || 'Duplicate student detected. Please select the existing student.');
        return null;
      }

      if (!res.success || !res.student) {
        setErrorMessage(res.error || 'Failed to create student profile.');
        return null;
      }

      const newStudent = res.student;
      setCreatedStudent(newStudent);
      setSelectedStudent(newStudent);
      setStudentCreationSuccessMessage(`Student profile created successfully (ID: ${newStudent.id.substring(0, 8)}...)`);
      return newStudent;
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while creating student profile.');
      return null;
    } finally {
      setIsCreatingStudent(false);
    }
  };

  // Available bed spaces for selected category based on centralized occupancy data
  const parsedSpaces = parsedRoomSpaces || [];

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    (accommodationCategories || []).forEach(c => set.add(c.name));
    (parsedSpaces || []).forEach(s => set.add(s.category));
    return Array.from(set);
  }, [accommodationCategories, parsedSpaces]);

  const categoryBedSpaces = parsedSpaces.filter(space => space.category.toLowerCase() === selectedCategory.toLowerCase());

  const bedSpaceAvailability = categoryBedSpaces.map(space => {
    return {
      space,
      isOccupied: space.isOccupied,
      occupiedBy: space.booking ? (space.booking.full_name || space.booking.student_name || 'Student') : null
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
  }, [selectedCategory, parsedSpaces]);

  if (!isOpen) return null;

  const calculatedExpiryDate = calculateExpiryDate(arrivalDate, durationMonths);
  const currentSpace = parsedSpaces.find(s => s.id === selectedBedSpaceId) || ALL_ROOM_SPACES.find(s => s.id === selectedBedSpaceId);
  const targetRoomType = currentSpace ? currentSpace.type : (selectedCategory.toLowerCase().includes('private') ? 'Private' : 'Shared');
  const monthlyRate = getRoomPrice(targetRoomType, durationMonths, roomPricing);
  const securityDeposit = 100;
  const totalPrice = (monthlyRate * durationMonths) + securityDeposit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // 1. Validate student selection or creation
    let targetStudentId = selectedStudent?.id;

    if (studentMode === 'new') {
      if (!createdStudent) {
        // Create profile on the fly
        const created = await handleCreateStudentProfile();
        if (!created) {
          // Error already set by handleCreateStudentProfile
          return;
        }
        targetStudentId = created.id;
      } else {
        targetStudentId = createdStudent.id;
      }
    } else {
      if (!selectedStudent || !targetStudentId) {
        setErrorMessage('Please select a registered student or switch to "Register New Student".');
        return;
      }
    }

    if (!fullName.trim()) {
      setErrorMessage('Please enter the student full name.');
      return;
    }

    if (!selectedBedSpaceId) {
      setErrorMessage('Please select an available bed space.');
      return;
    }

    const selectedSpaceObj = parsedSpaces.find(s => s.id === selectedBedSpaceId) || ALL_ROOM_SPACES.find(s => s.id === selectedBedSpaceId);
    if (!selectedSpaceObj) {
      setErrorMessage('Invalid room selection.');
      return;
    }

    // Resolve roomId and bedSpaceId
    let targetRoomId = selectedSpaceObj.roomId;
    let bedSpaceIdToAssign = selectedSpaceObj.bedSpaceId;

    if (!bedSpaceIdToAssign && bedSpaces && bedSpaces.length > 0) {
      const matchedBed = bedSpaces.find(b => {
        if (targetRoomId && b.room_id !== targetRoomId) return false;
        const bLabel = (b.label || '').toLowerCase();
        const sLabel = (selectedSpaceObj.bedSpaceName || '').toLowerCase();
        return bLabel === sLabel ||
               (bLabel.includes('bed a') && sLabel.includes('bed a')) ||
               (bLabel.includes('bed b') && sLabel.includes('bed b')) ||
               (bLabel.includes('single') && sLabel.includes('single'));
      });
      if (matchedBed) {
        bedSpaceIdToAssign = matchedBed.id;
        if (!targetRoomId) targetRoomId = matchedBed.room_id;
      }
    }

    if (!bedSpaceIdToAssign) {
      bedSpaceIdToAssign = BED_SPACE_TO_ID_MAP[selectedBedSpaceId] || null;
    }

    const matchingDbRoom = targetRoomId
      ? rooms.find(r => r.id === targetRoomId)
      : findDatabaseRoomForSpace(rooms, {
          category: selectedSpaceObj.category,
          type: selectedSpaceObj.type,
          roomName: selectedSpaceObj.roomName,
          id: selectedSpaceObj.id,
          roomId: selectedSpaceObj.roomId
        }, accommodationCategories) || rooms[0];

    const finalRoomId = targetRoomId || matchingDbRoom?.id;

    if (!finalRoomId) {
      setErrorMessage('No matching room found in database.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Live validation: Double check bed space is not already booked in database
      if (bedSpaceIdToAssign) {
        const { data: conflictingBookings, error: conflictErr } = await supabase
          .from('bookings')
          .select('id, full_name, status, start_date, end_date')
          .eq('bed_space_id', bedSpaceIdToAssign)
          .in('status', ['Confirmed', 'Occupied']);

        if (!conflictErr && conflictingBookings && conflictingBookings.length > 0) {
          const conflicting = conflictingBookings[0];
          setErrorMessage(`This bed space is currently occupied in the database by ${conflicting.full_name || 'another student'}. Please select an available bed space.`);
          setIsSubmitting(false);
          return;
        }
      }

      const newBookingData: Partial<Booking> = {
        student_id: targetStudentId,
        room_id: finalRoomId,
        bed_space_id: bedSpaceIdToAssign,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
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
        preferred_accommodation: selectedCategory.toLowerCase().includes('premium')
          ? (selectedSpaceObj.type === 'Private' ? AccommodationType.PREMIUM_PRIVATE : AccommodationType.PREMIUM_SHARED)
          : (selectedSpaceObj.type === 'Private' ? AccommodationType.STANDARD_PRIVATE : AccommodationType.STANDARD_SHARED),
        emergency_contact_details: emergencyContact.trim() || 'N/A',
        status: bookingStatus,
        total_price: totalPrice,
        booked_at: new Date().toISOString(),
        address_in_egypt: matchingDbRoom.apartment_name || selectedCategory
      };

      const result = await addBooking(newBookingData as Booking);

      if (result.success) {
        let emailNote = '';
        if (sendActivationEmail && email?.trim()) {
          try {
            const roomDisplay = `${matchingDbRoom.apartment_name || selectedCategory} - Room ${matchingDbRoom.room_number || ''} (${selectedSpaceObj.type === 'Private' ? 'Private Room' : (selectedSpaceObj.bedLabel || 'Shared Bed')})`;
            const emailRes = await sendStudentActivationEmail({
              email: email.trim().toLowerCase(),
              fullName: fullName.trim(),
              roomInfo: roomDisplay
            });
            if (emailRes.success) {
              emailNote = ` Activation link dispatched to ${email.trim().toLowerCase()}.`;
            } else {
              emailNote = ` (Note: Could not send activation email: ${emailRes.error || 'delivery issue'}. You can resend anytime from Student Details).`;
            }
          } catch (mailErr: any) {
            emailNote = ` (Note: Could not send activation email: ${mailErr.message || 'delivery issue'}. You can resend anytime from Student Details).`;
          }
        }

        setSuccessMessage(`Booking created and verified successfully!${emailNote}`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
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
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin: Create Student Booking</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Assign room and bed space directly for registered or new students
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Student Selection & Registration Mode Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                1. Student Information
              </label>
              <div className="flex items-center bg-gray-100 dark:bg-gray-750 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setStudentMode('existing');
                    setErrorMessage('');
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${
                    studentMode === 'existing'
                      ? 'bg-white dark:bg-gray-700 text-brand-700 dark:text-brand-300 shadow-xs font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Existing Student
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudentMode('new');
                    setSelectedStudent(null);
                    setErrorMessage('');
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${
                    studentMode === 'new'
                      ? 'bg-white dark:bg-gray-700 text-brand-700 dark:text-brand-300 shadow-xs font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  New Student
                </button>
              </div>
            </div>

            {/* TAB A: Existing Student Mode */}
            {studentMode === 'existing' && (
              <div className="space-y-3">
                {selectedStudent ? (
                  /* Selected Student Card */
                  <div className="p-3.5 bg-brand-50/80 dark:bg-brand-900/25 border border-brand-200 dark:border-brand-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
                        {selectedStudent.full_name?.charAt(0).toUpperCase() || 'S'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-brand-950 dark:text-brand-100">
                            {selectedStudent.full_name}
                          </p>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                            Registered
                          </span>
                        </div>
                        <p className="text-xs text-brand-800/80 dark:text-brand-300/80">
                          {selectedStudent.email || 'No email on record'} • {selectedStudent.phone_number || 'No phone'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearSelectedStudent}
                      className="px-2.5 py-1 text-xs font-medium text-brand-700 hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-100 border border-brand-300 dark:border-brand-700 rounded-lg hover:bg-brand-100/50 transition"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  /* Student Search Input & Dropdown */
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search student by name, email, phone, or ID..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      />
                      {studentSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setStudentSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Results List */}
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-750 bg-white dark:bg-gray-800">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map(st => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => handleSelectRegisteredStudent(st)}
                            className="w-full text-left p-2.5 hover:bg-gray-50 dark:hover:bg-gray-750 transition flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300 flex items-center justify-center font-bold text-xs shrink-0">
                                {st.full_name?.charAt(0).toUpperCase() || 'S'}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                                  {st.full_name}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                  {st.email ? st.email : 'No email'} {st.phone_number ? `• ${st.phone_number}` : ''}
                                </p>
                              </div>
                            </div>
                            <span className="text-[11px] text-brand-600 dark:text-brand-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                              Select <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            No registered student found matching &ldquo;{studentSearchQuery}&rdquo;.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setStudentMode('new');
                              setFullName(studentSearchQuery);
                            }}
                            className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-1"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Register &ldquo;{studentSearchQuery}&rdquo; as a New Student
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB B: New Student Registration Mode */}
            {studentMode === 'new' && (
              <div className="space-y-3">
                {/* Info Note */}
                <div className="p-3 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Register New Student Profile: </span>
                    An official student profile will be created in the database before booking. No password is required from the Admin.
                  </div>
                </div>

                {/* Profile Creation Success Badge if already created */}
                {createdStudent && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between font-medium">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      {studentCreationSuccessMessage || `Student profile created with ID: ${createdStudent.id.substring(0, 8)}...`}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-200/60 dark:bg-emerald-800/60 rounded-full font-bold uppercase">
                      Profile Ready
                    </span>
                  </div>
                )}

                {/* Duplicate Student Warning Alert */}
                {duplicateWarning && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Existing Student Record Found:</p>
                        <p className="mt-0.5">{duplicateWarning.message}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentMode('existing');
                        handleSelectRegisteredStudent(duplicateWarning.student);
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs whitespace-nowrap shadow-xs transition"
                    >
                      Use Existing
                    </button>
                  </div>
                )}

                {/* Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-150 dark:border-gray-700/60">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sylla Senou"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={!!createdStudent}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="student@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!!createdStudent}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      placeholder="+20 123 456 789"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={!!createdStudent}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gender *
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                      disabled={!!createdStudent}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nationality *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Nigerian, Uzbek, Guinean"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      disabled={!!createdStudent}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Passport Number
                    </label>
                    <input
                      type="text"
                      placeholder="Passport Number"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                      disabled={!!createdStudent}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Pre-create button if user wants to verify and save profile immediately */}
                {!createdStudent && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleCreateStudentProfile}
                      disabled={isCreatingStudent || !fullName.trim() || !email.trim()}
                      className="text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-brand-500 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isCreatingStudent ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Creating Profile...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          Verify & Create Profile First
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Accommodation & Available Rooms */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              2. Accommodation Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 mb-3">
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`p-2.5 rounded-xl border text-center font-medium text-sm transition ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 dark:border-brand-500 font-semibold shadow-xs'
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-44 overflow-y-auto p-1">
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
                      {space.type} • ${(accommodationCategories?.find(c => c.name.toLowerCase() === selectedCategory.toLowerCase())?.defaultPrice || 175)}/mo
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
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

          {/* Account Activation Option */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-3">
            <input
              type="checkbox"
              id="dispatch-activation-email"
              checked={sendActivationEmail}
              onChange={(e) => setSendActivationEmail(e.target.checked)}
              className="mt-0.5 h-4 w-4 text-emerald-600 rounded border-gray-300 dark:border-gray-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="dispatch-activation-email" className="text-xs text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              <span className="font-bold text-emerald-900 dark:text-emerald-300 block">
                Dispatch Account Activation Email to Student
              </span>
              Sends a secure link to <span className="font-mono font-semibold">{email || 'student email'}</span> so the student can set their password and view this booking upon login.
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isCreatingStudent}
              className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCreatingStudent || !selectedBedSpaceId || (studentMode === 'existing' && !selectedStudent)}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting || isCreatingStudent ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {isCreatingStudent ? 'Creating Profile...' : 'Creating Booking...'}
                </>
              ) : (
                'Confirm & Save Booking'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCreateBookingModal;
