
import React, { useMemo } from 'react';
import { BookingStatus, Room } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import MultiStepBookingForm from '../components/MultiStepBookingForm';
import { useApp } from '../hooks/useApp';
import { IconBuilding } from '../components/Icon';
import { getParsedRoomSpaces } from '../lib/roomNaming';

const BookingPage: React.FC = () => {
  const t = useTranslation();
  const { effectiveOccupancyBookings, setPage, selectedRoom, extendingBooking, rooms, bedSpaces } = useApp();

  const isOccupied = useMemo(() => {
    if (!selectedRoom) return false;
    // Inactive rooms cannot be booked
    if (selectedRoom.status === 'Inactive') return true;

    // If extending, we allow booking even if it's currently occupied (by the same user)
    if (extendingBooking && extendingBooking.room_id === selectedRoom.id) {
      return false;
    }
    const parsedSpaces = getParsedRoomSpaces(rooms, effectiveOccupancyBookings, bedSpaces, { includeInactive: false });
    const roomCat = (selectedRoom.apartment_name || selectedRoom.category || '').toLowerCase().replace(/\s+/g, '');
    const isPrivate = (selectedRoom.type || '').toLowerCase().includes('private');
    
    const matchingSpaces = parsedSpaces.filter(s => {
      const sCat = s.category.toLowerCase().replace(/\s+/g, '');
      const sType = s.type === 'Private';
      return (sCat.includes(roomCat) || roomCat.includes(sCat) || (roomCat.includes('premium') && sCat.includes('premium'))) && sType === isPrivate;
    });

    if (matchingSpaces.length > 0) {
      return matchingSpaces.every(s => s.isOccupied);
    }

    return !selectedRoom.is_available;
  }, [rooms, effectiveOccupancyBookings, bedSpaces, selectedRoom, extendingBooking]);

  const isUnavailable = selectedRoom ? isOccupied : false;
  
  if (selectedRoom && isUnavailable) {
    return (
        <div className="text-center py-20 animate-fade-in">
            <IconBuilding className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-red-600 dark:text-red-500">{t.roomUnavailableTitle}</h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
                {t.roomBookedMessage}
            </p>
            <button onClick={() => setPage('home')} className="mt-8 rounded-md bg-brand-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-brand-500">
                {t.backToRooms}
            </button>
        </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white sm:text-5xl">
          Book Your Residency
        </h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
          Complete the steps below to secure your room and activate distance enrolment.
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100 dark:border-gray-700">
        <MultiStepBookingForm />
      </div>
    </div>
  );
};

export default BookingPage;