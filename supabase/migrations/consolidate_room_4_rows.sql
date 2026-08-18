-- Migration: Consolidate Standard Room 4 (Rows 10 and 11)
-- Verified: SELECT * FROM bookings WHERE room_id = 11 returns 0 rows.

BEGIN;

-- 1. Update Room 10 to be the canonical Standard Room 4
UPDATE rooms
SET 
  room_number = 'Room 4',
  type = 'Standard Shared',
  price_per_month = 175,
  capacity = 2,
  occupied_slots = 0,
  is_available = true
WHERE id = 10;

-- 2. Update existing bed space #14 (belonging to Room 10) to 'Bed A'
UPDATE bed_spaces
SET label = 'Bed A'
WHERE id = 14 AND room_id = 10;

-- 3. Insert 'Bed B' for Room 10 if not already present
INSERT INTO bed_spaces (room_id, label)
VALUES (10, 'Bed B')
ON CONFLICT (room_id, label) DO NOTHING;

-- 4. Delete the duplicate/placeholder Room 11 (zero referencing bookings verified)
DELETE FROM rooms
WHERE id = 11;

COMMIT;
