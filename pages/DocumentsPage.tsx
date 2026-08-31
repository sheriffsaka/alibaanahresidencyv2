import React, { useState, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { IconFile, IconCheckCircle, IconBuilding, IconInfo } from '../components/Icon';
import AgreementModal from '../components/AgreementModal';
import { Booking, StudentDocument } from '../types';
import { DEFAULT_STUDENT_DOCUMENTS } from '../contexts/AppContext';

const DocumentsPage: React.FC = () => {
  const { user, bookings, landlordDetails, studentDocuments, cmsContent } = useApp();
  const [viewingAgreement, setViewingAgreement] = useState<Booking | null>(null);
  const [viewingDocumentModal, setViewingDocumentModal] = useState<{ title: string; category?: string; updated?: string; description?: string; content: string } | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

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

  // Unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    activeDocuments.forEach(d => {
      if (d.category) set.add(d.category);
    });
    return Array.from(set);
  }, [activeDocuments]);

  // Filtered by selected category
  const filteredDocuments = useMemo(() => {
    if (selectedCategoryFilter === 'All') return activeDocuments;
    return activeDocuments.filter(d => d.category === selectedCategoryFilter);
  }, [activeDocuments, selectedCategoryFilter]);

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
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 text-xs font-black uppercase tracking-widest mb-1">
          <IconFile className="w-4 h-4" /> Official Residency Records
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Residency Documents & Agreements</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Access your executed tenancy contracts, house rules, arrival check-in guides, and official residency records.
        </p>
      </div>

      {/* Signed Agreements Section */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
          <IconCheckCircle className="w-5 h-5 text-emerald-500" />
          <span>Your Executed Tenancy Contracts</span>
        </h2>

        {signedBookings.length === 0 ? (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center text-xs text-gray-500 space-y-2">
            <p>You have not signed a tenancy contract yet.</p>
            <p className="text-gray-400">Contracts are generated automatically upon completing a room booking submission.</p>
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

      {/* Official Guides & House Policies */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
            <IconBuilding className="w-5 h-5 text-brand-600" />
            <span>Housing Policies & Arrival Guides</span>
          </h2>

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
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center text-xs text-gray-500">
            No documents available in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocuments.map(doc => (
              <div key={doc.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border ${getCategoryBadgeClass(doc.category)}`}>
                      {doc.category}
                    </span>
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-mono">
                      {doc.updated || 'Active Guide'}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white leading-snug">{doc.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed line-clamp-3">
                    {doc.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                  <button
                    onClick={() => setViewingDocumentModal({ 
                      title: doc.title, 
                      category: doc.category,
                      updated: doc.updated,
                      description: doc.description,
                      content: doc.content 
                    })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold transition-colors"
                  >
                    <span>Read Full Document</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Reader Modal */}
      {viewingDocumentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[85vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                {viewingDocumentModal.category && (
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border inline-block mb-1 ${getCategoryBadgeClass(viewingDocumentModal.category)}`}>
                    {viewingDocumentModal.category}
                  </span>
                )}
                <h3 className="text-base font-black text-gray-900 dark:text-white">{viewingDocumentModal.title}</h3>
              </div>
              <button 
                onClick={() => setViewingDocumentModal(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ✕
              </button>
            </div>

            {viewingDocumentModal.description && (
              <div className="my-3 p-3 bg-brand-50/50 dark:bg-brand-950/20 rounded-xl border border-brand-100 dark:border-brand-900/30 text-xs text-brand-900 dark:text-brand-200 leading-relaxed">
                {viewingDocumentModal.description}
              </div>
            )}

            <div className="py-4 overflow-y-auto flex-1 font-sans text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
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
