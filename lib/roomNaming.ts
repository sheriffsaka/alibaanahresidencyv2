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
