import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import { IconClose } from './Icon';
import { 
  CONFIGURABLE_STAFF_SECTIONS, 
  DEFAULT_STAFF_SECTIONS 
} from '../lib/adminPermissions';
import { useApp } from '../hooks/useApp';

interface UserEditorModalProps {
  user: User | null;
  onClose: () => void;
  onSave: (userData: Partial<User> & { password?: string; allowed_sections?: string[] }) => Promise<any> | void;
}

const UserEditorModal: React.FC<UserEditorModalProps> = ({ user, onClose, onSave }) => {
  const { checkAdminEmail, convertStudentToAdmin } = useApp();
  const modalScrollRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<Partial<User> & { password?: string; allowed_sections?: string[] }>({
    full_name: '',
    email: '',
    password: '',
    role: 'staff',
    gender: 'Male',
    allowed_sections: [...DEFAULT_STAFF_SECTIONS]
  });

  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'student' | 'admin'>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [detectedStudent, setDetectedStudent] = useState<any | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        role: user.role,
        gender: user.gender || 'Male',
        allowed_sections: Array.isArray(user.allowed_sections) && user.allowed_sections.length > 0
          ? user.allowed_sections
          : [...DEFAULT_STAFF_SECTIONS]
      });
      setEmailStatus('idle');
      setEmailError(null);
      setDetectedStudent(null);
      setSubmitError(null);
    } else {
      setFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'staff',
        gender: 'Male',
        allowed_sections: [...DEFAULT_STAFF_SECTIONS]
      });
      setEmailStatus('idle');
      setEmailError(null);
      setDetectedStudent(null);
      setSubmitError(null);
    }
  }, [user]);

  // Check email validity and existence
  const verifyEmail = async (emailToTest: string) => {
    const trimmed = (emailToTest || '').trim();
    if (user || !trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setEmailStatus('idle');
      setEmailError(null);
      setDetectedStudent(null);
      return;
    }

    setEmailStatus('checking');
    setEmailError(null);
    setDetectedStudent(null);

    try {
      if (checkAdminEmail) {
        const res = await checkAdminEmail(trimmed);
        if (res.exists) {
          if (res.type === 'admin') {
            setEmailStatus('admin');
            setEmailError(res.error || `Email is already registered as an Admin (${res.role}). Duplicate admin accounts cannot be created.`);
          } else if (res.type === 'student' && res.student) {
            setEmailStatus('student');
            setDetectedStudent(res.student);
          } else {
            setEmailStatus('admin');
            setEmailError('This email is already in use in the system.');
          }
        } else {
          setEmailStatus('available');
          setEmailError(null);
          setDetectedStudent(null);
        }
      } else {
        setEmailStatus('idle');
      }
    } catch (_) {
      setEmailStatus('idle');
    }
  };

  const handleEmailBlur = () => {
    if (formData.email) {
      verifyEmail(formData.email);
    }
  };

  const handleConvertStudent = async () => {
    if (!detectedStudent?.id || !convertStudentToAdmin) return;
    setConverting(true);
    setSubmitError(null);
    try {
      const targetSections = formData.role === 'staff'
        ? (formData.allowed_sections && formData.allowed_sections.length > 0 ? formData.allowed_sections : DEFAULT_STAFF_SECTIONS)
        : undefined;

      const res = await convertStudentToAdmin(detectedStudent.id, targetSections);
      if (res && res.success) {
        onClose();
      } else {
        const errMessage = res?.error || 'Failed to convert student account to limited admin.';
        setSubmitError(errMessage);
        modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      const errMessage = err.message || 'An unexpected error occurred during student conversion.';
      setSubmitError(errMessage);
      modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setConverting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (emailError) {
      modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (detectedStudent && !user) {
      setSubmitError("This email belongs to an existing student. Please click 'Promote & Convert to Limited Admin' below to safely grant admin access without losing booking records.");
      modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        id: user?.id,
        allowed_sections: formData.role === 'staff' ? (formData.allowed_sections || DEFAULT_STAFF_SECTIONS) : undefined
      };

      const res = await onSave(payload);
      if (res && !res.success) {
        if (res.isStudent && res.student) {
          setEmailStatus('student');
          setDetectedStudent(res.student);
          setSubmitError(res.error || "Email already registered as a student. Use the 'Convert to Limited Admin' option below to promote this user.");
        } else {
          setSubmitError(res.error || "Unable to save admin user. Please check server status and try again.");
        }
        // Smoothly scroll to bring notice into view
        modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred while communicating with the server.");
      modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    const current = formData.allowed_sections || [];
    const exists = current.includes(sectionId);
    const updated = exists 
      ? current.filter(id => id !== sectionId) 
      : [...current, sectionId];
    setFormData({ ...formData, allowed_sections: updated });
  };

  const handleSelectDefault = () => {
    setFormData({ ...formData, allowed_sections: [...DEFAULT_STAFF_SECTIONS] });
  };

  const handleSelectAll = () => {
    setFormData({ ...formData, allowed_sections: CONFIGURABLE_STAFF_SECTIONS.map(s => s.id) });
  };

  const handleClearAll = () => {
    setFormData({ ...formData, allowed_sections: [] });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        ref={modalScrollRef}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in max-h-[92vh] overflow-y-auto border border-gray-200 dark:border-gray-800"
      >
        {/* Sticky Header */}
        <div className="p-5 border-b dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{user ? '👤' : '➕'}</span>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                {user ? 'Edit Admin User' : 'Add New Admin User'}
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {formData.role === 'proprietor' 
                ? 'Full system access administrator' 
                : 'Limited admin with configurable section permissions'}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            title="Close dialog"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Top Prominent Notice / Error Banner */}
          {submitError && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border-2 border-red-300 dark:border-red-800 text-xs text-red-800 dark:text-red-200 font-medium space-y-1 animate-fade-in shadow-sm">
              <div className="flex items-center gap-2 font-black text-red-900 dark:text-red-100 text-sm">
                <span>⚠️</span>
                <span>Action Notice</span>
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{submitError}</p>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.full_name || ''}
              onChange={(e) => {
                setFormData({ ...formData, full_name: e.target.value });
                if (submitError) setSubmitError(null);
              }}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium text-sm text-gray-900 dark:text-white placeholder-gray-400"
              placeholder="e.g. Abdullah Yusuf"
            />
          </div>

          {/* Email Address with Live Availability Badges */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Email Address <span className="text-red-500">*</span>
              </label>
              {emailStatus === 'checking' && (
                <span className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold flex items-center gap-1 animate-pulse">
                  <span className="w-2.5 h-2.5 border-2 border-brand-600 dark:border-brand-400 border-t-transparent rounded-full animate-spin inline-block" />
                  Checking availability...
                </span>
              )}
              {emailStatus === 'available' && !user && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span>✓</span> Available for Admin
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="email"
                required
                disabled={!!user}
                value={formData.email || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, email: val });
                  if (emailError) setEmailError(null);
                  if (detectedStudent) setDetectedStudent(null);
                  if (submitError) setSubmitError(null);
                  setEmailStatus('idle');
                }}
                onBlur={handleEmailBlur}
                className={`w-full p-3 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 transition-all font-medium text-sm text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed ${
                  emailError 
                    ? 'border-red-400 dark:border-red-600 focus:ring-red-500 bg-red-50/30' 
                    : emailStatus === 'available'
                    ? 'border-emerald-400 dark:border-emerald-600 focus:ring-emerald-500'
                    : detectedStudent
                    ? 'border-amber-400 dark:border-amber-600 focus:ring-amber-500 bg-amber-50/20'
                    : 'border-gray-200 dark:border-gray-700 focus:ring-brand-500'
                }`}
                placeholder="admin@sharedhousing.ibaanah.com"
              />
            </div>

            {/* Email Inline Feedback Messages */}
            {emailError && (
              <div className="mt-1.5 p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-1.5 animate-fade-in">
                <span>⛔</span>
                <span>{emailError}</span>
              </div>
            )}
            {emailStatus === 'available' && !user && (
              <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <span>✓</span> This email is not registered and can be used for a new administrator account.
              </p>
            )}
          </div>

          {/* Existing Student Account Detected Banner & Explicit Convert Action */}
          {detectedStudent && !user && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700 space-y-3 animate-fade-in shadow-sm">
              <div className="flex items-start gap-2.5">
                <span className="text-2xl leading-none">🎓</span>
                <div className="flex-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    Existing Student Account Detected
                  </h4>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1 leading-snug">
                    This email is already registered to a student. To prevent duplicate authentication accounts and preserve their room bookings and payment records, convert this student account to a Limited Admin.
                  </p>
                </div>
              </div>

              {/* Student Details Card */}
              <div className="bg-white dark:bg-gray-800/90 p-3 rounded-lg border border-amber-200 dark:border-amber-800/60 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[11px]">Enrolled Student:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{detectedStudent.full_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[11px]">Email:</span>
                  <span className="font-mono text-gray-800 dark:text-gray-200 text-[11px]">{detectedStudent.email}</span>
                </div>
                {detectedStudent.phone_number && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-[11px]">Phone:</span>
                    <span className="text-gray-800 dark:text-gray-200 text-[11px]">{detectedStudent.phone_number}</span>
                  </div>
                )}
                {detectedStudent.nationality && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-[11px]">Nationality:</span>
                    <span className="text-gray-800 dark:text-gray-200 text-[11px]">{detectedStudent.nationality}</span>
                  </div>
                )}
              </div>

              {/* Action: Promote & Convert Button */}
              <button
                type="button"
                disabled={converting}
                onClick={handleConvertStudent}
                className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-amber-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {converting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    <span>Promoting Student to Admin...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Convert to Limited Admin (Promote Student)</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Password (Only when adding a new user, and not converting student) */}
          {!user && !detectedStudent && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Password <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                >
                  {showPassword ? 'Hide password' : 'Show password'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password || ''}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (submitError) setSubmitError(null);
                }}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium text-sm text-gray-900 dark:text-white placeholder-gray-400"
                placeholder="Enter secure password (min. 8 characters)"
                minLength={8}
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Minimum 8 characters. Used by the administrator to log into the management portal.
              </p>
            </div>
          )}

          {/* Admin Role Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Admin Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => {
                const newRole = e.target.value as UserRole;
                setFormData({
                  ...formData,
                  role: newRole,
                  allowed_sections: newRole === 'staff' 
                    ? (formData.allowed_sections && formData.allowed_sections.length > 0 ? formData.allowed_sections : [...DEFAULT_STAFF_SECTIONS])
                    : undefined
                });
                if (submitError) setSubmitError(null);
              }}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-bold text-sm text-gray-900 dark:text-white"
            >
              <option value="staff">Staff (Limited Admin - Configurable Section Access)</option>
              <option value="proprietor">Proprietor (Main Admin - Complete System Access)</option>
            </select>
            <p className="mt-1 text-[11px] text-gray-500 leading-snug">
              {formData.role === 'proprietor'
                ? 'Proprietors have full unrestricted control over all residency operations, financial records, and admin accounts.'
                : 'Staff administrators are granted access only to the sections explicitly ticked below.'}
            </p>
          </div>

          {/* Gender Scope */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Gender Scope <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['Male', 'Female'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, gender: g as any });
                    if (submitError) setSubmitError(null);
                  }}
                  className={`py-2.5 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 ${
                    formData.gender === g
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 shadow-sm'
                      : 'border-transparent bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-750'
                  }`}
                >
                  <span>{g === 'Male' ? '👨' : '👩'}</span>
                  <span>{g}</span>
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              Determines residency building scope in the management dashboard.
            </p>
          </div>

          {/* Configurable Section Permissions for Staff (Limited Admin) */}
          {formData.role === 'staff' && (
            <div className="pt-2 border-t dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span>🛡️</span>
                    <span>Allowed Dashboard Sections</span>
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Configure which features this staff member can access.
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectDefault}
                    className="text-[10px] font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    Reset Defaults
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[10px] font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[10px] font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Sections Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {CONFIGURABLE_STAFF_SECTIONS.map((sec) => {
                  const isChecked = (formData.allowed_sections || []).includes(sec.id);
                  const isDefaultCore = DEFAULT_STAFF_SECTIONS.includes(sec.id);
                  return (
                    <label
                      key={sec.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl text-xs cursor-pointer transition-all border select-none ${
                        isChecked
                          ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-300 dark:border-brand-700/60 text-brand-900 dark:text-brand-200 shadow-xs'
                          : 'bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSection(sec.id)}
                        className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300 dark:border-gray-600"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span>{sec.icon}</span>
                          <span className="truncate">{sec.label}</span>
                          {isDefaultCore && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300 uppercase font-black">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {sec.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center gap-2 text-[10px] text-amber-800 dark:text-amber-300">
                <span>🔒</span>
                <span>
                  <strong>Admin Users Management</strong> is restricted exclusively to Proprietors and cannot be delegated.
                </span>
              </div>
            </div>
          )}

          {/* BOTTOM VISIBLE NOTICES & PROGRESS: Rendered right above the action button so the user sees everything immediately */}
          <div className="space-y-3 pt-2">
            {/* Bottom Error Box: High-visibility alert when save fails */}
            {submitError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border-2 border-red-300 dark:border-red-700 text-xs text-red-800 dark:text-red-200 font-medium space-y-1 animate-fade-in shadow-sm">
                <div className="flex items-center gap-2 font-black text-red-900 dark:text-red-100 text-sm">
                  <span>⚠️</span>
                  <span>Unable to Save Administrator</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{submitError}</p>
              </div>
            )}

            {/* In-progress banner when creating or updating user */}
            {submitting && (
              <div className="p-3.5 rounded-xl bg-brand-50 dark:bg-brand-950/50 border-2 border-brand-300 dark:border-brand-700 text-xs text-brand-900 dark:text-brand-200 flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 border-2 border-brand-600 dark:border-brand-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <div>
                  <p className="font-bold text-brand-900 dark:text-brand-100">
                    {user ? "Saving Administrator Changes..." : "Creating Administrator Account & Credentials..."}
                  </p>
                  <p className="text-[11px] text-brand-700 dark:text-brand-300">
                    Communicating with server to verify auth records and apply permission scopes.
                  </p>
                </div>
              </div>
            )}

            {/* In-progress banner when converting student */}
            {converting && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 border-2 border-amber-600 dark:border-amber-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <div>
                  <p className="font-bold text-amber-900 dark:text-amber-100">
                    Promoting Student to Limited Admin...
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    Preserving room bookings, payments, and student history while granting administrator access.
                  </p>
                </div>
              </div>
            )}

            {/* Existing Student reminder above the primary button */}
            {detectedStudent && !user && !converting && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span>💡</span>
                  <span className="font-medium">Student account found. Click button above to convert.</span>
                </div>
                <button
                  type="button"
                  onClick={handleConvertStudent}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition-colors shrink-0"
                >
                  Convert Now
                </button>
              </div>
            )}

            {/* Main Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || converting || !!emailError}
                className="w-full py-3.5 bg-brand-600 disabled:opacity-50 text-white rounded-xl font-black shadow-lg shadow-brand-500/25 hover:bg-brand-500 active:scale-[0.98] transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    <span>Saving Administrator...</span>
                  </>
                ) : user ? (
                  <span>Save Changes</span>
                ) : (
                  <span>Create Admin User</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditorModal;
