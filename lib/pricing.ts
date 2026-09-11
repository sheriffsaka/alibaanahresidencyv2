/**
 * Room Pricing Engine
 * Single Source of Truth for Al-Ibaanah Student Residency room prices.
 */

export interface RoomPricingTier {
  id: string;
  durationMin: number;
  durationMax: number; // 999 for open-ended (e.g. 7+ months)
  label: string;
  sharedPrice: number;
  privatePrice: number;
}

export function formatTierLabel(label: string): string {
  if (!label) return '2 months';
  return label
    .replace(/^1[–\-]2\s*months?$/i, '2 months')
    .replace(/^1[–\-]2\s*mos?$/i, '2 mos')
    .replace(/1[–\-]2\s*months/gi, '2 months')
    .replace(/1[–\-]2\s*mos/gi, '2 mos');
}

export const DEFAULT_ROOM_PRICING_TIERS: RoomPricingTier[] = [
  { id: 'tier_1_2', durationMin: 2, durationMax: 2, label: '2 months', sharedPrice: 200, privatePrice: 350 },
  { id: 'tier_3_4', durationMin: 3, durationMax: 4, label: '3–4 months', sharedPrice: 190, privatePrice: 330 },
  { id: 'tier_5_6', durationMin: 5, durationMax: 6, label: '5–6 months', sharedPrice: 180, privatePrice: 315 },
  { id: 'tier_7_plus', durationMin: 7, durationMax: 999, label: '7+ months', sharedPrice: 175, privatePrice: 300 }
];

/**
 * Determine Shared vs Private strictly from room data attributes,
 * not from cosmetic room-name text (per requirement 6).
 */
export function normalizeRoomType(
  roomOrType: any
): 'Shared' | 'Private' {
  if (!roomOrType) return 'Shared';

  // If passed an object (Room, BedSpace, RoomSpaceConfig, Booking, etc.)
  if (typeof roomOrType === 'object') {
    // 1. Explicit type check
    const rawType = String(roomOrType.type || roomOrType.preferred_accommodation || '').trim().toLowerCase();
    if (rawType.includes('private')) return 'Private';
    if (rawType.includes('shared')) return 'Shared';

    // 2. Capacity check: capacity === 1 indicates private occupancy
    if (typeof roomOrType.capacity === 'number') {
      return roomOrType.capacity === 1 ? 'Private' : 'Shared';
    }

    // 3. Fallback check on roomType property if present
    if (roomOrType.roomType) {
      const rt = String(roomOrType.roomType).toLowerCase();
      if (rt.includes('private')) return 'Private';
      if (rt.includes('shared')) return 'Shared';
    }
  }

  // If passed a string
  const str = String(roomOrType).trim().toLowerCase();
  if (str.includes('private')) return 'Private';
  return 'Shared';
}

/**
 * Centralized pricing function
 * getRoomPrice(roomType, durationMonths, customTiers?)
 * Returns the monthly rate in USD.
 */
export function getRoomPrice(
  roomType: any,
  durationMonths: number | string,
  tiers: RoomPricingTier[] = DEFAULT_ROOM_PRICING_TIERS
): number {
  const activeTiers = (Array.isArray(tiers) && tiers.length > 0) ? tiers : DEFAULT_ROOM_PRICING_TIERS;
  const isPrivate = normalizeRoomType(roomType) === 'Private';
  const months = Math.max(1, Math.round(Number(durationMonths) || 1));

  // Find tier where durationMonths is within range (treating 1–2 months as tier_1_2)
  const matchedTier = activeTiers.find(t => {
    if (months <= t.durationMin && t.durationMin <= 2) return true;
    return months >= t.durationMin && months <= t.durationMax;
  });

  if (matchedTier) {
    return isPrivate ? matchedTier.privatePrice : matchedTier.sharedPrice;
  }

  // If duration exceeds highest tier (e.g. >= 7)
  const sorted = [...activeTiers].sort((a, b) => b.durationMin - a.durationMin);
  const maxTier = sorted[0];
  if (maxTier && months >= maxTier.durationMin) {
    return isPrivate ? maxTier.privatePrice : maxTier.sharedPrice;
  }

  // Fallback to first tier
  const firstTier = activeTiers[0] || DEFAULT_ROOM_PRICING_TIERS[0];
  return isPrivate ? firstTier.privatePrice : firstTier.sharedPrice;
}

/**
 * Calculate full booking pricing breakdown
 * For new initial residency applications, minimum duration is 2 months.
 * When allowSingleMonth is true (e.g. stay extension), 1-month duration is permitted.
 */
