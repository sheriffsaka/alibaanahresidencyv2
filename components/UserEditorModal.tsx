import React, { useState, useEffect } from 'react';
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

  const [formData, setFormData] = useState<Partial<User> & { password?: string; allowed_sections?: string[] }>({
    full_name: '',
    email: '',
    password: '',
    role: 'staff',
    gender: 'Male',
    allowed_sections: [...DEFAULT_STAFF_SECTIONS]
  });

  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [detectedStudent, setDetectedStudent] = useState<any | null>(null);
  const [converting, setConverting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
      setEmailError(null);
      setDetectedStudent(null);
      setSubmitError(null);
    }
  }, [user]);

  const handleEmailBlur = async () => {
    if (user || !formData.email || !formData.email.trim() || !formData.email.includes('@')) {
      return;
    }
    setCheckingEmail(true);
    setEmailError(null);
    setDetectedStudent(null);
    setSubmitError(null);
    try {
      if (checkAdminEmail) {
        const res = await checkAdminEmail(formData.email.trim());
        if (res.exists) {
          if (res.type === 'admin') {
            setEmailError(res.error || `Email is already registered as an Admin (${res.role}). Duplicate admin accounts cannot be created.`);
          } else if (res.type === 'student' && res.student) {
            setDetectedStudent(res.student);
          }
        }
      }
    } catch (_) {
    } finally {
      setCheckingEmail(false);
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
        setSubmitError(res?.error || 'Failed to convert student to admin.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred during conversion.');
    } finally {
      setConverting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (emailError) {
      return;
    }

    if (detectedStudent) {
      setSubmitError("This email belongs to an existing student. Please click 'Promote & Convert to Limited Admin' below to grant admin access.");
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
          setDetectedStudent(res.student);
          setSubmitError(res.error || "Email already registered as Student. Please use the 'Convert to Limited Admin' option.");
        } else {
          setSubmitError(res.error || "Failed to save user.");
        }
      }
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in max-h-[92vh] overflow-y-auto border border-gray-100 dark:border-gray-800">
        <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">
              {user ? 'Edit Admin User' : 'Add New Admin User'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {formData.role === 'proprietor' 
                ? 'Full system access administrator' 
                : 'Limited admin with configurable section permissions'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <IconClose className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* General Error Banner */}
          {submitError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-medium leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold mb-0.5">
                <span>⚠️</span>
                <span>Action Notice</span>
              </div>
              <p>{submitError}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.full_name || ''}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium text-sm text-gray-900 dark:text-white"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-gray-500 uppercase">Email Address</label>
              {checkingEmail && (
                <span className="text-[10px] text-brand-600 dark:text-brand-400 font-medium animate-pulse">
                  Checking availability...
                </span>
              )}
            </div>
            <input
              type="email"
              required
              disabled={!!user}
              value={formData.email || ''}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (emailError) setEmailError(null);
                if (detectedStudent) setDetectedStudent(null);
                if (submitError) setSubmitError(null);
              }}
              onBlur={handleEmailBlur}
              className={`w-full p-3 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium text-sm text-gray-900 dark:text-white disabled:opacity-50 ${
                emailError 
                  ? 'border-red-400 dark:border-red-600 focus:ring-red-500' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              placeholder="admin@sharedhousing.ibaanah.com"
            />
            {emailError && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                {emailError}
              </p>
            )}
          </div>

          {/* Existing Student Account Detected Banner & Explicit Convert Action */}
          {detectedStudent && !user && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 space-y-3 animate-fade-in">
              <div className="flex items-start gap-2.5">
                <span className="text-xl">🎓</span>
                <div className="flex-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    Existing Student Account Detected
                  </h4>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-snug">
                    This email is already registered to a student. To prevent duplicate authentication accounts, convert this existing student to a Limited Admin. All existing bookings, transactions, and student records will be safely preserved.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800/90 p-3 rounded-lg border border-amber-200 dark:border-amber-800/60 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[11px]">Student Name:</span>
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

              <button
                type="button"
                disabled={converting}
                onClick={handleConvertStudent}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-amber-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {converting ? (
                  <span>Converting Student to Limited Admin...</span>
                ) : (
                  <>
                    <span>Convert to Limited Admin (Promote)</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          )}

          {!user && !detectedStudent && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
              <input
                type="password"
                required
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium text-sm text-gray-900 dark:text-white"
                placeholder="••••••••"
                minLength={8}
              />
              <p className="mt-1 text-[10px] text-gray-500">Minimum 8 characters.</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Admin Role</label>
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
              }}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-bold text-sm text-gray-900 dark:text-white"
            >
              <option value="staff">Staff (Limited Admin)</option>
              <option value="proprietor">Proprietor (Main Admin - Full Access)</option>
            </select>
            <p className="mt-1 text-[10px] text-gray-500">
              {formData.role === 'proprietor'
                ? 'Proprietors retain unrestricted access to all operational, financial, and administration sections.'
                : 'Staff role functions as Limited Admin with configurable section-level permissions.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender Scope</label>
            <div className="grid grid-cols-2 gap-3">
              {['Male', 'Female'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: g as any })}
                  className={`py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${
                    formData.gender === g
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                      : 'border-transparent bg-gray-50 dark:bg-gray-800 text-gray-500'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Section Permissions Checklist for Staff (Limited Admin) */}
          {formData.role === 'staff' && (
            <div className="pt-3 border-t dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Permitted Admin Sections
                  </label>
                  <p className="text-[11px] text-gray-500">
                    Select which sections this staff member is authorized to access
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectDefault}
                    className="text-[10px] font-bold text-brand-600 hover:text-brand-700 underline"
                    title="Reset to default: Bookings, Students, Transactions, Messages"
                  >
                    Reset Default
                  </button>
                  <span className="text-gray-300 text-xs">|</span>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[10px] font-bold text-gray-600 hover:text-gray-800 dark:text-gray-400 hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300 text-xs">|</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Sections Checkbox List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 scrollbar-thin">
                {CONFIGURABLE_STAFF_SECTIONS.map((sec) => {
                  const isChecked = (formData.allowed_sections || []).includes(sec.id);
                  const isDefaultCore = DEFAULT_STAFF_SECTIONS.includes(sec.id);
                  return (
                    <label
                      key={sec.id}
                      className={`flex items-start gap-2.5 p-2 rounded-lg text-xs cursor-pointer transition-all border select-none ${
                        isChecked
                          ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-700/60 text-brand-900 dark:text-brand-200'
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

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting || converting || !!emailError}
              className="w-full py-3.5 bg-brand-600 disabled:opacity-50 text-white rounded-xl font-black shadow-lg shadow-brand-500/20 hover:bg-brand-500 active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
            >
              {submitting ? 'Saving...' : user ? 'Save Changes' : 'Create Admin User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditorModal;
