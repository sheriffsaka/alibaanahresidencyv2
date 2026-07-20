export interface RoomSpaceConfig {
  id: string;
  category: 'Standard' | 'Premium 1' | 'Premium 2';
  roomName: string;
  bedSpaceName: string;
  type: 'Shared' | 'Private';
  displayName: string; // e.g. "Room 1 – Shared Room (Bed A)"
  apartmentName: string; // e.g. "Premium 1", "Premium 2", "Standard"
}

export const ALL_ROOM_SPACES: RoomSpaceConfig[] = [
  // Premium 1
  { id: 'p1_r1_a', category: 'Premium 1', roomName: 'Room 1', bedSpaceName: 'Bed A', type: 'Shared', displayName: 'Room 1 – Shared Room (Bed A)', apartmentName: 'Premium 1' },
  { id: 'p1_r1_b', category: 'Premium 1', roomName: 'Room 1', bedSpaceName: 'Bed B', type: 'Shared', displayName: 'Room 1 – Shared Room (Bed B)', apartmentName: 'Premium 1' },
  { id: 'p1_r2', category: 'Premium 1', roomName: 'Room 2', bedSpaceName: 'Single', type: 'Private', displayName: 'Room 2 – Private Room (Single Room)', apartmentName: 'Premium 1' },
  { id: 'p1_r3', category: 'Premium 1', roomName: 'Room 3', bedSpaceName: 'Single', type: 'Private', displayName: 'Room 3 – Private Room (Single Room)', apartmentName: 'Premium 1' },

  // Premium 2
  { id: 'p2_r1_a', category: 'Premium 2', roomName: 'Room 1', bedSpaceName: 'Bed A', type: 'Shared', displayName: 'Room 1 – Shared Room (Bed A)', apartmentName: 'Premium 2' },
  { id: 'p2_r1_b', category: 'Premium 2', roomName: 'Room 1', bedSpaceName: 'Bed B', type: 'Shared', displayName: 'Room 1 – Shared Room (Bed B)', apartmentName: 'Premium 2' },
  { id: 'p2_r2', category: 'Premium 2', roomName: 'Room 2', bedSpaceName: 'Single', type: 'Private', displayName: 'Room 2 – Private Room (Single Room)', apartmentName: 'Premium 2' },
  { id: 'p2_r3', category: 'Premium 2', roomName: 'Room 3', bedSpaceName: 'Single', type: 'Private', displayName: 'Room 3 – Private Room (Single Room)', apartmentName: 'Premium 2' },

  // Standard
  { id: 'std_r1_a', category: 'Standard', roomName: 'Room 1', bedSpaceName: 'Bed A', type: 'Shared', displayName: 'Room 1 – Shared Room (Bed A)', apartmentName: 'Standard' },
  { id: 'std_r1_b', category: 'Standard', roomName: 'Room 1', bedSpaceName: 'Bed B', type: 'Shared', displayName: 'Room 1 – Shared Room (Bed B)', apartmentName: 'Standard' },
  { id: 'std_r2_a', category: 'Standard', roomName: 'Room 2', bedSpaceName: 'Bed A', type: 'Shared', displayName: 'Room 2 – Shared Room (Bed A)', apartmentName: 'Standard' },
  { id: 'std_r2_b', category: 'Standard', roomName: 'Room 2', bedSpaceName: 'Bed B', type: 'Shared', displayName: 'Room 2 – Shared Room (Bed B)', apartmentName: 'Standard' },
  { id: 'std_r3', category: 'Standard', roomName: 'Room 3', bedSpaceName: 'Single', type: 'Private', displayName: 'Room 3 – Private Room (Single Room)', apartmentName: 'Standard' },
  { id: 'std_r4_a', category: 'Standard', roomName: 'Room 4', bedSpaceName: 'Bed A', type: 'Shared', displayName: 'Room 4 – Shared Room (Bed A)', apartmentName: 'Standard' },
  { id: 'std_r4_b', category: 'Standard', roomName: 'Room 4', bedSpaceName: 'Bed B', type: 'Shared', displayName: 'Room 4 – Shared Room (Bed B)', apartmentName: 'Standard' }
];

export const getUnifiedRoomName = (category: string, roomName: string, bedSpaceName?: string): string => {
  if (!category) return roomName;
  
  // Clean inputs
  const cat = category.replace('Apartment', '').trim(); // e.g. "Premium 1"
  const roomClean = roomName.replace('Room', '').trim(); // e.g. "1"
  const spaceClean = bedSpaceName ? bedSpaceName.trim() : '';

  // Look up in ALL_ROOM_SPACES
  const match = ALL_ROOM_SPACES.find(item => {
    const itemCatClean = item.category.toLowerCase();
    const itemRoomClean = item.roomName.replace('Room', '').trim().toLowerCase();
    
    if (item.type === 'Private') {
      return itemCatClean === cat.toLowerCase() && itemRoomClean === roomClean.toLowerCase();
    }
    
    const itemSpaceClean = item.bedSpaceName.toLowerCase();
    return itemCatClean === cat.toLowerCase() && 
           itemRoomClean === roomClean.toLowerCase() && 
           (spaceClean === '' || 
            itemSpaceClean === spaceClean.toLowerCase() || 
            spaceClean.toLowerCase().includes(itemSpaceClean) ||
            itemSpaceClean.includes(spaceClean.toLowerCase()));
  });

  if (match) {
    return match.displayName;
  }

  // Fallback dynamic string builder if not found
  if (spaceClean === 'Single' || spaceClean.toLowerCase().includes('single') || spaceClean.toLowerCase().includes('private')) {
    return `Room ${roomClean} – Private Room (Single Room)`;
  }
  return `Room ${roomClean} – Shared Room (${spaceClean || 'Bed A'})`;
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
      return `${category} – ${getUnifiedRoomName(category, roomName, bedSpaceName)}`;
    }
  }
  
  return storedStr;
};
