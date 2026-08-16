export const ACCOMMODATION_ADDRESSES: Record<string, string> = {
  'Premium 2': '2 Ezzat Salamat Street, Off Kaabool, Makram Ebeid, Nasr City, Cairo.',
  'Standard': '24 Saqaliyyah Street, Off Kaabool, Makram Ebeid, Nasr City, Cairo.',
  'Premium 1': '2 Ezzat Salamat Street, Off Kaabool, Makram Ebeid, Nasr City, Cairo.',
};

export const getAccommodationAddress = (category?: string): string => {
  if (!category) return ACCOMMODATION_ADDRESSES['Standard'];
  const cat = category.trim();
  if (cat.toLowerCase().includes('premium 2') || cat === 'Apartment 3') {
    return ACCOMMODATION_ADDRESSES['Premium 2'];
  }
  if (cat.toLowerCase().includes('standard') || cat === 'Apartment 2') {
    return ACCOMMODATION_ADDRESSES['Standard'];
  }
  if (cat.toLowerCase().includes('premium 1') || cat === 'Apartment 1') {
    return ACCOMMODATION_ADDRESSES['Premium 1'];
  }
  return ACCOMMODATION_ADDRESSES['Standard'];
};

export interface RoomSpaceConfig {
  id: string;
  category: 'Standard' | 'Premium 1' | 'Premium 2';
  roomName: string;
  bedSpaceName: string;
  type: 'Shared' | 'Private';
  displayName: string; // e.g. "Premium 1 – Room 1 (Shared Room) – Bed A"
  apartmentName: string; // e.g. "Premium 1", "Premium 2", "Standard"
}

export const ALL_ROOM_SPACES: RoomSpaceConfig[] = [
  // Premium 1 (4 beds total: 2 in Room 1, 1 in Room 2, 1 in Room 3)
  { id: 'p1_r1_a', category: 'Premium 1', roomName: 'Room 1', bedSpaceName: 'Bed A', type: 'Shared', displayName: 'Premium 1 – Room 1 (Shared Room) – Bed A', apartmentName: 'Premium 1' },
  { id: 'p1_r1_b', category: 'Premium 1', roomName: 'Room 1', bedSpaceName: 'Bed B', type: 'Shared', displayName: 'Premium 1 – Room 1 (Shared Room) – Bed B', apartmentName: 'Premium 1' },
  { id: 'p1_r2', category: 'Premium 1', roomName: 'Room 2', bedSpaceName: 'Single', type: 'Private', displayName: 'Premium 1 – Room 2 (Private Room)', apartmentName: 'Premium 1' },
  { id: 'p1_r3', category: 'Premium 1', roomName: 'Room 3', bedSpaceName: 'Single', type: 'Private', displayName: 'Premium 1 – Room 3 (Private Room)', apartmentName: 'Premium 1' },

  // Premium 2 (4 beds total: 2 in Room 1, 1 in Room 2, 1 in Room 3)
  { id: 'p2_r1_a', category: 'Premium 2', roomName: 'Room 1', bedSpaceName: 'Bed A', type: 'Shared', displayName: 'Premium 2 – Room 1 (Shared Room) – Bed A', apartmentName: 'Premium 2' },
  { id: 'p2_r1_b', category: 'Premium 2', roomName: 'Room 1', bedSpaceName: 'Bed B', type: 'Shared', displayName: 'Premium 2 – Room 1 (Shared Room) – Bed B', apartmentName: 'Premium 2' },
  { id: 'p2_r2', category: 'Premium 2', roomName: 'Room 2', bedSpaceName: 'Single', type: 'Private', displayName: 'Premium 2 – Room 2 (Private Room)', apartmentName: 'Premium 2' },
  { id: 'p2_r3', category: 'Premium 2', roomName: 'Room 3', bedSpaceName: 'Single', type: 'Private', displayName: 'Premium 2 – Room 3 (Private Room)', apartmentName: 'Premium 2' },

  // Standard (6 beds total: 2 in Room 1, 2 in Room 2, 1 in Room 3, 1 in Room 4)
  { id: 'std_r1_a', category: 'Standard', roomName: 'Room 1', bedSpaceName: 'Bed A', type: 'Shared', displayName: 'Standard – Room 1 (Shared Room) – Bed A', apartmentName: 'Standard' },
  { id: 'std_r1_b', category: 'Standard', roomName: 'Room 1', bedSpaceName: 'Bed B', type: 'Shared', displayName: 'Standard – Room 1 (Shared Room) – Bed B', apartmentName: 'Standard' },
  { id: 'std_r2_a', category: 'Standard', roomName: 'Room 2', bedSpaceName: 'Bed A', type: 'Shared', displayName: 'Standard – Room 2 (Shared Room) – Bed A', apartmentName: 'Standard' },
  { id: 'std_r2_b', category: 'Standard', roomName: 'Room 2', bedSpaceName: 'Bed B', type: 'Shared', displayName: 'Standard – Room 2 (Shared Room) – Bed B', apartmentName: 'Standard' },
  { id: 'std_r3', category: 'Standard', roomName: 'Room 3', bedSpaceName: 'Single', type: 'Private', displayName: 'Standard – Room 3 (Private Room)', apartmentName: 'Standard' },
  { id: 'std_r4', category: 'Standard', roomName: 'Room 4', bedSpaceName: 'Single', type: 'Private', displayName: 'Standard – Room 4 (Private Room)', apartmentName: 'Standard' }
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
  14: 'std_r4'
};

