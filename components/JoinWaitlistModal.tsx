import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { useTranslation } from '../hooks/useTranslation';
import { IconClose, IconCheckCircle } from './Icon';
import { WaitlistEntry } from '../types';

interface JoinWaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  initialType?: 'Shared' | 'Private';
  initialRoomId?: number | null;
  initialBedSpaceId?: number | null;
  initialSpaceLabel?: string;
}

export const JoinWaitlistModal: React.FC<JoinWaitlistModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'Premium 1',
  initialType = 'Shared',
  initialRoomId = null,
  initialBedSpaceId = null,
  initialSpaceLabel
}) => {
  const { user, addToWaitlist, academicTerms, accommodationCategories } = useApp();
  const t = useTranslation();

  const availableCategories = React.useMemo(() => {
    if (accommodationCategories && accommodationCategories.length > 0) {
      const active = accommodationCategories.filter(c => c.status !== 'Inactive').map(c => c.name);
      if (active.length > 0) return active;
    }
    return ['Premium 1', 'Premium 2', 'Premium 3'];
  }, [accommodationCategories]);

  const [category, setCategory] = useState<string>(initialCategory);
  const [accommodationType, setAccommodationType] = useState<'Shared' | 'Private'>(initialType);
  const [durationMonths, setDurationMonths] = useState<number>(6);
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCategory(initialCategory);
      setAccommodationType(initialType);
      setIsSuccess(false);
      setErrorMsg(null);
      if (user) {
        setFullName(user.full_name || '');
        setEmail(user.email || '');
        setPhoneNumber(user.phone_number || '');
      } else {
        setFullName('');
        setEmail('');
        setPhoneNumber('');
      }
      setNotes(initialSpaceLabel ? `Interested in ${initialSpaceLabel}` : '');
    }
  }, [isOpen, initialCategory, initialType, initialSpaceLabel, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation for unauthenticated guest
    if (!user) {
      if (!fullName.trim() || !email.trim()) {
        setErrorMsg('Please provide your full name and a valid email address.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const studentName = user?.full_name || fullName.trim();
      const studentEmail = user?.email || email.trim().toLowerCase();
      const studentPhone = user?.phone_number || phoneNumber.trim();

      const payload: Omit<WaitlistEntry, 'id' | 'created_at' | 'status'> = {
        student_id: user ? user.id : null,
        full_name: studentName || null,
        email: studentEmail || null,
        phone_number: studentPhone || null,
        category,
        accommodation_type: accommodationType,
        room_id: initialRoomId || null,
        bed_space_id: initialBedSpaceId || null,
        duration_months: durationMonths,
        notes: notes.trim() || null,
      };

      const res = await addToWaitlist(payload);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMsg(res.error || 'Failed to join the waitlist. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-brand-700 to-brand-800 text-white flex justify-between items-center">
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest mb-1 border border-white/20">
              Residency Queue
            </div>
            <h3 className="text-lg font-bold">Join Residency Waitlist</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {isSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <IconCheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                You're on the Waitlist!
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm mx-auto leading-relaxed">
                Thank you. We have logged your request for{' '}
                <strong className="text-brand-600 dark:text-brand-400 font-bold">
                  {category} ({accommodationType})
                </strong>
                . As soon as a matching bed space opens up, our management team will reach out directly.
              </p>
              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition"
                >
                  Close & Return
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs">
                  {errorMsg}
                </div>
              )}

              {/* Category & Room Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Accommodation Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-semibold border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  >
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Preferred Room Type
                  </label>
                  <select
                    value={accommodationType}
                    onChange={(e) => setAccommodationType(e.target.value as any)}
                    className="w-full px-3 py-2.5 text-sm font-semibold border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Shared">Shared Room (Bed Space)</option>
                    <option value="Private">Private Room (Exclusive)</option>
                  </select>
                </div>
              </div>

              {/* Stay Duration */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Duration of Stay
                </label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-sm font-semibold border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months (Full Academic Year)</option>
                </select>
              </div>

              {/* Student Contact Information */}
              {user ? (
                <div className="p-3.5 bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 rounded-xl space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <p className="text-xs font-bold text-brand-900 dark:text-brand-300">
                      Verified Student Account Linked
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-gray-900 dark:text-white">{user.full_name || 'Student'}</span> ({user.email})
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Contact details and notifications will automatically link to your student profile.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-1 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Your Contact Details
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                      Full Name (as in Passport) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Abdullah Rahman"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="student@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                        WhatsApp Active Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="+20 102 345 6789"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-3 py-2 text-sm border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Special Notes / Requests */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Notes / Specific Requests (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Interested in room on quiet side, arriving early next month..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Joining...</span>
                    </>
                  ) : (
                    <span>Confirm & Join Waitlist</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinWaitlistModal;
