
import React, { useMemo } from 'react';
import { BookingStatus, Room } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import BookingForm from '../components/BookingForm';
import { useApp } from '../hooks/useApp';
import { IconBuilding } from '../components/Icon';

interface BookingPageProps {
  room: Room;
}

const BookingPage: React.FC<BookingPageProps> = ({ room }) => {
  const t = useTranslation();
  const { bookings, setPage } = useApp();

  const isOccupied = useMemo(() => {
    const occupiedStatuses = [BookingStatus.CONFIRMED, BookingStatus.OCCUPIED];
    return bookings.some(b => b.room_id === room.id && occupiedStatuses.includes(b.status));
  }, [bookings, room.id]);

  const isUnavailableForMaintenance = !room.is_available;
  
  if (isUnavailableForMaintenance || isOccupied) {
    return (
        <div className="text-center py-20 animate-fade-in">
            <IconBuilding className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-red-600 dark:text-red-500">{t.roomUnavailableTitle}</h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
                {isUnavailableForMaintenance 
                    ? t.roomMaintenanceMessage
                    : t.roomBookedMessage}
            </p>
            <button onClick={() => setPage('home')} className="mt-8 rounded-md bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500">
                {t.backToRooms}
            </button>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          {t.bookingTitle}
        </h1>
        <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">
          {t.bookingFor.replace('{roomType}', room.type)}
        </p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <img src={room.image_urls?.[0]} alt={room.type} className="rounded-lg object-cover w-full h-full" />
            </div>
            <div>
                <BookingForm room={room} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;