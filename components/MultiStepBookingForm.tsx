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
import SignaturePad from 'react-signature-canvas';
import { useReactToPrint } from 'react-to-print';
import TenancyAgreementDocument from './TenancyAgreementDocument';
import { sendEmail, getAgreementSignedTemplate } from '../lib/email';

// Predefined Accommodation Categories and Rooms based on exact user specification
const ACCOMMODATIONS_SELECTION: Record<string, Array<{ id: string; room: string; space: string; type: 'Shared' | 'Private'; label: string }>> = {
  'Premium 1': [
    { id: 'p1_r1_a', room: 'Room 1', space: 'Bed A', type: 'Shared', label: 'Room 1 - Bed A (Shared)' },
    { id: 'p1_r1_b', room: 'Room 1', space: 'Bed B', type: 'Shared', label: 'Room 1 - Bed B (Shared)' },
    { id: 'p1_r2', room: 'Room 2', space: 'Single', type: 'Private', label: 'Room 2 (Private)' },
    { id: 'p1_r3', room: 'Room 3', space: 'Single', type: 'Private', label: 'Room 3 (Private)' }
  ],
  'Premium 2': [
    { id: 'p2_r1_a', room: 'Room 1', space: 'Bed A', type: 'Shared', label: 'Room 1 - Bed A (Shared)' },
    { id: 'p2_r1_b', room: 'Room 1', space: 'Bed B', type: 'Shared', label: 'Room 1 - Bed B (Shared)' },
    { id: 'p2_r2', room: 'Room 2', space: 'Single', type: 'Private', label: 'Room 2 (Private)' },
    { id: 'p2_r3', room: 'Room 3', space: 'Single', type: 'Private', label: 'Room 3 (Private)' }
  ],
  'Standard': [
    { id: 'std_r1_a', room: 'Room 1', space: 'Bed A', type: 'Shared', label: 'Room 1 - Bed A (Shared)' },
    { id: 'std_r1_b', room: 'Room 1', space: 'Bed B', type: 'Shared', label: 'Room 1 - Bed B (Shared)' },
    { id: 'std_r2_a', room: 'Room 2', space: 'Bed A', type: 'Shared', label: 'Room 2 - Bed A (Shared)' },
    { id: 'std_r2_b', room: 'Room 2', space: 'Bed B', type: 'Shared', label: 'Room 2 - Bed B (Shared)' },
    { id: 'std_r3', room: 'Room 3', space: 'Single', type: 'Private', label: 'Room 3 (Private)' },
    { id: 'std_r4_a', room: 'Room 4', space: 'Bed A', type: 'Shared', label: 'Room 4 - Bed A (Shared)' },
    { id: 'std_r4_b', room: 'Room 4', space: 'Bed B', type: 'Shared', label: 'Room 4 - Bed B (Shared)' }
  ],
};

