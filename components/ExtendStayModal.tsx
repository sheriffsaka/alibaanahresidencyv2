import React, { useState, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { Booking, Room } from '../types';
import { calculateExtensionPricing, calculateExtendedExpiryDate, normalizeRoomType } from '../lib/pricing';
import { IconClose, IconCalendar, IconBuilding, IconCheckCircle, IconInfo } from './Icon';

interface ExtendStayModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onSuccess?: (updatedBooking: Booking) => void;
}

const PRESET_MONTHS = [1, 2, 3, 6, 12];

export const ExtendStayModal: React.FC<ExtendStayModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSuccess
}) => {
  const { rooms, bedSpaces, roomPricing, extendBookingStay } = useApp();
  const [additionalMonths, setAdditionalMonths] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Find associated room and bed space
  const room: Room | undefined = useMemo(() => {
    if (!booking) return undefined;
    return rooms.find(r => r.id === booking.room_id);
  }, [booking, rooms]);

  const bedSpace = useMemo(() => {
    if (!booking?.bed_space_id) return undefined;
    return bedSpaces.find(b => b.id === booking.bed_space_id);
  }, [booking, bedSpaces]);

  // Current room type (Shared vs Private)
  const roomType = useMemo(() => {
    if (booking?.preferred_accommodation) {
      return normalizeRoomType(booking.preferred_accommodation);
    }
    if (room?.type) {
      return normalizeRoomType(room.type);
    }
    return 'Shared';
  }, [booking, room]);

  // Pricing calculation based on centralized system
  const pricing = useMemo(() => {
    return calculateExtensionPricing(roomType, additionalMonths, roomPricing);
  }, [roomType, additionalMonths, roomPricing]);

  // Expiry date calculation
  const currentEndDate = useMemo(() => {
    if (!booking?.end_date) return new Date().toISOString().split('T')[0];
    return booking.end_date.split('T')[0];
  }, [booking]);

  const newExtendedEndDate = useMemo(() => {
    return calculateExtendedExpiryDate(currentEndDate, additionalMonths);
  }, [currentEndDate, additionalMonths]);

  if (!isOpen || !booking) return null;

  const handleConfirmExtension = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const result = await extendBookingStay(booking.id, additionalMonths);

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to extend booking stay.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(`Stay extended successfully! New lease end date: ${newExtendedEndDate}`);
      if (onSuccess && result.updatedBooking) {
        onSuccess(result.updatedBooking);
      }

      // Auto close after brief notification
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while saving extension.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <IconCalendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Extend Stay Duration</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Booking #BK{booking.id} • {booking.full_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[calc(85vh-130px)] overflow-y-auto">

          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
              <IconCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{successMessage}</p>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
              <IconInfo className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-rose-800 dark:text-rose-300">{errorMessage}</p>
            </div>
          )}

          {/* Locked Room & Bed Assignment Banner (Requirements 2 & 10) */}
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                <IconBuilding className="w-4 h-4" /> Same Room & Bed Assignment (Locked)
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-200/70 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200">
                {roomType} Room
              </span>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              <p className="font-semibold text-gray-900 dark:text-white">
                {room?.apartment_name || room?.category || 'Accommodation'} — {room?.room_number || `Room #${booking.room_id}`}
                {bedSpace ? ` (${bedSpace.label})` : (booking.bed_space_id ? ` (Bed Space #${booking.bed_space_id})` : '')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {booking.street_name || booking.address_in_egypt || 'Al-Rehab City, Cairo, Egypt'}
              </p>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-400 mt-2 font-medium">
              * Room transfers are not permitted during stay extensions. Your current room and bed assignment will be retained.
            </p>
          </div>

          {/* Current Expiry Info */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Current Lease Expiry</span>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                {new Date(currentEndDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Current Duration</span>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                {booking.duration_of_stay || 'Standard Stay'}
              </p>
            </div>
          </div>

          {/* Select Additional Stay Duration (Requirements 3 & Test) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-gray-900 dark:text-white">
                Select Additional Stay Duration
              </label>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                +{additionalMonths} Month{additionalMonths > 1 ? 's' : ''}
              </span>
            </div>

            {/* Quick preset pills */}
            <div className="grid grid-cols-5 gap-2 mb-3">
              {PRESET_MONTHS.map(m => {
                const isSelected = additionalMonths === m;
                const mPricing = calculateExtensionPricing(roomType, m, roomPricing);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAdditionalMonths(m)}
                    className={`py-2 px-1 rounded-xl text-center border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 ring-2 ring-indigo-600/30 font-bold'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  >
                    <div className="text-sm font-bold">{m} mo</div>
                    <div className={`text-[10px] leading-tight mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-gray-400 dark:text-gray-500'}`}>
                      ${mPricing.totalPrice}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom month range selector (1 to 12 months) */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Custom:</span>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={additionalMonths}
                onChange={(e) => setAdditionalMonths(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200 w-12 text-right">
                {additionalMonths} mo
              </span>
            </div>
          </div>

          {/* New Expiry Date Comparison (Requirement 5) */}
          <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block mb-1">
              New Extended Lease Expiry
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                {new Date(currentEndDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span className="text-xs text-indigo-500 font-bold">→</span>
              <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                {new Date(newExtendedEndDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300">
                +{additionalMonths} Mo
              </span>
            </div>
          </div>

          {/* Centralized Pricing Breakdown (Requirement 4) */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 space-y-2">
            <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
              <span>Room Type Rate ({roomType}):</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ${pricing.monthlyRate} USD / month
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
              <span>Extension Duration:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {additionalMonths} month{additionalMonths > 1 ? 's' : ''}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-900 dark:text-white">Total Extension Cost:</span>
              <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                ${pricing.totalPrice} USD
              </span>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 pt-1">
              * Pricing calculated directly from the verified centralized room pricing matrix.
            </p>
          </div>

        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmExtension}
            disabled={isSubmitting || Boolean(successMessage)}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Validating & Extending...</span>
              </>
            ) : (
              <span>Confirm Stay Extension (${pricing.totalPrice} USD)</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
