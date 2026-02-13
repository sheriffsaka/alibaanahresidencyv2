
import React, { useState, useMemo, ChangeEvent, useEffect } from 'react';
import { Room, PaymentMethod, AcademicTerm, BookingPackage, BookingStatus, Booking } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useApp } from '../hooks/useApp';
import { IconUpload } from './Icon';

interface BookingFormProps {
  room: Room;
}

const BookingForm: React.FC<BookingFormProps> = ({ room }) => {
  const t = useTranslation();
  const { user, setPage, addBooking, addActivity, academicTerms, bookingPackages } = useApp();
  
  const [selectedPackage, setSelectedPackage] = useState<BookingPackage | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<AcademicTerm | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.ONLINE);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to set default selections once data is loaded from context
  useEffect(() => {
    if (!selectedPackage && bookingPackages.length > 0) {
        setSelectedPackage(bookingPackages[0]);
    }
    if (!selectedTerm && academicTerms.length > 0) {
        setSelectedTerm(academicTerms[0]);
    }
  }, [bookingPackages, academicTerms, selectedPackage, selectedTerm]);

  const totalPrice = useMemo(() => {
    if (!selectedPackage) return 0;
    const basePrice = room.price_per_month * selectedPackage.duration_months;
    const discountAmount = basePrice * (Number(selectedPackage.discount_percentage) / 100);
    return basePrice - discountAmount;
  }, [room.price_per_month, selectedPackage]);
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPaymentProof(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setPage('auth');
      return;
    }
    
    if (!selectedTerm || !selectedPackage) {
      setError("Please select an academic term and a booking package.");
      return;
    }

    if (paymentMethod === PaymentMethod.BANK_TRANSFER && !paymentProof) {
        setError("Please upload proof of payment for bank transfers.");
        return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    const bookingId = Math.floor(Math.random() * 9000) + 1000;
    const newBooking: Booking = {
        id: bookingId,
        student_id: user.id,
        student_name: user.full_name,
        room_id: room.id,
        academic_term_id: selectedTerm.id,
        booking_package_id: selectedPackage.id,
        start_date: selectedTerm.start_date,
        end_date: new Date(new Date(selectedTerm.start_date).setMonth(new Date(selectedTerm.start_date).getMonth() + selectedPackage.duration_months)).toISOString(),
        status: paymentMethod === PaymentMethod.BANK_TRANSFER ? BookingStatus.PENDING_VERIFICATION : BookingStatus.PENDING_PAYMENT,
        total_price: totalPrice,
        booked_at: new Date().toISOString(),
        payment_method: paymentMethod,
        payment_proof_url: paymentProof ? 'https://via.placeholder.com/800x1000.png?text=Student+Payment+Proof' : undefined,
        rooms: { room_number: room.room_number, type: room.type }
    };

    // In a real app, this would be an API call to a serverless function
    // For now, we simulate a delay
    setTimeout(() => {
        addBooking(newBooking);
        addActivity({
          user_id: user.id,
          type: 'booking',
          description: `Booked ${room.type} Room ${room.room_number} (BK${bookingId})`,
          timestamp: new Date().toISOString()
        });
        alert(t.bookingSuccess);
        setPage('dashboard');
        setIsSubmitting(false);
    }, 1500);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="academicTerm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.academicTerm}</label>
        <select
          id="academicTerm"
          value={selectedTerm?.id || ''}
          onChange={(e) => setSelectedTerm(academicTerms.find(term => term.id === parseInt(e.target.value)) || null)}
          className="mt-1 block w-full pl-3 pr-10 py-3 text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
          disabled={academicTerms.length === 0}
        >
          {academicTerms.length === 0 && <option>Loading terms...</option>}
          {academicTerms.map(term => (
              <option key={term.id} value={term.id}>{term.term_name} (Starts {new Date(term.start_date).toLocaleDateString()})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.selectPackage}</label>
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {bookingPackages.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg)}
              className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-all ${selectedPackage?.id === pkg.id ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'}`}
            >
              <div className="flex flex-1 flex-col">
                <span className="block text-sm font-bold text-gray-900 dark:text-white">{t.packageMonths.replace('{months}', pkg.duration_months.toString())}</span>
                {pkg.discount_percentage > 0 && <span className="mt-1 flex items-center text-xs font-bold text-green-600 dark:text-green-400">{t.packageDiscount.replace('{discount}', Number(pkg.discount_percentage).toString())}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center text-lg font-bold text-gray-900 dark:text-white">
            <span>{t.totalPrice}:</span>
            <span className="text-2xl text-blue-600 dark:text-blue-400">${totalPrice.toFixed(2)}</span>
          </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.paymentMethod}</label>
        <div className="mt-2 space-y-2">
            <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === PaymentMethod.ONLINE ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'dark:border-gray-600'}`}>
                <input type="radio" name="paymentMethod" value={PaymentMethod.ONLINE} checked={paymentMethod === PaymentMethod.ONLINE} onChange={() => setPaymentMethod(PaymentMethod.ONLINE)} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"/>
                <span className="ms-3 text-sm font-bold text-gray-700 dark:text-gray-300">{t.onlinePayment}</span>
            </label>
            <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === PaymentMethod.BANK_TRANSFER ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'dark:border-gray-600'}`}>
                <input type="radio" name="paymentMethod" value={PaymentMethod.BANK_TRANSFER} checked={paymentMethod === PaymentMethod.BANK_TRANSFER} onChange={() => setPaymentMethod(PaymentMethod.BANK_TRANSFER)} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"/>
                <span className="ms-3 text-sm font-bold text-gray-700 dark:text-gray-300">{t.bankTransfer}</span>
            </label>
        </div>
      </div>
      
      {paymentMethod === PaymentMethod.BANK_TRANSFER && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
          <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-3">{t.bankTransferInstructions}</p>
          <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-bold text-blue-600 hover:text-blue-500 border border-gray-300 dark:border-gray-600 p-3 flex items-center justify-center shadow-sm">
            <IconUpload className="w-5 h-5 me-2" />
            <span>{paymentProof ? paymentProof.name : t.uploadProof}</span>
            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,.pdf" />
          </label>
        </div>
      )}
      
      {error && <p className="text-sm text-red-500 font-bold mb-4">{error}</p>}
      
      <button 
        type="submit"
        disabled={isSubmitting || !selectedPackage || !selectedTerm}
        className="w-full flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform active:scale-95"
      >
        {isSubmitting ? 'Finalizing Your Room...' : t.confirmBooking}
      </button>
    </form>
  );
};

export default BookingForm;