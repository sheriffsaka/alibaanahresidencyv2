
export type Language = 'en' | 'ar' | 'ru' | 'fr' | 'uz' | 'zh';

export type Page = 'home' | 'booking' | 'dashboard' | 'auth' | 'support' | 'my-bookings' | 'documents' | 'messages' | 'notifications' | 'profile' | 'billing';

export enum AccommodationType {
  STANDARD_SHARED = 'Standard Shared',
  STANDARD_PRIVATE = 'Standard Private',
  PREMIUM_SHARED = 'Premium Shared',
  PREMIUM_PRIVATE = 'Premium Private',
}

export type RoomStatus = 'Active' | 'Inactive';

export interface Room {
  id: number;
  property_id: string;
  room_number: string;
  type: AccommodationType;
  apartment_name: string;
  category: 'Standard' | 'Premium';
  price_per_month: number;
  capacity: number;
  occupied_slots: number;
  amenities: string[];
  image_urls: string[];
  video_urls?: string[];
  is_available: boolean;
  status?: 'Active' | 'Inactive';
  created_at: string;
  gender_restriction: 'Male' | 'Female' | 'Any';
  next_available_date?: string;
}

export interface BedSpace {
  id: number;
  room_id: number;
  label: string;
  created_at?: string;
}

export interface PublicOccupancy {
  room_id: number;
  bed_space_id: number | null;
  is_held: boolean;
  end_date: string | null;
  preferred_accommodation?: string | null;
}

export enum BookingStatus {
  RESERVED = 'Reserved',
  PENDING_PAYMENT = 'Pending Payment',
  PENDING_CONTRACT = 'Pending Contract',
  CONFIRMED = 'Confirmed',
  OCCUPIED = 'Occupied',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  MAINTENANCE = 'Maintenance',
  PENDING_VERIFICATION = 'Pending Verification'
}

// PaymentMethod enum removed as payment is now handled upon arrival.

export interface Booking {
  id: number;
  student_id?: string;
  room_id: number;
  bed_space_id?: number | null;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  booked_at?: string;

  // New detailed student information
  full_name: string; // As in passport
  nationality: string;
  passport_number: string;
  passport_copy_url?: string;
  email: string;
  phone_number: string; // WhatsApp active
  expected_arrival_date?: string;
  duration_of_stay: string; // e.g., "6 months", "1 year"
  preferred_accommodation?: AccommodationType | string;
  emergency_contact_details?: string;
  emergency_contact?: string;
  
  // Home Address
  building_no?: string;
  flat_no?: string;
  street_name?: string;
  district_name?: string;
  state?: string;
  address_in_egypt?: string;

  // Signature and Contract fields
  contract_signed_at?: string;
  signature_data?: string; // Base64 signature image or SVG path
  contract_language?: 'en' | 'fr' | 'ru';

  // Deprecated/optional fields for backward compatibility
  student_name?: string;
  user_id?: string;
  gender?: 'Male' | 'Female' | 'Any';
  academic_term_id?: number;
  academic_term?: string;
  package_months?: number;
  booking_package_id?: number;
  total_price?: number;
  payment_proof_url?: string;
  payment_proof_uploaded_at?: string;
  transfer_proof_url?: string;
  payment_expiry_date?: string;
  parent_booking_id?: number;
  is_extended?: boolean;
  previous_booking_id?: number;
  payment_method?: 'Online' | 'Bank Transfer' | 'bank_transfer';
  checked_in_at?: string;
  checked_out_at?: string;
  rooms?: Pick<Room, 'room_number' | 'type' | 'apartment_name' | 'category'>;
}

export type WaitlistStatus = 'Waiting' | 'Offered' | 'Fulfilled' | 'Cancelled';

