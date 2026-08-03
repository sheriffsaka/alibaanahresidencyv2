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
  // Premium 1
  { id: 'p1_r1_a', category: 'Premium 1', roomName: 'Room 1', bedSpaceName: 'Bed A', type: 'Shared', displayName: 'Premium 1 – Room 1 (Shared Room) – Bed A', apartmentName: 'Premium 1' },
  { id: 'p1_r1_b', category: 'Premium 1', roomName: 'Room 1', bedSpaceName: 'Bed B', type: 'Shared', displayName: 'Premium 1 – Room 1 (Shared Room) – Bed B', apartmentName: 'Premium 1' },
  { id: 'p1_r2', category: 'Premium 1', roomName: 'Room 2', bedSpaceName: 'Single', type: 'Private', displayName: 'Premium 1 – Room 2 (Private Room)', apartmentName: 'Premium 1' },
  { id: 'p1_r3', category: 'Premium 1', roomName: 'Room 3', bedSpaceName: 'Single', type: 'Private', displayName: 'Premium 1 – Room 3 (Private Room)', apartmentName: 'Premium 1' },

  // Premium 2
  { id: 'p2_r1_a', category: 'Premium 2', roomName: 'Room 1', bedSpaceName: 'Bed A', type: 'Shared', displayName: 'Premium 2 – Room 1 (Shared Room) – Bed A', apartmentName: 'Premium 2' },
  { id: 'p2_r1_b', category: 'Premium 2', roomName: 'Room 1', bedSpaceName: 'Bed B', type: 'Shared', displayName: 'Premium 2 – Room 1 (Shared Room) – Bed B', apartmentName: 'Premium 2' },
  { id: 'p2_r2', category: 'Premium 2', roomName: 'Room 2', bedSpaceName: 'Single', type: 'Private', displayName: 'Premium 2 – Room 2 (Private Room)', apartmentName: 'Premium 2' },
  { id: 'p2_r3', category: 'Premium 2', roomName: 'Room 3', bedSpaceName: 'Single', type: 'Private', displayName: 'Premium 2 – Room 3 (Private Room)', apartmentName: 'Premium 2' },

  // Standard
  { id: 'std_r1_a', category: 'Standard', roomName: 'Room 1', bedSpaceName: 'Bed A', type: 'Shared', displayName: 'Standard – Room 1 (Shared Room) – Bed A', apartmentName: 'Standard' },
  { id: 'std_r1_b', category: 'Standard', roomName: 'Room 1', bedSpaceName: 'Bed B', type: 'Shared', displayName: 'Standard – Room 1 (Shared Room) – Bed B', apartmentName: 'Standard' },
  { id: 'std_r2_a', category: 'Standard', roomName: 'Room 2', bedSpaceName: 'Bed A', type: 'Shared', displayName: 'Standard – Room 2 (Shared Room) – Bed A', apartmentName: 'Standard' },
  { id: 'std_r2_b', category: 'Standard', roomName: 'Room 2', bedSpaceName: 'Bed B', type: 'Shared', displayName: 'Standard – Room 2 (Shared Room) – Bed B', apartmentName: 'Standard' },
  { id: 'std_r3', category: 'Standard', roomName: 'Room 3', bedSpaceName: 'Single', type: 'Private', displayName: 'Standard – Room 3 (Private Room)', apartmentName: 'Standard' },
  { id: 'std_r4_a', category: 'Standard', roomName: 'Room 4', bedSpaceName: 'Bed A', type: 'Shared', displayName: 'Standard – Room 4 (Shared Room) – Bed A', apartmentName: 'Standard' },
  { id: 'std_r4_b', category: 'Standard', roomName: 'Room 4', bedSpaceName: 'Bed B', type: 'Shared', displayName: 'Standard – Room 4 (Shared Room) – Bed B', apartmentName: 'Standard' }
];

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

export const findDatabaseRoomForSpace = (rooms: any[], space: { category: string; type: 'Shared' | 'Private' }) => {
  const isPrivate = space.type === 'Private';
  const catSimple = space.category.startsWith('Premium') ? 'Premium' : 'Standard';
  const reqType = isPrivate ? `${catSimple} Private` : `${catSimple} Shared`;
  
  let aptName = '';
  if (space.category === 'Premium 1') {
    aptName = 'Apartment 1';
  } else if (space.category === 'Premium 2') {
    aptName = 'Apartment 3';
  } else if (space.category === 'Standard') {
    aptName = 'Apartment 2';
  }
  
  const match = rooms.find(r => 
    r.apartment_name === aptName && 
    r.type === reqType
  );
  if (match) return match;
  
  return rooms.find(r => 
    r.category?.toLowerCase() === catSimple.toLowerCase() && 
    r.type === reqType
  ) || null;
};

