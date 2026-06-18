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

// Swappable media assets (images, tour videos, and features) for each student accommodation category.
// Swapping YouTube/Vimeo tour links and Cloudinary photos here instantly updates the student booking interface.
export const CATEGORY_MEDIA: Record<'Standard' | 'Premium 1' | 'Premium 2', {
  videoUrl: string;
  images: string[];
  features: string[];
}> = {
  'Premium 1': {
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Embed YouTube or Vimeo video ID
    images: [
      'https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/Suite2_q62y4w.jpg',
      'https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/Suite1_t4dczv.jpg'
    ],
    features: ['High-speed student Wi-Fi', 'In-room Air Conditioning', 'En-suite Luxury Bathroom option', 'Private Room option', 'Cozy premium furniture layout', 'Access to Elite Study common areas']
  },
  'Premium 2': {
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Embed YouTube or Vimeo video ID
    images: [
      'https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/Suite2_q62y4w.jpg',
      'https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/Suite1_t4dczv.jpg'
    ],
    features: ['Premium Suite features', 'Modern kitchen accessibility', 'Spacious study areas', 'In-room high capacity AC', 'Dedicated Resident Lounge Area', 'Weekly student helper laundry cleaning']
  },
  'Standard': {
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Embed YouTube or Vimeo video ID
    images: [
      'https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/shared_bathroom1_hlxjdg.jpg',
      'https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/single_room2_zhd9uo.jpg'
    ],
    features: ['Shared bathroom area', 'High-speed student Wi-Fi', 'Air conditioning unit', 'Fully furnished student kitchen', 'Automatic washing machine access', 'Tranquil student community focus']
  }
};

