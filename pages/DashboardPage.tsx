import React, { useState, useMemo } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import BookingStatusBadge from '../components/BookingStatusBadge';
import { Booking, BookingStatus } from '../types';
import { useApp } from '../hooks/useApp';
import InvoiceView from '../components/InvoiceView';
import { 
  IconBuilding, 
  IconCheck, 
  IconChevronRight 
} from '../components/Icon';
import PaymentProofModal from '../components/PaymentProofModal';
import { supabase } from '../lib/supabaseClient';
import AgreementModal from '../components/AgreementModal';
import { sendEmail, getAgreementSignedTemplate } from '../lib/email';
import { formatStoredRoomString, getParsedRoomSpaces, getAccommodationAddress } from '../lib/roomNaming';
import JoinWaitlistModal from '../components/JoinWaitlistModal';

const DashboardPage: React.FC = () => {
  const t = useTranslation();
  const { user, bookings, effectiveOccupancyBookings, setPage, cmsContent, addActivity, updateBooking, language, rooms, landlordDetails, accommodationAddresses } = useApp();
  
  const [selectedInvoice, setSelectedInvoice] = useState<Booking | null>(null);
  const [viewingAgreement, setViewingAgreement] = useState<Booking | null>(null);
  const [signingBooking, setSigningBooking] = useState<Booking | null>(null);
  const [uploadingProofBooking, setUploadingProofBooking] = useState<Booking | null>(null);
  
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<'All' | 'Standard' | 'Premium 1' | 'Premium 2'>('All');
  const [waitlistModalConfig, setWaitlistModalConfig] = useState<{
    isOpen: boolean;
    category: 'Standard' | 'Premium 1' | 'Premium 2';
    type: 'Shared' | 'Private';
    spaceLabel?: string;
  }>({
    isOpen: false,
    category: 'Standard',
    type: 'Shared',
  });
  
  const userBookings = (bookings || []).filter(b => b.student_id === user?.id);
  const activeBooking = userBookings.find(b => b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.COMPLETED) || userBookings[0];
  const announcements = cmsContent.announcements?.[language] || cmsContent.announcements?.['en'] || [];

  // Determine which rooms/beds are currently occupied based on effective occupancy data
  const parsedAvailabilityData = useMemo(() => {
    return getParsedRoomSpaces(rooms, effectiveOccupancyBookings);
  }, [effectiveOccupancyBookings, rooms]);

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

      updateBooking(signingBooking.id, {
        signature_data: signatureData,
        contract_signed_at: signedAt,
        status: nextStatus
      });

      const template = getAgreementSignedTemplate(user?.full_name || 'Student', signingBooking.id);
      sendEmail({
        to: user?.email || signingBooking.email || '',
        subject: template.subject,
        body: template.body
      }).catch(err => console.error("Failed to send signed contract email:", err));

      addActivity({
        user_id: user!.id,
        type: 'contract',
        description: `Digitally signed tenancy agreement for booking BK${signingBooking.id}`,
        timestamp: new Date().toISOString()
      });

      alert(t.dash_alert_contract_signed || "Contract signed successfully!");
      setSigningBooking(null);
    } catch (error: any) {
      alert((t.dash_alert_contract_failed || "Failed to sign contract: {error}").replace('{error}', error.message));
    }
  };

  const handleUploadProof = async (url: string) => {
    if (!uploadingProofBooking) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          payment_proof_url: url,
          payment_proof_uploaded_at: new Date().toISOString(),
          status: BookingStatus.PENDING_PAYMENT
        })
        .eq('id', uploadingProofBooking.id);

      if (error) throw error;

      updateBooking(uploadingProofBooking.id, {
        payment_proof_url: url,
        payment_proof_uploaded_at: new Date().toISOString(),
        status: BookingStatus.PENDING_PAYMENT
      });

      sendEmail({
        to: landlordDetails?.adminEmail || 'sheriffdeenalade@gmail.com',
        subject: `[Admin Alert] Receipt Uploaded for BK${uploadingProofBooking.id}`,
        body: `Dear Admin,\n\nStudent ${user?.full_name || 'Student'} has uploaded a payment proof for booking BK${uploadingProofBooking.id}.\n\nPlease review the upload in the Admin panel.\nReceipt URL: ${url}`
      }).catch(err => console.error("Failed to notify admin of payment proof:", err));

      addActivity({
        user_id: user!.id,
        type: 'payment',
        description: `Uploaded payment proof for BK${uploadingProofBooking.id}`,
        timestamp: new Date().toISOString()
      });

      alert(t.dash_alert_proof_uploaded || "Payment proof uploaded successfully! Our team will verify it shortly.");
      setUploadingProofBooking(null);
    } catch (error: any) {
      alert((t.dash_alert_proof_failed || "Failed to upload proof: {error}").replace('{error}', error.message));
    }
  };

  return (
    <div className="animate-fade-in space-y-12 pb-16">
      {/* 1. Welcome & Active Residency Status Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-brand-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden text-start">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-black uppercase tracking-wider border border-brand-500/30">
            <span>✨</span> {t.dash_hub_badge || "Student Residency Hub"}
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            {(t.dash_welcome_greeting || "Welcome back, {name}").replace('{name}', user?.full_name || 'Student')}
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
            {t.dash_hub_subtitle || "Manage your Al-Ibaanah housing stay, view live room vacancies, download your executed tenancy agreements, and track rent schedules."}
          </p>

          {/* Quick Active Booking Snapshot (if student has booking) */}
          {activeBooking ? (
            <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-brand-300">{t.dash_active_residency_label || "Active Residency:"}</span>
                  <span className="text-xs font-bold text-white">
                    {activeBooking.rooms?.apartment_name || 'Residency'} – {formatStoredRoomString(activeBooking.rooms?.room_number)}
                  </span>
                  <BookingStatusBadge status={activeBooking.status} />
                </div>
                <p className="text-[11px] text-gray-300">
                  {(t.dash_active_residency_details || "Stay: {duration} | Lease Expiry: {date}")
                    .replace('{duration}', activeBooking.duration_of_stay || 'Semester')
                    .replace('{date}', activeBooking.end_date ? new Date(activeBooking.end_date).toLocaleDateString() : 'Active')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedInvoice(activeBooking)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all"
                >
                  {activeBooking.status === BookingStatus.CONFIRMED || activeBooking.status === BookingStatus.OCCUPIED ? (t.dash_btn_view_receipt || 'View Receipt') : (t.dash_btn_view_invoice || 'View Invoice')}
                </button>

                <button
                  onClick={() => setViewingAgreement(activeBooking)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-400/40 text-xs font-bold transition-all"
                >
                  {t.dash_btn_view_agreement || "View Agreement"}
                </button>

                <button
                  onClick={() => setPage('my-bookings')}
                  className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-black shadow-md transition-all flex items-center gap-1"
                >
                  <span>{t.dash_btn_all_bookings || "All Bookings"}</span>
                  <IconChevronRight className="w-3 h-3 rtl:rotate-180" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setPage('booking')}
                className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <IconBuilding className="w-4 h-4" />
                <span>{t.dash_btn_book_now || "Book Your Room Now"}</span>
              </button>
              <div className="text-xs text-gray-300 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
                ✨ {t.dash_distance_enrolment_badge || "Distance Enrolment: Secure residency to verify course enrolment instantly."}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. CMS Announcements */}
      {announcements.length > 0 && (
        <section className="space-y-4 text-start">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <span>📢</span> {t.dash_announcements_title || "Residency Announcements"}
            </h2>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.dash_tag_office_updates || "Office Updates"}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map(ann => (
              <div key={ann.id} className="bg-brand-50/70 dark:bg-brand-900/20 p-5 rounded-2xl border border-brand-100 dark:border-brand-800 shadow-sm relative overflow-hidden">
                <h3 className="font-bold text-sm text-brand-900 dark:text-brand-200 mb-1">{ann.title}</h3>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{ann.content}</p>
                <p className="text-[10px] text-brand-600/70 dark:text-brand-400/70 mt-3 font-bold uppercase tracking-wider">
                  {new Date(ann.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Live Residency Space Overview & Occupancy Metrics */}
      <section className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6 text-start">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
          <div>
            <h2 className="text-lg font-black text-gray-950 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <span>🏨</span> {t.dash_live_spaces_title || "Live Residency Space Overview"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{t.dash_live_spaces_sub || "Real-time vacancy metrics across all residency apartments."}</p>
          </div>
          
          {/* Tabs filter */}
          <div className="flex flex-wrap gap-1.5">
            {(['All', 'Premium 1', 'Premium 2', 'Standard'] as const).map(cat => {
              const getFilterLabel = (category: string) => {
                if (category === 'All') return t.dash_filter_all || 'All';
                if (category === 'Premium 1') return t.dash_filter_premium1 || 'Premium 1';
                if (category === 'Premium 2') return t.dash_filter_premium2 || 'Premium 2';
                if (category === 'Standard') return t.dash_filter_standard || 'Standard';
                return category;
              };

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedFilterCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedFilterCategory === cat
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {getFilterLabel(cat)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Space list grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredAvailabilityData.map(space => (
            <div
              key={space.id}
              className={`p-4 rounded-2xl border text-xs leading-relaxed transition-all ${
                space.isOccupied
                  ? 'bg-gray-50/70 dark:bg-gray-900/40 border-gray-200/70 dark:border-gray-700 text-gray-500'
                  : 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-black text-[10px] tracking-wider uppercase text-gray-400 dark:text-gray-500 block">{space.category}</span>
                  <strong className={`text-sm ${space.isOccupied ? 'text-gray-800 dark:text-gray-200' : 'text-emerald-950 dark:text-emerald-100 font-black'}`}>
                    {space.roomName}
                  </strong>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  space.isOccupied
                    ? 'bg-gray-200/70 dark:bg-gray-700 text-gray-500'
                    : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300/40'
                }`}>
                  {space.isOccupied ? (t.dash_badge_occupied || 'Occupied') : (t.dash_badge_vacant || 'Vacant')}
                </span>
              </div>
              
              <div className="space-y-1 text-[11px] text-gray-500 dark:text-gray-400">
                <p><span className="font-semibold text-gray-700 dark:text-gray-300">{t.dash_card_bed_space || "Bed Space:"}</span> {space.bedSpaceName}</p>
                <p><span className="font-semibold text-gray-700 dark:text-gray-300">{t.dash_card_format || "Format:"}</span> {(t.dash_card_room_type || "{type} Room").replace('{type}', space.type)}</p>
                <p className="text-[10px] text-gray-400 truncate" title={getAccommodationAddress(space.category, accommodationAddresses)}>
                  <span className="font-semibold text-gray-500">{t.dash_card_address || "Address:"}</span> {getAccommodationAddress(space.category, accommodationAddresses)}
                </p>
                {space.isOccupied ? (
                  <div className="pt-2 border-t border-gray-200/50 dark:border-gray-700/60 space-y-2">
                    <div className="space-y-0.5">
                      {space.booking?.end_date && (
                        <p className="text-red-600 dark:text-red-400 font-bold">
                          <span>{t.dash_card_lease_expiry || "Lease Expiry:"}</span> {space.nextAvailableDate}
                        </p>
                      )}
                      <p className="text-brand-600 dark:text-brand-400 font-bold">
                        <span>{t.dash_card_next_available || "Next Available:"}</span> {space.nextAvailableDate}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setWaitlistModalConfig({
                          isOpen: true,
                          category: space.category as any,
                          type: space.type,
                          spaceLabel: `${space.category} - ${space.roomName} (${space.bedSpaceName})`
                        });
                      }}
                      className="w-full py-1.5 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-bold text-[11px] transition-all flex items-center justify-center gap-1 border border-amber-200/60 dark:border-amber-800/40"
                    >
                      <span>⏳ {(t as any).dash_btn_join_waitlist || "Join Waitlist"}</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-emerald-100 dark:border-emerald-900/60 space-y-2">
                    <p className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <IconCheck className="w-3.5 h-3.5" /> {t.dash_card_available_now || "Available Now"}
                    </p>
                    <button
                      onClick={() => setPage('booking')}
                      className="w-full py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1 shadow-sm"
                    >
                      <span>{(t as any).dash_btn_book_space || "Book Bed Space"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modals */}
      <JoinWaitlistModal
        isOpen={waitlistModalConfig.isOpen}
        onClose={() => setWaitlistModalConfig(prev => ({ ...prev, isOpen: false }))}
        initialCategory={waitlistModalConfig.category}
        initialType={waitlistModalConfig.type}
        initialSpaceLabel={waitlistModalConfig.spaceLabel}
      />
      {selectedInvoice && (
        <InvoiceView 
          booking={selectedInvoice} 
          onClose={() => setSelectedInvoice(null)} 
          isReceipt={selectedInvoice.status === BookingStatus.CONFIRMED || selectedInvoice.status === BookingStatus.OCCUPIED} 
        />
      )}
      {viewingAgreement && (
        <AgreementModal 
          booking={viewingAgreement}
          onClose={() => setViewingAgreement(null)}
          isReadOnly={true}
        />
      )}
      {signingBooking && (
        <AgreementModal 
          booking={signingBooking}
          onSign={handleSignContract}
          onClose={() => setSigningBooking(null)}
        />
      )}
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
