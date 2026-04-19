
import React, { useRef, useState } from 'react';
import SignaturePad from 'react-signature-canvas';
import { useReactToPrint } from 'react-to-print';
import TenancyAgreementDocument from './TenancyAgreementDocument';
import { IconClose, IconSignature, IconCheck } from './Icon';
import { Booking } from '../types';

interface AgreementModalProps {
  booking: Booking;
  onSign?: (signatureData: string) => void;
  onClose: () => void;
  isReadOnly?: boolean;
}

const AgreementModal: React.FC<AgreementModalProps> = ({ booking, onSign, onClose, isReadOnly = false }) => {
  const [signature, setSignature] = useState<string | null>(booking.signature_data || null);
  const sigPadRef = useRef<SignaturePad>(null);
  const agreementRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: agreementRef,
    documentTitle: `Tenancy_Agreement_${booking.full_name?.replace(/\s+/g, '_') || 'Booking'}`,
  });

  const handleSignSubmit = () => {
    if (signature && onSign) {
      onSign(signature);
    }
  };

  // Convert booking data to formData structure expected by TenancyAgreementDocument
  const formData = {
    fullName: booking.full_name,
    nationality: booking.nationality,
    passportNumber: booking.passport_number,
    homeAddress: booking.address_in_egypt,
    whatsappNumber: booking.phone_number,
    email: booking.email,
    category: booking.rooms?.category || (booking.preferred_accommodation?.toLowerCase().includes('premium') ? 'Premium' : 'Standard'),
    apartment: booking.rooms?.apartment_name || '',
    roomType: booking.rooms?.type || booking.preferred_accommodation,
    duration: booking.duration_of_stay?.split(' ')[0],
    bookingId: booking.id,
  };

  const monthlyRate = booking.total_price && formData.duration 
    ? Math.round(booking.total_price / parseInt(formData.duration)) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-950 rounded-3xl shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col overflow-hidden border border-white/10">
        <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
              {isReadOnly ? 'Tenancy Agreement' : 'Review & Sign Agreement'}
            </h2>
            <p className="text-sm text-gray-500">Booking Reference: <span className="font-bold text-brand-600">BK{booking.id}</span></p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-all">
            <IconClose className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-100 dark:bg-black/40">
           <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-200">
              <TenancyAgreementDocument 
                ref={agreementRef}
                formData={formData}
                monthlyRate={monthlyRate}
                startDate={booking.start_date}
                endDate={booking.end_date}
                signature={signature || undefined}
              />
           </div>
        </div>

        <div className="p-6 border-t dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col md:flex-row items-center gap-6">
           {!isReadOnly && !booking.signature_data && (
             <div className="flex-1 w-full space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <IconSignature className="w-4 h-4 text-brand-600" /> Draw Signature
                  </label>
                  <button 
                    onClick={() => {
                        sigPadRef.current?.clear();
                        setSignature(null);
                    }}
                    className="text-[10px] font-bold text-red-500 uppercase"
                  >
                    Clear
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl h-24 relative overflow-hidden">
                    <SignaturePad 
                      ref={sigPadRef}
                      canvasProps={{className: "w-full h-full cursor-crosshair"}}
                      onEnd={() => {
                         const data = sigPadRef.current?.getTrimmedCanvas().toDataURL('image/png');
                         setSignature(data || null);
                      }}
                    />
                </div>
             </div>
           )}

           <div className="flex gap-4 w-full md:w-auto">
              <button 
                onClick={handlePrint}
                className="flex-1 md:flex-none px-8 py-4 border-2 border-gray-200 dark:border-gray-800 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                Download / Print PDF
              </button>
              
              {!isReadOnly && !booking.signature_data && (
                <button 
                  disabled={!signature}
                  onClick={handleSignSubmit}
                  className="flex-1 md:flex-none px-12 py-4 bg-brand-600 text-white rounded-xl font-black shadow-lg shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  Confirm & Sign
                </button>
              )}

              {isReadOnly && (
                <button 
                  onClick={onClose}
                  className="flex-1 md:flex-none px-12 py-4 bg-brand-600 text-white rounded-xl font-black transition-all"
                >
                  Close
                </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AgreementModal;
