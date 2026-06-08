
import React, { useEffect, useState } from 'react';
import { Booking, BookingStatus } from '../types';
import { IconClose } from './Icon';
import { useApp } from '../hooks/useApp';
import { useTranslation } from '../hooks/useTranslation';

interface InvoiceViewProps {
  booking: Booking;
  onClose: () => void;
  isReceipt?: boolean;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ booking, onClose, isReceipt }) => {
  const t = useTranslation();
  const { cmsContent } = useApp();
  const [paymentTab, setPaymentTab] = useState<'bank' | 'remitly'>('bank');

  useEffect(() => {
    // Automatically trigger print dialog when component mounts
    const timer = setTimeout(() => {
      window.print();
    }, 500); // Delay to allow content to render

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>{`
        @media print {
          body {
            visibility: hidden;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }
          #root {
            visibility: hidden !important;
          }
          .printable-invoice-container {
            visibility: visible !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            z-index: 9999 !important;
          }
          .printable-invoice-container > div {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .printable-invoice-container * {
            visibility: visible !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in backdrop-blur-sm printable-invoice-container">
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors no-print"
          >
            <IconClose className="w-6 h-6" />
          </button>
          
          <div className="p-8 md:p-12 overflow-y-auto max-h-[85vh]">
            {/* Header */}
            <div className="flex justify-between items-start mb-10 border-b pb-8 dark:border-gray-800">
              <div className="flex items-center">
                <img 
                  src={cmsContent.logoUrl} 
                  alt="Al-Ibaanah Logo" 
                  className="w-16 h-16 object-contain mr-4"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h2 className="text-xl font-bold">Al-Ibaanah Residence</h2>
                  <p className="text-xs text-gray-500">Nasr City, Cairo, Egypt</p>
                  <p className="text-xs text-gray-500">support@alibaanah.com</p>
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">
                  {isReceipt ? 'Receipt' : 'Invoice'}
                </h1>
                <p className="text-sm font-bold text-brand-600">#{isReceipt ? 'RC' : 'INV'}{booking.id}</p>
                <p className="text-xs text-gray-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Bill To */}
            <div className="grid grid-cols-2 gap-8 mb-10">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Student Details</h3>
                <p className="font-bold text-gray-900 dark:text-white">{booking.full_name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">ID: {booking.student_id.slice(0,8)}...</p>
              </div>
              <div className="text-right">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Payment Info</h3>
                <p className="text-sm text-gray-900 dark:text-white font-bold">Method: {booking.payment_method || 'Online'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status: {booking.status}</p>
              </div>
            </div>

            {/* Table */}
            <table className="w-full mb-10 border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-100 dark:border-gray-800">
                  <th className="py-4 text-left text-xs font-bold text-gray-400 uppercase">Description</th>
                  <th className="py-4 text-center text-xs font-bold text-gray-400 uppercase">Duration</th>
                  <th className="py-4 text-right text-xs font-bold text-gray-400 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                <tr>
                  <td className="py-6">
                    <p className="font-bold text-gray-900 dark:text-white">{booking.rooms.type} Room Stay</p>
                    <p className="text-xs text-gray-500">Room Number: {booking.rooms.room_number}</p>
                    <p className="text-xs text-gray-500">{new Date(booking.start_date).toLocaleDateString()} to {new Date(booking.end_date).toLocaleDateString()}</p>
                  </td>
                  <td className="py-6 text-center text-sm font-medium">{booking.duration_of_stay}</td>
                  <td className="py-6 text-right font-bold text-gray-900 dark:text-white">${booking.total_price?.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            {/* Footer Totals */}
            <div className="flex justify-end">
              <div className="w-full max-w-[200px] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal:</span>
                  <span className="font-bold">${booking.total_price?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount:</span>
                  <span className="font-bold text-green-600">-$0.00</span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2 dark:border-gray-800">
                  <span className="font-black">Total:</span>
                  <span className="font-black text-brand-600">${booking.total_price?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Bank Details for Pending Payment */}
            {booking.status === BookingStatus.PENDING_PAYMENT && (
              <div className="mt-10 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4 no-print border-b pb-3 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest">Select Payment Method</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPaymentTab('bank')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${paymentTab === 'bank' ? 'bg-amber-600 text-white shadow' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >
                      Bank Transfer
                    </button>
                    <button 
                      onClick={() => setPaymentTab('remitly')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${paymentTab === 'remitly' ? 'bg-brand-600 text-white shadow' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >
                      Remitly Transfer
                    </button>
                  </div>
                </div>

                {paymentTab === 'bank' ? (
                  <div className="space-y-4 text-xs font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded">Direct Bank Deposit</span>
                    </div>
                    <p className="text-sm">
                      Please transfer the billing amount of <span className="font-extrabold text-brand-600">${booking.total_price?.toFixed(2)} USD</span> using the official details:
                    </p>
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-xl space-y-2 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 uppercase font-bold text-[9px]">👤 Recipient Name:</span>
                        <span className="font-bold select-all text-gray-900 dark:text-white">Jimoh Bolakale Ajao</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 uppercase font-bold text-[9px]">🏛️ Bank Name:</span>
                        <span className="font-bold text-gray-900 dark:text-white">Commercial International Bank (CIB)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 uppercase font-bold text-[9px]">💳 IBAN:</span>
                        <span className="font-mono font-bold text-amber-600 select-all">EG98 0010 0109 0000 0100 0633 2816 7</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 uppercase font-bold text-[9px]">🔐 SWIFT / BIC:</span>
                        <span className="font-mono font-bold select-all">CIBEEGCXXXX</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 uppercase font-bold text-[9px]">📞 Phone Number:</span>
                        <span className="font-bold select-all">+20 1030062440</span>
                      </div>
                      <div className="pt-2 border-t border-gray-150 dark:border-gray-800 text-[10px] text-gray-500 leading-normal">
                        <span className="font-bold block text-gray-600 dark:text-gray-400">📍 Bank Address:</span>
                        71 Abou Dawood El Zahry Street, Off Makram Ebeid Street, Nasr City, Cairo, Egypt (P.O. Box 11341)
                      </div>
                      <div className="flex justify-between items-center border-t border-gray-150 dark:border-gray-800 pt-2">
                        <span className="text-gray-400 uppercase font-bold text-[9px]">Memo/Reference:</span>
                        <span className="font-bold font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-950 px-2 py-0.5 rounded">BK{booking.id} - {booking.full_name}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 rounded">Remitly Bank Deposit</span>
                    </div>
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-xl text-xs space-y-2 text-gray-700 dark:text-gray-300">
                      <h4 className="font-bold text-brand-800 dark:text-brand-300 text-xs">Steps to pay via Remitly:</h4>
                      <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                        <li>Go to <a href="https://www.remitly.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 font-bold underline select-all">www.remitly.com</a> or open the mobile app.</li>
                        <li>Select sending country and select <strong>Egypt</strong> as destination.</li>
                        <li>Enter the amount to send in equivalent of <span className="font-bold text-brand-600">${booking.total_price?.toFixed(2)} USD</span>. <span className="text-red-500 font-bold">⚠️ Send the equivalent in EGP (the account only accepts Egyptian Pounds).</span></li>
                        <li>Select delivery method: <strong>Bank Deposit</strong>.</li>
                        <li>Enter recipient bank details exactly:
                          <div className="bg-gray-50 dark:bg-gray-950 p-2.5 rounded border border-gray-200 dark:border-gray-850 grid grid-cols-2 gap-1 mt-1 font-medium text-[11px]">
                            <span className="text-gray-400">Account Name:</span>
                            <span className="font-bold text-right col-span-1">Jimoh Bolakale Ajao</span>
                            <span className="text-gray-400">Bank Name:</span>
                            <span className="font-bold text-right col-span-1">CIB</span>
                            <span className="text-gray-400">Bank Location:</span>
                            <span className="font-bold text-right col-span-1">Cairo</span>
                            <span className="text-gray-400">IBAN:</span>
                            <span className="font-mono font-bold text-right col-span-1 text-brand-600 dark:text-brand-400">EG320010010900000100063328094</span>
                          </div>
                        </li>
                        <li>Select pay method, review details, matching reference <strong>BK{booking.id}</strong>, and send.</li>
                      </ol>
                    </div>
                  </div>
                )}

                <div className="mt-6 text-[10px] text-brand-600 dark:text-brand-400 font-bold border-t border-gray-200 dark:border-gray-700 pt-4">
                  * After completing the payment, please upload your proof of payment on the dashboard for quick verification and key activation.
                </div>
              </div>
            )}

            {/* Terms */}
            <div className="mt-12 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-[10px] text-gray-500 leading-relaxed">
              <p className="font-bold mb-1">Terms & Conditions:</p>
              <p>1. This is a computer generated document and does not require a physical signature.</p>
              <p>2. Rent must be paid in full before check-in.</p>
              <p>3. Security deposit is refundable only if room is returned in good condition.</p>
            </div>
            
            <div className="mt-8 flex gap-4 no-print">
              <button 
                onClick={() => window.print()}
                className="flex-1 bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg"
              >
                Print / Download PDF
              </button>
              <button 
                onClick={onClose}
                className="flex-1 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceView;
