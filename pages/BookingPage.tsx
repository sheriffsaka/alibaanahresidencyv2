
import React from 'react';
import { Room } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import BookingForm from '../components/BookingForm';

interface BookingPageProps {
  room: Room;
}

const BookingPage: React.FC<BookingPageProps> = ({ room }) => {
  const t = useTranslation();

  return (
    <div className="max-w-4xl mx-auto">
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
