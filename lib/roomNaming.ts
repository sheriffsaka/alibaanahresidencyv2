import { AccommodationAddresses, DEFAULT_ACCOMMODATION_ADDRESSES } from '../types';

export const ACCOMMODATION_ADDRESSES: Record<string, string> = {
  'Premium 1': '11, Samir Moursey Street, Nasr City, Cairo.',
  'Premium 2': '2 Ezzat Salamat Street, Off Kaabool, Makram Ebeid, Nasr City, Cairo.',
  'Standard': '24 Saqaliyyah Street, Off Kaabool, Makram Ebeid, Nasr City, Cairo.',
};

export const getAccommodationAddress = (
  category?: string, 
  customAddresses?: AccommodationAddresses | Record<string, string>,
  knownCategories?: { id: string; name: string; address?: string }[]
): string => {
  if (knownCategories && Array.isArray(knownCategories) && category) {
    const found = knownCategories.find(c => c.name.toLowerCase() === category.trim().toLowerCase() || c.id.toLowerCase() === category.trim().toLowerCase());
    if (found?.address) return found.address;
  }

  const addresses = customAddresses || ACCOMMODATION_ADDRESSES;
  if (!category) return addresses['Standard'] || ACCOMMODATION_ADDRESSES['Standard'];
  
  const cat = category.trim();
  if (addresses[cat]) return addresses[cat];

  const p1 = addresses['Premium 1'] || ACCOMMODATION_ADDRESSES['Premium 1'];
  const p2 = addresses['Premium 2'] || ACCOMMODATION_ADDRESSES['Premium 2'];
  const std = addresses['Standard'] || ACCOMMODATION_ADDRESSES['Standard'];

  if (cat.toLowerCase().includes('premium 2') || cat === 'Apartment 3') {
    return p2;
  }
  if (cat.toLowerCase().includes('standard') || cat === 'Apartment 2') {
    return std;
  }
  if (cat.toLowerCase().includes('premium 1') || cat === 'Apartment 1') {
    return p1;
  }
  return std;
};

export interface RoomSpaceConfig {
  id: string;
  category: string;
  roomName: string;
  bedSpaceName: string;
  type: 'Shared' | 'Private';
  displayName: string; // e.g. "Premium 1, Room 1, Bed Space: Bed A"
  apartmentName: string; // e.g. "Premium 1", "Premium 2", "Standard", "Premium 3"
  bedSpaceId?: number;
  roomId?: number;
}

