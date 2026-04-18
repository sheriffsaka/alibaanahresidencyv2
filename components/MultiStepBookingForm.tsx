
import React, { useState, useMemo, useEffect } from 'react';
import { Room, BookingStatus, Booking, AccommodationType } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useApp } from '../hooks/useApp';
import { 
  IconCheck, 
  IconChevronRight, 
  IconChevronLeft, 
  IconInfo, 
  IconSignature, 
  IconVideo, 
  IconCheckCircle 
} from './Icon';
import { DocusealForm } from '@docuseal/react';

import { TENANCY_AGREEMENT_TEMPLATE } from '../constants/tenancyAgreement';

const MultiStepBookingForm: React.FC = () => {
  const t = useTranslation();
  const { user, setPage, addBooking, addActivity, rooms, bookings, selectedRoom, extendingBooking } = useApp();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: '' as 'Standard' | 'Premium' | '',
    apartment: '',
    roomType: '' as AccommodationType | '',
    duration: '',
    fullName: '',
    nationality: '',
    passportNumber: '',
    homeAddress: '',
    whatsappNumber: '',
    email: '',
    arrivalDate: '',
  });

  // Sync with user and selectedRoom/extendingBooking
  useEffect(() => {
    if (extendingBooking) {
      setFormData(prev => ({
        ...prev,
        category: extendingBooking.rooms?.category || '',
        apartment: extendingBooking.rooms?.apartment_name || '',
        roomType: extendingBooking.rooms?.type || '',
        fullName: extendingBooking.full_name || user?.full_name || '',
        nationality: extendingBooking.nationality || '',
        passportNumber: extendingBooking.passport_number || '',
        homeAddress: extendingBooking.address_in_egypt || '',
        whatsappNumber: extendingBooking.phone_number || '',
        email: extendingBooking.email || user?.email || '',
        arrivalDate: extendingBooking.end_date || '',
      }));
      setStep(1); // Start from beginning but pre-filled
    } else if (selectedRoom) {
      setFormData(prev => ({
        ...prev,
        category: selectedRoom.category,
        apartment: selectedRoom.apartment_name,
        roomType: selectedRoom.type,
        fullName: prev.fullName || user?.full_name || '',
        email: prev.email || user?.email || '',
      }));
      setStep(1); // Always start from Step 1 for consistency
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.full_name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [selectedRoom, extendingBooking, user]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<Booking | null>(null);
  const [isSigned, setIsSigned] = useState(false);

  // Filter logic
  const filteredApartments = useMemo(() => {
    if (!formData.category) return [];
    const apts = rooms
      .filter(r => r.category?.toLowerCase() === formData.category.toLowerCase())
      .map(r => r.apartment_name)
      .filter(Boolean);
    return Array.from(new Set(apts));
  }, [rooms, formData.category]);

  const filteredRoomTypes = useMemo(() => {
    if (!formData.apartment) return [];
    const types = rooms
      .filter(r => r.apartment_name?.toLowerCase() === formData.apartment.toLowerCase())
      .map(r => r.type);
    return Array.from(new Set(types));
  }, [rooms, formData.apartment]);

  const selectedRoomData = useMemo(() => {
    if (!formData.apartment || !formData.roomType) return null;
    return rooms.find(r => 
      r.apartment_name.toLowerCase() === formData.apartment.toLowerCase() && 
      r.type.toLowerCase() === formData.roomType.toLowerCase()
    );
  }, [rooms, formData.apartment, formData.roomType]);

  const calculateMonthlyRate = (category: string, type: string, duration: string) => {
    const months = parseInt(duration) || 0;
    const isPrivate = type.toLowerCase().includes('private');
    
    if (category === 'Standard') {
      if (isPrivate) {
        if (months <= 2) return 300;
        if (months <= 4) return 285;
        if (months <= 6) return 270;
        return 260;
      } else {
        if (months <= 2) return 175;
        if (months <= 4) return 165;
        if (months <= 6) return 155;
        return 150;
      }
    } else { // Premium
      if (isPrivate) {
        if (months <= 2) return 350;
        if (months <= 4) return 330;
        if (months <= 6) return 315;
        return 300;
      } else {
        if (months <= 2) return 200;
        if (months <= 4) return 190;
        if (months <= 6) return 180;
        return 175;
      }
    }
  };

  const monthlyRate = useMemo(() => {
    if (!formData.category || !formData.roomType || !formData.duration) return 0;
    return calculateMonthlyRate(formData.category, formData.roomType, formData.duration);
  }, [formData.category, formData.roomType, formData.duration]);

  const totalPrice = useMemo(() => {
    if (!monthlyRate || !formData.duration) return 0;
    return monthlyRate * parseInt(formData.duration);
  }, [monthlyRate, formData.duration]);

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
                onClick={() => {
                  if (formData.category !== 'Standard') {
                    setFormData({...formData, category: 'Standard', apartment: '', roomType: ''});
                  }
                }}
              />
              <CategoryCard 
                title="Premium" 
                desc="Enhanced living in Apartment 1 or 3. Superior amenities and space." 
                price="From $250/mo"
                selected={formData.category === 'Premium'}
                onClick={() => {
                  if (formData.category !== 'Premium') {
                    setFormData({...formData, category: 'Premium', apartment: '', roomType: ''});
                  }
                }}
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

      case 2: // Step 3.5: Room Features (New)
        const categoryRooms = rooms.filter(r => r.category?.toLowerCase() === (formData.category || '').toLowerCase());
        const sampleRoom = categoryRooms[0];
        
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{formData.category} Residency Features</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Take a look at what's included in your selected category.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Gallery */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <IconInfo className="w-5 h-5 text-brand-600" /> Room Sections
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {(sampleRoom?.image_urls || [
                    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80',
                    'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=400&q=80',
                    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
                    'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=400&q=80'
                  ]).slice(0, 4).map((url, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden shadow-sm border dark:border-gray-700">
                      <img src={url} alt="Room section" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Video Tour */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <IconSignature className="w-5 h-5 text-brand-600" /> Video Tour
                </h3>
                <div className="aspect-video rounded-2xl overflow-hidden shadow-lg border-4 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
                  <iframe
                    className="w-full h-full"
                    src={sampleRoom?.video_urls?.[0] || "https://www.youtube.com/embed/dQw4w9WgXcQ"}
                    title="Room Tour"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-100 dark:border-brand-800">
                  <p className="text-sm text-brand-800 dark:text-brand-200 font-medium">
                    Note: This is a representative tour of the {formData.category} category. Individual apartments may vary slightly in layout.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={prevStep} className="flex items-center gap-2 text-gray-600 font-bold"><IconChevronLeft className="w-5 h-5" /> Back</button>
              <button 
                onClick={nextStep}
                className="flex items-center gap-2 bg-brand-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-brand-500 transition-all"
              >
                Continue to Select Apartment <IconChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 3: // Step 4: Choose Apartment
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Your Apartment</h2>
              <p className="text-sm text-gray-500">Each apartment has unique views and layouts.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredApartments.map(apt => {
                const representativeRoom = rooms.find(r => r.apartment_name === apt);
                return (
                  <ApartmentCard 
                    key={apt}
                    apartment={apt}
                    room={representativeRoom}
                    selected={formData.apartment === apt}
                    onClick={() => {
                      if (formData.apartment !== apt) {
                        setFormData({...formData, apartment: apt, roomType: ''});
                      }
                    }}
                  />
                );
              })}
            </div>

            {/* Selected Apartment Detail Preview */}
            {formData.apartment && (
              <div className="mt-12 p-8 bg-white dark:bg-gray-800 rounded-3xl border-2 border-brand-100 dark:border-brand-900 shadow-xl animate-fade-in">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/2">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">Apartment Tour: {formData.apartment}</h3>
                    <div className="aspect-video rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                      {rooms.find(r => r.apartment_name === formData.apartment)?.video_urls?.[0] ? (
                        <iframe
                          className="w-full h-full"
                          src={rooms.find(r => r.apartment_name === formData.apartment)!.video_urls![0]}
                          title="Apartment Video Tour"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                          <IconVideo className="w-12 h-12 mb-2 opacity-20" />
                          <p className="text-sm font-bold uppercase tracking-widest">Video walkthrough coming soon</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="md:w-1/2 space-y-4">
                     <h3 className="text-lg font-bold text-gray-900 dark:text-white">Included Amenities</h3>
                     <div className="grid grid-cols-2 gap-3">
                        {rooms.find(r => r.apartment_name === formData.apartment)?.amenities.slice(0, 6).map((amenity, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <IconCheckCircle className="w-4 h-4 text-brand-500" />
                            <span>{amenity}</span>
                          </div>
                        ))}
                     </div>
                     <div className="pt-6 border-t dark:border-gray-700">
                        <p className="text-sm text-gray-500 italic">"The {formData.apartment} offers a peaceful environment optimized for focused study and comfortable living."</p>
                     </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-12 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl">
              <button onClick={prevStep} className="flex items-center gap-2 text-gray-600 font-bold hover:text-brand-600 transition-colors"><IconChevronLeft className="w-5 h-5" /> Back</button>
              <button 
                disabled={!formData.apartment}
                onClick={nextStep}
                className="flex items-center gap-2 bg-brand-600 text-white px-10 py-4 rounded-2xl font-bold shadow-xl hover:bg-brand-500 transition-all disabled:opacity-30 disabled:grayscale"
              >
                Continue to Room Type <IconChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 4: // Step 5: Choose Room Type
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Room Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRoomTypes.map(type => (
                <SelectionCard 
                  key={type}
                  title={type.includes('Shared') ? 'Shared Room' : 'Private Room'}
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

      case 5: // Step 6: Choose Duration
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

      case 6: // Step 7: Personal Details
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

      case 7: // Step 8: Review & Submit
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

      case 8: // Step 9: Digital Signing
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
                src="https://www.docuseal.com/s/demo-template" // Replace with your real DocuSeal template URL
                email={formData.email}
                onComplete={(e: any) => {
                  console.log('DocuSeal Complete:', e);
                  setIsSigned(true);
                  // In a real app, you'd save the e.doc_url to Supabase
                  nextStep();
                }}
                values={{
                  'fullName': formData.fullName,
                  'nationality': formData.nationality,
                  'passportNumber': formData.passportNumber,
                  'homeAddress': formData.homeAddress,
                  'email': formData.email,
                  'whatsappNumber': formData.whatsappNumber,
                  'apartment': formData.apartment,
                  'roomType': formData.roomType,
                  'category': formData.category,
                  'duration': `${formData.duration} Months`,
                  'startDate': formData.arrivalDate,
                  'endDate': formData.arrivalDate && formData.duration ? new Date(new Date(formData.arrivalDate).setMonth(new Date(formData.arrivalDate).getMonth() + parseInt(formData.duration))).toLocaleDateString() : '',
                  'monthlyRent': monthlyRate.toString(),
                  'depositAmount': monthlyRate.toString(),
                  'totalPrice': `$${totalPrice}`,
                  'date': new Date().toLocaleDateString()
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

      case 9: // Step 10: Confirmation Screen
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
      {/* Step Header */}
      {step < 9 && (
        <div className="mb-8 text-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="inline-block px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 text-[10px] font-black uppercase tracking-widest mb-2 border border-brand-200 dark:border-brand-800">
            Booking Process
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            {step === 1 && "Accommodation Level"}
            {step === 2 && "Residency Features"}
            {step === 3 && "Select Apartment"}
            {step === 4 && "Accommodation Options"}
            {step === 5 && "Stay Duration"}
            {step === 6 && "Student Information"}
            {step === 7 && "Booking Summary"}
            {step === 8 && "Tenancy Agreement"}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  s === step ? 'w-8 bg-brand-600' : s < step ? 'w-4 bg-brand-400' : 'w-4 bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Step {step} of 8</p>
        </div>
      )}
      
      {renderStep()}
    </div>
  );
};

const ApartmentCard = ({ apartment, room, selected, onClick }: any) => {
  return (
    <button 
      onClick={onClick}
      className={`relative rounded-3xl overflow-hidden border-4 transition-all group text-left ${
        selected ? 'border-brand-600 shadow-2xl scale-[1.02]' : 'border-transparent shadow-lg hover:border-brand-300'
      }`}
    >
      <div className="aspect-[16/10] relative">
        <img 
          src={room?.image_urls?.[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          alt={apartment}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-white font-black text-xl tracking-tight uppercase">{apartment}</p>
          <div className="flex items-center gap-2 mt-1">
             <div className="px-2 py-0.5 rounded-full bg-brand-600 text-[10px] text-white font-bold uppercase tracking-wider">
               Active Availability
             </div>
             {room?.video_urls?.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-white font-bold uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  <IconVideo className="w-3 h-3" /> Tour Available
                </div>
             )}
          </div>
        </div>
        {selected && (
          <div className="absolute top-4 right-4 bg-brand-600 text-white p-2 rounded-full shadow-lg border-2 border-white/20 animate-bounce-slow">
            <IconCheck className="w-5 h-5" />
          </div>
        )}
      </div>
    </button>
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
