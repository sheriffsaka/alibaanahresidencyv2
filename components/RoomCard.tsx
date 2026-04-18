
import React from 'react';
import { Room } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useApp } from '../hooks/useApp';
import { IconCheckCircle } from './Icon';

interface RoomCardProps {
  room: Room;
  isOccupied: boolean;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, isOccupied }) => {
  const t = useTranslation();
  const { setPage } = useApp();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-500 ${isOccupied ? 'filter grayscale cursor-not-allowed' : 'transform hover:-translate-y-2 hover:shadow-2xl'}`}>
      <div className="relative overflow-hidden">
        <img 
          className="w-full h-64 object-cover object-center transition-transform duration-700 hover:scale-110" 
          src={room.image_urls?.[0]} 
          alt={`Room ${room.type}`} 
        />
        {isOccupied && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                <span className="text-white text-xl font-bold border-2 border-white/50 py-2 px-6 rounded-full bg-black/40 backdrop-blur-md">
                    {t.fullyBooked}
                </span>
            </div>
        )}
        <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-brand-600 dark:text-brand-400 shadow-sm">
            {room.gender_restriction === 'Any' ? 'All Genders' : room.gender_restriction}
        </div>
      </div>
      <div className="p-8">
        <h2 className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-1">{t.roomType}</h2>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {room.type?.toLowerCase().includes('private') ? 'Private Room' : 'Shared Room'}
        </h1>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {room.price_per_month ? t.pricePerMonth.replace('{price}', room.price_per_month.toString()) : 'Price on request'}
        </p>
        <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-500 ${((room.occupied_slots || 0) / (room.capacity || 1)) > 0.8 ? 'bg-red-500' : 'bg-brand-600'}`}
                    style={{ width: `${((room.occupied_slots || 0) / (room.capacity || 1)) * 100}%` }}
                ></div>
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">
                {room.capacity! - room.occupied_slots!} Slots Left
            </span>
        </div>
        
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.amenities}</h3>
            <ul className="grid grid-cols-1 gap-3">
              {(room.amenities || []).slice(0, 4).map((amenity, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <IconCheckCircle className="w-5 h-5 text-brand-500 me-3 flex-shrink-0" />
                  <span>{amenity}</span>
                </li>
              ))}
            </ul>
        </div>
      </div>
      <div className="p-8 pt-0">
        <button 
          onClick={() => !isOccupied && setPage('booking', room)}
          disabled={isOccupied}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-brand-600/20 active:scale-95 disabled:bg-gray-400 disabled:dark:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isOccupied ? t.unavailable : t.bookNow}
        </button>
      </div>
    </div>
  );
};

export default RoomCard;