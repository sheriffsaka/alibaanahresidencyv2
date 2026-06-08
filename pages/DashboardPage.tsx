import React, { useState, useMemo } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import BookingStatusBadge from '../components/BookingStatusBadge';
import { Booking, BookingStatus } from '../types';
import { useApp } from '../hooks/useApp';
import InvoiceView from '../components/InvoiceView';
import { IconBuilding, IconCheck, IconCheckCircle } from '../components/Icon';
import PaymentProofModal from '../components/PaymentProofModal';
import { supabase } from '../lib/supabaseClient';
import AgreementModal from '../components/AgreementModal';
import { sendEmail, getAgreementSignedTemplate } from '../lib/email';

// Predefined Rooms structure matching MultiStepBookingForm precisely
const ALL_ROOM_SPACES = [
  // Premium 1
  { id: 'p1_r1_a', category: 'Premium 1', roomName: 'Room 1', bedSpaceName: 'Bed A', type: 'Shared' },
  { id: 'p1_r1_b', category: 'Premium 1', roomName: 'Room 1', bedSpaceName: 'Bed B', type: 'Shared' },
  { id: 'p1_r2', category: 'Premium 1', roomName: 'Room 2', bedSpaceName: 'Single', type: 'Private' },
  { id: 'p1_r3', category: 'Premium 1', roomName: 'Room 3', bedSpaceName: 'Single', type: 'Private' },
  // Premium 2
  { id: 'p2_r1_a', category: 'Premium 2', roomName: 'Room 1', bedSpaceName: 'Bed A', type: 'Shared' },
  { id: 'p2_r1_b', category: 'Premium 2', roomName: 'Room 1', bedSpaceName: 'Bed B', type: 'Shared' },
  { id: 'p2_r2', category: 'Premium 2', roomName: 'Room 2', bedSpaceName: 'Single', type: 'Private' },
  { id: 'p2_r3', category: 'Premium 2', roomName: 'Room 3', bedSpaceName: 'Single', type: 'Private' },
  // Standard
  { id: 'std_r1_a', category: 'Standard', roomName: 'Room 1', bedSpaceName: 'Bed A', type: 'Shared' },
  { id: 'std_r1_b', category: 'Standard', roomName: 'Room 1', bedSpaceName: 'Bed B', type: 'Shared' },
  { id: 'std_r2_a', category: 'Standard', roomName: 'Room 2', bedSpaceName: 'Bed A', type: 'Shared' },
  { id: 'std_r2_b', category: 'Standard', roomName: 'Room 2', bedSpaceName: 'Bed B', type: 'Shared' },
  { id: 'std_r3', category: 'Standard', roomName: 'Room 3', bedSpaceName: 'Single', type: 'Private' },
  { id: 'std_r4_a', category: 'Standard', roomName: 'Room 4', bedSpaceName: 'Bed A', type: 'Shared' },
  { id: 'std_r4_b', category: 'Standard', roomName: 'Room 4', bedSpaceName: 'Bed B', type: 'Shared' },
];

