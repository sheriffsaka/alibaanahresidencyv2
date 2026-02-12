
import React, { useState, ChangeEvent } from 'react';
import { Room, RoomType } from '../types';
import { IconClose } from './Icon';

interface RoomEditorModalProps {
  room: Room | null; // null for creating a new room
  onClose: () => void;
  onSave: (room: Room) => void;
}

const RoomEditorModal: React.FC<RoomEditorModalProps> = ({ room, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    room_number: room?.room_number || '',
    type: room?.type || RoomType.SINGLE,
    price_per_month: room?.price_per_month || 0,
  });
  const [amenitiesStr, setAmenitiesStr] = useState(room?.amenities.join(', ') || '');
  const [imagePreview, setImagePreview] = useState<string | null>(room?.image_urls?.[0] || null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price_per_month' ? parseFloat(value) : value }));
  };
  
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRoomData: Room = {
      ...(room || { id: 0, created_at: '', property_id: '', is_available: true }),
      ...formData,
      amenities: amenitiesStr.split(',').map(a => a.trim()).filter(Boolean),
      image_urls: imagePreview ? [imagePreview] : [],
    };
    onSave(finalRoomData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
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
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Room Image</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Room preview" className="mx-auto h-32 w-auto rounded-md object-cover" />
                  ) : (
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  )}
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-900 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*"/>
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="room_number" className="block text-sm font-bold">Room Number</label>
                <input type="text" name="room_number" id="room_number" value={formData.room_number} onChange={handleInputChange} required className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div>
                <label htmlFor="type" className="block text-sm font-bold">Room Type</label>
                <select name="type" id="type" value={formData.type} onChange={handleInputChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                  {Object.values(RoomType).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="price_per_month" className="block text-sm font-bold">Price per Month ($)</label>
              <input type="number" name="price_per_month" id="price_per_month" value={formData.price_per_month} onChange={handleInputChange} required className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
              <label htmlFor="amenities" className="block text-sm font-bold">Amenities (comma-separated)</label>
              <textarea name="amenities" id="amenities" value={amenitiesStr} onChange={(e) => setAmenitiesStr(e.target.value)} rows={3} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"></textarea>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-6 flex justify-end gap-4 border-t dark:border-gray-800">
          <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm font-bold">Cancel</button>
          <button type="submit" form="room-editor-form" className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700">Save Room</button>
        </div>
      </div>
    </div>
  );
};

export default RoomEditorModal;
