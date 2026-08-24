import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { User, BookingStatus } from '../types';
import { IconClose, IconEdit, IconCheckCircle } from './Icon';
import BookingStatusBadge from './BookingStatusBadge';
import { getDisplayFromRoom, getAccommodationAddress } from '../lib/roomNaming';

interface StudentDetailsModalProps {
  student: User | null;
  isOpen: boolean;
  onClose: () => void;
  onViewPaymentProof?: (proofUrl: string) => void;
  onStudentUpdated?: (updatedStudent: User) => void;
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  student,
  isOpen,
  onClose,
  onViewPaymentProof,
  onStudentUpdated
}) => {
  const { user: currentUser, bookings, accommodationAddresses, updateStudentProfile, addActivity } = useApp();

  const [activeStudent, setActiveStudent] = useState<User | null>(student);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Editable Form Data State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    gender: 'Male' as 'Male' | 'Female',
    nationality: '',
    passport_number: '',
    emergency_contact: '',
    emergency_contact_details: '',
    address_in_egypt: '',
    building_no: '',
    flat_no: '',
    street_name: '',
    district_name: '',
    state: ''
  });

  // Sync state when incoming student changes or modal opens
  useEffect(() => {
    if (student) {
      setActiveStudent(student);
      setIsEditing(false);
      setSaveSuccessMsg(null);
      setSaveErrorMsg(null);

      // Find any relevant booking records for fallback address/contact details
      const studentBookings = bookings.filter(
        b => b.student_id === student.id || b.user_id === student.id || (b.email && student.email && b.email.toLowerCase() === student.email.toLowerCase())
      );
      const latestBooking = studentBookings.find(
        b => b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.COMPLETED
      ) || studentBookings[0];

      setFormData({
        full_name: student.full_name || latestBooking?.full_name || '',
        email: student.email || latestBooking?.email || '',
        phone_number: student.phone_number || latestBooking?.phone_number || '',
        gender: (student.gender || latestBooking?.gender || 'Male') as 'Male' | 'Female',
        nationality: student.nationality || latestBooking?.nationality || '',
        passport_number: student.passport_number || latestBooking?.passport_number || '',
        emergency_contact: latestBooking?.emergency_contact || '',
        emergency_contact_details: latestBooking?.emergency_contact_details || '',
        address_in_egypt: latestBooking?.address_in_egypt || '',
        building_no: latestBooking?.building_no || '',
        flat_no: latestBooking?.flat_no || '',
        street_name: latestBooking?.street_name || '',
        district_name: latestBooking?.district_name || '',
        state: latestBooking?.state || ''
      });
    }
  }, [student, bookings, isOpen]);

  if (!isOpen || !activeStudent) return null;

  // Fetch all bookings for this student
  const studentBookings = bookings.filter(
    b => b.student_id === activeStudent.id || b.user_id === activeStudent.id || (b.email && activeStudent.email && b.email.toLowerCase() === activeStudent.email.toLowerCase())
  );

  // Determine current active booking
  const activeBooking = studentBookings.find(
    b => b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.COMPLETED
  ) || studentBookings[0];

  const primaryPhone = activeStudent.phone_number || activeBooking?.phone_number || 'N/A';
  const nationality = activeStudent.nationality || activeBooking?.nationality || 'International';
  const passportNumber = activeStudent.passport_number || activeBooking?.passport_number || 'N/A';
  const emergencyContact = activeBooking?.emergency_contact_details || activeBooking?.emergency_contact || 'N/A';
  const addressInEgypt = activeBooking?.address_in_egypt || getAccommodationAddress(activeBooking?.preferred_accommodation, accommodationAddresses);
  const homeAddress = [
    activeBooking?.building_no ? `Bldg ${activeBooking.building_no}` : '',
    activeBooking?.flat_no ? `Flat ${activeBooking.flat_no}` : '',
    activeBooking?.street_name || '',
    activeBooking?.district_name || '',
    activeBooking?.state || ''
  ].filter(Boolean).join(', ') || 'N/A';

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    // Validation
    if (!formData.full_name.trim()) {
      setSaveErrorMsg('Student Full Name is required.');
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setSaveErrorMsg('Please provide a valid email address.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateStudentProfile(activeStudent.id, {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        gender: formData.gender,
        nationality: formData.nationality.trim(),
        passport_number: formData.passport_number.trim(),
        emergency_contact: formData.emergency_contact.trim(),
        emergency_contact_details: formData.emergency_contact_details.trim() || formData.emergency_contact.trim(),
        address_in_egypt: formData.address_in_egypt.trim(),
        building_no: formData.building_no.trim(),
        flat_no: formData.flat_no.trim(),
        street_name: formData.street_name.trim(),
        district_name: formData.district_name.trim(),
        state: formData.state.trim()
      });

      if (result.success) {
        const updatedObj: User = result.updatedStudent || {
          ...activeStudent,
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          phone_number: formData.phone_number.trim(),
          gender: formData.gender,
          nationality: formData.nationality.trim(),
          passport_number: formData.passport_number.trim()
        };

        setActiveStudent(updatedObj);
        if (onStudentUpdated) {
          onStudentUpdated(updatedObj);
        }

        addActivity({
          user_id: currentUser?.id || 'admin',
          type: 'system',
          description: `Updated student registration & profile details for ${formData.full_name.trim()}`,
          timestamp: new Date().toISOString()
        });

        setSaveSuccessMsg('Student record updated successfully in Supabase.');
        setIsEditing(false);

        // Auto clear success message after 4s
        setTimeout(() => {
          setSaveSuccessMsg(null);
        }, 4000);
      } else {
        setSaveErrorMsg(result.error || 'Failed to update student profile. Please try again.');
      }
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Revert form data back to activeStudent state
    setFormData({
      full_name: activeStudent.full_name || activeBooking?.full_name || '',
      email: activeStudent.email || activeBooking?.email || '',
      phone_number: activeStudent.phone_number || activeBooking?.phone_number || '',
      gender: (activeStudent.gender || activeBooking?.gender || 'Male') as 'Male' | 'Female',
      nationality: activeStudent.nationality || activeBooking?.nationality || '',
      passport_number: activeStudent.passport_number || activeBooking?.passport_number || '',
      emergency_contact: activeBooking?.emergency_contact || '',
      emergency_contact_details: activeBooking?.emergency_contact_details || '',
      address_in_egypt: activeBooking?.address_in_egypt || '',
      building_no: activeBooking?.building_no || '',
      flat_no: activeBooking?.flat_no || '',
      street_name: activeBooking?.street_name || '',
      district_name: activeBooking?.district_name || '',
      state: activeBooking?.state || ''
    });
    setSaveErrorMsg(null);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 flex items-center justify-center text-lg font-bold">
              {(activeStudent.full_name || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {activeStudent.full_name || 'Student Profile'}
                </h2>
                {isEditing && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    Editing Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Registered Student ID: <span className="font-mono text-gray-700 dark:text-gray-300">{activeStudent.id}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setSaveErrorMsg(null);
                  setSaveSuccessMsg(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <IconEdit className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-medium transition"
              >
                Cancel Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Close Modal"
            >
              <IconClose className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between animate-fade-in shrink-0">
            <div className="flex items-center gap-2 font-medium">
              <IconCheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 font-bold ml-2">
              ✕
            </button>
          </div>
        )}

        {/* Error Alert Banner */}
        {saveErrorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs flex items-center justify-between animate-fade-in shrink-0">
            <div className="flex items-center gap-2 font-medium">
              <span className="font-bold">⚠️ Error:</span>
              <span>{saveErrorMsg}</span>
            </div>
            <button onClick={() => setSaveErrorMsg(null)} className="text-red-600 hover:text-red-800 font-bold ml-2">
              ✕
            </button>
          </div>
        )}

        {/* Scrollable Content: View Mode vs Edit Mode */}
        <div className="overflow-y-auto p-1 space-y-6 my-4">
          {isEditing ? (
            /* EDIT FORM */
            <form id="studentEditForm" onSubmit={handleSaveStudent} className="space-y-6 animate-fade-in">
              {/* Group 1: Personal & Account Credentials */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-150 dark:border-gray-700/60 space-y-4">
                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  Personal & Registration Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Student full name (as in passport)"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Gender *
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-hidden font-medium"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="student@example.com"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      placeholder="+20 123 456 7890"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => handleInputChange('nationality', e.target.value)}
                      placeholder="e.g. British, French, American"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Passport / Student ID
                    </label>
                    <input
                      type="text"
                      value={formData.passport_number}
                      onChange={(e) => handleInputChange('passport_number', e.target.value)}
                      placeholder="Passport or Student ID Number"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-hidden font-medium font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Home Address Information */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-150 dark:border-gray-700/60 space-y-4">
                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  Permanent / Home Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Building No.
                    </label>
                    <input
                      type="text"
                      value={formData.building_no}
                      onChange={(e) => handleInputChange('building_no', e.target.value)}
                      placeholder="e.g. 14B"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Flat / Apt No.
                    </label>
                    <input
                      type="text"
                      value={formData.flat_no}
                      onChange={(e) => handleInputChange('flat_no', e.target.value)}
                      placeholder="e.g. Apt 3"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Street Name
                    </label>
                    <input
                      type="text"
                      value={formData.street_name}
                      onChange={(e) => handleInputChange('street_name', e.target.value)}
                      placeholder="e.g. High Street"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                      District / Area
                    </label>
                    <input
                      type="text"
                      value={formData.district_name}
                      onChange={(e) => handleInputChange('district_name', e.target.value)}
                      placeholder="e.g. Westminster"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-hidden font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                      State / City / Country
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="e.g. London, United Kingdom"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-hidden font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: Address in Egypt & Emergency Contact */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-150 dark:border-gray-700/60 space-y-4">
                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  Address in Egypt & Emergency Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Address in Egypt (Assigned Apartment or Residential Address)
                    </label>
                    <input
                      type="text"
                      value={formData.address_in_egypt}
                      onChange={(e) => handleInputChange('address_in_egypt', e.target.value)}
                      placeholder="e.g. Nasr City, Cairo, Egypt"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-hidden font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Emergency Contact Details (Name, Relationship & Phone)
                    </label>
                    <input
                      type="text"
                      value={formData.emergency_contact_details}
                      onChange={(e) => handleInputChange('emergency_contact_details', e.target.value)}
                      placeholder="e.g. John Doe (Brother) - +44 7123 456789"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-hidden font-medium"
                    />
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* VIEW MODE */
            <>
              {/* Section 1: Personal & Registration Information */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/60">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    Personal & Registration Information
                  </h3>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setSaveErrorMsg(null);
                      setSaveSuccessMsg(null);
                    }}
                    className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 text-xs font-semibold flex items-center gap-1"
                  >
                    <IconEdit className="w-3 h-3" /> Edit Info
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block">Full Name</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{activeStudent.full_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block">Email Address</span>
                    <span className="font-semibold text-gray-900 dark:text-white font-mono">{activeStudent.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block">Phone / WhatsApp</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{primaryPhone}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block">Gender</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{activeStudent.gender || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block">Nationality</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{nationality}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block">Passport / Student ID</span>
                    <span className="font-semibold text-gray-900 dark:text-white font-mono">{passportNumber}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-500 dark:text-gray-400 block">Emergency Contact</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{emergencyContact}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block">Total Bookings</span>
                    <span className="font-semibold text-brand-600 dark:text-brand-400">{studentBookings.length} Record(s)</span>
                  </div>
                  <div className="sm:col-span-3 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                    <span className="text-gray-500 dark:text-gray-400 block">Permanent / Home Address</span>
                    <span className="font-medium text-gray-900 dark:text-white">{homeAddress}</span>
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
                            <td className="p-3 font-mono text-gray-900 dark:text-white font-bold">BK{b.id}</td>
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

              {/* Section 4: Transactions & Payment History */}
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
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
          {isEditing ? (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                form="studentEditForm"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving to Supabase...
                  </>
                ) : (
                  <>
                    <IconCheckCircle className="w-4 h-4" />
                    Save Changes to Supabase
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setSaveErrorMsg(null);
                  setSaveSuccessMsg(null);
                }}
                className="px-4 py-2 rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 hover:bg-brand-100 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <IconEdit className="w-3.5 h-3.5" /> Edit Student Details
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Close Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal;
