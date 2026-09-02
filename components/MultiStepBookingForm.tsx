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
  IconCheckCircle,
  IconAlertTriangle 
} from './Icon';
import SignaturePad from 'react-signature-canvas';
import { useReactToPrint } from 'react-to-print';
import TenancyAgreementDocument from './TenancyAgreementDocument';
import { sendEmail, getAgreementSignedTemplate } from '../lib/email';
import { ALL_ROOM_SPACES, BED_SPACE_TO_ID_MAP, getUnifiedRoomName, getParsedRoomSpaces, getAccommodationAddress, findDatabaseRoomForSpace } from '../lib/roomNaming';
import JoinWaitlistModal from './JoinWaitlistModal';

// Swappable media assets (images, tour videos, and features) for each student accommodation category.
export const CATEGORY_MEDIA: Record<string, {
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
      'https://res.cloudinary.com/di7okmjsx/image/upload/v1776582417/apt3_shared_room1_ygv63q.jpg',
      'https://res.cloudinary.com/di7okmjsx/image/upload/q_auto/f_auto/v1776582417/apt3_kitchen_oukmia.jpg'
    ],
    features: ['Premium Suite features', 'Modern kitchen accessibility', 'Spacious study areas', 'In-room high capacity AC', 'Dedicated Resident Lounge Area', 'Weekly student helper laundry cleaning']
  },
  'Premium 3': {
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Embed YouTube or Vimeo video ID
    images: [
      'https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/shared_bathroom1_hlxjdg.jpg',
      'https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/single_room2_zhd9uo.jpg'
    ],
    features: ['Shared bathroom area', 'High-speed student Wi-Fi', 'Air conditioning unit', 'Fully furnished student kitchen', 'Automatic washing machine access', 'Tranquil student community focus']
  },
  'Premium 4': {
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    images: [
      'https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/Suite2_q62y4w.jpg'
    ],
    features: ['Fully Air-Conditioned', 'High-speed student Wi-Fi', 'Dedicated study desk', 'Modern furnishings']
  },
  'Standard': {
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    images: [
      'https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/shared_bathroom1_hlxjdg.jpg',
      'https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/single_room2_zhd9uo.jpg'
    ],
    features: ['Shared bathroom area', 'High-speed student Wi-Fi', 'Air conditioning unit', 'Fully furnished student kitchen', 'Automatic washing machine access', 'Tranquil student community focus']
  }
};

