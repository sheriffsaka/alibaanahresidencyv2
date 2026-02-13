
import { AcademicTerm, BookingPackage } from '../types';

// Note: MOCK_ROOMS and MOCK_STUDENT_BOOKINGS have been removed as this data is now fetched live from Supabase.

export const MOCK_ACADEMIC_TERMS: AcademicTerm[] = [
  { id: 1, term_name: 'Fall 2024', start_date: '2024-09-01', end_date: '2024-12-20' },
  { id: 2, term_name: 'Spring 2025', start_date: '2025-01-15', end_date: '2025-05-10' }
];

export const MOCK_PACKAGES: BookingPackage[] = [
  { id: 1, duration_months: 3, discount_percentage: 0, description: 'Standard 3-month term stay.' },
  { id: 2, duration_months: 6, discount_percentage: 5, description: 'Save 5% with a 6-month booking.' },
  { id: 3, duration_months: 12, discount_percentage: 10, description: 'Best value! Save 10% for a full year.' }
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