export const ALL_ROOM_SPACES: RoomSpaceConfig[] = [
  // Premium 1 (4 beds total: 2 in Room 1, 1 in Room 2, 1 in Room 3)
  { id: 'p1_r1_a', category: 'Premium 1', roomName: 'Room 1', bedSpaceName: 'Bed A', type: 'Shared', displayName: 'Premium 1, Room 1, Bed Space: Bed A', apartmentName: 'Premium 1' },
  { id: 'p1_r1_b', category: 'Premium 1', roomName: 'Room 1', bedSpaceName: 'Bed B', type: 'Shared', displayName: 'Premium 1, Room 1, Bed Space: Bed B', apartmentName: 'Premium 1' },
  { id: 'p1_r2', category: 'Premium 1', roomName: 'Room 2', bedSpaceName: 'Single', type: 'Private', displayName: 'Premium 1, Room 2 (Private)', apartmentName: 'Premium 1' },
  { id: 'p1_r3', category: 'Premium 1', roomName: 'Room 3', bedSpaceName: 'Single', type: 'Private', displayName: 'Premium 1, Room 3 (Private)', apartmentName: 'Premium 1' },

  // Premium 2 (4 beds total: 2 in Room 1, 1 in Room 2, 1 in Room 3)
  { id: 'p2_r1_a', category: 'Premium 2', roomName: 'Room 1', bedSpaceName: 'Bed A', type: 'Shared', displayName: 'Premium 2, Room 1, Bed Space: Bed A', apartmentName: 'Premium 2' },
  { id: 'p2_r1_b', category: 'Premium 2', roomName: 'Room 1', bedSpaceName: 'Bed B', type: 'Shared', displayName: 'Premium 2, Room 1, Bed Space: Bed B', apartmentName: 'Premium 2' },
  { id: 'p2_r2', category: 'Premium 2', roomName: 'Room 2', bedSpaceName: 'Single', type: 'Private', displayName: 'Premium 2, Room 2 (Private)', apartmentName: 'Premium 2' },
  { id: 'p2_r3', category: 'Premium 2', roomName: 'Room 3', bedSpaceName: 'Single', type: 'Private', displayName: 'Premium 2, Room 3 (Private)', apartmentName: 'Premium 2' },

  // Standard (7 beds total: 2 in Room 1, 2 in Room 2, 1 in Room 3, 2 in Room 4)
  { id: 'std_r1_a', category: 'Standard', roomName: 'Room 1', bedSpaceName: 'Bed A', type: 'Shared', displayName: 'Standard, Room 1, Bed Space: Bed A', apartmentName: 'Standard' },
  { id: 'std_r1_b', category: 'Standard', roomName: 'Room 1', bedSpaceName: 'Bed B', type: 'Shared', displayName: 'Standard, Room 1, Bed Space: Bed B', apartmentName: 'Standard' },
  { id: 'std_r2_a', category: 'Standard', roomName: 'Room 2', bedSpaceName: 'Bed A', type: 'Shared', displayName: 'Standard, Room 2, Bed Space: Bed A', apartmentName: 'Standard' },
  { id: 'std_r2_b', category: 'Standard', roomName: 'Room 2', bedSpaceName: 'Bed B', type: 'Shared', displayName: 'Standard, Room 2, Bed Space: Bed B', apartmentName: 'Standard' },
  { id: 'std_r3', category: 'Standard', roomName: 'Room 3', bedSpaceName: 'Single', type: 'Private', displayName: 'Standard, Room 3 (Private)', apartmentName: 'Standard' },
  { id: 'std_r4_a', category: 'Standard', roomName: 'Room 4', bedSpaceName: 'Bed A', type: 'Shared', displayName: 'Standard, Room 4, Bed Space: Bed A', apartmentName: 'Standard' },
  { id: 'std_r4_b', category: 'Standard', roomName: 'Room 4', bedSpaceName: 'Bed B', type: 'Shared', displayName: 'Standard, Room 4, Bed Space: Bed B', apartmentName: 'Standard' }
];

export const BED_SPACE_TO_ID_MAP: Record<string, number> = {
  'p1_r1_a': 1,
  'p1_r1_b': 2,
  'p1_r2': 3,
  'p1_r3': 4,
  'p2_r1_a': 5,
  'p2_r1_b': 6,
  'p2_r2': 7,
  'p2_r3': 8,
  'std_r1_a': 9,
  'std_r1_b': 10,
  'std_r2_a': 11,
  'std_r2_b': 12,
  'std_r3': 13,
  'std_r4_a': 14,
  'std_r4_b': 15,
  'std_r4': 14
};

export const ID_TO_BED_SPACE_MAP: Record<number, string> = {
  1: 'p1_r1_a',
  2: 'p1_r1_b',
  3: 'p1_r2',
  4: 'p1_r3',
  5: 'p2_r1_a',
  6: 'p2_r1_b',
  7: 'p2_r2',
  8: 'p2_r3',
  9: 'std_r1_a',
  10: 'std_r1_b',
  11: 'std_r2_a',
  12: 'std_r2_b',
  13: 'std_r3',
  14: 'std_r4_a',
  15: 'std_r4_b'
};

export const extractRoomNumber = (code?: string | null): string => {
  if (!code) return '1';
  const str = String(code).trim();
  
  // 1. Specific match for R followed by digits (e.g. P1-R3, STD-R2, R4-A, Room 2)
  const rMatch = str.match(/(?:R|Room)[-_ ]?(\d+)/i);
  if (rMatch) return rMatch[1];
  
  // 2. Fallback: match last digit sequence if no explicit R-prefix
  const lastDigitsMatch = str.match(/(\d+)(?!.*\d)/);
  if (lastDigitsMatch) return lastDigitsMatch[1];
  
  return str;
};