const MultiStepBookingForm: React.FC = () => {
  const t = useTranslation();
  const { user, setPage, addBooking, addActivity, rooms, bedSpaces, bookings, effectiveOccupancyBookings, extendingBooking, landlordDetails, cmsContent, accommodationAddresses, language, contractTranslations, accommodationCategories } = useApp();

  const availableCategories = useMemo(() => {
    if (accommodationCategories && accommodationCategories.length > 0) {
      const active = accommodationCategories.filter(c => c.status !== 'Inactive').map(c => c.name);
      if (active.length > 0) return active;
    }
    return ['Premium 1', 'Premium 2', 'Premium 3'];
  }, [accommodationCategories]);

  const parsedAvailabilityData = useMemo(() => {
    // Exclude inactive rooms from student booking options
    return getParsedRoomSpaces(rooms, effectiveOccupancyBookings, bedSpaces, { includeInactive: false }, accommodationCategories);
  }, [effectiveOccupancyBookings, rooms, bedSpaces, accommodationCategories]);

  const accommodationsSelection = useMemo(() => {
    const map: Record<string, Array<{ id: string; room: string; space: string; type: 'Shared' | 'Private'; label: string }>> = {};
    
    availableCategories.forEach(cat => {
      map[cat] = [];
    });

    parsedAvailabilityData.forEach(item => {
      if (!map[item.category]) {
        map[item.category] = [];
      }
      map[item.category].push({
        id: item.id,
        room: item.roomName,
        space: item.bedSpaceName,
        type: item.type,
        label: item.displayName
      });
    });

    availableCategories.forEach(cat => {
      if (!map[cat] || map[cat].length === 0) {
        map[cat] = ALL_ROOM_SPACES.filter(r => r.category === cat).map(r => ({
          id: r.id,
          room: r.roomName,
          space: r.bedSpaceName,
          type: r.type,
          label: r.displayName
        }));
      }
    });

    return map;
  }, [parsedAvailabilityData, availableCategories]);
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: 'Premium 1' as string,
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
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [waitlistCategory, setWaitlistCategory] = useState<string>('Premium 1');
  const [waitlistType, setWaitlistType] = useState<'Shared' | 'Private'>('Shared');
  const [waitlistSpaceLabel, setWaitlistSpaceLabel] = useState<string | undefined>(undefined);
  
  const sigPadRef = React.useRef<SignaturePad>(null);
  const agreementRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: agreementRef,
    documentTitle: `Tenancy_Agreement_${formData.fullName.replace(/\s+/g, '_')}`,
  });

  const isExtension = Boolean(extendingBooking);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentLeaseExpiry = useMemo(() => extendingBooking?.end_date ? extendingBooking.end_date.split('T')[0] : null, [extendingBooking]);

  // Validation function for extension date
  const getExtensionDateError = (dateVal: string) => {
    if (!dateVal) return "Please choose an extension start date.";
    if (dateVal < todayStr) {
      return "The extension date cannot be in the past. Please select a valid current or future date.";
    }
    if (currentLeaseExpiry && dateVal < currentLeaseExpiry) {
      const formattedExpiry = new Date(currentLeaseExpiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      return `The extension date cannot be before your current lease expiry date (${formattedExpiry}). Your extension must continue on or after your current lease ends.`;
    }
    return null;
  };

  // Sync basic profile & booking defaults if available
  useEffect(() => {
    if (extendingBooking) {
      setFormData(prev => ({
        ...prev,
        fullName: extendingBooking.full_name || prev.fullName || user?.full_name || '',
        email: extendingBooking.email || prev.email || user?.email || '',
        whatsappNumber: extendingBooking.phone_number || prev.whatsappNumber || user?.phone_number || '',
        passportNumber: extendingBooking.passport_number || prev.passportNumber || user?.passport_number || '',
        nationality: extendingBooking.nationality || prev.nationality || user?.nationality || '',
        homeAddress: extendingBooking.emergency_contact || extendingBooking.address_in_egypt || prev.homeAddress || '',
        arrivalDate: extendingBooking.end_date ? extendingBooking.end_date.split('T')[0] : (prev.arrivalDate || todayStr),
      }));
    } else if (user) {
      const latestBooking = bookings && bookings.length > 0 ? bookings[0] : null;
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.full_name || latestBooking?.full_name || '',
        email: prev.email || user.email || latestBooking?.email || '',
        whatsappNumber: prev.whatsappNumber || user.phone_number || latestBooking?.phone_number || '',
        passportNumber: prev.passportNumber || user.passport_number || latestBooking?.passport_number || '',
        nationality: prev.nationality || user.nationality || latestBooking?.nationality || '',
        homeAddress: prev.homeAddress || latestBooking?.emergency_contact || '',
      }));
    }
  }, [user, bookings, extendingBooking, todayStr]);

  // Sync Category change with preselecting room (pre-selecting first available)
  const handleCategoryChange = (cat: string) => {
    const list = accommodationsSelection[cat];
    if (list && list.length > 0) {
      const availableItem = list.find(item => {
        const spaceConfig = parsedAvailabilityData.find(s => s.id === item.id);
        const isOccupied = spaceConfig?.isOccupied;
        const bookingForSpace = spaceConfig?.booking;
        const isSpaceOccupied = isOccupied && (!extendingBooking || bookingForSpace?.id !== extendingBooking.id);
        return !isSpaceOccupied;
      }) || list[0];

      setFormData(prev => ({
        ...prev,
        category: cat,
        selectedRoomId: availableItem.id,
        roomName: availableItem.room,
        bedSpaceName: availableItem.space,
        roomType: availableItem.type,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        category: cat,
      }));
    }
  };

  const handleRoomSelect = (id: string) => {
    const list = accommodationsSelection[formData.category];
    const item = list?.find(it => it.id === id);
    if (item) {
      const spaceConfig = parsedAvailabilityData.find(s => s.id === id);
      const isOccupied = spaceConfig?.isOccupied;
      const bookingForSpace = spaceConfig?.booking;
      const isSpaceOccupied = isOccupied && (!extendingBooking || bookingForSpace?.id !== extendingBooking.id);

      if (isSpaceOccupied) return; // Do not allow selection of occupied rooms

      setFormData(prev => ({
        ...prev,
        selectedRoomId: id,
        roomName: item.room,
        bedSpaceName: item.space,
        roomType: item.type,
      }));
    }
  };

  // Determine if all spaces in the selected category are occupied
  const areAllSpacesInSelectedCategoryOccupied = useMemo(() => {
    const list = accommodationsSelection[formData.category] || [];
    return list.every(item => {
      const spaceConfig = parsedAvailabilityData.find(s => s.id === item.id);
      const isOccupied = spaceConfig?.isOccupied;
      const bookingForSpace = spaceConfig?.booking;
      return isOccupied && (!extendingBooking || bookingForSpace?.id !== extendingBooking.id);
    });
  }, [parsedAvailabilityData, accommodationsSelection, formData.category, extendingBooking]);

  // Determine if the currently selected room is occupied
  const isCurrentSelectionOccupied = useMemo(() => {
    const spaceConfig = parsedAvailabilityData.find(s => s.id === formData.selectedRoomId);
    const isOccupied = spaceConfig?.isOccupied;
    const bookingForSpace = spaceConfig?.booking;
    return isOccupied && (!extendingBooking || bookingForSpace?.id !== extendingBooking.id);
  }, [parsedAvailabilityData, formData.selectedRoomId, extendingBooking]);

  // Pre-select first available room on load or update if current selected is occupied
  useEffect(() => {
    if (parsedAvailabilityData.length > 0) {
      const selectedSpace = parsedAvailabilityData.find(s => s.id === formData.selectedRoomId);
      const isSelectedOccupied = selectedSpace?.isOccupied && (!extendingBooking || selectedSpace?.booking?.id !== extendingBooking.id);
      
      if (isSelectedOccupied) {
        const list = accommodationsSelection[formData.category];
        const firstAvailable = list?.find(item => {
          const spaceConfig = parsedAvailabilityData.find(s => s.id === item.id);
          const isOccupied = spaceConfig?.isOccupied;
          const bookingForSpace = spaceConfig?.booking;
          const isSpaceOccupied = isOccupied && (!extendingBooking || bookingForSpace?.id !== extendingBooking.id);
          return !isSpaceOccupied;
        });
        
        if (firstAvailable) {
          setFormData(prev => ({
            ...prev,
            selectedRoomId: firstAvailable.id,
            roomName: firstAvailable.room,
            bedSpaceName: firstAvailable.space,
            roomType: firstAvailable.type,
          }));
        }
      }
    }
  }, [parsedAvailabilityData, accommodationsSelection, extendingBooking, formData.category, formData.selectedRoomId]);

  // Automatically pre-select existing bed space on extension flow
  useEffect(() => {
    if (extendingBooking && parsedAvailabilityData.length > 0) {
      const mySpace = parsedAvailabilityData.find(s => s.booking?.id === extendingBooking.id);
      if (mySpace) {
        let foundCat: string = availableCategories[0] || 'Premium 1';
        for (const cat of availableCategories) {
          if (accommodationsSelection[cat]?.some(item => item.id === mySpace.id)) {
            foundCat = cat;
            break;
          }
        }
        
        const item = accommodationsSelection[foundCat]?.find(it => it.id === mySpace.id);
        if (item) {
          setFormData(prev => ({
            ...prev,
            category: foundCat,
            selectedRoomId: item.id,
            roomName: item.room,
            bedSpaceName: item.space,
            roomType: item.type,
          }));
        }
      }
    }
  }, [extendingBooking, parsedAvailabilityData, accommodationsSelection, availableCategories]);

  // Navigation handlers: seamlessly skip Step 3 if extending existing lease
  const nextStep = () => {
    setError(null);
    if (step === 2 && isExtension) {
      const dateErr = getExtensionDateError(formData.arrivalDate);
      if (dateErr) {
        setError(dateErr);
        return;
      }
      // Skip personal details step (Step 3) directly to Review (Step 4)
      setStep(4);
    } else if (step === 3) {
      if (formData.arrivalDate && formData.arrivalDate < todayStr) {
        setError("Expected arrival date cannot be in the past.");
        return;
      }
      setStep(4);
    } else {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setError(null);
    if (step === 4 && isExtension) {
      // Return directly to Step 2 when navigating back in extension flow
      setStep(2);
    } else {
      setStep(prev => Math.max(1, prev - 1));
    }
  };

  // Find corresponding database room if available
  const selectedSupabaseRoom = useMemo(() => {
    return findDatabaseRoomForSpace(rooms, {
      category: formData.category,
      type: formData.roomType,
      roomName: formData.roomName,
      id: formData.selectedRoomId
    });
  }, [rooms, formData.category, formData.roomType, formData.roomName, formData.selectedRoomId]);

  // Calculated Pricing Engine
  const pricing = useMemo(() => {
    const isPremium = formData.category.startsWith('Premium');
    const isPrivate = formData.roomType === 'Private';
    const months = parseInt(formData.duration, 10);

    let baseRate = isPremium ? 175 : 150;
    if (isPrivate) baseRate += 50;

    let discount = 0;
    if (months >= 12) discount = 0.15;
    else if (months >= 6) discount = 0.10;
    else if (months >= 4) discount = 0.05;

    const monthlyRate = Math.round(baseRate * (1 - discount));
    const totalPrice = monthlyRate * months;

    return { baseRate, discount: Math.round(discount * 100), monthlyRate, totalPrice };
  }, [formData.category, formData.roomType, formData.duration]);

  // Dynamic start & calculated end date
  const startDate = formData.arrivalDate || todayStr;
  const endDate = useMemo(() => {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + parseInt(formData.duration, 10));
    return d.toISOString().split('T')[0];
  }, [startDate, formData.duration]);

  // Submission handler
  const handleSubmit = async () => {
    if (!formData.fullName || !formData.nationality || !formData.passportNumber || !formData.arrivalDate || !formData.email) {
      setError(t.step5_error_missing_details || 'Please ensure all student credentials and dates are verified before submitting.');
      return;
    }

    if (isExtension) {
      const dateErr = getExtensionDateError(formData.arrivalDate);
      if (dateErr) {
        setError(dateErr);
        return;
      }
    } else if (formData.arrivalDate && formData.arrivalDate < todayStr) {
      setError('The selected arrival date cannot be in the past.');
      return;
    }

    if (!signature) {
      setError(t.step5_error_missing_signature || 'Please provide your signature on the tenancy agreement.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const unifiedRoomName = getUnifiedRoomName(formData.category, formData.roomName, formData.bedSpaceName);
      const chosenRoomId = selectedSupabaseRoom ? selectedSupabaseRoom.id : (BED_SPACE_TO_ID_MAP[formData.selectedRoomId] || 1);

      const newBookingPayload: Omit<Booking, 'id' | 'created_at'> = {
        user_id: user ? user.id : 'anonymous_guest',
        room_id: chosenRoomId,
        package_months: parseInt(formData.duration, 10),
        total_price: pricing.totalPrice,
        academic_term: `${formData.category} Term (${formData.duration} Mos)`,
        start_date: startDate,
        end_date: endDate,
        status: BookingStatus.PENDING_PAYMENT,
        payment_method: 'bank_transfer',
        full_name: formData.fullName,
        email: formData.email,
        expected_arrival_date: formData.arrivalDate,
        nationality: formData.nationality,
        passport_number: formData.passportNumber,
        phone_number: formData.whatsappNumber,
        gender: 'Any' as any,
        preferred_accommodation: `${formData.category} - ${formData.roomType} (${formData.roomName}, ${formData.bedSpaceName})`,
        emergency_contact: formData.homeAddress,
        address_in_egypt: getAccommodationAddress(formData.category, accommodationAddresses),
        duration_of_stay: `${formData.duration} Months`,
        signature_data: signature,
        contract_signed_at: new Date().toISOString(),
        is_extended: !!extendingBooking,
        previous_booking_id: extendingBooking ? extendingBooking.id : undefined,
      };

      const result = await addBooking(newBookingPayload);
      if (!result.success) throw new Error(result.error);
      
      const createdBooking = result.data!;
      setBookingResult(createdBooking);

      // Email notifications
      const emailTemplate = getAgreementSignedTemplate(formData.fullName, createdBooking.id);
      
      // 1. Send Booking Confirmation / Tenancy Agreement Signed Email
      try {
        const emailRes = await sendEmail({
          to: formData.email,
          subject: emailTemplate.subject,
          body: emailTemplate.body,
          templateName: emailTemplate.templateName,
          metadata: { booking_id: createdBooking.id, type: 'agreement_signed' }
        });
        if (!emailRes.success) {
          console.warn("[Booking Dispatch] Booking confirmation email delivery issue:", emailRes.error);
        }
      } catch (err) {
        console.error("Failed to send booking confirmation email:", err);
      }
      
      // 2. Send Landlord bank details / payment instructions email to student
      try {
        const payEmailRes = await sendEmail({
          to: formData.email,
          subject: `Booking Agreement BK${createdBooking.id} & Landlord Payment Instructions`,
          body: `Dear ${formData.fullName},\n\nWe have received your officially signed tenancy agreement for your stay at Al-Ibaanah Student Residency!\n\nDeposit Due Now: $${pricing.monthlyRate} USD.\nRoom: ${unifiedRoomName}\n\nPlease proceed to upload your payment receipt to your student dashboard.`,
          templateName: 'payment_instructions',
          metadata: { booking_id: createdBooking.id, type: 'payment_instructions' }
        });
        if (!payEmailRes.success) {
          console.warn("[Booking Dispatch] Payment instructions email delivery issue:", payEmailRes.error);
        }
      } catch (err) {
        console.error("Failed to send payment instructions email:", err);
      }

      addActivity({
        user_id: user ? user.id : 'guest',
        type: 'booking',
        description: `Submitted tenancy agreement and booking application for ${unifiedRoomName}`,
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
  const categorySpaces = useMemo(() => {
    return parsedAvailabilityData.filter(s => s.category === formData.category);
  }, [parsedAvailabilityData, formData.category]);

  const activeCategoryBedsCount = categorySpaces.length > 0 ? categorySpaces.length : 4;
  const currentOccupied = categorySpaces.filter(s => {
    const bookingForSpace = s.booking;
    return s.isOccupied && (!extendingBooking || bookingForSpace?.id !== extendingBooking.id);
  }).length;
  const occupancyPercentage = activeCategoryBedsCount > 0 ? Math.round((currentOccupied / activeCategoryBedsCount) * 100) : 0;

  // Expectations array
  const expectations = [
    t.step1_occupancy_summary
      ?.replace('{category}', formData.category)
      .replace('{beds}', String(activeCategoryBedsCount))
      .replace('{occupied}', String(currentOccupied))
      .replace('{rate}', String(occupancyPercentage)) || `Occupancy status: The Selected ${formData.category} Apartment will accommodate up to ${activeCategoryBedsCount} residents. (${currentOccupied} spaces booked, rendering a ${occupancyPercentage}% category occupancy rate).`,
    t.step1_perk_furnished || "Fully furnished apartments",
    t.step1_perk_room_options || "Private and shared room options (2 students per shared room)",
    t.step1_perk_workstation || "Personal workstation for each student",
    t.step1_perk_shared_areas || "Shared kitchen, living, shared bathroom and toilet and dining areas",
    t.step1_perk_cleaning || "Professional cleaning 3 times per week",
    t.step1_perk_utilities || "Electricity, water, and internet included",
    t.step1_perk_environment || "Safe, respectful, and structured environment"
  ];

  // Helper to translate media perks
  const getFeatureLabel = (feature: string) => {
    switch (feature) {
      case 'High-speed student Wi-Fi': return t.step2_perk_wifi || feature;
      case 'In-room Air Conditioning': return t.step2_perk_ac || feature;
      case 'En-suite Luxury Bathroom option': return t.step2_perk_ensuite || feature;
      case 'Private Room option': return t.step2_perk_private_room || feature;
      case 'Cozy premium furniture layout': return t.step2_perk_furniture || feature;
      case 'Access to Elite Study common areas': return t.step2_perk_study_areas || feature;
      case 'Premium Suite features': return t.step2_perk_suite_features || feature;
      case 'Modern kitchen accessibility': return t.step2_perk_modern_kitchen || feature;
      case 'Spacious study areas': return t.step2_perk_spacious_study || feature;
      case 'In-room high capacity AC': return t.step2_perk_high_ac || feature;
      case 'Dedicated Resident Lounge Area': return t.step2_perk_lounge || feature;
      case 'Weekly student helper laundry cleaning': return t.step2_perk_helper_laundry || feature;
      case 'Shared bathroom area': return t.step2_perk_shared_bath || feature;
      case 'Fully furnished student kitchen': return t.step2_perk_student_kitchen || feature;
      case 'Automatic washing machine access': return t.step2_perk_washing_machine || feature;
      case 'Tranquil student community focus': return t.step2_perk_community || feature;
      default: return feature;
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1: // Explore Our Accommodations
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t.step1_header || "Explore Our Accommodations"}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.step1_sub || "Please explore categories and select your target room and bed space location below."}</p>
            </div>

            {/* Category selection */}
            <div className={`grid grid-cols-1 md:grid-cols-${Math.min(availableCategories.length, 4)} gap-4`}>
              {availableCategories.map(cat => {
                const catObj = accommodationCategories?.find(c => c.name.toLowerCase() === cat.toLowerCase() || c.id.toLowerCase() === cat.toLowerCase());
                const price = catObj?.defaultPrice || 175;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`p-5 rounded-2xl border-2 transition-all text-center ${
                      formData.category === cat 
                        ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-900/10 ring-4 ring-brand-500/10' 
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <span className="block font-black text-base text-gray-900 dark:text-white uppercase tracking-wider">{cat}</span>
                    <span className="text-xs text-brand-600 dark:text-brand-400 font-bold mt-1 block">
                      {t.pricePerMonth?.replace('{price}', `$${price}`) || `From $${price}/mo`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Room choice & Bed selection for selected category */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 uppercase tracking-wider text-start">
                  {(t.step1_category_rooms_beds || "Rooms & Bed space configuration in {category}").replace('{category}', formData.category)}
                </h3>
                <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold bg-brand-50 dark:bg-brand-950/40 px-3 py-1 rounded-full w-fit">
                  📍 {getAccommodationAddress(formData.category, accommodationAddresses)}
                </span>
              </div>

              {areAllSpacesInSelectedCategoryOccupied && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-400 text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-start">
                    <IconInfo className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold uppercase tracking-wider text-[10px]">{t.step1_fully_booked_title || "Category Fully Booked"}</p>
                      <p className="mt-0.5">{(t.step1_fully_booked_desc || "All bed spaces in the {category} category are currently reserved. You can join the waitlist to be notified first when a space opens.").replace('{category}', formData.category)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setWaitlistCategory(formData.category);
                      setWaitlistType('Shared');
                      setWaitlistSpaceLabel(`${formData.category} Residency`);
                      setIsWaitlistModalOpen(true);
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5"
                  >
                    <span>⏳ Join {formData.category} Waitlist</span>
                  </button>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accommodationsSelection[formData.category]?.map(item => {
                  const spaceConfig = parsedAvailabilityData.find(s => s.id === item.id);
                  const isOccupied = spaceConfig?.isOccupied;
                  const bookingForSpace = spaceConfig?.booking;
                  const isSpaceOccupied = isOccupied && (!extendingBooking || bookingForSpace?.id !== extendingBooking.id);
                  const finalAvailDate = spaceConfig?.nextAvailableDate || 'Available Now';

                  return (
                    <div
                      key={item.id}
                      onClick={() => !isSpaceOccupied && handleRoomSelect(item.id)}
                      className={`p-4 rounded-xl border text-start flex flex-col justify-between transition-all ${
                        isSpaceOccupied
                          ? 'border-gray-200 dark:border-gray-800 bg-gray-100/40 dark:bg-gray-950/40 opacity-90'
                          : formData.selectedRoomId === item.id
                          ? 'border-brand-500 bg-brand-50/20 text-brand-700 dark:text-brand-400 font-bold cursor-pointer'
                          : 'border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-brand-200 hover:bg-gray-50 dark:hover:bg-gray-800/80 cursor-pointer'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="block font-bold text-sm text-gray-900 dark:text-white">{item.room}</span>
                          <span className="text-xs text-gray-400 block mt-0.5 font-medium">{item.type} room ({item.space})</span>
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="text-[9px] uppercase font-bold text-gray-400">{t.step1_available_prefix || "Available:"}</span>
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              isSpaceOccupied
                                ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                                : finalAvailDate === 'Available Now'
                                ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                            }`}>
                              {isSpaceOccupied
                                ? (finalAvailDate === 'Available Now' ? (t.step1_status_fully_booked || 'Fully Booked') : ((t.step1_status_fully_booked_next || 'Fully Booked (Next: {date})').replace('{date}', finalAvailDate)))
                                : (finalAvailDate === 'Available Now' ? (t.step1_status_available_now || 'Available Now') : finalAvailDate)
                              }
                            </span>
                          </div>
                        </div>
                        {formData.selectedRoomId === item.id && !isSpaceOccupied && (
                          <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center flex-shrink-0">
                            <IconCheck className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {isSpaceOccupied && (
                          <span className="text-[10px] text-red-600 font-black uppercase tracking-wider">{t.step1_status_booked || "Booked"}</span>
                        )}
                      </div>

                      {isSpaceOccupied && (
                        <div className="mt-3 pt-2.5 border-t border-gray-200/60 dark:border-gray-800/60 flex justify-between items-center">
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Waitlist available</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setWaitlistCategory(formData.category);
                              setWaitlistType(item.type);
                              setWaitlistSpaceLabel(`${formData.category} - ${item.room} (${item.space})`);
                              setIsWaitlistModalOpen(true);
                            }}
                            className="text-[11px] font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                          >
                            <span>⏳ Join Waitlist</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* What you can expect Checklist */}
            <div className="bg-amber-50/40 dark:bg-gray-900/40 p-6 rounded-2xl border border-amber-100/50 dark:border-gray-700 space-y-4">
              <h3 className="font-bold text-xs text-amber-800 dark:text-amber-400 uppercase tracking-wider text-start">{t.step1_expect_title || "What You Can Expect"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-700 dark:text-gray-300 text-start">
                {expectations.map((exp, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="text-emerald-600 font-bold flex-shrink-0">✔</span>
                    <span>{exp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 pt-4">
              {isCurrentSelectionOccupied && (
                <p className="text-xs text-red-500 font-bold">{t.step1_error_space_occupied || "The selected space is currently fully booked. Please choose an available space."}</p>
              )}
              <button
                onClick={nextStep}
                disabled={isCurrentSelectionOccupied}
                className={`flex items-center gap-2 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md active:scale-95 ${
                  isCurrentSelectionOccupied
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-70'
                    : 'bg-brand-600 hover:bg-brand-700'
                }`}
              >
                <span>{t.step1_btn_continue || "Continue to Features & Pricing"}</span>
                <IconChevronRight className="w-5 h-5 rtl:rotate-180" />
              </button>
            </div>
          </div>
        );

      case 2: // Apartment features, pricing, Shared vs Private selection
        {
          const media = cmsContent?.categoryMedia?.[formData.category] || 
                        CATEGORY_MEDIA[formData.category] || 
                        CATEGORY_MEDIA['Premium 1'] || 
                        { videoUrl: '', images: [], features: [] };
          
          let videoUrl = media.videoUrl;
          if (selectedSupabaseRoom?.video_urls && selectedSupabaseRoom.video_urls.length > 0) {
            const rawVideoUrl = selectedSupabaseRoom.video_urls[0];
            if (rawVideoUrl && rawVideoUrl.trim() !== '') {
              videoUrl = rawVideoUrl;
            }
          }
          
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
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t.step2_header || "Apartment Features & Details"}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.step2_sub || "Review your apartment visual assets, exact features, configurations and choose stay options."}</p>
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
                <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 text-start">
                  {/* 1. Shared or Private Option */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.step2_opt_room_pref_title || "A. Choose Room Preference"}</label>
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 text-sm font-semibold text-gray-850 dark:text-gray-250 flex justify-between items-center animate-pulse">
                      <span>{formData.roomType === 'Shared' ? (t.step2_room_shared_title || 'Shared Room Option') : (t.step2_room_private_title || 'Private Single Room Option')}</span>
                      <span className="text-[10px] bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 font-bold px-2.5 py-0.5 rounded border border-brand-200 dark:border-brand-800 uppercase tracking-wider leading-none">{t.step2_selected_bed_badge || "Selected Bed Choice"}</span>
                    </div>
                  </div>

                  {/* Included Perks & Amenities */}
                  {media.features && media.features.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-mono">{t.step2_perks_title || "Included Comfort Features"}</label>
                      <div className="grid grid-cols-2 gap-1.5 p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl">
                        {media.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-gray-700 dark:text-gray-300">
                            <span className="text-brand-600 dark:text-brand-400 font-extrabold">✓</span>
                            <span>{getFeatureLabel(feature)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Duration of stay */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.step2_opt_duration_title || "B. Duration of Stay"}</label>
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
                          {(t.step2_duration_months_btn || "{months} Mos").replace('{months}', months)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Extension Start Date (when extending lease) */}
                  {isExtension && (
                    <div className="space-y-3 pt-2 border-t border-gray-150 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Extension Commencement Date
                        </label>
                        {currentLeaseExpiry && (
                          <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
                            Current lease ends: {new Date(currentLeaseExpiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <input 
                        type="date"
                        value={formData.arrivalDate}
                        min={currentLeaseExpiry && currentLeaseExpiry > todayStr ? currentLeaseExpiry : todayStr}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, arrivalDate: e.target.value }));
                          setError(null);
                        }}
                        className={`w-full p-3 rounded-xl border text-xs font-medium bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all ${
                          getExtensionDateError(formData.arrivalDate)
                            ? 'border-red-500 ring-2 ring-red-500/20'
                            : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-500'
                        }`}
                      />
                      {getExtensionDateError(formData.arrivalDate) ? (
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-start gap-2 animate-shake">
                          <IconAlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="leading-snug text-[11px] font-medium">{getExtensionDateError(formData.arrivalDate)}</p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-400">
                          Your extension will begin on this date and run for {formData.duration} months until {endDate}.
                        </p>
                      )}
                    </div>
                  )}

                  {/* 3. Pricing Box */}
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-950 rounded-xl space-y-2 border border-gray-100 dark:border-gray-900 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-semibold uppercase tracking-widest text-[10px]">{t.step2_monthly_rate_label || "Monthly Subscription rate:"}</span>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">
                        {(t.step2_monthly_rate_val || "${rate} USD / mo").replace('{rate}', String(pricing.monthlyRate))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-900 pt-2">
                      <span className="text-brand-600 font-black uppercase tracking-widest text-[10px]">
                        {(t.step2_total_price_label || "Total Stay Price ({duration} mos):").replace('{duration}', formData.duration)}
                      </span>
                      <span className="font-black text-brand-600 text-lg">${pricing.totalPrice} USD</span>
                    </div>
                    <p className="text-[10px] text-gray-400 italic leading-snug mt-2">
                      {t.step2_pricing_disclaimer || "* Rates are optimized according to the selected duration tier. Total includes water, electricity and 3x/week cleaning."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                <button onClick={prevStep} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 font-bold">
                  <IconChevronLeft className="w-4 h-4 rtl:rotate-180" /> <span>{t.step2_btn_back || "Back to accommodations"}</span>
                </button>
                <button
                  onClick={nextStep}
                  disabled={isExtension && !!getExtensionDateError(formData.arrivalDate)}
                  className="flex items-center gap-2 bg-brand-600 disabled:opacity-50 hover:bg-brand-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
                >
                  <span>
                    {isExtension 
                      ? "Continue to Review (Details on file)" 
                      : (t.step2_btn_continue || "Continue to Student's Information")}
                  </span>
                  <IconChevronRight className="w-5 h-5 rtl:rotate-180" />
                </button>
              </div>
            </div>
          );
        }

      case 3: // Student's Details Page
        return (
          <div className="space-y-6 animate-fade-in text-start">
            <div className="text-center">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t.step3_header || "Student's Information"}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.step3_sub || "Please provide your official credential information as shown on your international passport."}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField label={t.step3_label_fullname || "Full Name (as in passport)"} value={formData.fullName} onChange={(e: any) => setFormData({...formData, fullName: e.target.value})} placeholder={t.step3_placeholder_fullname || "e.g. Abdullah Khan"} />
              <InputField label={t.step3_label_nationality || "Nationality"} value={formData.nationality} onChange={(e: any) => setFormData({...formData, nationality: e.target.value})} placeholder={t.step3_placeholder_nationality || "e.g. British"} />
              <InputField label={t.step3_label_passport || "Passport Number"} value={formData.passportNumber} onChange={(e: any) => setFormData({...formData, passportNumber: e.target.value})} placeholder={t.step3_placeholder_passport || "e.g. GB982421A"} />
              <InputField label={t.step3_label_phone || "WhatsApp / Contact Phone Number"} value={formData.whatsappNumber} onChange={(e: any) => setFormData({...formData, whatsappNumber: e.target.value})} placeholder={t.step3_placeholder_phone || "e.g. +44 7911 123456"} />
              <InputField label={t.step3_label_email || "Email Address"} type="email" value={formData.email} onChange={(e: any) => setFormData({...formData, email: e.target.value})} placeholder={t.step3_placeholder_email || "e.g. student@gmail.com"} />
              <InputField label={t.step3_label_arrival || "Expected Arrival / Move-in Date"} type="date" value={formData.arrivalDate} onChange={(e: any) => setFormData({...formData, arrivalDate: e.target.value})} />
              
              <div className="md:col-span-2">
                <InputField label={t.step3_label_home_address || "Home Address (Original residency home address before Egypt)"} value={formData.homeAddress} onChange={(e: any) => setFormData({...formData, homeAddress: e.target.value})} placeholder={t.step3_placeholder_home_address || "e.g. 104 Baker Street, London, UK"} />
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
              <button onClick={prevStep} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 font-bold">
                <IconChevronLeft className="w-4 h-4 rtl:rotate-180" /> <span>{t.step3_btn_back || "Back to stay options"}</span>
              </button>
              <button
                disabled={!formData.fullName || !formData.nationality || !formData.passportNumber || !formData.arrivalDate || !formData.email}
                onClick={nextStep}
                className="flex items-center gap-2 bg-brand-600 disabled:opacity-50 hover:bg-brand-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
              >
                <span>{t.step3_btn_continue || "Continue to Review"}</span>
                <IconChevronRight className="w-5 h-5 rtl:rotate-180" />
              </button>
            </div>
          </div>
        );

      case 4: // Review Booking Summary
        return (
          <div className="space-y-6 animate-fade-in text-start">
            <div className="text-center">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t.step4_header || "Review Your Booking Settings"}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.step4_sub || "Verify all parameters are correct and matches passport credentials prior to executing signing."}</p>
            </div>

            {isExtension && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center gap-3">
                <IconCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-900 dark:text-emerald-300">Verified Student Credentials on File</p>
                  <p className="text-emerald-700 dark:text-emerald-400">Personal details and identification loaded directly from your active tenancy records.</p>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                <h3 className="font-black text-brand-800 dark:text-brand-300 uppercase tracking-wider text-xs">{t.step4_card_accommodation || "Accommodation Selection"}</h3>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <SummaryItem label={t.step4_label_category || "Apartment Category"} value={formData.category} />
                  <SummaryItem label={t.step4_label_room_name || "Room Name"} value={`${formData.roomName} (${formData.bedSpaceName})`} />
                  <SummaryItem label={t.step4_label_placement || "Placement Level"} value={`${formData.roomType} room`} />
                  <SummaryItem label={t.step4_label_duration || "Duration"} value={(t.step4_duration_val || "{duration} Months").replace('{duration}', formData.duration)} />
                  <div className="col-span-2">
                    <SummaryItem label={t.step4_label_address || "Accommodation Address"} value={getAccommodationAddress(formData.category, accommodationAddresses)} />
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-black text-brand-800 dark:text-brand-300 uppercase tracking-wider text-xs">{t.step4_card_credentials || "Student Credentials"}</h3>
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                  <SummaryItem label={t.step4_label_fullname || "Official Name"} value={formData.fullName} />
                  <SummaryItem label={t.step4_label_nationality || "Nationality"} value={formData.nationality} />
                  <SummaryItem label={t.step4_label_passport || "Passport #"} value={formData.passportNumber} />
                  <SummaryItem label={t.step4_label_phone || "WhatsApp Contact"} value={formData.whatsappNumber} />
                  <SummaryItem label={isExtension ? "Extension Start Date" : (t.step4_label_arrival || "Expected Move-in")} value={formData.arrivalDate} />
                  <SummaryItem label={t.step4_label_home_address || "Original Home Address"} value={formData.homeAddress} />
                </div>
              </div>

              <div className="p-6 bg-brand-800 text-white flex justify-between items-center rounded-b-2xl">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">{t.step4_badge_security_deposit || "Two months' advance security deposit"}</span>
                  <span className="text-lg font-bold">{t.step4_cost_breakdown_label || "Total Stay Cost Breakdown:"}</span>
                </div>
                <div className="text-end">
                  <span className="text-3xl font-black">${pricing.totalPrice} USD</span>
                  <p className="text-[10px] opacity-80 mt-1">{(t.step4_cost_breakdown_sub || "(${monthlyRate} USD/month)").replace('{monthlyRate}', String(pricing.monthlyRate))}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
              <button onClick={prevStep} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 font-bold">
                <IconChevronLeft className="w-4 h-4 rtl:rotate-180" /> <span>{isExtension ? "Back to stay options" : (t.step4_btn_back || "Back to details")}</span>
              </button>
              <button
                onClick={nextStep}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
              >
                <span>{t.step4_btn_continue || "Proceed to Tenancy Agreement"}</span>
                <IconChevronRight className="w-5 h-5 rtl:rotate-180" />
              </button>
            </div>
          </div>
        );

      case 5: // Tenancy Agreement with digital signature and print option
        return (
          <div className="space-y-8 animate-fade-in text-start">
            <div className="text-center">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t.step5_header || "Official Tenancy Agreement"}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.step5_sub || "Review the complete document contents in conformity with Cairo residency files and digital sign."}</p>
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
                    customAddresses={accommodationAddresses}
                    language={language}
                    contractTranslations={contractTranslations}
                 />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
               {/* Drawing Signature */}
               <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
                    <IconSignature className="w-4.5 h-4.5 text-brand-600" /> {t.step5_box_signature || "Digital Ink Signature"}
                  </h3>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 space-y-3">
                    <div className="aspect-[3/1] bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden touch-none border border-gray-200" dir="ltr">
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
                         {t.step5_btn_reset_sig || "Reset Signature"}
                       </button>
                       <span className="text-gray-400">{t.step5_helper_sign_box || "Sign inside box"}</span>
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
                     <span className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase">{t.step5_badge_signed || "Agreement digitally signed"}</span>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-brand-100/20">
                    <button 
                      onClick={handlePrint}
                      type="button"
                      className="w-full text-xs font-bold text-gray-700 hover:text-brand-800 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-center"
                    >
                      {t.step5_btn_print || "Print Copy / PDF"}
                    </button>
                    <button 
                      disabled={isSubmitting || !signature}
                      onClick={handleSubmit}
                      className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider text-sm transition-all shadow-md disabled:opacity-50"
                    >
                      {isSubmitting ? (t.step5_btn_submitting || "Submitting Booking...") : (t.step5_btn_submit || "Submit & Authorize Agreement")}
                    </button>
                    {error && <p className="text-red-500 text-xs font-bold text-center mt-2">{error}</p>}
                  </div>
               </div>
            </div>

            <button onClick={prevStep} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 font-bold">
              <IconChevronLeft className="w-4 h-4 rtl:rotate-180" /> <span>{t.step5_btn_back || "Back to Review"}</span>
            </button>
          </div>
        );

      case 6: // Confirmation screen showing payment details
        return (
          <div className="space-y-8 animate-fade-in text-center max-w-2xl mx-auto py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 shadow-inner mb-2 animate-bounce-slow">
              <IconCheck className="w-10 h-10" />
            </div>

            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t.step6_title || "Agreement Executed!"}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-450 leading-relaxed">
              {(t.step6_congrats || "Congratulations {name}, your signed Tenancy Agreement has been authorized and filed. We have dispatched a confirmation email copy to {email} with complete payment directions.")
                .replace('{name}', formData.fullName)
                .replace('{email}', formData.email)}
            </p>

            {/* Landlord payment details */}
            <div className="bg-amber-50/20 dark:bg-gray-900/30 border border-amber-200/40 dark:border-gray-800 p-6 rounded-2xl text-start space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-800 pb-4 gap-4">
                <div>
                  <h3 className="font-black text-amber-900 dark:text-amber-400 text-xs uppercase tracking-wider flex items-center gap-2">
                    📢 {t.step6_action_required_badge || "ACTION REQUIRED: Secure Your Bed"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{t.step6_select_payment_method || "Please select your preferred payment method:"}</p>
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
                    {t.step6_tab_bank || "Bank Transfer"}
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
                    {t.step6_tab_remitly || "Remitly Transfer"}
                  </button>
                </div>
              </div>

              {/* Action notice for Deposit Pay */}
              <div className="p-5 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-900 rounded-2xl text-start space-y-2.5">
                <h4 className="font-black text-amber-900 dark:text-amber-400 text-sm uppercase tracking-wide flex items-center gap-1.5">
                  ⚠️ {(t.step6_deposit_banner_title || "Deposit of One Month (Due Now) Required: ${amount} USD").replace('{amount}', String(pricing.monthlyRate))}
                </h4>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
                  {(t.step6_deposit_banner_body || "To complete your booking and secure your bed space booking, a Security Deposit of one month (Due Now) in the amount of ${amount} USD is required immediately. This deposit of one month (Due Now) is what makes your residency reservation possible.").replace('{amount}', String(pricing.monthlyRate))}
                </p>
                <div className="flex justify-between text-xs pt-2.5 border-t border-amber-200 dark:border-amber-900 font-bold">
                  <span className="text-gray-400 uppercase tracking-wider text-[10px]">{t.step6_due_now_label || "Due Now (Security Deposit):"}</span>
                  <span className="text-amber-700 font-black font-mono select-all">${pricing.monthlyRate} USD</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-400 uppercase tracking-wider text-[10px]">{t.step6_remaining_balance_label || "Remaining Stay Rent Balance:"}</span>
                  <span className="text-gray-700 dark:text-gray-300 font-mono">${pricing.totalPrice - pricing.monthlyRate} USD</span>
                </div>
              </div>

              {confirmPaymentTab === 'bank' ? (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 text-xs space-y-3 font-medium">
                    <div className="flex justify-between border-b pb-2 text-sm">
                      <span className="text-gray-400">{t.step6_deposit_charged_label || "Security Deposit Charged:"}</span>
                      <span className="font-black text-brand-700">${pricing.monthlyRate} USD</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2.5 pt-2">
                      <div className="text-gray-400 font-bold uppercase tracking-wider text-[10px] text-start">{t.step6_bank_recipient || "Recipient Name"}</div>
                      <div className="font-bold text-gray-900 dark:text-white select-all text-end">{landlordDetails?.recipientName || 'Jimoh Bolakale Ajao'}</div>

                      <div className="text-gray-400 font-bold uppercase tracking-wider text-[10px] text-start">{t.step6_bank_name || "Bank Name"}</div>
                      <div className="font-bold text-gray-900 dark:text-white text-end">{landlordDetails?.bankName || 'Commercial International Bank (CIB)'}</div>

                      <div className="text-gray-400 font-bold uppercase tracking-wider text-[10px] text-start">{t.step6_bank_iban || "IBAN"}</div>
                      <div className="font-mono font-bold text-amber-600 dark:text-amber-400 select-all text-end">{landlordDetails?.iban || 'EG98 0010 0109 0000 0100 0633 2816 7'}</div>

                      <div className="text-gray-400 font-bold uppercase tracking-wider text-[10px] text-start">{t.step6_bank_swift || "SWIFT / BIC Code"}</div>
                      <div className="font-mono font-bold select-all text-end">{landlordDetails?.swiftCode || 'CIBEEGCXXXX'}</div>

                      <div className="text-gray-400 font-bold uppercase tracking-wider text-[10px] text-start">{t.step6_bank_phone || "Phone Number"}</div>
                      <div className="font-bold select-all text-end">{landlordDetails?.phone || '+20 1030062440'}</div>
                    </div>
                    
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-3 text-[11px] text-gray-500 leading-normal text-start">
                      <strong className="text-gray-700 dark:text-gray-300 block mb-1">🏦 {t.step6_bank_address || "Bank Address:"}</strong>
                      {landlordDetails?.street || '71 Abou Dawood El Zahry Street, Off Makram Ebeid Street'}, {landlordDetails?.city || 'Nasr City, Cairo'}, {landlordDetails?.country || 'Egypt'} (P.O. Box {landlordDetails?.poBox || '11341'})
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between items-center">
                      <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">{t.step6_bank_reference || "Reference / Memo:"}</span>
                      <span className="font-black font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded border border-gray-200 dark:border-gray-800 text-xs select-all">
                        {getUnifiedRoomName(formData.category, formData.roomName, formData.bedSpaceName)} - {formData.fullName}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 text-xs space-y-3.5 text-start">
                    <h4 className="font-black text-amber-900 dark:text-amber-400 text-xs uppercase tracking-wider">{t.step6_remitly_guide_title || "How to Pay Your Fees via Remitly"}</h4>
                    <ol className="list-decimal ps-4 space-y-2 text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                      <li>{t.step6_remitly_step1 || "Download Remitly from the App Store or Google Play, or visit www.remitly.com. Log in or create an account."}</li>
                      <li>{t.step6_remitly_step2 || "Select the country you are sending money from."}</li>
                      <li>{t.step6_remitly_step3 || "Select Egypt as the country you are sending to."}</li>
                      <li>
                        {(t.step6_remitly_step4 || "Enter the amount you want to pay: e.g., ${amount} USD (One Month Security Deposit) (or equivalent).").replace('{amount}', String(pricing.monthlyRate))}
                        <p className="text-red-500 font-bold mt-0.5">⚠️ {t.step6_remitly_step4_warning || "This account will not accept dollars directly—make sure you send the equivalent in Egyptian Pounds (EGP)."}</p>
                      </li>
                      <li>{t.step6_remitly_step5 || "Choose the delivery method: Bank Deposit."}</li>
                      <li>
                        {t.step6_remitly_step6 || "Enter the recipient’s bank details exactly as written below:"}
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-lg border border-gray-150 dark:border-gray-800 font-medium ps-3 mt-1.5 grid grid-cols-2 gap-1 text-[11px]">
                          <span className="text-gray-400 text-start">{t.step6_remitly_account_name || "Account Name:"}</span>
                          <span className="font-bold text-end col-span-1">{landlordDetails?.recipientName || 'Jimoh Bolakale Ajao'}</span>
                          <span className="text-gray-400 text-start">{t.step6_bank_name || "Bank Name:"}</span>
                          <span className="font-bold text-end col-span-1">{landlordDetails?.remitlyBankName || 'CIB'}</span>
                          <span className="text-gray-400 text-start">{t.step6_remitly_bank_location || "Bank Location:"}</span>
                          <span className="font-bold text-end col-span-1">{landlordDetails?.remitlyLocation || 'Cairo'}</span>
                          <span className="text-gray-400 text-start">IBAN:</span>
                          <span className="font-mono font-bold text-end col-span-1 text-brand-600 dark:text-brand-400 select-all">{landlordDetails?.remitlyIban || 'EG320010010900000100063328094'}</span>
                        </div>
                      </li>
                      <li>{t.step6_remitly_step7 || "Choose your payment method (debit card, credit card, or bank transfer)."}</li>
                      <li>
                        {(t.step6_remitly_step8 || "Carefully review all details, ensure reference is marked as {memo}, and confirm.")
                          .replace('{memo}', `${getUnifiedRoomName(formData.category, formData.roomName, formData.bedSpaceName)} - ${formData.fullName}`)}
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              <div className="p-4 bg-brand-500/10 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl text-start">
                <p className="text-[11px] text-brand-800 dark:text-brand-300 leading-relaxed font-medium">
                  {t.step6_next_step_callout || "NEXT STEP: Once you complete the payment, take a screenshot or download the receipt. Log into your Student Dashboard to upload this screenshot to verify your payment and activate your keys/check-in access."}
                </p>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setPage('dashboard')}
                className="bg-brand-600 hover:bg-brand-700 text-white px-10 py-4 rounded-2xl font-bold font-black text-sm uppercase tracking-wider shadow-lg active:scale-95 transition-all"
              >
                {t.step6_btn_dashboard || "Go to My Dashboard"}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Calculate display step number and total steps for UI
  const displayStep = isExtension 
    ? (step === 1 ? 1 : step === 2 ? 2 : step === 4 ? 3 : step === 5 ? 4 : step)
    : step;
  const totalSteps = isExtension ? 4 : 5;

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Steps track header */}
      {step < 6 && (
        <div className="mb-8 text-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="inline-block px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 text-[10px] font-black uppercase tracking-widest mb-2 border border-brand-200 dark:border-brand-800">
            {isExtension ? "Rent Extension Application" : (t.wizard_badge || "residency application")}
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            {step === 1 && (t.step1_title || "1. Our Accommodations Selection")}
            {step === 2 && (isExtension ? "2. Features, Duration & Extension Date" : (t.step2_title || "2. Features & Pricing"))}
            {step === 3 && (t.step3_title || "3. Student Information")}
            {step === 4 && (isExtension ? "3. Review Booking Summary" : (t.step4_title || "4. Review Booking Summary"))}
            {step === 5 && (isExtension ? "4. Sign Tenancy Agreement" : (t.step5_title || "5. Sign Tenancy Agreement"))}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-4">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div 
                key={s} 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  s === displayStep ? 'w-8 bg-brand-600' : s < displayStep ? 'w-4 bg-brand-400' : 'w-4 bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Step {displayStep} of {totalSteps}</p>
        </div>
      )}

      {renderStepContent()}

      <JoinWaitlistModal
        isOpen={isWaitlistModalOpen}
        onClose={() => setIsWaitlistModalOpen(false)}
        initialCategory={waitlistCategory}
        initialType={waitlistType}
        initialSpaceLabel={waitlistSpaceLabel}
      />
    </div>
  );
};

// Internal components for clean code split
const InputField = ({ label, ...props }: any) => (
  <div className="space-y-2 text-start">
    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{label}</label>
    <input 
      {...props}
      className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:ring-2 focus:ring-brand-500 outline-none transition-all text-start"
    />
  </div>
);

const SummaryItem = ({ label, value }: any) => (
  <div className="text-start">
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
    <p className="text-gray-900 dark:text-white font-bold text-sm italic">{value || 'Not selected'}</p>
  </div>
);

export default MultiStepBookingForm;
