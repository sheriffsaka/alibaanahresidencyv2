-- Migration: Recalculate Occupied Slots and Availability for all Rooms
-- Derived strictly from active Confirmed and Occupied bookings and physical bed spaces.

BEGIN;

-- 1. Room 1 (STD-R3 - Standard Private, Cap: 1)
UPDATE rooms
SET occupied_slots = 1, is_available = false
WHERE id = 1;

-- 2. Room 2 (P1-R1 - Premium 1 Shared, Cap: 2)
UPDATE rooms
SET occupied_slots = 2, is_available = false
WHERE id = 2;

-- 3. Room 3 (STD-R1 - Standard Shared, Cap: 2)
UPDATE rooms
SET occupied_slots = 2, is_available = false
WHERE id = 3;

-- 4. Room 4 (P1-R3 - Premium 1 Private, Cap: 1)
UPDATE rooms
SET occupied_slots = 1, is_available = false
WHERE id = 4;

-- 5. Room 5 (P2-R1 - Premium 2 Shared, Cap: 2 - Bed A occupied by Abdus-Salam, Bed B available)
UPDATE rooms
SET occupied_slots = 1, is_available = true
WHERE id = 5;

-- 6. Room 6 (P2-R3 - Premium 2 Private, Cap: 1)
UPDATE rooms
SET occupied_slots = 1, is_available = false
WHERE id = 6;

-- 7. Room 7 (P1-R2 - Premium 1 Private, Cap: 1 - Emanuel Bîrjan)
UPDATE rooms
SET occupied_slots = 1, is_available = false
WHERE id = 7;

-- 8. Room 8 (P2-R2 - Premium 2 Room 2, Cap: 2 / Vacant)
UPDATE rooms
SET occupied_slots = 0, is_available = true
WHERE id = 8;

-- 9. Room 9 (STD-R2 - Standard Shared, Cap: 2 - Furkan Aktas & SYLLA SENOU)
UPDATE rooms
SET occupied_slots = 2, is_available = false
WHERE id = 9;

-- 10. Room 10 (Standard Room 4 - Standard Shared, Cap: 2 - 1 Bed occupied, 1 Bed available)
UPDATE rooms
SET occupied_slots = 1, is_available = true
WHERE id = 10;

COMMIT;
