
import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Room, AccommodationType } from '../types';

interface RoomGalleryProps {
    rooms: Room[];
}

const RoomGallery: React.FC<RoomGalleryProps> = ({ rooms }) => {
    const t = useTranslation();

    const galleryRooms = React.useMemo(() => {
        const types = [
            AccommodationType.STANDARD_SHARED,
            AccommodationType.STANDARD_PRIVATE,
            AccommodationType.PREMIUM_SHARED,
            AccommodationType.PREMIUM_PRIVATE,
        ];
        
        return types.map(type => {
            return rooms.find(r => r.type?.toLowerCase() === type.toLowerCase());
        }).filter((r): r is Room => !!r);
    }, [rooms]);

    if (galleryRooms.length === 0) {
        return (
            <div className="max-w-7xl mx-auto text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">No rooms available to display in the gallery.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                    {t.galleryTitle}
                </h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                    {t.gallerySubtitle}
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto">
                {galleryRooms.map(room => (
                    <div key={room.id} className="group relative block bg-black rounded-2xl overflow-hidden shadow-xl aspect-[4/3]">
                        <img
                            alt={`Image of ${room.type} room`}
                            src={room.image_urls?.[0] ? room.image_urls[0].replace('/upload/', '/upload/w_1200,h_900,c_fill/') : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80'}
                            className="absolute inset-0 h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:opacity-60 group-hover:scale-110"
                        />
                        <div className="relative h-full flex flex-col justify-end p-8 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                            <div className="transform-gpu text-white transition-all duration-500 group-hover:translate-y-0 translate-y-4">
                                <p className="text-3xl font-bold tracking-tight">{room.type}</p>
                                <p className="text-lg font-medium text-brand-300 mt-2">
                                    {t.pricePerMonth.replace('{price}', room.price_per_month.toString())}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoomGallery;
