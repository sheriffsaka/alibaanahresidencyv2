import React, { useState, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { IconFile, IconCheckCircle, IconBuilding, IconInfo, IconEye } from '../components/Icon';
import AgreementModal from '../components/AgreementModal';
import { Booking, StudentDocument, Language } from '../types';
import { DEFAULT_STUDENT_DOCUMENTS } from '../contexts/AppContext';
import { STUDENT_HANDBOOK_TRANSLATIONS, OFFICIAL_STUDENT_HANDBOOK_DOCUMENT } from '../lib/studentHandbookData';

const LANGUAGE_LABELS: Record<Language, { label: string; nativeName: string; flag: string }> = {
  en: { label: 'English', nativeName: 'English', flag: '🇬🇧' },
  ar: { label: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  fr: { label: 'French', nativeName: 'Français', flag: '🇫🇷' },
  ru: { label: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  uz: { label: 'Uzbek', nativeName: "O'zbekcha", flag: '🇺🇿' },
  zh: { label: 'Chinese', nativeName: '中文', flag: '🇨🇳' }
};

const DocumentsPage: React.FC = () => {
  const { user, bookings, studentDocuments, cmsContent, language: appLanguage } = useApp();
  const [viewingAgreement, setViewingAgreement] = useState<Booking | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(appLanguage || 'en');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isHandbookModalOpen, setIsHandbookModalOpen] = useState<boolean>(false);
  const [activeHandbookChapterId, setActiveHandbookChapterId] = useState<string>('all');
  const [viewingDocumentModal, setViewingDocumentModal] = useState<{
    id: string;
    title: string;
    category?: string;
    updated?: string;
    description?: string;
    content: string;
    translations?: StudentDocument['translations'];
  } | null>(null);

  const signedBookings = (bookings || []).filter(
    b => b.student_id === user?.id && b.signature_data
  );

  // Active documents from AppContext (with fallback)
  const activeDocuments: StudentDocument[] = useMemo(() => {
    const rawList = (studentDocuments && studentDocuments.length > 0)
      ? studentDocuments
      : (cmsContent?.studentDocuments && cmsContent.studentDocuments.length > 0)
        ? cmsContent.studentDocuments
        : DEFAULT_STUDENT_DOCUMENTS;

    // Filter only published documents for students
    return rawList.filter(d => d.is_published !== false);
  }, [studentDocuments, cmsContent]);

  // Separate handbook from general policy documents for special spotlight
  const handbookDoc = useMemo(() => {
    return activeDocuments.find(d => d.id === 'student-accommodation-handbook' || d.is_handbook) || OFFICIAL_STUDENT_HANDBOOK_DOCUMENT;
  }, [activeDocuments]);

  const currentHandbookTranslation = useMemo(() => {
    return STUDENT_HANDBOOK_TRANSLATIONS[selectedLanguage] || STUDENT_HANDBOOK_TRANSLATIONS.en;
  }, [selectedLanguage]);

  // Unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    activeDocuments.forEach(d => {
      if (d.category) set.add(d.category);
    });
    return Array.from(set);
  }, [activeDocuments]);

  // Helper to get localized document fields
  const getLocalizedDoc = (doc: StudentDocument, lang: Language) => {
    const translation = doc.translations?.[lang];
    if (translation && translation.title && translation.content) {
      return {
        title: translation.title,
        category: translation.category || doc.category,
        updated: translation.updated || doc.updated,
        description: translation.description || doc.description,
        content: translation.content
      };
    }

    // Special case for handbook translation library
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

    return {
      title: doc.title,
      category: doc.category,
      updated: doc.updated,
      description: doc.description,
      content: doc.content
    };
  };

  // Filtered by selected category and search query
  const filteredDocuments = useMemo(() => {
    return activeDocuments.filter(d => {
      const loc = getLocalizedDoc(d, selectedLanguage);
      const matchesCategory = selectedCategoryFilter === 'All' || d.category === selectedCategoryFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        loc.title.toLowerCase().includes(query) ||
        loc.description.toLowerCase().includes(query) ||
        loc.content.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeDocuments, selectedCategoryFilter, searchQuery, selectedLanguage]);

  // Category styling helper
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Policy & Safety':
      case 'السياسات والسلامة':
      case 'Règlement & Sécurité':
      case 'Правила и безопасность':
      case 'Qoidalar va xavfsizlik':
      case '政策与安全':
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

  const isRTL = selectedLanguage === 'ar';

  const handlePrintHandbook = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const hb = currentHandbookTranslation;
    const isArabic = selectedLanguage === 'ar';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isArabic ? 'rtl' : 'ltr'}" lang="${selectedLanguage}">
      <head>
        <title>${hb.title} - Al Ibaanah Arabic Centre</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; }
          h1 { color: #166534; font-size: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 5px; }
          .sub { color: #4b5563; font-size: 14px; margin-bottom: 25px; }
          .bismillah { text-align: center; font-size: 20px; font-weight: bold; color: #166534; margin: 20px 0; }
          pre { white-space: pre-wrap; font-family: inherit; font-size: 13px; line-height: 1.65; }
          .meta { background: #f9fafb; border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; font-size: 12px; margin-bottom: 20px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="bismillah">${hb.bismillah}</div>
        <h1>${hb.title}</h1>
        <div class="sub">${hb.subtitle}</div>
        <div class="meta">
          <strong>Official Publication:</strong> Al Ibaanah Arabic Centre | <strong>Version:</strong> ${hb.version} (${hb.effectiveDate}) | <strong>Approved by:</strong> ${hb.approvedBy}
        </div>
        <pre>${hb.fullMarkdown}</pre>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header & Multilingual Selector */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 text-xs font-black uppercase tracking-widest mb-1">
            <IconFile className="w-4 h-4" /> Official Residency Records & Handbook
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            {isRTL ? 'وثائق السكن ودليل الطلاب' : 'Residency Documents & Handbook'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isRTL 
              ? 'دليل سكن طلاب مركز الإبانة بجميع اللغات، العقود الموقعة، واللوائح الإرشادية المعتمدة.'
              : 'Access your executed tenancy contracts, official student handbook in multiple languages, and house policies.'}
          </p>
        </div>

        {/* Global Document Language Switcher */}
        <div className="flex flex-col sm:items-end gap-1.5 bg-gray-50 dark:bg-gray-900/60 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Document Language / لغة الوثائق
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            {(Object.keys(LANGUAGE_LABELS) as Language[]).map(langKey => {
              const info = LANGUAGE_LABELS[langKey];
              const isSelected = selectedLanguage === langKey;
              return (
                <button
                  key={langKey}
                  type="button"
                  onClick={() => setSelectedLanguage(langKey)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-xs scale-105'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                  title={info.label}
                >
                  <span>{info.flag}</span>
                  <span className="text-[11px]">{info.nativeName}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* FEATURED SPOTLIGHT: OFFICIAL STUDENT ACCOMMODATION HANDBOOK */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-brand-700/50">
        {/* Decorative Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-widest rounded-full">
                ★ Primary Residency Publication
              </span>
              <span className="px-2.5 py-1 bg-white/10 text-white/90 text-[10px] font-bold rounded-full font-mono">
                {currentHandbookTranslation.version} • {currentHandbookTranslation.effectiveDate}
              </span>
            </div>

            {/* Language Switcher inside Spotlight */}
            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-xs p-1 rounded-xl border border-white/10">
              {(Object.keys(LANGUAGE_LABELS) as Language[]).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setSelectedLanguage(l)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedLanguage === l
                      ? 'bg-amber-400 text-brand-950 shadow-xs'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {LANGUAGE_LABELS[l].flag} {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className={`space-y-3 ${isRTL ? 'text-right font-arabic' : 'text-left'}`}>
            <div className="text-amber-300 font-bold text-base sm:text-lg tracking-wide">
              {currentHandbookTranslation.bismillah}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
              {currentHandbookTranslation.title}
            </h2>
            <p className="text-sm sm:text-base text-brand-100/90 font-medium max-w-3xl leading-relaxed">
              {currentHandbookTranslation.subtitle}
            </p>
            <p className="text-xs sm:text-sm text-white/70 max-w-3xl leading-relaxed">
              {currentHandbookTranslation.description}
            </p>
          </div>

          {/* Quick Chapter Chips */}
          <div className="space-y-2 pt-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/60">
              {isRTL ? 'الفصول والأقسام الرئيسية:' : 'Handbook Chapters & Quick Access:'}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {currentHandbookTranslation.chapters.map(ch => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    setActiveHandbookChapterId(ch.id);
                    setIsHandbookModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-semibold text-white/95 transition-all text-left flex items-center gap-1.5"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-[10px] font-mono font-bold">
                    {ch.number}
                  </span>
                  <span>{ch.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setActiveHandbookChapterId('all');
                setIsHandbookModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-brand-950 text-sm font-black rounded-2xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
            >
              <IconEye className="w-4 h-4" />
              <span>{isRTL ? 'فتح وقراءة الدليل بالكامل' : 'Read Complete Handbook'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintHandbook}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl border border-white/20 transition-colors"
            >
              <span>🖨️ {isRTL ? 'طباعة / تصدير PDF' : 'Print / Export PDF'}</span>
            </button>

            <div className="text-[11px] text-white/60 ml-auto hidden sm:block">
              {currentHandbookTranslation.approvedBy}
            </div>
          </div>
        </div>
      </div>

      {/* Signed Agreements Section */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
          <IconCheckCircle className="w-5 h-5 text-emerald-500" />
          <span>{isRTL ? 'عقود الإيجار الموقعة والمسجلة' : 'Your Executed Tenancy Contracts'}</span>
        </h2>

        {signedBookings.length === 0 ? (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center text-xs text-gray-500 space-y-2">
            <p>{isRTL ? 'لم تقم بتوقيع عقد إيجار حتى الآن.' : 'You have not signed a tenancy contract yet.'}</p>
            <p className="text-gray-400">
              {isRTL 
                ? 'يتم إصدار وتوقيع العقود رقمياً فور تأكيد حجز الغرفة.'
                : 'Contracts are generated automatically upon completing a room booking submission.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {signedBookings.map(b => (
              <div key={b.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200/50">
                      Signed & Legally Executed
                    </span>
                    <span className="text-xs font-black text-brand-600">BK{b.id}</span>
                  </div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">
                    Tenancy Agreement – {b.rooms?.apartment_name || 'Al-Ibaanah Residences'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Student: {b.full_name} | Signed on: {b.contract_signed_at ? new Date(b.contract_signed_at).toLocaleDateString() : 'Recorded'}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">Digital Signature Verified</span>
                  <button
                    onClick={() => setViewingAgreement(b)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400 text-xs font-bold transition-colors"
                  >
                    <IconFile className="w-3.5 h-3.5" />
                    <span>View Agreement</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Official Guides & House Policies Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <IconBuilding className="w-5 h-5 text-brand-600" />
              <span>{isRTL ? 'الأدلة واللوائح المنشورة' : 'Housing Policies & Arrival Guides'}</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isRTL ? `المستندات معروضة باللغة: ${LANGUAGE_LABELS[selectedLanguage].nativeName}` : `Documents displayed in: ${LANGUAGE_LABELS[selectedLanguage].label}`}
            </p>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'بحث في المستندات...' : 'Search documents...'}
              className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 w-full sm:w-48"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        {categories.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('All')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategoryFilter === 'All'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All ({activeDocuments.length})
            </button>
            {categories.map(cat => {
              const count = activeDocuments.filter(d => d.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategoryFilter === cat
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}

        {filteredDocuments.length === 0 ? (
          <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center text-xs text-gray-500">
            {isRTL ? 'لا توجد مستندات مطابقة للبحث.' : 'No documents match your filters.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocuments.map(doc => {
              const loc = getLocalizedDoc(doc, selectedLanguage);
              const isHandbook = doc.id === 'student-accommodation-handbook' || doc.is_handbook;

              return (
                <div 
                  key={doc.id} 
                  className={`bg-white dark:bg-gray-800 p-5 rounded-2xl border ${
                    isHandbook ? 'border-amber-200 dark:border-amber-900/50 ring-1 ring-amber-400/20' : 'border-gray-100 dark:border-gray-700'
                  } shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border ${getCategoryBadgeClass(loc.category)}`}>
                          {loc.category}
                        </span>
                        {isHandbook && (
                          <span className="px-2 py-0.5 text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 rounded-full border border-amber-300/40">
                            ★ Handbook
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-mono">
                        {loc.updated || 'Active Guide'}
                      </span>
                    </div>

                    <h3 className={`text-sm font-black text-gray-900 dark:text-white leading-snug ${isRTL ? 'font-arabic text-right' : ''}`}>
                      {loc.title}
                    </h3>
                    <p className={`text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed line-clamp-3 ${isRTL ? 'font-arabic text-right' : ''}`}>
                      {loc.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400">Available in:</span>
                      <span className="text-[10px] font-bold text-brand-600 bg-brand-50 dark:bg-brand-950/40 px-1.5 py-0.5 rounded">
                        6 Languages
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (isHandbook) {
                          setActiveHandbookChapterId('all');
                          setIsHandbookModalOpen(true);
                        } else {
                          setViewingDocumentModal({ 
                            id: doc.id,
                            title: loc.title, 
                            category: loc.category,
                            updated: loc.updated,
                            description: loc.description,
                            content: loc.content,
                            translations: doc.translations
                          });
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold transition-colors"
                    >
                      <IconEye className="w-3.5 h-3.5 text-gray-500" />
                      <span>{isRTL ? 'قراءة المستند' : 'Read Document'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COMPLETE STUDENT HANDBOOK MODAL (MULTILINGUAL WITH CHAPTER NAVIGATOR) */}
      {isHandbookModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-fade-in">
            {/* Modal Top Header */}
            <div className="px-6 py-4 bg-brand-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-brand-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-brand-950 flex items-center justify-center font-black text-lg shadow-sm">
                  📖
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                    Al Ibaanah Arabic Centre
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    {currentHandbookTranslation.title}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Language Switcher inside Modal */}
                <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/10">
                  {(Object.keys(LANGUAGE_LABELS) as Language[]).map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setSelectedLanguage(l)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedLanguage === l
                          ? 'bg-amber-400 text-brand-950 shadow-xs'
                          : 'text-white/80 hover:text-white'
                      }`}
                      title={LANGUAGE_LABELS[l].label}
                    >
                      {LANGUAGE_LABELS[l].flag}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handlePrintHandbook}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold hidden sm:inline-flex items-center gap-1"
                >
                  <span>🖨️ Print</span>
                </button>

                <button 
                  onClick={() => setIsHandbookModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Sub-header Bar with Bismillah & Chapter Navigation Pills */}
            <div className="bg-gray-50 dark:bg-gray-800/80 px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-center sm:text-left">
                <span className="text-brand-700 dark:text-brand-300 font-bold text-xs">
                  {currentHandbookTranslation.bismillah}
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-2">
                  ({currentHandbookTranslation.bismillahTranslation})
                </span>
              </div>

              {/* Chapter Filter Tab Buttons */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setActiveHandbookChapterId('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeHandbookChapterId === 'all'
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                  }`}
                >
                  {isRTL ? 'الكل' : 'Full Text'}
                </button>
                {currentHandbookTranslation.chapters.map(ch => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setActiveHandbookChapterId(ch.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      activeHandbookChapterId === ch.id
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                    }`}
                  >
                    {ch.number}. {ch.title.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Reading Content Area */}
            <div className={`p-6 overflow-y-auto flex-1 text-gray-800 dark:text-gray-200 leading-relaxed ${isRTL ? 'font-arabic text-right' : 'text-left'}`}>
              {activeHandbookChapterId === 'all' ? (
                <div className="space-y-6">
                  {/* Full Text View */}
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                    <IconInfo className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold mb-0.5">
                        {isRTL ? 'المرجع الرسمي للسكن الطلابي:' : 'Official Student Residency Reference:'}
                      </strong>
                      <span>
                        {isRTL 
                          ? 'هذا الدليل ينظم كافة الجوانب السلوكية والحياة المشتركة في سكن طلاب مركز الإبانة. نرجو من جميع الإخوة قراءته بعناية والالتزام بمحتواه.'
                          : 'This handbook governs all day-to-day conduct and community life within Al Ibaanah Student Accommodation. All residents are required to observe its guidance.'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 font-sans text-xs whitespace-pre-wrap leading-loose">
                    {currentHandbookTranslation.fullMarkdown}
                  </div>
                </div>
              ) : (
                /* Single Chapter View */
                (() => {
                  const currentCh = currentHandbookTranslation.chapters.find(c => c.id === activeHandbookChapterId);
                  if (!currentCh) return null;
                  return (
                    <div className="space-y-4">
                      <div className="p-4 bg-brand-50 dark:bg-brand-950/30 rounded-2xl border border-brand-100 dark:border-brand-900/40">
                        <span className="text-[10px] font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">
                          {isRTL ? `الفصل ${currentCh.number}` : `Chapter ${currentCh.number}`}
                        </span>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
                          {currentCh.title}
                        </h3>
                      </div>

                      <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 font-sans text-xs whitespace-pre-wrap leading-loose">
                        {currentCh.content}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button
                          type="button"
                          onClick={() => setActiveHandbookChapterId('all')}
                          className="text-xs text-brand-600 font-bold hover:underline"
                        >
                          ← {isRTL ? 'عرض كامل الدليل' : 'View Full Complete Handbook'}
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                {currentHandbookTranslation.updated}
              </div>
              <button
                type="button"
                onClick={() => setIsHandbookModalOpen(false)}
                className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                {isRTL ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GENERAL DOCUMENT READER MODAL */}
      {viewingDocumentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[85vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 gap-3">
              <div>
                {viewingDocumentModal.category && (
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border inline-block mb-1 ${getCategoryBadgeClass(viewingDocumentModal.category)}`}>
                    {viewingDocumentModal.category}
                  </span>
                )}
                <h3 className="text-base font-black text-gray-900 dark:text-white">{viewingDocumentModal.title}</h3>
              </div>

              {/* Language Switcher inside reader modal */}
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                  {(Object.keys(LANGUAGE_LABELS) as Language[]).map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => {
                        setSelectedLanguage(l);
                        const trans = viewingDocumentModal.translations?.[l];
                        if (trans && trans.title && trans.content) {
                          setViewingDocumentModal(prev => prev ? {
                            ...prev,
                            title: trans.title || prev.title,
                            category: trans.category || prev.category,
                            updated: trans.updated || prev.updated,
                            description: trans.description || prev.description,
                            content: trans.content
                          } : null);
                        }
                      }}
                      className={`px-1.5 py-0.5 rounded-lg text-xs font-bold transition-all ${
                        selectedLanguage === l ? 'bg-brand-600 text-white shadow-xs' : 'text-gray-600 dark:text-gray-300'
                      }`}
                      title={LANGUAGE_LABELS[l].label}
                    >
                      {LANGUAGE_LABELS[l].flag}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setViewingDocumentModal(null)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {viewingDocumentModal.description && (
              <div className="my-3 p-3 bg-brand-50/50 dark:bg-brand-950/20 rounded-xl border border-brand-100 dark:border-brand-900/30 text-xs text-brand-900 dark:text-brand-200 leading-relaxed">
                {viewingDocumentModal.description}
              </div>
            )}

            <div className={`py-4 overflow-y-auto flex-1 font-sans text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-100 dark:border-gray-700 ${isRTL ? 'font-arabic text-right' : 'text-left'}`}>
              {viewingDocumentModal.content}
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setViewingDocumentModal(null)}
                className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tenancy Agreement Modal */}
      {viewingAgreement && (
        <AgreementModal 
          booking={viewingAgreement}
          onClose={() => setViewingAgreement(null)}
          isReadOnly={true}
        />
      )}
    </div>
  );
};

export default DocumentsPage;
