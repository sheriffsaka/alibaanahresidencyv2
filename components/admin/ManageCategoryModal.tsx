import React, { useState, useEffect } from 'react';
import { AccommodationCategory } from '../../types';
import { useApp } from '../../hooks/useApp';
import { 
  FolderPlus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Layers, 
  MapPin, 
  DollarSign, 
  RefreshCw,
  Plus,
  Power
} from 'lucide-react';

interface ManageCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageCategoryModal: React.FC<ManageCategoryModalProps> = ({ isOpen, onClose }) => {
  const { 
    accommodationCategories, 
    addAccommodationCategory, 
    updateAccommodationCategory, 
    deleteAccommodationCategory,
    refreshAccommodationCategories 
  } = useApp();

  const [categories, setCategories] = useState<AccommodationCategory[]>(accommodationCategories);
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AccommodationCategory | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [defaultPrice, setDefaultPrice] = useState<number | string>('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  // Status & feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setCategories(accommodationCategories);
  }, [accommodationCategories]);

  useEffect(() => {
    if (isOpen) {
      handleRefresh();
      resetForm();
      setFeedback(null);
    }
  }, [isOpen]);

  const resetForm = () => {
    setName('');
    setAddress('');
    setDefaultPrice('');
    setDescription('');
    setStatus('Active');
    setIsAdding(false);
    setEditingCategory(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await refreshAccommodationCategories();
      if (refreshed && Array.isArray(refreshed)) {
        setCategories(refreshed);
      }
    } catch (err: any) {
      console.error('Failed to refresh categories:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStartEdit = (category: AccommodationCategory) => {
    setEditingCategory(category);
    setIsAdding(false);
    setName(category.name);
    setAddress(category.address || '');
    setDefaultPrice(category.defaultPrice !== undefined ? category.defaultPrice : '');
    setDescription(category.description || '');
    setStatus(category.status || 'Active');
    setFeedback(null);
  };

  const handleStartAdd = () => {
    resetForm();
    setIsAdding(true);
    setFeedback(null);
  };

  const handleToggleStatus = async (cat: AccommodationCategory) => {
    const nextStatus = cat.status === 'Active' ? 'Inactive' : 'Active';
    setIsSubmitting(true);
    setFeedback(null);

    const res = await updateAccommodationCategory(cat.id, { status: nextStatus });
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: 'success', message: `Category "${cat.name}" marked as ${nextStatus}.` });
      await handleRefresh();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to update category status in Supabase.' });
    }
  };

  const handleDelete = async (cat: AccommodationCategory) => {
    if (!window.confirm(`Are you sure you want to remove category "${cat.name}"?`)) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const res = await deleteAccommodationCategory(cat.id);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: 'success', message: `Category "${cat.name}" deleted successfully.` });
      if (editingCategory?.id === cat.id) {
        resetForm();
      }
      await handleRefresh();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to delete category.' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFeedback({ type: 'error', message: 'Category name is required.' });
      return;
    }

    // Duplicate check
    const isDuplicate = categories.some(
      c => c.name.trim().toLowerCase() === trimmedName.toLowerCase() && 
           (!editingCategory || c.id !== editingCategory.id)
    );

    if (isDuplicate) {
      setFeedback({ 
        type: 'error', 
        message: `A category named "${trimmedName}" already exists. Please choose a distinct name.` 
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const priceVal = defaultPrice === '' ? undefined : Number(defaultPrice);

      if (editingCategory) {
        // Update existing category
        const res = await updateAccommodationCategory(editingCategory.id, {
          name: trimmedName,
          address: address.trim(),
          defaultPrice: priceVal,
          description: description.trim(),
          status: status
        });

        if (res.success) {
          setFeedback({ type: 'success', message: `Category "${trimmedName}" updated in Supabase!` });
          resetForm();
          await handleRefresh();
        } else {
          setFeedback({ type: 'error', message: res.error || 'Failed to update category in Supabase.' });
        }
      } else {
        // Add new category
        const res = await addAccommodationCategory({
          name: trimmedName,
          address: address.trim(),
          defaultPrice: priceVal,
          description: description.trim(),
          status: status
        });

        if (res.success) {
          setFeedback({ type: 'success', message: `Category "${trimmedName}" created and saved to Supabase!` });
          resetForm();
          await handleRefresh();
        } else {
          setFeedback({ type: 'error', message: res.error || 'Failed to save category to Supabase.' });
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="manage-category-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      <div 
        id="manage-category-modal"
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Manage Accommodation Categories
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Create and manage categories (e.g., Premium 1, Premium 2, Premium 3, Standard, Standard 2) stored in Supabase
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              id="refresh-categories-btn"
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              title="Refresh from Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />
            </button>
            <button
              id="close-category-modal-btn"
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`px-6 py-3 border-b flex items-center gap-3 text-xs font-semibold ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span className="flex-1">{feedback.message}</span>
            <button 
              type="button"
              onClick={() => setFeedback(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Body Content (2 Column Layout) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Categories List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Existing Categories ({categories.length})
              </span>
              {!isAdding && !editingCategory && (
                <button
                  id="add-category-trigger-btn"
                  type="button"
                  onClick={handleStartAdd}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-300 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Category
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {categories.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                  <Layers className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No categories found.</p>
                  <button
                    type="button"
                    onClick={handleStartAdd}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline"
                  >
                    + Create your first category
                  </button>
                </div>
              ) : (
                categories.map(cat => {
                  const isSelected = editingCategory?.id === cat.id;
                  const isActive = cat.status === 'Active';

                  return (
                    <div
                      key={cat.id}
                      id={`category-card-${cat.id}`}
                      className={`p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-900/20 shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                              {cat.name}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {cat.status || 'Active'}
                            </span>
                            {cat.defaultPrice !== undefined && (
                              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                • ${cat.defaultPrice}/mo
                              </span>
                            )}
                          </div>

                          {cat.address && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
                              <span className="truncate">{cat.address}</span>
                            </p>
                          )}

                          {cat.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                              {cat.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            id={`edit-category-btn-${cat.id}`}
                            type="button"
                            onClick={() => handleStartEdit(cat)}
                            className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                            title="Edit Category"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            id={`toggle-status-btn-${cat.id}`}
                            type="button"
                            onClick={() => handleToggleStatus(cat)}
                            disabled={isSubmitting}
                            className={`p-1.5 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1 ${
                              isActive
                                ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                            }`}
                            title={isActive ? 'Deactivate Category' : 'Activate Category'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <button
                            id={`delete-category-btn-${cat.id}`}
                            type="button"
                            onClick={() => handleDelete(cat)}
                            disabled={isSubmitting}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Add / Edit Form */}
          <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-700 pt-6 lg:pt-0 lg:pl-6">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border border-gray-200/70 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {editingCategory ? (
                    <>
                      <Edit3 className="w-4 h-4 text-brand-600" /> Edit Category
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-4 h-4 text-brand-600" /> Add New Category
                    </>
                  )}
                </h3>
                {(isAdding || editingCategory) && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-[11px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Category Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="category-name-input"
                    type="text"
                    required
                    placeholder="e.g. Premium 3, Standard 2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-hidden"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Must be unique (e.g. Premium 1, Premium 2, Premium 3, Standard, Standard 2)
                  </p>
                </div>

                {/* Address / Location */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Address / Building Location
                  </label>
                  <input
                    id="category-address-input"
                    type="text"
                    placeholder="e.g. 11, Samir Moursey Street, Nasr City, Cairo."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-hidden"
                  />
                </div>

                {/* Default Monthly Price & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Default Price ($/mo)
                    </label>
                    <input
                      id="category-price-input"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 350"
                      value={defaultPrice}
                      onChange={(e) => setDefaultPrice(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      id="category-status-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                      className="w-full px-3 py-2 text-xs font-bold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-hidden"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Description & Features
                  </label>
                  <textarea
                    id="category-description-input"
                    rows={2}
                    placeholder="Short description of this accommodation category..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-hidden"
                  />
                </div>

                {/* Form Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-3 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    id="save-category-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving to Supabase...
                      </>
                    ) : editingCategory ? (
                      'Save Changes'
                    ) : (
                      'Create Category'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between text-xs text-gray-500">
          <span>
            Categories sync directly to Supabase and update available options across the portal.
          </span>
          <button
            id="done-category-modal-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