export const normalizeCategory = (
  apartmentName?: string, 
  category?: string, 
  roomNumber?: string,
  knownCategories?: { id: string; name: string; code?: string }[] | string[]
): string => {
  const norm = (str?: string) => (str || '').trim();
  const apt = norm(apartmentName);
  const cat = norm(category);
  const rCode = norm(roomNumber);
  
  // 1. Check against known categories list if provided
  if (knownCategories && Array.isArray(knownCategories) && knownCategories.length > 0) {
    const list = knownCategories.map(c => typeof c === 'string' ? { id: c.toLowerCase(), name: c, code: '' } : c);
    
    if (apt) {
      const match = list.find(c => 
        c.name.toLowerCase() === apt.toLowerCase() || 
        c.id.toLowerCase() === apt.toLowerCase() ||
        (c.code && c.code.toLowerCase() === apt.toLowerCase())
      );
      if (match) return match.name;
    }
    if (cat) {
      const match = list.find(c => 
        c.name.toLowerCase() === cat.toLowerCase() || 
        c.id.toLowerCase() === cat.toLowerCase() ||
        (c.code && c.code.toLowerCase() === cat.toLowerCase())
      );
      if (match) return match.name;
    }
    if (rCode) {
      const prefix = rCode.split(/[-_]/)[0]?.toLowerCase();
      if (prefix) {
        const match = list.find(c => 
          (c.code && c.code.toLowerCase() === prefix) ||
          c.id.toLowerCase() === prefix ||
          c.name.toLowerCase().startsWith(prefix)
        );
        if (match) return match.name;
      }
    }
  }

  // 2. If explicit non-empty apartment name is provided, clean and prioritize it
  if (apt && apt !== 'undefined' && apt !== 'null') {
    const aptLower = apt.toLowerCase();
    if (aptLower.includes('premium 3') || aptLower === 'p3' || aptLower === 'p3-') return 'Premium 3';
    if (aptLower.includes('premium 2') || aptLower === 'p2' || aptLower === 'p2-') return 'Premium 2';
    if (aptLower.includes('premium 1') || aptLower === 'p1' || aptLower === 'p1-') return 'Premium 1';
    if (aptLower.includes('standard') || aptLower === 'std' || aptLower === 'std-') return 'Standard';
    return apt;
  }

  const aptLower = apt.toLowerCase();
  const catLower = cat.toLowerCase();
  const rLower = rCode.toLowerCase();

  // 3. Fallback heuristic pattern matching
  if (aptLower.includes('premium 3') || catLower.includes('premium 3') || rLower.startsWith('p3')) {
    return 'Premium 3';
  }
  if (aptLower.includes('premium 2') || catLower.includes('premium 2') || rLower.startsWith('p2')) {
    return 'Premium 2';
  }
  if (aptLower.includes('premium 1') || catLower.includes('premium 1') || rLower.startsWith('p1')) {
    return 'Premium 1';
  }
  if (aptLower.includes('standard') || catLower.includes('standard') || rLower.startsWith('std')) {
    return 'Standard';
  }

  // General numbered premium e.g. "Premium 4"
  const pMatch = (apt + ' ' + cat + ' ' + rCode).match(/premium\s*(\d+)/i) || rCode.match(/^p(\d+)/i);
  if (pMatch) {
    return `Premium ${pMatch[1]}`;
  }

  if (cat && cat !== 'undefined' && cat !== 'null') {
    return cat;
  }

  return 'Standard';
};

// Generates the category code prefix (e.g. Premium 1 -> P1, Premium 2 -> P2, Premium 3 -> P3, Standard -> STD)
export const getCategoryPrefix = (
  category?: string, 
  knownCategories?: { id: string; name: string; code?: string }[] | string[]
): string => {
  if (!category) return 'STD';
  const clean = category.trim();
  const lower = clean.toLowerCase();

  // Check known categories
  if (knownCategories && Array.isArray(knownCategories)) {
    const list = knownCategories.map(c => typeof c === 'string' ? { id: c.toLowerCase(), name: c, code: '' } : c);
    const found = list.find(c => c.name.toLowerCase() === lower || c.id.toLowerCase() === lower);
    if (found?.code) return found.code.toUpperCase();
  }

  if (lower.includes('premium 1') || lower === 'p1') return 'P1';
  if (lower.includes('premium 2') || lower === 'p2') return 'P2';
  if (lower.includes('premium 3') || lower === 'p3') return 'P3';
  if (lower.includes('premium 4') || lower === 'p4') return 'P4';
  
  const numMatch = lower.match(/premium\s*(\d+)/);
  if (numMatch) return `P${numMatch[1]}`;

  if (lower.includes('standard') || lower === 'std') return 'STD';
  if (lower.includes('premium') || lower === 'prm') return 'PRM';
  
  // Custom category: extract uppercase initials or short alphanumeric code
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return words.map(w => w[0]).join('').toUpperCase();
  }
  return clean.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'STD';
};

