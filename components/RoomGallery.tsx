
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {galleryRooms.map(room => (
                    <div key={room.id} className="group relative block bg-black rounded-lg overflow-hidden">
                        <img
                            alt={`Image of ${room.type} room`}
                            src={room.image_urls?.[0] ? room.image_urls[0].replace('/upload/', '/upload/w_800,h_600,c_fill/') : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'}
                            className="absolute inset-0 h-full w-full object-cover opacity-75 transition-opacity group-hover:opacity-50"
                        />
                        <div className="relative p-6">
                           <div className="mt-32">
                                <div
                                    className="transform-gpu text-white transition-all group-hover:translate-y-0 group-hover:opacity-100 translate-y-8 opacity-0"
                                >
                                    <p className="text-2xl font-bold">{room.type}</p>
                                    <p className="text-sm">{t.pricePerMonth.replace('{price}', room.price_per_month.toString())}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoomGallery;
