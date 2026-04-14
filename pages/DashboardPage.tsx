
import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import BookingStatusBadge from '../components/BookingStatusBadge';
import { Booking, BookingStatus } from '../types';
import { useApp } from '../hooks/useApp';
import InvoiceView from '../components/InvoiceView';
import { IconBuilding } from '../components/Icon';
import ContractSigningModal from '../components/ContractSigningModal';
import PaymentProofModal from '../components/PaymentProofModal';
import { supabase } from '../lib/supabaseClient';

const DashboardPage: React.FC = () => {
  const t = useTranslation();
  const { user, bookings, activities, setPage, cmsContent, addActivity, updateBooking, language, rooms } = useApp();
  const [selectedInvoice, setSelectedInvoice] = useState<Booking | null>(null);
  const [signingBooking, setSigningBooking] = useState<Booking | null>(null);
  const [uploadingProofBooking, setUploadingProofBooking] = useState<Booking | null>(null);
  
  const userBookings = (bookings || []).filter(b => b.student_id === user?.id);
  const userActivities = (activities || []).filter(a => a.user_id === user?.id).slice(0, 5);
  const announcements = cmsContent.announcements?.[language] || [];

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
            Welcome back, <span className="font-semibold text-brand-600">{user?.full_name}</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bookings Section */}
        <div className="lg:col-span-2 space-y-6">
          {userBookings.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-inner border-2 border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">{t.noBookings}</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
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
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{booking.rooms.type}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Room {booking.rooms.room_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">{booking.duration_of_stay}</td>
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

                                {booking.status === BookingStatus.PENDING_PAYMENT && (
                                  <button 
                                    onClick={() => setUploadingProofBooking(booking)}
                                    className="text-accent-600 hover:text-accent-800 dark:text-accent-400 text-xs font-bold underline decoration-dotted text-left"
                                  >
                                    {t.uploadProof}
                                  </button>
                                )}

                                {(booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.OCCUPIED) && (
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
                                      onClick={() => window.open(booking.signature_data || '#', '_blank')}
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
              <button onClick={() => setPage('home')} className="w-full bg-brand-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-brand-700 transition-colors">
                {t.heroCTA}
              </button>
            </div>

            {/* Recent Activities Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
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
      {/* Contract Signing Modal */}
      {signingBooking && (
        <ContractSigningModal 
          contractText={cmsContent.contractTemplates[signingBooking.rooms.type]?.[signingBooking.contract_language || 'en'] || 'Contract template not found for this room type and language.'}
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