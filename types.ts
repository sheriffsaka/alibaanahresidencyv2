
export type Language = 'en' | 'ar' | 'ru' | 'fr' | 'uz' | 'zh';

export type Page = 'home' | 'booking' | 'dashboard' | 'auth' | 'support';

export enum AccommodationType {
  STANDARD_SHARED = 'Standard Shared',
  STANDARD_PRIVATE = 'Standard Private',
  PREMIUM_SHARED = 'Premium Shared',
  PREMIUM_PRIVATE = 'Premium Private',
}

export interface Room {
  id: number;
  property_id: string;
  room_number: string;
  type: AccommodationType;
  price_per_month: number;
  capacity: number;
  occupied_slots: number;
  amenities: string[];
  image_urls: string[];
  video_urls?: string[];
  is_available: boolean;
  created_at: string;
  gender_restriction: 'Male' | 'Female' | 'Any';
}

export enum BookingStatus {
  RESERVED = 'Reserved',
  PENDING_PAYMENT = 'Pending Payment',
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
  student_id: string;
  room_id: number;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  booked_at: string;

  // New detailed student information
  full_name: string; // As in passport
  nationality: string;
  passport_number: string;
  passport_copy_url: string;
  email: string;
  phone_number: string; // WhatsApp active
  expected_arrival_date: string;
  duration_of_stay: string; // e.g., "6 months", "1 year"
  preferred_accommodation: AccommodationType;
  emergency_contact_details: string;
  
  // Detailed Address in Egypt
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
  academic_term_id?: number;
  booking_package_id?: number;
  total_price?: number;
  payment_proof_url?: string;
  payment_expiry_date?: string;
  payment_method?: 'Online' | 'Bank Transfer';
  checked_in_at?: string;
  checked_out_at?: string;
  rooms: Pick<Room, 'room_number' | 'type'>;
}

export interface Activity {
  id: number;
  user_id: string;
  type: 'booking' | 'payment' | 'system' | 'auth';
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
}

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
}

export interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  page: Page;
  setPage: (page: Page, room?: Room) => void;
  user: User | null;
  selectedRoom: Room | null;
  session: any;
  loading: boolean;
  logout: () => Promise<void>;
  bookings: Booking[];
  addBooking: (booking: Booking) => Promise<{ success: boolean; error?: string; data?: Booking }>;
  updateBookingStatus: (id: number, status: BookingStatus) => Promise<{ success: boolean; error?: string }>;
  updateBooking: (id: number, updates: Partial<Booking>) => Promise<{ success: boolean; error?: string }>;
  cmsContent: CmsContent;
  updateCmsContent: (content: Partial<CmsContent>) => Promise<{ success: boolean; error?: string }>;
  rooms: Room[];
  addRoom: (room: Room) => Promise<{ success: boolean; error?: string }>;
  updateRoom: (room: Room) => Promise<{ success: boolean; error?: string }>;
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  students: User[];
  academicTerms: AcademicTerm[];
  bookingPackages: BookingPackage[];
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