const MultiStepBookingForm: React.FC = () => {
  const t = useTranslation();
  const { user, setPage, addBooking, addActivity, rooms, bookings, extendingBooking, landlordDetails, cmsContent } = useApp();
  
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
  const [confirmPaymentTab, setConfirmPaymentTab] = useState<'bank' | 'remitly'>('bank');
  
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
        body: `Dear ${formData.fullName},

We have received your officially signed tenancy agreement for your stay at Al-Ibaanah Student Residency!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ IMMEDIATE ACTION REQUIRED: One Month Security Deposit Due Now
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To make your reservation official and secure your bed space, you MUST pay the **Deposit of one month (Due Now)** which is: $${pricing.monthlyRate} USD (or equivalent in EGP). 

Only paying this deposit guarantees your bed assignment.

Here is how to complete your deposit pay transfer:

1. BANK TRANSFER DETAILS
━━━━━━━━━━━━━━━━
👤 Recipient Name: ${landlordDetails?.recipientName || 'Jimoh Bolakale Ajao'}
🏛️ Bank Name: ${landlordDetails?.bankName || 'Commercial International Bank (CIB)'}
💳 IBAN: ${landlordDetails?.iban || 'EG98 0010 0109 0000 0100 0633 2816 7'}
🔐 SWIFT / BIC Code: ${landlordDetails?.swiftCode || 'CIBEEGCXXXX'}
📞 Recipient's Phone: ${landlordDetails?.phone || '+20 1030062440'}

📍 BANK ADDRESS
🏠 Street: ${landlordDetails?.street || '71 Abou Dawood El Zahry Street, Off Makram Ebeid Street'}
🏙️ City: ${landlordDetails?.city || 'Nasr City, Cairo'}
🌍 Country: ${landlordDetails?.country || 'Egypt'}
📮 P.O. Box: ${landlordDetails?.poBox || '11341'}

2. HOW TO PAY YOUR FEES VIA REMITLY
━━━━━━━━━━━━━━━━
To make your payment smoothly via Remitly, please follow these steps:
Step 1. Download Remitly from the App Store or Google Play, or visit: https://www.remitly.com and log in/create an account.
Step 2. Select the country you are sending money from.
Step 3. Select Egypt as the country you are sending to.
Step 4. Enter the amount to pay: e.g. the 1-month deposit equivalent in EGP (The account will not accept USD directly—you must send the EGP equivalent of $${pricing.monthlyRate} USD!).
Step 5. Choose the delivery method: Bank Deposit.
Step 6. Enter the recipient’s bank details exactly as written below:
   * Account Name: ${landlordDetails?.recipientName || 'Jimoh Bolakale Ajao'}
   * Bank Name: ${landlordDetails?.remitlyBankName || 'CIB'}
   * Bank Location: ${landlordDetails?.remitlyLocation || 'Cairo'}
   * IBAN: ${landlordDetails?.remitlyIban || 'EG320010010900000100063328094'}
Step 7. Choose your payment method (debit card, credit card, or bank transfer).
Step 8. Review all transfer details and transmit.

✅ MANDATORY Reference memo: BK${createdBooking.id} - ${formData.fullName}

Rent Breakdown: $${pricing.monthlyRate}/mo for ${formData.duration} months stay.
Total Remaining balance upon physical arrival: $${pricing.totalPrice - pricing.monthlyRate} USD.

Please log into your student dashboard page to upload your deposit transfer confirmation screenshot when completed so that our admin team can verify the reservation and activate check-in clearance.

Warm regards,
Al-Ibaanah Student Residency Administration`
      }).catch(err => console.error("Failed to send signature email:", err));

      // Admin alert
      sendEmail({
        to: landlordDetails?.adminEmail || 'sheriffdeenalade@gmail.com',
        subject: `New Tenancy Agreement Signed - (BK${createdBooking.id})`,
        body: `A new tenancy agreement has been signed by ${formData.fullName} for BK${createdBooking.id}.

Please verify the agreement details in the Admin Dashboard at your earliest convenience.`
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

  // Category capacity and current active reservations calculation
  const activeCategoryBedsCount = formData.category === 'Standard' ? 7 : 4;
  const activeBookingsCount = bookings.filter(b => {
    if (b.status === BookingStatus.CANCELLED || b.status === BookingStatus.COMPLETED) return false;
    const isPremiumCat = formData.category.startsWith('Premium');
    const bCategory = b.rooms?.category || b.preferred_accommodation || '';
    const bIsPremium = bCategory.startsWith('Premium') || (b.rooms?.room_number?.startsWith('Premium') ?? false);
    return isPremiumCat ? bIsPremium : (!bIsPremium && bCategory !== '');
  }).length;

  const currentOccupied = Math.min(activeBookingsCount, activeCategoryBedsCount);
  const occupancyPercentage = Math.round((currentOccupied / activeCategoryBedsCount) * 100);

  // Expectations array
  const expectations = [
    `Occupancy status: The Selected ${formData.category} Apartment will accommodate up to ${activeCategoryBedsCount} residents. (${currentOccupied} spaces booked, rendering a ${occupancyPercentage}% category occupancy rate).`,
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
                {ACCOMMODATIONS_SELECTION[formData.category]?.map(item => {
                  const targetLabel = `${formData.category} - ${item.room} (${item.space})`;
                  
                  // Calculate Dynamic Next Available Date based on current active student resident bookings
                  const activeBedsBookings = (bookings || []).filter(b => {
                    if (b.status === BookingStatus.CANCELLED || b.status === BookingStatus.COMPLETED) return false;
                    const bookingLabel = (b as any).room_number || b.rooms?.room_number || '';
                    return bookingLabel === targetLabel;
                  });

                  // Sort active bookings to find the latest residency lease end_date
                  const sortedBookings = [...activeBedsBookings].sort((a, b) => {
                    const dateA = a.end_date ? new Date(a.end_date).getTime() : 0;
                    const dateB = b.end_date ? new Date(b.end_date).getTime() : 0;
                    return dateB - dateA;
                  });

                  const latestBooking = sortedBookings[0];
                  let calculatedAvailDate = 'Available Now';
                  if (latestBooking && latestBooking.end_date) {
                    try {
                      const endD = new Date(latestBooking.end_date);
                      calculatedAvailDate = endD.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                    } catch (e) {
                      calculatedAvailDate = latestBooking.end_date;
                    }
                  }

                  // Retrieve matching DB Room object to check for any manual override date
                  const matchingSupabaseRoom = rooms.find(r => {
                    const rCategory = r.category || '';
                    const rType = r.type || '';
                    const isPrivate = item.type === 'Private';
                    const catSimple = formData.category.startsWith('Premium') ? 'Premium' : 'Standard';
                    const reqType = isPrivate ? `${catSimple} Private` : `${catSimple} Shared`;
                    return rCategory.toLowerCase() === catSimple.toLowerCase() && rType === reqType;
                  });

                  const manualOverride = (matchingSupabaseRoom as any)?.next_available_date;
                  let finalAvailDate = calculatedAvailDate;
                  if (manualOverride) {
                    try {
                      finalAvailDate = new Date(manualOverride).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                    } catch (e) {
                      finalAvailDate = manualOverride;
                    }
                  }

                  return (
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
                        <span className="block font-bold text-sm text-gray-900 dark:text-white">{item.room}</span>
                        <span className="text-xs text-gray-400 block mt-0.5 font-medium">{item.type} room ({item.space})</span>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-[9px] uppercase font-bold text-gray-400">Available:</span>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            finalAvailDate === 'Available Now'
                              ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                          }`}>
                            {finalAvailDate}
                          </span>
                        </div>
                      </div>
                      {formData.selectedRoomId === item.id && (
                        <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center flex-shrink-0">
                          <IconCheck className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
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
        {
          const media = cmsContent?.categoryMedia?.[formData.category] || CATEGORY_MEDIA[formData.category];
          
          let videoUrl = media.videoUrl;
          if (selectedSupabaseRoom?.video_urls && selectedSupabaseRoom.video_urls.length > 0) {
            const rawVideoUrl = selectedSupabaseRoom.video_urls[0];
            if (rawVideoUrl && rawVideoUrl.trim() !== '') {
              videoUrl = rawVideoUrl;
            }
          }
          
          // Ensure YouTube URLs are correctly formatted to embed URLs
          const getEmbedUrl = (url: string) => {
            if (!url) return '';
            if (url.includes('youtube.com/embed/')) return url;
            if (url.includes('youtube.com/watch?v=')) {
              const id = url.split('v=')[1]?.split('&')[0];
              return `https://www.youtube.com/embed/${id}`;
            }
            if (url.includes('youtu.be/')) {
              const id = url.split('youtu.be/')[1]?.split('?')[0];
              return `https://www.youtube.com/embed/${id}`;
            }
            return url;
          };

          const finalVideoUrl = getEmbedUrl(videoUrl);

          let imagesToUse = media.images || [];
          if (selectedSupabaseRoom?.image_urls && selectedSupabaseRoom.image_urls.length > 0) {
            const validImages = selectedSupabaseRoom.image_urls.filter(img => img && img.trim() !== '');
            if (validImages.length > 0) {
              imagesToUse = validImages;
            }
          }

          return (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Apartment Features & Details</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Review your apartment visual assets, exact features, configurations and choose stay options.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Visuals & Embed */}
                <div className="space-y-6">
                  {finalVideoUrl && (
                    <div className="aspect-video rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-black relative">
                      <iframe
                        className="w-full h-full"
                        src={finalVideoUrl}
                        title={`${formData.category} Room Tour Video`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {imagesToUse[0] && (
                      <div className="aspect-square rounded-xl overflow-hidden shadow-sm border dark:border-gray-700 bg-gray-50">
                        <img 
                          src={imagesToUse[0]} 
                          alt={`${formData.category} Apartment feature 1`} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                    {imagesToUse[1] && (
                      <div className="aspect-square rounded-xl overflow-hidden shadow-sm border dark:border-gray-700 bg-gray-50">
                        <img 
                          src={imagesToUse[1]} 
                          alt={`${formData.category} Apartment feature 2`} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Preferences Selection */}
                <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                  {/* 1. Shared or Private Option (Read-Only carried over from Step 1) */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">A. Choose Room Preference</label>
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 text-sm font-semibold text-gray-850 dark:text-gray-250 flex justify-between items-center animate-pulse">
                      <span>{formData.roomType === 'Shared' ? 'Shared Room Option' : 'Private Single Room Option'}</span>
                      <span className="text-[10px] bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 font-bold px-2.1 py-0.5 rounded border border-brand-200 dark:border-brand-800 uppercase tracking-wider leading-none">Selected Bed Choice</span>
                    </div>
                  </div>

                  {/* Included Perks & Amenities */}
                  {media.features && media.features.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-mono">Included Comfort Features</label>
                      <div className="grid grid-cols-2 gap-1.5 p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-805 rounded-xl">
                        {media.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-gray-700 dark:text-gray-350">
                            <span className="text-brand-600 dark:text-brand-400 font-extrabold">✓</span>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
      }

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
            <div className="bg-amber-50/20 dark:bg-gray-900/30 border border-amber-200/40 dark:border-gray-800 p-6 rounded-2xl text-left space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-800 pb-4 gap-4">
                <div>
                  <h3 className="font-black text-amber-900 dark:text-amber-400 text-xs uppercase tracking-wider flex items-center gap-2">
                    📢 ACTION REQUIRED: Secure Your Bed
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Please select your preferred payment method:</p>
                </div>
                <div className="flex bg-gray-150 dark:bg-gray-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setConfirmPaymentTab('bank')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      confirmPaymentTab === 'bank'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Bank Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmPaymentTab('remitly')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      confirmPaymentTab === 'remitly'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Remitly Transfer
                  </button>
                </div>
              </div>

              {/* Action notice for Deposit Pay */}
              <div className="p-5 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-900 rounded-2xl text-left space-y-2.5">
                <h4 className="font-black text-amber-900 dark:text-amber-400 text-sm uppercase tracking-wide flex items-center gap-1.5">
                  ⚠️ Deposit of One Month (Due Now) Required: $${pricing.monthlyRate} USD
                </h4>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
                  To complete your booking and secure your bed space booking, a **Security Deposit of one month (Due Now) in the amount of $${pricing.monthlyRate} USD** is required immediately. 
                  This deposit of one month (Due Now) is what makes your residency reservation possible.
                </p>
                <div className="flex justify-between text-xs pt-2.5 border-t border-amber-200 dark:border-amber-900 font-bold">
                  <span className="text-gray-400 uppercase tracking-wider text-[10px]">Due Now (Security Deposit):</span>
                  <span className="text-amber-700 font-black font-mono select-all">${pricing.monthlyRate} USD</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-400 uppercase tracking-wider text-[10px]">Remaining Stay Rent Balance:</span>
                  <span className="text-gray-700 dark:text-gray-300 font-mono">${pricing.totalPrice - pricing.monthlyRate} USD</span>
                </div>
              </div>

              {confirmPaymentTab === 'bank' ? (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 text-xs space-y-3 font-medium">
                    <div className="flex justify-between border-b pb-2 text-sm">
                      <span className="text-gray-400">Security Deposit Charged:</span>
                      <span className="font-black text-brand-700">${pricing.monthlyRate} USD</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2.5 pt-2">
                      <div className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Recipient Name</div>
                      <div className="font-bold text-gray-900 dark:text-white select-all text-right">{landlordDetails?.recipientName || 'Jimoh Bolakale Ajao'}</div>

                      <div className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Bank Name</div>
                      <div className="font-bold text-gray-900 dark:text-white text-right">{landlordDetails?.bankName || 'Commercial International Bank (CIB)'}</div>

                      <div className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">IBAN</div>
                      <div className="font-mono font-bold text-amber-600 dark:text-amber-400 select-all text-right">{landlordDetails?.iban || 'EG98 0010 0109 0000 0100 0633 2816 7'}</div>

                      <div className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">SWIFT / BIC Code</div>
                      <div className="font-mono font-bold select-all text-right">{landlordDetails?.swiftCode || 'CIBEEGCXXXX'}</div>

                      <div className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Phone Number</div>
                      <div className="font-bold select-all text-right">{landlordDetails?.phone || '+20 1030062440'}</div>
                    </div>
                    
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-3 text-[11px] text-gray-500 leading-normal">
                      <strong className="text-gray-700 dark:text-gray-300 block mb-1">🏦 Bank Address:</strong>
                      {landlordDetails?.street || '71 Abou Dawood El Zahry Street, Off Makram Ebeid Street'}, {landlordDetails?.city || 'Nasr City, Cairo'}, {landlordDetails?.country || 'Egypt'} (P.O. Box {landlordDetails?.poBox || '11341'})
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between items-center">
                      <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Reference / Memo:</span>
                      <span className="font-black font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded border border-gray-200 dark:border-gray-800">
                        BK{bookingResult?.id || '2004'} - {formData.fullName}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 text-xs space-y-3.5">
                    <h4 className="font-black text-amber-900 dark:text-amber-400 text-xs uppercase tracking-wider">How to Pay Your Fees via Remitly</h4>
                    <ol className="list-decimal pl-4 space-y-2 text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                      <li>Download Remitly from the App Store or Google Play, or visit <a href="https://www.remitly.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline font-bold">www.remitly.com</a>. Log in or create an account.</li>
                      <li>Select the country you are sending money from.</li>
                      <li>Select <strong>Egypt</strong> as the country you are sending to.</li>
                      <li>
                        Enter the amount you want to pay: e.g., <strong>${pricing.monthlyRate} USD (One Month Security Deposit)</strong> (or equivalent).
                        <p className="text-red-500 font-bold mt-0.5">⚠️ This account will not accept dollars directly—make sure you send the equivalent in Egyptian Pounds (EGP).</p>
                      </li>
                      <li>Choose the delivery method: <strong>Bank Deposit</strong>.</li>
                      <li>
                        Enter the recipient’s bank details exactly as written below:
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-lg border border-gray-150 dark:border-gray-800 font-medium pl-3 mt-1.5 grid grid-cols-2 gap-1 text-[11px]">
                          <span className="text-gray-400">Account Name:</span>
                          <span className="font-bold text-right col-span-1">{landlordDetails?.recipientName || 'Jimoh Bolakale Ajao'}</span>
                          <span className="text-gray-400">Bank Name:</span>
                          <span className="font-bold text-right col-span-1">{landlordDetails?.remitlyBankName || 'CIB'}</span>
                          <span className="text-gray-400">Bank Location:</span>
                          <span className="font-bold text-right col-span-1">{landlordDetails?.remitlyLocation || 'Cairo'}</span>
                          <span className="text-gray-400 text-left">IBAN:</span>
                          <span className="font-mono font-bold text-right col-span-1 text-brand-600 dark:text-brand-400 select-all">{landlordDetails?.remitlyIban || 'EG320010010900000100063328094'}</span>
                        </div>
                      </li>
                      <li>Choose your payment method (debit card, credit card, or bank transfer).</li>
                      <li>Carefully review all details, ensure reference is marked as <strong className="font-mono bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">BK{bookingResult?.id || '2004'}</strong>, and confirm.</li>
                    </ol>
                  </div>
                </div>
              )}

              <div className="p-4 bg-brand-500/10 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl">
                <p className="text-[11px] text-brand-800 dark:text-brand-300 leading-relaxed font-medium">
                  <strong>👉 NEXT STEP:</strong> Once you complete the payment, take a screenshot or download the receipt. Log into your <strong>Student Dashboard</strong> to upload this screenshot to verify your payment and activate your keys/check-in access.
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
