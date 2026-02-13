
// All operational data like rooms, bookings, terms, and packages
// is now fetched live from the Supabase backend.
// This file is kept for any remaining static data, like analytics placeholders.

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