export interface EmailLogEntry {
  id: number;
  recipient: string;
  subject: string;
  template_name?: string | null;
  status: 'sent' | 'failed' | 'simulated';
  error_message?: string | null;
  delivery_attempts: number;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface WaitlistEntry {
  id: number;
  student_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  category: 'Standard' | 'Premium 1' | 'Premium 2';
  accommodation_type: 'Shared' | 'Private';
  room_id?: number | null;
  bed_space_id?: number | null;
  duration_months?: number | null;
  status: WaitlistStatus;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  // Joined profile data if student_id is present
  profiles?: {
    full_name?: string;
    phone_number?: string;
    nationality?: string;
  };
}

export interface Activity {
  id: number;
  user_id: string;
  type: 'booking' | 'payment' | 'system' | 'auth' | 'contract';
  description: string;
  timestamp: string;
}

export type UserRole = 'student' | 'staff' | 'proprietor';

export interface User {
  id: string;
  email?: string;
  full_name?: string;
  role: UserRole;
  gender?: 'Male' | 'Female';
  phone_number?: string;
  nationality?: string;
  passport_number?: string;
  created_at?: string;
}

export interface MessageItem {
  id: number;
  conversation_id: string;
  sender_id: string;
  sender_role: 'student' | 'staff' | 'proprietor' | 'admin';
  recipient_id?: string | null;
  channel?: string;
  message: string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  sender_name?: string;
  sender_profile?: {
    full_name?: string;
    role?: string;
  };
}

export interface ConversationItem {
  id: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
  subject?: string;
  channel?: string;
  status: 'active' | 'archived' | 'closed';
  last_message_preview?: string | null;
  last_message_at?: string;
  created_at: string;
  updated_at?: string;
  student?: {
    id: string;
    full_name?: string;
    email?: string;
    phone_number?: string;
    nationality?: string;
  };
  messages?: MessageItem[];
  unread_count?: number;
  admin_unread_count?: number;
}

export interface AccommodationCategory {
  id: string;
  name: string; // e.g. "Premium 1", "Premium 2", "Premium 3", "Standard", "Standard 2"
  description?: string;
  address?: string;
  defaultPrice?: number;
  status: 'Active' | 'Inactive';
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_ACCOMMODATION_CATEGORIES: AccommodationCategory[] = [
  {
    id: 'premium-1',
    name: 'Premium 1',
    description: 'Luxury student suites with premium furnishings and study areas.',
    address: '11, Samir Moursey Street, Nasr City, Cairo.',
    defaultPrice: 350,
    status: 'Active',
    created_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'premium-2',
    name: 'Premium 2',
    description: 'High-end shared and private suites with modern kitchen and resident lounge.',
    address: '2 Ezzat Salamat Street, Off Kaabool, Makram Ebeid, Nasr City, Cairo.',
    defaultPrice: 350,
    status: 'Active',
    created_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Comfortable, budget-friendly student housing near the Arabic center.',
    address: '24 Saqaliyyah Street, Off Kaabool, Makram Ebeid, Nasr City, Cairo.',
    defaultPrice: 175,
    status: 'Active',
    created_at: '2026-01-01T00:00:00.000Z'
  }
];

export interface AccommodationAddresses {
  [key: string]: string;
}

export const DEFAULT_ACCOMMODATION_ADDRESSES: AccommodationAddresses = {
  'Premium 1': '11, Samir Moursey Street, Nasr City, Cairo.',
  'Premium 2': '2 Ezzat Salamat Street, Off Kaabool, Makram Ebeid, Nasr City, Cairo.',
  'Standard': '24 Saqaliyyah Street, Off Kaabool, Makram Ebeid, Nasr City, Cairo.',
};

export interface LandlordDetails {
  recipientName: string;
  bankName: string;
  iban: string;
  swiftCode: string;
  phone: string;
  street: string;
  city: string;
  country: string;
  poBox: string;
  remitlyIban: string;
  remitlyBankName: string;
  remitlyLocation: string;
  adminEmail: string;
}

export interface CategoryMediaItem {
  videoUrl: string;
  images: string[];
  features: string[];
}

export type CategoryMediaConfig = Record<string, CategoryMediaItem>;

export const DEFAULT_CATEGORY_MEDIA: CategoryMediaConfig = {
  'Premium 1': {
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    images: [
      'https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/Suite2_q62y4w.jpg',
      'https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/Suite1_t4dczv.jpg'
    ],
    features: ['High-speed student Wi-Fi', 'In-room Air Conditioning', 'En-suite Luxury Bathroom option', 'Private Room option', 'Cozy premium furniture layout', 'Access to Elite Study common areas']
  },
  'Premium 2': {
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    images: [
      'https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/Suite2_q62y4w.jpg',
      'https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/Suite1_t4dczv.jpg'
    ],
    features: ['Premium Suite features', 'Modern kitchen accessibility', 'Spacious study areas', 'In-room high capacity AC', 'Dedicated Resident Lounge Area', 'Weekly student helper laundry cleaning']
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

export interface SupportPageContent {
  title?: string;
  subtitle?: string;
  contactEmail?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  officeHours?: string;
  locationAddress?: string;
  faqDescription?: string;
}

export const DEFAULT_SUPPORT_CONTENT: SupportPageContent = {
  title: 'Al-Ibaanah Student Support & Help Desk',
  subtitle: 'We are here to assist with your student residency, inquiries, tenancy agreements, and stay in Cairo.',
  contactEmail: 'al.ibaanah.housing4brothers@gmail.com',
  contactPhone: '+20 1030072440',
  whatsappNumber: '+20 1030072440',
  officeHours: 'Sunday – Thursday: 9:00 AM – 6:00 PM (Cairo Time)',
  locationAddress: 'Nasr City, Cairo, Egypt',
  faqDescription: 'Have questions about reservations, security deposits, contracts, or amenities? Check our comprehensive knowledge base.'
};

export interface CmsContent {
  logoUrl: string;
  hero: {
    [key in Language]?: {
      title: string;
      subtitle: string;
    }
  };
  heroImageUrl: string;
  features: {
    [key in Language]?: {
      id: number;
      title: string;
      desc: string;
    }[];
  };
  faqs: {
    [key in Language]?: {
      id: number;
      q: string;
      a: string;
    }[];
  };
  contractTemplates: {
    [roomType in AccommodationType]?: {
      [lang in Language]?: string;
    }
  };
  howToVideos?: {
    [key in Language]?: string;
  };
  announcements?: {
    [key in Language]?: {
      id: number;
      title: string;
      content: string;
      date: string;
    }[];
  };
  landlordDetails?: LandlordDetails;
  categoryMedia?: CategoryMediaConfig;
  accommodationAddresses?: AccommodationAddresses;
  accommodationCategories?: AccommodationCategory[];
  supportContent?: SupportPageContent;
}

export interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  page: Page;
  setPage: (page: Page, room?: Room, extendingBooking?: Booking) => void;
  user: User | null;
  selectedRoom: Room | null;
  extendingBooking: Booking | null;
  session: any;
  loading: boolean;
  logout: () => Promise<void>;
  bookings: Booking[];
  publicOccupancy: PublicOccupancy[];
  effectiveOccupancyBookings: any[];
  accommodationAddresses: AccommodationAddresses;
  accommodationCategories: AccommodationCategory[];
  addAccommodationCategory: (category: Omit<AccommodationCategory, 'id' | 'created_at'> | string) => Promise<{ success: boolean; error?: string; category?: AccommodationCategory }>;
  updateAccommodationCategory: (id: string, updates: Partial<AccommodationCategory>) => Promise<{ success: boolean; error?: string }>;
  deleteAccommodationCategory: (id: string) => Promise<{ success: boolean; error?: string }>;
  refreshAccommodationCategories: () => Promise<AccommodationCategory[]>;
  addBooking: (booking: any) => Promise<{ success: boolean; error?: string; data?: Booking }>;
  updateBookingStatus: (id: number, status: BookingStatus) => Promise<{ success: boolean; error?: string }>;
  updateBooking: (id: number, updates: Partial<Booking>) => Promise<{ success: boolean; error?: string }>;
  deleteBooking: (id: number) => Promise<{ success: boolean; error?: string }>;
  cmsContent: CmsContent;
  updateCmsContent: (content: Partial<CmsContent>) => Promise<{ success: boolean; error?: string }>;
  rooms: Room[];
  bedSpaces: BedSpace[];
  addRoom: (room: Room) => Promise<{ success: boolean; error?: string }>;
  updateRoom: (room: Room) => Promise<{ success: boolean; error?: string }>;
  toggleRoomStatus: (roomId: number, status: RoomStatus) => Promise<{ success: boolean; error?: string }>;
  deleteRoom: (id: number) => Promise<{ success: boolean; error?: string }>;
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  students: User[];
  users: User[];
  addUser: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  updateUser: (id: string, updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  updateStudentProfile: (studentId: string, updates: {
    full_name?: string;
    email?: string;
    phone_number?: string;
    gender?: 'Male' | 'Female';
    nationality?: string;
    passport_number?: string;
    emergency_contact?: string;
    emergency_contact_details?: string;
    address_in_egypt?: string;
    building_no?: string;
    flat_no?: string;
    street_name?: string;
    district_name?: string;
    state?: string;
  }) => Promise<{ success: boolean; error?: string; updatedStudent?: User }>;
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  academicTerms: AcademicTerm[];
  bookingPackages: BookingPackage[];
  landlordDetails: LandlordDetails;
  waitlist: WaitlistEntry[];
  addToWaitlist: (entry: Omit<WaitlistEntry, 'id' | 'created_at' | 'status'> & { status?: WaitlistStatus }) => Promise<{ success: boolean; error?: string; data?: WaitlistEntry }>;
  updateWaitlistStatus: (id: number, status: WaitlistStatus) => Promise<{ success: boolean; error?: string }>;
  updateWaitlistEntry: (id: number, updates: Partial<WaitlistEntry>) => Promise<{ success: boolean; error?: string }>;
  refreshWaitlist: () => Promise<void>;
  emailLogs: EmailLogEntry[];
  refreshEmailLogs: () => Promise<void>;
  retryEmailLog: (logId: number) => Promise<{ success: boolean; error?: string }>;
  conversations: ConversationItem[];
  unreadMessagesCount: number;
  refreshConversations: () => Promise<ConversationItem[]>;
  fetchConversationMessages: (conversationId: string) => Promise<MessageItem[]>;
  sendMessage: (params: {
    conversationId?: string;
    studentId?: string;
    message: string;
    channel?: string;
    subject?: string;
    recipientId?: string;
  }) => Promise<{ success: boolean; error?: string; message?: MessageItem; conversation?: ConversationItem }>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AcademicTerm {
    id: number;
    term_name: string;
    start_date: string;
    end_date: string;
}

export interface BookingPackage {
    id: number;
    duration_months: number;
    discount_percentage: number;
    description?: string;
}