// Automatically generates the standardized Unit Code (e.g. Premium 3 + Room 1 => P3-R1)
export const generateUnitCode = (
  category: string, 
  roomNumberOrDigit: string | number,
  knownCategories?: { id: string; name: string; code?: string }[] | string[]
): string => {
  const prefix = getCategoryPrefix(category, knownCategories);
  const digit = extractRoomNumber(String(roomNumberOrDigit));
  return `${prefix}-R${digit}`;
};

export const getUnifiedRoomName = (category: string, roomNameOrNumber: string, bedSpaceName?: string): string => {
  const catClean = normalizeCategory(category, category);
  const roomDigit = extractRoomNumber(roomNameOrNumber);
  const roomName = `Room ${roomDigit}`;
  
  const isPrivate = bedSpaceName && (
    bedSpaceName.toLowerCase().includes('single') || 
    bedSpaceName.toLowerCase().includes('private') || 
    bedSpaceName.toLowerCase() === 'n/a'
  );
  
  if (isPrivate) {
    return `${catClean}, ${roomName} (Private)`;
  } else {
    const bed = bedSpaceName && bedSpaceName.trim() && 
                bedSpaceName.toLowerCase() !== 'n/a' && 
                bedSpaceName.toLowerCase() !== 'single'
      ? (bedSpaceName.trim().toLowerCase().startsWith('bed') ? bedSpaceName.trim() : `Bed ${bedSpaceName.trim()}`)
      : 'Bed A';
    return `${catClean}, ${roomName}, Bed Space: ${bed}`;
  }
};

// Converts a database Room record into the standardized display format
export const getDisplayFromRoom = (room: any, bedSpaceLabel?: string): string => {
  if (!room) return '';
  const category = normalizeCategory(room.apartment_name, room.category, room.room_number);
  const roomDigit = extractRoomNumber(room.room_number || room.roomName || room.name);
  const roomName = `Room ${roomDigit}`;
  const isPrivate = room.type?.toLowerCase().includes('private') || (room.capacity || 1) === 1;
  
  if (isPrivate || bedSpaceLabel?.toLowerCase() === 'single') {
    return `${category}, ${roomName} (Private)`;
  }
  
  if (bedSpaceLabel) {
    const bed = bedSpaceLabel.toLowerCase().startsWith('bed') ? bedSpaceLabel : `Bed ${bedSpaceLabel}`;
    return `${category}, ${roomName}, Bed Space: ${bed}`;
  }
  
  return `${category}, ${roomName} (Shared)`;
};

// Help extract components if a stored room string needs to be formatted or parsed
export const formatStoredRoomString = (storedStr: string): string => {
  if (!storedStr) return '';
  
  // If already formatted in standard style, return directly
  if (storedStr.includes(', Room ') || storedStr.includes('–')) {
    return storedStr;
  }
  
  // Format is likely: "Premium 1 - Room 1 (Bed A)" or "P1-R1" or similar
  if (storedStr.includes('-')) {
    const parts = storedStr.split('-');
    if (parts.length >= 2) {
      const category = parts[0].trim();
      const remaining = parts.slice(1).join('-').trim();
      
      const match = remaining.match(/(Room\s+\d+|Room\d+|R\d+)\s*\(([^)]+)\)/i);
      if (match) {
        const roomName = match[1].trim();
        const bedSpaceName = match[2].trim();
        return getUnifiedRoomName(category, roomName, bedSpaceName);
      }
    }
  }

  // If code like P1-R1, STD-R2
  const rDigit = extractRoomNumber(storedStr);
  const cat = normalizeCategory('', '', storedStr);
  return `${cat}, Room ${rDigit}`;
};

