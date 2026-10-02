import React, { useState, useMemo, useEffect, ChangeEvent } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useApp } from '../hooks/useApp';
import { Booking, BookingStatus, Room, AccommodationType, User, Language, DEFAULT_CATEGORY_MEDIA, CategoryMediaItem, CategoryMediaConfig } from '../types';
import { IconEdit, IconClose, IconBuilding, IconCheckCircle, IconPlus, IconTrash, IconUpload, IconFile, IconCalendar, IconEye } from '../components/Icon';
import BookingStatusBadge from '../components/BookingStatusBadge';
import RoomEditorModal from '../components/RoomEditorModal';
import AdminCreateBookingModal from '../components/AdminCreateBookingModal';
import StudentDetailsModal from '../components/StudentDetailsModal';
import { uploadFile, generateFileName } from '../lib/storage';
import { sendEmail, getApprovalEmailTemplate } from '../lib/email';
import AgreementModal from '../components/AgreementModal';
import UserEditorModal from '../components/UserEditorModal';
import EditBookingModal from '../components/EditBookingModal';
import { ExtendStayModal } from '../components/ExtendStayModal';
import { formatStoredRoomString, getDisplayFromRoom, getParsedRoomSpaces, getAccommodationAddress, getLiveStudentRoomDetails, normalizeCategory } from '../lib/roomNaming';
import { isBookingActiveOnDate, isBookingUpcomingReservation, getEffectiveBookingStatus, formatBookingDuration, getBookingPaymentStatus } from '../lib/temporalBooking';

// Restructured Admin Components
import AdminSidebar, { AdminNavSection } from '../components/admin/AdminSidebar';
import AdminActivityDrawer from '../components/admin/AdminActivityDrawer';
import WaitlistView from '../components/admin/WaitlistView';
import MaintenanceView from '../components/admin/MaintenanceView';
import PaymentsCreditsView from '../components/admin/PaymentsCreditsView';
import MessagesInboxView from '../components/admin/MessagesInboxView';
import ReviewsRatingsView from '../components/admin/ReviewsRatingsView';
import AdminSettingsView from '../components/admin/AdminSettingsView';
import { EmailLogsView } from '../components/admin/EmailLogsView';
import { ManageCategoryModal } from '../components/admin/ManageCategoryModal';
import { ContractTranslationsReviewView } from '../components/admin/ContractTranslationsReviewView';
import { ManageStudentDocumentsView } from '../components/admin/ManageStudentDocumentsView';
import { RoomPricingView } from '../components/admin/RoomPricingView';
import { RoomMediaModal } from '../components/admin/RoomMediaModal';
import { ApartmentMediaManager } from '../components/admin/ApartmentMediaManager';
import { getRoomPrice } from '../lib/pricing';
import { Layers, Video, Image as ImageIconLucide, LayoutGrid, List } from 'lucide-react';
import { isSectionAllowed, resolveSafeSection, getAllowedAdminSections } from '../lib/adminPermissions';

