
import React, { useMemo } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import RoomCard from '../components/RoomCard';
import FAQ from '../components/FAQ';
import { IconMapPin, IconShieldCheck, IconSofa } from '../components/Icon';
import RoomGallery from '../components/RoomGallery';
import { useApp } from '../hooks/useApp';
import { BookingStatus, RoomType } from '../types';

const HomePage: React.FC = () => {
  const t = useTranslation();
  const { cmsContent, rooms, user, bookings } = useApp();

  const handleScrollToRooms = () => {
    const roomsSection = document.getElementById('rooms-section');
    if (roomsSection) {
      roomsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const occupiedRoomIds = useMemo(() => {
    const occupiedStatuses = [BookingStatus.CONFIRMED, BookingStatus.OCCUPIED];
    return new Set(
        bookings
            .filter(b => occupiedStatuses.includes(b.status))
            .map(b => b.room_id)
    );
  }, [bookings]);

  const visibleRooms = useMemo(() => {
    if (user?.role === 'student' && user.gender) {
      return rooms.filter(room => room.gender_restriction === 'Any' || room.gender_restriction === user.gender);
    }
    return rooms;
  }, [rooms, user]);
  
  const availabilitySummary = useMemo(() => {
    const summary = {
        [RoomType.SINGLE]: { total: 0, available: 0 },
        [RoomType.DOUBLE]: { total: 0, available: 0 },
        [RoomType.SUITE]: { total: 0, available: 0 },
    };

    visibleRooms.forEach(room => {
        if (summary[room.type]) {
            summary[room.type].total++;
            if (room.is_available && !occupiedRoomIds.has(room.id)) {
                summary[room.type].available++;
            }
        }
    });

    return Object.entries(summary).filter(([, counts]) => counts.total > 0).map(([type, counts]) => ({ type: type as RoomType, ...counts }));
  }, [visibleRooms, occupiedRoomIds]);

  return (
    <div className="space-y-20">
      {/* Dynamic Hero Section */}
      <div className="relative -mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="absolute inset-0">
          <img className="h-full w-full object-cover" src={cmsContent.heroImageUrl} alt="Student residence" />
          <div className="absolute inset-0 bg-gray-900 bg-opacity-40"></div>
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-48 lg:py-64 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {cmsContent.heroTitle}
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-gray-200">
            {cmsContent.heroSubtitle}
          </p>
          <div className="mt-10">
            <button
              onClick={handleScrollToRooms}
              className="rounded-md bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all hover:scale-105"
            >
              {t.heroCTA}
            </button>
          </div>
        </div>
      </div>

      {/* Room Gallery Section */}
      <section>
        <RoomGallery rooms={visibleRooms} />
      </section>

      {/* Availability Overview Section */}
      <section>
        <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{t.availabilityOverview}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {availabilitySummary.map(({ type, total, available }) => (
                <div key={type} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{type} Rooms</h3>
                    <p className="font-semibold text-blue-600 dark:text-blue-400 my-2 text-2xl">
                        {t.roomsAvailable.replace('{available}', available.toString()).replace('{total}', total.toString())}
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${(available / total) * 100}%` }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* Rooms Section */}
      <section id="rooms-section">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            {t.ourRoomsTitle}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            {t.ourRoomsSubtitle}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleRooms.map((room) => (
              <RoomCard 
                key={room.id} 
                room={room} 
                isOccupied={!room.is_available || occupiedRoomIds.has(room.id)}
              />
          ))}
        </div>
      </section>
      
      {/* Features Section */}
      <section>
        <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{t.whyChooseUsTitle}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {cmsContent.features.map((feat, idx) => (
              <div key={feat.id} className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mb-4 shadow-sm">
                      {idx === 0 && <IconMapPin className="h-8 w-8" />}
                      {idx === 1 && <IconSofa className="h-8 w-8" />}
                      {idx === 2 && <IconShieldCheck className="h-8 w-8" />}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{feat.title}</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">{feat.desc}</p>
              </div>
            ))}
        </div>
      </section>

      <section>
          <FAQ faqs={cmsContent.faqs} />
      </section>
    </div>
  );
};

export default HomePage;