export const findDatabaseRoomForSpace = (
  rooms: any[], 
  space: { category: string; type: 'Shared' | 'Private'; roomName?: string; id?: string; roomId?: number },
  knownCategories?: { id: string; name: string; code?: string }[] | string[]
) => {
  if (!rooms || rooms.length === 0) return null;

  // 1. Direct roomId match
  if (space.roomId) {
    const directMatch = rooms.find(r => r.id === space.roomId);
    if (directMatch) return directMatch;
  }

  const isPrivate = space.type === 'Private';
  const catNormalized = normalizeCategory(space.category, '', '', knownCategories);
  const catKey = catNormalized.toLowerCase().replace(/\s+/g, '');
  const spaceRoomDigit = space.roomName ? extractRoomNumber(space.roomName) : '';
  
  // 2. Exact Unit Code match (e.g. P3-R1, STD-R2, P1-R1)
  if (spaceRoomDigit) {
    const expectedUnitCode = generateUnitCode(catNormalized, spaceRoomDigit, knownCategories).toLowerCase();
    const unitMatch = rooms.find(r => {
      const rNum = (r.room_number || "").trim().toLowerCase();
      const rCat = normalizeCategory(r.apartment_name, r.category, r.room_number, knownCategories).toLowerCase().replace(/\s+/g, "");
      return (rNum === expectedUnitCode || rNum === `room ${spaceRoomDigit}`.toLowerCase() || rNum === spaceRoomDigit) && rCat === catKey;
    });
    if (unitMatch) return unitMatch;
  }

  // 3. Match by category name & room digit
  if (spaceRoomDigit) {
    const catRoomMatch = rooms.find(r => {
      const rCat = normalizeCategory(r.apartment_name, r.category, r.room_number, knownCategories).toLowerCase().replace(/\s+/g, "");
      const rDigit = extractRoomNumber(r.room_number || String(r.id));
      return rCat === catKey && rDigit === spaceRoomDigit;
    });
    if (catRoomMatch) return catRoomMatch;
  }

  // 4. Match by category and room type
  const typeMatch = rooms.find(r => {
    const rCat = normalizeCategory(r.apartment_name, r.category, r.room_number, knownCategories).toLowerCase().replace(/\s+/g, "");
    const rType = (r.type || "").toLowerCase();
    const matchesType = rType.includes(isPrivate ? "private" : "shared") || (isPrivate ? r.capacity === 1 : (r.capacity || 2) > 1);
    return rCat === catKey && matchesType;
  });

  if (typeMatch) return typeMatch;

  // 5. Match by category alone
  const catOnlyMatch = rooms.find(r => {
    const rCat = normalizeCategory(r.apartment_name, r.category, r.room_number, knownCategories).toLowerCase().replace(/\s+/g, "");
    return rCat === catKey;
  });

  return catOnlyMatch || rooms[0] || null;
};

export interface ParsedRoomSpace extends RoomSpaceConfig {
  isOccupied: boolean;
  booking?: any;
  dbRoom?: any;
  supabaseRoom?: any;
  nextAvailableDate: string;
}

