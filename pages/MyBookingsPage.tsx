import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import BookingStatusBadge from '../components/BookingStatusBadge';
import { Booking, BookingStatus } from '../types';
import { useApp } from '../hooks/useApp';
import InvoiceView from '../components/InvoiceView';
import { IconBuilding, IconCalendar, IconFile, IconCheckCircle } from '../components/Icon';
import PaymentProofModal from '../components/PaymentProofModal';
import { supabase } from '../lib/supabaseClient';
import AgreementModal from '../components/AgreementModal';
import { sendEmail, getAgreementSignedTemplate, getPaymentProofUploadedAdminTemplate } from '../lib/email';
import { formatStoredRoomString, getDisplayFromRoom } from '../lib/roomNaming';

const MyBookingsPage: React.FC = () => {
  const t = useTranslation();
  const { user, bookings, activities, setPage, addActivity, updateBooking, rooms, landlordDetails } = useApp();
  
  const [selectedInvoice, setSelectedInvoice] = useState<Booking | null>(null);
  const [viewingAgreement, setViewingAgreement] = useState<Booking | null>(null);
  const [signingBooking, setSigningBooking] = useState<Booking | null>(null);
  const [uploadingProofBooking, setUploadingProofBooking] = useState<Booking | null>(null);
  
  const userBookings = (bookings || []).filter(b => b.student_id === user?.id);
  const userActivities = (activities || []).filter(a => a.user_id === user?.id).slice(0, 8);

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

      updateBooking(signingBooking.id, {
        signature_data: signatureData,
        contract_signed_at: signedAt,
        status: nextStatus
      });

      addActivity({
        user_id: user!.id,
        type: 'system',
        description: `Signed tenancy agreement for BK${signingBooking.id}`,
        timestamp: signedAt
      });

      const emailTemplate = getAgreementSignedTemplate(signingBooking.full_name, signingBooking.id);
      sendEmail({
        to: signingBooking.email,
        subject: emailTemplate.subject,
        body: emailTemplate.body,
        templateName: emailTemplate.templateName,
        metadata: { booking_id: signingBooking.id, type: 'agreement_signed' }
      }).then(res => {
        if (!res.success) {
          console.warn("[MyBookings Email] Signed contract student email delivery issue:", res.error);
        }
      }).catch(err => console.error("Failed to send signature email:", err));

      sendEmail({
        to: landlordDetails?.adminEmail || 'sheriffdeenalade@gmail.com',
        subject: `Tenancy Agreement Signed - (BK${signingBooking.id})`,
        body: `A tenancy agreement has been signed by ${signingBooking.full_name} for BK${signingBooking.id}.\n\nPlease review it in the admin dashboard.`,
        templateName: 'admin_agreement_alert',
        metadata: { booking_id: signingBooking.id, type: 'admin_agreement_alert' }
      }).then(res => {
        if (!res.success) {
          console.warn("[MyBookings Email] Admin notification delivery issue:", res.error);
        }
      }).catch(err => console.error("Failed to send admin email:", err));

      alert("Tenancy agreement signed successfully!");
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

      const adminAlertTpl = getPaymentProofUploadedAdminTemplate(user?.full_name || 'Student', uploadingProofBooking.id, url);
      sendEmail({
        to: landlordDetails?.adminEmail || 'sheriffdeenalade@gmail.com',
        subject: adminAlertTpl.subject,
        body: adminAlertTpl.body,
        templateName: adminAlertTpl.templateName,
        metadata: { booking_id: uploadingProofBooking.id, proof_url: url }
      }).then(res => {
        if (!res.success) {
          console.warn("[MyBookings Email] Payment proof admin alert delivery issue:", res.error);
        }
      }).catch(err => console.error("Failed to notify admin of payment proof:", err));

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
    <div className="animate-fade-in space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 text-xs font-black uppercase tracking-widest mb-1">
            <IconCalendar className="w-4 h-4" /> Residency Leases & Bookings
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">My Bookings & Invoices</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review your room reservations, tenancy contracts, payment proofs, and official receipts.
          </p>
        </div>
        <button
          onClick={() => setPage('booking')}
          className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
        >
          <IconBuilding className="w-4 h-4" />
          <span>Book New Accommodation</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bookings Table / Cards */}
        <div className="lg:col-span-2 space-y-6">
          {userBookings.length === 0 ? (
            <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-dashed border-gray-200 dark:border-gray-700 space-y-4">
              <div className="w-14 h-14 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 flex items-center justify-center mx-auto">
                <IconBuilding className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">No active bookings found</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                You do not have any room bookings registered under your account yet. Explore our student accommodation categories and secure your stay.
              </p>
              <button
                onClick={() => setPage('booking')}
                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow transition-all"
              >
                Browse & Book a Room
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th scope="col" className="px-6 py-3.5 text-left rtl:text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Booking ID</th>
                      <th scope="col" className="px-6 py-3.5 text-left rtl:text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Room Space</th>
                      <th scope="col" className="px-6 py-3.5 text-left rtl:text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Duration</th>
                      <th scope="col" className="px-6 py-3.5 text-left rtl:text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lease & Rent</th>
                      <th scope="col" className="px-6 py-3.5 text-left rtl:text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3.5 text-left rtl:text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                    {userBookings.map((booking: Booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-750 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-brand-600 dark:text-brand-400">
                          BK{booking.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs font-bold text-gray-900 dark:text-white">
                            {getDisplayFromRoom(booking.rooms) || booking.preferred_accommodation || booking.rooms?.type || 'Residency Room'}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">
                            {booking.rooms?.apartment_name || 'Al-Azhar Accommodation'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300 font-medium">
                          {booking.duration_of_stay || 'Semester'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs font-bold text-gray-900 dark:text-white">
                            Lease: {booking.end_date ? new Date(booking.end_date).toLocaleDateString() : 'Active'}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Rent: {booking.payment_expiry_date ? new Date(booking.payment_expiry_date).toLocaleDateString() : 'Upon Arrival'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          <BookingStatusBadge status={booking.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                          <div className="flex flex-col space-y-1.5">
                            <button 
                              onClick={() => setSelectedInvoice(booking)}
                              className="text-brand-600 hover:text-brand-800 dark:text-brand-400 font-bold underline decoration-dotted text-left rtl:text-right"
                            >
                              {booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.OCCUPIED ? 'View Receipt' : 'View Invoice'}
                            </button>
                            
                            {booking.status === BookingStatus.PENDING_CONTRACT && (
                              <button 
                                onClick={() => setSigningBooking(booking)}
                                className="text-purple-600 hover:text-purple-800 dark:text-purple-400 font-bold underline decoration-dotted text-left rtl:text-right"
                              >
                                {t.signContract}
                              </button>
                            )}

                            {(booking.status === BookingStatus.PENDING_PAYMENT || booking.status === BookingStatus.PENDING_VERIFICATION) && (
                              <button 
                                onClick={() => setUploadingProofBooking(booking)}
                                className="text-accent-600 hover:text-accent-800 dark:text-accent-400 font-bold underline decoration-dotted text-left rtl:text-right"
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
                                  className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-bold underline decoration-dotted text-left rtl:text-right"
                                >
                                  Extend Booking
                                </button>
                                <button 
                                  onClick={() => setViewingAgreement(booking)}
                                  className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 font-bold underline decoration-dotted text-left rtl:text-right"
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
          {/* Quick Support / Contact Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span>📞</span> Residency Front Desk
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
              Have questions regarding your lease duration, payment verification, or key collection?
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">WhatsApp Support</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">{landlordDetails?.phone || '+20 1030062440'}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Residency Email</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{landlordDetails?.adminEmail || 'admin@alibaanah.com'}</span>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🕒</span> Booking History & Updates
            </h3>
            <div className="space-y-4">
              {userActivities.map(activity => (
                <div key={activity.id} className="flex gap-3 relative text-xs">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-brand-500 mt-1.5"></div>
                  <div>
                    <p className="text-gray-800 dark:text-gray-200 font-medium">{activity.description}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(activity.timestamp).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
              {userActivities.length === 0 && (
                <p className="text-xs text-gray-400 italic text-center py-4">No recent activity logs.</p>
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

export default MyBookingsPage;
