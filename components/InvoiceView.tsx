
import React from 'react';
import { Booking, BookingStatus } from '../types';
import { IconBuilding, IconClose } from './Icon';

interface InvoiceViewProps {
  booking: Booking;
  onClose: () => void;
  isReceipt?: boolean;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ booking, onClose, isReceipt }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <IconClose className="w-6 h-6" />
        </button>
        
        <div className="p-8 md:p-12 overflow-y-auto max-h-[85vh]">
          {/* Header */}
          <div className="flex justify-between items-start mb-10 border-b pb-8 dark:border-gray-800">
            <div className="flex items-center">
              <IconBuilding className="w-12 h-12 text-blue-600 mr-4" />
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
              <p className="text-sm font-bold text-blue-600">#{isReceipt ? 'RC' : 'INV'}{booking.id}</p>
              <p className="text-xs text-gray-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Bill To */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Student Details</h3>
              <p className="font-bold text-gray-900 dark:text-white">{booking.student_name}</p>
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
                <td className="py-6 text-center text-sm font-medium">3 Months</td>
                <td className="py-6 text-right font-bold text-gray-900 dark:text-white">${booking.total_price.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Footer Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-[200px] space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal:</span>
                <span className="font-bold">${booking.total_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount:</span>
                <span className="font-bold text-green-600">-$0.00</span>
              </div>
              <div className="flex justify-between text-lg border-t pt-2 dark:border-gray-800">
                <span className="font-black">Total:</span>
                <span className="font-black text-blue-600">${booking.total_price.toFixed(2)}</span>
              </div>
            </div>
          </div>

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
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg"
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
  );
};

export default InvoiceView;
