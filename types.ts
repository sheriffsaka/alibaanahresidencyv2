
export type Language = 'en' | 'ar' | 'ru' | 'fr' | 'uz' | 'zh';

export type Page = 'home' | 'booking' | 'dashboard' | 'auth' | 'support';

export enum RoomType {
  SINGLE = 'Single',
  DOUBLE = 'Double',
  SUITE = 'Suite',
}

export interface Room {
  id: number;
  property_id: string;
  room_number: string;
  type: RoomType;
  price_per_month: number;
  amenities: string[];
  image_urls: string[];
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

export enum PaymentMethod {
    ONLINE = 'Online',
    BANK_TRANSFER = 'Bank Transfer',
}

export interface Booking {
  id: number;
  student_id: string;
  student_name?: string; // For mock display
  room_id: number;
  academic_term_id: number;
  booking_package_id: number;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  total_price: number;
  booked_at: string;
  payment_proof_url?: string;
  payment_method?: PaymentMethod;
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
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  features: {
    id: number;
    title: string;
    desc: string;
  }[];
  faqs: {
    id: number;
    q: string;
    a: string;
  }[];
}

export interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  page: Page;
  setPage: (page: Page, room?: Room) => void;
  user: User | null;
  selectedRoom: Room | null;
  session: any;
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  updateBookingStatus: (id: number, status: BookingStatus) => void;
  cmsContent: CmsContent;
  updateCmsContent: (content: Partial<CmsContent>) => void;
  rooms: Room[];
  addRoom: (room: Room) => void;
  updateRoom: (room: Room) => void;
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id'>) => void;
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