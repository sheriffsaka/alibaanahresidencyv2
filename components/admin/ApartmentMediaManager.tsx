import React, { useState, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { DEFAULT_CATEGORY_MEDIA, CategoryMediaItem, CategoryMediaConfig } from '../../types';
import { uploadFile, generateFileName } from '../../lib/storage';
import { UniversalVideoPlayer } from '../UniversalVideoPlayer';
import {
  Video,
  Image as ImageIcon,
  Upload,
  Plus,
  Trash2,
  Check,
  Loader2,
  Sparkles,
  Link as LinkIcon,
  Layers,
  Save,
  Info
} from 'lucide-react';

interface ApartmentMediaManagerProps {
  initialCategory?: string;
  onOpenManageCategories?: () => void;
}

export const ApartmentMediaManager: React.FC<ApartmentMediaManagerProps> = ({
  initialCategory,
  onOpenManageCategories
}) => {
  const { cmsContent, updateCmsContent, accommodationCategories } = useApp();

  const categories = accommodationCategories && accommodationCategories.length > 0
    ? accommodationCategories.map(c => c.name)
    : ['Premium 1', 'Premium 2', 'Premium 3', 'Premium 4'];

  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategory || categories[0] || 'Premium 1'
  );

  const categoryMediaConfig: CategoryMediaConfig = cmsContent?.categoryMedia || { ...DEFAULT_CATEGORY_MEDIA };
  const currentItem: CategoryMediaItem = categoryMediaConfig[selectedCategory] ||
    DEFAULT_CATEGORY_MEDIA[selectedCategory] || {
      videoUrl: '',
      images: [],
      features: []
    };

  const [videoUrl, setVideoUrl] = useState<string>(currentItem.videoUrl || '');
  const [images, setImages] = useState<string[]>(currentItem.images || []);
  const [features, setFeatures] = useState<string[]>(currentItem.features || []);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [newFeature, setNewFeature] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state when category or CMS data changes
  useEffect(() => {
    const item = categoryMediaConfig[selectedCategory] ||
      DEFAULT_CATEGORY_MEDIA[selectedCategory] || {
        videoUrl: '',
        images: [],
        features: []
      };
    setVideoUrl(item.videoUrl || '');
    setImages(item.images || []);
    setFeatures(item.features || []);
    setStatusMessage(null);
  }, [selectedCategory, cmsContent]);

  // Video presets
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
        const publicUrl = await uploadFile('cms', fileName, file);
        uploadedUrls.push(publicUrl);
      }
      setImages(prev => [...prev, ...uploadedUrls]);
      setStatusMessage({
        type: 'success',
        text: `Uploaded ${uploadedUrls.length} image(s)! Remember to click "Save Category Changes".`
      });
    } catch (err: any) {
      console.error("Failed to upload category image:", err);
      setStatusMessage({
        type: 'error',
        text: `Upload failed: ${err.message || 'Unknown error'}`
      });
    } finally {
      setIsUploading(false);
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
    setImages(prev => [...prev, trimmed]);
    setNewImageUrl('');
    setStatusMessage(null);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddFeature = () => {
    const trimmed = newFeature.trim();
    if (!trimmed) return;
    if (features.includes(trimmed)) {
      setStatusMessage({ type: 'error', text: 'This feature already exists in the list.' });
      return;
    }
    setFeatures(prev => [...prev, trimmed]);
    setNewFeature('');
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const existingMedia = cmsContent?.categoryMedia || { ...DEFAULT_CATEGORY_MEDIA };
      const updatedItem: CategoryMediaItem = {
        videoUrl: videoUrl.trim(),
        images: images.filter(Boolean),
        features: features
      };
      const updatedConfig: CategoryMediaConfig = {
        ...existingMedia,
        [selectedCategory]: updatedItem
      };

      const res = await updateCmsContent({ categoryMedia: updatedConfig });
      if (res?.success) {
        setStatusMessage({
          type: 'success',
          text: `Successfully saved media & perks for ${selectedCategory}! All student booking views are updated.`
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `Failed to save: ${res?.error || 'Unknown error'}`
        });
      }
    } catch (err: any) {
      console.error("Failed to save category media:", err);
      setStatusMessage({
        type: 'error',
        text: `Save failed: ${err.message || 'Unknown error'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-2">
            <Video className="w-3.5 h-3.5" /> Media & Virtual Tours Hub
          </div>
          <h2 className="text-xl font-bold">Apartment Videos & Photo Galleries</h2>
          <p className="text-xs text-brand-100 mt-1 max-w-xl">
            Students see these photos, virtual tours, and perk bullets during Step 2 of the booking process when choosing an apartment.
          </p>
        </div>
        {onOpenManageCategories && (
          <button
            type="button"
            onClick={onOpenManageCategories}
            className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-white/20 shadow-xs shrink-0"
          >
            <Layers className="w-4 h-4" /> Manage Categories
          </button>
        )}
      </div>

      {/* Category Selection Tabs */}
      <div className="bg-white dark:bg-gray-850 rounded-2xl p-2 border border-gray-150 dark:border-gray-750 shadow-xs flex items-center gap-2 overflow-x-auto">
        {categories.map(cat => {
          const isActive = selectedCategory === cat;
          const media = categoryMediaConfig[cat] || DEFAULT_CATEGORY_MEDIA[cat];
          const hasVideo = Boolean(media?.videoUrl);
          const photoCount = media?.images?.length || 0;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="truncate">{cat}</span>
              <span className={`text-[10px] font-normal ${isActive ? 'text-brand-100' : 'text-gray-400'}`}>
                {photoCount} photo(s) • {hasVideo ? '1 video' : 'No video'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800'
          }`}
        >
          {statusMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <Info className="w-4 h-4 text-red-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Virtual Video Tour (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-gray-850 rounded-2xl p-6 border border-gray-150 dark:border-gray-750 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Video className="w-4 h-4 text-brand-600" />
                  Virtual Tour Video for {selectedCategory}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Paste a YouTube, Vimeo, Google Drive link, or direct Cloudinary MP4 video URL.
                </p>
              </div>
            </div>

            {/* Video Input Field */}
            <div className="space-y-2">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://res.cloudinary.com/.../Apartment_1_video.mp4"
                className="w-full text-xs p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white font-mono"
              />

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Official Cloudinary Presets:
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
                    Clear Video
                  </button>
                )}
              </div>
            </div>

            {/* Live Video Player Preview */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Live Video Preview (What Students Will See)
              </label>
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black shadow-inner">
                <UniversalVideoPlayer url={videoUrl} title={`${selectedCategory} Tour`} />
              </div>
            </div>
          </div>

          {/* Comfort & Tech Perks List */}
          <div className="bg-white dark:bg-gray-850 rounded-2xl p-6 border border-gray-150 dark:border-gray-750 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Included Perks & Features for {selectedCategory} ({features.length})
            </h3>
            <p className="text-xs text-gray-500">
              These bullet points display next to the price in the student booking form.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="e.g., High-speed Wi-Fi, Air Conditioning, Private Study Desk..."
                className="flex-1 text-xs p-2.5 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shrink-0 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Perk
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto p-1">
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-xl text-xs"
                >
                  <span className="truncate text-gray-700 dark:text-gray-300 font-medium">✓ {feat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                    title="Remove perk"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Photo Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-gray-850 rounded-2xl p-6 border border-gray-150 dark:border-gray-750 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-brand-600" />
                  Photo Gallery ({images.length})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Apartment photos displayed to students
                </p>
              </div>

              {/* Upload Button */}
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

            {/* Existing Images Grid */}
            {images.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center bg-gray-50/50 dark:bg-gray-800/30">
                <ImageIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">No photos added yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Upload photos or paste URLs below.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[380px] overflow-y-auto p-1">
                {images.map((imgUrl, idx) => (
                  <div
                    key={`${imgUrl}-${idx}`}
                    className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group aspect-video bg-gray-100 dark:bg-gray-800 shadow-xs"
                  >
                    <img
                      src={imgUrl}
                      alt={`${selectedCategory} photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg shadow-xs"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add by Image URL */}
            <div className="pt-2 space-y-1.5 border-t dark:border-gray-800">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Or Paste Photo URL
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or Cloudinary"
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
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Sticky Save Action Card */}
          <div className="bg-white dark:bg-gray-850 rounded-2xl p-5 border border-brand-200 dark:border-brand-900/60 shadow-md space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700 dark:text-gray-300">Category to Save:</span>
              <span className="font-black text-brand-600 dark:text-brand-400 uppercase px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/40">
                {selectedCategory}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isUploading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save {selectedCategory} Media Changes
                </>
              )}
            </button>
            <p className="text-[11px] text-gray-400 text-center">
              Changes synchronize instantly to the database and live student booking flow.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ApartmentMediaManager;
