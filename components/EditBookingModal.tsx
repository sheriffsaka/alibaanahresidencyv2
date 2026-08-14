import React, { useState, useEffect, useMemo } from 'react';
import { Booking, BookingStatus, Room, AccommodationType } from '../types';
import { useApp } from '../hooks/useApp';
import { IconClose, IconCheckCircle, IconTrash, IconEdit, IconFile, IconBuilding, IconCheck } from './Icon';
import BookingStatusBadge from './BookingStatusBadge';
import { 
  ALL_ROOM_SPACES, 
  getLiveStudentRoomDetails, 
  getUnifiedRoomName, 
  getAccommodationAddress, 
  getDisplayFromRoom,
  findDatabaseRoomForSpace
} from '../lib/roomNaming';
import { sendEmail, getApprovalEmailTemplate } from '../lib/email';
import AgreementModal from './AgreementModal';

interface EditBookingModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingUpdated?: (updatedBooking: Booking) => void;
}

export const EditBookingModal: React.FC<EditBookingModalProps> = ({
  booking,
  isOpen,
  onClose,
  onBookingUpdated
}) => {
  const { user, rooms, updateBooking, deleteBooking, addActivity } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'documents'>('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingAgreement, setViewingAgreement] = useState(false);

  // Form State for Manual Edit
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    nationality: '',
    passport_number: '',
    expected_arrival_date: '',
    duration_of_stay: '',
    category: 'Standard' as 'Standard' | 'Premium 1' | 'Premium 2',
    selectedSpaceId: 'std_r1_a',
    roomName: 'Room 1',
    bedSpaceName: 'Bed A',
    roomType: 'Shared' as 'Shared' | 'Private',
    total_price: 0,
    status: BookingStatus.PENDING_VERIFICATION as BookingStatus,
    emergency_contact_details: '',
    address_in_egypt: ''
  });

  const liveDetails = useMemo(() => {
    if (!booking) return null;
    return getLiveStudentRoomDetails(booking, rooms);
  }, [booking, rooms]);

  // Synchronize edit state whenever booking changes
  useEffect(() => {
    if (booking) {
      const details = getLiveStudentRoomDetails(booking, rooms);
      
      const currentCat = (details.category === 'Premium 2' ? 'Premium 2' : details.category === 'Premium 1' ? 'Premium 1' : 'Standard');
      
      const matchingSpace = ALL_ROOM_SPACES.find(s => {
        const matchCat = s.category === currentCat;
        const matchRoom = s.roomName.toLowerCase().replace(/\s+/g, '') === details.roomName.toLowerCase().replace(/\s+/g, '');
        if (s.type === 'Private') return matchCat && matchRoom;
        const matchBed = s.bedSpaceName.toLowerCase().replace(/\s+/g, '') === details.bedSpaceName.toLowerCase().replace(/\s+/g, '');
        return matchCat && matchRoom && matchBed;
      }) || ALL_ROOM_SPACES.find(s => s.category === currentCat) || ALL_ROOM_SPACES[0];

      setEditFormData({
        full_name: booking.full_name || '',
        email: booking.email || '',
        phone_number: booking.phone_number || '',
        nationality: booking.nationality || '',
        passport_number: booking.passport_number || '',
        expected_arrival_date: booking.expected_arrival_date ? booking.expected_arrival_date.split('T')[0] : '',
        duration_of_stay: booking.duration_of_stay || '6 months',
        category: currentCat,
        selectedSpaceId: matchingSpace.id,
        roomName: matchingSpace.roomName,
        bedSpaceName: matchingSpace.bedSpaceName,
        roomType: matchingSpace.type,
        total_price: booking.total_price || 0,
        status: booking.status,
        emergency_contact_details: booking.emergency_contact_details || '',
        address_in_egypt: booking.address_in_egypt || ''
      });
      setActiveTab('overview');
    }
  }, [booking, rooms]);

  if (!isOpen || !booking || !liveDetails) return null;

  // Handle Space selection change in Edit mode
  const handleSpaceChange = (spaceId: string) => {
    const space = ALL_ROOM_SPACES.find(s => s.id === spaceId);
    if (space) {
      setEditFormData(prev => ({
        ...prev,
        category: space.category,
        selectedSpaceId: space.id,
        roomName: space.roomName,
        bedSpaceName: space.bedSpaceName,
        roomType: space.type
      }));
    }
  };

  // 1. APPROVE ACTION
  const handleApprove = async () => {
    if (!confirm(`Confirm payment and approve booking BK${booking.id} for ${booking.full_name}?`)) return;
    
    setIsProcessing(true);
    try {
      const res = await updateBooking(booking.id, {
        status: BookingStatus.CONFIRMED
      });

      if (res.success) {
        addActivity({
          user_id: user?.id || 'admin',
          type: 'payment',
          description: `Staff verified payment and approved BK${booking.id} (${booking.full_name})`,
          timestamp: new Date().toISOString()
        });

        // Send Approval Email to student
        try {
          const formattedRoom = getDisplayFromRoom(booking.rooms);
          const emailTemplate = getApprovalEmailTemplate(booking.full_name, booking.id, formattedRoom);
          await sendEmail({
            to: booking.email,
            subject: emailTemplate.subject,
            body: emailTemplate.body
          });
        } catch (emailErr) {
          console.warn("Failed to send approval email notification:", emailErr);
        }

        alert(`Booking BK${booking.id} successfully approved!`);
        if (onBookingUpdated) {
          onBookingUpdated({ ...booking, status: BookingStatus.CONFIRMED });
        }
        onClose();
      } else {
        alert(`Failed to approve booking: ${res.error}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. REJECT ACTION
  const handleReject = async () => {
    const reason = prompt(`Please enter a rejection reason for BK${booking.id} (optional):`, "Payment verification could not be completed.");
    if (reason === null) return; // User cancelled prompt

    setIsProcessing(true);
    try {
      const res = await updateBooking(booking.id, {
        status: BookingStatus.CANCELLED
      });

      if (res.success) {
        addActivity({
          user_id: user?.id || 'admin',
          type: 'system',
          description: `Staff rejected booking BK${booking.id} (${booking.full_name}). Reason: ${reason}. Bed space released to vacant.`,
          timestamp: new Date().toISOString()
        });

        alert(`Booking BK${booking.id} has been rejected and the bed space has been released to Vacant.`);
        if (onBookingUpdated) {
          onBookingUpdated({ ...booking, status: BookingStatus.CANCELLED });
        }
        onClose();
      } else {
        alert(`Failed to reject booking: ${res.error}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. EVICT / DISCONTINUE ACTION
  const handleEvictOrDiscontinue = async () => {
    if (!confirm(`Are you sure you want to Evict / Discontinue residency for ${booking.full_name} (BK${booking.id})?\n\nThis will immediately conclude their tenancy, record checkout timestamp, and release the room/bed space back to Vacant.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const checkoutTimestamp = new Date().toISOString();
      const res = await updateBooking(booking.id, {
        status: BookingStatus.COMPLETED,
        checked_out_at: checkoutTimestamp
      });

      if (res.success) {
        addActivity({
          user_id: user?.id || 'admin',
          type: 'system',
          description: `Discontinued residency for ${booking.full_name} (BK${booking.id}). Room/bed space marked vacant immediately.`,
          timestamp: checkoutTimestamp
        });

        alert(`Residency for ${booking.full_name} has been discontinued. The room/bed space is now Vacant.`);
        if (onBookingUpdated) {
          onBookingUpdated({ ...booking, status: BookingStatus.COMPLETED, checked_out_at: checkoutTimestamp });
        }
        onClose();
      } else {
        alert(`Failed to discontinue residency: ${res.error}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. MANUAL EDIT SAVE
  const handleSaveManualEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const dbRoom = findDatabaseRoomForSpace(rooms, { 
        category: editFormData.category, 
        type: editFormData.roomType 
      });

      const unifiedRoomName = getUnifiedRoomName(
        editFormData.category,
        editFormData.roomName,
        editFormData.bedSpaceName
      );

      const prefAccommodation = (editFormData.category.startsWith('Premium') 
        ? (editFormData.roomType === 'Private' ? 'Premium Private' : 'Premium Shared')
        : (editFormData.roomType === 'Private' ? 'Standard Private' : 'Standard Shared')) as AccommodationType;

      const updatedPayload: Partial<Booking> = {
        full_name: editFormData.full_name,
        email: editFormData.email,
        phone_number: editFormData.phone_number,
        nationality: editFormData.nationality,
        passport_number: editFormData.passport_number,
        expected_arrival_date: editFormData.expected_arrival_date,
        duration_of_stay: editFormData.duration_of_stay,
        total_price: Number(editFormData.total_price),
        status: editFormData.status,
        preferred_accommodation: prefAccommodation,
        emergency_contact_details: editFormData.emergency_contact_details,
        address_in_egypt: editFormData.address_in_egypt,
        room_id: dbRoom?.id || booking.room_id,
        rooms: {
          room_number: unifiedRoomName,
          type: prefAccommodation,
          apartment_name: `Apartment ${editFormData.category}`,
          category: editFormData.category.startsWith('Premium') ? 'Premium' : 'Standard'
        }
      };

      const res = await updateBooking(booking.id, updatedPayload);

      if (res.success) {
        addActivity({
          user_id: user?.id || 'admin',
          type: 'system',
          description: `Administrator manually updated booking details for BK${booking.id} (${editFormData.full_name})`,
          timestamp: new Date().toISOString()
        });

        alert("Booking details successfully updated!");
        if (onBookingUpdated) {
          onBookingUpdated({ ...booking, ...updatedPayload });
        }
        onClose();
      } else {
        alert(`Failed to update booking: ${res.error}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 dark:border-gray-700 my-8 max-h-[92vh] flex flex-col">
          
          {/* Modal Header */}
          <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-700 pb-5 shrink-0">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-brand-100 dark:bg-brand-900/50 text-brand-800 dark:text-brand-200 uppercase tracking-wider font-mono">
                  BK{booking.id}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-950 dark:text-white tracking-tight">
                  {booking.full_name}
                </h2>
                <BookingStatusBadge status={booking.status} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Residency Ref: <span className="font-mono">#{booking.id}</span> • Registered on {new Date(booking.booked_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Close Modal"
            >
              <IconClose className="w-5 h-5" />
            </button>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex gap-2 border-b border-gray-100 dark:border-gray-700 pt-4 pb-2 shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              📋 Residency Overview
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'edit'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <IconEdit className="w-3.5 h-3.5" /> Manual Edit Booking
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'documents'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <IconFile className="w-3.5 h-3.5" /> Contract & Proofs
            </button>
          </div>

          {/* Modal Body Content */}
          <div className="overflow-y-auto py-5 flex-1 space-y-6">
            
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Status Notice Banner */}
                {booking.status === BookingStatus.PENDING_VERIFICATION && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-4">
                    <div className="text-xs text-amber-900 dark:text-amber-200">
                      <p className="font-bold text-sm">⏳ Payment Proof Pending Admin Verification</p>
                      <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                        Student has signed the contract and uploaded deposit payment proof. Review the payment receipt under Documents before approving.
                      </p>
                    </div>
                    <button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition whitespace-nowrap shrink-0 flex items-center gap-1.5"
                    >
                      <IconCheck className="w-4 h-4" /> Confirm & Approve
                    </button>
                  </div>
                )}

                {/* Primary Student & Room Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Student Details Card */}
                  <div className="bg-gray-50 dark:bg-gray-900/60 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/60 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      👤 Student Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400 block font-medium">Full Name</span>
                        <span className="font-bold text-gray-900 dark:text-white">{booking.full_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">Email</span>
                        <span className="font-bold text-gray-900 dark:text-white font-mono">{booking.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">WhatsApp / Phone</span>
                        <span className="font-bold text-gray-900 dark:text-white">{booking.phone_number || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">Nationality</span>
                        <span className="font-bold text-gray-900 dark:text-white">{booking.nationality || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">Passport Number</span>
                        <span className="font-bold text-gray-900 dark:text-white">{booking.passport_number || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">Emergency Contact</span>
                        <span className="font-bold text-gray-900 dark:text-white">{booking.emergency_contact_details || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Room Assignment Card */}
                  <div className="bg-gray-50 dark:bg-gray-900/60 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/60 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                      <IconBuilding className="w-3.5 h-3.5" /> Assigned Accommodation
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400 block font-medium">Category</span>
                        <span className="font-bold text-brand-600 dark:text-brand-400">{liveDetails.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">Room & Bed Space</span>
                        <span className="font-bold text-gray-900 dark:text-white">{liveDetails.roomName} • {liveDetails.bedSpaceName}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400 block font-medium">Unified Descriptor</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{liveDetails.fullDisplay}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400 block font-medium">Apartment Address</span>
                        <span className="text-gray-600 dark:text-gray-300 font-medium">📍 {liveDetails.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lease & Financial Summary */}
                <div className="bg-gray-50 dark:bg-gray-900/60 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/60 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    💵 Lease & Billing Details
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block font-medium">Arrival Date</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {booking.expected_arrival_date ? new Date(booking.expected_arrival_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Duration</span>
                      <span className="font-bold text-gray-900 dark:text-white">{booking.duration_of_stay || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Lease Expiry / End Date</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {booking.end_date ? new Date(booking.end_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Total Package Rate</span>
                      <span className="text-base font-black text-brand-700 dark:text-brand-300">${booking.total_price || 0} USD</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MANUAL EDIT FORM */}
            {activeTab === 'edit' && (
              <form onSubmit={handleSaveManualEdit} className="space-y-6">
                <div className="bg-brand-50/50 dark:bg-brand-950/20 p-4 rounded-2xl border border-brand-100 dark:border-brand-900 text-xs text-brand-900 dark:text-brand-200">
                  <p className="font-bold">✏️ Administrator Override</p>
                  <p className="mt-0.5 text-brand-700 dark:text-brand-300">
                    Modify student personal information, reassign room or bed space, update package pricing, or change booking status manually.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Full Name */}
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Student Full Name</label>
                    <input
                      type="text"
                      required
                      value={editFormData.full_name}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-medium focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={editFormData.email}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-medium focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Phone / WhatsApp</label>
                    <input
                      type="text"
                      value={editFormData.phone_number}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-medium focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Nationality */}
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Nationality</label>
                    <input
                      type="text"
                      value={editFormData.nationality}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, nationality: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-medium focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Passport Number */}
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Passport Number</label>
                    <input
                      type="text"
                      value={editFormData.passport_number}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, passport_number: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-medium focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Status Dropdown */}
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Booking Status</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value as BookingStatus }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-bold focus:ring-2 focus:ring-brand-500"
                    >
                      <option value={BookingStatus.PENDING_VERIFICATION}>Pending Verification</option>
                      <option value={BookingStatus.PENDING_PAYMENT}>Pending Payment</option>
                      <option value={BookingStatus.PENDING_CONTRACT}>Pending Contract</option>
                      <option value={BookingStatus.CONFIRMED}>Confirmed</option>
                      <option value={BookingStatus.OCCUPIED}>Occupied</option>
                      <option value={BookingStatus.COMPLETED}>Completed</option>
                      <option value={BookingStatus.CANCELLED}>Cancelled</option>
                    </select>
                  </div>

                  {/* Room & Bed Space Reassignment */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Assigned Bed Space & Accommodation</label>
                    <select
                      value={editFormData.selectedSpaceId}
                      onChange={(e) => handleSpaceChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-bold focus:ring-2 focus:ring-brand-500"
                    >
                      {ALL_ROOM_SPACES.map(space => (
                        <option key={space.id} value={space.id}>
                          {space.displayName} ({space.category} • {getAccommodationAddress(space.category)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Expected Arrival Date */}
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Expected Arrival Date</label>
                    <input
                      type="date"
                      value={editFormData.expected_arrival_date}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, expected_arrival_date: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-medium focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Total Price */}
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Total Price ($ USD)</label>
                    <input
                      type="number"
                      value={editFormData.total_price}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, total_price: Number(e.target.value) }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-bold text-brand-600 focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Duration of Stay */}
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Duration of Stay</label>
                    <input
                      type="text"
                      value={editFormData.duration_of_stay}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, duration_of_stay: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-medium focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={editFormData.emergency_contact_details}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, emergency_contact_details: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-medium focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                  >
                    {isProcessing ? 'Saving Changes...' : 'Save Updated Booking'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: DOCUMENTS & PROOFS */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Tenancy Agreement */}
                  <div className="bg-gray-50 dark:bg-gray-900/60 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      📄 Signed Tenancy Agreement
                    </h4>
                    {booking.signature_data ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                          <img src={booking.signature_data} alt="Tenant Signature" className="max-h-16 mx-auto object-contain" />
                          <p className="text-[10px] text-gray-500 mt-2 font-mono">
                            Signed: {booking.contract_signed_at ? new Date(booking.contract_signed_at).toLocaleString() : 'Yes'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewingAgreement(true)}
                          className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                        >
                          View Full Tenancy Document ↗
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No signature recorded on file yet.</p>
                    )}
                  </div>

                  {/* Passport Document */}
                  <div className="bg-gray-50 dark:bg-gray-900/60 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      🛂 Passport Identification
                    </h4>
                    {booking.passport_copy_url && booking.passport_copy_url !== 'pending_digital_sign' ? (
                      <a
                        href={booking.passport_copy_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block p-4 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 font-bold text-xs hover:underline text-center"
                      >
                        Open Passport Document Copy ↗
                      </a>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Digitally verified via passport registration form ({booking.passport_number || 'N/A'}).</p>
                    )}
                  </div>
                </div>

                {/* Payment Proof Receipt */}
                <div className="bg-gray-50 dark:bg-gray-900/60 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    💳 Remittance / Deposit Payment Proof
                  </h4>
                  {booking.payment_proof_url ? (
                    <div className="space-y-3">
                      {booking.payment_proof_url.toLowerCase().endsWith('.pdf') ? (
                        <a
                          href={booking.payment_proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 p-4 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 font-bold text-xs hover:underline"
                        >
                          <IconFile className="w-4 h-4" /> Open Payment Proof PDF Receipt ↗
                        </a>
                      ) : (
                        <div className="max-w-md mx-auto rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                          <img src={booking.payment_proof_url} alt="Payment Proof" className="w-full h-auto max-h-64 object-contain" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center text-xs text-gray-400">
                      No deposit payment receipt uploaded yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Destructive & Administrative Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleReject}
                disabled={isProcessing || booking.status === BookingStatus.CANCELLED}
                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold transition disabled:opacity-40"
              >
                Reject Booking
              </button>

              <button
                type="button"
                onClick={handleEvictOrDiscontinue}
                disabled={isProcessing || booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold transition disabled:opacity-40"
              >
                Evict / Discontinue Residency
              </button>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex items-center gap-2">
              {booking.status === BookingStatus.PENDING_VERIFICATION && (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                >
                  <IconCheck className="w-4 h-4" /> Approve & Confirm
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Agreement Modal for Full Agreement View */}
      {viewingAgreement && (
        <AgreementModal
          booking={booking}
          onClose={() => setViewingAgreement(false)}
        />
      )}
    </>
  );
};

export default EditBookingModal;
