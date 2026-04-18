
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
  const [formData, setFormData] = useState({
    room_number: room?.room_number || '',
    type: room?.type || AccommodationType.STANDARD_SHARED,
    apartment_name: room?.apartment_name || '',
    category: room?.category || 'Standard',
    price_per_month: room?.price_per_month || 0,
    gender_restriction: room?.gender_restriction || 'Any',
    capacity: room?.capacity || 1,
  });
  const [amenitiesStr, setAmenitiesStr] = useState(room?.amenities.join(', ') || '');
  const [imageUrls, setImageUrls] = useState<string[]>(room?.image_urls || []);
  const [videoUrl, setVideoUrl] = useState<string>(room?.video_urls?.[0] || '');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: (name === 'price_per_month' || name === 'capacity') ? parseFloat(value) : value }));
  };
  
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
    }
  };
  
  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      let finalImageUrls = [...imageUrls];
      
      if (selectedFiles) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const fileName = generateFileName(file.name);
          const url = await uploadFile('rooms', fileName, file);
          finalImageUrls.push(url);
        }
      }

      const finalRoomData: Room = {
        ...(room || { id: 0, created_at: '', property_id: '', is_available: true, occupied_slots: 0 }),
        ...formData,
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
                <div className="grid grid-cols-3 gap-2">
                  {imageUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square border-2 border-brand-500 rounded-lg overflow-hidden group">
                      <img src={url} alt={`Room ${idx}`} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <IconClose className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 transition-all">
                    <span className="text-2xl text-gray-400">+</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase mt-1">Add</span>
                    <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" multiple />
                  </label>
                </div>
                {selectedFiles && (
                  <p className="text-xs text-brand-600 font-bold">{selectedFiles.length} new images selected</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="room_number" className="block text-sm font-bold">Room Number</label>
                <input type="text" name="room_number" id="room_number" value={formData.room_number} onChange={handleInputChange} required className="mt-1 block w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div>
                <label htmlFor="apartment_name" className="block text-sm font-bold">Apartment Name</label>
                <input type="text" name="apartment_name" id="apartment_name" value={formData.apartment_name} onChange={handleInputChange} required className="mt-1 block w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600" placeholder="e.g. Garden View 101" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-bold">Category</label>
                <select name="category" id="category" value={formData.category} onChange={handleInputChange} className="mt-1 block w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              <div>
                <label htmlFor="type" className="block text-sm font-bold">Accommodation Type</label>
                <select name="type" id="type" value={formData.type} onChange={handleInputChange} className="mt-1 block w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                  {Object.values(AccommodationType).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="price_per_month" className="block text-sm font-bold">Price per Month ($)</label>
                <input type="number" name="price_per_month" id="price_per_month" value={formData.price_per_month} onChange={handleInputChange} required className="mt-1 block w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div>
                <label htmlFor="capacity" className="block text-sm font-bold">Capacity (Students)</label>
                <input type="number" name="capacity" id="capacity" value={formData.capacity} onChange={handleInputChange} required className="mt-1 block w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div>
                <label htmlFor="gender_restriction" className="block text-sm font-bold">Gender</label>
                <select name="gender_restriction" id="gender_restriction" value={formData.gender_restriction} onChange={handleInputChange} className="mt-1 block w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                  <option value="Any">Any</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="amenities" className="block text-sm font-bold">Amenities (comma-separated)</label>
              <textarea name="amenities" id="amenities" value={amenitiesStr} onChange={(e) => setAmenitiesStr(e.target.value)} rows={3} className="mt-1 block w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600" placeholder="e.g. Wi-Fi, AC, Study Desk, En-suite Bathroom"></textarea>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-6 flex justify-end gap-4 border-t dark:border-gray-800">
          <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm font-bold disabled:opacity-50" disabled={isUploading}>Cancel</button>
          <button type="submit" form="room-editor-form" className="px-6 py-2 rounded-lg bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:bg-brand-400" disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Save Room'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomEditorModal;
