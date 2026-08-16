import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { IconCreditCard, IconBuilding, IconCheckCircle, IconCalendar } from '../components/Icon';
import InvoiceView from '../components/InvoiceView';
import { Booking, BookingStatus } from '../types';

const BillingPage: React.FC = () => {
  const { user, bookings, landlordDetails, setPage } = useApp();
  const [selectedInvoice, setSelectedInvoice] = useState<Booking | null>(null);

  const userBookings = (bookings || []).filter(b => b.student_id === user?.id);

  return (
    <div className="animate-fade-in space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 text-xs font-black uppercase tracking-widest mb-1">
          <IconCreditCard className="w-4 h-4" /> Financial Overview
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Payment & Billing</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Official bank transfer channels, remittance instructions, payment history, and invoices.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Invoices & Receipts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center justify-between">
              <span>Your Invoices & Receipts</span>
              <button 
                onClick={() => setPage('my-bookings')}
                className="text-brand-600 dark:text-brand-400 font-bold text-xs hover:underline"
              >
                Go to My Bookings →
              </button>
            </h2>

            {userBookings.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-400">
                No billing records or invoices found for your account.
              </div>
            ) : (
              <div className="space-y-3">
                {userBookings.map(b => (
                  <div 
                    key={b.id} 
                    className="p-4 rounded-xl bg-gray-50 dark:bg-gray-750 flex items-center justify-between gap-4 border border-gray-100 dark:border-gray-700"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-brand-600">BK{b.id}</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {b.rooms?.apartment_name || 'Al-Ibaanah Residency'} ({b.rooms?.type || 'Room'})
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Duration: {b.duration_of_stay || 'Semester'} | Amount: <span className="font-bold text-gray-800 dark:text-gray-200">${b.total_price || 0} USD</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedInvoice(b)}
                        className="px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-brand-600 dark:text-brand-400 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-bold shadow-sm transition-colors"
                      >
                        {b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.OCCUPIED ? 'Receipt' : 'Invoice'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Official Payment Channels */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
              <span>🏦</span> Official Payment Methods
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              We accept international bank wire, local Egypt bank transfer, InstaPay, or cash payment upon arrival with prior confirmation.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Bank Name</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{landlordDetails?.bankName || 'Banque Misr / CIB Egypt'}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Account Beneficiary</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{landlordDetails?.recipientName || 'Al-Ibaanah Housing Administration'}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">IBAN / Account Number</span>
                <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{landlordDetails?.iban || 'EG1200020001000000123456789'}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Swift Code</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{landlordDetails?.swiftCode || 'BMISEGCX'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed border border-amber-200/50">
              ⚠️ <strong>Important:</strong> Always include your Room Name (e.g. <code>Premium 1 - Room 1</code>) in the transfer reference notes so our accounts department can verify your payment immediately.
            </div>
          </div>
        </div>
      </div>

      {selectedInvoice && (
        <InvoiceView 
          booking={selectedInvoice} 
          onClose={() => setSelectedInvoice(null)} 
          isReceipt={selectedInvoice.status === BookingStatus.CONFIRMED || selectedInvoice.status === BookingStatus.OCCUPIED} 
        />
      )}
    </div>
  );
};

export default BillingPage;
