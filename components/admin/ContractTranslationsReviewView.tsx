import React, { useState, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { Language } from '../../types';
import { 
  DEFAULT_CONTRACT_TRANSLATIONS, 
  LegalContractTranslation, 
  CONTRACT_LANGUAGES 
} from '../../lib/contractTranslations';
import { 
  IconCheckCircle, 
  IconAlertTriangle, 
  IconCheck, 
  IconClose, 
  IconEye, 
  IconFile, 
  IconRefreshCw,
  IconEdit,
  IconSave
} from '../Icon';
import TenancyAgreementDocument from '../TenancyAgreementDocument';

export const ContractTranslationsReviewView: React.FC = () => {
  const { 
    user, 
    contractTranslations, 
    approveContractTranslation, 
    revertContractTranslationToDraft, 
    updateContractTranslation,
    resetContractTranslation,
    accommodationAddresses 
  } = useApp();

  const [selectedLang, setSelectedLang] = useState<Language>('ar');
  const [viewMode, setViewMode] = useState<'side-by-side' | 'edit-translation' | 'full-document'>('side-by-side');
  const [activeEditorSection, setActiveEditorSection] = useState<
    'parties-property' | 'term-rent-deposit' | 'use-cleaning-safety' | 'rules-visitors' | 'islamic-values' | 'termination-signatures'
  >('parties-property');

  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [confirmModalAction, setConfirmModalAction] = useState<'approve' | 'revert' | 'reset' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const englishSource: LegalContractTranslation = contractTranslations?.en || DEFAULT_CONTRACT_TRANSLATIONS.en;
  
  // Active translation state
  const currentTranslation: LegalContractTranslation = 
    contractTranslations?.[selectedLang] || DEFAULT_CONTRACT_TRANSLATIONS[selectedLang] || DEFAULT_CONTRACT_TRANSLATIONS.en;

  // Local draft state for editing
  const [editForm, setEditForm] = useState<LegalContractTranslation>(() => JSON.parse(JSON.stringify(currentTranslation)));

  // Synchronize editForm when selectedLang or server translation changes and no dirty edits
  useEffect(() => {
    setEditForm(JSON.parse(JSON.stringify(currentTranslation)));
    setHasUnsavedChanges(false);
  }, [selectedLang, contractTranslations]);

  const isApproved = currentTranslation.status === 'approved';
  const isEnglish = selectedLang === 'en';

  // Helper to update top-level field in editForm
  const handleTopLevelChange = (field: keyof LegalContractTranslation, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };

  // Helper to update nested section fields
  const handleSectionFieldChange = (sectionName: keyof LegalContractTranslation['sections'], field: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionName]: {
          ...prev.sections[sectionName],
          [field]: value
        }
      }
    }));
    setHasUnsavedChanges(true);
  };

  // Helper to update array points inside a section
  const handleArrayPointChange = (
    sectionName: keyof LegalContractTranslation['sections'], 
    arrayField: string, 
    index: number, 
    value: string
  ) => {
    setEditForm(prev => {
      const currentArray = [...((prev.sections[sectionName] as any)[arrayField] || [])];
      currentArray[index] = value;
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionName]: {
            ...prev.sections[sectionName],
            [arrayField]: currentArray
          }
        }
      };
    });
    setHasUnsavedChanges(true);
  };

  // Save changes handler
  const handleSaveTranslation = async (andApprove: boolean = false) => {
    setIsSaving(true);
    setFeedbackMessage(null);
    try {
      const res = await updateContractTranslation(selectedLang, editForm);
      if (res.success) {
        if (andApprove && !isApproved) {
          const reviewerName = user?.full_name || user?.email || 'Staff Reviewer';
          await approveContractTranslation(selectedLang, reviewerName);
          setFeedbackMessage({
            type: 'success',
            text: `Successfully saved and approved ${editForm.languageName} translation! It is now live for students.`
          });
        } else {
          setFeedbackMessage({
            type: 'success',
            text: `Successfully saved updates to ${editForm.languageName} Tenancy Agreement.`
          });
        }
        setHasUnsavedChanges(false);
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.error || 'Failed to save translation changes.'
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'An unexpected error occurred while saving.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    setFeedbackMessage(null);
    try {
      const reviewerName = user?.full_name || user?.email || 'Staff Reviewer';
      const res = await approveContractTranslation(selectedLang, reviewerName);
      if (res.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Successfully approved ${currentTranslation.languageName} contract translation! It is now live for students.`
        });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.error || 'Failed to approve translation.'
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'An unexpected error occurred.'
      });
    } finally {
      setIsApproving(false);
      setConfirmModalAction(null);
    }
  };

  const handleRevert = async () => {
    setIsApproving(true);
    setFeedbackMessage(null);
    try {
      const res = await revertContractTranslationToDraft(selectedLang);
      if (res.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Reverted ${currentTranslation.languageName} translation to draft status. Students will now be served the English agreement.`
        });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.error || 'Failed to revert translation.'
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'An unexpected error occurred.'
      });
    } finally {
      setIsApproving(false);
      setConfirmModalAction(null);
    }
  };

  const handleReset = async () => {
    setIsApproving(true);
    setFeedbackMessage(null);
    try {
      const res = await resetContractTranslation(selectedLang);
      if (res.success) {
        setEditForm(JSON.parse(JSON.stringify(DEFAULT_CONTRACT_TRANSLATIONS[selectedLang] || DEFAULT_CONTRACT_TRANSLATIONS.en)));
        setHasUnsavedChanges(false);
        setFeedbackMessage({
          type: 'success',
          text: `Reset ${currentTranslation.languageName} translation to default draft baseline.`
        });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.error || 'Failed to reset translation.'
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'An unexpected error occurred.'
      });
    } finally {
      setIsApproving(false);
      setConfirmModalAction(null);
    }
  };

  const handleDiscardEdits = () => {
    setEditForm(JSON.parse(JSON.stringify(currentTranslation)));
    setHasUnsavedChanges(false);
    setFeedbackMessage({
      type: 'success',
      text: 'Unsaved edits discarded.'
    });
  };

  // Sample mock form data for the document preview mode
  const previewFormData = {
    fullName: 'Abdullah Al-Mansoor (Sample Student)',
    nationality: 'United Kingdom',
    passportNumber: 'GB98234120',
    homeAddress: 'Flat 4B, 12 Al-Nasr Road, Nasr City, Cairo',
    whatsappNumber: '+20 100 123 4567',
    email: 'abdullah.student@example.com',
    category: 'Premium 1',
    roomName: 'Room 1',
    bedSpaceName: 'Bed 1',
    duration: '2 Months',
  };

  return (
    <div className="space-y-6 animate-fade-in text-start">
      {/* Top Banner & Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-bold">
                📜
              </span>
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                Tenancy Agreement Translations & Clause Editor
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-3xl leading-relaxed">
              Edit, refine, and review contract text across all supported languages anytime. Changes save directly to the secure database with version tracking. Draft translations remain withheld from student signing flows until formally approved.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl self-start lg:self-auto flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setViewMode('edit-translation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'edit-translation'
                  ? 'bg-white dark:bg-gray-800 text-brand-700 dark:text-brand-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <IconEdit className="w-3.5 h-3.5" />
              <span>Edit Translation</span>
              {hasUnsavedChanges && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              )}
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'side-by-side'
                  ? 'bg-white dark:bg-gray-800 text-brand-700 dark:text-brand-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <IconFile className="w-3.5 h-3.5" />
              <span>Side-by-Side Review</span>
            </button>
            <button
              onClick={() => setViewMode('full-document')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'full-document'
                  ? 'bg-white dark:bg-gray-800 text-brand-700 dark:text-brand-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <IconEye className="w-3.5 h-3.5" />
              <span>Full Document Preview</span>
            </button>
          </div>
        </div>

        {/* Feedback alert */}
        {feedbackMessage && (
          <div className={`mt-4 p-3.5 rounded-xl text-xs font-medium flex items-center justify-between gap-3 ${
            feedbackMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {feedbackMessage.type === 'success' ? (
                <IconCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <IconAlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            <button 
              onClick={() => setFeedbackMessage(null)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <IconClose className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Language Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {CONTRACT_LANGUAGES.map(lang => {
          const item = contractTranslations?.[lang.code] || DEFAULT_CONTRACT_TRANSLATIONS[lang.code];
          const isSelected = selectedLang === lang.code;
          const status = item?.status || 'draft';

          return (
            <button
              key={lang.code}
              onClick={() => {
                if (hasUnsavedChanges) {
                  if (window.confirm("You have unsaved edits in the current language. Switch language anyway?")) {
                    setSelectedLang(lang.code);
                  }
                } else {
                  setSelectedLang(lang.code);
                }
              }}
              className={`p-3.5 rounded-2xl border text-start transition-all relative flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-950/20 shadow-xs ring-2 ring-brand-500/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">{lang.flag}</span>
                  {status === 'approved' ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Live
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      Draft
                    </span>
                  )}
                </div>
                <div className="font-bold text-sm text-gray-900 dark:text-white">
                  {lang.name}
                </div>
                <div className="text-[11px] text-gray-500 font-medium">
                  {lang.native}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-[10px]">
                <span className="text-gray-400 font-mono uppercase">{lang.direction.toUpperCase()}</span>
                {lang.code === 'en' ? (
                  <span className="text-gray-500 font-bold">Source</span>
                ) : status === 'approved' ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                    <IconCheck className="w-3 h-3" /> Approved
                  </span>
                ) : (
                  <span className="text-amber-600 font-bold">In Review</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Language Action Bar */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-xl">
            {CONTRACT_LANGUAGES.find(l => l.code === selectedLang)?.flag || '🌐'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                {currentTranslation.languageName} ({currentTranslation.nativeName})
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
                v{currentTranslation.version || 1}
              </span>
              {isApproved ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                  <IconCheck className="w-3 h-3" /> Approved & Live for Students
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                  <IconAlertTriangle className="w-3 h-3" /> Pending Staff Review (Withheld)
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEnglish 
                ? 'Master source document (English) — Always live by default.'
                : isApproved
                ? `Approved by ${currentTranslation.approvedBy || 'Admin'} on ${new Date(currentTranslation.approvedAt || '').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : 'Students selecting this language currently see the official English agreement.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {viewMode === 'edit-translation' ? (
            <>
              {hasUnsavedChanges && (
                <button
                  type="button"
                  onClick={handleDiscardEdits}
                  className="px-3 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition cursor-pointer"
                >
                  Discard Edits
                </button>
              )}

              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveTranslation(false)}
                className={`px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSaving ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <IconSave className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>

              {!isEnglish && !isApproved && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveTranslation(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <IconCheckCircle className="w-4 h-4" />
                  <span>Save & Approve</span>
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setViewMode('edit-translation')}
                className="px-4 py-2.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <IconEdit className="w-4 h-4" />
                <span>Edit This Agreement</span>
              </button>

              {!isEnglish && (
                !isApproved ? (
                  <button
                    onClick={() => setConfirmModalAction('approve')}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <IconCheckCircle className="w-4 h-4" />
                    <span>Approve & Publish</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmModalAction('revert')}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <IconAlertTriangle className="w-4 h-4" />
                    <span>Revert to Draft</span>
                  </button>
                )
              )}
            </>
          )}

          {!isEnglish && (
            <button
              onClick={() => setConfirmModalAction('reset')}
              className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Reset to default translation baseline"
            >
              <IconRefreshCw className="w-3.5 h-3.5" />
              <span>Reset Baseline</span>
            </button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'edit-translation' ? (
        /* ==================== INTERACTIVE CLAUSE EDITOR ==================== */
        <div className="space-y-6">
          {/* Editor Section Navigation Tabs */}
          <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveEditorSection('parties-property')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeEditorSection === 'parties-property'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              1. Parties & Property
            </button>
            <button
              type="button"
              onClick={() => setActiveEditorSection('term-rent-deposit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeEditorSection === 'term-rent-deposit'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              2. Term, Rent, Deposit & Utilities
            </button>
            <button
              type="button"
              onClick={() => setActiveEditorSection('use-cleaning-safety')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeEditorSection === 'use-cleaning-safety'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              3. Use, Cleaning & Safety
            </button>
            <button
              type="button"
              onClick={() => setActiveEditorSection('rules-visitors')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeEditorSection === 'rules-visitors'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              4. Rules, Visitors & Inspections
            </button>
            <button
              type="button"
              onClick={() => setActiveEditorSection('islamic-values')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeEditorSection === 'islamic-values'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              5. Conduct & Islamic Values
            </button>
            <button
              type="button"
              onClick={() => setActiveEditorSection('termination-signatures')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeEditorSection === 'termination-signatures'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              6. Undertaking & Signatures
            </button>
          </div>

          {/* Section 1: Header, Parties & Property */}
          {activeEditorSection === 'parties-property' && (
            <div className="space-y-6">
              {/* Document Meta & Title */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider border-b pb-2">
                  Document Header & Titles
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Header Title (Document Name)
                    </label>
                    <div className="text-[11px] text-gray-400 mb-1">EN: {englishSource.headerTitle}</div>
                    <input
                      type="text"
                      dir={editForm.direction}
                      value={editForm.headerTitle}
                      onChange={e => handleTopLevelChange('headerTitle', e.target.value)}
                      className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Header Subtitle (Organization / Service)
                    </label>
                    <div className="text-[11px] text-gray-400 mb-1">EN: {englishSource.headerSubtitle}</div>
                    <input
                      type="text"
                      dir={editForm.direction}
                      value={editForm.headerSubtitle}
                      onChange={e => handleTopLevelChange('headerSubtitle', e.target.value)}
                      className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 1: Parties */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider border-b pb-2">
                  1. Parties to the Agreement
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Section 1 Heading
                    </label>
                    <div className="text-[11px] text-gray-400 mb-1">EN: {englishSource.sections.parties.title}</div>
                    <input
                      type="text"
                      dir={editForm.direction}
                      value={editForm.sections.parties.title}
                      onChange={e => handleSectionFieldChange('parties', 'title', e.target.value)}
                      className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Landlord Card Label
                    </label>
                    <div className="text-[11px] text-gray-400 mb-1">EN: {englishSource.sections.parties.landlordLabel}</div>
                    <input
                      type="text"
                      dir={editForm.direction}
                      value={editForm.sections.parties.landlordLabel}
                      onChange={e => handleSectionFieldChange('parties', 'landlordLabel', e.target.value)}
                      className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Tenant Card Label
                    </label>
                    <div className="text-[11px] text-gray-400 mb-1">EN: {englishSource.sections.parties.tenantLabel}</div>
                    <input
                      type="text"
                      dir={editForm.direction}
                      value={editForm.sections.parties.tenantLabel}
                      onChange={e => handleSectionFieldChange('parties', 'tenantLabel', e.target.value)}
                      className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Passport / ID Field Label
                    </label>
                    <div className="text-[11px] text-gray-400 mb-1">EN: {englishSource.sections.parties.tenantPassportLabel}</div>
                    <input
                      type="text"
                      dir={editForm.direction}
                      value={editForm.sections.parties.tenantPassportLabel}
                      onChange={e => handleSectionFieldChange('parties', 'tenantPassportLabel', e.target.value)}
                      className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Property */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider border-b pb-2">
                  2. Rental Property & Unit Allocation
                </h4>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Property Section Title
                  </label>
                  <div className="text-[11px] text-gray-400 mb-1">EN: {englishSource.sections.property.title}</div>
                  <input
                    type="text"
                    dir={editForm.direction}
                    value={editForm.sections.property.title}
                    onChange={e => handleSectionFieldChange('property', 'title', e.target.value)}
                    className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Property Introductory Clause
                  </label>
                  <div className="text-[11px] text-gray-400 mb-1 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                    EN: {englishSource.sections.property.intro}
                  </div>
                  <textarea
                    rows={3}
                    dir={editForm.direction}
                    value={editForm.sections.property.intro}
                    onChange={e => handleSectionFieldChange('property', 'intro', e.target.value)}
                    className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Term, Rent, Deposit & Utilities */}
          {activeEditorSection === 'term-rent-deposit' && (
            <div className="space-y-6">
              {/* Term of Lease */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider border-b pb-2">
                  3. Term of Lease
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Section Title
                    </label>
                    <div className="text-[11px] text-gray-400 mb-1">EN: {englishSource.sections.term.title}</div>
                    <input
                      type="text"
                      dir={editForm.direction}
                      value={editForm.sections.term.title}
                      onChange={e => handleSectionFieldChange('term', 'title', e.target.value)}
                      className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Renewal Policy Label
                    </label>
                    <div className="text-[11px] text-gray-400 mb-1">EN: {englishSource.sections.term.renewalLabel}</div>
                    <input
                      type="text"
                      dir={editForm.direction}
                      value={editForm.sections.term.renewalLabel}
                      onChange={e => handleSectionFieldChange('term', 'renewalLabel', e.target.value)}
                      className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Renewal Policy Text
                  </label>
                  <div className="text-[11px] text-gray-400 mb-1 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                    EN: {englishSource.sections.term.renewalText}
                  </div>
                  <textarea
                    rows={2}
                    dir={editForm.direction}
                    value={editForm.sections.term.renewalText}
                    onChange={e => handleSectionFieldChange('term', 'renewalText', e.target.value)}
                    className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Overstay Clause ($15/night) Text
                  </label>
                  <div className="text-[11px] text-gray-400 mb-1 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                    EN: {englishSource.sections.term.overstayText}
                  </div>
                  <textarea
                    rows={2}
                    dir={editForm.direction}
                    value={editForm.sections.term.overstayText}
                    onChange={e => handleSectionFieldChange('term', 'overstayText', e.target.value)}
                    className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Rent & Deposit */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider border-b pb-2">
                  4. Rent & 5. Security Deposit Terms
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Rent Payment Terms (2 months advance)
                    </label>
                    <div className="text-[11px] text-gray-400 mb-1 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                      EN: {englishSource.sections.rent.paymentText}
                    </div>
                    <textarea
                      rows={2}
                      dir={editForm.direction}
                      value={editForm.sections.rent.paymentText}
                      onChange={e => handleSectionFieldChange('rent', 'paymentText', e.target.value)}
                      className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Security Deposit Refund Clause
                    </label>
                    <div className="text-[11px] text-gray-400 mb-1 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                      EN: {englishSource.sections.deposit.refundText}
                    </div>
                    <textarea
                      rows={2}
                      dir={editForm.direction}
                      value={editForm.sections.deposit.refundText}
                      onChange={e => handleSectionFieldChange('deposit', 'refundText', e.target.value)}
                      className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Early Termination Deposit Forfeiture Clause
                    </label>
                    <div className="text-[11px] text-gray-400 mb-1 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                      EN: {englishSource.sections.deposit.earlyTerminationText}
                    </div>
                    <textarea
                      rows={2}
                      dir={editForm.direction}
                      value={editForm.sections.deposit.earlyTerminationText}
                      onChange={e => handleSectionFieldChange('deposit', 'earlyTerminationText', e.target.value)}
                      className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      No-Show Deposit Forfeiture Clause
                    </label>
                    <div className="text-[11px] text-gray-400 mb-1 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                      EN: {englishSource.sections.deposit.noShowText}
                    </div>
                    <textarea
                      rows={2}
                      dir={editForm.direction}
                      value={editForm.sections.deposit.noShowText}
                      onChange={e => handleSectionFieldChange('deposit', 'noShowText', e.target.value)}
                      className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Utilities */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider border-b pb-2">
                  6. Utilities & Responsible Consumption
                </h4>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Utilities Clause Text
                  </label>
                  <div className="text-[11px] text-gray-400 mb-1 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                    EN: {englishSource.sections.utilities.body}
                  </div>
                  <textarea
                    rows={3}
                    dir={editForm.direction}
                    value={editForm.sections.utilities.body}
                    onChange={e => handleSectionFieldChange('utilities', 'body', e.target.value)}
                    className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Use, Cleaning & Safety */}
          {activeEditorSection === 'use-cleaning-safety' && (
            <div className="space-y-6">
              {/* Section 1 - Use and Occupancy */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider border-b pb-2">
                  Section 1: Use & Occupancy Limits
                </h4>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    1.1 Use of Property (Study & Residential Purpose Only)
                  </label>
                  <div className="text-[11px] text-gray-400 mb-1 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                    EN: {englishSource.sections.useOccupancy.useBody}
                  </div>
                  <textarea
                    rows={3}
                    dir={editForm.direction}
                    value={editForm.sections.useOccupancy.useBody}
                    onChange={e => handleSectionFieldChange('useOccupancy', 'useBody', e.target.value)}
                    className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    1.2 Occupancy & Anti-Subletting Points
                  </label>
                  {editForm.sections.useOccupancy.occupancyPoints.map((pt, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-[11px] text-gray-400">
                        EN Point {idx + 1}: {englishSource.sections.useOccupancy.occupancyPoints[idx]}
                      </div>
                      <textarea
                        rows={2}
                        dir={editForm.direction}
                        value={pt}
                        onChange={e => handleArrayPointChange('useOccupancy', 'occupancyPoints', idx, e.target.value)}
                        className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2 - Cleaning, Safety, Security */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider border-b pb-2">
                  Section 2: Cleaning, Maintenance, Safety & Security
                </h4>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    2.1 Cleaning Schedule & Duties (3x per week)
                  </label>
                  {editForm.sections.cleaningSafety.cleaningPoints.map((pt, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-[11px] text-gray-400">
                        EN Point {idx + 1}: {englishSource.sections.cleaningSafety.cleaningPoints[idx]}
                      </div>
                      <textarea
                        rows={2}
                        dir={editForm.direction}
                        value={pt}
                        onChange={e => handleArrayPointChange('cleaningSafety', 'cleaningPoints', idx, e.target.value)}
                        className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    2.2 Maintenance & Repair Responsibilities
                  </label>
                  <div className="text-[11px] text-gray-400 mb-1 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                    EN: {englishSource.sections.cleaningSafety.maintenanceBody}
                  </div>
                  <textarea
                    rows={3}
                    dir={editForm.direction}
                    value={editForm.sections.cleaningSafety.maintenanceBody}
                    onChange={e => handleSectionFieldChange('cleaningSafety', 'maintenanceBody', e.target.value)}
                    className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    2.3 Fire Safety & Open Flame Prohibitions
                  </label>
                  {editForm.sections.cleaningSafety.safetyPoints.map((pt, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-[11px] text-gray-400">
                        EN Point {idx + 1}: {englishSource.sections.cleaningSafety.safetyPoints[idx]}
                      </div>
                      <textarea
                        rows={2}
                        dir={editForm.direction}
                        value={pt}
                        onChange={e => handleArrayPointChange('cleaningSafety', 'safetyPoints', idx, e.target.value)}
                        className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Rules, Visitors & Inspections */}
          {activeEditorSection === 'rules-visitors' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider border-b pb-2">
                  Section 3: Visitors, House Rules & Entry
                </h4>

                {/* Women Visitor Prohibition Highlight */}
                <div className="p-4 bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-red-900 dark:text-red-300 block">
                    ⚠️ Mandatory Women Visitor Prohibition Clause (3.1 Highlight)
                  </span>
                  <div className="text-[11px] text-red-700 dark:text-red-400">
                    EN: {englishSource.sections.houseRules.womenNotice}
                  </div>
                  <textarea
                    rows={2}
                    dir={editForm.direction}
                    value={editForm.sections.houseRules.womenNotice}
                    onChange={e => handleSectionFieldChange('houseRules', 'womenNotice', e.target.value)}
                    className="w-full p-3 text-sm bg-white dark:bg-gray-900 border border-red-300 dark:border-red-800 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    3.1 Visitor Policy Rules
                  </label>
                  {editForm.sections.houseRules.visitorPoints.map((pt, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-[11px] text-gray-400">
                        EN Point {idx + 1}: {englishSource.sections.houseRules.visitorPoints[idx]}
                      </div>
                      <textarea
                        rows={2}
                        dir={editForm.direction}
                        value={pt}
                        onChange={e => handleArrayPointChange('houseRules', 'visitorPoints', idx, e.target.value)}
                        className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    3.2 Strict House Rules (Quiet hours, substance prohibitions)
                  </label>
                  {editForm.sections.houseRules.houseRulesPoints.map((pt, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-[11px] text-gray-400">
                        EN Point {idx + 1}: {englishSource.sections.houseRules.houseRulesPoints[idx]}
                      </div>
                      <textarea
                        rows={2}
                        dir={editForm.direction}
                        value={pt}
                        onChange={e => handleArrayPointChange('houseRules', 'houseRulesPoints', idx, e.target.value)}
                        className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    3.3 Bi-Weekly Inspections & Emergency Access
                  </label>
                  {editForm.sections.houseRules.inspectionPoints.map((pt, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-[11px] text-gray-400">
                        EN Point {idx + 1}: {englishSource.sections.houseRules.inspectionPoints[idx]}
                      </div>
                      <textarea
                        rows={2}
                        dir={editForm.direction}
                        value={pt}
                        onChange={e => handleArrayPointChange('houseRules', 'inspectionPoints', idx, e.target.value)}
                        className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Conduct & Islamic Values */}
          {activeEditorSection === 'islamic-values' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider border-b pb-2">
                  Section 4: Communication, Conduct & Islamic Values
                </h4>

                {/* Salawat in Masjid Highlight */}
                <div className="p-4 bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/60 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-brand-900 dark:text-brand-300 block">
                    🕌 Mandatory Congregational Prayer (Masjid Salawat) Clause
                  </span>
                  <div className="text-[11px] text-brand-700 dark:text-brand-400">
                    EN: {englishSource.sections.islamicValues.salawatHighlight}
                  </div>
                  <textarea
                    rows={3}
                    dir={editForm.direction}
                    value={editForm.sections.islamicValues.salawatHighlight}
                    onChange={e => handleSectionFieldChange('islamicValues', 'salawatHighlight', e.target.value)}
                    className="w-full p-3 text-sm bg-white dark:bg-gray-900 border border-brand-300 dark:border-brand-800 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    4.1 WhatsApp Group Requirement Text
                  </label>
                  <div className="text-[11px] text-gray-400 mb-1 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                    EN: {englishSource.sections.islamicValues.communicationBody}
                  </div>
                  <textarea
                    rows={3}
                    dir={editForm.direction}
                    value={editForm.sections.islamicValues.communicationBody}
                    onChange={e => handleSectionFieldChange('islamicValues', 'communicationBody', e.target.value)}
                    className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    4.2 Harmony & Dispute Escalation
                  </label>
                  {editForm.sections.islamicValues.conductPoints.map((pt, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-[11px] text-gray-400">
                        EN Point {idx + 1}: {englishSource.sections.islamicValues.conductPoints[idx]}
                      </div>
                      <textarea
                        rows={2}
                        dir={editForm.direction}
                        value={pt}
                        onChange={e => handleArrayPointChange('islamicValues', 'conductPoints', idx, e.target.value)}
                        className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 6: Undertaking & Signatures */}
          {activeEditorSection === 'termination-signatures' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider border-b pb-2">
                  Section 5: Termination & Tenant Undertaking
                </h4>

                {/* Extremism Disclaimer Highlight */}
                <div className="p-4 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-200 block">
                    🛡️ Mandatory Anti-Extremist Disclaimer Undertaking (Section 5.2 Clause)
                  </span>
                  <div className="text-[11px] text-gray-600 dark:text-gray-400">
                    EN: {englishSource.sections.terminationUndertaking.extremismHighlight}
                  </div>
                  <textarea
                    rows={3}
                    dir={editForm.direction}
                    value={editForm.sections.terminationUndertaking.extremismHighlight}
                    onChange={e => handleSectionFieldChange('terminationUndertaking', 'extremismHighlight', e.target.value)}
                    className="w-full p-3 text-sm bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    5.1 Termination Grounds & Deposit Forfeiture Points
                  </label>
                  {editForm.sections.terminationUndertaking.terminationPoints.map((pt, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-[11px] text-gray-400">
                        EN Point {idx + 1}: {englishSource.sections.terminationUndertaking.terminationPoints[idx]}
                      </div>
                      <textarea
                        rows={2}
                        dir={editForm.direction}
                        value={pt}
                        onChange={e => handleArrayPointChange('terminationUndertaking', 'terminationPoints', idx, e.target.value)}
                        className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    5.2 Solemn Undertaking Numbered Points (1, 2, 3)
                  </label>
                  {editForm.sections.terminationUndertaking.undertakingPoints.map((pt, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-[11px] text-gray-400">
                        EN Item {idx + 1}: {englishSource.sections.terminationUndertaking.undertakingPoints[idx]}
                      </div>
                      <textarea
                        rows={2}
                        dir={editForm.direction}
                        value={pt}
                        onChange={e => handleArrayPointChange('terminationUndertaking', 'undertakingPoints', idx, e.target.value)}
                        className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatures & Execution Labels */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider border-b pb-2">
                  Signatures & Final Execution Notice
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Landlord Signature Card Label
                    </label>
                    <input
                      type="text"
                      dir={editForm.direction}
                      value={editForm.sections.signatures.landlordLabel}
                      onChange={e => handleSectionFieldChange('signatures', 'landlordLabel', e.target.value)}
                      className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Tenant Signature Card Label
                    </label>
                    <input
                      type="text"
                      dir={editForm.direction}
                      value={editForm.sections.signatures.tenantLabel}
                      onChange={e => handleSectionFieldChange('signatures', 'tenantLabel', e.target.value)}
                      className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Binding Agreement Notice (Footer Text)
                  </label>
                  <div className="text-[11px] text-gray-400 mb-1 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                    EN: {englishSource.sections.signatures.footerText}
                  </div>
                  <textarea
                    rows={2}
                    dir={editForm.direction}
                    value={editForm.sections.signatures.footerText}
                    onChange={e => handleSectionFieldChange('signatures', 'footerText', e.target.value)}
                    className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Save Bar for Quick Access */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                Editing: <strong className="text-gray-900 dark:text-white">{editForm.languageName} ({editForm.nativeName})</strong>
              </span>
              {hasUnsavedChanges ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  Unsaved Changes
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  All Changes Saved
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveTranslation(false)}
                className={`px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSaving ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <IconSave className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Agreement'}</span>
              </button>

              {!isEnglish && !isApproved && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveTranslation(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <IconCheckCircle className="w-4 h-4" />
                  <span>Save & Publish Live</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : viewMode === 'full-document' ? (
        /* ==================== FULL 4-PAGE PREVIEW ==================== */
        <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
              Interactive 4-Page PDF/Sign Document Preview:
            </span>
            <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold">
              Mode: {selectedLang.toUpperCase()} ({currentTranslation.direction.toUpperCase()})
            </span>
          </div>
          <div className="max-h-[800px] overflow-y-auto rounded-2xl shadow-xl bg-white border border-gray-200 p-2">
            <TenancyAgreementDocument
              formData={previewFormData}
              monthlyRate={200}
              startDate="1st October 2026"
              endDate="31st December 2026"
              signature="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='40'><path d='M10 20 Q 30 5, 50 20 T 90 20' stroke='navy' fill='none' stroke-width='2'/></svg>"
              customAddresses={accommodationAddresses}
              language={selectedLang}
              allowDraft={true}
              contractTranslations={contractTranslations}
            />
          </div>
        </div>
      ) : (
        /* ==================== SIDE-BY-SIDE REVIEW ==================== */
        <div className="space-y-6">
          {/* Section: Header & Parties */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                1. Header & Parties to the Agreement
              </h4>
              <span className="text-[11px] text-gray-400 font-mono">Section 1</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-700">
              {/* English Baseline */}
              <div className="p-6 space-y-4 bg-gray-50/40 dark:bg-gray-900/20">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">English Source (Binding Baseline)</span>
                  <span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono">EN</span>
                </div>
                <div className="space-y-2 text-xs">
                  <p><strong className="text-gray-900 dark:text-white">Title:</strong> {englishSource.headerTitle}</p>
                  <p><strong className="text-gray-900 dark:text-white">Subtitle:</strong> {englishSource.headerSubtitle}</p>
                  <p><strong className="text-gray-900 dark:text-white">Section Title:</strong> {englishSource.sections.parties.title}</p>
                  <p><strong className="text-gray-900 dark:text-white">Landlord Card:</strong> {englishSource.sections.parties.landlordLabel}</p>
                  <p><strong className="text-gray-900 dark:text-white">Tenant Card:</strong> {englishSource.sections.parties.tenantLabel}</p>
                  <p><strong className="text-gray-900 dark:text-white">Property Intro:</strong> {englishSource.sections.property.intro}</p>
                </div>
              </div>

              {/* Translated Target */}
              <div className="p-6 space-y-4" dir={currentTranslation.direction}>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase">
                    {currentTranslation.languageName} ({currentTranslation.nativeName})
                  </span>
                  <span className="text-[10px] bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300 px-1.5 py-0.5 rounded font-mono">
                    {selectedLang.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <p><strong className="text-gray-900 dark:text-white">العنوان / Title:</strong> {currentTranslation.headerTitle}</p>
                  <p><strong className="text-gray-900 dark:text-white">التاريخ / Subtitle:</strong> {currentTranslation.headerSubtitle}</p>
                  <p><strong className="text-gray-900 dark:text-white">عنوان القسم / Section:</strong> {currentTranslation.sections.parties.title}</p>
                  <p><strong className="text-gray-900 dark:text-white">المؤجر / Landlord:</strong> {currentTranslation.sections.parties.landlordLabel}</p>
                  <p><strong className="text-gray-900 dark:text-white">المستأجر / Tenant:</strong> {currentTranslation.sections.parties.tenantLabel}</p>
                  <p><strong className="text-gray-900 dark:text-white">وصف العقار / Property:</strong> {currentTranslation.sections.property.intro}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Financials & Terms */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                2. Term of Lease, Rent, Security Deposit & Utilities
              </h4>
              <span className="text-[11px] text-gray-400 font-mono">Sections 3, 4, 5 & 6</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-700">
              {/* English Baseline */}
              <div className="p-6 space-y-3 bg-gray-50/40 dark:bg-gray-900/20 text-xs">
                <p><strong className="text-gray-900 dark:text-white">Term Title:</strong> {englishSource.sections.term.title}</p>
                <p><strong className="text-gray-900 dark:text-white">Renewal:</strong> {englishSource.sections.term.renewalText}</p>
                <p><strong className="text-gray-900 dark:text-white">Overstay:</strong> {englishSource.sections.term.overstayText}</p>
                <p><strong className="text-gray-900 dark:text-white">Payment:</strong> {englishSource.sections.rent.paymentText}</p>
                <p><strong className="text-gray-900 dark:text-white">Deposit Refund:</strong> {englishSource.sections.deposit.refundText}</p>
                <p><strong className="text-gray-900 dark:text-white">Early Termination:</strong> {englishSource.sections.deposit.earlyTerminationText}</p>
                <p><strong className="text-gray-900 dark:text-white">No Show:</strong> {englishSource.sections.deposit.noShowText}</p>
                <p><strong className="text-gray-900 dark:text-white">Utilities:</strong> {englishSource.sections.utilities.body}</p>
              </div>

              {/* Translated Target */}
              <div className="p-6 space-y-3 text-xs" dir={currentTranslation.direction}>
                <p><strong className="text-gray-900 dark:text-white">المدة / Term:</strong> {currentTranslation.sections.term.title}</p>
                <p><strong className="text-gray-900 dark:text-white">التجديد / Renewal:</strong> {currentTranslation.sections.term.renewalText}</p>
                <p><strong className="text-gray-900 dark:text-white">التأخير / Overstay:</strong> {currentTranslation.sections.term.overstayText}</p>
                <p><strong className="text-gray-900 dark:text-white">الدفع / Payment:</strong> {currentTranslation.sections.rent.paymentText}</p>
                <p><strong className="text-gray-900 dark:text-white">استرداد التأمين / Refund:</strong> {currentTranslation.sections.deposit.refundText}</p>
                <p><strong className="text-gray-900 dark:text-white">الإنهاء المبكر / Termination:</strong> {currentTranslation.sections.deposit.earlyTerminationText}</p>
                <p><strong className="text-gray-900 dark:text-white">عدم الحضور / No Show:</strong> {currentTranslation.sections.deposit.noShowText}</p>
                <p><strong className="text-gray-900 dark:text-white">المرافق / Utilities:</strong> {currentTranslation.sections.utilities.body}</p>
              </div>
            </div>
          </div>

          {/* Section: Critical Rules & Clauses */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                3. High-Priority Islamic Conduct & Strict House Rules
              </h4>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">Mandatory Clauses</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-700">
              {/* English Baseline */}
              <div className="p-6 space-y-4 bg-gray-50/40 dark:bg-gray-900/20 text-xs">
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl">
                  <span className="font-bold text-red-900 dark:text-red-300 block mb-1">Women Visitor Prohibition Clause:</span>
                  <p className="text-red-800 dark:text-red-400">
                    {englishSource.sections.houseRules.womenNotice}
                  </p>
                </div>

                <div className="p-3 bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900/50 rounded-xl">
                  <span className="font-bold text-brand-900 dark:text-brand-300 block mb-1">Congregational Prayer Clause:</span>
                  <p className="text-brand-800 dark:text-brand-400">
                    {englishSource.sections.islamicValues.salawatHighlight}
                  </p>
                </div>

                <div className="p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl">
                  <span className="font-bold text-gray-900 dark:text-gray-200 block mb-1">Anti-Extremist Undertaking Clause:</span>
                  <p className="text-gray-700 dark:text-gray-300">
                    {englishSource.sections.terminationUndertaking.extremismHighlight}
                  </p>
                </div>
              </div>

              {/* Translated Target */}
              <div className="p-6 space-y-4 text-xs" dir={currentTranslation.direction}>
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl">
                  <span className="font-bold text-red-900 dark:text-red-300 block mb-1">بند حظر دخول النساء / Women Prohibition:</span>
                  <p className="text-red-800 dark:text-red-400">
                    {currentTranslation.sections.houseRules.womenNotice}
                  </p>
                </div>

                <div className="p-3 bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900/50 rounded-xl">
                  <span className="font-bold text-brand-900 dark:text-brand-300 block mb-1">بند صلاة الجماعة بالمسجد / Congregational Prayer:</span>
                  <p className="text-brand-800 dark:text-brand-400">
                    {currentTranslation.sections.islamicValues.salawatHighlight}
                  </p>
                </div>

                <div className="p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl">
                  <span className="font-bold text-gray-900 dark:text-gray-200 block mb-1">بند البراءة من الفرق المتطرفة / Anti-Extremist Declaration:</span>
                  <p className="text-gray-700 dark:text-gray-300">
                    {currentTranslation.sections.terminationUndertaking.extremismHighlight}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {confirmModalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                confirmModalAction === 'approve' 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50' 
                  : confirmModalAction === 'revert'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50'
                  : 'bg-red-100 text-red-700 dark:bg-red-950/50'
              }`}>
                {confirmModalAction === 'approve' ? '✅' : confirmModalAction === 'revert' ? '⚠️' : '🔄'}
              </div>
              <div>
                <h3 className="font-black text-base text-gray-900 dark:text-white uppercase tracking-tight">
                  {confirmModalAction === 'approve' 
                    ? `Approve ${currentTranslation.languageName} Translation?`
                    : confirmModalAction === 'revert'
                    ? `Revert to Draft Status?`
                    : `Reset ${currentTranslation.languageName} Baseline?`}
                </h3>
                <p className="text-xs text-gray-500">Official Legal Action Confirmation</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {confirmModalAction === 'approve' ? (
                <>
                  By approving this translation, international students selecting <strong>{currentTranslation.languageName} ({currentTranslation.nativeName})</strong> will immediately see and sign this translated Tenancy Agreement during their booking flow.
                </>
              ) : confirmModalAction === 'revert' ? (
                <>
                  Reverting this translation to <strong>Draft</strong> will immediately hide it from student booking flows. Students will be safely served the official English version instead.
                </>
              ) : (
                <>
                  This will reset all clauses and texts for <strong>{currentTranslation.languageName}</strong> to the original system default draft baseline.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                disabled={isApproving}
                onClick={() => setConfirmModalAction(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                disabled={isApproving}
                onClick={() => {
                  if (confirmModalAction === 'approve') handleApprove();
                  else if (confirmModalAction === 'revert') handleRevert();
                  else if (confirmModalAction === 'reset') handleReset();
                }}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer ${
                  confirmModalAction === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : confirmModalAction === 'revert'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isApproving ? 'Executing...' : confirmModalAction === 'approve' ? 'Confirm Approval' : confirmModalAction === 'revert' ? 'Confirm Revert' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
