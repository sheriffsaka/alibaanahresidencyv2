import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { IconClose } from './Icon';
import { 
  CONFIGURABLE_STAFF_SECTIONS, 
  DEFAULT_STAFF_SECTIONS 
} from '../lib/adminPermissions';

interface UserEditorModalProps {
  user: User | null;
  onClose: () => void;
  onSave: (userData: Partial<User> & { password?: string; allowed_sections?: string[] }) => void;
}

const UserEditorModal: React.FC<UserEditorModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<User> & { password?: string; allowed_sections?: string[] }>({
    full_name: '',
    email: '',
    password: '',
    role: 'staff',
    gender: 'Male',
    allowed_sections: [...DEFAULT_STAFF_SECTIONS]
  });

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
    } else {
      setFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'staff',
        gender: 'Male',
        allowed_sections: [...DEFAULT_STAFF_SECTIONS]
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: user?.id,
      allowed_sections: formData.role === 'staff' ? (formData.allowed_sections || DEFAULT_STAFF_SECTIONS) : undefined
    });
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
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
            <input
              type="email"
              required
              disabled={!!user}
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium text-sm text-gray-900 dark:text-white disabled:opacity-50"
              placeholder="admin@sharedhousing.ibaanah.com"
            />
          </div>

          {!user && (
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
              className="w-full py-3.5 bg-brand-600 text-white rounded-xl font-black shadow-lg shadow-brand-500/20 hover:bg-brand-500 active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
            >
              {user ? 'Save Changes' : 'Create Admin User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditorModal;
