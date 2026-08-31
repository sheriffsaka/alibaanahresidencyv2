import React, { useState, useMemo } from 'react';
import { useApp } from '../../hooks/useApp';
import { StudentDocument, Language } from '../../types';
import { DEFAULT_STUDENT_DOCUMENTS } from '../../contexts/AppContext';
import { STUDENT_HANDBOOK_TRANSLATIONS, OFFICIAL_STUDENT_HANDBOOK_DOCUMENT } from '../../lib/studentHandbookData';
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

const ADMIN_LANGUAGES: { key: Language; label: string; flag: string }[] = [
  { key: 'en', label: 'English', flag: '🇬🇧' },
  { key: 'ar', label: 'العربية (Arabic)', flag: '🇸🇦' },
  { key: 'fr', label: 'Français (French)', flag: '🇫🇷' },
  { key: 'ru', label: 'Русский (Russian)', flag: '🇷🇺' },
  { key: 'uz', label: "O'zbekcha (Uzbek)", flag: '🇺🇿' },
  { key: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' }
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
  const [previewLanguage, setPreviewLanguage] = useState<Language>('en');
  const [deletingDoc, setDeletingDoc] = useState<StudentDocument | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Active translation language in Editor
  const [activeEditLang, setActiveEditLang] = useState<Language>('en');

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
    is_handbook?: boolean;
    translations: Partial<Record<Language, {
      title?: string;
      category?: string;
      updated?: string;
      description?: string;
      content?: string;
    }>>;
  }>({
    id: '',
    title: '',
    category: 'Policy & Safety',
    customCategory: '',
    updated: 'Active Guide',
    description: '',
    content: '',
    is_published: true,
    is_handbook: false,
    translations: {}
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
    setActiveEditLang('en');
    setFormData({
      id: '',
      title: '',
      category: 'Policy & Safety',
      customCategory: '',
      updated: 'Active Guide',
      description: '',
      content: '',
      is_published: true,
      is_handbook: false,
      translations: {}
    });
    setEditorTab('split');
    setIsEditorModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (doc: StudentDocument) => {
    setEditingDoc(doc);
    setActiveEditLang('en');
    const isCustomCat = !PREDEFINED_CATEGORIES.includes(doc.category);
    setFormData({
      id: doc.id,
      title: doc.title,
      category: isCustomCat ? 'Custom' : doc.category,
      customCategory: isCustomCat ? doc.category : '',
      updated: doc.updated || 'Active Guide',
      description: doc.description || '',
      content: doc.content || '',
      is_published: doc.is_published !== false,
      is_handbook: doc.is_handbook || doc.id === 'student-accommodation-handbook',
      translations: doc.translations || (doc.id === 'student-accommodation-handbook' ? OFFICIAL_STUDENT_HANDBOOK_DOCUMENT.translations || {} : {})
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
          is_published: formData.is_published,
          is_handbook: formData.is_handbook,
          translations: formData.translations
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
          is_published: formData.is_published,
          is_handbook: formData.is_handbook,
          translations: formData.translations
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
        showToast('Student documents restored to official defaults (including Student Handbook)!');
        setIsResetConfirmOpen(false);
      } else {
        showToast(res.error || 'Failed to reset documents', 'error');
      }
    } finally {
      setIsResetting(false);
    }
  };

  // Quick snippets insert helper
  const insertContentSnippet = (snippet: string) => {
    if (activeEditLang === 'en') {
      setFormData(prev => ({
        ...prev,
        content: prev.content ? `${prev.content}\n\n${snippet}` : snippet
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        translations: {
          ...prev.translations,
          [activeEditLang]: {
            ...prev.translations[activeEditLang],
            content: prev.translations[activeEditLang]?.content 
              ? `${prev.translations[activeEditLang]?.content}\n\n${snippet}` 
              : snippet
          }
        }
      }));
    }
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

  // Helper for current preview content in the preview modal
  const getPreviewLocalized = (doc: StudentDocument, lang: Language) => {
    if (doc.id === 'student-accommodation-handbook' || doc.is_handbook) {
      const hb = STUDENT_HANDBOOK_TRANSLATIONS[lang] || STUDENT_HANDBOOK_TRANSLATIONS.en;
      return {
        title: hb.title,
        category: hb.category,
        updated: hb.updated,
        description: hb.description,
        content: hb.fullMarkdown
      };
    }
    const t = doc.translations?.[lang];
    if (t && t.content) {
      return {
        title: t.title || doc.title,
        category: t.category || doc.category,
        updated: t.updated || doc.updated,
        description: t.description || doc.description,
        content: t.content
      };
    }
    return {
      title: doc.title,
      category: doc.category,
      updated: doc.updated,
      description: doc.description,
      content: doc.content
    };
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div 
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold transition-all animate-bounce ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-600 text-white border-emerald-500' 
              : 'bg-red-600 text-white border-red-500'
          }`}
        >
          {toastMessage.type === 'success' ? <IconCheckCircle className="w-5 h-5" /> : <IconAlertTriangle className="w-5 h-5" />}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-80">✕</button>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 text-xs font-black uppercase tracking-wider mb-1">
            <IconFile className="w-4 h-4" /> Content Management & Policies
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            Student Documents & Multi-Language Handbook
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
            Publish official residency rules, house protocols, and the multilingual Student Accommodation Handbook (English, Arabic, French, Russian, Uzbek, Chinese).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            title="Reset documents to default residency templates"
          >
            ↺ Restore Defaults
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span>+ Create New Guide</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Documents</span>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.total}</div>
          <span className="text-[10px] text-gray-400">Official residency records</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Published Live</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats.published}</div>
          <span className="text-[10px] text-emerald-600/80">Visible to active students</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Drafts / Hidden</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{stats.drafts}</div>
          <span className="text-[10px] text-gray-400">Unreleased documents</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
          <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider block">Supported Languages</span>
          <div className="text-2xl font-black text-brand-600 mt-1">6</div>
          <span className="text-[10px] text-brand-600/80">EN, AR, FR, RU, UZ, ZH</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-xs">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, keyword, or body..."
            className="w-full text-xs pl-8 pr-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-between md:justify-end">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs p-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="All">All Categories ({allCategories.length})</option>
            {allCategories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedStatus('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedStatus === 'all' ? 'bg-white dark:bg-gray-800 text-brand-600 shadow-xs' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('published')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedStatus === 'published' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow-xs' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Published
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('draft')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedStatus === 'draft' ? 'bg-white dark:bg-gray-800 text-amber-600 shadow-xs' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Drafts
            </button>
          </div>
        </div>
      </div>

      {/* Document Grid / Table View */}
      {filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocuments.map((doc) => {
            const isPublished = doc.is_published !== false;
            const isHandbook = doc.id === 'student-accommodation-handbook' || doc.is_handbook;
            const charCount = doc.content ? doc.content.length : 0;
            const lineCount = doc.content ? doc.content.split('\n').length : 0;

            return (
              <div
                key={doc.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl border ${
                  isHandbook 
                    ? 'border-amber-300 dark:border-amber-800 ring-2 ring-amber-400/20' 
                    : 'border-gray-100 dark:border-gray-700'
                } p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between`}
              >
                <div>
                  {/* Top Row: Category + Version + Status */}
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(doc.category)}`}>
                        {doc.category}
                      </span>
                      {isHandbook && (
                        <span className="px-2 py-0.5 text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 rounded-full border border-amber-300">
                          ★ Handbook (6 Langs)
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md font-mono">
                        {doc.updated || 'Active Guide'}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isPublished 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300' 
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}>
                      {isPublished ? '● Published' : '○ Draft'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">
                    {doc.title}
                  </h3>

                  {doc.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                      {doc.description}
                    </p>
                  )}

                  {/* Snippet Preview */}
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700/50 text-[11px] font-mono text-gray-600 dark:text-gray-300 line-clamp-3 whitespace-pre-wrap">
                    {doc.content}
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="text-[10px] text-gray-400 font-mono">
                    <span>{lineCount} lines</span> • <span>{charCount} chars</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewingDoc(doc);
                        setPreviewLanguage('en');
                      }}
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

      {/* CREATE / EDIT DOCUMENT MODAL (WITH MULTI-LANGUAGE TABS) */}
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

            {/* Language Switcher Bar in Editor */}
            <div className="px-6 py-2.5 bg-brand-50/60 dark:bg-brand-950/30 border-b border-brand-100 dark:border-brand-900/40 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-900 dark:text-brand-200">
                  Editing Language:
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {ADMIN_LANGUAGES.map(lang => {
                    const isSelected = activeEditLang === lang.key;
                    const hasTranslation = lang.key === 'en' || !!formData.translations[lang.key]?.content;
                    return (
                      <button
                        key={lang.key}
                        type="button"
                        onClick={() => setActiveEditLang(lang.key)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          isSelected 
                            ? 'bg-brand-600 text-white shadow-xs' 
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.label.split(' ')[0]}</span>
                        {hasTranslation && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <span className="text-[11px] text-brand-700 dark:text-brand-300 font-medium">
                {activeEditLang === 'en' ? 'Base Master Language (English)' : `Custom Translation for ${activeEditLang.toUpperCase()}`}
              </span>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveDocument} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Top Configuration Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Title */}
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Document Title ({activeEditLang.toUpperCase()}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={
                      activeEditLang === 'en' 
                        ? formData.title 
                        : (formData.translations[activeEditLang]?.title ?? formData.title)
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (activeEditLang === 'en') {
                        setFormData(prev => ({ ...prev, title: val }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          translations: {
                            ...prev.translations,
                            [activeEditLang]: {
                              ...prev.translations[activeEditLang],
                              title: val
                            }
                          }
                        }));
                      }
                    }}
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
                    value={
                      activeEditLang === 'en' 
                        ? formData.updated 
                        : (formData.translations[activeEditLang]?.updated ?? formData.updated)
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (activeEditLang === 'en') {
                        setFormData(prev => ({ ...prev, updated: val }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          translations: {
                            ...prev.translations,
                            [activeEditLang]: {
                              ...prev.translations[activeEditLang],
                              updated: val
                            }
                          }
                        }));
                      }
                    }}
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
                  Summary Description ({activeEditLang.toUpperCase()})
                </label>
                <textarea
                  rows={2}
                  value={
                    activeEditLang === 'en' 
                      ? formData.description 
                      : (formData.translations[activeEditLang]?.description ?? formData.description)
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (activeEditLang === 'en') {
                      setFormData(prev => ({ ...prev, description: val }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        translations: {
                          ...prev.translations,
                          [activeEditLang]: {
                            ...prev.translations[activeEditLang],
                            description: val
                          }
                        }
                      }));
                    }
                  }}
                  placeholder="Provide a concise 1-2 sentence overview of what this document covers..."
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white font-medium leading-relaxed"
                />
              </div>

              {/* Content Editor & Split Preview Section */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Full Document Content ({activeEditLang.toUpperCase()})
                  </label>
                  
                  {/* Quick Format Tools */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => insertContentSnippet('SECTION TITLE:\n- Rule item 1\n- Rule item 2')}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-[10px] font-mono font-bold rounded"
                    >
                      + Section Heading
                    </button>
                    <button
                      type="button"
                      onClick={() => insertContentSnippet('IMPORTANT NOTICE:\nAll students are required to follow this policy strictly.')}
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Editor Side */}
                  {(editorTab === 'edit' || editorTab === 'split') && (
                    <div className={editorTab === 'edit' ? 'lg:col-span-2' : ''}>
                      <textarea
                        rows={14}
                        required={activeEditLang === 'en'}
                        value={
                          activeEditLang === 'en' 
                            ? formData.content 
                            : (formData.translations[activeEditLang]?.content ?? '')
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (activeEditLang === 'en') {
                            setFormData(prev => ({ ...prev, content: val }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              translations: {
                                ...prev.translations,
                                [activeEditLang]: {
                                  ...prev.translations[activeEditLang],
                                  content: val
                                }
                              }
                            }));
                          }
                        }}
                        dir={activeEditLang === 'ar' ? 'rtl' : 'ltr'}
                        placeholder={activeEditLang === 'ar' ? 'أدخل نص المستند باللغة العربية هنا...' : 'Write or paste the full document text here...'}
                        className="w-full text-xs font-mono p-3 border rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white leading-relaxed focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  )}

                  {/* Preview Side */}
                  {(editorTab === 'preview' || editorTab === 'split') && (
                    <div className={`${editorTab === 'preview' ? 'lg:col-span-2' : ''} bg-gray-50 dark:bg-gray-900/60 rounded-xl p-4 border border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[350px]`}>
                      <div className="border-b dark:border-gray-700 pb-2 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block">
                          Previewing ({activeEditLang.toUpperCase()} View)
                        </span>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          {activeEditLang === 'en' ? formData.title : (formData.translations[activeEditLang]?.title || formData.title)}
                        </h4>
                      </div>
                      <div 
                        dir={activeEditLang === 'ar' ? 'rtl' : 'ltr'}
                        className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans leading-relaxed"
                      >
                        {activeEditLang === 'en' 
                          ? (formData.content || 'Document content will appear here...')
                          : (formData.translations[activeEditLang]?.content || `No ${activeEditLang.toUpperCase()} translation entered yet. Defaults to base English.`)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
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
                    className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-brand-600/20 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <span className="animate-spin text-sm">⏳</span>
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
                    {getPreviewLocalized(previewingDoc, previewLanguage).title}
                  </h2>
                </div>
              </div>

              {/* Language Switcher in Preview */}
              <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-xl">
                {ADMIN_LANGUAGES.map(l => (
                  <button
                    key={l.key}
                    type="button"
                    onClick={() => setPreviewLanguage(l.key)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                      previewLanguage === l.key ? 'bg-brand-600 text-white shadow-xs' : 'text-gray-700 dark:text-gray-300'
                    }`}
                    title={l.label}
                  >
                    {l.flag} {l.key.toUpperCase()}
                  </button>
                ))}
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
              {(() => {
                const loc = getPreviewLocalized(previewingDoc, previewLanguage);
                const isArabic = previewLanguage === 'ar';
                return (
                  <>
                    <div className="flex items-center gap-2 flex-wrap pb-3 border-b dark:border-gray-700">
                      <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(loc.category)}`}>
                        {loc.category}
                      </span>
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 rounded-md font-mono">
                        {loc.updated || 'Active Guide'}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">
                        Status: {previewingDoc.is_published !== false ? '✅ Published' : '⚠️ Draft / Hidden'}
                      </span>
                    </div>

                    {loc.description && (
                      <div className="bg-brand-50/40 dark:bg-brand-950/20 p-3.5 rounded-xl border border-brand-100 dark:border-brand-900/30 text-xs text-brand-900 dark:text-brand-200">
                        <span className="font-bold block mb-0.5">Summary / Overview:</span>
                        <p>{loc.description}</p>
                      </div>
                    )}

                    <div className={`bg-gray-50 dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 ${isArabic ? 'font-arabic text-right' : 'text-left'}`}>
                      <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                        {loc.content}
                      </pre>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <button
                type="button"
                onClick={() => {
                  const docToEdit = previewingDoc;
                  setPreviewingDoc(null);
                  handleOpenEdit(docToEdit);
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
                Reset to Standard Guides & Handbook?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This will reset the student documents list to the official default guides (including the 6-language Student Accommodation Handbook, House Rules, Check-In Protocol, Cairo Transit Guide, and Distance Enrolment Letter).
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