// A responsive, accessible SVG Bar Chart component for occupancy metrics
const OccupancyChart = ({ data }: { data: { name: string; value: number }[] }) => {
    const maxVal = Math.max(...data.map(d => d.value), 0);
    const maxScale = Math.max(Math.ceil(maxVal * 1.25), 4);

    const svgWidth = 640;
    const svgHeight = 310;
    
    const margin = { top: 30, right: 30, bottom: 60, left: 50 };
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;

    const numGridLines = 4;
    const gridTicks = Array.from({ length: numGridLines + 1 }, (_, i) => Math.round((maxScale / numGridLines) * i));

    const totalBars = data.length || 1;
    const step = chartWidth / totalBars;
    const barWidth = Math.min(step * 0.45, 64);

    return (
        <div className="w-full overflow-x-auto">
            <svg 
                viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                className="w-full h-auto max-h-[320px] font-sans text-xs select-none"
                aria-label="Occupancy by Accommodation Category Bar Chart"
            >
                {/* Y-Axis Grid Lines and Numeric Labels */}
                {gridTicks.map((tickVal) => {
                    const yPos = margin.top + chartHeight - (tickVal / maxScale) * chartHeight;
                    return (
                        <g key={tickVal} className="text-gray-400 dark:text-gray-500">
                            <line 
                                x1={margin.left} 
                                y1={yPos} 
                                x2={margin.left + chartWidth} 
                                y2={yPos} 
                                stroke="currentColor" 
                                strokeDasharray="3 3" 
                                strokeOpacity="0.3" 
                            />
                            <text 
                                x={margin.left - 10} 
                                y={yPos + 4} 
                                textAnchor="end" 
                                className="fill-gray-500 dark:fill-gray-400 font-medium text-[10px]"
                            >
                                {tickVal}
                            </text>
                        </g>
                    );
                })}

                {/* X-Axis Baseline */}
                <line 
                    x1={margin.left} 
                    y1={margin.top + chartHeight} 
                    x2={margin.left + chartWidth} 
                    y2={margin.top + chartHeight} 
                    stroke="currentColor" 
                    className="text-gray-300 dark:text-gray-600" 
                    strokeWidth="1.5" 
                />

                {/* SVG Rendered Bars and Category Labels */}
                {data.map((item, index) => {
                    const barHeight = (item.value / maxScale) * chartHeight;
                    const xPos = margin.left + (index * step) + (step / 2) - (barWidth / 2);
                    const yPos = margin.top + chartHeight - barHeight;

                    return (
                        <g key={item.name} className="group cursor-pointer">
                            {/* SVG Bar with Gradient Styling */}
                            <rect
                                x={xPos}
                                y={yPos}
                                width={barWidth}
                                height={barHeight}
                                rx="6"
                                className="fill-brand-600 hover:fill-brand-500 transition-all duration-300 shadow-md"
                            />
                            
                            {/* Value Label above Bar */}
                            {item.value > 0 && (
                                <text
                                    x={xPos + barWidth / 2}
                                    y={yPos - 8}
                                    textAnchor="middle"
                                    className="fill-gray-900 dark:fill-white font-extrabold text-[11px]"
                                >
                                    {item.value}
                                </text>
                            )}

                            {/* X-Axis Category Name */}
                            <text
                                x={xPos + barWidth / 2}
                                y={margin.top + chartHeight + 20}
                                textAnchor="middle"
                                className="fill-gray-600 dark:fill-gray-300 font-bold text-[11px]"
                            >
                                {item.name}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

interface CategoryMediaEditorProps {
  category: string;
  cmsContent: any;
  updateCmsContent: (content: any) => Promise<{ success: boolean; error?: string }>;
}

const CategoryMediaEditor: React.FC<CategoryMediaEditorProps> = ({ category, cmsContent, updateCmsContent }) => {
  const currentMedia = cmsContent?.categoryMedia?.[category] || DEFAULT_CATEGORY_MEDIA[category] || { videoUrl: '', images: [], features: [] };
  
  const [videoUrl, setVideoUrl] = useState(currentMedia.videoUrl || '');
  const [image1, setImage1] = useState(currentMedia.images?.[0] || '');
  const [image2, setImage2] = useState(currentMedia.images?.[1] || '');
  const [features, setFeatures] = useState<string[]>(currentMedia.features || []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  React.useEffect(() => {
    setVideoUrl(currentMedia.videoUrl || '');
    setImage1(currentMedia.images?.[0] || '');
    setImage2(currentMedia.images?.[1] || '');
    setFeatures(currentMedia.features || []);
    setSaveSuccess(false);
  }, [category, cmsContent]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const existingMedia = cmsContent?.categoryMedia || { ...DEFAULT_CATEGORY_MEDIA };
      const updatedItem = {
        videoUrl: videoUrl.trim(),
        images: [image1.trim(), image2.trim()].filter(Boolean),
        features: features
      };
      const updatedConfig = {
        ...existingMedia,
        [category]: updatedItem
      };
      const res = await updateCmsContent({ categoryMedia: updatedConfig });
      if (res?.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("Failed to save category configuration: " + (res?.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim() !== '') {
      if (features.includes(newFeature.trim())) {
        alert("This perk already exists.");
        return;
      }
      setFeatures(prev => [...prev, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures(prev => prev.filter((_, fIdx) => fIdx !== idx));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Media Links */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-mono">YouTube or Vimeo Video Link</label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full text-sm p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
            />
            <p className="text-[10px] text-gray-400 mt-1 italic font-mono">Note: Paste regular YouTube/Vimeo links here; they are converted to responsive embeds automatically.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-mono">Accent Photo 1 URL</label>
            <input
              type="text"
              value={image1}
              onChange={(e) => setImage1(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-mono">Accent Photo 2 URL</label>
            <input
              type="text"
              value={image2}
              onChange={(e) => setImage2(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono"
            />
          </div>
        </div>

        {/* Right Column: Dynamic Bullet Features List */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-mono">Comfort & Tech Perks (Interactive List)</label>
            <div className="space-y-2 max-h-[180px] overflow-y-auto border border-gray-150 dark:border-gray-700 rounded-xl p-3 bg-gray-50/50 dark:bg-gray-950/20">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 bg-white dark:bg-gray-800 border dark:border-gray-700 px-3 py-2 rounded-lg text-xs font-medium">
                  <span className="truncate text-gray-700 dark:text-gray-300">✓ {feat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-red-500 hover:text-red-700 font-bold px-1.5"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {features.length === 0 && (
                <span className="text-[10px] text-gray-400 block py-1">No custom features added yet.</span>
              )}
            </div>
            
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="e.g. In-room refrigerator option"
                className="flex-1 text-xs px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="bg-brand-600 hover:bg-brand-700 text-white text-xs px-4 py-2 rounded-xl font-bold"
              >
                Add Perk
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end items-center gap-3">
        {saveSuccess && (
          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-pulse">
            ✓ Category configuration saved successfully & published!
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          {isSaving ? 'Saving Changes...' : `Save ${category} Configuration`}
        </button>
      </div>
    </div>
  );
};

interface SummaryCardProps {
    label: string;
    value: string | number;
    icon: string;
    trend?: string;
    colorClass: string;
    onClick?: () => void;
    actionLabel?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, icon, trend, colorClass, onClick, actionLabel }) => (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4 hover:shadow-xl transition-all ${onClick ? 'cursor-pointer hover:border-brand-300 dark:hover:border-brand-600' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${colorClass}`}>
            <span className="text-2xl">{icon}</span>
        </div>
        <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{value}</h3>
            {trend && <p className="text-[10px] font-bold text-green-600 mt-1">↑ {trend}</p>}
            {actionLabel && <p className="text-[11px] font-bold text-brand-600 dark:text-brand-400 mt-0.5">{actionLabel} →</p>}
        </div>
      </div>
    </div>
);


const AdminDashboardPage: React.FC = () => {
  const t = useTranslation();
  const { user, bookings, updateBookingStatus, deleteBooking, cmsContent, updateCmsContent, rooms, bedSpaces, addRoom, updateRoom, toggleRoomStatus, deleteRoom, activities, addActivity, language, setPage, users, addUser, updateUser, deleteUser, students, waitlist, refreshWaitlist, accommodationCategories, accommodationAddresses, unreadMessagesCount, parsedRoomSpaces: contextParsedRoomSpaces, roomPricing } = useApp();
  const [activeSection, setActiveSection] = useState<AdminNavSection>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sec = (params.get('section') || params.get('tab')) as AdminNavSection | null;
      return resolveSafeSection(user, sec);
    } catch {
      return resolveSafeSection(user, 'dashboard');
    }
  });

  const handleSelectSection = (sec: AdminNavSection) => {
    const safeSec = resolveSafeSection(user, sec);
    setActiveSection(safeSec);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('section', safeSec);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      console.warn("Notice in handleSelectSection:", e);
    }
  };
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [adminToast, setAdminToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (adminToast) {
      const timer = setTimeout(() => setAdminToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [adminToast]);
  const [cmsSubTab, setCmsSubTab] = useState<'rooms' | 'branding' | 'media' | 'contracts' | 'faqs'>('rooms');
  const [togglingRoomId, setTogglingRoomId] = useState<number | null>(null);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedBookingForExtend, setSelectedBookingForExtend] = useState<Booking | null>(null);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [roomFilter, setRoomFilter] = useState<'all' | 'occupied' | 'reserved' | 'available'>('all');
  const [bookingSubView, setBookingSubView] = useState<'all' | 'occupants' | 'reservations' | 'pending'>('all');
  const [roomCategoryFilter, setRoomCategoryFilter] = useState<string>('all');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>('all');
  const [inventoryViewMode, setInventoryViewMode] = useState<'grid' | 'table'>('grid');
  
  const [studentSort, setStudentSort] = useState<{ field: keyof Booking; direction: 'asc' | 'desc' }>({ field: 'full_name', direction: 'asc' });
  const [selectedBookingIds, setSelectedBookingIds] = useState<number[]>([]);
  
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [selectedRoomForEdit, setSelectedRoomForEdit] = useState<Room | null>(null);

  const [isRoomMediaModalOpen, setIsRoomMediaModalOpen] = useState(false);
  const [selectedRoomForMedia, setSelectedRoomForMedia] = useState<Room | null>(null);

  const handleOpenRoomMediaModal = (room: Room) => {
    setSelectedRoomForMedia(room);
    setIsRoomMediaModalOpen(true);
  };
  
  const [isAdminBookingModalOpen, setIsAdminBookingModalOpen] = useState(false);
  const [isManageCategoryModalOpen, setIsManageCategoryModalOpen] = useState(false);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<User | null>(null);
  const [isStudentDetailsModalOpen, setIsStudentDetailsModalOpen] = useState(false);

  const [viewingAgreement, setViewingAgreement] = useState<Booking | null>(null);

  const [editingContract, setEditingContract] = useState<{ roomType: AccommodationType; lang: Language } | null>(null);
  const [isUploadingCms, setIsUploadingCms] = useState(false);
  const [activeCategoryConfig, setActiveCategoryConfig] = useState<string>('Premium 1');

  // Transactions tab search & filter
  const [trxSearchQuery, setTrxSearchQuery] = useState('');
  const [trxStatusFilter, setTrxStatusFilter] = useState<'all' | 'pending_verification' | 'pending_payment' | 'confirmed' | 'cancelled'>('all');

  // Computed unread notices count for Admin Bell
  const unreadAdminNotificationCount = useMemo(() => {
    const pendingVerifs = (bookings || []).filter(b => b.status === BookingStatus.PENDING_VERIFICATION).length;
    const waitingWaitlist = (waitlist || []).filter(w => w.status === 'Waiting').length;
    const pendingContracts = (bookings || []).filter(b => b.status === BookingStatus.PENDING_CONTRACT).length;
    return pendingVerifs + waitingWaitlist + pendingContracts;
  }, [bookings, waitlist]);
  
  // Waitlist cross-navigation category filter
  const [waitlistCategoryFilter, setWaitlistCategoryFilter] = useState<string>('All');

  const waitingWaitlistCount = useMemo(() => {
    return (waitlist || []).filter(w => w.status === 'Waiting').length;
  }, [waitlist]);

  // Support deep linking to section and booking from admin notification emails with permission check
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sectionParam = params.get('section') || params.get('tab');
      if (sectionParam) {
        const safeSec = resolveSafeSection(user, sectionParam);
        if (safeSec !== sectionParam) {
          // If staff entered an unauthorized section in the URL, redirect URL to permitted section
          const url = new URL(window.location.href);
          url.searchParams.set('section', safeSec);
          window.history.replaceState({}, '', url.toString());
        }
        setActiveSection(safeSec);
      } else {
        // If no section query param was supplied, verify that current activeSection is permitted
        if (!isSectionAllowed(user, activeSection)) {
          const safeSec = resolveSafeSection(user, activeSection);
          setActiveSection(safeSec);
          const url = new URL(window.location.href);
          url.searchParams.set('section', safeSec);
          window.history.replaceState({}, '', url.toString());
        }
      }
      const bookingIdParam = params.get('bookingId');
      if (bookingIdParam && bookings && bookings.length > 0) {
        const targetB = bookings.find(b => b.id === Number(bookingIdParam));
        if (targetB) {
          setSelectedBooking(targetB);
        }
      }
    } catch (err) {
      console.warn("Notice in admin deep link handling:", err);
    }
  }, [user, bookings]);


  const totalActiveWaitlist = useMemo(() => {
    return (waitlist || []).filter(w => w.status === 'Waiting' || w.status === 'Offered').length;
  }, [waitlist]);

  // Sorted inventory rooms (ordered by accommodationCategories sequence, then room number)
  const sortedInventoryRooms = useMemo(() => {
    const getRank = (r: Room) => {
      const cat = normalizeCategory(r.apartment_name, r.category, r.room_number, accommodationCategories);
      if (accommodationCategories && accommodationCategories.length > 0) {
        const idx = accommodationCategories.findIndex(c => c.name.toLowerCase() === cat.toLowerCase());
        if (idx !== -1) return idx + 1;
      }
      const catLower = cat.toLowerCase();
      if (catLower.includes('premium 1')) return 1;
      if (catLower.includes('premium 2')) return 2;
      if (catLower.includes('premium 3') || catLower.includes('standard')) return 3;
      if (catLower.includes('premium 4')) return 4;
      return 5;
    };

    return [...rooms].sort((a, b) => {
      const rankA = getRank(a);
      const rankB = getRank(b);
      if (rankA !== rankB) return rankA - rankB;

      const numA = a.room_number || '';
      const numB = b.room_number || '';
      return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [rooms, accommodationCategories]);

  const filteredInventoryRooms = useMemo(() => {
    if (inventoryCategoryFilter === 'all') return sortedInventoryRooms;
    return sortedInventoryRooms.filter(room => {
      const cat = normalizeCategory(room.apartment_name, room.category, room.room_number, accommodationCategories);
      return cat.toLowerCase() === inventoryCategoryFilter.toLowerCase();
    });
  }, [sortedInventoryRooms, inventoryCategoryFilter, accommodationCategories]);

  const handleCmsFileUpload = async (e: ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'heroImageUrl') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingCms(true);
      try {
        const fileName = generateFileName(file.name);
        const publicUrl = await uploadFile('cms', fileName, file);
        updateCmsContent({ [field]: publicUrl });
        alert(`${field === 'logoUrl' ? 'Logo' : 'Hero Image'} updated successfully!`);
      } catch (err) {
        alert("Failed to upload image. Please try again.");
      } finally {
        setIsUploadingCms(false);
      }
    }
  };

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const valA = a[studentSort.field] || '';
      const valB = b[studentSort.field] || '';
      if (valA < valB) return studentSort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return studentSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [bookings, studentSort]);

  // Unique Registered Students list for the Students tab
  const uniqueStudentRecords = useMemo(() => {
    const studentMap = new Map<string, { student: User; activeBooking: Booking | null; allBookings: Booking[]; liveDetails: any }>();

    // 1. Process all students registered in `students` (from profiles)
    (students || []).forEach(st => {
      const studentBookings = bookings.filter(b => b.student_id === st.id || b.user_id === st.id || (b.email && st.email && b.email.toLowerCase() === st.email.toLowerCase()));
      const activeBooking = studentBookings.find(b => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.OCCUPIED) || studentBookings[0] || null;
      const liveDetails = activeBooking ? getLiveStudentRoomDetails(activeBooking, rooms, accommodationAddresses, accommodationCategories, bedSpaces) : null;
      
      const enrichedStudent: User = {
        ...st,
        email: st.email || activeBooking?.email || '',
        phone_number: st.phone_number || activeBooking?.phone_number,
        nationality: st.nationality || activeBooking?.nationality,
        passport_number: st.passport_number || activeBooking?.passport_number,
        gender: st.gender || (activeBooking?.gender as any) || 'Male'
      };

      studentMap.set(st.id, {
        student: enrichedStudent,
        activeBooking,
        allBookings: studentBookings,
        liveDetails
      });
    });

    // 2. Process all users where role === 'student'
    (users || []).filter(u => u.role === 'student').forEach(st => {
      if (!studentMap.has(st.id)) {
        const studentBookings = bookings.filter(b => b.student_id === st.id || b.user_id === st.id || (b.email && st.email && b.email.toLowerCase() === st.email.toLowerCase()));
        const activeBooking = studentBookings.find(b => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.OCCUPIED) || studentBookings[0] || null;
        const liveDetails = activeBooking ? getLiveStudentRoomDetails(activeBooking, rooms, accommodationAddresses, accommodationCategories, bedSpaces) : null;
        
        studentMap.set(st.id, {
          student: st,
          activeBooking,
          allBookings: studentBookings,
          liveDetails
        });
      }
    });

    // 3. Process any students from bookings who may not have a profiles entry yet
    bookings.forEach(b => {
      const key = b.student_id || b.user_id || b.email?.toLowerCase();
      if (key && !studentMap.has(key) && !Array.from(studentMap.values()).some(item => item.student.email?.toLowerCase() === b.email?.toLowerCase())) {
        const studentBookings = bookings.filter(bk => (b.student_id && bk.student_id === b.student_id) || (b.user_id && bk.user_id === b.user_id) || (b.email && bk.email && bk.email.toLowerCase() === b.email.toLowerCase()));
        const activeBooking = studentBookings.find(bk => bk.status === BookingStatus.CONFIRMED || bk.status === BookingStatus.OCCUPIED) || b;
        const liveDetails = getLiveStudentRoomDetails(activeBooking, rooms, accommodationAddresses, accommodationCategories, bedSpaces);
        const studentObj: User = {
          id: b.student_id || b.user_id || `user_${b.id}`,
          email: b.email,
          full_name: b.full_name,
          role: 'student',
          phone_number: b.phone_number,
          nationality: b.nationality,
          passport_number: b.passport_number,
          created_at: b.booked_at,
          gender: (b.gender as any) || 'Male'
        };
        studentMap.set(key, {
          student: studentObj,
          activeBooking,
          allBookings: studentBookings,
          liveDetails
        });
      }
    });

    return Array.from(studentMap.values());
  }, [students, users, bookings, rooms, bedSpaces, accommodationAddresses, accommodationCategories]);

  const exportToCSV = () => {
    const headers = ['ID', 'Student Name', 'Email', 'Nationality', 'Accommodation', 'Room Name/Number', 'Bed Space', 'Arrival Date', 'Expiry Date', 'Status', 'Booked At'];
    const rows = sortedBookings.map(b => {
      const details = getLiveStudentRoomDetails(b, rooms, accommodationAddresses, accommodationCategories, bedSpaces);
      return [
        `BK${b.id}`,
        b.full_name,
        b.email,
        b.nationality,
        details.category,
        details.roomName,
        details.bedSpaceName,
        b.expected_arrival_date ? new Date(b.expected_arrival_date).toLocaleDateString() : 'N/A',
        b.payment_expiry_date ? new Date(b.payment_expiry_date).toLocaleDateString() : 'N/A',
        b.status,
        new Date(b.booked_at).toLocaleDateString()
      ];
    });
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const analytics = useMemo(() => {
    const safeBookings = bookings || [];
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Confirmed / Occupied bookings for official Occupancy stats (strictly active today)
    const confirmedOrOccupiedBookings = safeBookings.filter(b => isBookingActiveOnDate(b, todayStr));

    // Upcoming future reservations (do NOT count as current occupancy)
    const upcomingReservations = safeBookings.filter(b => isBookingUpcomingReservation(b, todayStr));

    // Active bookings (including holds) for pipeline capacity
    const activePipelineBookings = safeBookings.filter(
      b => b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.COMPLETED
    );

    // Live physical bed spaces count dynamically derived from bed_spaces table (or room capacity sum)
    const dynamicSpaces = contextParsedRoomSpaces || [];
    const totalCapacity = (bedSpaces && bedSpaces.length > 0)
      ? bedSpaces.length
      : (rooms && rooms.length > 0)
        ? rooms.reduce((sum, r) => sum + (Number(r.capacity) || 1), 0)
        : dynamicSpaces.length || 15;
    
    // Occupancy metrics source strictly from bookings active TODAY (future reservations do not count)
    const confirmedCount = confirmedOrOccupiedBookings.length;
    const occupancyRate = totalCapacity > 0 ? Math.round((confirmedCount / totalCapacity) * 100) : 0;
    
    // Available bed spaces accounting for active holds
    const availableBedSpaces = Math.max(0, totalCapacity - activePipelineBookings.length);

    // Revenue calculation logic: Confirmed + Occupied + Reserved + Completed, plus Cancelled only where checked_out_at is set
    const totalRevenue = safeBookings
      .filter(b => {
        if (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.OCCUPIED || b.status === BookingStatus.RESERVED || b.status === BookingStatus.COMPLETED) {
          return true;
        }
        if (b.status === BookingStatus.CANCELLED && (b as any).checked_out_at) {
          return true;
        }
        return false;
      })
      .reduce((sum, b) => sum + (b.total_price || 0), 0);

    return {
      pendingVerifications: safeBookings.filter(b => b.status === BookingStatus.PENDING_VERIFICATION),
      pendingPayments: safeBookings.filter(b => b.status === BookingStatus.PENDING_PAYMENT),
      pendingContracts: safeBookings.filter(b => b.status === BookingStatus.PENDING_CONTRACT),
      upcomingReservations,
      occupancyByType: Object.values(AccommodationType).map(type => {
        const typeBookings = confirmedOrOccupiedBookings.filter(b => {
          const roomObj = (rooms || []).find(r => r.id === b.room_id);
          return roomObj && roomObj.type === type;
        });
        return {
          name: type,
          value: typeBookings.length
        };
      }),
      totalRevenue,
      occupancyRate,
      confirmedBedSpaces: confirmedCount,
      totalRooms: totalCapacity,
      availableRooms: availableBedSpaces
    };
  }, [bookings, rooms, bedSpaces, contextParsedRoomSpaces]);

  const filteredTransactions = useMemo(() => {
    return bookings.filter(b => {
      // Status filter
      if (trxStatusFilter === 'pending_verification' && b.status !== BookingStatus.PENDING_VERIFICATION) return false;
      if (trxStatusFilter === 'pending_payment' && b.status !== BookingStatus.PENDING_PAYMENT) return false;
      if (trxStatusFilter === 'confirmed' && b.status !== BookingStatus.CONFIRMED && b.status !== BookingStatus.OCCUPIED && b.status !== BookingStatus.RESERVED) return false;
      if (trxStatusFilter === 'cancelled' && b.status !== BookingStatus.CANCELLED) return false;

      // Search query
      if (trxSearchQuery.trim()) {
        const q = trxSearchQuery.toLowerCase();
        const matchName = b.full_name.toLowerCase().includes(q);
        const matchEmail = b.email.toLowerCase().includes(q);
        const matchRef = `bk${b.id}`.includes(q);
        const roomDetails = getLiveStudentRoomDetails(b, rooms, accommodationAddresses, accommodationCategories, bedSpaces);
        const matchRoom = roomDetails.roomName.toLowerCase().includes(q) || roomDetails.category.toLowerCase().includes(q);
        return matchName || matchEmail || matchRef || matchRoom;
      }
      return true;
    });
  }, [bookings, trxStatusFilter, trxSearchQuery, rooms, bedSpaces, accommodationAddresses, accommodationCategories]);

  const parsedRoomSpaces = contextParsedRoomSpaces || [];

  const filteredRoomSpaces = useMemo(() => {
    return parsedRoomSpaces.filter(space => {
      if (roomCategoryFilter !== 'all' && space.category !== roomCategoryFilter) {
        return false;
      }
      if (roomFilter === 'occupied' && !space.isOccupied) {
        return false;
      }
      if (roomFilter === 'reserved' && !space.hasFutureBooking && !space.isReserved) {
        return false;
      }
      if (roomFilter === 'available' && (space.isOccupied || space.hasFutureBooking)) {
        return false;
      }
      if (roomSearchQuery.trim()) {
        const q = roomSearchQuery.toLowerCase().trim();
        const matchCat = space.category.toLowerCase().includes(q);
        const matchRoom = space.roomName.toLowerCase().includes(q);
        const matchBed = space.bedSpaceName.toLowerCase().includes(q);
        const matchType = space.type.toLowerCase().includes(q);
        const matchStudent = (space.booking?.full_name || space.booking?.student_name || space.booking?.profiles?.full_name || '').toLowerCase().includes(q);
        const matchFutureStudent = (space.futureBookings || []).some((fb: any) =>
          (fb.full_name || fb.student_name || fb.email || '').toLowerCase().includes(q)
        );
        const matchDisplay = space.displayName.toLowerCase().includes(q);
        return matchCat || matchRoom || matchBed || matchType || matchStudent || matchFutureStudent || matchDisplay;
      }
      return true;
    });
  }, [parsedRoomSpaces, roomCategoryFilter, roomFilter, roomSearchQuery]);

  // 1. Current Occupants List (strictly active physical occupancy today)
  const currentOccupants = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return (bookings || [])
      .filter(b => {
        const isApproved =
          b.status === BookingStatus.CONFIRMED ||
          b.status === BookingStatus.OCCUPIED ||
          b.status === BookingStatus.RESERVED ||
          (b.status as string) === 'Confirmed' ||
          (b.status as string) === 'Occupied' ||
          (b.status as string) === 'Reserved';
        if (!isApproved) return false;

        const s = (b.start_date || b.expected_arrival_date || '').split('T')[0];
        const e = (b.end_date || b.payment_expiry_date || '2099-12-31').split('T')[0];
        if (!s) return false;
        return s <= todayStr && e >= todayStr;
      })
      .sort((a, b) => {
        const eA = (a.end_date || a.payment_expiry_date || '').split('T')[0];
        const eB = (b.end_date || b.payment_expiry_date || '').split('T')[0];
        return eA.localeCompare(eB);
      });
  }, [bookings]);

  // 2. Upcoming Reservations List (approved future stays strictly after today)
  const upcomingReservations = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return (bookings || [])
      .filter(b => {
        const isApproved =
          b.status === BookingStatus.CONFIRMED ||
          b.status === BookingStatus.OCCUPIED ||
          b.status === BookingStatus.RESERVED ||
          (b.status as string) === 'Confirmed' ||
          (b.status as string) === 'Occupied' ||
          (b.status as string) === 'Reserved';
        if (!isApproved) return false;

        const s = (b.start_date || b.expected_arrival_date || '').split('T')[0];
        return Boolean(s && s > todayStr);
      })
      .sort((a, b) => {
        const sA = (a.start_date || a.expected_arrival_date || '').split('T')[0];
        const sB = (b.start_date || b.expected_arrival_date || '').split('T')[0];
        return sA.localeCompare(sB);
      });
  }, [bookings]);

  // 3. Pending Bookings List (awaiting staff approval or payment verification)
  const pendingBookings = useMemo(() => {
    return (bookings || [])
      .filter(b => {
        return (
          b.status === BookingStatus.PENDING_VERIFICATION ||
          b.status === BookingStatus.PENDING_PAYMENT ||
          b.status === BookingStatus.PENDING_CONTRACT ||
          (b.status as string) === 'Pending Verification' ||
          (b.status as string) === 'Pending Payment' ||
          (b.status as string) === 'Pending Contract'
        );
      })
      .sort((a, b) => new Date(b.booked_at).getTime() - new Date(a.booked_at).getTime());
  }, [bookings]);

  const filteredOccupants = useMemo(() => {
    return currentOccupants.filter(b => {
      const liveDetails = getLiveStudentRoomDetails(b, rooms, accommodationAddresses, accommodationCategories, bedSpaces);
      if (roomCategoryFilter !== 'all' && liveDetails.category !== roomCategoryFilter) {
        return false;
      }
      if (roomSearchQuery.trim()) {
        const q = roomSearchQuery.toLowerCase().trim();
        const matchName = (b.full_name || '').toLowerCase().includes(q);
        const matchEmail = (b.email || '').toLowerCase().includes(q);
        const matchPhone = (b.phone_number || '').toLowerCase().includes(q);
        const matchNationality = (b.nationality || '').toLowerCase().includes(q);
        const matchRoom = liveDetails.roomName.toLowerCase().includes(q);
        const matchBed = liveDetails.bedSpaceName.toLowerCase().includes(q);
        const matchCat = liveDetails.category.toLowerCase().includes(q);
        const matchId = `bk${b.id}`.includes(q);
        return matchName || matchEmail || matchPhone || matchNationality || matchRoom || matchBed || matchCat || matchId;
      }
      return true;
    });
  }, [currentOccupants, roomCategoryFilter, roomSearchQuery, rooms, accommodationAddresses, accommodationCategories, bedSpaces]);

  const filteredUpcomingReservations = useMemo(() => {
    return upcomingReservations.filter(b => {
      const liveDetails = getLiveStudentRoomDetails(b, rooms, accommodationAddresses, accommodationCategories, bedSpaces);
      if (roomCategoryFilter !== 'all' && liveDetails.category !== roomCategoryFilter) {
        return false;
      }
      if (roomSearchQuery.trim()) {
        const q = roomSearchQuery.toLowerCase().trim();
        const matchName = (b.full_name || '').toLowerCase().includes(q);
        const matchEmail = (b.email || '').toLowerCase().includes(q);
        const matchPhone = (b.phone_number || '').toLowerCase().includes(q);
        const matchNationality = (b.nationality || '').toLowerCase().includes(q);
        const matchRoom = liveDetails.roomName.toLowerCase().includes(q);
        const matchBed = liveDetails.bedSpaceName.toLowerCase().includes(q);
        const matchCat = liveDetails.category.toLowerCase().includes(q);
        const matchId = `bk${b.id}`.includes(q);
        return matchName || matchEmail || matchPhone || matchNationality || matchRoom || matchBed || matchCat || matchId;
      }
      return true;
    });
  }, [upcomingReservations, roomCategoryFilter, roomSearchQuery, rooms, accommodationAddresses, accommodationCategories, bedSpaces]);

  const filteredPendingBookings = useMemo(() => {
    return pendingBookings.filter(b => {
      const liveDetails = getLiveStudentRoomDetails(b, rooms, accommodationAddresses, accommodationCategories, bedSpaces);
      if (roomCategoryFilter !== 'all' && liveDetails.category !== roomCategoryFilter) {
        return false;
      }
      if (roomSearchQuery.trim()) {
        const q = roomSearchQuery.toLowerCase().trim();
        const matchName = (b.full_name || '').toLowerCase().includes(q);
        const matchEmail = (b.email || '').toLowerCase().includes(q);
        const matchPhone = (b.phone_number || '').toLowerCase().includes(q);
        const matchNationality = (b.nationality || '').toLowerCase().includes(q);
        const matchRoom = liveDetails.roomName.toLowerCase().includes(q);
        const matchBed = liveDetails.bedSpaceName.toLowerCase().includes(q);
        const matchCat = liveDetails.category.toLowerCase().includes(q);
        const matchId = `bk${b.id}`.includes(q);
        return matchName || matchEmail || matchPhone || matchNationality || matchRoom || matchBed || matchCat || matchId;
      }
      return true;
    });
  }, [pendingBookings, roomCategoryFilter, roomSearchQuery, rooms, accommodationAddresses, accommodationCategories, bedSpaces]);

  const handleApprove = async (id: number) => {
    const booking = bookings.find(b => b.id === id);
    const todayStr = new Date().toISOString().split('T')[0];
    const bStart = booking ? (booking.start_date || (booking as any).expected_arrival_date || '').split('T')[0] : '';
    // Future approved bookings must display and persist as Reserved; current/past as Occupied
    const targetStatus = (bStart && bStart > todayStr) ? BookingStatus.RESERVED : BookingStatus.OCCUPIED;
    const result = await updateBookingStatus(id, targetStatus);
    if (result.success) {
        addActivity({ user_id: user?.id || 'admin', type: 'payment', description: `Staff verified payment for BK${id} (Status: ${targetStatus})`, timestamp: new Date().toISOString() });
        
        let emailSuccess = false;
        let emailErrorMessage = '';
        if (booking) {
            const formattedRoom = getDisplayFromRoom(booking.rooms);
            const emailTemplate = getApprovalEmailTemplate(booking.full_name, booking.id, formattedRoom);
            try {
                const emailRes = await sendEmail({
                    to: booking.email,
                    subject: emailTemplate.subject,
                    body: emailTemplate.body,
                    templateName: emailTemplate.templateName,
                    metadata: { booking_id: booking.id }
                });
                emailSuccess = emailRes.success;
                if (!emailRes.success) {
                    emailErrorMessage = emailRes.error || 'Email dispatch failed';
                }
            } catch (err: any) {
                emailErrorMessage = err.message || 'Unknown email error';
                console.error("Failed to send approval email:", err);
            }
        }

        const statusLabel = targetStatus === BookingStatus.RESERVED ? 'Reserved (Upcoming Stay)' : 'Occupied (Active Resident)';
        if (emailSuccess) {
            alert(`Booking BK${id} approved successfully as ${statusLabel}! Confirmation email delivered to student.`);
        } else {
            alert(`Booking BK${id} approved as ${statusLabel} in database, but notification email could not be delivered: ${emailErrorMessage}.\n\nPlease check Email Delivery Logs.`);
        }
    } else {
        alert(`Failed to approve booking: ${result.error}`);
    }
  };

  const handleReject = async (id: number) => {
    const booking = bookings.find(b => b.id === id);
    const reason = prompt(
      `Please enter a rejection reason for transaction BK${id} (optional):`, 
      "Payment verification could not be completed."
    );
    if (reason === null) return; // cancelled prompt

    const result = await updateBookingStatus(id, BookingStatus.CANCELLED);
    if (result.success) {
      addActivity({
        user_id: user?.id || 'admin',
        type: 'system',
        description: `Staff rejected transaction BK${id}${booking ? ` for ${booking.full_name}` : ''}. Reason: ${reason}. Bed space released to vacant.`,
        timestamp: new Date().toISOString()
      });
      alert(`Transaction BK${id} has been rejected and marked as Cancelled. Bed space has been released.`);
    } else {
      alert(`Failed to reject transaction: ${result.error}`);
    }
  };

  const handleCancelReservation = async (id: number) => {
    const booking = bookings.find(b => b.id === id);
    if (!confirm(`Are you sure you want to cancel future reservation BK${id} for ${booking?.full_name || 'this student'}? This will release the bed reservation.`)) return;

    const result = await updateBookingStatus(id, BookingStatus.CANCELLED);
    if (result.success) {
      addActivity({
        user_id: user?.id || 'admin',
        type: 'system',
        description: `Staff cancelled future reservation BK${id}${booking ? ` for ${booking.full_name}` : ''}. Bed space released to vacant.`,
        timestamp: new Date().toISOString()
      });
      alert(`Reservation BK${id} has been successfully cancelled and the bed reservation has been released.`);
    } else {
      alert(`Failed to cancel reservation: ${result.error}`);
    }
  };

  const handleSaveRoom = async (roomData: Room) => {
    let result;
    if (roomData.id && rooms.some(r => r.id === roomData.id)) {
        result = await updateRoom(roomData);
        if (result.success) {
            addActivity({ user_id: user!.id, type: 'system', description: `Updated details for Room ${roomData.room_number}`, timestamp: new Date().toISOString() });
        }
    } else {
        const newRoom = { ...roomData, is_available: true };
        result = await addRoom(newRoom);
        if (result.success) {
            addActivity({ user_id: user!.id, type: 'system', description: `Added new room: ${roomData.room_number}`, timestamp: new Date().toISOString() });
        }
    }

    if (result?.success) {
        setIsRoomModalOpen(false);
    } else {
        alert(`Failed to save room: ${result?.error || 'Unknown error'}`);
    }
  };

  const handleToggleRoomStatus = async (roomId: number, newStatus: 'Active' | 'Inactive') => {
    if (user?.role !== 'staff' && user?.role !== 'proprietor') {
      alert("Unauthorized: Only administrators can change room status.");
      return;
    }

    const room = rooms.find(r => r.id === roomId);
    const roomName = room ? `${room.apartment_name || room.category} - ${room.room_number}` : `Room #${roomId}`;

    setTogglingRoomId(roomId);
    try {
      const res = await toggleRoomStatus(roomId, newStatus);
      if (res.success) {
        addActivity({
          user_id: user.id,
          type: 'system',
          description: `${newStatus === 'Active' ? 'Activated' : 'Deactivated'} ${roomName}. Room is now ${newStatus === 'Active' ? 'visible and bookable' : 'hidden from student listings'}.`,
          timestamp: new Date().toISOString()
        });
      } else {
        alert(`Failed to ${newStatus.toLowerCase()} room: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error updating room status: ${err.message}`);
    } finally {
      setTogglingRoomId(null);
    }
  };

  const handleDeleteRoom = async (roomId: number, roomNumber: string) => {
    if (user?.role !== 'staff' && user?.role !== 'proprietor') {
      alert("Unauthorized: Only administrators can delete rooms.");
      return;
    }

    if (confirm(`Are you sure you want to delete Room ${roomNumber}?\n\nSafety check: Rooms with active or historical student bookings cannot be deleted to maintain data integrity.`)) {
      const res = await deleteRoom(roomId);
      if (res.success) {
        addActivity({ user_id: user.id, type: 'system', description: `Deleted Room ${roomNumber}`, timestamp: new Date().toISOString() });
        alert(`Room ${roomNumber} deleted successfully.`);
      } else {
        alert(`Cannot Delete Room: ${res.error}`);
      }
    }
  };

  const handleOpenRoomModal = (room: Room | null) => {
    setSelectedRoomForEdit(room);
    setIsRoomModalOpen(true);
  };

  const handleOpenUserModal = (userData: User | null) => {
    if (user?.role !== 'proprietor') {
      alert("Unauthorized: Only proprietors can manage admin users and role permissions.");
      return;
    }
    setSelectedUserForEdit(userData);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (userData: Partial<User> & { password?: string; allowed_sections?: string[] }) => {
    if (user?.role !== 'proprietor') {
      const err = "Unauthorized: Only proprietors can manage admin users and role permissions.";
      setAdminToast({ message: err, type: 'error' });
      return { success: false, error: err };
    }
    let result;
    if (userData.id) {
        result = await updateUser(userData.id, userData);
        if (result.success) {
            addActivity({ user_id: user!.id, type: 'system', description: `Updated admin user: ${userData.full_name}`, timestamp: new Date().toISOString() });
            setAdminToast({ message: `Admin user "${userData.full_name}" updated successfully.`, type: 'success' });
        } else {
            setAdminToast({ message: result.error || "Failed to update admin user.", type: 'error' });
        }
    } else {
        result = await addUser(userData);
        if (result.success) {
            addActivity({ user_id: user!.id, type: 'system', description: `Created new admin user: ${userData.full_name}`, timestamp: new Date().toISOString() });
            setAdminToast({ message: `New admin user "${userData.full_name}" created successfully.`, type: 'success' });
        } else {
            setAdminToast({ message: result.error || "Failed to create admin user.", type: 'error' });
        }
    }

    if (result?.success) {
        setIsUserModalOpen(false);
    }
    return result;
  };

  const handleDeleteUser = async (id: string) => {
    if (user?.role !== 'proprietor') {
      setAdminToast({ message: "Unauthorized: Only proprietors can delete admin users.", type: 'error' });
      return;
    }
    if (id === user?.id) {
      setAdminToast({ message: "You cannot delete your own account.", type: 'error' });
      return;
    }
    if (confirm('Are you sure you want to delete this admin user? This action cannot be undone.')) {
        const result = await deleteUser(id);
        if (result.success) {
            addActivity({ user_id: user!.id, type: 'system', description: `Deleted admin user ID: ${id}`, timestamp: new Date().toISOString() });
            setAdminToast({ message: "Admin user deleted successfully.", type: 'success' });
        } else {
            setAdminToast({ message: `Failed to delete user: ${result.error}`, type: 'error' });
        }
    }
  };

  const handleDeleteStudent = async (id: number, studentName: string) => {
    if (user?.role !== 'staff' && user?.role !== 'proprietor') {
        alert("Unauthorized: Only administrators are authorized to delete student records.");
        return;
    }

    if (confirm(`Are you sure you want to delete the student record for ${studentName}?\n\nThis will permanently delete their residency booking, contract details, payment history, and safely update the corresponding room or bed status to Vacant (if applicable) so it can be booked by others.`)) {
        const result = await deleteBooking(id);
        if (result.success) {
            setSelectedBookingIds(prev => prev.filter(bId => bId !== id));
            addActivity({ 
                user_id: user.id, 
                type: 'system', 
                description: `Deleted student record for ${studentName}. Bed space/room released and marked vacant.`, 
                timestamp: new Date().toISOString() 
            });
            alert(`Successfully deleted student record for ${studentName}.`);
        } else {
            alert(`Failed to delete student record: ${result.error}`);
        }
    }
  };

  const handleBulkDeleteStudents = async () => {
    if (user?.role !== 'staff' && user?.role !== 'proprietor') {
        alert("Unauthorized: Only administrators are authorized to delete student records.");
        return;
    }

    if (selectedBookingIds.length === 0) {
        alert("Please select at least one student to delete.");
        return;
    }

    const namesToDelete = sortedBookings
        .filter(b => selectedBookingIds.includes(b.id))
        .map(b => b.full_name)
        .join(", ");

    if (confirm(`Are you sure you want to permanently delete the student records for the following ${selectedBookingIds.length} student(s)?\n\n[ ${namesToDelete} ]\n\nThis will permanently delete their residency bookings, contract details, payment histories, and safely update the corresponding room or bed statuses to Vacant (if applicable).`)) {
        let successCount = 0;
        let failCount = 0;
        const failedNames: string[] = [];

        for (const id of selectedBookingIds) {
            const booking = bookings.find(b => b.id === id);
            if (!booking) continue;
            
            const result = await deleteBooking(id);
            if (result.success) {
                successCount++;
                addActivity({ 
                    user_id: user.id, 
                    type: 'system', 
                    description: `Deleted student record for ${booking.full_name} via bulk delete. Bed space/room released and marked vacant.`, 
                    timestamp: new Date().toISOString() 
                });
            } else {
                failCount++;
                failedNames.push(`${booking.full_name} (${result.error})`);
            }
        }

        setSelectedBookingIds([]);

        if (failCount === 0) {
            alert(`Successfully deleted ${successCount} student record(s).`);
        } else {
            alert(`Bulk delete completed.\nSuccessfully deleted: ${successCount} student(s).\nFailed to delete ${failCount} student(s):\n${failedNames.join("\n")}`);
        }
    }
  };
  
  const handleFaqChange = (index: number, field: 'q' | 'a', value: string) => {
    const updatedFaqs = [...(cmsContent.faqs.en || [])];
    updatedFaqs[index] = { ...updatedFaqs[index], [field]: value };
    updateCmsContent({ faqs: { ...cmsContent.faqs, en: updatedFaqs } });
  };
  
  const handleAddFaq = () => {
    const newFaq = { id: Date.now(), q: 'New Question', a: 'New Answer' };
    updateCmsContent({ faqs: { ...cmsContent.faqs, en: [...(cmsContent.faqs.en || []), newFaq] } });
  };

  const handleRemoveFaq = (id: number) => {
    if (confirm('Are you sure you want to delete this FAQ?')) {
        updateCmsContent({ faqs: { ...cmsContent.faqs, en: (cmsContent.faqs.en || []).filter(f => f.id !== id) } });
    }
  };

  const handleAddAnnouncement = () => {
    const newAnnouncements = [...(cmsContent.announcements?.[language] || [])];
    const nextId = newAnnouncements.length > 0 ? Math.max(...newAnnouncements.map(a => a.id)) + 1 : 1;
    newAnnouncements.push({ id: nextId, title: 'New Announcement', content: '', date: new Date().toISOString() });
    updateCmsContent({ announcements: { ...cmsContent.announcements, [language]: newAnnouncements } });
  };

  const handleAnnouncementChange = (index: number, field: 'title' | 'content', value: string) => {
    const newAnnouncements = [...(cmsContent.announcements?.[language] || [])];
    newAnnouncements[index] = { ...newAnnouncements[index], [field]: value };
    updateCmsContent({ announcements: { ...cmsContent.announcements, [language]: newAnnouncements } });
  };

  const handleRemoveAnnouncement = (id: number) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      const newAnnouncements = (cmsContent.announcements?.[language] || []).filter(a => a.id !== id);
      updateCmsContent({ announcements: { ...cmsContent.announcements, [language]: newAnnouncements } });
    }
  };

  const selectedBookingLiveDetails = useMemo(() => {
    if (!selectedBooking) return null;
    return getLiveStudentRoomDetails(selectedBooking, rooms, accommodationAddresses, accommodationCategories, bedSpaces);
  }, [selectedBooking, rooms, bedSpaces, accommodationAddresses, accommodationCategories]);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 flex">
      {/* Grouped Admin Navigation Sidebar */}
      <AdminSidebar
        currentSection={activeSection}
        onSelectSection={(sec) => handleSelectSection(sec)}
        user={user}
        pendingVerificationsCount={analytics.pendingVerifications.length}
        totalStudentsCount={uniqueStudentRecords.length}
        pendingWaitlistCount={waitingWaitlistCount}
        unreadMessagesCount={unreadMessagesCount}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Admin Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl"
              title="Open Navigation"
            >
              ☰
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white capitalize">
                {activeSection.replace(/_/g, ' ')}
              </h1>
              <p className="text-[11px] text-gray-400 font-medium hidden sm:block">
                Al-Ibaanah Student Residency • {user?.full_name || 'Administrator'} ({user?.role === 'proprietor' ? 'Main Admin' : 'Limited Admin'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Action: New Booking */}
            <button
              onClick={() => setIsAdminBookingModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <IconPlus className="w-3.5 h-3.5" /> New Booking
            </button>

            {/* Notification Bell for Slide-over Activity Drawer */}
            <button
              id="admin-notification-bell"
              onClick={() => setIsActivityDrawerOpen(true)}
              className="relative p-2 rounded-xl text-gray-500 hover:text-brand-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title="Open Operations & Notifications Drawer"
            >
              <span className="text-xl">🔔</span>
              {unreadAdminNotificationCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900 shadow-xs animate-pulse">
                  {unreadAdminNotificationCount > 99 ? '99+' : unreadAdminNotificationCount}
                </span>
              ) : (activities?.length || 0) > 0 ? (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
              ) : null}
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-2 pl-3 border-l border-gray-100 dark:border-gray-800">
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {(user?.full_name || 'AD').slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{user?.full_name || 'Admin'}</p>
                <p className="text-[10px] text-gray-400 font-mono capitalize">{user?.role === 'proprietor' ? 'Proprietor (Main Admin)' : 'Staff (Limited Admin)'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Section Content */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {!isSectionAllowed(user, activeSection) ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 shadow-md text-center max-w-md mx-auto my-12 animate-fade-in">
              <span className="text-4xl mb-3 block">🔒</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Section Access Restricted</h3>
              <p className="text-xs text-gray-500 mt-2">
                Your staff administrative account does not have permission to access this section.
              </p>
              <button
                onClick={() => handleSelectSection(resolveSafeSection(user, null))}
                className="mt-5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-colors shadow-sm"
              >
                Go to Authorized Section →
              </button>
            </div>
          ) : (
            <>
              {/* 1. OVERVIEW: Dashboard Analytics */}
              {activeSection === 'dashboard' && (
                user?.role === 'staff' ? (
                  // Limited Admin Dashboard View: Operational Summaries (NO Revenue, NO Occupancy Rate, NO financial/occupancy chart)
                  <div className="space-y-8 animate-fade-in">
                    {/* Active Waitlist Priority Attention Banner (if permitted) */}
                    {waitingWaitlistCount > 0 && isSectionAllowed(user, 'waitlist') && (
                      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-700/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xl shrink-0 shadow-sm">
                            ⏳
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              {waitingWaitlistCount} Student Applicant{waitingWaitlistCount === 1 ? '' : 's'} Waiting in Waitlist Queue
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white animate-pulse">
                                Pending Placement
                              </span>
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                              Students have joined the residency waitlist for currently unavailable room spaces and are awaiting accommodation offers.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSelectSection('waitlist')}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all whitespace-nowrap self-start sm:self-center"
                        >
                          View & Attend to Waitlist →
                        </button>
                      </div>
                    )}

                    {/* Operational Summaries Section */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span>📋</span> {t.admin_operational_summary || 'Operational Summaries'}
                          </h3>
                          <p className="text-xs text-gray-500">Live student residency metrics and operational queue status</p>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          Staff Operational View
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <SummaryCard 
                          label={t.admin_active_residents || "Active Residents"} 
                          value={currentOccupants.length} 
                          icon="🏠" 
                          trend="Current stay"
                          colorClass="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                          onClick={isSectionAllowed(user, 'bookings') ? () => handleSelectSection('bookings') : undefined}
                          actionLabel={isSectionAllowed(user, 'bookings') ? "View occupants" : undefined}
                        />
                        <SummaryCard 
                          label={t.admin_upcoming_reservations_metric || "Upcoming Reservations"} 
                          value={upcomingReservations.length} 
                          icon="📅" 
                          trend="Future arrivals"
                          colorClass="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"
                          onClick={isSectionAllowed(user, 'bookings') ? () => handleSelectSection('bookings') : undefined}
                          actionLabel={isSectionAllowed(user, 'bookings') ? "View reservations" : undefined}
                        />
                        <SummaryCard 
                          label={t.admin_registered_students || "Registered Students"} 
                          value={uniqueStudentRecords.length} 
                          icon="🎓" 
                          trend="Student accounts"
                          colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                          onClick={isSectionAllowed(user, 'students') ? () => handleSelectSection('students') : undefined}
                          actionLabel={isSectionAllowed(user, 'students') ? "Manage students" : undefined}
                        />
                        <SummaryCard 
                          label={t.admin_pending_transactions || "Pending Transactions"} 
                          value={analytics.pendingVerifications.length} 
                          icon="💳" 
                          colorClass="bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                          onClick={isSectionAllowed(user, 'transactions') ? () => handleSelectSection('transactions') : undefined}
                          actionLabel={analytics.pendingVerifications.length > 0 && isSectionAllowed(user, 'transactions') ? "Review transactions" : undefined}
                        />
                        <SummaryCard 
                          label={t.admin_unread_messages || "Unread Messages"} 
                          value={unreadMessagesCount} 
                          icon="💬" 
                          colorClass="bg-rose-100 dark:bg-rose-900/30 text-rose-600"
                          onClick={isSectionAllowed(user, 'messages') ? () => handleSelectSection('messages') : undefined}
                          actionLabel={unreadMessagesCount > 0 && isSectionAllowed(user, 'messages') ? "Open inbox" : undefined}
                        />
                      </div>
                    </div>

                    {/* Operational Quick Actions (NO Financial / Occupancy charts) */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                        <span>⚡</span> Operational Quick Actions
                      </h3>
                      <p className="text-xs text-gray-500 mb-4">
                        Quick shortcuts to your authorized operational management workflows
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {isSectionAllowed(user, 'bookings') && (
                          <button
                            onClick={() => handleSelectSection('bookings')}
                            className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 bg-gray-50/50 dark:bg-gray-750 transition-all text-left flex items-start gap-3 group"
                          >
                            <span className="text-2xl p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">🛏️</span>
                            <div>
                              <h4 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-brand-600">Bookings</h4>
                              <p className="text-[11px] text-gray-500 mt-0.5">{currentOccupants.length} Occupants, {upcomingReservations.length} Reserved</p>
                            </div>
                          </button>
                        )}
                        {isSectionAllowed(user, 'students') && (
                          <button
                            onClick={() => handleSelectSection('students')}
                            className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 bg-gray-50/50 dark:bg-gray-750 transition-all text-left flex items-start gap-3 group"
                          >
                            <span className="text-2xl p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">🎓</span>
                            <div>
                              <h4 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-brand-600">Students</h4>
                              <p className="text-[11px] text-gray-500 mt-0.5">{uniqueStudentRecords.length} Registered Accounts</p>
                            </div>
                          </button>
                        )}
                        {isSectionAllowed(user, 'transactions') && (
                          <button
                            onClick={() => handleSelectSection('transactions')}
                            className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 bg-gray-50/50 dark:bg-gray-750 transition-all text-left flex items-start gap-3 group"
                          >
                            <span className="text-2xl p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600">💳</span>
                            <div>
                              <h4 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-brand-600">Transactions</h4>
                              <p className="text-[11px] text-gray-500 mt-0.5">{analytics.pendingVerifications.length} Awaiting Verification</p>
                            </div>
                          </button>
                        )}
                        {isSectionAllowed(user, 'messages') && (
                          <button
                            onClick={() => handleSelectSection('messages')}
                            className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 bg-gray-50/50 dark:bg-gray-750 transition-all text-left flex items-start gap-3 group"
                          >
                            <span className="text-2xl p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600">💬</span>
                            <div>
                              <h4 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-brand-600">Messages</h4>
                              <p className="text-[11px] text-gray-500 mt-0.5">{unreadMessagesCount} Unread Communications</p>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Main Admin (Proprietor) Overview
                  <>
                    {/* Active Waitlist Priority Attention Banner */}
                    {waitingWaitlistCount > 0 && (
                      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-700/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xl shrink-0 shadow-sm">
                            ⏳
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              {waitingWaitlistCount} Student Applicant{waitingWaitlistCount === 1 ? '' : 's'} Waiting in Waitlist Queue
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white animate-pulse">
                                Pending Placement
                              </span>
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                              Students have joined the residency waitlist for currently unavailable room spaces and are awaiting accommodation offers.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSelectSection('waitlist')}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all whitespace-nowrap self-start sm:self-center"
                        >
                          View & Attend to Waitlist →
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <SummaryCard 
                          label="Total Revenue" 
                          value={`$${analytics.totalRevenue.toLocaleString()}`} 
                          icon="💰" 
                          trend="12% vs last month"
                          colorClass="bg-green-100 dark:bg-green-900/30 text-green-600"
                        />
                        <SummaryCard 
                          label="Occupancy Rate" 
                          value={`${analytics.occupancyRate}%`} 
                          icon="🏠" 
                          trend="3% growth"
                          colorClass="bg-brand-100 dark:bg-brand-900/30 text-brand-600"
                        />
                        <SummaryCard 
                          label="Total Bed Spaces" 
                          value={analytics.totalRooms} 
                          icon="🚪" 
                          colorClass="bg-purple-100 dark:bg-purple-900/30 text-purple-600"
                        />
                        <SummaryCard 
                          label="Pending Verif." 
                          value={analytics.pendingVerifications.length} 
                          icon="📋" 
                          colorClass="bg-accent-100 dark:bg-accent-900/30 text-accent-600"
                          onClick={() => handleSelectSection('transactions')}
                          actionLabel={analytics.pendingVerifications.length > 0 ? "Review transactions" : undefined}
                        />
                        <SummaryCard 
                          label="Waitlist Queue" 
                          value={waitingWaitlistCount} 
                          icon="⏳" 
                          colorClass="bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                          onClick={() => handleSelectSection('waitlist')}
                          actionLabel={waitingWaitlistCount > 0 ? "Attend to queue" : "View waitlist"}
                        />
                    </div>

                    {/* Occupancy Chart */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                      <h3 className="text-lg font-bold mb-4">Occupancy by Category</h3>
                      <OccupancyChart data={analytics.occupancyByType} />
                    </div>
                  </>
                )
              )}

          {/* 2. TRANSACTIONS TAB */}
          {activeSection === 'transactions' && (
            <div className="space-y-6">
              {/* Transactions Metrics Summary */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${user?.role === 'staff' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
                {user?.role !== 'staff' && (
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase">Total Revenue Volume</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">${analytics.totalRevenue.toLocaleString()}</p>
                  </div>
                )}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <p className="text-xs font-bold text-amber-600 uppercase">Pending Review</p>
                  <p className="text-2xl font-black text-amber-600 mt-1">{analytics.pendingVerifications.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <p className="text-xs font-bold text-green-600 uppercase">Confirmed Transactions</p>
                  <p className="text-2xl font-black text-green-600 mt-1">
                    {bookings.filter(b => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.OCCUPIED).length}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <p className="text-xs font-bold text-blue-600 uppercase">Awaiting Payment</p>
                  <p className="text-2xl font-black text-blue-600 mt-1">{analytics.pendingPayments.length}</p>
                </div>
              </div>

              {/* Transactions Table Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="p-6 border-b dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Student Transactions & Payment Log</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Live transaction audit fetched directly from Supabase database</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <input 
                      type="text"
                      placeholder="Search TRX ID, student, room..."
                      value={trxSearchQuery}
                      onChange={(e) => setTrxSearchQuery(e.target.value)}
                      className="px-3 py-2 text-xs border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                    />

                    <select
                      value={trxStatusFilter}
                      onChange={(e) => setTrxStatusFilter(e.target.value as any)}
                      className="px-3 py-2 text-xs font-bold border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending_verification">Pending Verification</option>
                      <option value="pending_payment">Awaiting Payment</option>
                      <option value="confirmed">Confirmed / Paid</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">TRX Ref ID</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Student</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Type / Description</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Accommodation</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {filteredTransactions.length > 0 ? (
                        filteredTransactions.map(trx => {
                          const liveDetails = getLiveStudentRoomDetails(trx, rooms, accommodationAddresses, accommodationCategories, bedSpaces);
                          return (
                            <tr key={trx.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-750 transition-colors">
                              <td className="px-6 py-4 font-mono font-bold text-xs text-brand-600 dark:text-brand-400">
                                BK{trx.id}
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-bold text-sm text-gray-900 dark:text-white">{trx.full_name}</div>
                                <div className="text-[11px] text-gray-500 font-mono">{trx.email}</div>
                              </td>
                              <td className="px-6 py-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Security Deposit + Residency Rent
                              </td>
                              <td className="px-6 py-4 font-black text-sm text-gray-900 dark:text-white">
                                ${trx.total_price || 0}
                              </td>
                              <td className="px-6 py-4">
                                <BookingStatusBadge status={trx.status} startDate={trx.start_date || trx.expected_arrival_date} endDate={trx.end_date || trx.payment_expiry_date} />
                              </td>
                              <td className="px-6 py-4 text-xs text-gray-500">
                                {new Date(trx.booked_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-bold text-xs text-gray-800 dark:text-gray-200">
                                  {liveDetails.category} - {liveDetails.roomName}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {trx.status === BookingStatus.CONFIRMED || trx.status === BookingStatus.OCCUPIED || trx.status === BookingStatus.RESERVED ? (
                                    <>
                                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                                        getEffectiveBookingStatus(trx.status, trx.start_date || trx.expected_arrival_date, trx.end_date) === BookingStatus.RESERVED
                                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                          : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800'
                                      }`}>
                                        ✓ Approved {getEffectiveBookingStatus(trx.status, trx.start_date || trx.expected_arrival_date, trx.end_date) === BookingStatus.RESERVED ? '(Reserved)' : ''}
                                      </span>
                                      <button
                                        onClick={() => handleReject(trx.id)}
                                        className="bg-red-50 hover:bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 hover:text-red-700 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors border border-red-200 dark:border-red-800 shadow-2xs"
                                        title="Reject / Cancel Transaction"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  ) : trx.status === BookingStatus.CANCELLED ? (
                                    <>
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800">
                                        ✕ Rejected
                                      </span>
                                      <button
                                        onClick={() => handleApprove(trx.id)}
                                        className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 hover:text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800 shadow-2xs"
                                        title="Approve / Reinstate Transaction"
                                      >
                                        Approve
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleApprove(trx.id)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors flex items-center gap-1"
                                        title="Approve transaction and verify payment"
                                      >
                                        ✓ Approve
                                      </button>
                                      <button
                                        onClick={() => handleReject(trx.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors flex items-center gap-1"
                                        title="Reject transaction and cancel booking"
                                      >
                                        ✕ Reject
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-gray-500 text-sm">
                            No transaction records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. BOOKINGS TAB */}
          {activeSection === 'bookings' && (
             <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bookings & Residency Management</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Manage current student occupants, upcoming reservations, and verify pending booking applications.</p>
                  </div>
                  <button
                    onClick={() => setIsAdminBookingModalOpen(true)}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all shrink-0"
                  >
                    <IconPlus className="w-4 h-4" /> Book Room for Student
                  </button>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
                  <button
                    onClick={() => setBookingSubView('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      bookingSubView === 'all'
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <span>🛏️ {t.admin_bookings_all_spaces || 'All Bed Spaces & Residencies'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      bookingSubView === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {parsedRoomSpaces.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setBookingSubView('occupants')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      bookingSubView === 'occupants'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <span>👤 {t.admin_bookings_current_occupants || 'Current Occupants'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      bookingSubView === 'occupants' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}>
                      {currentOccupants.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setBookingSubView('reservations')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      bookingSubView === 'reservations'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <span>📅 {t.admin_bookings_upcoming_reservations || 'Upcoming Reservations'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      bookingSubView === 'reservations' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                    }`}>
                      {upcomingReservations.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setBookingSubView('pending')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      bookingSubView === 'pending'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <span>⏳ {t.admin_bookings_pending_review || 'Pending Bookings'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      bookingSubView === 'pending'
                        ? 'bg-white/20 text-white'
                        : pendingBookings.length > 0
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 animate-pulse'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                    }`}>
                      {pendingBookings.length}
                    </span>
                  </button>
                </div>

                {/* Metrics Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-2xs">
                    <p className="text-[11px] font-bold text-gray-500 uppercase">Total Bed Spaces</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white mt-1">{parsedRoomSpaces.length}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Physical bed capacity</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs">
                    <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase">Current Occupants</p>
                    <p className="text-xl font-black text-amber-700 dark:text-amber-400 mt-1">{currentOccupants.length}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Active residency today</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 shadow-2xs">
                    <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase">Upcoming Reservations</p>
                    <p className="text-xl font-black text-blue-700 dark:text-blue-400 mt-1">{upcomingReservations.length}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Reserved future stays</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-100 dark:border-purple-900/40 shadow-2xs">
                    <p className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase">Pending Review</p>
                    <p className="text-xl font-black text-purple-700 dark:text-purple-400 mt-1">{pendingBookings.length}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Awaiting verification</p>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                   <div className="p-4 sm:p-5 border-b dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3 flex-1">
                         <input 
                            type="text"
                            placeholder="Search room, bed, student name, email, BK ref..."
                            value={roomSearchQuery}
                            onChange={(e) => setRoomSearchQuery(e.target.value)}
                            className="px-3.5 py-2 text-xs border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-1 focus:ring-brand-500 w-full sm:w-72"
                         />

                         <select
                            value={roomCategoryFilter}
                            onChange={(e) => setRoomCategoryFilter(e.target.value)}
                            className="px-3 py-2 text-xs font-bold border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                         >
                            <option value="all">All Accommodations</option>
                            {(accommodationCategories || []).map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                         </select>

                         {bookingSubView === 'all' && (
                           <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                              {(['all', 'occupied', 'reserved', 'available'] as const).map(f => (
                                 <button 
                                    key={f} 
                                    onClick={() => setRoomFilter(f)} 
                                    className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition-all ${
                                       roomFilter === f 
                                          ? 'bg-white dark:bg-gray-600 text-brand-600 shadow-sm' 
                                          : 'text-gray-500 dark:text-gray-400'
                                    }`}
                                 >
                                    {f === 'available' ? 'Vacant' : f}
                                 </button>
                              ))}
                           </div>
                         )}
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Showing {
                          bookingSubView === 'all' ? filteredRoomSpaces.length :
                          bookingSubView === 'occupants' ? filteredOccupants.length :
                          bookingSubView === 'reservations' ? filteredUpcomingReservations.length :
                          filteredPendingBookings.length
                        } record(s)
                      </div>
                   </div>

                   {/* SUB-VIEW 1: ALL BED SPACES & RESIDENCIES MATRIX */}
                   {bookingSubView === 'all' && (
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                           <thead className="bg-gray-50 dark:bg-gray-900">
                              <tr>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Accommodation</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Room & Bed</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Room Type</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Bed Status</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Current & Upcoming Residency</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                              {filteredRoomSpaces.length > 0 ? (
                                 filteredRoomSpaces.map(space => {
                                    const hasBoth = space.isOccupied && space.booking && space.futureBookings && space.futureBookings.length > 0;
                                    const futureBooking = space.futureBookings && space.futureBookings.length > 0 ? space.futureBookings[0] : null;

                                    return (
                                       <tr key={space.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-750 transition-colors">
                                          <td className="px-6 py-4 align-top">
                                             <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black uppercase bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                                                {space.category}
                                             </span>
                                          </td>
                                          <td className="px-6 py-4 align-top">
                                             <div className="font-bold text-sm text-gray-900 dark:text-white">
                                                {space.roomName}
                                             </div>
                                             <div className="font-bold text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                                                {space.bedSpaceName}
                                             </div>
                                          </td>
                                          <td className="px-6 py-4 align-top">
                                             <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                                {space.type}
                                             </span>
                                          </td>
                                          <td className="px-6 py-4 align-top">
                                             {hasBoth ? (
                                               <div className="flex flex-col gap-1.5 items-start">
                                                 <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
                                                   <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                   Occupied
                                                 </span>
                                                 <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 shadow-2xs">
                                                   <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                   Reserved (from {futureBooking?.start_date || futureBooking?.expected_arrival_date || "Future"})
                                                 </span>
                                               </div>
                                             ) : space.isOccupied ? (
                                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                 <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                 Occupied
                                               </span>
                                             ) : space.hasFutureBooking && futureBooking ? (
                                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200">
                                                 <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                 Reserved (from {futureBooking.start_date || futureBooking.expected_arrival_date || "Future"})
                                               </span>
                                             ) : (
                                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                 Vacant / Available
                                               </span>
                                             )}
                                          </td>
                                          <td className="px-6 py-4 align-top">
                                             {hasBoth && futureBooking ? (
                                               /* Bed 4 Dual Occupant & Upcoming Reservation Presentation */
                                               <div className="space-y-2 min-w-[280px]">
                                                 {/* 1. Current Occupant Card */}
                                                 <div className="p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 shadow-2xs">
                                                   <div className="flex items-center justify-between text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase mb-1">
                                                     <span className="flex items-center gap-1">
                                                       <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                                       Current Occupant (Occupied)
                                                     </span>
                                                     <span className="font-mono lowercase text-gray-500">BK{space.booking.id}</span>
                                                   </div>
                                                   <p className="font-bold text-sm text-gray-900 dark:text-white">{space.booking.full_name}</p>
                                                   <div className="text-[11px] text-gray-600 dark:text-gray-300 flex flex-wrap gap-x-2 mt-0.5 font-mono">
                                                     <span>{space.booking.email}</span>
                                                     {space.booking.phone_number && <span>• {space.booking.phone_number}</span>}
                                                   </div>
                                                   <div className="mt-1 text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1">
                                                     <span>Stay: {space.booking.start_date} → {space.booking.end_date}</span>
                                                     <span className="text-[10px] text-gray-500">({formatBookingDuration(space.booking)})</span>
                                                   </div>
                                                 </div>

                                                 {/* 2. Upcoming Reservation Card */}
                                                 <div className="p-2.5 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/90 dark:border-blue-800/60 shadow-2xs">
                                                   <div className="flex items-center justify-between text-[10px] font-black text-blue-800 dark:text-blue-300 uppercase mb-1">
                                                     <span className="flex items-center gap-1">
                                                       <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                                       Upcoming Reservation (Reserved)
                                                     </span>
                                                     <span className="font-mono lowercase text-gray-500">BK{futureBooking.id}</span>
                                                   </div>
                                                   <p className="font-bold text-sm text-gray-900 dark:text-white">{futureBooking.full_name || futureBooking.student_name}</p>
                                                   <div className="text-[11px] text-gray-600 dark:text-gray-300 flex flex-wrap gap-x-2 mt-0.5 font-mono">
                                                     <span>{futureBooking.email}</span>
                                                     {futureBooking.phone_number && <span>• {futureBooking.phone_number}</span>}
                                                   </div>
                                                   <div className="mt-1 text-[11px] text-blue-800 dark:text-blue-300 font-semibold flex items-center justify-between">
                                                     <span>Arrival: {futureBooking.start_date || futureBooking.expected_arrival_date} → Expiry: {futureBooking.end_date || futureBooking.payment_expiry_date}</span>
                                                     <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded font-mono font-bold">
                                                       {formatBookingDuration(futureBooking)}
                                                     </span>
                                                   </div>
                                                   <div className="mt-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                     <span>Payment: {getBookingPaymentStatus(futureBooking).label}</span>
                                                     {futureBooking.total_price && <span>(${futureBooking.total_price})</span>}
                                                   </div>
                                                 </div>
                                               </div>
                                             ) : space.isOccupied && space.booking ? (
                                                <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 text-xs min-w-[240px]">
                                                   <div className="flex items-center justify-between text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase mb-0.5">
                                                     <span>Current Occupant</span>
                                                     <span className="font-mono text-gray-500">BK{space.booking.id}</span>
                                                   </div>
                                                   <p className="font-bold text-gray-900 dark:text-white text-sm">{space.booking.full_name}</p>
                                                   <p className="text-[11px] text-gray-500 font-mono">{space.booking.email}</p>
                                                   <p className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold mt-1">
                                                     Arrival: {space.booking.start_date} → Expiry: {space.booking.end_date}
                                                   </p>
                                                </div>
                                             ) : space.hasFutureBooking && futureBooking ? (
                                                <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 text-xs min-w-[240px]">
                                                   <div className="flex items-center justify-between text-[10px] font-black text-blue-800 dark:text-blue-300 uppercase mb-0.5">
                                                     <span>Upcoming Reservation (Reserved)</span>
                                                     <span className="font-mono text-gray-500">BK{futureBooking.id}</span>
                                                   </div>
                                                   <p className="font-bold text-gray-900 dark:text-white text-sm">{futureBooking.full_name || futureBooking.student_name}</p>
                                                   <p className="text-[11px] text-gray-500 font-mono">{futureBooking.email}</p>
                                                   <p className="text-[11px] text-blue-800 dark:text-blue-300 font-semibold mt-1">
                                                     Arrival: {futureBooking.start_date || futureBooking.expected_arrival_date} → Expiry: {futureBooking.end_date}
                                                   </p>
                                                   <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
                                                     Duration: {formatBookingDuration(futureBooking)} • {getBookingPaymentStatus(futureBooking).label}
                                                   </p>
                                                </div>
                                             ) : (
                                                <div className="text-xs text-gray-400 italic py-2">
                                                   Vacant & ready for residency
                                                </div>
                                             )}
                                          </td>
                                          <td className="px-6 py-4 align-top">
                                             <div className="flex flex-col gap-2">
                                                {hasBoth && futureBooking ? (
                                                   <div className="space-y-2">
                                                      {/* Actions for Current Occupant */}
                                                      <div className="flex items-center gap-1.5">
                                                         <button 
                                                            onClick={() => setSelectedBooking(space.booking)} 
                                                            className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-2xs flex items-center gap-1"
                                                            title="Edit Current Occupant Details"
                                                         >
                                                            <IconEdit className="w-3 h-3" /> Edit Occupant
                                                         </button>
                                                         <button 
                                                            onClick={() => setSelectedBookingForExtend(space.booking)} 
                                                            className="bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-amber-300/50 flex items-center gap-1"
                                                            title="Extend Stay for Current Occupant"
                                                         >
                                                            <IconCalendar className="w-3 h-3" /> Extend
                                                         </button>
                                                      </div>

                                                      {/* Actions for Upcoming Reservation */}
                                                      <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-gray-700">
                                                         <button 
                                                            onClick={() => setSelectedBooking(futureBooking)} 
                                                            className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-2xs flex items-center gap-1"
                                                            title="Edit Upcoming Reservation Details"
                                                         >
                                                            <IconEdit className="w-3 h-3" /> Edit Reservation
                                                         </button>
                                                         <button 
                                                            onClick={() => handleCancelReservation(futureBooking.id)} 
                                                            className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-1"
                                                            title="Cancel Future Reservation (Releases Bed Reservation)"
                                                         >
                                                            <IconClose className="w-3 h-3" /> Cancel
                                                         </button>
                                                      </div>
                                                   </div>
                                                ) : space.isOccupied && space.booking ? (
                                                   <div className="flex flex-wrap items-center gap-1.5">
                                                      <button 
                                                         onClick={() => setSelectedBooking(space.booking)} 
                                                         className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5"
                                                      >
                                                         <IconEdit className="w-3.5 h-3.5" /> Edit Booking
                                                      </button>
                                                      <button 
                                                         onClick={() => setSelectedBookingForExtend(space.booking)} 
                                                         className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-indigo-200/50 flex items-center gap-1"
                                                         title="Extend Stay for Current Room"
                                                      >
                                                         <IconCalendar className="w-3.5 h-3.5" /> Extend
                                                      </button>
                                                   </div>
                                                ) : space.hasFutureBooking && futureBooking ? (
                                                   <div className="flex flex-wrap items-center gap-1.5">
                                                      <button 
                                                         onClick={() => setSelectedBooking(futureBooking)} 
                                                         className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5"
                                                      >
                                                         <IconEdit className="w-3.5 h-3.5" /> Edit Reservation
                                                      </button>
                                                      <button 
                                                         onClick={() => handleCancelReservation(futureBooking.id)} 
                                                         className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-1"
                                                         title="Cancel Future Reservation"
                                                      >
                                                         <IconClose className="w-3.5 h-3.5" /> Cancel
                                                      </button>
                                                   </div>
                                                ) : (
                                                   <button 
                                                      onClick={() => setIsAdminBookingModalOpen(true)} 
                                                      className="bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-brand-200/50 flex items-center gap-1.5 w-fit"
                                                   >
                                                      <IconPlus className="w-3.5 h-3.5" /> Book Space
                                                   </button>
                                                )}
                                             </div>
                                          </td>
                                       </tr>
                                    );
                                 })
                              ) : (
                                 <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">
                                       No rooms match selected filters.
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                   )}

                   {/* SUB-VIEW 2: DEDICATED CURRENT OCCUPANTS TAB (Requirement 1) */}
                   {bookingSubView === 'occupants' && (
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                           <thead className="bg-gray-50 dark:bg-gray-900">
                              <tr>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Student Details</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Accommodation</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Room & Bed</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">{t.admin_arrival_date || 'Arrival Date'}</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">{t.admin_expiry_date || 'Expiry Date'}</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                              {filteredOccupants.length > 0 ? (
                                 filteredOccupants.map(b => {
                                    const liveDetails = getLiveStudentRoomDetails(b, rooms, accommodationAddresses, accommodationCategories, bedSpaces);
                                    return (
                                       <tr key={b.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-750 transition-colors">
                                          <td className="px-6 py-4">
                                             <div className="font-bold text-sm text-gray-900 dark:text-white">{b.full_name}</div>
                                             <div className="text-[11px] text-gray-500 font-mono">{b.email}</div>
                                             <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
                                               {b.phone_number && <span>📞 {b.phone_number}</span>}
                                               {b.nationality && <span>🌍 {b.nationality}</span>}
                                               <span className="font-mono font-bold text-brand-600">BK{b.id}</span>
                                             </div>
                                          </td>
                                          <td className="px-6 py-4">
                                             <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black uppercase bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                                                {liveDetails.category}
                                             </span>
                                          </td>
                                          <td className="px-6 py-4">
                                             <div className="font-bold text-xs text-gray-900 dark:text-white">{liveDetails.roomName}</div>
                                             <div className="text-[11px] text-gray-500">{liveDetails.bedSpaceName}</div>
                                          </td>
                                          <td className="px-6 py-4 font-mono text-xs font-bold text-gray-800 dark:text-gray-200">
                                             {b.start_date || b.expected_arrival_date || 'N/A'}
                                          </td>
                                          <td className="px-6 py-4 font-mono text-xs font-bold text-amber-700 dark:text-amber-400">
                                             {b.end_date || b.payment_expiry_date || 'N/A'}
                                          </td>
                                          <td className="px-6 py-4">
                                             <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                {t.admin_status_occupied || 'Occupied'}
                                             </span>
                                          </td>
                                          <td className="px-6 py-4">
                                             <div className="flex items-center gap-2">
                                                <button
                                                   onClick={() => setSelectedBooking(b)}
                                                   className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1"
                                                   title="View & Edit Booking Details"
                                                >
                                                   <IconEdit className="w-3 h-3" /> {t.admin_action_edit_booking || 'Edit Booking'}
                                                </button>
                                                <button
                                                   onClick={() => setSelectedBookingForExtend(b)}
                                                   className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-indigo-200/50 flex items-center gap-1"
                                                   title="Extend Stay"
                                                >
                                                   <IconCalendar className="w-3 h-3" /> {t.admin_action_extend_stay || 'Extend'}
                                                </button>
                                             </div>
                                          </td>
                                       </tr>
                                    );
                                 })
                              ) : (
                                 <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">
                                       No currently occupied residencies found matching filters.
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                   )}

                   {/* SUB-VIEW 3: DEDICATED UPCOMING RESERVATIONS TAB (Requirement 2) */}
                   {bookingSubView === 'reservations' && (
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                           <thead className="bg-gray-50 dark:bg-gray-900">
                              <tr>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Student Details</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Accommodation</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Room & Bed</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">{t.admin_arrival_date || 'Arrival Date'}</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">{t.admin_expected_expiry || 'Expected Expiry'}</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">{t.admin_duration || 'Duration'}</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">{t.admin_payment_status || 'Payment Status'}</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                              {filteredUpcomingReservations.length > 0 ? (
                                 filteredUpcomingReservations.map(b => {
                                    const liveDetails = getLiveStudentRoomDetails(b, rooms, accommodationAddresses, accommodationCategories, bedSpaces);
                                    const paymentInfo = getBookingPaymentStatus(b);
                                    return (
                                       <tr key={b.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-750 transition-colors">
                                          <td className="px-6 py-4">
                                             <div className="font-bold text-sm text-gray-900 dark:text-white">{b.full_name}</div>
                                             <div className="text-[11px] text-gray-500 font-mono">{b.email}</div>
                                             <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
                                               {b.phone_number && <span>📞 {b.phone_number}</span>}
                                               {b.nationality && <span>🌍 {b.nationality}</span>}
                                               <span className="font-mono font-bold text-blue-600">BK{b.id}</span>
                                             </div>
                                          </td>
                                          <td className="px-6 py-4">
                                             <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black uppercase bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                {liveDetails.category}
                                             </span>
                                          </td>
                                          <td className="px-6 py-4">
                                             <div className="font-bold text-xs text-gray-900 dark:text-white">{liveDetails.roomName}</div>
                                             <div className="text-[11px] text-gray-500">{liveDetails.bedSpaceName}</div>
                                          </td>
                                          <td className="px-6 py-4 font-mono text-xs font-bold text-blue-800 dark:text-blue-300">
                                             {b.start_date || b.expected_arrival_date || 'N/A'}
                                          </td>
                                          <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-300">
                                             {b.end_date || b.payment_expiry_date || 'N/A'}
                                          </td>
                                          <td className="px-6 py-4 text-xs font-bold text-gray-700 dark:text-gray-300">
                                             {formatBookingDuration(b)}
                                          </td>
                                          <td className="px-6 py-4">
                                             <div className="flex items-center gap-1.5">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                  paymentInfo.isPaid
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200'
                                                }`}>
                                                  {paymentInfo.isPaid ? '✓' : '•'} {paymentInfo.label}
                                                </span>
                                                {b.total_price && (
                                                  <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                                                    ${b.total_price}
                                                  </span>
                                                )}
                                             </div>
                                          </td>
                                          <td className="px-6 py-4">
                                             <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 shadow-2xs">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                {t.admin_status_reserved || 'Reserved'}
                                             </span>
                                          </td>
                                          <td className="px-6 py-4">
                                             <div className="flex items-center gap-2">
                                                <button
                                                   onClick={() => setSelectedBooking(b)}
                                                   className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1"
                                                   title="View & Edit Upcoming Reservation"
                                                >
                                                   <IconEdit className="w-3 h-3" /> {t.admin_action_edit_reservation || 'Edit'}
                                                </button>
                                                <button
                                                   onClick={() => handleCancelReservation(b.id)}
                                                   className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-1"
                                                   title="Cancel Future Reservation (Releases Bed Space)"
                                                >
                                                   <IconClose className="w-3 h-3" /> {t.admin_action_cancel_reservation || 'Cancel'}
                                                </button>
                                             </div>
                                          </td>
                                       </tr>
                                    );
                                 })
                              ) : (
                                 <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500 text-sm">
                                       No upcoming future reservations found matching filters.
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                   )}

                   {/* SUB-VIEW 4: DEDICATED PENDING BOOKINGS TAB (Requirement 3) */}
                   {bookingSubView === 'pending' && (
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                           <thead className="bg-gray-50 dark:bg-gray-900">
                              <tr>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Booking Ref</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Student Details</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Accommodation Requested</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Arrival & Stay</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Amount & Proof</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Current Status</th>
                                 <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Review & Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                              {filteredPendingBookings.length > 0 ? (
                                 filteredPendingBookings.map(b => {
                                    const liveDetails = getLiveStudentRoomDetails(b, rooms, accommodationAddresses, accommodationCategories, bedSpaces);
                                    const bStart = (b.start_date || b.expected_arrival_date || '').split('T')[0];
                                    const todayStr = new Date().toISOString().split('T')[0];
                                    const willBeReserved = Boolean(bStart && bStart > todayStr);

                                    return (
                                       <tr key={b.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-750 transition-colors">
                                          <td className="px-6 py-4 font-mono font-bold text-xs text-purple-700 dark:text-purple-400">
                                             BK{b.id}
                                          </td>
                                          <td className="px-6 py-4">
                                             <div className="font-bold text-sm text-gray-900 dark:text-white">{b.full_name}</div>
                                             <div className="text-[11px] text-gray-500 font-mono">{b.email}</div>
                                             <div className="text-[10px] text-gray-400 mt-0.5">
                                               {b.phone_number && <span>📞 {b.phone_number}</span>}
                                               {b.nationality && <span> • 🌍 {b.nationality}</span>}
                                             </div>
                                          </td>
                                          <td className="px-6 py-4">
                                             <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                                {liveDetails.category} - {liveDetails.roomName}
                                             </span>
                                             {liveDetails.bedSpaceName && (
                                               <div className="text-[10px] text-gray-500 mt-0.5 font-medium">{liveDetails.bedSpaceName}</div>
                                             )}
                                          </td>
                                          <td className="px-6 py-4">
                                             <div className="text-xs font-mono font-bold text-gray-900 dark:text-white">
                                               {bStart || 'Pending Arrival'}
                                             </div>
                                             <div className="text-[10px] text-gray-500 mt-0.5">
                                               {formatBookingDuration(b)}
                                             </div>
                                          </td>
                                          <td className="px-6 py-4">
                                             <div className="font-black text-xs text-gray-900 dark:text-white">
                                               ${b.total_price || 0}
                                             </div>
                                             {b.payment_proof_url ? (
                                               <a
                                                 href={b.payment_proof_url}
                                                 target="_blank"
                                                 rel="noreferrer"
                                                 className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600 hover:text-brand-700 mt-0.5 underline"
                                               >
                                                 <IconEye className="w-3 h-3" /> View Receipt
                                               </a>
                                             ) : (
                                               <span className="text-[10px] text-gray-400 italic">No proof uploaded</span>
                                             )}
                                          </td>
                                          <td className="px-6 py-4">
                                             <BookingStatusBadge status={b.status} startDate={b.start_date || b.expected_arrival_date} endDate={b.end_date || b.payment_expiry_date} />
                                          </td>
                                          <td className="px-6 py-4">
                                             <div className="flex items-center gap-2">
                                                <button
                                                   onClick={() => handleApprove(b.id)}
                                                   className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors flex items-center gap-1"
                                                   title={willBeReserved ? "Approve as Reserved (Future Arrival)" : "Approve as Occupied (Current Arrival)"}
                                                >
                                                   ✓ {t.admin_action_approve || 'Approve'} {willBeReserved ? '(Reserved)' : '(Occupied)'}
                                                </button>
                                                <button
                                                   onClick={() => handleReject(b.id)}
                                                   className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors flex items-center gap-1"
                                                   title="Reject Booking"
                                                >
                                                   ✕ {t.admin_action_reject || 'Reject'}
                                                </button>
                                                <button
                                                   onClick={() => setSelectedBooking(b)}
                                                   className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                                   title="View Full Booking Details"
                                                >
                                                   <IconEye className="w-4 h-4" />
                                                </button>
                                             </div>
                                          </td>
                                       </tr>
                                    );
                                 })
                              ) : (
                                 <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">
                                       No pending bookings awaiting verification. All reservations are up to date!
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                   )}
                </div>
             </div>
          )}

          {/* 4. STUDENTS TAB */}
          {activeSection === 'students' && (
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-5 border-b dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registered Unique Students</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Unique student profiles registered in the system with their assigned rooms and booking histories</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    {selectedBookingIds.length > 0 && (
                      <button
                        onClick={handleBulkDeleteStudents}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <IconTrash className="w-3.5 h-3.5" /> Delete Selected ({selectedBookingIds.length})
                      </button>
                    )}
                    <button 
                      onClick={exportToCSV}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
                    >
                      📥 Export CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Student Name</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Accommodation</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Room Name/Number</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Bed Space</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Booking Status</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Arrival Date</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Expiry Date</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {uniqueStudentRecords.map(({ student, activeBooking, liveDetails }) => {
                        return (
                          <tr key={student.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-750 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-gray-900 dark:text-white text-sm">{student.full_name}</div>
                              <div className="text-[11px] text-gray-500 font-mono">{student.email}</div>
                              {student.phone_number && <div className="text-[10px] text-gray-400">{student.phone_number}</div>}
                              {student.is_pending_activation && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 mt-1">
                                  Pending Activation
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                                {liveDetails?.category || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-gray-800 dark:text-gray-200">
                              {liveDetails?.roomName || 'Unassigned'}
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold text-brand-600 dark:text-brand-400">
                              {liveDetails?.bedSpaceName || 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              {activeBooking ? (
                                <BookingStatusBadge status={activeBooking.status} />
                              ) : (
                                <span className="text-xs text-gray-400 font-medium">No Active Booking</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-gray-700 dark:text-gray-300">
                              {activeBooking?.expected_arrival_date ? new Date(activeBooking.expected_arrival_date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-red-600 dark:text-red-400">
                              {activeBooking?.payment_expiry_date ? new Date(activeBooking.payment_expiry_date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2 items-center">
                                <button 
                                  onClick={() => {
                                    setSelectedStudentForDetails(student);
                                    setIsStudentDetailsModalOpen(true);
                                  }} 
                                  className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1"
                                >
                                  View / Edit
                                </button>

                                {activeBooking && (
                                  <button 
                                    onClick={() => setSelectedBookingForExtend(activeBooking)} 
                                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-indigo-200/50 flex items-center gap-1"
                                    title="Extend Stay for Current Room"
                                  >
                                    <IconCalendar className="w-3.5 h-3.5" /> Extend
                                  </button>
                                )}

                                {activeBooking && (
                                  <button 
                                    onClick={() => handleDeleteStudent(activeBooking.id, student.full_name)} 
                                    className="text-red-500 hover:text-red-700 text-xs font-bold p-1"
                                    title="Delete Student Booking"
                                  >
                                    <IconTrash className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
             </div>
          )}

          {/* 5. WAITLIST VIEW */}
          {activeSection === 'waitlist' && (
            <WaitlistView 
              rooms={rooms} 
              initialCategoryFilter={waitlistCategoryFilter}
              onClearCategoryFilter={() => setWaitlistCategoryFilter('All')}
            />
          )}

          {/* EMAIL DELIVERY LOGS & AUDIT */}
          {activeSection === 'email_logs' && (
            <EmailLogsView />
          )}

          {/* 6. MAINTENANCE TICKETS VIEW */}
          {activeSection === 'maintenance' && (
            <MaintenanceView rooms={rooms} bedSpaces={bedSpaces} />
          )}

          {/* 7. PAYMENTS & CREDITS LEDGER VIEW */}
          {activeSection === 'payments_credits' && (
            <PaymentsCreditsView
              bookings={bookings}
              adminUser={user}
              onAddActivity={addActivity}
            />
          )}

          {/* 8. TWO-WAY MESSAGING INBOX VIEW */}
          {activeSection === 'messages' && (
            <MessagesInboxView bookings={bookings} />
          )}

          {/* 9. REVIEWS & RATINGS VIEW */}
          {activeSection === 'reviews' && (
            <ReviewsRatingsView />
          )}

          {/* 10. ROOMS & INVENTORY DATABASE VIEW */}
          {activeSection === 'rooms_inventory' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b dark:border-gray-700 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Rooms & Bed Spaces Database</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {accommodationCategories && accommodationCategories.length > 0
                      ? `Sorted by Category (${accommodationCategories.map(c => c.name).join(' → ')}) and Room Number`
                      : 'Sorted by Category and Room Number'}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleSelectSection('apartment_media')}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
                    title="Manage apartment videos, photo galleries, and included perks"
                  >
                    <Video className="w-4 h-4" /> Apartment Media & Virtual Tours
                  </button>
                  <button
                    onClick={() => handleOpenRoomModal(null)}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all"
                  >
                    <IconPlus className="w-4 h-4" /> Add New Room
                  </button>
                </div>
              </div>

              {/* Category Filter Tabs & View Mode Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setInventoryCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      inventoryCategoryFilter === 'all'
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All Categories ({sortedInventoryRooms.length})
                  </button>
                  {(accommodationCategories || []).map(cat => {
                    const count = sortedInventoryRooms.filter(r => {
                      const roomCat = normalizeCategory(r.apartment_name, r.category, r.room_number, accommodationCategories);
                      return roomCat.toLowerCase() === cat.name.toLowerCase();
                    }).length;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setInventoryCategoryFilter(cat.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          inventoryCategoryFilter === cat.name
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          inventoryCategoryFilter === cat.name
                            ? 'bg-white/25 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-750 p-1 rounded-xl self-start sm:self-auto shrink-0 border border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setInventoryViewMode('grid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      inventoryViewMode === 'grid'
                        ? 'bg-white dark:bg-gray-850 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    }`}
                    title="Card Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Cards</span>
                  </button>
                  <button
                    onClick={() => setInventoryViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      inventoryViewMode === 'table'
                        ? 'bg-white dark:bg-gray-850 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    }`}
                    title="Table View"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Table</span>
                  </button>
                </div>
              </div>

              {filteredInventoryRooms.length === 0 ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold">No rooms found in category "{inventoryCategoryFilter}".</p>
                  <button
                    onClick={() => setInventoryCategoryFilter('all')}
                    className="mt-2 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    View all categories
                  </button>
                </div>
              ) : inventoryViewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredInventoryRooms.map(room => {
                    const roomBeds = (bedSpaces || []).filter(b => b.room_id === room.id);
                    const canonicalCat = normalizeCategory(
                      room.apartment_name, 
                      room.category, 
                      room.room_number, 
                      accommodationCategories
                    );
                    const formattedRoomTitle = getDisplayFromRoom(room, undefined, accommodationCategories);

                    const isRoomActive = room.status !== 'Inactive';

                    const isRoomAvailable = roomBeds.length > 0
                      ? roomBeds.some(b => {
                          const space = parsedRoomSpaces.find(s => s.bedSpaceId === b.id);
                          return space ? !space.isOccupied : true;
                        })
                      : ((room.occupied_slots || 0) < (room.capacity || 1));

                    const roomCategoryWaiting = (waitlist || []).filter(w => 
                      w.status === 'Waiting' && 
                      (w.category?.toLowerCase() === canonicalCat.toLowerCase() || 
                       (w.category && normalizeCategory(w.category, undefined, undefined, accommodationCategories).toLowerCase() === canonicalCat.toLowerCase()) ||
                       (w.room_id && w.room_id === room.id))
                    ).length;

                    return (
                      <div 
                        key={room.id} 
                        className={`border rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between ${
                          isRoomActive
                            ? 'bg-white dark:bg-gray-850 border-gray-200 dark:border-gray-750 hover:border-brand-500 shadow-sm'
                            : 'bg-gray-50/80 dark:bg-gray-900/50 border-dashed border-gray-300 dark:border-gray-700 opacity-90'
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                                  {canonicalCat}
                                </span>
                                <span 
                                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                    isRoomActive
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${isRoomActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                                  {isRoomActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1">{formattedRoomTitle}</h3>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${isRoomAvailable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800'}`}>
                              {isRoomAvailable ? 'Available' : 'Fully Booked'}
                            </span>
                          </div>

                          {/* Media Preview & Direct Action */}
                          <div className="flex items-center justify-between gap-2.5 p-2.5 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/40">
                            <div 
                              onClick={() => handleOpenRoomMediaModal(room)}
                              className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                            >
                              {room.image_urls && room.image_urls.length > 0 ? (
                                <div className="relative w-12 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700 bg-gray-200 shadow-2xs group-hover:opacity-90">
                                  <img src={room.image_urls[0]} alt={room.room_number} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="w-12 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-purple-400 shrink-0 border border-dashed border-purple-200 dark:border-purple-800 group-hover:border-purple-400">
                                  <ImageIconLucide className="w-4 h-4 text-purple-400" />
                                </div>
                              )}
                              <div className="text-[11px] leading-tight min-w-0">
                                <div className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 truncate">
                                  <span>{room.image_urls?.length || 0} Photos</span>
                                  {room.video_urls && room.video_urls.length > 0 && (
                                    <span className="text-[9px] bg-purple-200/80 text-purple-800 dark:bg-purple-900/80 dark:text-purple-300 px-1.5 py-0.2 rounded-full font-black flex items-center gap-0.5">
                                      <Video className="w-2.5 h-2.5" /> Video Tour
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate group-hover:text-purple-600 dark:group-hover:text-purple-300">
                                  {room.video_urls && room.video_urls.length > 0 ? 'Virtual tour attached' : 'No video tour yet'}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenRoomMediaModal(room)}
                              className="shrink-0 px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95"
                              title="Manage room photos and virtual tour video"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Media</span>
                            </button>
                          </div>

                          {!isRoomActive && (
                            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl px-3 py-1.5 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                              <span>⚠️</span>
                              <span>Hidden from student listings & booking flow</span>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                            <div><span className="font-bold text-gray-400">Unit Code:</span> <span className="font-mono text-[11px] font-semibold">{room.room_number}</span></div>
                            <div><span className="font-bold text-gray-400">Type:</span> {room.type}</div>
                            <div><span className="font-bold text-gray-400">Bed Capacity:</span> {room.capacity}</div>
                            <div><span className="font-bold text-gray-400">Price/Mo:</span> ${getRoomPrice(room, 2, roomPricing)}</div>
                            <div><span className="font-bold text-gray-400">Gender:</span> {room.gender_restriction}</div>
                            <div>
                              <span className="font-bold text-gray-400">Status:</span>{' '}
                              <span className={`font-semibold ${isRoomActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {room.status || 'Active'}
                              </span>
                            </div>
                            <div className="col-span-2 pt-1 border-t border-gray-200/50 dark:border-gray-750">
                              <span className="font-bold text-gray-400">Bed Spaces:</span>{' '}
                              {roomBeds.length > 0 ? (
                                <span className="font-semibold text-brand-600 dark:text-brand-400">
                                  {roomBeds.map(b => b.label).join(', ')}
                                </span>
                              ) : (
                                <span className="text-gray-500 italic">
                                  {room.type?.toLowerCase().includes('private') ? 'Single' : `${room.capacity || 2} Beds`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Bottom: Two dedicated, uncluttered rows */}
                        <div className="pt-3 border-t dark:border-gray-700 space-y-2.5">
                          {/* Row 1: Waitlist on left, Activate/Deactivate Toggle on right */}
                          <div className="flex items-center justify-between text-xs">
                            <button
                              onClick={() => {
                                setWaitlistCategoryFilter(canonicalCat);
                                handleSelectSection('waitlist');
                              }}
                              className="text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 text-xs font-bold hover:underline flex items-center gap-1.5"
                              title={`View waitlist for ${canonicalCat}`}
                            >
                              <span>⏳</span> Waitlist
                              {roomCategoryWaiting > 0 ? (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-black">
                                  {roomCategoryWaiting}
                                </span>
                              ) : (
                                <span className="text-gray-400 font-normal text-[11px]">(0)</span>
                              )}
                            </button>

                            <button
                              onClick={() => handleToggleRoomStatus(room.id, isRoomActive ? 'Inactive' : 'Active')}
                              disabled={togglingRoomId === room.id}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                                isRoomActive
                                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              }`}
                              title={isRoomActive ? "Deactivate room to hide it from student listings and booking" : "Activate room to make it bookable for students"}
                            >
                              {togglingRoomId === room.id ? (
                                <span className="animate-spin text-xs">⌛</span>
                              ) : isRoomActive ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  <span>Deactivate</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>Activate</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Row 2: High-Visibility Action Buttons: Edit and Delete */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleOpenRoomModal(room)}
                              className="w-full bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:hover:bg-brand-900/50 dark:text-brand-300 border border-brand-200 dark:border-brand-800 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                            >
                              <IconEdit className="w-3.5 h-3.5" />
                              <span>Edit Room</span>
                            </button>

                            <button
                              onClick={() => handleDeleteRoom(room.id, room.room_number)}
                              className="w-full bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 dark:bg-red-950/50 dark:hover:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-800 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                              title={`Delete Room ${room.room_number}`}
                            >
                              <IconTrash className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                              <span>Delete Room</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Structured Table View */
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-850 shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Unit & Title</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Type & Capacity</th>
                        <th className="py-3 px-4">Price / Mo</th>
                        <th className="py-3 px-4">Status & Vacancy</th>
                        <th className="py-3 px-4">Media</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-750">
                      {filteredInventoryRooms.map(room => {
                        const roomBeds = (bedSpaces || []).filter(b => b.room_id === room.id);
                        const canonicalCat = normalizeCategory(
                          room.apartment_name, 
                          room.category, 
                          room.room_number, 
                          accommodationCategories
                        );
                        const formattedRoomTitle = getDisplayFromRoom(room, undefined, accommodationCategories);
                        const isRoomActive = room.status !== 'Inactive';
                        const isRoomAvailable = roomBeds.length > 0
                          ? roomBeds.some(b => {
                              const space = parsedRoomSpaces.find(s => s.bedSpaceId === b.id);
                              return space ? !space.isOccupied : true;
                            })
                          : ((room.occupied_slots || 0) < (room.capacity || 1));

                        return (
                          <tr key={room.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-medium">
                              <div className="font-bold text-gray-900 dark:text-white text-sm">{formattedRoomTitle}</div>
                              <div className="text-[11px] font-mono text-gray-400">Unit: {room.room_number}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                                {canonicalCat}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="text-gray-900 dark:text-white font-semibold">{room.type}</div>
                              <div className="text-[11px] text-gray-500">Cap: {room.capacity} beds • {room.gender_restriction}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-gray-900 dark:text-white">${getRoomPrice(room, 2, roomPricing)}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isRoomAvailable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800'}`}>
                                  {isRoomAvailable ? 'Available' : 'Booked'}
                                </span>
                                <button
                                  onClick={() => handleToggleRoomStatus(room.id, isRoomActive ? 'Inactive' : 'Active')}
                                  disabled={togglingRoomId === room.id}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                                    isRoomActive
                                      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                  }`}
                                  title={isRoomActive ? "Deactivate room" : "Activate room"}
                                >
                                  {isRoomActive ? 'Active' : 'Inactive'}
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <button
                                onClick={() => handleOpenRoomMediaModal(room)}
                                className="bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                                title="Manage photos and virtual tour"
                              >
                                <Video className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                <span>{room.image_urls?.length || 0} Photos</span>
                                {room.video_urls && room.video_urls.length > 0 && <span className="text-[10px]">📹</span>}
                              </button>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-2 justify-end">
                                <button
                                  onClick={() => handleOpenRoomModal(room)}
                                  className="py-1.5 px-2.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-bold inline-flex items-center gap-1 transition-colors"
                                  title="Edit Room Details"
                                >
                                  <IconEdit className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteRoom(room.id, room.room_number)}
                                  className="py-1.5 px-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-extrabold inline-flex items-center gap-1 transition-colors"
                                  title={`Delete Room ${room.room_number}`}
                                >
                                  <IconTrash className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}

          {/* ROOM PRICING MATRIX VIEW */}
          {activeSection === 'room_pricing' && (
            <RoomPricingView />
          )}

          {/* APARTMENT MEDIA & VIRTUAL TOURS VIEW */}
          {activeSection === 'apartment_media' && (
            <ApartmentMediaManager
              onOpenManageCategories={() => setIsManageCategoryModalOpen(true)}
            />
          )}

          {/* 11. LANDING & BRANDING CMS VIEW */}
          {activeSection === 'landing_branding' && (
            <div className="space-y-8">
              {/* Landing Page Content Editor */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 space-y-6">
                <div className="flex items-center mb-6"><IconEdit className="w-6 h-6 text-brand-600 mr-2" /><h2 className="text-xl font-bold">Landing Page Content (English)</h2></div>
                <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="block text-sm font-bold mb-1">Logo</label>
                         <div className="flex items-center gap-4">
                            <img src={cmsContent.logoUrl} alt="Logo" className="h-12 w-auto object-contain bg-gray-100 rounded p-1" />
                            <label className="cursor-pointer bg-brand-50 text-brand-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-brand-100 flex items-center gap-2">
                               <IconUpload className="w-4 h-4" />
                               {isUploadingCms ? 'Uploading...' : 'Change Logo'}
                               <input type="file" className="hidden" onChange={(e) => handleCmsFileUpload(e, 'logoUrl')} accept="image/*" disabled={isUploadingCms} />
                            </label>
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="block text-sm font-bold mb-1">Hero Image</label>
                         <div className="flex items-center gap-4">
                            <img src={cmsContent.heroImageUrl} alt="Hero" className="h-12 w-20 object-cover bg-gray-100 rounded" />
                            <label className="cursor-pointer bg-brand-50 text-brand-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-brand-100 flex items-center gap-2">
                               <IconUpload className="w-4 h-4" />
                               {isUploadingCms ? 'Uploading...' : 'Change Hero Image'}
                               <input type="file" className="hidden" onChange={(e) => handleCmsFileUpload(e, 'heroImageUrl')} accept="image/*" disabled={isUploadingCms} />
                            </label>
                         </div>
                      </div>
                   </div>
                   <div><label className="block text-sm font-bold mb-1">Hero Title (EN)</label><input type="text" value={cmsContent.hero.en?.title} onChange={(e) => updateCmsContent({ hero: { ...cmsContent.hero, en: { ...cmsContent.hero.en!, title: e.target.value } } })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
                   <div><label className="block text-sm font-bold mb-1">Hero Subtitle (EN)</label><textarea value={cmsContent.hero.en?.subtitle} onChange={(e) => updateCmsContent({ hero: { ...cmsContent.hero, en: { ...cmsContent.hero.en!, subtitle: e.target.value } } })} className="w-full p-2 border rounded-lg h-24 dark:bg-gray-700 dark:border-gray-600" /></div>
                </div>
              </div>

              {/* Accommodation Media & Category Perks */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <ApartmentMediaManager 
                  onOpenManageCategories={() => setIsManageCategoryModalOpen(true)}
                />
              </div>
            </div>
          )}

          {/* 12. CONTRACT TEMPLATES & LEGAL REVIEW VIEW */}
          {activeSection === 'contracts' && (
            <ContractTranslationsReviewView />
          )}

          {/* 12B. STUDENT DOCUMENTS MANAGEMENT VIEW */}
          {activeSection === 'student_documents' && (
            <ManageStudentDocumentsView />
          )}

          {/* 13. FAQS & ANNOUNCEMENTS VIEW */}
          {activeSection === 'faqs_announcements' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                  <h2 className="text-xl font-bold mb-6">Manage Announcements ({language.toUpperCase()})</h2>
                  <div className="space-y-6">
                      {(cmsContent.announcements?.[language] || []).map((ann, index) => (
                          <div key={ann.id} className="p-4 border rounded-lg dark:border-gray-700 space-y-3 relative">
                              <button onClick={() => handleRemoveAnnouncement(ann.id)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><IconTrash className="w-4 h-4" /></button>
                              <div>
                                  <label className="text-xs font-bold">Title</label>
                                  <input type="text" value={ann.title} onChange={(e) => handleAnnouncementChange(index, 'title', e.target.value)} className="w-full p-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                              </div>
                              <div>
                                  <label className="text-xs font-bold">Content</label>
                                  <textarea value={ann.content} onChange={(e) => handleAnnouncementChange(index, 'content', e.target.value)} rows={3} className="w-full p-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                              </div>
                              <p className="text-[10px] text-gray-400 italic">Posted on: {new Date(ann.date).toLocaleString()}</p>
                          </div>
                      ))}
                      <button onClick={handleAddAnnouncement} className="w-full flex items-center justify-center gap-2 border-2 border-dashed p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 dark:border-gray-600">
                          <IconPlus className="w-5 h-5" /> Add Announcement
                      </button>
                  </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                  <h2 className="text-xl font-bold mb-6">Manage FAQs ({language.toUpperCase()})</h2>
                  <div className="space-y-6">
                      {(cmsContent.faqs.en || []).map((faq, index) => (
                          <div key={faq.id} className="p-4 border rounded-lg dark:border-gray-700 space-y-3 relative">
                              <button onClick={() => handleRemoveFaq(faq.id)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><IconTrash className="w-4 h-4" /></button>
                              <div>
                                  <label className="text-xs font-bold">Question</label>
                                  <input type="text" value={faq.q} onChange={(e) => handleFaqChange(index, 'q', e.target.value)} className="w-full p-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                              </div>
                              <div>
                                  <label className="text-xs font-bold">Answer</label>
                                  <textarea value={faq.a} onChange={(e) => handleFaqChange(index, 'a', e.target.value)} rows={3} className="w-full p-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                              </div>
                          </div>
                      ))}
                      <button onClick={handleAddFaq} className="w-full flex items-center justify-center gap-2 border-2 border-dashed p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 dark:border-gray-600">
                          <IconPlus className="w-5 h-5" /> Add FAQ
                      </button>
                  </div>
              </div>
            </div>
          )}

          {/* 14. ADMIN USERS TAB */}
          {activeSection === 'admin_users' && (
            user?.role !== 'proprietor' ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 shadow-md text-center max-w-lg mx-auto my-12 animate-fade-in">
                <span className="text-4xl mb-3 block">🔒</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Admin Users Access Restricted</h3>
                <p className="text-xs text-gray-500 mt-2">
                  Administrative user accounts and permission role assignments can only be managed by system Proprietors.
                </p>
                <button
                  onClick={() => handleSelectSection(resolveSafeSection(user, null))}
                  className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-colors shadow-sm"
                >
                  Return to Permitted Section →
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-5 border-b dark:border-gray-700 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Users Management</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Manage administrative accounts, staff members, and configure section-level permissions</p>
                  </div>
                  <button 
                    onClick={() => handleOpenUserModal(null)}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <IconPlus className="w-4 h-4" /> Add Admin User
                  </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Role & Access Scope</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Gender Scope</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 dark:text-white">{u.full_name} {u.id === user?.id && <span className="ml-2 text-[10px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded font-bold">You</span>}</div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                                        {u.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${u.role === 'proprietor' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {u.role === 'proprietor' ? 'Proprietor (Full Access)' : 'Staff (Limited Admin)'}
                                        </span>
                                        {u.role === 'staff' && (
                                          <div className="mt-1 text-[11px] text-gray-500 font-medium">
                                            {Array.isArray(u.allowed_sections) && u.allowed_sections.length > 0 
                                              ? `${u.allowed_sections.length} sections allowed: ${u.allowed_sections.slice(0, 3).join(', ')}${u.allowed_sections.length > 3 ? '...' : ''}`
                                              : 'Default: Bookings, Students, Transactions, Messages'}
                                          </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-gray-700 dark:text-gray-300">{u.gender || 'Any'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-3">
                                            <button 
                                              onClick={() => handleOpenUserModal(u)}
                                              className="text-brand-600 hover:text-brand-700 text-xs font-bold underline"
                                            >
                                                Edit Permissions
                                            </button>
                                            {u.id !== user?.id && (
                                              <button 
                                                onClick={() => handleDeleteUser(u.id)}
                                                className="text-red-500 hover:text-red-700"
                                                title="Delete user"
                                              >
                                                  <IconTrash className="w-4 h-4" />
                                              </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </div>
            )
          )}

          {/* 15. RESIDENCY & SYSTEM SETTINGS VIEW */}
          {activeSection === 'settings' && (
            <AdminSettingsView />
          )}
            </>
          )}
        </main>
      </div>

      {/* Activity Slide-Over Notification Drawer */}
      <AdminActivityDrawer
        isOpen={isActivityDrawerOpen}
        onClose={() => setIsActivityDrawerOpen(false)}
        activities={activities || []}
        bookings={bookings || []}
        waitlist={waitlist || []}
        onNavigateSection={(section) => handleSelectSection(section)}
      />

      {/* MODALS */}
      {viewingAgreement && (
        <AgreementModal 
          booking={viewingAgreement}
          onClose={() => setViewingAgreement(null)}
          isReadOnly={true}
        />
      )}

      {/* Admin Create Booking Modal */}
      {isAdminBookingModalOpen && (
        <AdminCreateBookingModal 
          isOpen={isAdminBookingModalOpen}
          onClose={() => setIsAdminBookingModalOpen(false)}
          onSuccess={() => {
            setIsAdminBookingModalOpen(false);
            addActivity({
              user_id: user?.id || 'admin',
              type: 'system',
              description: 'Created a new admin-initiated room booking',
              timestamp: new Date().toISOString()
            });
          }}
        />
      )}

      {/* Student Details Modal */}
      {isStudentDetailsModalOpen && selectedStudentForDetails && (
        <StudentDetailsModal
          isOpen={isStudentDetailsModalOpen}
          onClose={() => {
            setIsStudentDetailsModalOpen(false);
            setSelectedStudentForDetails(null);
          }}
          student={selectedStudentForDetails}
          onStudentUpdated={(updatedStudent) => {
            setSelectedStudentForDetails(updatedStudent);
          }}
        />
      )}

      {/* Comprehensive Edit Booking Modal (Approve, Reject, Manual Edit, Evict-Discontinue) */}
      {selectedBooking && (
        <EditBookingModal
          booking={selectedBooking}
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}

      {/* Direct Extend Stay Modal for Students & Rooms */}
      {selectedBookingForExtend && (
        <ExtendStayModal
          booking={selectedBookingForExtend}
          isOpen={!!selectedBookingForExtend}
          onClose={() => setSelectedBookingForExtend(null)}
        />
      )}

      {isRoomModalOpen && (
        <RoomEditorModal room={selectedRoomForEdit} onClose={() => setIsRoomModalOpen(false)} onSave={handleSaveRoom} />
      )}

      {/* Quick Room Media (Photos & Video Tour) Modal */}
      {isRoomMediaModalOpen && selectedRoomForMedia && (
        <RoomMediaModal
          room={selectedRoomForMedia}
          onClose={() => {
            setIsRoomMediaModalOpen(false);
            setSelectedRoomForMedia(null);
          }}
          onSave={async (updatedRoom) => {
            await handleSaveRoom(updatedRoom);
          }}
        />
      )}

      {/* Manage Accommodation Categories Modal */}
      {isManageCategoryModalOpen && (
        <ManageCategoryModal
          isOpen={isManageCategoryModalOpen}
          onClose={() => setIsManageCategoryModalOpen(false)}
        />
      )}

      {isUserModalOpen && (
        <UserEditorModal user={selectedUserForEdit} onClose={() => setIsUserModalOpen(false)} onSave={handleSaveUser} />
      )}

      {/* Visual Toast Notification for Admin Actions */}
      {adminToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm font-bold backdrop-blur-md ${
            adminToast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/80 shadow-emerald-900/30'
              : adminToast.type === 'error'
              ? 'bg-red-950/90 text-red-200 border-red-700/80 shadow-red-900/30'
              : 'bg-gray-900/90 text-white border-gray-700 shadow-black/40'
          }`}>
            <span className="text-xl">
              {adminToast.type === 'success' ? '✅' : adminToast.type === 'error' ? '⚠️' : 'ℹ️'}
            </span>
            <span>{adminToast.message}</span>
            <button
              onClick={() => setAdminToast(null)}
              className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors text-xs opacity-75 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
