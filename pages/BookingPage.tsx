
import React, { useMemo } from 'react';
import { BookingStatus, Room } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import MultiStepBookingForm from '../components/MultiStepBookingForm';
import { useApp } from '../hooks/useApp';
import { IconBuilding } from '../components/Icon';

const BookingPage: React.FC = () => {
  const t = useTranslation();
  const { bookings, setPage, selectedRoom, extendingBooking } = useApp();

  const isOccupied = useMemo(() => {
    if (!selectedRoom) return false;
    const occupiedStatuses = [BookingStatus.CONFIRMED, BookingStatus.OCCUPIED];
    // If extending, we allow booking even if it's currently occupied (by the same user)
    if (extendingBooking && extendingBooking.room_id === selectedRoom.id) {
        return false;
    }
    return bookings.some(b => b.room_id === selectedRoom.id && occupiedStatuses.includes(b.status));
  }, [bookings, selectedRoom, extendingBooking]);

  const isUnavailableForMaintenance = selectedRoom ? !selectedRoom.is_available : false;
  
  if (selectedRoom && (isUnavailableForMaintenance || isOccupied)) {
    return (
        <div className="text-center py-20 animate-fade-in">
            <IconBuilding className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-red-600 dark:text-red-500">{t.roomUnavailableTitle}</h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
                {isUnavailableForMaintenance 
                    ? t.roomMaintenanceMessage
                    : t.roomBookedMessage}
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