export const getUnifiedRoomName = (category: string, roomName: string, bedSpaceName?: string): string => {
  if (!category) return roomName;
  
  // Clean inputs
  const cat = category.replace('Apartment', '').trim(); // e.g. "Premium 1"
  let rNum = roomName.trim();
  if (rNum && !rNum.toLowerCase().startsWith('room')) {
    rNum = `Room ${rNum}`;
  }
  
  const isPrivate = bedSpaceName && (
    bedSpaceName.toLowerCase().includes('single') || 
    bedSpaceName.toLowerCase().includes('private') || 
    bedSpaceName.toLowerCase() === 'n/a'
  );
  
  const typeStr = isPrivate ? 'Private Room' : 'Shared Room';
  
  if (isPrivate) {
    return `${cat} – ${rNum} (${typeStr})`;
  } else {
    const bed = bedSpaceName && bedSpaceName.trim() && 
                bedSpaceName.toLowerCase() !== 'n/a' && 
                bedSpaceName.toLowerCase() !== 'single'
      ? bedSpaceName.trim() 
      : 'Bed A';
    return `${cat} – ${rNum} (${typeStr}) – ${bed}`;
  }
};

// Converts a database Room record into the standardized display format
export const getDisplayFromRoom = (room: any): string => {
  if (!room) return '';
  const apartment = room.apartment_name || ''; // e.g. "Premium 1"
  const roomNum = room.room_number || ''; // e.g. "Room 1 A" or "101"
  
  if (roomNum.includes('–')) {
    return roomNum;
  }
  
  let category = apartment;
  if (category.startsWith('Apartment ')) {
    category = category.replace('Apartment ', '').trim();
  }
  
  let roomName = 'Room 1';
  let bedSpaceName = '';
  
  const numClean = roomNum.replace('Room', '').trim(); // e.g. "1 A" or "1"
  if (numClean.includes('A') || numClean.includes('a')) {
    const r = numClean.replace(/[Aa]/g, '').replace(/[-_ ]/g, '').trim();
    roomName = `Room ${r}`;
    bedSpaceName = 'Bed A';
  } else if (numClean.includes('B') || numClean.includes('b')) {
    const r = numClean.replace(/[Bb]/g, '').replace(/[-_ ]/g, '').trim();
    roomName = `Room ${r}`;
    bedSpaceName = 'Bed B';
  } else {
    roomName = `Room ${numClean || '1'}`;
    bedSpaceName = 'Single';
  }
  
  const isPrivate = room.type?.toLowerCase().includes('private');
  return getUnifiedRoomName(category, roomName, isPrivate ? 'Single' : bedSpaceName);
};

// Help extract components if a stored room string needs to be formatted or parsed
export const formatStoredRoomString = (storedStr: string): string => {
  if (!storedStr) return '';
  
  // Already unified? e.g., contains '–'
  if (storedStr.includes('–')) {
    return storedStr;
  }
  
  // Format is likely: "Premium 1 - Room 1 (Bed A)" or similar
  const parts = storedStr.split('-');
  if (parts.length >= 2) {
    const category = parts[0].trim();
    const remaining = parts.slice(1).join('-').trim();
    
    // Parse room number & bed space, e.g. "Room 1 (Bed A)"
    const match = remaining.match(/(Room\s+\d+|Room\d+)\s*\(([^)]+)\)/i);
    if (match) {
      const roomName = match[1].trim();
      const bedSpaceName = match[2].trim();
      return getUnifiedRoomName(category, roomName, bedSpaceName);
    }
  }
  
  return storedStr;
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