export function calculateStayPricing(
  roomType: any,
  durationMonths: number | string,
  tiers: RoomPricingTier[] = DEFAULT_ROOM_PRICING_TIERS,
  allowSingleMonth: boolean = false
) {
  const minDuration = allowSingleMonth ? 1 : 2;
  const months = Math.max(minDuration, Math.round(Number(durationMonths) || minDuration));
  const isPrivate = normalizeRoomType(roomType) === 'Private';
  const monthlyRate = getRoomPrice(roomType, months, tiers);
  const totalPrice = monthlyRate * months;

  return {
    monthlyRate,
    totalPrice,
    durationMonths: months,
    isPrivate,
    roomType: isPrivate ? ('Private' as const) : ('Shared' as const)
  };
}

/**
 * Calculate pricing for stay extensions (allows 1, 2, 3, 6, 12 months)
 * Always uses the centralized pricing system.
 */
export function calculateExtensionPricing(
  roomType: any,
  extensionMonths: number | string,
  tiers: RoomPricingTier[] = DEFAULT_ROOM_PRICING_TIERS
) {
  return calculateStayPricing(roomType, extensionMonths, tiers, true);
}

/**
 * Accurately calculate the new expiry date when extending a stay by a given number of months.
 * Preserves day of month and handles differing month lengths and leap years via UTC calculations.
 */
export function calculateExtendedExpiryDate(
  currentEndDateStr: string | undefined | null,
  additionalMonths: number | string
): string {
  const months = Math.max(1, Math.round(Number(additionalMonths) || 1));
  let cleanStr = currentEndDateStr ? currentEndDateStr.split('T')[0] : '';
  
  // If invalid or missing date, default to current UTC date
  if (!cleanStr || !/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    const today = new Date();
    cleanStr = today.toISOString().split('T')[0];
  }

  const parts = cleanStr.split('-');
  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10) - 1; // 0-indexed in JS
  let day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    const d = new Date();
    year = d.getUTCFullYear();
    month = d.getUTCMonth();
    day = d.getUTCDate();
  }

  const targetMonth = month + months;
  const targetYear = year + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;

  // Find max days in the target month (day 0 of next month in UTC)
  const maxDaysInTargetMonth = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  const finalDay = Math.min(day, maxDaysInTargetMonth);

  const finalDate = new Date(Date.UTC(targetYear, normalizedMonth, finalDay));
  return finalDate.toISOString().split('T')[0];
}

/**
 * Dynamic Starting Price ("From" price)
 * Returns the lowest available monthly room price across duration tiers and room configurations.
 * The "From" price must always show the lowest available monthly room price ($175/month),
 * not the highest/private-room price ($350/month).
 *
 * @param tiers - Centralized pricing tiers (from DB or default)
 * @param categoryName - Optional category name to find category-specific room prices
 * @param rooms - Optional room list to inspect actual room pricing
 * @param categoryDefaultPrice - Optional category default price to consider if lower
 */
export function getLowestAvailableMonthlyPrice(
  tiers: RoomPricingTier[] = DEFAULT_ROOM_PRICING_TIERS,
  categoryName?: string,
  rooms?: any[],
  categoryDefaultPrice?: number
): number {
  const activeTiers = (Array.isArray(tiers) && tiers.length > 0) ? tiers : DEFAULT_ROOM_PRICING_TIERS;

  // 1. Across all pricing tiers, shared room prices are the lowest monthly rates (e.g. $175/mo for 7+ mo)
  const tierLowest = Math.min(
    ...activeTiers.map(t => Math.min(t.sharedPrice, t.privatePrice))
  );

  let lowest = tierLowest;

  // 2. Check active rooms for this category (or globally) from the database
  if (Array.isArray(rooms) && rooms.length > 0) {
    const matchingRooms = categoryName
      ? rooms.filter(r => {
          if (r.status === 'Inactive') return false;
          const cat = String(r.apartment_name || r.category || '').toLowerCase();
          const target = categoryName.toLowerCase();
          return cat === target || cat.includes(target) || target.includes(cat);
        })
      : rooms.filter(r => r.status !== 'Inactive');

    const roomPrices = matchingRooms
      .map(r => Number(r.price_per_month))
      .filter((p): p is number => typeof p === 'number' && !isNaN(p) && p > 0);

    if (roomPrices.length > 0) {
      lowest = Math.min(lowest, ...roomPrices);
    }
  }

  // 3. If category default price is provided and is lower than or equal to lowest, respect it
  // (Avoid using it if it represents the higher/private room rate)
  if (typeof categoryDefaultPrice === 'number' && !isNaN(categoryDefaultPrice) && categoryDefaultPrice > 0) {
    if (categoryDefaultPrice <= lowest) {
      lowest = categoryDefaultPrice;
    }
  }

  return lowest;
}
