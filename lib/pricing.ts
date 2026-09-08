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

export const DEFAULT_ROOM_PRICING_TIERS: RoomPricingTier[] = [
  { id: 'tier_1_2', durationMin: 1, durationMax: 2, label: '1–2 months', sharedPrice: 200, privatePrice: 350 },
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

  // Find tier where durationMonths is within range
  const matchedTier = activeTiers.find(t => months >= t.durationMin && months <= t.durationMax);

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
 */
export function calculateStayPricing(
  roomType: any,
  durationMonths: number | string,
  tiers: RoomPricingTier[] = DEFAULT_ROOM_PRICING_TIERS
) {
  const months = Math.max(1, Math.round(Number(durationMonths) || 1));
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
