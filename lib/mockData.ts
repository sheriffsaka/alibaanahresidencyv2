
import { Room, RoomType, Booking, BookingStatus, AcademicTerm, BookingPackage } from '../types';

export const MOCK_ROOMS: Room[] = [
  {
    id: 1,
    property_id: 'p1',
    room_number: '101A',
    type: RoomType.SINGLE,
    price_per_month: 350.00,
    amenities: ['Private Bathroom', 'Air Conditioning', 'High-Speed Wi-Fi', 'Study Desk'],
    image_urls: ['https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/single_room1_tsqofx.jpg'],
    is_available: true,
    created_at: new Date().toISOString(),
    gender_restriction: 'Male',
  },
  {
    id: 2,
    property_id: 'p1',
    room_number: '202B',
    type: RoomType.DOUBLE,
    price_per_month: 250.00,
    amenities: ['Shared Bathroom', 'Air Conditioning', 'High-Speed Wi-Fi', 'Two Beds'],
    image_urls: ['https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/shared_bathroom1_hlxjdg.jpg'],
    is_available: false,
    created_at: new Date().toISOString(),
    gender_restriction: 'Male',
  },
  {
    id: 3,
    property_id: 'p1',
    room_number: '301C',
    type: RoomType.SUITE,
    price_per_month: 500.00,
    amenities: ['Private Bathroom', 'Kitchenette', 'Living Area', 'Air Conditioning', 'High-Speed Wi-Fi'],
    image_urls: ['https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/Suite1_t4dczv.jpg'],
    is_available: true,
    created_at: new Date().toISOString(),
    gender_restriction: 'Any',
  },
  {
    id: 4,
    property_id: 'p1',
    room_number: '101F',
    type: RoomType.SINGLE,
    price_per_month: 360.00,
    amenities: ['Private Bathroom', 'Air Conditioning', 'High-Speed Wi-Fi', 'Study Desk'],
    image_urls: ['https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/single_room1_tsqofx.jpg'],
    is_available: true,
    created_at: new Date().toISOString(),
    gender_restriction: 'Female',
  },
];

export const MOCK_ACADEMIC_TERMS: AcademicTerm[] = [
  { id: 1, term_name: 'Fall 2024', start_date: '2024-09-01', end_date: '2024-12-20' },
  { id: 2, term_name: 'Spring 2025', start_date: '2025-01-15', end_date: '2025-05-10' }
];

export const MOCK_PACKAGES: BookingPackage[] = [
  { id: 1, duration_months: 3, discount_percentage: 0, description: 'Standard 3-month term stay.' },
  { id: 2, duration_months: 6, discount_percentage: 5, description: 'Save 5% with a 6-month booking.' },
  { id: 3, duration_months: 12, discount_percentage: 10, description: 'Best value! Save 10% for a full year.' }
];

export const MOCK_STUDENT_BOOKINGS: Booking[] = [
  {
    id: 1045,
    student_id: 's1',
    student_name: 'John Doe',
    student_gender: 'Male',
    room_id: 1,
    academic_term_id: 1,
    booking_package_id: 2,
    start_date: '2024-09-01',
    end_date: '2025-03-01',
    status: BookingStatus.CONFIRMED,
    total_price: 1425.00,
    booked_at: '2024-08-15T10:00:00Z',
    rooms: { room_number: '101A', type: RoomType.SINGLE }
  },
  {
    id: 1046,
    student_id: 's1',
    student_name: 'John Doe',
    student_gender: 'Male',
    room_id: 3,
    academic_term_id: 2,
    booking_package_id: 1,
    start_date: '2025-01-15',
    end_date: '2025-04-15',
    status: BookingStatus.PENDING_PAYMENT,
    total_price: 1500.00,
    booked_at: '2024-12-01T14:30:00Z',
    rooms: { room_number: '301C', type: RoomType.SUITE }
  },
  {
    id: 1047,
    student_id: 's2',
    student_name: 'Fatima Zahra',
    student_gender: 'Female',
    room_id: 4,
    academic_term_id: 1,
    booking_package_id: 1,
    start_date: '2024-09-01',
    end_date: '2024-12-01',
    status: BookingStatus.PENDING_VERIFICATION,
    total_price: 1080.00,
    payment_proof_url: 'https://via.placeholder.com/800x1000.png?text=Student+Payment+Proof',
    booked_at: '2024-08-20T11:00:00Z',
    rooms: { room_number: '101F', type: RoomType.SINGLE }
  }
];

export const MOCK_ADMIN_ANALYTICS = {
  totalRevenue: 24580.50,
  occupancyRate: 85.5,
  currentlyOccupiedRooms: 12,
  totalRooms: 14,
  upcomingCheckIns: 4,
  upcomingCheckOuts: 2,
  pendingVerifications: [
    { id: 201, student: 'Ahmed Mansour', room: '101A', amount: 1050, date: '2024-05-20' },
    { id: 202, student: 'Fatima Zahra', room: '202B', amount: 750, date: '2024-05-21' }
  ]
};