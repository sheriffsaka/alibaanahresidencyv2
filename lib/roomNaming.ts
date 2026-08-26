import { AccommodationAddresses, DEFAULT_ACCOMMODATION_ADDRESSES } from '../types';

export const ACCOMMODATION_ADDRESSES: Record<string, string> = {
  'Premium 1': '11, Samir Moursey Street, Nasr City, Cairo.',
  'Premium 2': '2 Ezzat Salamat Street, Off Kaabool, Makram Ebeid, Nasr City, Cairo.',
  'Standard': '24 Saqaliyyah Street, Off Kaabool, Makram Ebeid, Nasr City, Cairo.',
};

export const getAccommodationAddress = (category?: string, customAddresses?: AccommodationAddresses | Record<string, string>): string => {
  const addresses = customAddresses || ACCOMMODATION_ADDRESSES;
  const p1 = addresses['Premium 1'] || ACCOMMODATION_ADDRESSES['Premium 1'];
  const p2 = addresses['Premium 2'] || ACCOMMODATION_ADDRESSES['Premium 2'];
  const std = addresses['Standard'] || ACCOMMODATION_ADDRESSES['Standard'];

  if (!category) return std;
  const cat = category.trim();
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
  category: 'Standard' | 'Premium 1' | 'Premium 2';
  roomName: string;
  bedSpaceName: string;
  type: 'Shared' | 'Private';
  displayName: string; // e.g. "Premium 1 – Room 1 (Shared Room) – Bed A"
  apartmentName: string; // e.g. "Premium 1", "Premium 2", "Standard"
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

export const normalizeCategory = (apartmentName?: string, category?: string, roomNumber?: string): 'Standard' | 'Premium 1' | 'Premium 2' => {
  const norm = (str?: string) => (str || '').trim().toLowerCase();
  const apt = norm(apartmentName);
  const cat = norm(category);
  const rCode = norm(roomNumber);
  
  if (apt.includes('premium 1') || rCode.startsWith('p1') || (cat.includes('premium') && !apt.includes('premium 2') && !rCode.startsWith('p2') && !apt.includes('standard'))) {
    if (apt.includes('premium 2') || rCode.startsWith('p2')) return 'Premium 2';
    return 'Premium 1';
  }
  if (apt.includes('premium 2') || rCode.startsWith('p2')) {
    return 'Premium 2';
  }
  if (apt.includes('standard') || cat.includes('standard') || rCode.startsWith('std')) {
    return 'Standard';
  }
  return 'Standard';
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

export const findDatabaseRoomForSpace = (rooms: any[], space: { category: string; type: 'Shared' | 'Private'; roomName?: string; id?: string }) => {
  const isPrivate = space.type === 'Private';
  const catSimple = space.category.startsWith('Premium') ? 'Premium' : 'Standard';
  const catKey = space.category.toLowerCase().replace(/\s+/g, '');
  
  // Try exact room matching if roomName or id is provided
  if (space.roomName || space.id) {
    const spaceId = (space.id || '').toLowerCase();
    let targetRoomNumber = '';
    if (spaceId.startsWith('p1_r1') || (catKey.includes('premium1') && space.roomName === 'Room 1')) targetRoomNumber = 'P1-R1';
    else if (spaceId === 'p1_r2' || (catKey.includes('premium1') && space.roomName === 'Room 2')) targetRoomNumber = 'P1-R2';
    else if (spaceId === 'p1_r3' || (catKey.includes('premium1') && space.roomName === 'Room 3')) targetRoomNumber = 'P1-R3';
    else if (spaceId.startsWith('p2_r1') || (catKey.includes('premium2') && space.roomName === 'Room 1')) targetRoomNumber = 'P2-R1';
    else if (spaceId === 'p2_r2' || (catKey.includes('premium2') && space.roomName === 'Room 2')) targetRoomNumber = 'P2-R2';
    else if (spaceId === 'p2_r3' || (catKey.includes('premium2') && space.roomName === 'Room 3')) targetRoomNumber = 'P2-R3';
    else if (spaceId.startsWith('std_r1') || (catKey.includes('standard') && space.roomName === 'Room 1')) targetRoomNumber = 'STD-R1';
    else if (spaceId.startsWith('std_r2') || (catKey.includes('standard') && space.roomName === 'Room 2')) targetRoomNumber = 'STD-R2';
    else if (spaceId === 'std_r3' || (catKey.includes('standard') && space.roomName === 'Room 3')) targetRoomNumber = 'STD-R3';
    else if (spaceId === 'std_r4' || (catKey.includes('standard') && space.roomName === 'Room 4')) targetRoomNumber = 'STD-R4';

    if (targetRoomNumber) {
      const match = (rooms || []).find(r => r.room_number === targetRoomNumber);
      if (match) return match;
    }
  }

  const match = (rooms || []).find(r => {
    const rCat = (r.apartment_name || r.category || '').toLowerCase().replace(/\s+/g, '');
    const rType = (r.type || '').toLowerCase();
    
    const aptMatch = rCat === catKey || 
      (catKey === 'premium1' && (rCat === 'apartment1' || rCat === 'premium1')) ||
      (catKey === 'premium2' && (rCat === 'apartment3' || rCat === 'premium2')) ||
      (catKey === 'standard' && (rCat === 'apartment2' || rCat === 'standard'));
      
    const typeMatch = rType.includes(isPrivate ? 'private' : 'shared');
    return aptMatch && typeMatch;
  });

  if (match) return match;
  
  // Fallback to category and type matching
  return (rooms || []).find(r => 
    (r.category?.toLowerCase() || '').includes(catSimple.toLowerCase()) && 
    (r.type || '').toLowerCase().includes(isPrivate ? 'private' : 'shared')
  ) || (rooms || [])[0] || null;
};

export interface ParsedRoomSpace extends RoomSpaceConfig {
  isOccupied: boolean;
  booking?: any;
  dbRoom?: any;
  supabaseRoom?: any;
  nextAvailableDate: string;
}

export const getDynamicRoomSpaces = (rooms: any[] = [], bedSpaces: any[] = []): RoomSpaceConfig[] => {
  if (!rooms || rooms.length === 0) {
    return ALL_ROOM_SPACES;
  }

  const validRooms = rooms.filter(r => r && r.id);
  const categoryOrder: Record<string, number> = { 'Premium 1': 1, 'Premium 2': 2, 'Standard': 3 };
  
  const sortedRooms = [...validRooms].sort((a, b) => {
    const catA = normalizeCategory(a.apartment_name, a.category, a.room_number);
    const catB = normalizeCategory(b.apartment_name, b.category, b.room_number);
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
    const category = normalizeCategory(room.apartment_name, room.category, room.room_number);
    const catPrefix = category === 'Premium 1' ? 'p1' : category === 'Premium 2' ? 'p2' : 'std';
    
    const roomDigit = extractRoomNumber(room.room_number || String(room.id));
    const roomName = `Room ${roomDigit}`;
    
    const isPrivate = (room.type || '').toLowerCase().includes('private') || (room.capacity || 1) === 1;
    const roomType: 'Shared' | 'Private' = isPrivate ? 'Private' : 'Shared';
    
    const relatedBeds = (bedSpaces || []).filter(b => b.room_id === room.id).sort((a, b) => (a.id || 0) - (b.id || 0));

    if (relatedBeds.length > 0) {
      for (const b of relatedBeds) {
        const bedLabel = b.label || (isPrivate ? 'Single' : 'Bed A');
        const bedSuffix = bedLabel.toLowerCase().includes('bed b') || bedLabel.toLowerCase() === 'b' ? '_b' : 
                         bedLabel.toLowerCase().includes('bed a') || bedLabel.toLowerCase() === 'a' ? '_a' : '';
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

export const getParsedRoomSpaces = (rooms: any[], bookings: any[], bedSpaces?: any[]): ParsedRoomSpace[] => {
  const isCancelledOrCompleted = (status?: string) => {
    if (!status) return false;
    const s = String(status).toUpperCase();
    return s === 'CANCELLED' || s === 'COMPLETED' || s === 'REJECTED' || s === 'DISCONTINUED';
  };

  const spacesList = getDynamicRoomSpaces(rooms, bedSpaces);

  // Active bookings include:
  // 1) PublicOccupancy items where is_held is true
  // 2) Full booking records where status is active (not Cancelled/Completed)
  const activeBookings = (bookings || []).filter(b => {
    if ('is_held' in b) {
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
    const details = getLiveStudentRoomDetails(b, rooms || []);
    
    const exactMatch = spacesList.find(space => {
      const matchCat = space.category.toLowerCase().replace(/\s+/g, '') === details.category.toLowerCase().replace(/\s+/g, '');
      const matchRoom = space.roomName.toLowerCase().replace(/\s+/g, '') === details.roomName.toLowerCase().replace(/\s+/g, '');
      
      if (space.type === 'Private') {
        return matchCat && matchRoom;
      }
      
      const matchBed = space.bedSpaceName.toLowerCase().replace(/\s+/g, '') === details.bedSpaceName.toLowerCase().replace(/\s+/g, '');
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
      const matchCat = space.category.toLowerCase().replace(/\s+/g, '') === details.category.toLowerCase().replace(/\s+/g, '');
      const isPrivateBooking = String(details.fullDisplay || booking.preferred_accommodation || '').toLowerCase().includes('private');
      const matchType = (space.type === 'Private') === isPrivateBooking;
      return matchCat && matchType;
    }) || spacesList.find(space => {
      if (spaceBookingMap.has(space.id)) return false;
      return space.category.toLowerCase().replace(/\s+/g, '') === details.category.toLowerCase().replace(/\s+/g, '');
    });

    if (availableSpace) {
      spaceBookingMap.set(availableSpace.id, booking);
    }
  }

  return spacesList.map(space => {
    const dbRoom = space.roomId ? (rooms || []).find(r => r.id === space.roomId) : findDatabaseRoomForSpace(rooms || [], space);
    const assignedBooking = spaceBookingMap.get(space.id);
    const isOccupied = !!assignedBooking;

    let nextAvailableDate = 'Available Now';

    if (isOccupied && assignedBooking) {
      const rawDate = assignedBooking.end_date || assignedBooking.payment_expiry_date;
      if (rawDate) {
        try {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            nextAvailableDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          } else {
            nextAvailableDate = rawDate;
          }
        } catch (e) {
          nextAvailableDate = rawDate;
        }
      } else {
        nextAvailableDate = 'Occupied';
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

export const getLiveStudentRoomDetails = (booking: any, roomsList: any[] = [], customAddresses?: AccommodationAddresses | Record<string, string>): LiveRoomDetails => {
  // 0. Direct bed_space_id lookup if present
  if (booking?.bed_space_id != null) {
    const spaceId = ID_TO_BED_SPACE_MAP[booking.bed_space_id];
    if (spaceId) {
      const spaceObj = ALL_ROOM_SPACES.find(s => s.id === spaceId);
      if (spaceObj) {
        return {
          category: spaceObj.category,
          roomName: spaceObj.roomName,
          bedSpaceName: spaceObj.bedSpaceName,
          fullDisplay: spaceObj.displayName,
          address: getAccommodationAddress(spaceObj.category, customAddresses)
        };
      }
    }
  }

  // 1. Gather all potential specific space descriptors from the booking object and database room
  const dbRoom = roomsList.find(r => r.id === booking?.room_id);
  const rawRoomObj = dbRoom || booking?.rooms;

  const candidates: string[] = [
    typeof rawRoomObj?.room_number === 'string' ? rawRoomObj.room_number : '',
    typeof booking?.rooms?.room_number === 'string' ? booking.rooms.room_number : '',
    typeof booking?.room_number === 'string' ? booking.room_number : '',
    typeof booking?.preferred_accommodation === 'string' ? booking.preferred_accommodation : '',
    typeof booking?.assigned_space === 'string' ? booking.assigned_space : '',
    typeof booking?.assigned_space_id === 'string' ? booking.assigned_space_id : '',
  ].filter(Boolean);

  // 2. Direct ID or Display Name match against ALL_ROOM_SPACES
  const matchedSpaceById = ALL_ROOM_SPACES.find(s => 
    candidates.some(c => {
      const cNorm = c.toLowerCase().trim();
      return cNorm === s.id.toLowerCase() || 
             cNorm === s.displayName.toLowerCase() ||
             cNorm === `${s.category} – ${s.roomName} (${s.bedSpaceName})`.toLowerCase() ||
             cNorm === `${s.category} - ${s.roomName} (${s.bedSpaceName})`.toLowerCase();
    })
  );

  if (matchedSpaceById) {
    return {
      category: matchedSpaceById.category,
      roomName: matchedSpaceById.roomName,
      bedSpaceName: matchedSpaceById.bedSpaceName,
      fullDisplay: matchedSpaceById.displayName,
      address: getAccommodationAddress(matchedSpaceById.category, customAddresses)
    };
  }

  // 3. Category Detection
  let category = normalizeCategory(rawRoomObj?.apartment_name, rawRoomObj?.category, rawRoomObj?.room_number);
  const fullText = [
    ...candidates,
    rawRoomObj?.apartment_name || '',
    rawRoomObj?.category || '',
    booking?.preferred_accommodation || ''
  ].join(' ').toLowerCase();

  if (fullText.includes('premium 2') || fullText.includes('apartment 3') || fullText.includes('apt 3') || fullText.includes('p2_') || fullText.includes('p2-')) {
    category = 'Premium 2';
  } else if (fullText.includes('premium 1') || fullText.includes('apartment 1') || fullText.includes('apt 1') || fullText.includes('p1_') || fullText.includes('p1-')) {
    category = 'Premium 1';
  } else if (fullText.includes('standard') || fullText.includes('apartment 2') || fullText.includes('std')) {
    category = 'Standard';
  }

  // 4. Room Number & Bed Space Extraction
  let roomName = '';
  let bedSpaceName = '';

  for (const str of candidates) {
    if (!str) continue;

    // Check for room number pattern
    const roomMatch = str.match(/(?:Room|R)[-_ ]?(\d+)/i) || str.match(/(?:P1|P2|STD)-R(\d+)/i);
    if (roomMatch && !roomName) {
      roomName = `Room ${roomMatch[1] || roomMatch[2]}`;
    }

    // Check for Bed B first, then Bed A
    if (/(?:Bed\s*B|\bB\b|BedB|_b\b)/i.test(str)) {
      if (!bedSpaceName) bedSpaceName = 'Bed B';
    } else if (/(?:Bed\s*A|\bA\b|BedA|_a\b)/i.test(str)) {
      if (!bedSpaceName) bedSpaceName = 'Bed A';
    } else if (/Single|Private/i.test(str)) {
      if (!bedSpaceName) bedSpaceName = 'Single';
    }
  }

  // Fallback to roomObj room_number if candidate didn't have room number
  if (!roomName && rawRoomObj?.room_number) {
    const rDigit = extractRoomNumber(rawRoomObj.room_number);
    roomName = `Room ${rDigit}`;
  }

  if (!roomName) {
    roomName = 'Room 1';
  }

  // Determine if this room is private in this accommodation
  const isPrivate = rawRoomObj?.type 
    ? rawRoomObj.type.toLowerCase().includes('private')
    : (/private/i.test(fullText) || 
      (category.startsWith('Premium') && (roomName === 'Room 2' || roomName === 'Room 3')) ||
      (category === 'Standard' && roomName === 'Room 3'));

  if (isPrivate) {
    bedSpaceName = 'Single';
  } else if (!bedSpaceName) {
    bedSpaceName = 'Bed A';
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

