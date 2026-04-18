
-- Migration to fix 'parent_booking_id' in bookings and other potential schema issues
-- Run this in your Supabase SQL Editor.

-- 1. Ensure 'parent_booking_id' exists in 'bookings' table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS parent_booking_id BIGINT REFERENCES bookings(id);

-- 2. Ensure other columns from Step 13 are present just in case
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS apartment_name VARCHAR(50);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT '{}';

-- 3. Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
