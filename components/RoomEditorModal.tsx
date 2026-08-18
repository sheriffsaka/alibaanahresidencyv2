
import React, { useState, ChangeEvent } from 'react';
import { Room, AccommodationType } from '../types';
import { IconClose } from './Icon';
import { uploadFile, generateFileName } from '../lib/storage';

interface RoomEditorModalProps {
  room: Room | null; // null for creating a new room
  onClose: () => void;
  onSave: (room: Room) => void;
}

const RoomEditorModal: React.FC<RoomEditorModalProps> = ({ room, onClose, onSave }) => {
  // Helper to parse existing room details
  const getInitialValues = () => {
    if (!room) {
      return {
        category: 'Premium 1' as 'Premium 1' | 'Premium 2' | 'Standard',
        roomNumber: 'Room 1',
        roomType: 'Shared Room' as 'Shared Room' | 'Private Room',
      };
    }

    // Determine category
    let category: 'Premium 1' | 'Premium 2' | 'Standard' = 'Standard';
    const aptName = room.apartment_name || '';
    if (aptName.includes('Premium 1') || aptName === 'Apartment 1') {
      category = 'Premium 1';
    } else if (aptName.includes('Premium 2') || aptName === 'Apartment 3') {
      category = 'Premium 2';
    } else if (room.category === 'Premium') {
      category = 'Premium 1';
    }

    // Determine room number
    let roomNumber = 'Room 1';
    const numClean = room.room_number ? room.room_number.replace('Room', '').trim() : '';
    const digitMatch = numClean.match(/\d+/);
    if (digitMatch) {
      roomNumber = `Room ${digitMatch[0]}`;
    }

    // Determine room type
    const isPrivate = room.type?.toLowerCase().includes('private') || (room.capacity === 1 && !room.type?.toLowerCase().includes('shared'));
    const roomType = isPrivate ? 'Private Room' : 'Shared Room';

    return { category, roomNumber, roomType };
  };

  const initialParsed = getInitialValues();

  const [selectedCategory, setSelectedCategory] = useState<'Premium 1' | 'Premium 2' | 'Standard'>(initialParsed.category as 'Premium 1' | 'Premium 2' | 'Standard');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>(initialParsed.roomNumber);
  const [selectedRoomType, setSelectedRoomType] = useState<'Shared Room' | 'Private Room'>(initialParsed.roomType as 'Shared Room' | 'Private Room');

  const [formData, setFormData] = useState({
    price_per_month: room?.price_per_month || (initialParsed.category === 'Standard' ? 175 : 350),
    gender_restriction: room?.gender_restriction || 'Any',
    capacity: room?.capacity || (initialParsed.roomType === 'Private Room' ? 1 : 2),
    next_available_date: (room as any)?.next_available_date || '',
  });

  const [amenitiesStr, setAmenitiesStr] = useState(room?.amenities?.join(', ') || 'High-Speed Wi-Fi, Air Conditioning, Study Desk, Fully Furnished Kitchen');
  const [imageUrls, setImageUrls] = useState<string[]>(room?.image_urls || []);
  const [videoUrl, setVideoUrl] = useState<string>(room?.video_urls?.[0] || '');
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: (name === 'price_per_month' || name === 'capacity') ? parseFloat(value) : value }));
  };
  
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const remainingSlots = 4 - imageUrls.length - newFiles.length;
      if (remainingSlots <= 0) {
        alert("You can only add up to 4 images per room.");
        return;
      }
      
      const filesToAdd = Array.from(e.target.files).slice(0, remainingSlots);
      setNewFiles(prev => [...prev, ...filesToAdd]);
    }
  };
  
  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Sync capacity when room type changes
  const handleRoomTypeChange = (type: 'Shared Room' | 'Private Room') => {
    setSelectedRoomType(type);
    setFormData(prev => ({
      ...prev,
      capacity: type === 'Private Room' ? 1 : Math.max(2, prev.capacity || 2)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      let finalImageUrls = [...imageUrls];
      
      if (newFiles.length > 0) {
        for (const file of newFiles) {
          const fileName = generateFileName(file.name);
          const url = await uploadFile('rooms', fileName, file);
          finalImageUrls.push(url);
        }
      }

      // Map back to database columns
      const dbCategory = selectedCategory.startsWith('Premium') ? 'Premium' : 'Standard';
      const isPrivate = selectedRoomType === 'Private Room' || formData.capacity === 1;
      
      let dbType = AccommodationType.STANDARD_SHARED;
      if (selectedCategory.startsWith('Premium')) {
        dbType = isPrivate ? AccommodationType.PREMIUM_PRIVATE : AccommodationType.PREMIUM_SHARED;
      } else {
        dbType = isPrivate ? AccommodationType.STANDARD_PRIVATE : AccommodationType.STANDARD_SHARED;
      }

      const digitMatch = selectedRoomNumber.match(/\d+/);
      const roomDigits = digitMatch ? digitMatch[0] : '1';
      const dbRoomNumber = `Room ${roomDigits}`;

      const finalRoomData: Room = {
        ...(room || { id: 0, created_at: '', property_id: '', is_available: true, occupied_slots: 0 }),
        ...formData,
        capacity: formData.capacity,
        category: dbCategory as any,
        apartment_name: selectedCategory,
        type: dbType,
        room_number: dbRoomNumber,
        amenities: amenitiesStr.split(',').map(a => a.trim()).filter(Boolean),
        image_urls: finalImageUrls,
        video_urls: videoUrl ? [videoUrl] : [],
      } as Room;

      onSave(finalRoomData);
    } catch (err) {
      console.error(err);
      alert("Failed to save room details. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex-shrink-0 p-6 flex justify-between items-center border-b dark:border-gray-800">
          <h2 className="text-2xl font-bold">{room ? 'Edit Room' : 'Add New Room'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <IconClose className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <div className="flex-grow overflow-y-auto p-6">
          <form id="room-editor-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Room Images</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {imageUrls.map((url, idx) => (
                    <div key={`existing-${idx}`} className="relative aspect-square border-2 border-brand-500 rounded-lg overflow-hidden group">
                      <img src={url} alt={`Room ${idx}`} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-lg transform hover:scale-110 transition-transform"
                      >
                        <IconClose className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {newFiles.map((file, idx) => (
                    <div key={`new-${idx}`} className="relative aspect-square border-2 border-dashed border-brand-300 rounded-lg overflow-hidden group">
                      <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-gray-400 text-center px-1">NEW: {file.name.substring(0, 10)}...</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeNewFile(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-lg transform hover:scale-110 transition-transform"
                      >
                        <IconClose className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(imageUrls.length + newFiles.length) < 4 && (
                    <label className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 transition-all bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-2xl text-gray-400">+</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase mt-1">Add</span>
                      <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" multiple />
                    </label>
                  )}
                </div>
                {newFiles.length > 0 && (
                  <p className="text-xs text-brand-600 font-bold">{newFiles.length} new images ready for upload</p>
                )}
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Video Embed URL</label>
                <input 
                  type="text" 
                  value={videoUrl} 
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="e.g. YouTube embed URL"
                  className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
                <p className="text-[10px] text-gray-500 italic">Provide a YouTube embed link for the apartment/room video tour.</p>
              </div>
            </div>

            {/* Consistent Room Hierarchy Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-bold text-gray-700 dark:text-gray-300">Category (Apartment)</label>
                <select 
                  id="category" 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="mt-1 block w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                >
                  <option value="Premium 1">Premium 1</option>
                  <option value="Premium 2">Premium 2</option>
                  <option value="Standard">Standard</option>
                </select>
              </div>

              <div>
                <label htmlFor="room_number_select" className="block text-sm font-bold text-gray-700 dark:text-gray-300">Room Number</label>
                <select 
                  id="room_number_select" 
                  value={selectedRoomNumber} 
                  onChange={(e) => setSelectedRoomNumber(e.target.value)}
                  className="mt-1 block w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                >
                  <option value="Room 1">Room 1</option>
                  <option value="Room 2">Room 2</option>
                  <option value="Room 3">Room 3</option>
                  <option value="Room 4">Room 4</option>
                  <option value="Room 5">Room 5</option>
                  <option value="Room 6">Room 6</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="room_type" className="block text-sm font-bold text-gray-700 dark:text-gray-300">Room Type</label>
                <select 
                  id="room_type" 
                  value={selectedRoomType} 
                  onChange={(e) => handleRoomTypeChange(e.target.value as any)}
                  className="mt-1 block w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                >
                  <option value="Shared Room">Shared Room</option>
                  <option value="Private Room">Private Room</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Bed Spaces Managed</label>
                <div className="mt-1 p-3 bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800 rounded-xl text-xs text-brand-800 dark:text-brand-300">
                  {selectedRoomType === 'Private Room' || formData.capacity === 1 ? (
                    <span className="font-semibold">1 Single Bed Space (Private Occupancy)</span>
                  ) : (
                    <span className="font-semibold">
                      {formData.capacity} Bed Spaces (
                      {Array.from({ length: formData.capacity }, (_, i) => `Bed ${String.fromCharCode(65 + i)}`).join(', ')}
                      )
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="price_per_month" className="block text-sm font-bold text-gray-700 dark:text-gray-300">Price per Month ($)</label>
                <input type="number" name="price_per_month" id="price_per_month" value={formData.price_per_month} onChange={handleInputChange} required className="mt-1 block w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium" />
              </div>
              <div>
                <label htmlFor="capacity" className="block text-sm font-bold text-gray-700 dark:text-gray-300">Capacity (Beds/Students)</label>
                <input 
                  type="number" 
                  name="capacity" 
                  id="capacity" 
                  min={1} 
                  max={6} 
                  value={formData.capacity} 
                  onChange={handleInputChange} 
                  required 
                  className="mt-1 block w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium bg-gray-50 dark:bg-gray-850" 
                />
              </div>
              <div>
                <label htmlFor="gender_restriction" className="block text-sm font-bold text-gray-700 dark:text-gray-300">Gender restriction</label>
                <select name="gender_restriction" id="gender_restriction" value={formData.gender_restriction} onChange={handleInputChange} className="mt-1 block w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium">
                  <option value="Any">Any</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="next_available_date" className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                Next Available Date (Manual Override)
              </label>
              <input 
                type="date" 
                name="next_available_date" 
                id="next_available_date" 
                value={formData.next_available_date} 
                onChange={handleInputChange} 
                className="mt-1 block w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm font-medium" 
              />
              <p className="text-[10px] text-gray-500 mt-1 italic">
                Leave blank to automatically compute availability from current active residents' length of stay.
              </p>
            </div>

            <div>
              <label htmlFor="amenities" className="block text-sm font-bold text-gray-700 dark:text-gray-300">Amenities (comma-separated)</label>
              <textarea name="amenities" id="amenities" value={amenitiesStr} onChange={(e) => setAmenitiesStr(e.target.value)} rows={3} className="mt-1 block w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm" placeholder="e.g. Wi-Fi, AC, Study Desk, En-suite Bathroom"></textarea>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-6 flex justify-end gap-4 border-t dark:border-gray-800">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 text-sm font-bold disabled:opacity-50" disabled={isUploading}>Cancel</button>
          <button type="submit" form="room-editor-form" className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md disabled:bg-brand-400" disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Save Room'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomEditorModal;
