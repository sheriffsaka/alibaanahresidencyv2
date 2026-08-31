import React, { useState, useMemo } from 'react';
import { useApp } from '../../hooks/useApp';
import { StudentDocument } from '../../types';
import { DEFAULT_STUDENT_DOCUMENTS } from '../../contexts/AppContext';
import { 
  IconCheckCircle, 
  IconEye, 
  IconEdit, 
  IconTrash, 
  IconClose, 
  IconFile, 
  IconCheck, 
  IconAlertTriangle,
  IconBuilding,
  IconSave
} from '../Icon';

const PREDEFINED_CATEGORIES = [
  'Policy & Safety',
  'Arrival & Logistics',
  'Orientation',
  'Official Records',
  'Maintenance & Utilities',
  'Finance & Payments',
  'Community & Conduct'
];

export const ManageStudentDocumentsView: React.FC = () => {
  const { 
    studentDocuments, 
    addStudentDocument, 
    updateStudentDocument, 
    deleteStudentDocument, 
    resetStudentDocumentsToDefault,
    landlordDetails
  } = useApp();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');

  // Modal States
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<StudentDocument | null>(null);
  const [previewingDoc, setPreviewingDoc] = useState<StudentDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<StudentDocument | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Form State for Create/Edit
  const [formData, setFormData] = useState<{
    id: string;
    title: string;
    category: string;
    customCategory: string;
    updated: string;
    description: string;
    content: string;
    is_published: boolean;
  }>({
    id: '',
    title: '',
    category: 'Policy & Safety',
    customCategory: '',
    updated: 'Active Guide',
    description: '',
    content: '',
    is_published: true
  });

  const [editorTab, setEditorTab] = useState<'edit' | 'preview' | 'split'>('split');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Extract unique categories from actual documents
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    PREDEFINED_CATEGORIES.forEach(c => categories.add(c));
    (studentDocuments || []).forEach(d => {
      if (d.category) categories.add(d.category);
    });
    return Array.from(categories);
  }, [studentDocuments]);

  // Filtered documents list
  const filteredDocuments = useMemo(() => {
    const list = studentDocuments || [];
    return list.filter(doc => {
      // Search filter
      const matchesSearch = 
        !searchTerm.trim() ||
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;

      // Status filter
      const isPublished = doc.is_published !== false;
      const matchesStatus = 
        selectedStatus === 'all' ||
        (selectedStatus === 'published' && isPublished) ||
        (selectedStatus === 'draft' && !isPublished);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [studentDocuments, searchTerm, selectedCategory, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    const docs = studentDocuments || [];
    const total = docs.length;
    const published = docs.filter(d => d.is_published !== false).length;
    const drafts = total - published;
    const categoriesCount = new Set(docs.map(d => d.category)).size;
    return { total, published, drafts, categoriesCount };
  }, [studentDocuments]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingDoc(null);
    setFormData({
      id: '',
      title: '',
      category: 'Policy & Safety',
      customCategory: '',
      updated: 'Active Guide',
      description: '',
      content: '',
      is_published: true
    });
    setEditorTab('split');
    setIsEditorModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (doc: StudentDocument) => {
    setEditingDoc(doc);
    const isCustomCat = !PREDEFINED_CATEGORIES.includes(doc.category);
    setFormData({
      id: doc.id,
      title: doc.title,
      category: isCustomCat ? 'Custom' : doc.category,
      customCategory: isCustomCat ? doc.category : '',
      updated: doc.updated || 'Active Guide',
      description: doc.description || '',
      content: doc.content || '',
      is_published: doc.is_published !== false
    });
    setEditorTab('split');
    setIsEditorModalOpen(true);
  };

  // Handle Save
  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Document title is required.', 'error');
      return;
    }

    const finalCategory = formData.category === 'Custom' 
      ? (formData.customCategory.trim() || 'General') 
      : formData.category;

    setIsSaving(true);
    try {
      if (editingDoc) {
        // Update
        const res = await updateStudentDocument(editingDoc.id, {
          title: formData.title.trim(),
          category: finalCategory,
          updated: formData.updated.trim() || 'Active Guide',
          description: formData.description.trim(),
          content: formData.content,
          is_published: formData.is_published
        });
        if (res.success) {
          showToast(`Document "${formData.title}" updated successfully!`);
          setIsEditorModalOpen(false);
        } else {
          showToast(res.error || 'Failed to update document', 'error');
        }
      } else {
        // Create
        const res = await addStudentDocument({
          id: formData.id.trim() || undefined,
          title: formData.title.trim(),
          category: finalCategory,
          updated: formData.updated.trim() || 'Active Guide',
          description: formData.description.trim(),
          content: formData.content,
          is_published: formData.is_published
        });
        if (res.success) {
          showToast(`Document "${formData.title}" created successfully!`);
          setIsEditorModalOpen(false);
        } else {
          showToast(res.error || 'Failed to create document', 'error');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'An unexpected error occurred', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Toggle Published
  const handleTogglePublish = async (doc: StudentDocument) => {
    const newStatus = !(doc.is_published !== false);
    const res = await updateStudentDocument(doc.id, { is_published: newStatus });
    if (res.success) {
      showToast(`Document "${doc.title}" is now ${newStatus ? 'Published' : 'Hidden/Draft'}.`);
    } else {
      showToast(res.error || 'Failed to update status', 'error');
    }
  };

  // Delete Document
  const handleConfirmDelete = async () => {
    if (!deletingDoc) return;
    setIsDeleting(true);
    try {
      const res = await deleteStudentDocument(deletingDoc.id);
      if (res.success) {
        showToast(`Document "${deletingDoc.title}" deleted.`);
        setDeletingDoc(null);
      } else {
        showToast(res.error || 'Failed to delete document', 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset to Defaults
  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      const res = await resetStudentDocumentsToDefault();
      if (res.success) {
        showToast('Student documents restored to standard residency guides.');
        setIsResetConfirmOpen(false);
      } else {
        showToast(res.error || 'Failed to reset documents', 'error');
      }
    } finally {
      setIsResetting(false);
    }
  };

  // Helper to insert snippet in editor
  const insertContentSnippet = (snippet: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content ? `${prev.content}\n\n${snippet}` : snippet
    }));
  };

  // Category styling helper
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Policy & Safety':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'Arrival & Logistics':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
      case 'Orientation':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
      case 'Official Records':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      case 'Maintenance & Utilities':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 border text-sm font-bold animate-slide-up ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-900 text-white border-emerald-700' 
            : 'bg-red-900 text-white border-red-700'
        }`}>
          {toastMessage.type === 'success' ? (
            <IconCheckCircle className="w-5 h-5 text-emerald-300 shrink-0" />
          ) : (
            <IconAlertTriangle className="w-5 h-5 text-red-300 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-200/50">
                Student Experience & Compliance
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Student Documents & Housing Guides
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-3xl">
              Manage the official residency documents, arrival protocols, rules, and policy manuals displayed directly in the student dashboard&apos;s <strong className="text-gray-800 dark:text-gray-200">Documents</strong> tab. All updates sync instantly to the database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="reset-documents-btn"
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 text-xs font-bold transition-colors flex items-center gap-2"
              title="Reset all documents to the initial standard guides"
            >
              🔄 Reset to Defaults
            </button>
            <button
              id="create-document-btn"
              type="button"
              onClick={handleOpenCreate}
              className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-600/20 flex items-center gap-2"
            >
              <IconFile className="w-4 h-4" />
              <span>Create New Document</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-150 dark:border-gray-750">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Documents</span>
            <span className="text-2xl font-black text-gray-900 dark:text-white mt-1 block">{stats.total}</span>
          </div>
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">Published / Live</span>
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 block">{stats.published}</span>
          </div>
          <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">Draft / Hidden</span>
            <span className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1 block">{stats.drafts}</span>
          </div>
          <div className="bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30">
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider block">Categories</span>
            <span className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1 block">{stats.categoriesCount}</span>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'All'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All ({studentDocuments?.length || 0})
          </button>
          {allCategories.map(cat => {
            const count = (studentDocuments || []).filter(d => d.category === cat).length;
            if (count === 0 && selectedCategory !== cat) return null;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Status Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents..."
              className="w-full text-xs py-2 pl-8 pr-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-500"
            />
            <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs">🔍</span>
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="text-xs py-2 px-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts Only</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredDocuments.map(doc => {
            const isPublished = doc.is_published !== false;
            const wordCount = doc.content ? doc.content.split(/\s+/).filter(Boolean).length : 0;
            const charCount = doc.content ? doc.content.length : 0;

            return (
              <div 
                key={doc.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md ${
                  isPublished 
                    ? 'border-gray-150 dark:border-gray-700' 
                    : 'border-amber-200/70 dark:border-amber-800/40 bg-amber-50/20 dark:bg-amber-950/10'
                }`}
              >
                <div>
                  {/* Top Metadata Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(doc.category)}`}>
                        {doc.category}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md font-mono">
                        {doc.updated || 'Active Guide'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        isPublished
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        {isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug mb-2">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-4">
                    {doc.description || 'No summary description provided.'}
                  </p>

                  {/* Content Preview Box */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-100 dark:border-gray-750 font-mono text-[11px] text-gray-600 dark:text-gray-400 line-clamp-3 mb-4 select-none whitespace-pre-wrap">
                    {doc.content ? doc.content.slice(0, 180) + '...' : '(Empty document content)'}
                  </div>
                </div>

                {/* Footer Info & Actions */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                  <div className="text-[10px] text-gray-400 font-mono">
                    <span>{wordCount} words</span>
                    <span className="mx-1.5">•</span>
                    <span>{charCount} chars</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewingDoc(doc)}
                      className="p-2 rounded-lg text-gray-600 hover:text-brand-600 hover:bg-brand-50 dark:text-gray-400 dark:hover:text-brand-300 dark:hover:bg-brand-950/40 text-xs font-bold transition-colors flex items-center gap-1"
                      title="Preview student document reader"
                    >
                      <IconEye className="w-4 h-4" />
                      <span className="hidden sm:inline">Preview</span>
                    </button>

                    {/* Quick Publish Toggle */}
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(doc)}
                      className={`p-2 rounded-lg text-xs font-bold transition-colors ${
                        isPublished
                          ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      }`}
                      title={isPublished ? 'Unpublish / Hide from students' : 'Publish / Make live to students'}
                    >
                      {isPublished ? '⏸️ Hide' : '▶️ Publish'}
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(doc)}
                      className="bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-brand-200/50"
                    >
                      <IconEdit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setDeletingDoc(doc)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Delete document"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center mx-auto mb-4 text-2xl">
            📁
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No documents match your filters</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
            Try adjusting your search keywords or category filters, or click the button below to create a new student guide.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSelectedStatus('all');
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-xs font-bold"
            >
              + Create New Document
            </button>
          </div>
        </div>
      )}

      {/* CREATE / EDIT DOCUMENT MODAL */}
      {isEditorModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full my-8 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  {editingDoc ? 'Editing Document' : 'New Document Setup'}
                </span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingDoc ? `Edit: ${editingDoc.title}` : 'Create Student Guide & Policy Document'}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {/* Tab Switcher for Split / Edit / Preview */}
                <div className="hidden sm:flex bg-gray-200 dark:bg-gray-700 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setEditorTab('edit')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      editorTab === 'edit' ? 'bg-white dark:bg-gray-800 text-brand-600 shadow-xs' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab('split')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      editorTab === 'split' ? 'bg-white dark:bg-gray-800 text-brand-600 shadow-xs' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    Split View
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab('preview')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      editorTab === 'preview' ? 'bg-white dark:bg-gray-800 text-brand-600 shadow-xs' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    Live Preview
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditorModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <IconClose className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveDocument} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Top Configuration Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Title */}
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Document Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Student Residency Rules & Code of Conduct"
                    className="w-full text-sm p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white font-bold focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Updated / Tag Badge */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Version / Tag Badge
                  </label>
                  <input
                    type="text"
                    value={formData.updated}
                    onChange={(e) => setFormData(prev => ({ ...prev, updated: e.target.value }))}
                    placeholder="e.g., Academic Term 2026, Active Guide"
                    className="w-full text-sm p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white font-medium"
                  />
                </div>

                {/* Category Selector */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full text-sm p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white font-medium"
                  >
                    {PREDEFINED_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="Custom">+ Custom Category...</option>
                  </select>
                </div>

                {/* Custom Category Input if selected */}
                {formData.category === 'Custom' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Custom Category Name
                    </label>
                    <input
                      type="text"
                      value={formData.customCategory}
                      onChange={(e) => setFormData(prev => ({ ...prev, customCategory: e.target.value }))}
                      placeholder="e.g., Health & Clinic Protocol"
                      className="w-full text-sm p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white font-medium"
                    />
                  </div>
                )}

                {/* Publish Toggle */}
                <div className="flex items-center gap-3 pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      {formData.is_published ? 'Published to Students' : 'Save as Draft'}
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      {formData.is_published ? 'Visible in student portal' : 'Hidden from students'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Short Summary Description */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Summary Description (Shown on Student Dashboard Card)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide a concise 1-2 sentence overview of what this document covers..."
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white font-medium leading-relaxed"
                />
              </div>

              {/* Content Editor & Split Preview Section */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Full Document Content (Formatted Text / Markdown)
                  </label>

                  {/* Template Quick Insert Helpers */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-gray-400">Quick Insert:</span>
                    <button
                      type="button"
                      onClick={() => insertContentSnippet('1. SECTION HEADING\n- Detailed rule or procedure item\n- Additional condition')}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-[10px] font-mono font-bold rounded"
                    >
                      + Section Heading
                    </button>
                    <button
                      type="button"
                      onClick={() => insertContentSnippet('IMPORTANT NOTICE:\nAll residents must adhere strictly to building security policies.')}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-[10px] font-mono font-bold rounded"
                    >
                      + Notice Box
                    </button>
                    <button
                      type="button"
                      onClick={() => insertContentSnippet(`CONTACT INFORMATION:\nAdministration: ${landlordDetails?.recipientName || 'Al-Ibaanah Housing Administration'}\nPhone: ${landlordDetails?.phone || '+20 1030062440'}\nEmail: ${landlordDetails?.adminEmail || 'admin@alibaanah.com'}`)}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-[10px] font-mono font-bold rounded"
                    >
                      + Landlord Contacts
                    </button>
                  </div>
                </div>

                {/* Editor / Preview Content Area */}
                <div className={`grid gap-4 ${editorTab === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                  {/* Left: Textarea Editor */}
                  {(editorTab === 'edit' || editorTab === 'split') && (
                    <div className="space-y-1">
                      <textarea
                        rows={16}
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Type full official document content here (supports numbered lists, bullet points, capitalized headers, and paragraphs)..."
                        className="w-full text-xs p-3.5 border rounded-xl font-mono dark:bg-gray-750 dark:border-gray-600 dark:text-gray-100 leading-relaxed focus:ring-2 focus:ring-brand-500 h-[380px] overflow-y-auto"
                      />
                      <p className="text-[10px] text-gray-400 font-mono">
                        {formData.content.length} characters • {formData.content.split(/\s+/).filter(Boolean).length} words
                      </p>
                    </div>
                  )}

                  {/* Right: Live Rendered Preview */}
                  {(editorTab === 'preview' || editorTab === 'split') && (
                    <div className="border rounded-xl bg-gray-50 dark:bg-gray-900/50 p-4 dark:border-gray-700 h-[380px] overflow-y-auto">
                      <div className="flex items-center justify-between pb-2 mb-3 border-b dark:border-gray-700 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        <span>Student View Reader Preview</span>
                        <span className="text-[10px] bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 px-2 py-0.5 rounded font-mono">
                          Live Render
                        </span>
                      </div>

                      <div className="space-y-4 font-sans">
                        <div className="border-b pb-3 dark:border-gray-700">
                          <span className="text-[10px] font-black uppercase tracking-wider text-brand-600">
                            {formData.category === 'Custom' ? formData.customCategory || 'Category' : formData.category}
                          </span>
                          <h3 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                            {formData.title || 'Document Title Preview'}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.description || 'Summary description will appear here.'}
                          </p>
                        </div>

                        <div className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed font-sans bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                          {formData.content || (
                            <span className="text-gray-400 italic">No content written yet. Type in the editor to see live rendering.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-600/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <span className="animate-spin text-sm">⌛</span>
                    ) : (
                      <IconSave className="w-4 h-4" />
                    )}
                    <span>{editingDoc ? 'Save Document Changes' : 'Create & Publish Document'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL STUDENT VIEW PREVIEW MODAL */}
      {previewingDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full my-8 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex items-center gap-2">
                <span className="text-lg">👁️</span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-600">
                    Student Document Reader
                  </span>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    {previewingDoc.title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingDoc(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center gap-2 flex-wrap pb-3 border-b dark:border-gray-700">
                <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(previewingDoc.category)}`}>
                  {previewingDoc.category}
                </span>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 rounded-md font-mono">
                  {previewingDoc.updated || 'Active Guide'}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  Status: {previewingDoc.is_published !== false ? '✅ Published' : '⚠️ Draft / Hidden'}
                </span>
              </div>

              {previewingDoc.description && (
                <div className="bg-brand-50/40 dark:bg-brand-950/20 p-3.5 rounded-xl border border-brand-100 dark:border-brand-900/30 text-xs text-brand-900 dark:text-brand-200">
                  <span className="font-bold block mb-0.5">Summary / Overview:</span>
                  <p>{previewingDoc.description}</p>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {previewingDoc.content}
                </pre>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <button
                type="button"
                onClick={() => {
                  setPreviewingDoc(null);
                  handleOpenEdit(previewingDoc);
                }}
                className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
              >
                <IconEdit className="w-3.5 h-3.5" /> Edit this document
              </button>

              <button
                type="button"
                onClick={() => setPreviewingDoc(null)}
                className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto text-xl">
              <IconTrash className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Delete Student Document?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Are you sure you want to permanently delete <strong className="text-gray-800 dark:text-gray-200">&ldquo;{deletingDoc.title}&rdquo;</strong>? Students will no longer be able to view or download this document from their dashboard.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET TO DEFAULTS CONFIRMATION MODAL */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mx-auto text-xl">
              <IconAlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Reset to Standard Guides?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This will reset the student documents list to the 4 default official guides (House Rules, Check-In Protocol, Cairo Transit Guide, and Distance Enrolment Letter).
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isResetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
