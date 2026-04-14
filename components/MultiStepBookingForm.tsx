
import React, { useState, useMemo, useEffect } from 'react';
import { Room, BookingStatus, Booking, AccommodationType } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useApp } from '../hooks/useApp';
import { IconCheck, IconChevronRight, IconChevronLeft, IconInfo, IconSignature } from './Icon';
import { DocusealForm } from '@docuseal/react';

const MultiStepBookingForm: React.FC = () => {
  const t = useTranslation();
  const { user, setPage, addBooking, addActivity, rooms, bookings, selectedRoom, extendingBooking } = useApp();
  
  const [step, setStep] = useState(selectedRoom ? 4 : 1);
  const [formData, setFormData] = useState({
    category: extendingBooking?.rooms?.category || selectedRoom?.category || '' as 'Standard' | 'Premium' | '',
    apartment: extendingBooking?.rooms?.apartment_name || selectedRoom?.apartment_name || '',
    roomType: extendingBooking?.rooms?.type || selectedRoom?.type || '' as AccommodationType | '',
    duration: '',
    fullName: extendingBooking?.full_name || user?.full_name || '',
    nationality: extendingBooking?.nationality || '',
    passportNumber: extendingBooking?.passport_number || '',
    homeAddress: extendingBooking?.address_in_egypt || '',
    whatsappNumber: extendingBooking?.phone_number || '',
    email: extendingBooking?.email || user?.email || '',
    arrivalDate: extendingBooking?.end_date || '',
  });

  // If selectedRoom changes (e.g. user goes back and picks another), update form
  useEffect(() => {
    if (selectedRoom) {
      setFormData(prev => ({
        ...prev,
        category: selectedRoom.category,
        apartment: selectedRoom.apartment_name,
        roomType: selectedRoom.type
      }));
      setStep(4);
    }
  }, [selectedRoom]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<Booking | null>(null);
  const [isSigned, setIsSigned] = useState(false);

  // Filter logic
  const filteredApartments = useMemo(() => {
    if (!formData.category) return [];
    const apts = rooms
      .filter(r => r.category === formData.category)
      .map(r => r.apartment_name);
    return Array.from(new Set(apts));
  }, [rooms, formData.category]);

  const filteredRoomTypes = useMemo(() => {
    if (!formData.apartment) return [];
    const types = rooms
      .filter(r => r.apartment_name === formData.apartment)
      .map(r => r.type);
    return Array.from(new Set(types));
  }, [rooms, formData.apartment]);

  const selectedRoomData = useMemo(() => {
    if (!formData.apartment || !formData.roomType) return null;
    return rooms.find(r => r.apartment_name === formData.apartment && r.type === formData.roomType);
  }, [rooms, formData.apartment, formData.roomType]);

  const totalPrice = useMemo(() => {
    if (!selectedRoomData || !formData.duration) return 0;
    const months = parseInt(formData.duration) || 0;
    return selectedRoomData.price_per_month * months;
  }, [selectedRoomData, formData.duration]);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (!user) {
      setPage('auth');
      return;
    }

    if (!selectedRoomData) {
      setError("Please select a valid room.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const startDate = new Date(formData.arrivalDate);
      const months = parseInt(formData.duration) || 1;
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + months);

      const newBooking: Partial<Booking> = {
        student_id: user.id,
        room_id: selectedRoomData.id,
        start_date: formData.arrivalDate,
        end_date: endDate.toISOString().split('T')[0],
        status: BookingStatus.PENDING_CONTRACT,
        booked_at: new Date().toISOString(),
        full_name: formData.fullName,
        nationality: formData.nationality,
        passport_number: formData.passportNumber,
        passport_copy_url: 'pending_digital_sign', // Placeholder
        email: formData.email,
        phone_number: formData.whatsappNumber,
        expected_arrival_date: formData.arrivalDate,
        duration_of_stay: `${formData.duration} months`,
        preferred_accommodation: formData.roomType as AccommodationType,
        emergency_contact_details: 'Provided via DocuSeal',
        address_in_egypt: formData.homeAddress,
        total_price: totalPrice,
        parent_booking_id: extendingBooking?.id,
        rooms: { 
          room_number: selectedRoomData.room_number, 
          type: selectedRoomData.type,
          apartment_name: selectedRoomData.apartment_name,
          category: selectedRoomData.category
        },
      };

      const result = await addBooking(newBooking as Booking);
      if (!result.success) throw new Error(result.error);
      
      setBookingResult(result.data!);
      await addActivity({
        user_id: user.id,
        type: 'booking',
        description: `Started booking for ${selectedRoomData.apartment_name} - ${selectedRoomData.room_number}`,
        timestamp: new Date().toISOString()
      });
      
      nextStep(); // Move to Step 9: Digital Signing
    } catch (err: any) {
      setError(err.message || "Failed to submit booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: // Step 3: Choose Category
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Your Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CategoryCard 
                title="Standard" 
                desc="Comfortable living in Apartment 2. Great value for students." 
                price="From $180/mo"
                selected={formData.category === 'Standard'}
                onClick={() => setFormData({...formData, category: 'Standard', apartment: '', roomType: ''})}
              />
              <CategoryCard 
                title="Premium" 
                desc="Enhanced living in Apartment 1 or 3. Superior amenities and space." 
                price="From $250/mo"
                selected={formData.category === 'Premium'}
                onClick={() => setFormData({...formData, category: 'Premium', apartment: '', roomType: ''})}
              />
            </div>
            <div className="flex justify-end mt-8">
              <button 
                disabled={!formData.category}
                onClick={nextStep}
                className="flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50"
              >
                Next <IconChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 2: // Step 4: Choose Apartment
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Apartment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredApartments.map(apt => (
                <SelectionCard 
                  key={apt}
                  title={apt}
                  selected={formData.apartment === apt}
                  onClick={() => setFormData({...formData, apartment: apt, roomType: ''})}
                />
              ))}
            </div>
            <div className="flex justify-between mt-8">
              <button onClick={prevStep} className="flex items-center gap-2 text-gray-600 font-bold"><IconChevronLeft className="w-5 h-5" /> Back</button>
              <button 
                disabled={!formData.apartment}
                onClick={nextStep}
                className="flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50"
              >
                Next <IconChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 3: // Step 5: Choose Room Type
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Room Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRoomTypes.map(type => (
                <SelectionCard 
                  key={type}
                  title={type}
                  selected={formData.roomType === type}
                  onClick={() => setFormData({...formData, roomType: type as AccommodationType})}
                />
              ))}
            </div>
            <div className="flex justify-between mt-8">
              <button onClick={prevStep} className="flex items-center gap-2 text-gray-600 font-bold"><IconChevronLeft className="w-5 h-5" /> Back</button>
              <button 
                disabled={!formData.roomType}
                onClick={nextStep}
                className="flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50"
              >
                Next <IconChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 4: // Step 6: Choose Duration
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Duration of Stay</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['2', '4', '6', '12'].map(months => (
                <SelectionCard 
                  key={months}
                  title={`${months} Months`}
                  selected={formData.duration === months}
                  onClick={() => setFormData({...formData, duration: months})}
                />
              ))}
            </div>
            {selectedRoomData && formData.duration && (
              <div className="bg-brand-50 dark:bg-brand-900/20 p-6 rounded-xl border border-brand-100 dark:border-brand-800 mt-8">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Monthly Rate:</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">${selectedRoomData.price_per_month}</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-brand-100 dark:border-brand-800">
                  <span className="text-brand-800 dark:text-brand-200 font-bold">Total Price:</span>
                  <span className="text-3xl font-black text-brand-600">${totalPrice}</span>
                </div>
              </div>
            )}
            <div className="flex justify-between mt-8">
              <button onClick={prevStep} className="flex items-center gap-2 text-gray-600 font-bold"><IconChevronLeft className="w-5 h-5" /> Back</button>
              <button 
                disabled={!formData.duration}
                onClick={nextStep}
                className="flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50"
              >
                Next <IconChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 5: // Step 7: Personal Details
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Personal Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="Full Name (as in passport)" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              <InputField label="Nationality" value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})} />
              <InputField label="Passport Number" value={formData.passportNumber} onChange={e => setFormData({...formData, passportNumber: e.target.value})} />
              <InputField label="WhatsApp Number" value={formData.whatsappNumber} onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} />
              <InputField label="Email Address" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <InputField label="Expected Move-in Date" type="date" value={formData.arrivalDate} onChange={e => setFormData({...formData, arrivalDate: e.target.value})} />
              <div className="md:col-span-2">
                <InputField label="Home Address" value={formData.homeAddress} onChange={e => setFormData({...formData, homeAddress: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <button onClick={prevStep} className="flex items-center gap-2 text-gray-600 font-bold"><IconChevronLeft className="w-5 h-5" /> Back</button>
              <button 
                disabled={!formData.fullName || !formData.nationality || !formData.arrivalDate}
                onClick={nextStep}
                className="flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50"
              >
                Review Summary <IconChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 6: // Step 8: Review & Submit
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review Your Booking</h2>
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                <h3 className="font-bold text-brand-600 uppercase tracking-widest text-xs">Accommodation Summary</h3>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <SummaryItem label="Category" value={formData.category} />
                  <SummaryItem label="Apartment" value={formData.apartment} />
                  <SummaryItem label="Room Type" value={formData.roomType} />
                  <SummaryItem label="Duration" value={`${formData.duration} Months`} />
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-brand-600 uppercase tracking-widest text-xs">Personal Information</h3>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SummaryItem label="Name" value={formData.fullName} />
                  <SummaryItem label="WhatsApp" value={formData.whatsappNumber} />
                  <SummaryItem label="Move-in" value={formData.arrivalDate} />
                </div>
              </div>
              <div className="p-6 bg-brand-600 text-white flex justify-between items-center">
                <span className="text-lg font-medium">Total Amount Due</span>
                <span className="text-3xl font-black">${totalPrice}</span>
              </div>
            </div>
            {error && <p className="text-red-500 font-bold text-center">{error}</p>}
            <div className="flex justify-between mt-8">
              <button onClick={prevStep} className="flex items-center gap-2 text-gray-600 font-bold"><IconChevronLeft className="w-5 h-5" /> Back</button>
              <button 
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="flex items-center gap-2 bg-brand-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Confirm & Proceed to Signing'}
              </button>
            </div>
          </div>
        );

      case 7: // Step 9: Digital Signing
        return (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-100 text-brand-600 mb-4">
              <IconSignature className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Digital Tenancy Agreement</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Please review and sign your tenancy agreement below using DocuSeal. This is required to activate your distance enrolment eligibility.
            </p>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-4 border-brand-100 dark:border-brand-900 overflow-hidden shadow-2xl min-h-[600px] relative">
              {/* DocuSeal Embedded Form */}
              <DocusealForm
                src="https://www.docuseal.com/s/demo-template" // Replace with real template URL
                email={formData.email}
                onComplete={() => {
                  setIsSigned(true);
                  nextStep();
                }}
                values={{
                  'Full Name': formData.fullName,
                  'Nationality': formData.nationality,
                  'Passport Number': formData.passportNumber,
                  'Move-in Date': formData.arrivalDate,
                  'Apartment': formData.apartment,
                  'Room Type': formData.roomType,
                  'Duration': `${formData.duration} Months`,
                  'Total Price': `$${totalPrice}`
                }}
              />
            </div>
            
            <div className="flex justify-center mt-4">
               <button 
                onClick={nextStep}
                className="text-brand-600 font-bold hover:underline"
               >
                 Skip signing (Demo only)
               </button>
            </div>
          </div>
        );

      case 8: // Step 10: Confirmation Screen
        return (
          <div className="space-y-8 animate-fade-in text-center py-10">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 text-green-600 mb-4 shadow-inner">
              <IconCheck className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white">Agreement Received!</h2>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 max-w-2xl mx-auto space-y-6">
              <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                Your agreement has been received. Our team will contact you on <span className="text-brand-600 font-bold">WhatsApp within 24 hours</span> with deposit payment instructions via Remitly.
              </p>
              <div className="flex items-start gap-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl text-left">
                <IconInfo className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-blue-900 dark:text-blue-200">What happens next?</h4>
                  <ul className="mt-2 space-y-2 text-sm text-blue-800 dark:text-blue-300">
                    <li>1. Receive Remitly payment request on WhatsApp.</li>
                    <li>2. Pay the deposit to confirm your room.</li>
                    <li>3. Receive move-in details and enrolment activation.</li>
                  </ul>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setPage('dashboard')}
              className="bg-brand-600 text-white px-10 py-4 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all"
            >
              Go to My Dashboard
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      {step < 8 && (
        <div className="mb-12">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Step {step + 2} of 9</span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{Math.round(((step + 2) / 9) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-brand-600 h-full transition-all duration-500 ease-out"
              style={{ width: `${((step + 2) / 9) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
      {renderStep()}
    </div>
  );
};

const CategoryCard = ({ title, desc, price, selected, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`p-6 rounded-2xl border-2 text-left transition-all transform hover:scale-[1.02] ${
      selected 
        ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20 ring-4 ring-brand-600/10' 
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-300'
    }`}
  >
    <div className="flex justify-between items-start">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
      {selected && <IconCheck className="w-6 h-6 text-brand-600" />}
    </div>
    <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">{desc}</p>
    <p className="mt-4 font-bold text-brand-600">{price}</p>
  </button>
);

const SelectionCard = ({ title, selected, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`p-6 rounded-xl border-2 text-center font-bold transition-all ${
      selected 
        ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20 text-brand-600' 
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-brand-300'
    }`}
  >
    {title}
  </button>
);

const InputField = ({ label, type = 'text', ...props }: any) => (
  <div>
    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{label}</label>
    <input 
      type={type}
      {...props}
      className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
    />
  </div>
);

const SummaryItem = ({ label, value }: any) => (
  <div>
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
    <p className="text-gray-900 dark:text-white font-bold">{value || 'Not selected'}</p>
  </div>
);

export default MultiStepBookingForm;