const MultiStepBookingForm: React.FC = () => {
  const t = useTranslation();
  const { user, setPage, addBooking, addActivity, rooms, bookings, extendingBooking } = useApp();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: 'Premium 1' as 'Standard' | 'Premium 1' | 'Premium 2',
    selectedRoomId: 'p1_r1_a', // default to first option
    roomName: 'Room 1',
    bedSpaceName: 'Bed A',
    roomType: 'Shared' as 'Shared' | 'Private',
    duration: '2', // default to 2 months
    fullName: '',
    nationality: '',
    passportNumber: '',
    homeAddress: '',
    whatsappNumber: '',
    email: '',
    arrivalDate: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<Booking | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  
  const sigPadRef = React.useRef<SignaturePad>(null);
  const agreementRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: agreementRef,
    documentTitle: `Tenancy_Agreement_${formData.fullName.replace(/\s+/g, '_')}`,
  });

  // Sync basic profile if available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.full_name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  // Sync Category change with preselecting room
  const handleCategoryChange = (cat: 'Standard' | 'Premium 1' | 'Premium 2') => {
    const list = ACCOMMODATIONS_SELECTION[cat];
    if (list && list.length > 0) {
      setFormData(prev => ({
        ...prev,
        category: cat,
        selectedRoomId: list[0].id,
        roomName: list[0].room,
        bedSpaceName: list[0].space,
        roomType: list[0].type,
      }));
    }
  };

  const handleRoomSelect = (id: string) => {
    const list = ACCOMMODATIONS_SELECTION[formData.category];
    const item = list?.find(it => it.id === id);
    if (item) {
      setFormData(prev => ({
        ...prev,
        selectedRoomId: id,
        roomName: item.room,
        bedSpaceName: item.space,
        roomType: item.type,
      }));
    }
  };

  // Pricing rules
  const calculatePriceBreakdown = (category: string, isPrivate: boolean, durationMonths: string) => {
    const months = parseInt(durationMonths) || 2;
    const catSimple = category.startsWith('Premium') ? 'Premium' : 'Standard';
    
    let rate = 0;
    if (catSimple === 'Standard') {
      if (isPrivate) {
        if (months <= 2) rate = 300;
        else if (months <= 4) rate = 285;
        else if (months <= 6) rate = 270;
        else rate = 260;
      } else {
        if (months <= 2) rate = 175;
        else if (months <= 4) rate = 165;
        else if (months <= 6) rate = 155;
        else rate = 150;
      }
    } else { // Premium (1 or 2)
      if (isPrivate) {
        if (months <= 2) rate = 350;
        else if (months <= 4) rate = 330;
        else if (months <= 6) rate = 315;
        else rate = 300;
      } else {
        if (months <= 2) rate = 200;
        else if (months <= 4) rate = 190;
        else if (months <= 6) rate = 180;
        else rate = 175;
      }
    }

    return {
      monthlyRate: rate,
      totalPrice: rate * months,
    };
  };

  const pricing = useMemo(() => {
    const isPrivate = formData.roomType === 'Private';
    return calculatePriceBreakdown(formData.category, isPrivate, formData.duration);
  }, [formData.category, formData.roomType, formData.duration]);

  // Find dynamic room object in Supabase context that matches current category & room type
  const selectedSupabaseRoom = useMemo(() => {
    const isPrivate = formData.roomType === 'Private';
    const catSimple = formData.category.startsWith('Premium') ? 'Premium' : 'Standard';
    const reqType = isPrivate 
      ? (`${catSimple} Private` as AccommodationType)
      : (`${catSimple} Shared` as AccommodationType);

    // Filter available rooms in Supabase database
    return rooms.find(r => 
      r.category.toLowerCase() === catSimple.toLowerCase() && 
      r.type === reqType
    ) || rooms.find(r => r.category.toLowerCase() === catSimple.toLowerCase()) || null;
  }, [rooms, formData.category, formData.roomType]);

  const startDate = formData.arrivalDate;
  const endDate = useMemo(() => {
    if (!startDate || !formData.duration) return '';
    try {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + parseInt(formData.duration));
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  }, [startDate, formData.duration]);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (!user) {
      setPage('auth');
      return;
    }

    if (!formData.fullName || !formData.nationality || !formData.passportNumber || !formData.arrivalDate) {
      setError("Please fill out all student details on step 3 before submitting.");
      return;
    }

    if (!signature) {
      setError("Please provide your signature on the tenancy agreement.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Find a safe room ID
      const roomIdToUse = selectedSupabaseRoom?.id || 1; // fallback of 1 if not synchronized yet
      
      const newBooking: Partial<Booking> = {
        student_id: user.id,
        room_id: roomIdToUse,
        start_date: formData.arrivalDate,
        end_date: endDate,
        status: BookingStatus.PENDING_VERIFICATION,
        booked_at: new Date().toISOString(),
        full_name: formData.fullName,
        nationality: formData.nationality,
        passport_number: formData.passportNumber,
        passport_copy_url: 'pending_digital_sign', 
        email: formData.email,
        phone_number: formData.whatsappNumber,
        expected_arrival_date: formData.arrivalDate,
        duration_of_stay: `${formData.duration} months`,
        preferred_accommodation: (formData.category.startsWith('Premium') 
          ? (formData.roomType === 'Private' ? 'Premium Private' : 'Premium Shared')
          : (formData.roomType === 'Private' ? 'Standard Private' : 'Standard Shared')) as AccommodationType,
        emergency_contact_details: 'Digital Signatory',
        address_in_egypt: formData.homeAddress,
        total_price: pricing.totalPrice,
        parent_booking_id: extendingBooking?.id,
        signature_data: signature,
        contract_signed_at: new Date().toISOString(),
        rooms: { 
          room_number: `${formData.category} - ${formData.roomName} (${formData.bedSpaceName})`, 
          type: (formData.category.startsWith('Premium') 
            ? (formData.roomType === 'Private' ? 'Premium Private' : 'Premium Shared')
            : (formData.roomType === 'Private' ? 'Standard Private' : 'Standard Shared')) as AccommodationType,
          apartment_name: `Apartment ${formData.category}`,
          category: formData.category.startsWith('Premium') ? 'Premium' : 'Standard'
        },
      };

      const result = await addBooking(newBooking as Booking);
      if (!result.success) throw new Error(result.error);
      
      const createdBooking = result.data!;
      setBookingResult(createdBooking);

      // Email notifications
      const emailTemplate = getAgreementSignedTemplate(formData.fullName, createdBooking.id);
      
      // Send Landlord bank details via simulated contact email to student
      sendEmail({
        to: formData.email,
        subject: `Booking Agreement BK${createdBooking.id} & Landlord Payment Instructions`,
        body: `Dear ${formData.fullName},\n\nWe have received your signed tenancy agreement for your stay at Al-Ibaanah Student Residency!\n\nHere are the details for making your deposit payment:\n\n-- LANDLORD BANK DETAILS --\nRecipient Name: Al-Ibaanah Student Residency / Jimoh Bolakale Ajao\nCorporate Payoneer Email: sheriffdeenalade@gmail.com\nReference Code: BK${createdBooking.id} - ${formData.fullName}\n\nRent Details: $${pricing.monthlyRate}/mo x ${formData.duration} months. Total calculated amounts: $${pricing.totalPrice} USD.\n\nPlease log into your student dashboard page to upload your deposit transfer confirmation screenshot when completed so we can quickly activate your key eligibility.\n\nWarm regards,\nAl-Ibaanah Administration`
      }).catch(err => console.error("Failed to send signature email:", err));

      // Admin alert
      sendEmail({
        to: 'admin@alibaanah.com',
        subject: `New Tenancy Agreement Signed - (BK${createdBooking.id})`,
        body: `A new tenancy agreement has been signed by ${formData.fullName} for BK${createdBooking.id}.\n\nPlease review it in the admin dashboard.`
      }).catch(err => console.error("Failed to send admin email:", err));
      
      await addActivity({
        user_id: user.id,
        type: 'booking',
        description: `Contract signed & booking submitted for BK${createdBooking.id} (${formData.category} - ${formData.roomName})`,
        timestamp: new Date().toISOString()
      });
      
      nextStep(); // confirmation screen
    } catch (err: any) {
      setError(err.message || "Failed to submit booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Expectations array
  const expectations = [
    "Fully furnished apartments",
    "Private and shared room options (2 students per shared room)",
    "Personal workstation for each student",
    "Shared kitchen, living, shared bathroom and toilet and dining areas",
    "Professional cleaning 3 times per week",
    "Electricity, water, and internet included",
    "Safe, respectful, and structured environment"
  ];

  const renderStepContent = () => {
    switch (step) {
      case 1: // Explore Our Accommodations
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Explore Our Accommodations</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Please explore categories and select your target room and bed space location below.</p>
            </div>

            {/* Category selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Premium 1', 'Premium 2', 'Standard'].map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat as any)}
                  className={`p-5 rounded-2xl border-2 transition-all text-center ${
                    formData.category === cat 
                      ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-900/10 ring-4 ring-brand-500/10' 
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <span className="block font-black text-base text-gray-900 dark:text-white uppercase tracking-wider">{cat}</span>
                  <span className="text-xs text-brand-600 dark:text-brand-400 font-bold mt-1 block">
                    {cat === 'Standard' ? 'From $150/mo' : 'From $175/mo'}
                  </span>
                </button>
              ))}
            </div>

            {/* Room choice & Bed selection for selected category */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                Rooms & Bed space configuration in {formData.category}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ACCOMMODATIONS_SELECTION[formData.category]?.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleRoomSelect(item.id)}
                    className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all ${
                      formData.selectedRoomId === item.id
                        ? 'border-brand-500 bg-brand-50/20 text-brand-700 dark:text-brand-400 font-bold'
                        : 'border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div>
                      <span className="block font-bold text-sm">{item.room}</span>
                      <span className="text-xs text-gray-400 block mt-0.5 font-medium">{item.type} room ({item.space})</span>
                    </div>
                    {formData.selectedRoomId === item.id && (
                      <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                        <IconCheck className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* What you can expect Checklist */}
            <div className="bg-amber-50/40 dark:bg-gray-900/40 p-6 rounded-2xl border border-amber-100/50 dark:border-gray-700 space-y-4">
              <h3 className="font-bold text-xs text-amber-800 dark:text-amber-400 uppercase tracking-wider">What You Can Expect</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-700 dark:text-gray-300">
                {expectations.map((exp, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="text-emerald-600 font-bold flex-shrink-0">✔</span>
                    <span>{exp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={nextStep}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
              >
                Continue to Features & Pricing <IconChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 2: // Apartment features, pricing, Shared vs Private selection
        const isPremium = formData.category.startsWith('Premium');
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Apartment Features & Details</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Review your apartment visual assets, exact features, configurations and choose stay options.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Visuals & Embed */}
              <div className="space-y-6">
                <div className="aspect-video rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-black relative">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                    title="Room Tour Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="aspect-square rounded-xl overflow-hidden shadow-sm border dark:border-gray-700">
                    <img 
                      src={isPremium 
                        ? 'https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/Suite2_q62y4w.jpg' 
                        : 'https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/shared_bathroom1_hlxjdg.jpg'
                      } 
                      alt="Apartment feature" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="aspect-square rounded-xl overflow-hidden shadow-sm border dark:border-gray-700">
                    <img 
                      src={isPremium 
                        ? 'https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/Suite1_t4dczv.jpg' 
                        : 'https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/single_room2_zhd9uo.jpg'
                      } 
                      alt="Room space" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Preferences Selection */}
              <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                {/* 1. Shared or Private Selector */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">A. Choose Room Preference</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, roomType: 'Shared' }))}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        formData.roomType === 'Shared'
                          ? 'border-brand-500 bg-brand-50/20 text-brand-800 dark:text-brand-300 font-bold'
                          : 'border-gray-200 dark:border-gray-700 bg-transparent text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Shared Room Option
                    </button>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, roomType: 'Private' }))}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        formData.roomType === 'Private'
                          ? 'border-brand-500 bg-brand-50/20 text-brand-800 dark:text-brand-300 font-bold'
                          : 'border-gray-200 dark:border-gray-700 bg-transparent text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Private Room Option
                    </button>
                  </div>
                </div>

                {/* 2. Duration of stay */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">B. Duration of Stay</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['2', '4', '6', '12'].map(months => (
                      <button
                        key={months}
                        onClick={() => setFormData(prev => ({ ...prev, duration: months }))}
                        className={`p-3 rounded-lg border text-center text-xs transition-all ${
                          formData.duration === months
                            ? 'border-brand-500 bg-brand-50/20 text-brand-800 dark:text-brand-300 font-bold'
                            : 'border-gray-200 dark:border-gray-700 bg-transparent text-gray-600'
                        }`}
                      >
                        {months} Mos
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Pricing Box */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-950 rounded-xl space-y-2 border border-gray-100 dark:border-gray-900 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-semibold uppercase tracking-widest text-[10px]">Monthly Subscription rate:</span>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">${pricing.monthlyRate} USD / mo</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-900 pt-2">
                    <span className="text-brand-600 font-black uppercase tracking-widest text-[10px]">Total Stay Price ({formData.duration} mos):</span>
                    <span className="font-black text-brand-600 text-lg">${pricing.totalPrice} USD</span>
                  </div>
                  <p className="text-[10px] text-gray-400 italic leading-snug mt-2">
                    * Rates are optimized according to the selected duration tier. Total includes water, electricity and 3x/week cleaning.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={prevStep} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 font-bold">
                <IconChevronLeft className="w-4 h-4" /> Back to accommodations
              </button>
              <button
                onClick={nextStep}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
              >
                Continue to Student's Information <IconChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 3: // Student's Details Page
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Student's Information</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Please provide your official credential information as shown on your international passport.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField label="Full Name (as in passport)" value={formData.fullName} onChange={(e: any) => setFormData({...formData, fullName: e.target.value})} placeholder="e.g. Abdullah Khan" />
              <InputField label="Nationality" value={formData.nationality} onChange={(e: any) => setFormData({...formData, nationality: e.target.value})} placeholder="e.g. British" />
              <InputField label="Passport Number" value={formData.passportNumber} onChange={(e: any) => setFormData({...formData, passportNumber: e.target.value})} placeholder="e.g. GB982421A" />
              <InputField label="WhatsApp / Contact Phone Number" value={formData.whatsappNumber} onChange={(e: any) => setFormData({...formData, whatsappNumber: e.target.value})} placeholder="e.g. +44 7911 123456" />
              <InputField label="Email Address" type="email" value={formData.email} onChange={(e: any) => setFormData({...formData, email: e.target.value})} placeholder="e.g. student@gmail.com" />
              <InputField label="Expected Arrival / Move-in Date" type="date" value={formData.arrivalDate} onChange={(e: any) => setFormData({...formData, arrivalDate: e.target.value})} />
              
              <div className="md:col-span-2">
                <InputField label="Home Address (Original residency home address before Egypt)" value={formData.homeAddress} onChange={(e: any) => setFormData({...formData, homeAddress: e.target.value})} placeholder="e.g. 104 Baker Street, London, UK" />
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
              <button onClick={prevStep} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 font-bold">
                <IconChevronLeft className="w-4 h-4" /> Back to stay options
              </button>
              <button
                disabled={!formData.fullName || !formData.nationality || !formData.passportNumber || !formData.arrivalDate}
                onClick={nextStep}
                className="flex items-center gap-2 bg-brand-600 disabled:opacity-50 hover:bg-brand-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
              >
                Continue to Review <IconChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 4: // Review Booking Summary
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Review Your Booking Settings</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Verify all parameters are correct and matches passport credentials prior to executing signing.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                <h3 className="font-black text-brand-800 dark:text-brand-300 uppercase tracking-wider text-xs">Accommodation Selection</h3>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <SummaryItem label="Apartment Category" value={formData.category} />
                  <SummaryItem label="Room Name" value={`${formData.roomName} (${formData.bedSpaceName})`} />
                  <SummaryItem label="Placement Level" value={`${formData.roomType} room`} />
                  <SummaryItem label="Duration" value={`${formData.duration} Months`} />
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-black text-brand-800 dark:text-brand-300 uppercase tracking-wider text-xs">Student Credentials</h3>
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                  <SummaryItem label="Official Name" value={formData.fullName} />
                  <SummaryItem label="Nationality" value={formData.nationality} />
                  <SummaryItem label="Passport #" value={formData.passportNumber} />
                  <SummaryItem label="WhatsApp Contact" value={formData.whatsappNumber} />
                  <SummaryItem label="Expected Move-in" value={formData.arrivalDate} />
                  <SummaryItem label="Original Home Address" value={formData.homeAddress} />
                </div>
              </div>

              <div className="p-6 bg-brand-800 text-white flex justify-between items-center rounded-b-2xl">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">Two months' advance security deposit</span>
                  <span className="text-lg font-bold">Total Stay Cost Breakdown:</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black">${pricing.totalPrice} USD</span>
                  <p className="text-[10px] opacity-80 mt-1">(${pricing.monthlyRate} USD/month)</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
              <button onClick={prevStep} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 font-bold">
                <IconChevronLeft className="w-4 h-4" /> Back to details
              </button>
              <button
                onClick={nextStep}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
              >
                Proceed to Tenancy Agreement <IconChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 5: // Tenancy Agreement with digital signature and print option
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Official Tenancy Agreement</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Review the complete document contents in conformity with Cairo residency files and digital sign.</p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
              <div className="max-h-[500px] overflow-y-auto rounded-xl shadow-inner bg-white border border-gray-200 dark:border-gray-700 p-1">
                 <TenancyAgreementDocument 
                    ref={agreementRef}
                    formData={formData}
                    monthlyRate={pricing.monthlyRate}
                    startDate={startDate}
                    endDate={endDate}
                    signature={signature || undefined}
                 />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
               {/* Drawing Signature */}
               <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
                    <IconSignature className="w-4.5 h-4.5 text-brand-600" /> Digital Ink Signature
                  </h3>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 space-y-3">
                    <div className="aspect-[3/1] bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden touch-none border border-gray-200">
                       <SignaturePad 
                         ref={sigPadRef}
                         canvasProps={{className: "w-full h-full cursor-crosshair"}}
                         onEnd={() => {
                            const data = sigPadRef.current?.getTrimmedCanvas().toDataURL('image/png');
                            setSignature(data || null);
                         }}
                       />
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold uppercase">
                       <button 
                         onClick={() => {
                           sigPadRef.current?.clear();
                           setSignature(null);
                         }}
                         className="text-red-600 hover:text-red-700"
                       >
                         Reset Signature
                       </button>
                       <span className="text-gray-400">Sign inside box</span>
                    </div>
                  </div>
               </div>

               {/* Legal approval & booking trigger */}
               <div className="space-y-4 bg-brand-50/20 dark:bg-gray-900/10 p-5 rounded-2xl border border-brand-100/30">
                  <h4 className="font-bold text-sm text-brand-900 dark:text-brand-300">Residency Conditions</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-normal">
                    By submitting your digitally signed agreement, you commit to respecting the property structure, attending congregational salawat at the local masjid, and uphold Al-Ibaanah student dormitory and Islamic values.
                  </p>
                  
                  <div className="flex items-center gap-2.5 pt-2">
                     <div className={`w-5 h-5 rounded-full flex items-center justify-center ${signature ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}>
                        <IconCheck className="w-3.5 h-3.5" />
                     </div>
                     <span className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase">agreement digitally signed</span>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-brand-100/20">
                    <button 
                      onClick={handlePrint}
                      type="button"
                      className="w-full text-xs font-bold text-gray-700 hover:text-brand-800 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-center"
                    >
                      Print Copy / PDF
                    </button>
                    <button 
                      disabled={isSubmitting || !signature}
                      onClick={handleSubmit}
                      className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider text-sm transition-all shadow-md disabled:opacity-50"
                    >
                      {isSubmitting ? "Submitting Booking..." : "Submit & Authorize Agreement"}
                    </button>
                    {error && <p className="text-red-500 text-xs font-bold text-center mt-2">{error}</p>}
                  </div>
               </div>
            </div>

            <button onClick={prevStep} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 font-bold">
              <IconChevronLeft className="w-4 h-4" /> Back to Review
            </button>
          </div>
        );

      case 6: // Confirmation screen showing payment details
        return (
          <div className="space-y-8 animate-fade-in text-center max-w-2xl mx-auto py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 shadow-inner mb-2 animate-bounce-slow">
              <IconCheck className="w-10 h-10" />
            </div>

            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Agreement Executed!</h2>
            <p className="text-sm text-gray-600 dark:text-gray-450 leading-relaxed">
              Congratulations Abdullah, your signed Tenancy Agreement has been authorized and filed. We have dispatched a confirmation email copy to <span className="font-bold text-brand-600">{formData.email}</span> with complete payment directions.
            </p>

            {/* Landlord payment details */}
            <div className="bg-amber-50/30 dark:bg-gray-900/30 border border-amber-200/50 dark:border-gray-800 p-6 rounded-2xl text-left space-y-4">
              <h3 className="font-black text-amber-900 dark:text-amber-400 text-xs uppercase tracking-wider flex items-center gap-2">
                📢 ACTION REQUIREMENT: Send Rent & Deposit
              </h3>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-normal">
                To activate your residency and ensure prompt secure key distribution prior to arrival, please transfer the Calculated Rent using the following details:
              </p>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-xs space-y-3 font-medium">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-400">Total Deposit & Rent:</span>
                  <span className="font-bold text-brand-700 text-sm">${pricing.totalPrice} USD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Merchant Payoneer Email:</span>
                  <span className="font-mono font-bold select-all text-orange-600">sheriffdeenalade@gmail.com</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Recipient Name:</span>
                  <span className="font-bold">Jimoh Bolakale Ajao (Al-Ibaanah)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Reference memo is required:</span>
                  <span className="font-bold font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded">BK{bookingResult?.id || '2004'} - {formData.fullName}</span>
                </div>
              </div>

              <div className="p-3.5 bg-brand-50/20 dark:bg-gray-900/10 border border-brand-100/50 rounded-xl">
                <p className="text-[11px] text-brand-800 dark:text-brand-300 leading-relaxed">
                  <strong>👉 NEXT STEP:</strong> Once the transfer is completed, taking a screenshot of your confirmation screen, then go directly to your **Student Dashboard** to upload the proof of payment file for instant activation.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setPage('dashboard')}
                className="bg-brand-600 hover:bg-brand-700 text-white px-10 py-4 rounded-2xl font-bold font-black text-sm uppercase tracking-wider shadow-lg active:scale-95 transition-all"
              >
                Go to My Dashboard
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Steps track header */}
      {step < 6 && (
        <div className="mb-8 text-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="inline-block px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 text-[10px] font-black uppercase tracking-widest mb-2 border border-brand-200 dark:border-brand-800">
            residency application
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            {step === 1 && "1. Our Accommodations Selection"}
            {step === 2 && "2. Features & Pricing"}
            {step === 3 && "3. Student Information"}
            {step === 4 && "4. Review Booking Summary"}
            {step === 5 && "5. Sign Tenancy Agreement"}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  s === step ? 'w-8 bg-brand-600' : s < step ? 'w-4 bg-brand-400' : 'w-4 bg-gray-200 dark:bg-gray-750'
                }`}
              />
            ))}
          </div>
          <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Step {step} of 5</p>
        </div>
      )}

      {renderStepContent()}
    </div>
  );
};

// Internal components for clean code split
const InputField = ({ label, ...props }: any) => (
  <div className="space-y-2">
    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{label}</label>
    <input 
      {...props}
      className="w-full p-3.5 rounded-xl border border-gray-201 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:ring-2 focus:ring-brand-500 outline-none transition-all"
    />
  </div>
);

const SummaryItem = ({ label, value }: any) => (
  <div>
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
    <p className="text-gray-900 dark:text-white font-bold text-sm italic">{value || 'Not selected'}</p>
  </div>
);

export default MultiStepBookingForm;