const DashboardPage: React.FC = () => {
  const t = useTranslation();
  const { user, bookings, activities, setPage, cmsContent, addActivity, updateBooking, language, rooms } = useApp();
  
  const [selectedInvoice, setSelectedInvoice] = useState<Booking | null>(null);
  const [viewingAgreement, setViewingAgreement] = useState<Booking | null>(null);
  const [signingBooking, setSigningBooking] = useState<Booking | null>(null);
  const [uploadingProofBooking, setUploadingProofBooking] = useState<Booking | null>(null);
  
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<'All' | 'Standard' | 'Premium 1' | 'Premium 2'>('All');

  const userBookings = (bookings || []).filter(b => b.student_id === user?.id);
  const userActivities = (activities || []).filter(a => a.user_id === user?.id).slice(0, 5);
  const announcements = cmsContent.announcements?.[language] || [];

  // Determine which rooms/beds are currently occupied based on all system bookings
  const parsedAvailabilityData = useMemo(() => {
    return ALL_ROOM_SPACES.map(space => {
      // Find active booking that has reserved/occupied this room spacing representation
      const targetRoomString = `${space.category} - ${space.roomName} (${space.bedSpaceName})`;
      const activeBooking = bookings?.find(b => 
        b.status !== BookingStatus.CANCELLED && 
        (b.rooms?.room_number === targetRoomString || b.rooms?.room_number?.includes(targetRoomString))
      );

      return {
        ...space,
        isOccupied: !!activeBooking,
        occupantName: activeBooking ? activeBooking.full_name : null,
        status: activeBooking ? activeBooking.status : null
      };
    });
  }, [bookings]);

  const filteredAvailabilityData = useMemo(() => {
    if (selectedFilterCategory === 'All') return parsedAvailabilityData;
    return parsedAvailabilityData.filter(item => item.category === selectedFilterCategory);
  }, [parsedAvailabilityData, selectedFilterCategory]);

  const handleSignContract = async (signatureData: string) => {
    if (!signingBooking) return;

    try {
      const signedAt = new Date().toISOString();
      const nextStatus = signingBooking.status === BookingStatus.PENDING_CONTRACT 
        ? BookingStatus.PENDING_PAYMENT 
        : signingBooking.status;

      const { error } = await supabase
        .from('bookings')
        .update({
          signature_data: signatureData,
          contract_signed_at: signedAt,
          status: nextStatus
        })
        .eq('id', signingBooking.id);

      if (error) throw error;

      // Update local state immediately
      updateBooking(signingBooking.id, {
        signature_data: signatureData,
        contract_signed_at: signedAt,
        status: nextStatus
      });

      addActivity({
        user_id: user!.id,
        type: 'system',
        description: `Signed residency agreement for BK${signingBooking.id}`,
        timestamp: signedAt
      });

      // Send email notification to student
      const emailTemplate = getAgreementSignedTemplate(signingBooking.full_name, signingBooking.id);
      sendEmail({
        to: signingBooking.email,
        subject: emailTemplate.subject,
        body: emailTemplate.body
      }).catch(err => console.error("Failed to send signature email:", err));

      // Send email notification to admin
      sendEmail({
        to: 'admin@alibaanah.com',
        subject: `Tenancy Agreement Signed - (BK${signingBooking.id})`,
        body: `A tenancy agreement has been signed by ${signingBooking.full_name} for BK${signingBooking.id}.\n\nPlease review it in the admin dashboard.`
      }).catch(err => console.error("Failed to send admin email:", err));

      alert("Contract signed successfully!");
      setSigningBooking(null);
    } catch (error: any) {
      alert(`Failed to sign contract: ${error.message}`);
    }
  };

  const handleUploadProof = async (url: string) => {
    if (!uploadingProofBooking) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          payment_proof_url: url,
          status: BookingStatus.PENDING_VERIFICATION
        })
        .eq('id', uploadingProofBooking.id);

      if (error) throw error;

      updateBooking(uploadingProofBooking.id, {
        payment_proof_url: url,
        status: BookingStatus.PENDING_VERIFICATION
      });

      addActivity({
        user_id: user!.id,
        type: 'payment',
        description: `Uploaded payment proof for BK${uploadingProofBooking.id}`,
        timestamp: new Date().toISOString()
      });

      alert("Payment proof uploaded successfully! Our team will verify it shortly.");
      setUploadingProofBooking(null);
    } catch (error: any) {
      alert(`Failed to upload proof: ${error.message}`);
    }
  };

  return (
    <div className="animate-fade-in space-y-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.dashboardTitle}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your residency and stay updated.</p>
        </div>
        <div className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
            Welcome back, <span className="font-semibold text-brand-600">{user?.full_name || 'Student'}</span>
          </div>
      </div>

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-brand-600">📢</span> Announcements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map(ann => (
              <div key={ann.id} className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-xl border border-brand-100 dark:border-brand-800 shadow-sm relative overflow-hidden">
                <h3 className="font-bold text-brand-800 dark:text-brand-300 mb-1">{ann.title}</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{ann.content}</p>
                <p className="text-[10px] text-brand-600/60 dark:text-brand-400/60 mt-3 font-bold uppercase">{new Date(ann.date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relocated Availability Overview Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-50 dark:border-gray-700 pb-4">
          <div>
            <h2 className="text-lg font-black text-gray-950 dark:text-white uppercase tracking-tight flex items-center gap-2">
              🏨 Live Residency Space Overview
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Real-time occupancy metrics of shared and private rooms.</p>
          </div>
          
          {/* Tabs filter */}
          <div className="flex flex-wrap gap-1">
            {(['All', 'Premium 1', 'Premium 2', 'Standard'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedFilterCategory === cat
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Space list grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredAvailabilityData.map(space => (
            <div
              key={space.id}
              className={`p-3.5 rounded-xl border text-xs leading-relaxed transition-all ${
                space.isOccupied
                  ? 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-200/60 text-gray-500'
                  : 'bg-emerald-50/10 dark:bg-emerald-950/10 border-emerald-100/50 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-extrabold text-[10px] tracking-wider uppercase text-gray-400 dark:text-gray-500 block">{space.category}</span>
                  <strong className={`text-sm ${space.isOccupied ? 'text-gray-700 dark:text-gray-300' : 'text-emerald-950 dark:text-emerald-100'}`}>
                    {space.roomName}
                  </strong>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  space.isOccupied
                    ? 'bg-gray-100 text-gray-400 border border-gray-200/50'
                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/50'
                }`}>
                  {space.isOccupied ? 'Occupied' : 'Vacant'}
                </span>
              </div>
              
              <div className="space-y-1 text-[11px] text-gray-500 dark:text-gray-400">
                <p><span className="font-semibold">Beds:</span> {space.bedSpaceName}</p>
                <p><span className="font-semibold">Type:</span> {space.type} Room</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bookings Section */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold uppercase tracking-wide text-gray-900 dark:text-white">My Bookings & Invoices</h2>
          {userBookings.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-inner border-2 border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">{t.noBookings}</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 animate-fade-in">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left rtl:text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.bookingId}</th>
                      <th scope="col" className="px-6 py-4 text-left rtl:text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.room}</th>
                      <th scope="col" className="px-6 py-4 text-left rtl:text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Duration</th>
                      <th scope="col" className="px-6 py-4 text-left rtl:text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Expiry</th>
                      <th scope="col" className="px-6 py-4 text-left rtl:text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.status}</th>
                      <th scope="col" className="px-6 py-4 text-left rtl:text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {userBookings.map((booking: Booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-600 dark:text-brand-400">BK{booking.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{booking.rooms?.type || 'Standard Room'}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{booking.rooms?.room_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700 dark:text-gray-350">{booking.duration_of_stay}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-red-600">{booking.payment_expiry_date ? new Date(booking.payment_expiry_date).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <BookingStatusBadge status={booking.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col space-y-2">
                                <button 
                                  onClick={() => setSelectedInvoice(booking)}
                                  className="text-brand-600 hover:text-brand-800 dark:text-brand-400 text-xs font-bold underline decoration-dotted text-left"
                                >
                                  {booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.OCCUPIED ? 'View Receipt' : 'View Invoice'}
                                </button>
                                
                                {booking.status === BookingStatus.PENDING_CONTRACT && (
                                  <button 
                                    onClick={() => setSigningBooking(booking)}
                                    className="text-purple-600 hover:text-purple-800 dark:text-purple-400 text-xs font-bold underline decoration-dotted text-left"
                                  >
                                    {t.signContract}
                                  </button>
                                )}

                                {(booking.status === BookingStatus.PENDING_PAYMENT || booking.status === BookingStatus.PENDING_VERIFICATION) && (
                                  <button 
                                    onClick={() => setUploadingProofBooking(booking)}
                                    className="text-accent-600 hover:text-accent-800 dark:text-accent-400 text-xs font-bold underline decoration-dotted text-left"
                                  >
                                    {t.uploadProof}
                                  </button>
                                )}

                                {(booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.OCCUPIED || booking.status === BookingStatus.PENDING_PAYMENT || booking.status === BookingStatus.PENDING_VERIFICATION) && (
                                  <>
                                    <button 
                                      onClick={() => {
                                        const room = rooms.find(r => r.id === booking.room_id);
                                        if (room) setPage('booking', room, booking);
                                      }}
                                      className="text-brand-600 hover:text-brand-800 dark:text-brand-400 text-xs font-bold underline decoration-dotted text-left"
                                    >
                                      Extend Booking
                                    </button>
                                    <button 
                                      onClick={() => setViewingAgreement(booking)}
                                      className="text-green-600 hover:text-green-800 dark:text-green-400 text-xs font-bold underline decoration-dotted text-left"
                                    >
                                      View Agreement
                                    </button>
                                  </>
                                )}
                            </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
           {/* Book New Accommodation Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 text-center">
              <IconBuilding className="w-12 h-12 text-brand-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">{t.bookNewAccommodation}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t.bookNewDescription}</p>
              <button onClick={() => setPage('home')} className="w-full bg-brand-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-brand-700 transition-colors animate-pulse">
                Explore & Book Now
              </button>
            </div>

            {/* Recent Activities Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 animate-fade-in">
              <h3 className="text-lg font-bold mb-6 flex items-center">
                <span className="mr-2">🕒</span> {t.recentActivities}
              </h3>
              <div className="space-y-6">
                {userActivities.map(activity => (
                  <div key={activity.id} className="flex gap-4 relative">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-brand-500 mt-2 z-10"></div>
                    <div className="absolute left-[3px] top-4 w-full h-[2px] bg-gray-100 dark:bg-gray-700 last:hidden"></div>
                    <div>
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-tight">{activity.description}</p>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">
                        {new Date(activity.timestamp).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
                {userActivities.length === 0 && (
                  <p className="text-sm text-gray-500 text-center italic">No recent activities found.</p>
                )}
              </div>
            </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <InvoiceView 
          booking={selectedInvoice} 
          onClose={() => setSelectedInvoice(null)} 
          isReceipt={selectedInvoice.status === BookingStatus.CONFIRMED || selectedInvoice.status === BookingStatus.OCCUPIED} 
        />
      )}
      {/* Agreement Modal */}
      {viewingAgreement && (
        <AgreementModal 
          booking={viewingAgreement}
          onClose={() => setViewingAgreement(null)}
          isReadOnly={true}
        />
      )}
      {/* Contract Signing Modal */}
      {signingBooking && (
        <AgreementModal 
          booking={signingBooking}
          onSign={handleSignContract}
          onClose={() => setSigningBooking(null)}
        />
      )}
      {/* Payment Proof Modal */}
      {uploadingProofBooking && (
        <PaymentProofModal 
          onUpload={handleUploadProof}
          onClose={() => setUploadingProofBooking(null)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
