import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { IconUser, IconCheckCircle } from '../components/Icon';
import { supabase } from '../lib/supabaseClient';

const ProfilePage: React.FC = () => {
  const { user, bookings, updateUser } = useApp();
  const [isEditing, setIsEditing] = useState(false);

  // Fallback to latest booking if profile field is empty
  const latestBooking = bookings && bookings.length > 0 ? bookings[0] : null;

  const displayFullName = user?.full_name || latestBooking?.full_name || '';
  const displayPhone = user?.phone_number || latestBooking?.phone_number || '';
  const displayPassport = user?.passport_number || latestBooking?.passport_number || '';
  const displayNationality = user?.nationality || latestBooking?.nationality || '';

  const [fullName, setFullName] = useState(displayFullName);
  const [phone, setPhone] = useState(displayPhone);
  const [passportNumber, setPassportNumber] = useState(displayPassport);
  const [nationality, setNationality] = useState(displayNationality);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Sync state when user or bookings load
  useEffect(() => {
    setFullName(displayFullName);
    setPhone(displayPhone);
    setPassportNumber(displayPassport);
    setNationality(displayNationality);
  }, [user?.full_name, user?.phone_number, user?.passport_number, user?.nationality, latestBooking?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;

    setIsSaving(true);
    try {
      const res = await updateUser(user.id, {
        full_name: fullName,
        phone_number: phone,
        passport_number: passportNumber,
        nationality: nationality
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to update profile');
      }

      setSaveStatus('Profile information updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      alert(`Failed to save profile: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 text-xs font-black uppercase tracking-widest mb-1">
            <IconUser className="w-4 h-4" /> Student Account
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your personal residency details, identification documents, and contact credentials.
          </p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="self-start sm:self-center px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-colors"
        >
          {isEditing ? 'Cancel Edit' : 'Edit Profile'}
        </button>
      </div>

      {saveStatus && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 border border-emerald-200/50 animate-fade-in">
          <IconCheckCircle className="w-4 h-4" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-black text-xl flex items-center justify-center shadow-md">
            {displayFullName ? displayFullName.slice(0, 2).toUpperCase() : 'ST'}
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">{displayFullName || 'Al-Ibaanah Student'}</h2>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 border border-brand-200/40">
              {user?.role === 'staff' || user?.role === 'proprietor' ? 'Admin Staff' : 'Verified Student'}
            </span>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl text-xs text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">WhatsApp / Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+20 123 456 7890"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl text-xs text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Passport / National ID</label>
                <input
                  type="text"
                  value={passportNumber}
                  onChange={e => setPassportNumber(e.target.value)}
                  placeholder="e.g. N1234567"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl text-xs text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nationality / Country</label>
                <input
                  type="text"
                  value={nationality}
                  onChange={e => setNationality(e.target.value)}
                  placeholder="e.g. United Kingdom"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl text-xs text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow disabled:opacity-60 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-xl">
              <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Full Legal Name</span>
              <span className="font-bold text-gray-900 dark:text-white">{displayFullName || 'Not provided'}</span>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-xl">
              <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Email Address</span>
              <span className="font-bold text-gray-900 dark:text-white">{user?.email || 'Not provided'}</span>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-xl">
              <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">WhatsApp / Phone</span>
              <span className="font-bold text-gray-900 dark:text-white">{displayPhone || 'Not provided'}</span>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-xl">
              <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Passport / ID Number</span>
              <span className="font-bold text-gray-900 dark:text-white">{displayPassport || 'Not provided'}</span>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-xl">
              <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Nationality</span>
              <span className="font-bold text-gray-900 dark:text-white">{displayNationality || 'Not provided'}</span>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-xl">
              <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Account Role</span>
              <span className="font-bold text-gray-900 dark:text-white capitalize">{user?.role || 'Student Resident'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
