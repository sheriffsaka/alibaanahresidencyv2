
import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Room, RoomType } from '../types';

interface RoomGalleryProps {
    rooms: Room[];
}

const RoomGallery: React.FC<RoomGalleryProps> = ({ rooms }) => {
    const t = useTranslation();

    const galleryRooms = [
        rooms.find(r => r.type === RoomType.SINGLE),
        rooms.find(r => r.type === RoomType.DOUBLE),
        rooms.find(r => r.type === RoomType.SUITE),
    ].filter((r): r is Room => !!r); // Type guard to filter out undefined

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
                            src={room.image_urls?.[0].replace('/upload/', '/upload/w_800,h_600,c_fill/')}
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
