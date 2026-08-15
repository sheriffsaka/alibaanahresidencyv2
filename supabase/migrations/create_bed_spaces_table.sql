-- Phase 1 Migration: Create bed_spaces table and link to bookings
-- Description: Additive only. Creates bed_spaces table and adds nullable bed_space_id FK to bookings.

-- 1. Create bed_spaces table
-- Note on room deletion: Using ON DELETE RESTRICT prevents accidental deletion of a room
-- that has active bed spaces or associated historical bookings.
CREATE TABLE IF NOT EXISTS bed_spaces (
    id SERIAL PRIMARY KEY,
    room_id INT NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    label VARCHAR(50) NOT NULL, -- e.g. 'Bed A', 'Bed B', 'Single'
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_room_bed_label UNIQUE(room_id, label)
);

-- 2. Add nullable bed_space_id column to bookings table
-- Note on bed space deletion: Using ON DELETE RESTRICT prevents deleting a bed space if historical bookings are assigned to it.
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS bed_space_id INT REFERENCES bed_spaces(id) ON DELETE RESTRICT;

-- 3. Row-Level Security (RLS) setup
ALTER TABLE bed_spaces ENABLE ROW LEVEL SECURITY;

-- Allow all users to read bed spaces (required for real-time room cards and booking flow)
DROP POLICY IF EXISTS "Allow all users to read bed_spaces" ON bed_spaces;
CREATE POLICY "Allow all users to read bed_spaces"
ON bed_spaces FOR SELECT
USING (true);

-- Allow staff and proprietors to manage bed spaces for their property (self-contained direct query on profiles)
DROP POLICY IF EXISTS "Allow staff/proprietors to manage bed_spaces" ON bed_spaces;
CREATE POLICY "Allow staff/proprietors to manage bed_spaces"
ON bed_spaces FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN rooms r ON r.id = bed_spaces.room_id
    WHERE p.id = auth.uid()
    AND p.role::text IN ('staff', 'proprietor', 'admin')
    AND (p.property_id IS NULL OR r.property_id = p.property_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN rooms r ON r.id = bed_spaces.room_id
    WHERE p.id = auth.uid()
    AND p.role::text IN ('staff', 'proprietor', 'admin')
    AND (p.property_id IS NULL OR r.property_id = p.property_id)
  )
);

-- 4. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
