
import React from 'react';
import { Room } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useApp } from '../hooks/useApp';
import { IconCheckCircle } from './Icon';

interface RoomCardProps {
  room: Room;
}

const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const t = useTranslation();
  const { setPage } = useApp();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
      <img className="w-full h-56 object-cover object-center" src={room.image_urls?.[0]} alt={`Room ${room.type}`} />
      <div className="p-6">
        <h2 className="text-sm title-font font-medium text-gray-500 dark:text-gray-400 mb-1 tracking-widest">{t.roomType}</h2>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{room.type}</h1>
        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">{t.pricePerMonth.replace('{price}', room.price_per_month.toString())}</p>
        
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.amenities}</h3>
        <ul className="space-y-2 text-gray-600 dark:text-gray-400">
          {room.amenities.map((amenity, index) => (
            <li key={index} className="flex items-center">
              <IconCheckCircle className="w-5 h-5 text-green-500 me-2 flex-shrink-0" />
              <span>{amenity}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <button 
          onClick={() => setPage('booking', room)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300"
        >
          {t.bookNow}
        </button>
      </div>
    </div>
  );
};

export default RoomCard;
