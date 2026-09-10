import React, { useState } from 'react';
import { Room } from '../../types';
import { uploadFile, generateFileName } from '../../lib/storage';
import { UniversalVideoPlayer } from '../UniversalVideoPlayer';
import { 
  X, 
  Upload, 
  Plus, 
  Trash2, 
  Star, 
  Video, 
  Image as ImageIcon, 
  Check, 
  Loader2, 
  Link as LinkIcon,
  Sparkles
} from 'lucide-react';

interface RoomMediaModalProps {
  room: Room;
  onClose: () => void;
  onSave: (updatedRoom: Room) => Promise<void>;
}

export const RoomMediaModal: React.FC<RoomMediaModalProps> = ({
  room,
  onClose,
  onSave
}) => {
  const [imageUrls, setImageUrls] = useState<string[]>(room.image_urls || []);
  const [videoUrl, setVideoUrl] = useState<string>(room.video_urls?.[0] || '');
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Video presets available for student housing
  const VIDEO_PRESETS = [
    {
      label: 'Apartment 1 Tour Video (Cloudinary)',
      url: 'https://res.cloudinary.com/di7okmjsx/video/upload/q_auto/f_auto/v1776504008/Apartment_1_video_fpin5l.mp4'
    },
    {
      label: 'Apartment 2 Tour Video (Cloudinary)',
      url: 'https://res.cloudinary.com/di7okmjsx/video/upload/q_auto/f_auto/v1776584603/Apartment2_video_zy702b.mp4'
    }
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setStatusMessage(null);

    const uploadedUrls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = generateFileName(file.name);
        const publicUrl = await uploadFile('rooms', fileName, file);
        uploadedUrls.push(publicUrl);
      }
      setImageUrls(prev => [...prev, ...uploadedUrls]);
      setStatusMessage({
        type: 'success',
        text: `Successfully uploaded ${uploadedUrls.length} image(s)!`
      });
    } catch (err: any) {
      console.error("Image upload failed:", err);
      setStatusMessage({
        type: 'error',
        text: `Upload failed: ${err.message || 'Unknown error'}`
      });
    } finally {
      setIsUploading(false);
      // Reset input value so same files can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a valid URL starting with http:// or https://'
      });
      return;
    }
    setImageUrls(prev => [...prev, trimmed]);
    setNewImageUrl('');
    setStatusMessage(null);
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    setImageUrls(prev => {
      const copy = [...prev];
      const selected = copy.splice(index, 1)[0];
      return [selected, ...copy];
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const updated: Room = {
        ...room,
        image_urls: imageUrls.filter(url => Boolean(url && url.trim())),
        video_urls: videoUrl.trim() ? [videoUrl.trim()] : []
      };
      await onSave(updated);
      setStatusMessage({
        type: 'success',
        text: 'Room media updated successfully!'
      });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error("Failed to save room media:", err);
      setStatusMessage({
        type: 'error',
        text: `Failed to save: ${err.message || 'Unknown error'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] border border-gray-100 dark:border-gray-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                {room.apartment_name || room.category}
              </span>
              <span className="text-xs font-mono text-gray-500 font-semibold">
                Unit Code: {room.room_number}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-brand-600" />
              Room Photos & Video Tour Manager
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Update room gallery images and virtual video tour visible to students during booking.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800'
              }`}
            >
              {statusMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-red-600" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Section 1: Room Image Gallery */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-brand-600" />
                  Room Gallery Photos ({imageUrls.length})
                </h3>
                <p className="text-xs text-gray-500">The first photo is used as the primary card preview</p>
              </div>
              <label className="cursor-pointer bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-200 dark:border-brand-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors">
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" /> Upload Photos
                  </>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  disabled={isUploading}
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {/* Current Images Grid */}
            {imageUrls.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center bg-gray-50/50 dark:bg-gray-800/30">
                <ImageIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">No photos added yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Upload photos from your computer or paste an image URL below.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {imageUrls.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    className={`relative rounded-2xl overflow-hidden border-2 group bg-gray-100 dark:bg-gray-800 aspect-video shadow-xs transition-all ${
                      idx === 0
                        ? 'border-brand-500 ring-2 ring-brand-500/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Room photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Primary Badge */}
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-brand-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-white" /> Primary
                      </span>
                    )}

                    {/* Action Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(idx)}
                          className="bg-white/90 hover:bg-white text-gray-800 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-xs"
                          title="Set as primary photo"
                        >
                          <Star className="w-3 h-3 text-amber-500" /> Primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg shadow-xs"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Image by URL */}
            <div className="flex gap-2 pt-1">
              <div className="relative flex-1">
                <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Or paste an image URL (e.g., https://res.cloudinary.com/...)..."
                  className="w-full text-xs pl-9 pr-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Section 2: Room Video Tour */}
          <div className="space-y-3 pt-4 border-t dark:border-gray-800">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Video className="w-4 h-4 text-brand-600" />
                Virtual Video Tour
              </h3>
              <p className="text-xs text-gray-500">
                Provide a YouTube embed, Vimeo, Google Drive preview, or direct MP4/Cloudinary video URL.
              </p>
            </div>

            {/* Video Input */}
            <div className="space-y-2">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or Cloudinary .mp4"
                className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white font-mono"
              />

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Quick Presets:
                </span>
                {VIDEO_PRESETS.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setVideoUrl(preset.url)}
                    className="text-[10px] font-semibold bg-gray-100 hover:bg-brand-50 text-gray-700 hover:text-brand-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
                {videoUrl && (
                  <button
                    type="button"
                    onClick={() => setVideoUrl('')}
                    className="text-[10px] font-semibold text-red-600 hover:text-red-700 dark:text-red-400 px-1.5 py-1 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Live Video Preview */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Live Video Preview
              </label>
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black shadow-inner">
                <UniversalVideoPlayer url={videoUrl} title={`${room.apartment_name} Tour`} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-5 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
          <p className="text-xs text-gray-500">
            {imageUrls.length} image(s) • {videoUrl ? '1 video linked' : 'No video'}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isUploading}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" /> Save Media Changes
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RoomMediaModal;