export const getDynamicRoomSpaces = (
  rooms: any[] = [], 
  bedSpaces: any[] = [], 
  options?: { includeInactive?: boolean },
  knownCategories?: { id: string; name: string }[] | string[]
): RoomSpaceConfig[] => {
  if (!rooms || rooms.length === 0) {
    return ALL_ROOM_SPACES;
  }

  const validRooms = rooms.filter(r => {
    if (!r || !r.id) return false;
    if (options?.includeInactive === false && r.status === 'Inactive') {
      return false;
    }
    return true;
  });
  const categoryOrder: Record<string, number> = { 'Premium 1': 1, 'Premium 2': 2, 'Standard': 3, 'Premium 3': 4 };
  
  const sortedRooms = [...validRooms].sort((a, b) => {
    const catA = normalizeCategory(a.apartment_name, a.category, a.room_number, knownCategories);
    const catB = normalizeCategory(b.apartment_name, b.category, b.room_number, knownCategories);
    const ordA = categoryOrder[catA] || 99;
    const ordB = categoryOrder[catB] || 99;
    if (ordA !== ordB) return ordA - ordB;
    const rNumA = parseInt(extractRoomNumber(a.room_number || String(a.id)), 10) || 0;
    const rNumB = parseInt(extractRoomNumber(b.room_number || String(b.id)), 10) || 0;
    if (rNumA !== rNumB) return rNumA - rNumB;
    return (a.id || 0) - (b.id || 0);
  });

  const generatedSpaces: RoomSpaceConfig[] = [];

  for (const room of sortedRooms) {
    const category = normalizeCategory(room.apartment_name, room.category, room.room_number, knownCategories);
    const catClean = category.trim();
    let catPrefix = 'std';
    if (catClean.toLowerCase().includes('premium 1')) catPrefix = 'p1';
    else if (catClean.toLowerCase().includes('premium 2')) catPrefix = 'p2';
    else if (catClean.toLowerCase().includes('premium 3')) catPrefix = 'p3';
    else if (catClean.toLowerCase().includes('standard')) catPrefix = 'std';
    else catPrefix = catClean.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 8);
    
    const roomDigit = extractRoomNumber(room.room_number || String(room.id));
    const roomName = `Room ${roomDigit}`;
    
    const isPrivate = (room.type || '').toLowerCase().includes('private') || (room.capacity || 1) === 1;
    const roomType: 'Shared' | 'Private' = isPrivate ? 'Private' : 'Shared';
    
    const relatedBeds = (bedSpaces || []).filter(b => b.room_id === room.id).sort((a, b) => (a.id || 0) - (b.id || 0));

    if (relatedBeds.length > 0) {
      for (const b of relatedBeds) {
        const bedLabel = b.label || (isPrivate ? 'Single' : 'Bed A');
        const bedSuffix = bedLabel.toLowerCase().includes('bed b') || bedLabel.toLowerCase() === 'b' ? '_b' : 
                         bedLabel.toLowerCase().includes('bed a') || bedLabel.toLowerCase() === 'a' ? '_a' : 
                         bedLabel.toLowerCase().includes('bed c') || bedLabel.toLowerCase() === 'c' ? '_c' : 
                         bedLabel.toLowerCase().includes('bed d') || bedLabel.toLowerCase() === 'd' ? '_d' : '';
        const spaceId = `${catPrefix}_r${roomDigit}${bedSuffix}`;
        generatedSpaces.push({
          id: spaceId,
          category,
          roomName,
          bedSpaceName: bedLabel,
          type: isPrivate || bedLabel.toLowerCase() === 'single' ? 'Private' : 'Shared',
          displayName: getUnifiedRoomName(category, roomName, bedLabel),
          apartmentName: category,
          bedSpaceId: b.id,
          roomId: room.id,
        });
      }
    } else {
      const capacity = Math.max(1, room.capacity || (isPrivate ? 1 : 2));
      if (isPrivate || capacity === 1) {
        generatedSpaces.push({
          id: `${catPrefix}_r${roomDigit}`,
          category,
          roomName,
          bedSpaceName: 'Single',
          type: 'Private',
          displayName: getUnifiedRoomName(category, roomName, 'Single'),
          apartmentName: category,
          roomId: room.id,
        });
      } else {
        for (let i = 0; i < capacity; i++) {
          const letter = String.fromCharCode(65 + i);
          const bedLabel = `Bed ${letter}`;
          generatedSpaces.push({
            id: `${catPrefix}_r${roomDigit}_${letter.toLowerCase()}`,
            category,
            roomName,
            bedSpaceName: bedLabel,
            type: 'Shared',
            displayName: getUnifiedRoomName(category, roomName, bedLabel),
            apartmentName: category,
            roomId: room.id,
          });
        }
      }
    }
  }

  const seenIds = new Set<string>();
  const uniqueSpaces: RoomSpaceConfig[] = [];
  for (const s of generatedSpaces) {
    if (!seenIds.has(s.id)) {
      seenIds.add(s.id);
      uniqueSpaces.push(s);
    }
  }

  return uniqueSpaces.length > 0 ? uniqueSpaces : ALL_ROOM_SPACES;
};