export const getParsedRoomSpaces = (rooms: any[], bookings: any[], bedSpaces?: any[]): ParsedRoomSpace[] => {
  const isCancelledOrCompleted = (status?: string) => {
    if (!status) return false;
    const s = String(status).toUpperCase();
    return s === 'CANCELLED' || s === 'COMPLETED' || s === 'REJECTED' || s === 'DISCONTINUED';
  };

  // Active bookings include Pending Verification, Pending Payment, Pending Contract, Confirmed, Occupied
  const activeBookings = (bookings || []).filter(b => !isCancelledOrCompleted(b.status));

  // Map to hold space assignments: space.id -> booking
  const spaceBookingMap = new Map<string, any>();
  const unassignedBookings: { booking: any; details: LiveRoomDetails }[] = [];

  // Pass 0: Direct bed_space_id matching if bed_space_id exists on booking
  for (const b of activeBookings) {
    if (b.bed_space_id != null) {
      // Find space by bed_space_id
      const matchedSpace = ALL_ROOM_SPACES.find(space => {
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
    
    const exactMatch = ALL_ROOM_SPACES.find(space => {
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
    const availableSpace = ALL_ROOM_SPACES.find(space => {
      if (spaceBookingMap.has(space.id)) return false;
      const matchCat = space.category.toLowerCase().replace(/\s+/g, '') === details.category.toLowerCase().replace(/\s+/g, '');
      const isPrivateBooking = String(details.fullDisplay || booking.preferred_accommodation || '').toLowerCase().includes('private');
      const matchType = (space.type === 'Private') === isPrivateBooking;
      return matchCat && matchType;
    }) || ALL_ROOM_SPACES.find(space => {
      if (spaceBookingMap.has(space.id)) return false;
      return space.category.toLowerCase().replace(/\s+/g, '') === details.category.toLowerCase().replace(/\s+/g, '');
    });

    if (availableSpace) {
      spaceBookingMap.set(availableSpace.id, booking);
    }
  }

  return ALL_ROOM_SPACES.map(space => {
    const dbRoom = findDatabaseRoomForSpace(rooms || [], space);
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

export const getLiveStudentRoomDetails = (booking: any, roomsList: any[] = []): LiveRoomDetails => {
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
          address: getAccommodationAddress(spaceObj.category)
        };
      }
    }
  }

  // 1. Gather all potential specific space descriptors from the booking object
  const candidates: string[] = [
    typeof booking?.rooms?.room_number === 'string' ? booking.rooms.room_number : '',
    typeof booking?.room_number === 'string' ? booking.room_number : '',
    typeof booking?.preferred_accommodation === 'string' ? booking.preferred_accommodation : '',
    typeof booking?.assigned_space === 'string' ? booking.assigned_space : '',
    typeof booking?.assigned_space_id === 'string' ? booking.assigned_space_id : '',
  ].filter(Boolean);

  const dbRoom = roomsList.find(r => r.id === booking?.room_id);
  const rawRoomObj = dbRoom || booking?.rooms;

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
      address: getAccommodationAddress(matchedSpaceById.category)
    };
  }

  // 3. Category Detection
  let category = 'Standard';
  const fullText = [
    ...candidates,
    rawRoomObj?.apartment_name || '',
    rawRoomObj?.category || '',
    booking?.preferred_accommodation || ''
  ].join(' ').toLowerCase();

  if (fullText.includes('premium 2') || fullText.includes('apartment 3') || fullText.includes('apt 3') || fullText.includes('p2_') || fullText.includes('p2-')) {
    category = 'Premium 2';
  } else if (fullText.includes('premium 1') || fullText.includes('apartment 1') || fullText.includes('apt 1') || fullText.includes('p1_') || fullText.includes('p1-') || fullText.includes('premium')) {
    category = 'Premium 1';
  } else {
    category = 'Standard';
  }

  // 4. Room Number & Bed Space Extraction
  let roomName = '';
  let bedSpaceName = '';

  for (const str of candidates) {
    if (!str) continue;

    // Check for "Room X" pattern
    const roomMatch = str.match(/Room\s*(\d+)/i);
    if (roomMatch && !roomName) {
      roomName = `Room ${roomMatch[1]}`;
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
    const rMatch = String(rawRoomObj.room_number).match(/Room\s*(\d+)/i);
    if (rMatch) {
      roomName = `Room ${rMatch[1]}`;
    }
  }

  if (!roomName) {
    roomName = 'Room 1';
  }

  // Determine if this room is private in this accommodation
  const isPrivate = /private/i.test(fullText) || 
    (category.startsWith('Premium') && (roomName === 'Room 2' || roomName === 'Room 3')) ||
    (category === 'Standard' && (roomName === 'Room 3' || roomName === 'Room 4'));

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
    address: getAccommodationAddress(category)
  };
};

