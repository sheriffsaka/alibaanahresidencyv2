import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { Room, AccommodationType, AccommodationCategory } from '../types';
import { useApp } from '../hooks/useApp';
import { uploadFile, generateFileName } from '../lib/storage';
import { ManageCategoryModal } from './admin/ManageCategoryModal';
import { 
  Building2, 
  DoorClosed, 
  Bed, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Plus, 
  Trash2, 
  Layers, 
  DollarSign, 
  MapPin, 
  AlertCircle, 
  Info, 
  Check, 
  Image as ImageIcon,
  Video,
  Eye,
  Shield,
  Clock
} from 'lucide-react';

interface RoomEditorModalProps {
  room: Room | null; // null for creating a new room
  onClose: () => void;
  onSave: (room: Room) => void;
}

const COMMON_AMENITIES = [
  'High-Speed Wi-Fi',
  'Air Conditioning',
  'Study Desk & Chair',
  'En-suite Bathroom',
  'Fully Furnished Kitchen',
  'Wardrobe & Storage',
  'Balcony / City View',
  'Daily Trash Collection',
  'Refrigerator in Room',
  'Heated Water Supply'
];

export const RoomEditorModal: React.FC<RoomEditorModalProps> = ({ room, onClose, onSave }) => {
  const { accommodationCategories, rooms, bedSpaces, bookings } = useApp();

  const isEditing = !!room;
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isManageCategoryModalOpen, setIsManageCategoryModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper to parse existing room details or setup defaults
  const getInitialValues = () => {
    if (!room) {
      const defaultCategory = accommodationCategories[0]?.name || 'Standard';
      const categoryObj = accommodationCategories.find(c => c.name === defaultCategory);
      return {
        category: defaultCategory,
        roomNumber: 'Room 1',
        roomType: 'Shared Room' as 'Shared Room' | 'Private Room',
        price_per_month: categoryObj?.defaultPrice || 175,
        gender_restriction: 'Any' as 'Male' | 'Female' | 'Any',
        status: 'Active' as 'Active' | 'Inactive',
        bedLabels: ['Bed A', 'Bed B'],
        amenities: ['High-Speed Wi-Fi', 'Air Conditioning', 'Study Desk & Chair', 'Fully Furnished Kitchen'],
        next_available_date: '',
        imageUrls: [] as string[],
        videoUrl: ''
      };
    }

    // Determine category
    let category = room.apartment_name || room.category || 'Standard';
    // Match against known categories
    const matchedCategory = accommodationCategories.find(
      c => c.name.toLowerCase() === category.toLowerCase() || category.includes(c.name)
    );
    if (matchedCategory) {
      category = matchedCategory.name;
    }

    // Determine room number
    let roomNumber = room.room_number || 'Room 1';
    if (!roomNumber.toLowerCase().startsWith('room')) {
      const digitMatch = roomNumber.match(/\d+/);
      if (digitMatch) {
        roomNumber = `Room ${digitMatch[0]}`;
      }
    }

    // Determine room type
    const isPrivate = room.type?.toLowerCase().includes('private') || (room.capacity === 1 && !room.type?.toLowerCase().includes('shared'));
    const roomType: 'Shared Room' | 'Private Room' = isPrivate ? 'Private Room' : 'Shared Room';

    // Existing bed spaces
    const existingBeds = bedSpaces.filter(b => b.room_id === room.id);
    let bedLabels: string[] = [];
    if (existingBeds.length > 0) {
      bedLabels = existingBeds.map(b => b.label);
    } else if (isPrivate) {
      bedLabels = ['Single'];
    } else {
      const cap = Math.max(1, room.capacity || 2);
      bedLabels = Array.from({ length: cap }, (_, i) => `Bed ${String.fromCharCode(65 + i)}`);
    }

    return {
      category,
      roomNumber,
      roomType,
      price_per_month: room.price_per_month || 175,
      gender_restriction: room.gender_restriction || 'Any',
      status: (room.status || 'Active') as 'Active' | 'Inactive',
      bedLabels,
      amenities: room.amenities && room.amenities.length > 0 ? room.amenities : ['High-Speed Wi-Fi', 'Air Conditioning', 'Study Desk & Chair'],
      next_available_date: room.next_available_date || '',
      imageUrls: room.image_urls || [],
      videoUrl: room.video_urls?.[0] || ''
    };
  };

  const initialValues = getInitialValues();

  // Wizard state variables
  const [selectedCategory, setSelectedCategory] = useState<string>(initialValues.category);
  const [roomNumber, setRoomNumber] = useState<string>(initialValues.roomNumber);
  const [roomType, setRoomType] = useState<'Shared Room' | 'Private Room'>(initialValues.roomType);
  const [bedLabels, setBedLabels] = useState<string[]>(initialValues.bedLabels);
  const [pricePerMonth, setPricePerMonth] = useState<number>(initialValues.price_per_month);
  const [genderRestriction, setGenderRestriction] = useState<'Any' | 'Male' | 'Female'>(initialValues.gender_restriction);
  const [roomStatus, setRoomStatus] = useState<'Active' | 'Inactive'>(initialValues.status);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialValues.amenities);
  const [customAmenityInput, setCustomAmenityInput] = useState<string>('');
  const [nextAvailableDate, setNextAvailableDate] = useState<string>(initialValues.next_available_date);
  const [imageUrls, setImageUrls] = useState<string[]>(initialValues.imageUrls);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>(initialValues.videoUrl);

  // When selectedCategory changes, auto-update default price if creating new room
  const handleCategorySelect = (catName: string) => {
    setSelectedCategory(catName);
    if (!isEditing) {
      const catObj = accommodationCategories.find(c => c.name === catName);
      if (catObj?.defaultPrice) {
        setPricePerMonth(catObj.defaultPrice);
      }
    }
  };

  // Sync capacity with bed labels
  const capacity = bedLabels.length;

  // Active bookings safeguard check when editing an existing room
  const conflictingActiveBookings = useMemo(() => {
    if (!isEditing || !room) return [];
    const currentBeds = bedSpaces.filter(b => b.room_id === room.id);
    const isPrivateNow = roomType === 'Private Room' || bedLabels.length === 1;
    
    let removedBeds: any[] = [];
    if (isPrivateNow && currentBeds.length > 1) {
      removedBeds = currentBeds.slice(1);
    } else if (!isPrivateNow && currentBeds.length > bedLabels.length) {
      removedBeds = currentBeds.slice(bedLabels.length);
    }
    
    const activeStatuses = ['CONFIRMED', 'PENDING_APPROVAL', 'APPROVED', 'OCCUPIED', 'ACTIVE', 'PENDING_PAYMENT', 'UNDER_REVIEW'];
    return bookings.filter(b => 
      b.room_id === room.id && 
      activeStatuses.includes((b.status || '').toUpperCase()) &&
      removedBeds.some(bed => bed.id === b.bed_space_id || (b as any).assigned_space?.includes(bed.label))
    );
  }, [isEditing, room, bedSpaces, roomType, bedLabels, bookings]);

  // Duplicate room check in same accommodation
  const isDuplicateRoomNumber = () => {
    const cleanNumber = roomNumber.trim().toLowerCase();
    return rooms.some(r => {
      if (isEditing && r.id === room.id) return false;
      const rCat = r.apartment_name || r.category || '';
      const isSameCategory = rCat.toLowerCase() === selectedCategory.toLowerCase();
      const isSameNumber = (r.room_number || '').trim().toLowerCase() === cleanNumber;
      return isSameCategory && isSameNumber;
    });
  };

  // Bed space management helpers
  const handleAddBedSpace = () => {
    const nextChar = String.fromCharCode(65 + bedLabels.length);
    const newLabel = `Bed ${nextChar}`;
    setBedLabels(prev => [...prev, newLabel]);
  };

  const handleRemoveBedSpace = (index: number) => {
    if (bedLabels.length <= 1) return;
    setBedLabels(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateBedLabel = (index: number, val: string) => {
    setBedLabels(prev => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const applyBedPreset = (preset: 'single' | '2beds' | '3beds' | '4beds') => {
    if (preset === 'single') {
      setBedLabels(['Single']);
      setRoomType('Private Room');
    } else if (preset === '2beds') {
      setBedLabels(['Bed A', 'Bed B']);
      setRoomType('Shared Room');
    } else if (preset === '3beds') {
      setBedLabels(['Bed A', 'Bed B', 'Bed C']);
      setRoomType('Shared Room');
    } else if (preset === '4beds') {
      setBedLabels(['Bed A', 'Bed B', 'Bed C', 'Bed D']);
      setRoomType('Shared Room');
    }
  };

  // Amenities helpers
  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleAddCustomAmenity = () => {
    if (!customAmenityInput.trim()) return;
    const clean = customAmenityInput.trim();
    if (!selectedAmenities.includes(clean)) {
      setSelectedAmenities(prev => [...prev, clean]);
    }
    setCustomAmenityInput('');
  };

  // Image helpers
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const remainingSlots = 4 - imageUrls.length - newFiles.length;
      if (remainingSlots <= 0) {
        alert("You can add up to 4 images per room.");
        return;
      }
      const filesToAdd = Array.from(e.target.files).slice(0, remainingSlots);
      setNewFiles(prev => [...prev, ...filesToAdd]);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Step Validation & Navigation
  const validateStep = (step: number): boolean => {
    setErrorMessage(null);

    if (step === 1) {
      if (!selectedCategory || selectedCategory.trim() === '') {
        setErrorMessage('Please select an accommodation category.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!roomNumber || roomNumber.trim() === '') {
        setErrorMessage('Please enter a valid room number (e.g. Room 1).');
        return false;
      }
      if (isDuplicateRoomNumber()) {
        setErrorMessage(`A room named "${roomNumber}" already exists in ${selectedCategory}. Please choose a unique room number.`);
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (bedLabels.length === 0) {
        setErrorMessage('Please configure at least one bed space for this room.');
        return false;
      }
      if (bedLabels.some(l => !l.trim())) {
        setErrorMessage('All bed spaces must have a non-empty name (e.g. Bed A, Bed B).');
        return false;
      }
      if (conflictingActiveBookings.length > 0) {
        const studentName = conflictingActiveBookings[0].full_name || conflictingActiveBookings[0].student_name || 'an assigned student';
        setErrorMessage(`Cannot remove bed space or convert to Private: Active booking exists for ${studentName} (Status: ${conflictingActiveBookings[0].status}). Please reassign or conclude their booking before reducing capacity.`);
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (!pricePerMonth || pricePerMonth <= 0) {
        setErrorMessage('Please provide a valid monthly price greater than $0.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(5, prev + 1));
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Step 6: Final Submission
  const handleFinalSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      let finalImageUrls = [...imageUrls];

      if (newFiles.length > 0) {
        for (const file of newFiles) {
          const fileName = generateFileName(file.name);
          const url = await uploadFile('rooms', fileName, file);
          finalImageUrls.push(url);
        }
      }

      // Map back to database columns
      const dbCategory = selectedCategory.toLowerCase().includes('premium') ? 'Premium' : 'Standard';
      const isPrivate = roomType === 'Private Room' || capacity === 1;

      let dbType = AccommodationType.STANDARD_SHARED;
      if (selectedCategory.toLowerCase().includes('premium')) {
        dbType = isPrivate ? AccommodationType.PREMIUM_PRIVATE : AccommodationType.PREMIUM_SHARED;
      } else {
        dbType = isPrivate ? AccommodationType.STANDARD_PRIVATE : AccommodationType.STANDARD_SHARED;
      }

      // Normalize room number
      let dbRoomNumber = roomNumber.trim();
      if (!dbRoomNumber.toLowerCase().startsWith('room')) {
        const digitMatch = dbRoomNumber.match(/\d+/);
        if (digitMatch) {
          dbRoomNumber = `Room ${digitMatch[0]}`;
        }
      }

      const finalRoomData: Room = {
        ...(room || { id: 0, created_at: '', property_id: '', is_available: true, occupied_slots: 0 }),
        apartment_name: selectedCategory,
        category: dbCategory as any,
        room_number: dbRoomNumber,
        type: dbType,
        price_per_month: Number(pricePerMonth),
        capacity: capacity,
        gender_restriction: genderRestriction,
        status: roomStatus,
        next_available_date: nextAvailableDate || undefined,
        amenities: selectedAmenities,
        image_urls: finalImageUrls,
        video_urls: videoUrl ? [videoUrl] : [],
        // Custom property passed for bed_spaces insertion
        bedLabels: bedLabels
      } as any;

      await onSave(finalRoomData);
    } catch (err: any) {
      console.error("Error saving room in wizard:", err);
      setErrorMessage(err.message || 'Failed to save room details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const stepsMeta = [
    { number: 1, title: 'Accommodation', description: 'Category selection', icon: Building2 },
    { number: 2, title: 'Room Number', description: 'Identifier & name', icon: DoorClosed },
    { number: 3, title: 'Bed Spaces', description: 'Beds configuration', icon: Bed },
    { number: 4, title: 'Room Details', description: 'Price, type & perks', icon: Sparkles },
    { number: 5, title: 'Review', description: 'Summary & save', icon: CheckCircle2 }
  ];

  const selectedCategoryObj = accommodationCategories.find(c => c.name === selectedCategory);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 animate-fade-in backdrop-blur-xs">
        <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] border border-gray-100 dark:border-gray-800 overflow-hidden">
          
          {/* Header & Step Progress Bar */}
          <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 p-5 sm:p-6 pb-4">
            <div className="flex justify-between items-center mb-5">
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded-lg border border-brand-200/60 dark:border-brand-800">
                  {isEditing ? 'Room Editor' : 'Room Creation Wizard'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1.5 flex items-center gap-2">
                  {isEditing ? `Edit ${room?.room_number || 'Room'}` : 'Add New Room'}
                </h2>
              </div>
              <button 
                type="button" 
                onClick={onClose} 
                className="p-2 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Indicator */}
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {stepsMeta.map((step) => {
                const IconComponent = step.icon;
                const isCompleted = currentStep > step.number;
                const isCurrent = currentStep === step.number;

                return (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => {
                      if (step.number < currentStep) {
                        setCurrentStep(step.number);
                      }
                    }}
                    disabled={step.number > currentStep}
                    className={`text-left p-2 sm:p-2.5 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/40 shadow-xs'
                        : isCompleted
                        ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 cursor-pointer'
                        : 'border-gray-150 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-850/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isCurrent
                          ? 'bg-brand-600 text-white'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : step.number}
                      </div>
                      <span className={`text-[11px] sm:text-xs font-bold truncate hidden sm:inline ${
                        isCurrent ? 'text-brand-700 dark:text-brand-300' : isCompleted ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span className="font-medium flex-1">{errorMessage}</span>
            </div>
          )}

          {/* Form Wizard Body */}
          <div className="flex-grow overflow-y-auto p-6 space-y-6">

            {/* STEP 1: ACCOMMODATION CATEGORY */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b dark:border-gray-800">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-brand-600" /> Step 1: Select Accommodation Category
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Choose an accommodation category synced from Supabase, or manage categories directly.
                    </p>
                  </div>
                  
                  {/* Manage Categories Trigger inside Add Room section */}
                  <button
                    id="wizard-manage-categories-btn"
                    type="button"
                    onClick={() => setIsManageCategoryModalOpen(true)}
                    className="bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-brand-200/80 dark:border-brand-800 transition-all shrink-0 shadow-xs"
                  >
                    <Layers className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    Manage Categories
                  </button>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {accommodationCategories.map((cat) => {
                    const isSelected = selectedCategory === cat.name;
                    const catRooms = rooms.filter(r => (r.apartment_name || r.category || '').toLowerCase() === cat.name.toLowerCase());

                    return (
                      <div
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.name)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative ${
                          isSelected
                            ? 'border-brand-600 bg-brand-50/40 dark:bg-brand-950/30 shadow-md ring-2 ring-brand-500/20'
                            : 'border-gray-200 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-700 bg-white dark:bg-gray-850'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              cat.name.includes('Premium')
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                            }`}>
                              {cat.name}
                            </span>
                            <h4 className="text-base font-bold text-gray-900 dark:text-white mt-1.5">{cat.name}</h4>
                          </div>

                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected 
                              ? 'border-brand-600 bg-brand-600 text-white' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        {cat.address && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{cat.address}</span>
                          </p>
                        )}

                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs">
                          <span className="text-gray-500 font-medium">Default: <strong className="text-gray-900 dark:text-white">${cat.defaultPrice}/mo</strong></span>
                          <span className="text-gray-400 text-[11px]">{catRooms.length} rooms listed</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {accommodationCategories.length === 0 && (
                  <div className="text-center p-8 border border-dashed rounded-2xl dark:border-gray-800 bg-gray-50 dark:bg-gray-850">
                    <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No categories found in Supabase</p>
                    <p className="text-xs text-gray-500 mt-1">Click "Manage Categories" above to create your first accommodation category.</p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: ROOM NUMBER & IDENTIFIER */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div className="pb-3 border-b dark:border-gray-800">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <DoorClosed className="w-4 h-4 text-brand-600" /> Step 2: Room Number & Identifier
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Assign a room number for this room within <strong className="text-gray-800 dark:text-gray-200">{selectedCategory}</strong>.
                  </p>
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Quick Select
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {['Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5', 'Room 6'].map((num) => {
                      const isSelected = roomNumber === num;
                      const isTaken = rooms.some(r => {
                        if (isEditing && r.id === room.id) return false;
                        return (r.apartment_name || r.category || '').toLowerCase() === selectedCategory.toLowerCase() &&
                          (r.room_number || '').toLowerCase() === num.toLowerCase();
                      });

                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setRoomNumber(num)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                            isSelected
                              ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                              : isTaken
                              ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-brand-400'
                          }`}
                        >
                          {num}
                          {isTaken && <span className="block text-[9px] font-normal opacity-80">(Taken)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Room Input */}
                <div className="bg-gray-50 dark:bg-gray-850 p-4 rounded-2xl border border-gray-150 dark:border-gray-800 space-y-3">
                  <label htmlFor="custom-room-number" className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Room Number / Title
                  </label>
                  <div className="relative">
                    <input
                      id="custom-room-number"
                      type="text"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="e.g. Room 1, Room 101, Apartment 2B"
                      className="w-full text-base font-bold p-3.5 pl-10 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                    <DoorClosed className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                  </div>

                  {isDuplicateRoomNumber() && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-1.5 mt-1">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Warning: A room with identifier "{roomNumber}" already exists in {selectedCategory}.
                    </p>
                  )}

                  <p className="text-[11px] text-gray-500 italic">
                    This identifier is shown to students on contracts, payment receipts, and occupancy maps.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 3: BED SPACES CONFIGURATION */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-fade-in">
                <div className="pb-3 border-b dark:border-gray-800 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Bed className="w-4 h-4 text-brand-600" /> Step 3: Bed Spaces Configuration
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Configure bed spaces. Students will be assigned to these individual slots.
                    </p>
                  </div>
                  <span className="text-xs font-black bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 px-3 py-1.5 rounded-xl border border-brand-200 dark:border-brand-800">
                    Total: {bedLabels.length} {bedLabels.length === 1 ? 'Bed' : 'Beds'}
                  </span>
                </div>

                {conflictingActiveBookings.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <strong className="block font-bold">Active Student Booking Protection</strong>
                      <span>
                        Student <strong>{conflictingActiveBookings[0].full_name || 'Assigned Student'}</strong> has an active booking on a bed space that would be removed by this change. To protect students and prevent data corruption, please reassign or conclude their booking before reducing capacity or converting to Single/Private.
                      </span>
                    </div>
                  </div>
                )}

                {/* Quick Presets */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Configuration Presets
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => applyBedPreset('single')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        bedLabels.length === 1 && (bedLabels[0] === 'Single' || roomType === 'Private Room')
                          ? 'border-brand-600 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                      }`}
                    >
                      Single (Private)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyBedPreset('2beds')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        bedLabels.length === 2 && bedLabels[0] === 'Bed A' && bedLabels[1] === 'Bed B'
                          ? 'border-brand-600 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                      }`}
                    >
                      2 Beds (Bed A, B)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyBedPreset('3beds')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        bedLabels.length === 3
                          ? 'border-brand-600 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                      }`}
                    >
                      3 Beds (Bed A-C)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyBedPreset('4beds')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        bedLabels.length === 4
                          ? 'border-brand-600 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                      }`}
                    >
                      4 Beds (Bed A-D)
                    </button>
                  </div>
                </div>

                {/* Bed Spaces List */}
                <div className="space-y-2.5 bg-gray-50/70 dark:bg-gray-850/60 p-4 rounded-2xl border border-gray-150 dark:border-gray-800">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Configured Bed Labels
                    </label>
                    <button
                      type="button"
                      onClick={handleAddBedSpace}
                      disabled={bedLabels.length >= 8}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Bed Space
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {bedLabels.map((label, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
                        <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <input
                          type="text"
                          value={label}
                          onChange={(e) => handleUpdateBedLabel(idx, e.target.value)}
                          placeholder={`Bed ${String.fromCharCode(65 + idx)}`}
                          className="flex-1 text-xs font-bold px-3 py-2 border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white"
                        />
                        {bedLabels.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBedSpace(idx)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="Remove bed space"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-gray-400 italic mt-2">
                    Room capacity is automatically set to {bedLabels.length} {bedLabels.length === 1 ? 'resident' : 'residents'} based on your configured bed spaces.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: ROOM DETAILS & PERKS */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-fade-in">
                <div className="pb-3 border-b dark:border-gray-800">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-600" /> Step 4: Room Details & Amenities
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Set the monthly rate, occupancy type, gender policy, and included amenities.
                  </p>
                </div>

                {/* Primary Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                  {/* Room Type */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Room Type
                    </label>
                    <select
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value as any)}
                      className="w-full text-xs font-bold p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    >
                      <option value="Shared Room">Shared Room</option>
                      <option value="Private Room">Private Room</option>
                    </select>
                  </div>

                  {/* Monthly Rate */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Monthly Rate ($)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        value={pricePerMonth}
                        onChange={(e) => setPricePerMonth(parseFloat(e.target.value) || 0)}
                        required
                        className="w-full text-xs font-bold p-3 pl-8 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                      <DollarSign className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
                    </div>
                  </div>

                  {/* Gender Restriction */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Gender Policy
                    </label>
                    <select
                      value={genderRestriction}
                      onChange={(e) => setGenderRestriction(e.target.value as any)}
                      className="w-full text-xs font-bold p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    >
                      <option value="Any">Any Gender</option>
                      <option value="Male">Male Only</option>
                      <option value="Female">Female Only</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Status
                    </label>
                    <select
                      value={roomStatus}
                      onChange={(e) => setRoomStatus(e.target.value as any)}
                      className={`w-full text-xs font-black p-3 border rounded-xl ${
                        roomStatus === 'Active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                      }`}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Amenities Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Facilities & Included Amenities
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_AMENITIES.map((amenity) => {
                      const isSelected = selectedAmenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => toggleAmenity(amenity)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'border-brand-600 bg-brand-600 text-white shadow-xs'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                          }`}
                        >
                          {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3 text-gray-400" />}
                          {amenity}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Amenity */}
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      value={customAmenityInput}
                      onChange={(e) => setCustomAmenityInput(e.target.value)}
                      placeholder="Add custom perk (e.g. Smart TV, Kettle, Balcony)..."
                      className="flex-1 text-xs px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomAmenity();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomAmenity}
                      className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 text-xs px-4 py-2 rounded-xl font-bold border dark:border-gray-700"
                    >
                      Add Perk
                    </button>
                  </div>
                </div>

                {/* Optional Media (Images & Video) Accordion / Simple Controls */}
                <div className="bg-gray-50/50 dark:bg-gray-850/40 p-4 rounded-2xl border border-gray-150 dark:border-gray-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-brand-600" /> Room Images & Video Tour (Optional)
                    </label>
                    <span className="text-[10px] text-gray-400">Max 4 images</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {imageUrls.map((url, idx) => (
                      <div key={`existing-${idx}`} className="relative aspect-video border-2 border-brand-500 rounded-xl overflow-hidden group shadow-xs">
                        <img src={url} alt={`Room ${idx}`} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {newFiles.map((file, idx) => (
                      <div key={`new-${idx}`} className="relative aspect-video border-2 border-dashed border-brand-400 rounded-xl overflow-hidden group bg-brand-50/50 dark:bg-brand-950/30 flex items-center justify-center p-2">
                        <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300 truncate text-center">
                          {file.name}
                        </span>
                        <button 
                          type="button"
                          onClick={() => removeNewFile(idx)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {(imageUrls.length + newFiles.length) < 4 && (
                      <label className="aspect-video border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 transition-all bg-white dark:bg-gray-800">
                        <Plus className="w-5 h-5 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">Add Photo</span>
                        <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" multiple />
                      </label>
                    )}
                  </div>

                  <div>
                    <input 
                      type="text" 
                      value={videoUrl} 
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="YouTube or Vimeo tour video URL (optional)..."
                      className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: REVIEW & CONFIRM */}
            {currentStep === 5 && (
              <div className="space-y-5 animate-fade-in">
                <div className="pb-3 border-b dark:border-gray-800">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Step 5: Review Room Configuration
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Please double-check the details below before creating the room in Supabase.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="bg-gray-50 dark:bg-gray-850 rounded-2xl p-5 border border-gray-200 dark:border-gray-750 space-y-4">
                  
                  {/* Top Key Dimensions */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b dark:border-gray-700">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Accommodation</span>
                      <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">{selectedCategory}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Room Number</span>
                      <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">{roomNumber}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Room Type</span>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{roomType}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Monthly Rate</span>
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">${pricePerMonth} / mo</p>
                    </div>
                  </div>

                  {/* Bed Spaces Breakdown */}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                      Bed Spaces ({bedLabels.length} {bedLabels.length === 1 ? 'Space' : 'Spaces'} to be created)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {bedLabels.map((lbl, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-xl border dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200">
                          <Bed className="w-3.5 h-3.5 text-brand-600" />
                          <span>{lbl}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Amenities & Policy */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t dark:border-gray-700">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1.5">
                        Facilities Included ({selectedAmenities.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedAmenities.map((a, i) => (
                          <span key={i} className="text-[11px] bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-lg border dark:border-gray-700 font-medium">
                            ✓ {a}
                          </span>
                        ))}
                        {selectedAmenities.length === 0 && (
                          <span className="text-xs text-gray-400 italic">No amenities specified</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Gender Policy</span>
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5">{genderRestriction} Students</p>
                      </div>

                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Status</span>
                        <span className={`inline-block text-[11px] font-black px-2.5 py-0.5 rounded-full mt-0.5 ${
                          roomStatus === 'Active'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}>
                          ● {roomStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer Controls */}
          <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 p-4 sm:p-5 flex justify-between items-center">
            {/* Left: Cancel */}
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 text-xs font-bold text-gray-700 dark:text-gray-300 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>

            {/* Right: Back & Next / Save */}
            <div className="flex items-center gap-2.5">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Room to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isEditing ? 'Save Changes' : 'Create Room'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Embedded Manage Category Modal inside Step 1 */}
      {isManageCategoryModalOpen && (
        <ManageCategoryModal
          isOpen={isManageCategoryModalOpen}
          onClose={() => setIsManageCategoryModalOpen(false)}
        />
      )}
    </>
  );
};

export default RoomEditorModal;