export const getParsedRoomSpaces = (
  rooms: any[], 
  bookings: any[], 
  bedSpaces?: any[],
  options?: { includeInactive?: boolean },
  knownCategories?: { id: string; name: string; code?: string }[] | string[]
): ParsedRoomSpace[] => {
  const isCancelledOrCompleted = (status?: string) => {
    if (!status) return false;
    const s = String(status).toUpperCase();
    return s === "CANCELLED" || s === "COMPLETED" || s === "REJECTED" || s === "DISCONTINUED";
  };

  const spacesList = getDynamicRoomSpaces(rooms, bedSpaces, options, knownCategories);

  // Active bookings include:
  // 1) PublicOccupancy items where is_held is true
  // 2) Full booking records where status is active (not Cancelled/Completed)
  const activeBookings = (bookings || []).filter(b => {
    if ("is_held" in b) {
      return b.is_held === true;
    }
    return !isCancelledOrCompleted(b.status);
  });

  // Map to hold space assignments: space.id -> booking
  const spaceBookingMap = new Map<string, any>();
  const unassignedBookings: { booking: any; details: LiveRoomDetails }[] = [];

  // Pass 0: Direct bed_space_id matching if bed_space_id exists on booking / public occupancy
  for (const b of activeBookings) {
    if (b.bed_space_id != null) {
      // Find space by bed_space_id
      const matchedSpace = spacesList.find(space => {
        if (space.bedSpaceId && space.bedSpaceId === b.bed_space_id) return true;
        const expectedBedId = BED_SPACE_TO_ID_MAP[space.id];
        return expectedBedId === b.bed_space_id;
      });
      if (matchedSpace) {
        spaceBookingMap.set(matchedSpace.id, b);
        continue;
      }
    }

    // Pass 1: Match bookings that specify their exact bed/room space
    const details = getLiveStudentRoomDetails(b, rooms || [], undefined, knownCategories);
    
    const exactMatch = spacesList.find(space => {
      const matchCat = space.category.toLowerCase().replace(/\s+/g, "") === details.category.toLowerCase().replace(/\s+/g, "");
      const matchRoom = space.roomName.toLowerCase().replace(/\s+/g, "") === details.roomName.toLowerCase().replace(/\s+/g, "");
      
      if (space.type === "Private") {
        return matchCat && matchRoom;
      }
      
      const matchBed = space.bedSpaceName.toLowerCase().replace(/\s+/g, "") === details.bedSpaceName.toLowerCase().replace(/\s+/g, "");
      return matchCat && matchRoom && matchBed;
    });

    if (exactMatch && !spaceBookingMap.has(exactMatch.id)) {
      spaceBookingMap.set(exactMatch.id, b);
    } else {
      unassignedBookings.push({ booking: b, details });
    }
  }

  // Pass 2: If there are unassigned bookings (e.g. only category was specified), assign them to the first available space in that category
  for (const { booking, details } of unassignedBookings) {
    const availableSpace = spacesList.find(space => {
      if (spaceBookingMap.has(space.id)) return false;
      const matchCat = space.category.toLowerCase().replace(/\s+/g, "") === details.category.toLowerCase().replace(/\s+/g, "");
      const isPrivateBooking = String(details.fullDisplay || booking.preferred_accommodation || "").toLowerCase().includes("private");
      const matchType = (space.type === "Private") === isPrivateBooking;
      return matchCat && matchType;
    }) || spacesList.find(space => {
      if (spaceBookingMap.has(space.id)) return false;
      return space.category.toLowerCase().replace(/\s+/g, "") === details.category.toLowerCase().replace(/\s+/g, "");
    });

    if (availableSpace) {
      spaceBookingMap.set(availableSpace.id, booking);
    }
  }

  return spacesList.map(space => {
    const dbRoom = space.roomId ? (rooms || []).find(r => r.id === space.roomId) : findDatabaseRoomForSpace(rooms || [], space, knownCategories);
    const assignedBooking = spaceBookingMap.get(space.id);
    const isOccupied = !!assignedBooking;

    let nextAvailableDate = "Available Now";

    if (isOccupied && assignedBooking) {
      const rawDate = assignedBooking.end_date || assignedBooking.payment_expiry_date;
      if (rawDate) {
        try {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            nextAvailableDate = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
          } else {
            nextAvailableDate = rawDate;
          }
        } catch (e) {
          nextAvailableDate = rawDate;
        }
      } else {
        nextAvailableDate = "Occupied";
      }
    }

    return {
      ...space,
      isOccupied,
      booking: assignedBooking,
      dbRoom,
      supabaseRoom: dbRoom,
      nextAvailableDate
    };
  });
};

export interface LiveRoomDetails {
  category: string;
  roomName: string;
  bedSpaceName: string;
  fullDisplay: string;
  address: string;
}

