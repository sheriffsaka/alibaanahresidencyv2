import React, { useState, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { RoomPricingTier, DEFAULT_ROOM_PRICING_TIERS, getRoomPrice, calculateStayPricing, formatTierLabel } from '../../lib/pricing';
import { 
  CheckCircle2, 
  RefreshCw, 
  RotateCcw, 
  Save, 
  ShieldCheck, 
  Calculator, 
  HelpCircle, 
  AlertCircle 
} from 'lucide-react';

export const RoomPricingView: React.FC = () => {
  const { roomPricing, updateRoomPricing } = useApp();

  // Local working copy of the pricing tiers
  const [tiers, setTiers] = useState<RoomPricingTier[]>(() => {
    return (roomPricing && roomPricing.length > 0) ? roomPricing : DEFAULT_ROOM_PRICING_TIERS;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync from global state if it updates externally
  useEffect(() => {
    if (roomPricing && roomPricing.length > 0) {
      setTiers(roomPricing);
    }
  }, [roomPricing]);

  // Simulator state
  const [simRoomType, setSimRoomType] = useState<'Shared' | 'Private'>('Shared');
  const [simDuration, setSimDuration] = useState<number>(3);

  const simResult = calculateStayPricing(simRoomType, simDuration, tiers);

  const handlePriceChange = (
    tierId: string, 
    field: 'sharedPrice' | 'privatePrice', 
    value: string
  ) => {
    const numValue = Math.max(0, Number(value) || 0);
    setTiers(prev => prev.map(t => {
      if (t.id === tierId) {
        return { ...t, [field]: numValue };
      }
      return t;
    }));
    setSaveSuccess(false);
    setErrorMessage(null);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all prices back to default pricing matrix?')) {
      setTiers(DEFAULT_ROOM_PRICING_TIERS);
      setSaveSuccess(false);
      setErrorMessage(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      // Validate inputs
      for (const t of tiers) {
        if (t.sharedPrice <= 0 || t.privatePrice <= 0) {
          throw new Error(`Prices for "${t.label}" must be greater than $0.`);
        }
      }

      const res = await updateRoomPricing(tiers);
      if (!res.success) {
        throw new Error(res.error || 'Failed to update room pricing in Supabase.');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving room prices.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 lg:p-8 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl text-xl">
                🏷️
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Room Pricing Matrix
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-2xl">
              Supabase is the single source of truth for all room pricing. Updated prices apply immediately to all new student bookings, room displays, extensions, and admin bookings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-4 h-4" />
              Supabase Single Source of Truth
            </span>
          </div>
        </div>

        {/* Existing Bookings Protected Notice */}
        <div className="mt-5 p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div>
            <span className="font-bold">Price Protection Notice: </span>
            <span>
              Modifications saved here take effect immediately for <strong>all new bookings</strong> and inquiries. Saved prices for existing active bookings and executed tenancy agreements remain locked and unaffected.
            </span>
          </div>
        </div>
      </div>

      {/* Main Pricing Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Duration-Based Monthly Rates (USD)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Set monthly rates according to student stay duration.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Defaults
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Duration Tier</th>
                  <th className="px-6 py-4">Months Covered</th>
                  <th className="px-6 py-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      Shared Room ($/mo)
                    </span>
                  </th>
                  <th className="px-6 py-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                      Private Room ($/mo)
                    </span>
                  </th>
                  <th className="px-6 py-4 text-end">Rate Comparison</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-sm">
                {tiers.map((tier) => {
                  const baseShared = tiers[0]?.sharedPrice || 200;
                  const basePrivate = tiers[0]?.privatePrice || 350;
                  const sharedDiscount = baseShared - tier.sharedPrice;
                  const privateDiscount = basePrivate - tier.privatePrice;

                  return (
                    <tr 
                      key={tier.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                            {formatTierLabel(tier.label)}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                        {Math.max(2, tier.durationMin)} to {tier.durationMax === 999 ? '∞' : tier.durationMax} months
                      </td>

                      <td className="px-6 py-4">
                        <div className="relative max-w-[160px]">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold text-sm pointer-events-none">
                            $
                          </span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={tier.sharedPrice}
                            onChange={(e) => handlePriceChange(tier.id, 'sharedPrice', e.target.value)}
                            className="w-full pl-7 pr-3 py-2 text-sm font-bold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-900 dark:text-white shadow-xs"
                            required
                          />
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="relative max-w-[160px]">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold text-sm pointer-events-none">
                            $
                          </span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={tier.privatePrice}
                            onChange={(e) => handlePriceChange(tier.id, 'privatePrice', e.target.value)}
                            className="w-full pl-7 pr-3 py-2 text-sm font-bold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 dark:text-white shadow-xs"
                            required
                          />
                        </div>
                      </td>

                      <td className="px-6 py-4 text-end text-xs">
                        {tier.id === 'tier_1_2' ? (
                          <span className="text-gray-400 font-semibold">Standard Base Rate</span>
                        ) : (
                          <div className="space-y-0.5">
                            {sharedDiscount > 0 && (
                              <span className="inline-block text-emerald-600 dark:text-emerald-400 font-bold">
                                -${sharedDiscount}/mo Shared
                              </span>
                            )}
                            {privateDiscount > 0 && (
                              <span className="block text-purple-600 dark:text-purple-400 font-bold">
                                -${privateDiscount}/mo Private
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Feedback & Actions */}
          <div className="p-6 bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              {saveSuccess && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Prices successfully updated in Supabase! All new bookings and room pages now reflect these rates.</span>
                </div>
              )}
              {errorMessage && (
                <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {!saveSuccess && !errorMessage && (
                <span className="text-xs text-gray-400">
                  Click below to save changes to Supabase database.
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving to Supabase...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Pricing Matrix
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Interactive Pricing Simulator & Verification Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 lg:p-8 border border-gray-100 dark:border-gray-700 space-y-6">
        <div className="flex items-center gap-2.5">
          <Calculator className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Live Centralized Pricing Verification
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Test how <code>getRoomPrice(roomType, durationMonths)</code> calculates rates across all customer-facing and admin pages.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Controls */}
          <div className="space-y-4 md:col-span-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Select Room Type:
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSimRoomType('Shared')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                    simRoomType === 'Shared'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Shared Room
                </button>
                <button
                  type="button"
                  onClick={() => setSimRoomType('Private')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                    simRoomType === 'Private'
                      ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-950/40 dark:border-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Private Room
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stay Duration:
                </label>
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                  {simDuration} Month{simDuration > 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSimDuration(m)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      simDuration === m
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/40 dark:from-gray-900 dark:to-brand-950/30 border border-brand-200 dark:border-brand-800 text-center space-y-3">
            <span className="text-[11px] font-bold text-brand-700 dark:text-brand-400 uppercase tracking-widest">
              Applied Calculation
            </span>

            <div>
              <p className="text-3xl font-black text-brand-900 dark:text-brand-200">
                ${simResult.monthlyRate}
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400"> / month</span>
              </p>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1">
                Total stay: <span className="font-bold text-gray-900 dark:text-white">${simResult.totalPrice} USD</span> for {simDuration} months
              </p>
            </div>

            <div className="pt-2 border-t border-brand-200/50 dark:border-brand-800/50 text-[11px] text-gray-500 dark:text-gray-400">
              Matches booking page, confirmation agreement, and student portals.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomPricingView;