export interface ParsedRoomSpace extends RoomSpaceConfig {
  isOccupied: boolean;
  booking?: any;
  dbRoom?: any;
  supabaseRoom?: any;
  nextAvailableDate: string;
}

export const getParsedRoomSpaces = (rooms: any[], bookings: any[]): ParsedRoomSpace[] => {
  const activeBookings = (bookings || []).filter(b => b.status !== 'CANCELLED' && b.status !== 'COMPLETED');
  
  const bookingsByRoom: Record<number, any[]> = {};
  activeBookings.forEach(b => {
    if (!bookingsByRoom[b.room_id]) {
      bookingsByRoom[b.room_id] = [];
    }
    bookingsByRoom[b.room_id].push(b);
  });
  
  Object.keys(bookingsByRoom).forEach(roomId => {
    bookingsByRoom[Number(roomId)].sort((a, b) => a.id - b.id);
  });

  const assignedCounts: Record<number, number> = {};

  return ALL_ROOM_SPACES.map(space => {
    const dbRoom = findDatabaseRoomForSpace(rooms || [], space);
    if (!dbRoom) {
      return {
        ...space,
        isOccupied: false,
        booking: undefined,
        dbRoom: null,
        supabaseRoom: null,
        nextAvailableDate: 'Available Now'
      };
    }

    const roomBookings = bookingsByRoom[dbRoom.id] || [];
    const currentIndex = assignedCounts[dbRoom.id] || 0;

    let assignedBooking: any | undefined = undefined;
    let isOccupied = false;

    if (currentIndex < roomBookings.length) {
      assignedBooking = roomBookings[currentIndex];
      isOccupied = true;
      assignedCounts[dbRoom.id] = currentIndex + 1;
    }

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
  const roomObj = roomsList.find(r => r.id === booking?.room_id) || booking?.rooms;
  
  if (!roomObj) {
    let fallbackCat = booking?.preferred_accommodation || 'Standard';
    if (fallbackCat.includes('–')) {
      fallbackCat = fallbackCat.split('–')[0].trim();
    }
    if (fallbackCat.startsWith('Apartment 1')) fallbackCat = 'Premium 1';
    else if (fallbackCat.startsWith('Apartment 3')) fallbackCat = 'Premium 2';
    else if (fallbackCat.startsWith('Apartment 2')) fallbackCat = 'Standard';
    
    return {
      category: fallbackCat,
      roomName: 'Room 1',
      bedSpaceName: 'Bed A',
      fullDisplay: booking?.preferred_accommodation || `${fallbackCat} – Room 1 – Bed A`,
      address: getAccommodationAddress(fallbackCat)
    };
  }

  // Category
  let category = roomObj.apartment_name || roomObj.category || booking?.preferred_accommodation || 'Standard';
  if (category.startsWith('Apartment 1')) category = 'Premium 1';
  else if (category.startsWith('Apartment 3')) category = 'Premium 2';
  else if (category.startsWith('Apartment 2')) category = 'Standard';
  else if (category === 'Premium') category = 'Premium 1';

  const fullDisplay = getDisplayFromRoom(roomObj);
  const address = getAccommodationAddress(category);

  // Extract Room Name and Bed Space from fullDisplay or room_number
  let roomName = 'Room 1';
  let bedSpaceName = 'Single';

  if (fullDisplay.includes('–')) {
    const parts = fullDisplay.split('–').map(s => s.trim());
    if (parts.length >= 2) {
      roomName = parts[1].replace(/\([^)]*\)/g, '').trim();
    }
    if (parts.length >= 3) {
      bedSpaceName = parts[2].trim();
    }
  } else {
    const numClean = (roomObj.room_number || '').replace('Room', '').trim();
    const isPrivate = roomObj.type?.toLowerCase().includes('private');
    if (isPrivate) {
      roomName = `Room ${numClean || '1'}`;
      bedSpaceName = 'Single';
    } else if (numClean.toLowerCase().includes('b')) {
      roomName = `Room ${numClean.replace(/[Bb]/g, '').trim() || '1'}`;
      bedSpaceName = 'Bed B';
    } else {
      roomName = `Room ${numClean.replace(/[Aa]/g, '').trim() || '1'}`;
      bedSpaceName = 'Bed A';
    }
  }

  return {
    category,
    roomName,
    bedSpaceName,
    fullDisplay,
    address
  };
};