export const getLiveStudentRoomDetails = (
  booking: any, 
  roomsList: any[] = [], 
  customAddresses?: AccommodationAddresses | Record<string, string>,
  knownCategories?: { id: string; name: string; code?: string }[] | string[]
): LiveRoomDetails => {
  // 0. Locate corresponding Database Room first (Database is the absolute source of truth)
  const dbRoom = (roomsList || []).find(r => r.id === booking?.room_id);
  const rawRoomObj = dbRoom || booking?.rooms;

  // Direct bed_space_id lookup if present in static map or matches dynamic beds
  if (booking?.bed_space_id != null) {
    const spaceId = ID_TO_BED_SPACE_MAP[booking.bed_space_id];
    if (spaceId) {
      const spaceObj = ALL_ROOM_SPACES.find(s => s.id === spaceId);
      if (spaceObj) {
        // If dbRoom has an updated category (like renamed from Standard to Premium 3), use dbRoom category
        const category = dbRoom 
          ? normalizeCategory(dbRoom.apartment_name, dbRoom.category, dbRoom.room_number, knownCategories)
          : normalizeCategory(spaceObj.category, "", "", knownCategories);
        const roomDigit = dbRoom ? extractRoomNumber(dbRoom.room_number || String(dbRoom.id)) : extractRoomNumber(spaceObj.roomName);
        const roomName = `Room ${roomDigit}`;
        const bedSpaceName = spaceObj.bedSpaceName;
        return {
          category,
          roomName,
          bedSpaceName,
          fullDisplay: getUnifiedRoomName(category, roomName, bedSpaceName),
          address: getAccommodationAddress(category, customAddresses)
        };
      }
    }
  }

  // 1. Gather all potential specific space descriptors
  const candidates: string[] = [
    typeof dbRoom?.room_number === "string" ? dbRoom.room_number : "",
    typeof dbRoom?.apartment_name === "string" ? dbRoom.apartment_name : "",
    typeof booking?.rooms?.room_number === "string" ? booking.rooms.room_number : "",
    typeof booking?.room_number === "string" ? booking.room_number : "",
    typeof booking?.preferred_accommodation === "string" ? booking.preferred_accommodation : "",
    typeof booking?.assigned_space === "string" ? booking.assigned_space : "",
    typeof booking?.assigned_space_id === "string" ? booking.assigned_space_id : "",
  ].filter(Boolean);

  // 2. Category Detection: Prioritize database room
  let category = normalizeCategory(
    rawRoomObj?.apartment_name, 
    rawRoomObj?.category, 
    rawRoomObj?.room_number,
    knownCategories
  );

  // If still ambiguous or default, check candidates with normalizeCategory
  if (candidates.length > 0) {
    for (const cand of candidates) {
      const detected = normalizeCategory("", "", cand, knownCategories);
      if (detected !== "Standard" || cand.toLowerCase().includes("standard")) {
        category = detected;
        break;
      }
    }
  }

  // 3. Room Number Extraction
  let roomName = "";
  if (rawRoomObj?.room_number) {
    const digit = extractRoomNumber(rawRoomObj.room_number);
    roomName = `Room ${digit}`;
  }

  if (!roomName) {
    for (const str of candidates) {
      const roomMatch = str.match(/(?:Room|R)[-_ ]?(\d+)/i) || str.match(/(?:P\d+|STD)-R(\d+)/i);
      if (roomMatch) {
        roomName = `Room ${roomMatch[1] || roomMatch[2]}`;
        break;
      }
    }
  }

  if (!roomName) {
    roomName = "Room 1";
  }

  // 4. Bed Space Extraction
  let bedSpaceName = "";
  for (const str of candidates) {
    if (/(?:Bed\s*D|\bD\b|BedD|_d\b)/i.test(str)) {
      bedSpaceName = "Bed D";
      break;
    } else if (/(?:Bed\s*C|\bC\b|BedC|_c\b)/i.test(str)) {
      bedSpaceName = "Bed C";
      break;
    } else if (/(?:Bed\s*B|\bB\b|BedB|_b\b)/i.test(str)) {
      bedSpaceName = "Bed B";
      break;
    } else if (/(?:Bed\s*A|\bA\b|BedA|_a\b)/i.test(str)) {
      bedSpaceName = "Bed A";
      break;
    } else if (/Single|Private/i.test(str)) {
      bedSpaceName = "Single";
      break;
    }
  }

  // Determine if this room is private in this accommodation
  const isPrivate = rawRoomObj?.type 
    ? rawRoomObj.type.toLowerCase().includes("private") || (rawRoomObj.capacity === 1 && !rawRoomObj.type.toLowerCase().includes("shared"))
    : (/private/i.test(candidates.join(" ")) || bedSpaceName === "Single");

  if (isPrivate) {
    bedSpaceName = "Single";
  } else if (!bedSpaceName) {
    bedSpaceName = "Bed A";
  }

  const fullDisplay = getUnifiedRoomName(category, roomName, bedSpaceName);

  return {
    category,
    roomName,
    bedSpaceName,
    fullDisplay,
    address: getAccommodationAddress(category, customAddresses)
  };
};
